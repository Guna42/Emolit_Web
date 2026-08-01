from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime, timezone
import os
import json
import random
from bson import ObjectId

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("emolit.final")

app = FastAPI(title="Emolit Final Sync")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Strip API prefixes middleware for backward compatibility and cross-domain routing
@app.middleware("http")
async def strip_api_prefixes(request: Request, call_next):
    path = request.url.path
    modified = False
    new_path = path
    
    if path.startswith("/mobile-api"):
        new_path = path[len("/mobile-api"):]
        modified = True
    elif path.startswith("/api/"):
        new_path = path[len("/api"):]
        modified = True
        
    if modified:
        if not new_path:
            new_path = "/"
        request.scope["path"] = new_path
        
    response = await call_next(request)
    return response

# Shared Dependencies
from app.database import Database, get_collection
from app.auth import get_current_user

# --- Lifecycle ---
@app.on_event("startup")
async def startup():
    try:
        Database.connect()
        logger.info("Database connected successfully.")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")

# --- Dynamic Word Engine (Restored with Robustness) ---
def fetch_dynamic_word():
    try:
        data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "emotion_database.json")
        if not os.path.exists(data_path):
            data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "emotion_database.json")
            
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        core = random.choice(list(data.keys()))
        cat = random.choice(list(data[core].keys()))
        word = random.choice(list(data[core][cat].keys()))
        meta = data[core][cat][word]
        
        return {
            "word": word, "core": core, "category": cat,
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "metadata": meta
        }
    except Exception:
        # User's favorite fallback
        return {
            "word": "Astonished", "core": "Surprise", "category": "Amazement",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "metadata": {
                "definition": "Greatly surprised or impressed; amazed.",
                "intensity": 5, "synonyms": ["Amazed", "Stunned"],
                "example": "She was astonished by the sudden success.",
                "reflection_prompt": "When were you last astonished?",
                "growth_tip": "Stay curious.", "body_signal": "Wide eyes"
            }
        }

@app.get("/words/daily")
@app.get("/api/words/daily")
async def get_daily_word():
    return fetch_dynamic_word()

# --- THE MIRROR PLAN: AUTHENTICATED ---
@app.post("/journal/track-word")
@app.post("/api/journal/track-word")
async def track_word(request: Request, user: dict = Depends(get_current_user)):
    """Capture the exact frontend data and link it to the current user."""
    try:
        data = await request.json()
        word_data = data.get("word_data", {})
        
        get_collection("learned_words").insert_one({
            "user_id": ObjectId(user["user_id"]),
            "user_email": user.get("email"),
            "word": word_data.get("word"),
            "core": word_data.get("core"),
            "category": word_data.get("category"),
            "metadata": word_data.get("metadata"),
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Mirror Sync Complete: '{word_data.get('word')}' for {user['email']}")
        return {"status": "ok", "synced": True}
    except Exception as e:
        logger.error(f"Mirror Sync Failed: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# --- ROUTER REGISTRATION (The Missing Links) ---
from .routes.auth_routes import router as auth_router
from .routes.journal import router as journal_router
from .routes.history import router as history_router
from .routes.emotions import router as emotions_router
from .routes.words import router as words_router
from .routes.export import router as export_router
from .routes.notifications import router as notifications_router

app.include_router(auth_router)
app.include_router(journal_router)
app.include_router(history_router)
app.include_router(emotions_router)
app.include_router(words_router)
app.include_router(export_router)
app.include_router(notifications_router)

@app.get("/health")
def health():
    return {"status": "online", "sync": "active", "cwd": os.getcwd(), "file": __file__, "routes": [getattr(r, "path", str(r)) for r in app.routes]}


# ─── Serve React Web Frontend (Unified Architecture) ───────────────────────────
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse

build_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "build")

if os.path.exists(build_dir):
    # Mount static assets for /emolit/static (old subpath compatibility)
    app.mount("/emolit/static", StaticFiles(directory=os.path.join(build_dir, "static")), name="emolit_static")
    # Mount static assets for /static (root path compatibility)
    app.mount("/static", StaticFiles(directory=os.path.join(build_dir, "static")), name="static")

@app.api_route("/emolit/{catchall:path}", methods=["GET", "HEAD"])
@app.api_route("/{catchall:path}", methods=["GET", "HEAD"])
async def serve_react_app(catchall: str = ""):
    if not os.path.exists(build_dir):
        return JSONResponse(status_code=404, content={"message": "Frontend build directory not found. Please compile the React project."})
    
    clean_path = catchall
    if catchall.startswith("emolit/"):
        clean_path = catchall[len("emolit/"):]
    elif catchall == "emolit":
        clean_path = ""
        
    asset_path = os.path.join(build_dir, clean_path)
    if clean_path and os.path.exists(asset_path) and os.path.isfile(asset_path):
        return FileResponse(asset_path)
        
    return FileResponse(os.path.join(build_dir, "index.html"))
