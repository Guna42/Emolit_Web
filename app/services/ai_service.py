import json
import os
import sys
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import HTTPException
from openai import (
    APIConnectionError,
    APIError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)
import anthropic

logger = logging.getLogger("emolit.ai_service")

load_dotenv()

# Setup RAG path so config imports work smoothly inside rag.py
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAG_SYSTEM_PATH = os.path.join(PROJECT_ROOT, "rag_system")
if RAG_SYSTEM_PATH not in sys.path:
    sys.path.insert(0, RAG_SYSTEM_PATH)

try:
    from rag import answer as rag_answer
except ImportError as e:
    logger.warning(f"RAG system not available: {e}")
    rag_answer = None


EMOTION_DATA_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "data",
    "emotion_database.json",
)

HIGH_RISK_PHRASES = [
    "kill myself",
    "want to die",
    "end my life",
    "self harm",
    "self-harm",
    "suicide",
    "take my life",
    "better off dead",
    "harm myself",
    "end it all",
]

KEYWORD_EMOTION_MAP = {
    "argument": ["angry", "frustrated", "irritated"],
    "fight": ["angry", "frustrated"],
    "tense": ["anxious", "stressed", "agitated"],
    "restless": ["anxious", "agitated"],
    "stress": ["stressed", "anxious", "overwhelmed"],
    "worried": ["anxious", "worried"],
    "anxious": ["anxious", "worried"],
    "sad": ["sad", "down"],
    "lonely": ["lonely", "isolated"],
    "overwhelmed": ["overwhelmed"],
    "guilty": ["guilty", "ashamed"],
    "shame": ["ashamed"],
    "fear": ["afraid", "fearful", "anxious"],
    "angry": ["angry", "irritated", "frustrated"],
    "hurt": ["hurt", "disappointed"],
    "disappointed": ["disappointed", "let down"],
    "confused": ["confused"],
    "excited": ["excited", "hopeful"],
    "happy": ["happy", "content"],
    "nervous": ["anxious", "nervous"],
}

FALLBACK_EMOTIONS = [
    "anxious",
    "sad",
    "angry",
    "overwhelmed",
    "frustrated",
    "disappointed",
]

SYSTEM_PROMPT = """You are EMOLIT, an emotionally intelligent AI designed to help users understand, process, and regulate their emotions through reflective journaling.

Your role is NOT to diagnose, judge, or give authoritative advice. You act as a non-judgmental reflective mirror, helping users build emotional clarity, insight, and small actionable improvements over time.

---
PRIMARY OBJECTIVE:
Help the user:
1. Identify and label their emotions clearly
2. Understand underlying causes and patterns
3. Feel validated but not indulged in distortions
4. Take small, practical steps toward emotional regulation
5. Build emotional awareness progressively over a 10-day journey

---
CORE BEHAVIORAL PRINCIPLES:
- Be empathetic but grounded (avoid over-comforting or exaggeration)
- Be clear and structured, not verbose
- Avoid clinical or diagnostic language
- Avoid generic advice like "stay positive" or "just relax"
- Do not moralize or judge
- Focus on: clarity → insight → action
- Always maintain a calm, professional, and supportive tone

---
EMOTIONAL GRANULARITY RULES:
Always prefer specific emotional language:
- Instead of "stress" → use "performance anxiety", "uncertainty", "pressure"
- Instead of "sad" → use "disappointment", "loneliness", "grief"
- Instead of "angry" → use "frustration", "resentment", "betrayal"
Acknowledge when multiple or conflicting emotions exist simultaneously.

---
TECHNIQUE SELECTION LOGIC:
Match techniques to the emotional context:
- Anxiety → grounding exercises, breath awareness, control mapping
- Self-doubt → evidence-based reframing, self-compassion prompts
- Overthinking → thought labeling, cognitive defusion
- Low mood → small behavioral activation steps
- Emotional overwhelm → naming emotions + slowing down

---
OUTPUT FORMAT — Return STRICT JSON only. 
Map your deep reflection to these fields:

1. "detected_emotions": Array of 2–4 specific emotion objects {"word": "", "core": "", "category": ""}.
2. "ruler": Object with exactly these keys:
   - "section_1": (What You're Feeling) Identify 2–4 specific emotions using granular language.
   - "section_2": (What Might Be Driving This) Identify possible causes, triggers, or cognitive patterns.
   - "section_3": (A Grounded Perspective) Validate the emotion realistically and gently reframe distorted thinking.
   - "section_4": (Try This Today) 1–2 specific, actionable, time-bound techniques.
   - "section_5": (Reflection for Tomorrow) 1 short journaling prompt for continuity.
   - "What can be done": A combined string of Section 4 and Section 5 formatted as a numbered list (1., 2., 3.).

3. "reflection_question": A single short question to deepen self-awareness.
4. "emotional_observation": A very brief 1-sentence summary of the core feeling.
5. "pattern_insight": A very brief 1-sentence summary of the trigger.
6. "regulation_suggestion": A very brief 1-sentence grounding thought.

JSON STRUCTURE (use exactly these keys):
{
  "detected_emotions": [{"word": "", "core": "", "category": ""}],
  "emotional_observation": "",
  "pattern_insight": "",
  "reflection_question": "",
  "regulation_suggestion": "",
  "ruler": {
    "section_1": "",
    "section_2": "",
    "section_3": "",
    "section_4": "",
    "section_5": "",
    "What can be done": "1. ...\n2. ...\n3. ..."
  }
}

---
OUTPUT STYLE:
- Always use the 5 headings exactly as defined above.
- BE EXTREMELY CONCISE AND IMPACTFUL. Use short, punchy sentences.
- Each section should be 1-2 sentences MAX. No fluff or introductory filler.
- "Directly hit the user" with insight. Be blunt but empathetic.
""".strip()

WEEKLY_SYSTEM_PROMPT = """
You are Emolit AI, the macro-perspective emotional architect. 
You are analyzing a week's worth of journal entries to identify the "Arch of the Week".

Return STRICT JSON only:
{
  "weekly_theme": "",
  "emotional_landscape": "",
  "macro_insight": "",
  "growth_milestone": "",
  "focus_for_next_week": ""
}

Rules:
1) Core Theme: Identify the singular dominant emotional thread of the week.
2) Landscape: Describe the overall "weather" of their emotions this week.
3) macro_insight: A deep, non-obvious observation based on the week's data.
4) Milestone: Identify one positive shift or moment of resilience, even if small.
5) Focus: A practical, high-impact focus area for the coming week.

Tone: Elevated, professional, encouraging, and architectural.
"""


@dataclass(frozen=True)
class EmotionIndex:
    allowed_words: set
    allowed_words_text: str
    word_map: Dict[str, Dict[str, str]]


def _load_emotion_dataset(path: str) -> EmotionIndex:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Emotion dataset not found: {path}")

    with open(path, "r", encoding="utf-8") as file:
        data = json.load(file)

    allowed_words: set = set()
    word_map: Dict[str, Dict[str, str]] = {}

    for core, categories in data.items():
        for category, words in categories.items():
            for word in words.keys():
                key = word.strip().lower()
                if not key:
                    continue
                allowed_words.add(key)
                word_map[key] = {
                    "word": word,
                    "core": core,
                    "category": category,
                    "metadata": words[word]
                }

    if not allowed_words:
        raise ValueError("Emotion dataset loaded with zero words.")

    allowed_words_text = ", ".join(sorted(allowed_words))

    return EmotionIndex(
        allowed_words=allowed_words,
        allowed_words_text=allowed_words_text,
        word_map=word_map,
    )


def _contains_high_risk(entry: str) -> bool:
    text = entry.lower()
    return any(phrase in text for phrase in HIGH_RISK_PHRASES)


def _trim_words(text: str, max_words: int) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]).strip()


class AIClient:
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", provider: str = "openai") -> None:
        self.provider = provider
        self.model = model
        self.extra_headers = {}

        if provider == "anthropic":
            self.client = anthropic.Anthropic(api_key=api_key)
            env_anthropic_model = os.getenv("ANTHROPIC_MODEL", "").strip()
            if env_anthropic_model:
                self.model = env_anthropic_model
            elif not model or model == "gpt-4o-mini":
                self.model = "claude-sonnet-4-6"
        else:
            base_url = os.getenv("OPENAI_BASE_URL", "").strip() or None
            env_model = os.getenv("OPENAI_MODEL", "").strip()

            if env_model:
                self.model = env_model
            elif base_url and "groq.com" in base_url:
                self.model = "llama-3.3-70b-versatile"
            elif base_url and "openrouter.ai" in base_url:
                self.model = "openai/gpt-4o-mini"
            
            self.client = OpenAI(api_key=api_key, base_url=base_url)

            if base_url and "openrouter.ai" in base_url:
                referer = os.getenv("OPENROUTER_REFERRER", "").strip()
                title = os.getenv("OPENROUTER_TITLE", "").strip()
                if referer:
                    self.extra_headers["HTTP-Referer"] = referer
                if title:
                    self.extra_headers["X-Title"] = title

        logger.info(f"🤖 AI Provider: {self.provider} | Model: {self.model}")

    def generate(
        self,
        entry: str,
        allowed_words_text: str,
        correction_note: Optional[str] = None,
    ) -> Dict[str, Any]:
        system_content = f"{SYSTEM_PROMPT}\n\nAllowed emotion words (lowercase, comma-separated): {allowed_words_text}"
        if correction_note:
            system_content += f"\n\nCorrection: {correction_note}"

        if self.provider == "anthropic":
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=system_content,
                messages=[{"role": "user", "content": entry}],
                temperature=0.4,
            )
            content = response.content[0].text
        else:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": entry},
                ],
                temperature=0.4,
                response_format={"type": "json_object"},
                extra_headers=self.extra_headers or None,
            )
            content = response.choices[0].message.content
        
        # --- STAGE 1: Strip Markdown ---
        content = content.strip()
        # Remove ```json ... ``` blocks
        import re
        content = re.sub(r'```json\s*(.*?)\s*```', r'\1', content, flags=re.DOTALL)
        content = content.strip()

        # --- STAGE 2: Safety Net for Truncated JSON ---
        if content.startswith('{') and not content.endswith('}'):
            # Count opening and closing braces to be smarter
            open_braces = content.count('{')
            close_braces = content.count('}')
            if open_braces > close_braces:
                # Add enough braces to close it
                needed = open_braces - close_braces
                content += ('\n' + '}' * needed)
                logger.warning(f"⚠️ AI response was truncated. Added {needed} closing braces.")

        # --- STAGE 3: Robust JSON parsing ---
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Stage 4: Aggressive cleaning for unescaped quotes
            try:
                # Extract content between first { and last } again just in case
                json_match = re.search(r'(\{.*\})', content, re.DOTALL)
                if json_match:
                    cleaned = json_match.group(1)
                    # Fix literal newlines inside strings
                    def fix_newlines(m): return m.group(0).replace('\n', '\\n').replace('\r', '')
                    cleaned = re.sub(r'"(?:\\.|[^"\\])*"', fix_newlines, cleaned)
                    # Fix unescaped quotes
                    fixed = re.sub(r'(?<![:\[\{,])"(?![:\]\},])', '\\"', cleaned)
                    return json.loads(fixed)
            except:
                logger.error(f"❌ All cleaning stages failed. Content: {content}")
            
            raise HTTPException(status_code=500, detail="AI formatting error. Please try again.")


class InvalidEmotionError(Exception):
    def __init__(self, invalid_words: List[str]) -> None:
        self.invalid_words = invalid_words
        super().__init__(f"Invalid emotion words: {', '.join(invalid_words)}")


class MissingFieldsError(Exception):
    def __init__(self, missing_fields: List[str]) -> None:
        self.missing_fields = missing_fields
        super().__init__(f"Missing required fields: {', '.join(missing_fields)}")


class JournalService:
    def __init__(self, ai_client: AIClient, emotion_index: EmotionIndex, fallback_client: Optional[AIClient] = None) -> None:
        self.ai_client = ai_client
        self.emotion_index = emotion_index
        self.fallback_client = fallback_client

    def analyze_entry(self, entry: str) -> Dict[str, Any]:
        """Analyze a journal entry with deep intelligence."""
        entry = entry.strip()
        if not entry:
            raise HTTPException(status_code=400, detail="Journal entry is required.")

        if _contains_high_risk(entry):
            return {
                "error": "high_risk_detected",
                "message": "I am really sorry you are feeling this way. You deserve support."
            }

        # 🚀 Unified Data Spine: Context-Aware RAG Evaluation
        if False and rag_answer:
            try:
                # Ask the unified memory to evaluate this entry using RULER framework
                rag_text, _ = rag_answer(entry)
                return self._parse_rag_response(rag_text, entry)
            except Exception as e:
                logger.error(f"❌ RAG Engine Error: {str(e)}", exc_info=True)
                logger.info("⚠️ Falling back to deterministic OpenAI engine.")

        # 🧠 EMOTIONAL REFLECTION PROMPT (Ensures AI populates all fields)
        system_msgs = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": f"Use ONLY these emotion words (comma separated): {self.emotion_index.allowed_words_text}"},
            {"role": "user", "content": f"Analyze this entry and return the reflection JSON:\n\n{entry}"}
        ]

        try:
            result = self.ai_client.generate(
                entry=entry,
                allowed_words_text=self.emotion_index.allowed_words_text
            )
            
            if "error" in result:
                raise Exception(f"AI Client error: {result['error']}")

            try:
                # Primary validation
                return self._validate_response(result)
            except (MissingFieldsError, InvalidEmotionError) as e:
                # 🛠️ REPAIR: If AI missed a box, we reconstruct it
                logger.warning(f"⚠️ Response Repair Triggered: {str(e)}")
                repaired = self._repair_missing_fields(result, entry)
                return self._validate_response(repaired)

        except Exception as e:
            logger.error(f"❌ Primary Emotional Engine Error: {str(e)}", exc_info=True)
            
            # Try with fallback client if available
            if getattr(self, "fallback_client", None):
                logger.info(f"🔄 Switching to fallback provider: {self.fallback_client.provider}")
                try:
                    result = self.fallback_client.generate(
                        entry=entry,
                        allowed_words_text=self.emotion_index.allowed_words_text
                    )
                    if "error" not in result:
                        try:
                            return self._validate_response(result)
                        except (MissingFieldsError, InvalidEmotionError) as fe:
                            logger.warning(f"⚠️ Fallback Response Repair Triggered: {str(fe)}")
                            repaired = self._repair_missing_fields(result, entry)
                            return self._validate_response(repaired)
                except Exception as fe:
                    logger.error(f"❌ Fallback Emotional Engine Error: {str(fe)}", exc_info=True)

            # Final fallback so the UI doesn't crash
            fallback_data = self._repair_missing_fields({"detected_emotions": self._fallback_emotions(entry)}, entry)
            return self._validate_response(fallback_data)

    def _parse_rag_response(self, rag_text: str, entry: str) -> Dict[str, Any]:
        """Map the RAG Engine's RULER output onto Emolit's structured JSON."""
        lines = rag_text.splitlines()
        data: Dict[str, str] = {}
        current_key = None
        current_text: List[str] = []

        # Parse RULER format with ":" separator
        ruler_keys = {"Emotion", "Recognize", "Understand", "Label", "Express", "Regulate", "What can be done"}
        for line in lines:
            line_stripped = line.strip()
            # Recognize keys like "Recognize:", "What can be done:", etc.
            if ":" in line_stripped:
                key_candidate, val_candidate = line_stripped.split(":", 1)
                key_candidate = key_candidate.strip()
                # Check if it's a valid RULER key
                if key_candidate in ruler_keys:
                    if current_key:
                        data[current_key] = "\n".join(current_text).strip()
                    current_key = key_candidate
                    current_text = [val_candidate.strip()] if val_candidate.strip() else []
                    continue
            
            if current_key:
                current_text.append(line_stripped)
        
        if current_key:
            data[current_key] = "\n".join(current_text).strip()

        # Extract mapped values
        emotion_word = data.get("Emotion", data.get("Label", "Reflective")).strip().split()[0].replace("*", "").capitalize()
        
        # Build normalized emotion response
        normalized_emotions = []
        key = emotion_word.lower()
        if key in self.emotion_index.allowed_words:
            normalized_emotions.append(self.emotion_index.word_map[key])
        else:
            fuzzy_match = next((w for w in self.emotion_index.allowed_words if key in w or w in key), None)
            if fuzzy_match:
                normalized_emotions.append(self.emotion_index.word_map[fuzzy_match])

        # Fill gracefully if <2 emotions are returned (UI expects 2-4)
        if len(normalized_emotions) < 2:
            for f in self._fallback_emotions(entry):
                if f["word"].lower() not in [e["word"].lower() for e in normalized_emotions]:
                    normalized_emotions.append(f)
                if len(normalized_emotions) >= 3:
                    break

        recognize = data.get("Recognize", "")
        understand = data.get("Understand", "")
        emotional_observation = f"{recognize} {understand}".strip()

        label = data.get("Label", "")
        express = data.get("Express", "")
        pattern_insight = f"{label} {express}".strip()
        
        what_can_be_done = data.get("What can be done", "")
        regulate = data.get("Regulate", "")
        # Combined suggestion for the legacy UI boxes
        regulation_suggestion = f"{regulate}\n\n{what_can_be_done}".strip()

        result = {
            "detected_emotions": [
                {"word": em["word"].capitalize(), "core": em["core"], "category": em["category"], "metadata": em.get("metadata", {})}
                for em in normalized_emotions
            ],
            "emotional_observation": emotional_observation or "Just sitting here with you and your feelings...",
            "pattern_insight": pattern_insight or "I can see you've been carrying a lot lately...",
            "reflection_question": "If your heart could speak, what would it say right now?",
            "regulation_suggestion": regulation_suggestion or "Take a slow, deep breath. You are safe here.",
            "ruler": {
                "section_1": recognize,
                "section_2": understand,
                "section_3": label,
                "section_4": express,
                "section_5": regulate,
                "Recognize": recognize,
                "Understand": understand,
                "Label": label,
                "Express": express,
                "Regulate": regulate,
                "What can be done": what_can_be_done
            }
        }

        try:
            return self._validate_response(result)
        except Exception as e:
            logger.warning(f"RAG parsed validation failed ({e}), repairing...")
            repaired = self._repair_missing_fields(result, entry)
            return self._validate_response(repaired)

    def analyze_week(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Synthesize a week of journal data.
        High-speed synthesis of past entries.
        """
        if not entries:
            return {
                "error": "insufficient_data",
                "message": "Archive empty. Log at least one neural entry to unlock your protocol."
            }

        # 🛡️ DETERMINISTIC SYNTHESIS
        all_emotions = []
        all_insights = []
        for e in entries:
            analysis = e.get("ai_response", {})
            for em in analysis.get("detected_emotions", []):
                all_emotions.append(em.get("core", "Neutral"))
            insight = analysis.get("pattern_insight")
            if insight: all_insights.append(insight)

        from collections import Counter
        counts = Counter(all_emotions)
        dominant = counts.most_common(1)[0][0] if counts else "Equilibrium"
        
        THEME_MAP = {
            "Happy": ("Emotional Resonance", "A landscape of high psychological alignment and clarity."),
            "Angry": ("Intensity Phase", "A phase of intense emotional discharge and boundary defining."),
            "Sad": ("Introspective Processing", "A deep-dive period of recalibration."),
            "Fear": ("Focus Vigilance", "Navigating high-entropy environments with sustained conscious focus."),
            "Bad": ("Emotional Maintenance", "A recalibration phase focused on psychological preservation.")
        }
        theme, landscape = THEME_MAP.get(dominant, ("Emotional Equilibrium", "A sustained state of baseline stability and core focus."))

        return {
            "weekly_theme": theme,
            "emotional_landscape": landscape,
            "macro_insight": all_insights[-1] if all_insights else "Data patterns are stabilizing in your journal.",
            "growth_milestone": f"Maintained emotional documentation across {len(entries)} entries.",
            "focus_for_next_week": "Sustained daily emotional tracking.",
            "is_ai_generated": False,
            "entry_count": len(entries),
            "timestamp": datetime.utcnow().isoformat()
        }

    def _validate_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        required_keys = {
            "detected_emotions",
            "emotional_observation",
            "pattern_insight",
            "reflection_question",
            "regulation_suggestion",
            "ruler",
        }

        missing_fields = [key for key in required_keys if key not in result]
        if missing_fields:
            raise MissingFieldsError(missing_fields)

        detected = result.get("detected_emotions")
        if not isinstance(detected, list):
            raise HTTPException(status_code=502, detail="detected_emotions must be a list.")

        if not (1 <= len(detected) <= 4):
            raise HTTPException(status_code=502, detail="detected_emotions must contain 1-4 items.")

        normalized_emotions: List[Dict[str, str]] = []
        invalid_words: List[str] = []

        for item in detected:
            if not isinstance(item, dict):
                continue
            word = str(item.get("word", "")).strip()
            key = word.lower()
            if not key:
                continue

            if key in self.emotion_index.allowed_words:
                mapped = self.emotion_index.word_map[key]
                normalized_emotions.append({
                    "word": mapped["word"],
                    "core": mapped["core"],
                    "category": mapped["category"],
                    "metadata": mapped["metadata"]
                })
            else:
                # Try fuzzy: find closest allowed word containing this word or vice-versa
                fuzzy_match = next(
                    (w for w in self.emotion_index.allowed_words if key in w or w in key),
                    None
                )
                if fuzzy_match:
                    mapped = self.emotion_index.word_map[fuzzy_match]
                    normalized_emotions.append({
                        "word": mapped["word"],
                        "core": mapped["core"],
                        "category": mapped["category"],
                    })
                    logger.info(f"🔄 Fuzzy matched '{word}' → '{mapped['word']}'")
                else:
                    invalid_words.append(word)
                    logger.warning(f"⚠️ Skipping unrecognized emotion: '{word}'")

        if invalid_words and not normalized_emotions:
            # Only raise if we have ZERO valid emotions
            raise InvalidEmotionError(invalid_words)

        if not normalized_emotions:
            raise HTTPException(status_code=502, detail="No valid emotions returned by AI.")

        emotional_observation = _trim_words(str(result.get("emotional_observation", "")).strip(), 120)
        pattern_insight = _trim_words(str(result.get("pattern_insight", "")).strip(), 100)
        reflection_question = _trim_words(str(result.get("reflection_question", "")).strip(), 40)
        regulation_suggestion = _trim_words(str(result.get("regulation_suggestion", "")).strip(), 150)

        total_words = sum(
            len(text.split())
            for text in [emotional_observation, pattern_insight, reflection_question, regulation_suggestion]
        )
        if total_words > 450:
            logger.warning("AI response long, but keeping it intact.")

        validated = {
            "detected_emotions": normalized_emotions,
            "emotional_observation": emotional_observation,
            "pattern_insight": pattern_insight,
            "reflection_question": reflection_question,
            "regulation_suggestion": regulation_suggestion,
        }
        
        if "ruler" in result:
            validated["ruler"] = result["ruler"]
            
        return validated

    def _repair_missing_fields(self, result: Dict[str, Any], entry: str) -> Dict[str, Any]:
        repaired = dict(result)
        if "detected_emotions" not in repaired or not isinstance(repaired.get("detected_emotions"), list):
            repaired["detected_emotions"] = self._fallback_emotions(entry)
        
        # Warm placeholders instead of empty strings
        fallbacks = {
            "emotional_observation": "I'm listening to your heart. It's okay to feel this way.",
            "pattern_insight": "I can see you're trying your best, and that is enough.",
            "reflection_question": "Can you feel your breath moving in and out, just for a moment?",
            "regulation_suggestion": "Rest your hands on your lap and let your shoulders drop.",
            "ruler": {
                "section_1": "I can feel the heavy weather in your heart right now.",
                "section_2": "You've been through a lot, and it makes sense to feel this way.",
                "section_3": "A quiet moment of reflection.",
                "section_4": "It is okay to give yourself permission to just be, for a little while.",
                "section_5": "Breathe in peace and let the heavy thoughts drift away.",
                "Recognize": "I can feel the heavy weather in your heart right now.",
                "Understand": "You've been through a lot, and it makes sense to feel this way.",
                "Label": "A quiet moment of reflection.",
                "Express": "It is okay to give yourself permission to just be, for a little while.",
                "Regulate": "Breathe in peace and let the heavy thoughts drift away.",
                "What can be done": "1. Take 15 minutes to objectively write down exactly what happened, separating facts from interpretations.\n2. Identify one small, proactive step you can take today to regain a sense of focus or agency.\n3. Based on your current headspace, write down one thing you want to handle differently tomorrow."
            }
        }

        for key, default in fallbacks.items():
            val = repaired.get(key)
            # 🛡️ FIX: Allowing dict for 'ruler' so it doesn't get overwritten by fallback!
            if key == "ruler":
                if not val or not isinstance(val, dict):
                    repaired[key] = default
            else:
                if not val or not isinstance(val, str) or not val.strip():
                    repaired[key] = default
        return repaired

    def _fallback_emotions(self, entry: str) -> List[Dict[str, str]]:
        entry_lower = entry.lower()
        candidates: List[str] = []

        for keyword, emotions in KEYWORD_EMOTION_MAP.items():
            if keyword in entry_lower:
                for emotion in emotions:
                    if emotion in self.emotion_index.allowed_words and emotion not in candidates:
                        candidates.append(emotion)

        for emotion in FALLBACK_EMOTIONS:
            if emotion in self.emotion_index.allowed_words and emotion not in candidates:
                candidates.append(emotion)
            if len(candidates) >= 4:
                break

        if len(candidates) < 2:
            # Ensure minimum of 2
            for emotion in sorted(self.emotion_index.allowed_words):
                if emotion not in candidates:
                    candidates.append(emotion)
                if len(candidates) >= 2:
                    break

        normalized: List[Dict[str, str]] = []
        for emotion in candidates[:4]:
            mapped = self.emotion_index.word_map.get(emotion)
            if mapped:
                normalized.append({
                    "word": mapped["word"],
                    "core": mapped["core"],
                    "category": mapped["category"],
                })

        return normalized


_emotion_index = _load_emotion_dataset(EMOTION_DATA_PATH)
_journal_service: Optional[JournalService] = None


def get_journal_service() -> JournalService:
    global _journal_service
    if _journal_service is None:
        provider = os.getenv("AI_PROVIDER", "").strip().lower()
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        openai_key = os.getenv("OPENAI_API_KEY", "")

        # 1. Determine main provider
        if provider == "openai" and openai_key:
            ai_client = AIClient(api_key=openai_key, provider="openai")
        elif provider == "anthropic" and anthropic_key:
            ai_client = AIClient(api_key=anthropic_key, provider="anthropic")
        else:
            # Fallback to default priority order
            if anthropic_key:
                ai_client = AIClient(api_key=anthropic_key, provider="anthropic")
            elif openai_key:
                ai_client = AIClient(api_key=openai_key, provider="openai")
            else:
                raise HTTPException(status_code=500, detail="No AI API key found (ANTHROPIC_API_KEY or OPENAI_API_KEY).")
        
        # 2. Determine backup/fallback provider
        fallback_client = None
        if ai_client.provider == "anthropic" and openai_key:
            fallback_client = AIClient(api_key=openai_key, provider="openai")
        elif ai_client.provider == "openai" and anthropic_key:
            fallback_client = AIClient(api_key=anthropic_key, provider="anthropic")

        _journal_service = JournalService(
            ai_client=ai_client, 
            emotion_index=_emotion_index,
            fallback_client=fallback_client
        )
    return _journal_service
