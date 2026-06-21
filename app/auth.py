import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import firebase_admin
from firebase_admin import auth, credentials
from dotenv import load_dotenv

from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import jwt

import logging

load_dotenv()

logger = logging.getLogger("emolit.auth")

# Legacy Auth Setup (keeping for compatibility with existing routes)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-emolit-key")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return plain_password == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=30))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ─── Firebase Admin Setup ─────────────────────────────────────────────────────
# This expects 'firebase-service-account.json' to be in the project root.
# You can generate this from: Firebase Console → Project Settings → Service accounts
service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json")

if not firebase_admin._apps:
    if os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        logger.info(f"✅ Firebase Admin initialized with certificate: {service_account_path}")
    else:
        # Fallback for dev if service account is not yet provided
        # BUT verification will fail without it.
        logger.warning(f"⚠️ WARNING: {service_account_path} not found. Firebase verification will fail.")
        firebase_admin.initialize_app()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate Firebase credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Verify the ID token sent from the frontend
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        
        if not uid or not email:
            raise credentials_exception
            
        # ── Link with MongoDB ──
        # We look up the user by email (old system) OR firebase_uid (new system)
        from app.database import get_collection
        users_col = get_collection("users")
        
        # Try finding by Firebase UID first (new system)
        user_doc = users_col.find_one({"firebase_uid": uid})
        
        # If not found, try by email (legacy migration)
        if not user_doc:
            user_doc = users_col.find_one({"email": email.lower()})
            if user_doc:
                # Link the legacy account to the new Firebase UID
                users_col.update_one(
                    {"_id": user_doc["_id"]},
                    {"$set": {"firebase_uid": uid}}
                )
                logger.info(f"🔗 Linked legacy account {email} to Firebase UID {uid}")
        
        # If still not found, create a new user record
        if not user_doc:
            new_user = {
                "email": email.lower(),
                "firebase_uid": uid,
                "full_name": decoded_token.get("name"),
                "created_at": datetime.utcnow()
            }
            result = users_col.insert_one(new_user)
            user_doc = users_col.find_one({"_id": result.inserted_id})
            logger.info(f"🆕 Created new MongoDB user for {email}")
        
        return {
            "user_id": str(user_doc["_id"]), 
            "email": email,
            "firebase_uid": uid,
            "firebase_data": decoded_token
        }
    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ Firebase Auth Error: {error_msg}")
        # Log if token is empty or what it looks like
        if not token:
            logger.error("❌ Auth Token is empty")
        else:
            logger.error(f"❌ Token prefix: {token[:10]}... Length: {len(token)}")
        
        # Return the actual error in dev for faster debugging
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Auth Error: {error_msg}",
            headers={"WWW-Authenticate": "Bearer"},
        )
