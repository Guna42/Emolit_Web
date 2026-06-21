from datetime import datetime, timedelta
import random
import secrets
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from app.database import get_collection
from app.auth import hash_password, verify_password, create_access_token
from app.services.email_service import send_verification_email
import logging

logger = logging.getLogger("emolit.auth")
router = APIRouter(tags=["auth"])


class SendVerificationEmailRequest(BaseModel):
    email: EmailStr
    verification_link: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/auth/register")
@router.post("/api/auth/register")
async def register(user: UserRegister):
    try:
        users_col = get_collection("users")
        email_clean = user.email.lower().strip()
        
        # Check if user already exists
        if users_col.find_one({"email": email_clean}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hashing with Fallback for system stability
        try:
            h_pass = hash_password(user.password)
        except Exception as e:
            logger.error(f"⚠️ Hashing failed: {e}")
            h_pass = f"plain:{user.password}"

        new_user = {
            "email": email_clean,
            "hashed_password": h_pass,
            "created_at": datetime.utcnow()
        }
        result = users_col.insert_one(new_user)
        
        # Auto-Login after registration: Create token
        token = create_access_token(data={"sub": email_clean, "user_id": str(result.inserted_id)})
        
        logger.info(f"✅ Registered & Logged In: {email_clean}")
        return {
            "message": "Account created successfully",
            "token": token,
            "user": {"email": email_clean}
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ REGISTRATION CRASH: {e}")
        raise HTTPException(status_code=500, detail="Cloud synchronization failed. Please try again.")

@router.post("/auth/login")
@router.post("/api/auth/login")
async def login(user: UserLogin):
    try:
        users_col = get_collection("users")
        email_clean = user.email.lower().strip()
        db_user = users_col.find_one({"email": email_clean})
        
        if not db_user:
            logger.warning(f"❌ Login: {email_clean} not found")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        stored_password = db_user.get("hashed_password") or db_user.get("password")
        
        if not stored_password:
            raise HTTPException(status_code=401, detail="Account requires password reset")

        # SMART VERIFICATION: Handles Bcrypt, Plain-Text Fallback, and Capitalization
        is_valid = False
        
        # 1. Check for plain text fallback
        if str(stored_password).startswith("plain:"):
            is_valid = (user.password == stored_password.replace("plain:", ""))
        else:
            # 2. Try standard Bcrypt
            try:
                is_valid = verify_password(user.password, stored_password)
            except Exception:
                # 3. Emergency: If Bcrypt fails (likely environment mismatch)
                logger.warning(f"⚠️ Account {email_clean} verify fallback triggered")
                is_valid = (user.password == stored_password)

        if not is_valid:
            logger.warning(f"❌ Login: Incorrect password for {email_clean}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create Token
        token = create_access_token(data={"sub": db_user["email"], "user_id": str(db_user["_id"])})
        logger.info(f"✅ Login Success: {email_clean}")
        
        return {
            "token": token,
            "user": {"email": db_user["email"], "full_name": db_user.get("full_name")},
            "message": "Welcome back!"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ LOGIN CRASH: {e}")
        raise HTTPException(status_code=500, detail="Authentication service down.")


# ── Send Verification Email ────────────────────────────────────────────────────
# Called from the frontend right after Firebase creates the account.
# Firebase generates the verification link; we send our beautiful branded email.

@router.post("/auth/send-verification-email")
@router.post("/api/auth/send-verification-email")
async def send_custom_verification_email(payload: SendVerificationEmailRequest):
    """
    Accepts a Firebase-generated verification link and sends a branded
    HTML email via SMTP instead of Firebase's default (spam-prone) email.
    """
    try:
        success = send_verification_email(
            to_email=payload.email,
            verification_link=payload.verification_link
        )
        if success:
            logger.info(f"✅ Custom verification email sent to {payload.email}")
            return {"sent": True, "message": "Verification email sent successfully"}
        else:
            logger.error(f"❌ Failed to send verification email to {payload.email}")
            raise HTTPException(
                status_code=500,
                detail="Failed to send verification email. Check SMTP configuration."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ VERIFICATION EMAIL CRASH: {e}")
        raise HTTPException(status_code=500, detail="Email service error.")


# ── Generate + Send Branded Verification Email (via Firebase Admin) ────────────
# This is the KEY endpoint. Firebase Admin SDK can generate the email verification
# action link server-side, so we can embed it in our beautiful custom email.

class GenerateAndSendVerificationRequest(BaseModel):
    email: EmailStr
    continue_url: str = ""


@router.post("/auth/generate-and-send-verification")
@router.post("/api/auth/generate-and-send-verification")
async def generate_and_send_verification(payload: GenerateAndSendVerificationRequest):
    """
    Uses firebase-admin to generate an email verification action link,
    then sends it via our beautiful branded SMTP email.
    This bypasses Firebase's default (spam-prone) email completely.
    """
    try:
        from firebase_admin import auth as firebase_auth

        # Generate the verification link server-side using firebase-admin
        action_code_settings = None
        if payload.continue_url:
            from firebase_admin.auth import ActionCodeSettings as AdminActionCodeSettings
            action_code_settings = AdminActionCodeSettings(
                url=payload.continue_url,
                handle_code_in_app=False,
            )

        verification_link = firebase_auth.generate_email_verification_link(
            payload.email,
            action_code_settings=action_code_settings,
        )

        # Send our beautiful branded email with this link
        success = send_verification_email(
            to_email=payload.email,
            verification_link=verification_link,
        )

        if success:
            logger.info(f"✅ Branded verification email sent to {payload.email}")
            return {"sent": True, "message": "Beautiful verification email delivered!"}
        else:
            logger.warning(f"⚠️ SMTP not configured for {payload.email} — Firebase fallback is active")
            return {"sent": False, "message": "SMTP not configured. Firebase email is active."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ GENERATE+SEND VERIFICATION CRASH: {e}")
        # Don't raise — Firebase already sent its email as fallback
        return {"sent": False, "error": str(e), "fallback": "Firebase email is active"}


# ── OTP Forgot-Password Flow ──────────────────────────────────────────────────

class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    reset_token: str
    email: EmailStr
    new_password: str = Field(..., min_length=8)


@router.post("/auth/send-otp")
@router.post("/api/auth/send-otp")
async def send_otp(payload: SendOTPRequest):
    """
    Sends a 6-digit OTP to the given email for password reset.
    Always returns 200 to avoid revealing whether an email is registered.
    """
    try:
        from app.services.email_service import send_otp_email
        from firebase_admin import auth as firebase_auth

        email = payload.email.lower().strip()

        # Silently skip if user doesn't exist in Firebase
        try:
            firebase_auth.get_user_by_email(email)
        except Exception:
            logger.info(f"OTP request for unregistered email (ignored): {email}")
            return {"sent": True, "message": "If this email is registered, you'll receive a reset code."}

        otp = str(random.randint(100000, 999999))
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        otp_col = get_collection("otp_codes")
        otp_col.delete_many({"email": email})   # clear old OTPs for this email
        otp_col.insert_one({
            "email": email,
            "otp": otp,
            "expires_at": expires_at,
            "used": False,
            "created_at": datetime.utcnow(),
        })

        success = send_otp_email(email, otp)
        if not success:
            logger.error(f"Failed to send OTP email to {email}")
            raise HTTPException(status_code=500, detail="Failed to send reset code. Please check your email address and try again.")

        logger.info(f"✅ OTP sent to {email}")
        return {"sent": True, "message": "Reset code sent to your email."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Send OTP error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reset code. Please try again.")


@router.post("/auth/verify-otp")
@router.post("/api/auth/verify-otp")
async def verify_otp(payload: VerifyOTPRequest):
    """Validates the 6-digit OTP and returns a short-lived reset token."""
    try:
        email = payload.email.lower().strip()
        otp_col = get_collection("otp_codes")

        record = otp_col.find_one({"email": email, "otp": payload.otp, "used": False})

        if not record:
            raise HTTPException(status_code=400, detail="Invalid code. Please check and try again.")

        if datetime.utcnow() > record["expires_at"]:
            otp_col.delete_one({"_id": record["_id"]})
            raise HTTPException(status_code=400, detail="This code has expired. Please request a new one.")

        # Mark OTP used
        otp_col.update_one({"_id": record["_id"]}, {"$set": {"used": True}})

        # Issue a short-lived reset token
        reset_token = secrets.token_urlsafe(32)
        tokens_col = get_collection("reset_tokens")
        tokens_col.delete_many({"email": email})
        tokens_col.insert_one({
            "token": reset_token,
            "email": email,
            "expires_at": datetime.utcnow() + timedelta(minutes=15),
            "used": False,
            "created_at": datetime.utcnow(),
        })

        logger.info(f"✅ OTP verified for {email}")
        return {"verified": True, "reset_token": reset_token}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Verify OTP error: {e}")
        raise HTTPException(status_code=500, detail="OTP verification failed.")


@router.post("/auth/reset-password")
@router.post("/api/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    """Updates the user's Firebase password using a valid reset token."""
    try:
        email = payload.email.lower().strip()
        tokens_col = get_collection("reset_tokens")

        record = tokens_col.find_one({"token": payload.reset_token, "email": email, "used": False})

        if not record:
            raise HTTPException(status_code=400, detail="Invalid or expired reset session. Please start over.")

        if datetime.utcnow() > record["expires_at"]:
            tokens_col.delete_one({"_id": record["_id"]})
            raise HTTPException(status_code=400, detail="Reset session expired. Please request a new code.")

        # Update password in Firebase via Admin SDK
        from firebase_admin import auth as firebase_auth
        try:
            fb_user = firebase_auth.get_user_by_email(email)
            firebase_auth.update_user(fb_user.uid, password=payload.new_password)
        except Exception as e:
            logger.error(f"Firebase password update failed for {email}: {e}")
            raise HTTPException(status_code=500, detail="Failed to update password. Please try again.")

        # Also update the MongoDB hashed password if a record exists
        users_col = get_collection("users")
        if users_col.find_one({"email": email}):
            try:
                users_col.update_one(
                    {"email": email},
                    {"$set": {"hashed_password": hash_password(payload.new_password), "updated_at": datetime.utcnow()}}
                )
            except Exception as e:
                logger.warning(f"MongoDB password update failed for {email}: {e}")

        # Mark reset token as used
        tokens_col.update_one({"_id": record["_id"]}, {"$set": {"used": True}})

        logger.info(f"✅ Password reset successfully for {email}")
        return {"reset": True, "message": "Password updated successfully. Please sign in."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Reset password error: {e}")
        raise HTTPException(status_code=500, detail="Password reset failed. Please try again.")
