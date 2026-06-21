"""
config.py  —  Central configuration for the Unified Data Spine RAG system.
Set ANTHROPIC_API_KEY via environment variable or directly here.
"""

import os
from dotenv import load_dotenv

# Load root .env file
root_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(root_env_path)

# ── LLM Configuration (Groq / OpenAI compatible) ───────────────────────────
GROQ_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
GROQ_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL: str = os.getenv("OPENAI_MODEL", "llama-3.3-70b-versatile")
LLM_MAX_TOKENS: int = 1024

# ── Gemini / Google GenAI (Fallback) ──────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
LLM_MODEL_GEMINI: str = "gemini-1.5-flash"

# ── Embedding model (runs locally via sentence-transformers) ───────────────
EMBED_MODEL: str = "all-MiniLM-L6-v2"

# ── ChromaDB ───────────────────────────────────────────────────────────────
CHROMA_DIR: str = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_EMOTIONS: str = "emotions_vocabulary"
COLLECTION_TASK: str = "task_documents"

# ── Source files (place in data/ folder) ──────────────────────────────────
DATA_DIR: str = os.path.join(os.path.dirname(__file__), "data")
XLSX_FILE: str = os.path.join(DATA_DIR, "Emotions_vocabulary_final.xlsx")
DOCX_FILE: str = os.path.join(DATA_DIR, "Task_1-_Neha.docx")

# ── Retrieval ──────────────────────────────────────────────────────────────
TOP_K: int = 5          # number of chunks to retrieve per query

# ── RULER framework dimensions ─────────────────────────────────────────────
RULER_DIMENSIONS = {
    "Recognize":  "Identify and notice an emotion in oneself or others",
    "Understand": "Know the causes and consequences of an emotion",
    "Label":      "Accurately name the emotion with a precise vocabulary word",
    "Express":    "Communicate the emotion appropriately to the context",
    "Regulate":   "Manage and modulate the emotion effectively",
}
