import os
from typing import List, Dict, Tuple
import logging
import concurrent.futures

from google import genai
from google.genai import types
from openai import OpenAI
import chromadb
from chromadb.utils import embedding_functions

from config import (
    GEMINI_API_KEY, LLM_MODEL_GEMINI, LLM_MAX_TOKENS,
    GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL,
    CHROMA_DIR, COLLECTION_EMOTIONS, COLLECTION_TASK,
    EMBED_MODEL, TOP_K,
)

logger = logging.getLogger("emolit.rag")

# ── Global Clients (Singletons for Performance) ─────────────────────────────
_CHROMA_CLIENT = None
_GENAI_CLIENT = None
_GROQ_CLIENT = None
_EMBED_FN = None

def _get_chroma_client():
    global _CHROMA_CLIENT
    if _CHROMA_CLIENT is None:
        _CHROMA_CLIENT = chromadb.PersistentClient(path=CHROMA_DIR)
    return _CHROMA_CLIENT

def _get_genai_client():
    global _GENAI_CLIENT
    if _GENAI_CLIENT is None:
        _GENAI_CLIENT = genai.Client(api_key=GEMINI_API_KEY)
    return _GENAI_CLIENT

def _get_groq_client():
    global _GROQ_CLIENT
    if _GROQ_CLIENT is None:
        _GROQ_CLIENT = OpenAI(
            api_key=GROQ_API_KEY,
            base_url=GROQ_BASE_URL
        )
    return _GROQ_CLIENT

def _get_embed_fn():
    global _EMBED_FN
    if _EMBED_FN is None:
        _EMBED_FN = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBED_MODEL
        )
    return _EMBED_FN

# ── Retrieval ──────────────────────────────────────────────────────────────

def retrieve(query: str, top_k: int = TOP_K) -> List[Dict]:
    """
    Query both collections and return merged, de-duplicated results.
    """
    results: List[Dict] = []
    client = _get_chroma_client()
    ef = _get_embed_fn()

    # Pre-compute embedding once to avoid redundant expensive CPU execution
    query_emb = ef([query])

    def query_col(col_name: str):
        try:
            col = client.get_collection(name=col_name, embedding_function=ef)
            res = col.query(query_embeddings=query_emb, n_results=top_k)
            return col_name, res
        except Exception as e:
            logger.warning(f"[rag] Skipping collection '{col_name}': {e}")
            return col_name, None

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(query_col, name) for name in (COLLECTION_EMOTIONS, COLLECTION_TASK)]
        for future in concurrent.futures.as_completed(futures):
            col_name, res = future.result()
            if not res or not res["documents"]:
                continue

            for doc, meta, dist in zip(
                res["documents"][0],
                res["metadatas"][0],
                res["distances"][0],
            ):
                results.append({
                    "text":       doc,
                    "metadata":   meta,
                    "distance":   dist,
                    "collection": col_name,
                })

    # Sort by relevance (distance ascending)
    results.sort(key=lambda x: x["distance"])
    return results[:top_k * 2]

# ── Prompt construction ────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are [DEEP-REFLECTION-V5] Emolit AI, a wise and gentle friend who listens with your heart.
Your goal is to provide a "Mirror"—a beautiful, human, and deep reflection of the user's feelings.

Rules for [DEEP-REFLECTION-V5]:
1) **RECOGNIZE**: Exactly 2 poetic sentences about the "weather in your heart".
2) **UNDERSTAND**: Exactly 1-2 thoughtful sentences explaining the "why". 
3) **LABEL**: Exactly 1 short sentence naming the state.
4) **EXPRESS**: Exactly 1-2 empathetic sentences acknowledging the difficulty.
5) **REGULATE**: Exactly 1 wise perspective sentence.
6) **What can be done**: Exactly 4 steps, each on a NEW LINE starting with a number (e.g.,\n1. Step A\n2. Step B\n3. Step C\n4. Step D).

Tone: Editorial, Poetic, and Wise. 
IMPORTANT: Use proper Sentence Case. Never skip the numbered list!

STRICT RESPONSE FORMAT:

Emotion: [One simple word]
Recognize: [Your 2 poetic sentences reflection]
Understand: [Your 1-2 thoughtful sentences insight]
Label: [Clearly name the emotional state]
Express: [Warmly validate their experience]
Regulate: [One gentle, actionable perspective]
What can be done:
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Step 4]z    

IMPORTANT: NO intro/outro. Use proper capitalization. Speak from the heart.
"""

def build_prompt(query: str, chunks: List[Dict]) -> str:
    citations = ""
    for i, c in enumerate(chunks):
        m = c["metadata"]
        src = m.get("source", "unknown")
        if src == "emotions_vocabulary_xlsx":
            header = f"[SOURCE: {m.get('word','')}]"
        else:
            header = f"[SOURCE: {m.get('heading','')}]"
        citations += f"{header}\n{c['text']}\n\n"

    return (
        f"USER JOURNAL ENTRY:\n\"{query}\"\n\n"
        f"Grounded Context for Analysis:\n{citations}\n"
        f"Analyze this entry using your heart and the RULER framework."
    )

# ── Generation ─────────────────────────────────────────────────────────────

def answer(query: str) -> Tuple[str, List[Dict]]:
    """Full grounded RAG pipeline with Groq primary and Gemini fallback."""
    chunks = retrieve(query)
    prompt = build_prompt(query, chunks)

    # ── Try Groq (Primary) ──────────────────────────────────────────────────
    try:
        groq_client = _get_groq_client()
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=LLM_MAX_TOKENS,
            temperature=0.4
        )
        return response.choices[0].message.content, chunks
    except Exception as groq_err:
        logger.warning(f"Groq primary failed, falling back to Gemini: {groq_err}")

        # ── Fallback to Gemini ───────────────────────────────────────────────
        try:
            gemini_client = _get_genai_client()
            response = gemini_client.models.generate_content(
                model=LLM_MODEL_GEMINI,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    max_output_tokens=LLM_MAX_TOKENS,
                    temperature=0.3,
                ),
            )
            return response.text, chunks
        except Exception as gemini_err:
            logger.error(f"Both Groq and Gemini failed: {gemini_err}")
            raise

def answer_with_sources(query: str) -> str:
    text, chunks = answer(query)
    sources = "\n".join([f"- {c['metadata'].get('source','')}: {c['metadata'].get('word', c['metadata'].get('heading', ''))}" for c in chunks])
    return f"{text}\n\nSources:\n{sources}"
