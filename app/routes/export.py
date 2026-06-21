from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.auth import get_current_user
from datetime import datetime, timedelta
from app.database import get_collection
from bson import ObjectId
from app.services.pdf_service import generate_monthly_report
import logging

logger = logging.getLogger("emolit.export")
router = APIRouter(tags=["export"])

@router.get("/export/monthly-report")
@router.get("/api/export/monthly-report")
async def export_monthly_report(
    month: int = None,
    year: int = None,
    timezone_offset: int = 0,
    user: dict = Depends(get_current_user)
):
    """
    Generate and stream a premium emotional literacy report.
    If month/year provided, scopes to that calendar month. 
    Otherwise, defaults to the last 30 days.
    """
    try:
        user_email = user.get("email")
        user_id_str = user.get("user_id")
        
        if month and year:
            logger.info(f"📄 Engineering Monthly Neural Report for {user_email} (Period: {month}/{year}, Offset: {timezone_offset})")
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
        else:
            logger.info(f"📄 Engineering Monthly Neural Report for {user_email} (Rolling 30 Days, Offset: {timezone_offset})")
            start_date = datetime.utcnow() - timedelta(days=30)
            end_date = datetime.utcnow() + timedelta(days=1) # inclusive

        # 1. Fetch data directly
        try:
            user_id = ObjectId(user_id_str)
        except:
            user_id = user_id_str

        # Fetch Journals
        journals_col = get_collection("journal_entries")
        journals = list(journals_col.find({
            "$or": [{"user_id": user_id}, {"user_email": user_email}],
            "created_at": {"$gte": start_date, "$lt": end_date}
        }))
        for j in journals: 
            j['entry_type'] = 'journal_entry'

        # Fetch Learned Words
        learned_col = get_collection("learned_words")
        words = list(learned_col.find({
            "$or": [{"user_id": user_id}, {"user_email": user_email}],
            "created_at": {"$gte": start_date, "$lt": end_date}
        }))
        
        processed_words = []
        for w in words:
            # Match the robust mapping used in journal.py
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
            processed_words.append({
                'entry_type': 'learned_word',
                'created_at': w.get('created_at'),
                'word_details': details
            })
        
        combined_entries = journals + processed_words
        combined_entries.sort(key=lambda x: x.get('created_at') or datetime.min)
        
        # 2. Generate PDF
        pdf_buffer = generate_monthly_report(user_email, combined_entries, month=month, year=year, timezone_offset=timezone_offset)
        
        # 3. Stream back
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=emolit_monthly_{user_email.split('@')[0]}.pdf"
            }
        )
    except Exception as e:
        logger.error(f"❌ Monthly Export failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Neural Engine Error: {str(e)}")
