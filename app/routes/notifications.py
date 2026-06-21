import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user
from app.services.email_service import send_reminder_email

logger = logging.getLogger("emolit.notifications")
router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class EmailReminderRequest(BaseModel):
    step_text: str
    step_number: int  # 1-based


@router.post("/send-email-reminder")
async def send_email_reminder(
    body: EmailReminderRequest,
    user: dict = Depends(get_current_user),
):
    """
    Called by the frontend when the user's tab goes hidden while a
    reminder was pending, so we send a beautiful branded email instead.
    """
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email found for user")

    try:
        ok = send_reminder_email(
            to_email=email,
            step_text=body.step_text,
            step_number=body.step_number,
        )
        if not ok:
            raise HTTPException(status_code=500, detail="Email could not be sent")
        logger.info(f"📧 Reminder email sent to {email} for step {body.step_number}")
        return {"status": "sent", "to": email}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Reminder email failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
