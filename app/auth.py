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
# This expects 'firebase-service-account.json' or 'FIREBASE_CREDENTIALS' env.
service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json")

if not firebase_admin._apps:
    firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS")
    if firebase_creds_json:
        try:
            import json
            creds_dict = json.loads(firebase_creds_json.strip())
            # Replace escaped newlines with actual newlines in private key
            if "private_key" in creds_dict:
                pk = creds_dict["private_key"]
                escaped_count = pk.count(r"\n")
                import hashlib
                h = hashlib.sha256(pk.encode("utf-8")).hexdigest()
                # Safe logging without printing secret content
                logger.info(f"🔑 Key Metadata: length={len(pk)}, starts_with_header={pk.startswith('-----BEGIN')}, newlines={pk.count(chr(10))}, escaped_newlines={escaped_count}, sha256={h}")
                # Safe snippet logging to inspect escape formatting
                snippet = pk[:40] + "..." + pk[-40:] if len(pk) > 80 else pk
                logger.info(f"🔑 Key Snippet: {repr(snippet)}")
                creds_dict["private_key"] = pk.replace("\\n", "\n")
            cred = credentials.Certificate(creds_dict)
            firebase_admin.initialize_app(cred)
            logger.info("✅ Firebase Admin initialized with FIREBASE_CREDENTIALS environment variable.")
        except Exception as env_e:
            logger.error(f"❌ Failed to initialize Firebase from environment JSON: {env_e}")
            if os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
                logger.info(f"✅ Firebase Admin initialized with certificate: {service_account_path}")
            else:
                logger.warning(f"⚠️ WARNING: Firebase service credentials not found. Verification will fail.")
                firebase_admin.initialize_app()
    elif os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        logger.info(f"✅ Firebase Admin initialized with certificate: {service_account_path}")
    else:
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
