from datetime import datetime
import os
from fastapi import APIRouter, Depends, Request, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.auth import get_current_user
from app.database import get_collection
from app.services.ai_service import get_journal_service
from bson import ObjectId
import asyncio
import logging
import httpx

logger = logging.getLogger("emolit.journal")
router = APIRouter(tags=["journal"])

class JournalEntryRequest(BaseModel):
    entry: str

@router.get("/journal/history")
@router.get("/api/journal/history")
async def get_history(user: dict = Depends(get_current_user)):
    """Return combined history with robust source fallback and schema resilience."""
    try:
        user_id = ObjectId(user["user_id"])
        email = user.get("email", "")
        
        journals_col = get_collection("journal_entries")
        learned_col = get_collection("learned_words")
        daily_seen_col = get_collection("daily_words_seen") # Fallback source
        
        query = {"$or": [{"user_id": user_id}, {"user_email": email}]}
        
        journals = list(journals_col.find(query).sort("created_at", -1).limit(100))
        learned = list(learned_col.find(query).sort("created_at", -1).limit(100))
        # Also try daily_seen which might just use user_id
        daily_seen = list(daily_seen_col.find({"$or": [query, {"user_id": user_id}]}).sort("created_at", -1).limit(100))
        
        formatted = []
        for j in journals:
            ana = j.get("ai_analysis") or j.get("ai_response") or {}
            formatted.append({
                "type": "journal",
                "data": {
                    "entry_id": str(j.get("_id")),
                    "entry_text": j.get("entry_text", ""),
                    "detected_emotions": ana.get("detected_emotions", []),
                    "emotional_observation": ana.get("emotional_observation", ""),
                    "pattern_insight": ana.get("pattern_insight", "Thinking..."),
                    "reflection_question": ana.get("reflection_question", ""),
                    "regulation_suggestion": ana.get("regulation_suggestion", ""),
                    "ruler": ana.get("ruler", {}),
                    "created_at": j["created_at"].isoformat() + "Z" if isinstance(j.get("created_at"), datetime) else datetime.utcnow().isoformat() + "Z"
                }
            })
            
        # Merge and deduplicate learned words (only truly saved/learned words)
        combined_words = learned
        seen_ids = set()
        
        for w in combined_words:
            wid = str(w.get("_id"))
            if wid in seen_ids: continue
            seen_ids.add(wid)
            
            # Robust mapping for varying schemas
            details = w.get("word_details")
            if not details:
                details = {
                    "word": w.get("word") or w.get("emotion_word") or "Reflective",
                    "core": w.get("core") or w.get("core_emotion") or "Neutral",
                    "category": w.get("category", "General"),
                    "metadata": w.get("metadata") or {
                        "definition": w.get("definition") or "No further details available.",
                        "intensity": w.get("intensity", 3)
                    }
                }
            
            # Handle potential 'date' vs 'created_at'
            raw_date = w.get("created_at") or w.get("date")
            if isinstance(raw_date, datetime):
                c_at = raw_date.isoformat() + "Z"
            elif isinstance(raw_date, str):
                c_at = raw_date if "T" in raw_date else f"{raw_date}T12:00:00Z"
            else:
                c_at = datetime.utcnow().isoformat() + "Z"

            formatted.append({
                "type": "learned_word",
                "data": {
                    "entry_id": wid,
                    "word_details": details,
                    "created_at": c_at
                }
            })
            
        formatted.sort(key=lambda x: str(x["data"].get("created_at", "")), reverse=True)
        return {"entries": formatted}
    except Exception as e:
        logger.error(f"❌ HISTORY PAGE CRASH: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/journal/learned-word/{entry_id}")
@router.delete("/api/journal/learned-word/{entry_id}")
async def remove_saved_word(entry_id: str, user: dict = Depends(get_current_user)):
    """Allow user to remove a saved word from their timeline and library."""
    try:
        user_id = ObjectId(user["user_id"])
        email = user.get("email", "")
        
        query = {
            "_id": ObjectId(entry_id),
            "$or": [{"user_id": user_id}, {"user_email": email}]
        }
        
        # Try deleting from primary collection
        result = get_collection("learned_words").delete_one(query)
        
        # If not there, might be in fallback collection
        if result.deleted_count == 0:
            result = get_collection("daily_words_seen").delete_one(query)
            
        return {"status": "ok", "deleted": result.deleted_count > 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/journal")
@router.post("/api/journal")
async def submit_journal(request: JournalEntryRequest, user: dict = Depends(get_current_user)):
    """Submit journal and return the DEEP REFLECTION [V5] prompt results."""
    try:
        service = get_journal_service()
        # The service already uses the [DEEP-REFLECTION-V5] prompt in ai_service.py
        analysis = await asyncio.to_thread(service.analyze_entry, request.entry)
        
        user_id = ObjectId(user["user_id"])
        journal_doc = {
            "user_id": user_id,
            "user_email": user.get("email"),
            "entry_text": request.entry,
            # 🛡️ RESTORED: Using ai_analysis to match your original database schema
            "ai_analysis": analysis,
            "entry_type": "journal_entry",
            "created_at": datetime.utcnow()
        }
        get_collection("journal_entries").insert_one(journal_doc)
        
        # 📚 AUTO-SAVE: Capture detected emotions into the Linguistic Library
        emotions = analysis.get("detected_emotions", [])
        if emotions:
            try:
                learned_col = get_collection("learned_words")
                today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                
                for em in emotions:
                    # Avoid duplicates for the same word on the same day
                    existing = learned_col.find_one({
                        "$or": [{"user_id": user_id}, {"user_email": user.get("email")}],
                        "word": em["word"],
                        "created_at": {"$gte": today_start}
                    })
                    
                    if not existing:
                        word_doc = {
                            "user_id": user_id,
                            "user_email": user.get("email"),
                            "word": em["word"],
                            "word_details": {
                                "word": em["word"],
                                "core": em["core"],
                                "category": em["category"],
                                "metadata": em.get("metadata", {})
                            },
                            "created_at": datetime.utcnow()
                        }
                        learned_col.insert_one(word_doc)
            except Exception as we:
                logger.warning(f"⚠️ Could not auto-save learned words: {str(we)}")

        # 🛡️ RESTORED: Return entire analysis so no editorial work is lost
        return {"status": "ok", "entry_id": str(journal_doc["_id"]), **analysis}
    except Exception as e:
        logger.error(f"❌ DEEP REFLECTION FAILED: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/journal/stats")
@router.get("/api/journal/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    query = {"$or": [{"user_id": ObjectId(user["user_id"])}, {"user_email": user["email"]}]}
    count = get_collection("journal_entries").count_documents(query)
    return {"total_entries": count}


@router.post("/journal/voice")
@router.post("/api/journal/voice")
async def transcribe_voice(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Transcribe a 20-second audio chunk using Sarvam AI STT. Returns transcript text only.
    The frontend sends audio in 20-second chunks; this endpoint transcribes each one.
    The user can then review and submit the full accumulated text for AI analysis.
    """
    sarvam_key = os.getenv("SARVAM_API_KEY", "")
    if not sarvam_key:
        raise HTTPException(status_code=500, detail="Speech-to-text service not configured.")

    audio_data = await file.read()
    if not audio_data:
        raise HTTPException(status_code=400, detail="Empty audio file received.")

    # ⚠️ Sarvam AI rejects MIME types with codec params like 'audio/webm;codecs=opus'
    #    Strip everything after ';' so we always send the base type e.g. 'audio/webm'
    raw_ct = file.content_type or "audio/webm"
    clean_ct = raw_ct.split(";")[0].strip()          # 'audio/webm;codecs=opus' → 'audio/webm'
    logger.info(f"🎙 Voice chunk received — MIME: {raw_ct} → sending as: {clean_ct}")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.sarvam.ai/speech-to-text",
                headers={"api-subscription-key": sarvam_key},
                files={
                    "file": (
                        "chunk.webm",      # fixed name, Sarvam uses content-type not filename
                        audio_data,
                        clean_ct           # ✅ 'audio/webm' — accepted by Sarvam
                    )
                },
                data={"model": "saarika:v2.5", "language_code": "unknown"}
            )
            resp.raise_for_status()
            result = resp.json()

        transcript = result.get("transcript", "")
        logger.info(f"✅ Transcribed {len(audio_data)} bytes → {len(transcript)} chars for {user.get('email')}")
        return {"transcript": transcript, "status": "ok"}

    except httpx.HTTPStatusError as e:
        logger.error(f"\u274c Sarvam STT HTTP error {e.response.status_code}: {e.response.text}")
        raise HTTPException(
            status_code=502,
            detail=f"Speech transcription failed: {e.response.text}"
        )
    except Exception as e:
        logger.error(f"\u274c Voice transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription service error: {str(e)}")
