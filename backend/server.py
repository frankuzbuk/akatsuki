from pathlib import Path
from dotenv import load_dotenv

# Load env vars FIRST before any other imports
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, File, UploadFile, Header, Query, Body
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import os
import logging
import uuid
import bcrypt
import jwt
import requests
import secrets
import httpx
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# ============== CONFIGURATION ==============
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@animestream.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Admin@123456')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Storage API
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "anime-stream"
storage_key = None

# Subscription packages
SUBSCRIPTION_PACKAGES = {
    "monthly": {"name": "Monthly Premium", "price": 9.99, "duration_days": 30},
    "yearly": {"name": "Yearly Premium", "price": 99.99, "duration_days": 365}
}

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== STORAGE FUNCTIONS ==============
def init_storage():
    """Initialize storage - call once at startup"""
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": EMERGENT_LLM_KEY},
            timeout=30
        )
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=300
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple[bytes, str]:
    """Download file from storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ============== PASSWORD HASHING ==============
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# ============== JWT TOKEN FUNCTIONS ==============
def create_access_token(user_id: str, email: str) -> str:
    """Create access token (15 minutes)"""
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    """Create refresh token (7 days)"""
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ============== AUTH HELPER ==============
async def get_current_user(request: Request) -> dict:
    """Get current authenticated user"""
    # Try to get token from cookie first
    token = request.cookies.get("access_token")
    
    # Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(request: Request) -> dict:
    """Get current authenticated admin user"""
    user = await get_current_user(request)
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== PYDANTIC MODELS ==============
# User Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    email: str
    role: str = "user"
    avatar: Optional[str] = None
    is_premium: bool = False
    is_banned: bool = False
    subscription_status: Optional[str] = None
    subscription_end_date: Optional[datetime] = None
    created_at: datetime

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

# Google OAuth Models
class GoogleSessionCreate(BaseModel):
    session_id: str

# Anime Models
class AnimeCreate(BaseModel):
    title: str
    title_english: Optional[str] = None
    title_japanese: Optional[str] = None
    description: str
    genres: List[str]
    year: int
    status: str = "ongoing"
    rating: float = 0.0
    cover_image: str
    banner_image: Optional[str] = None
    trailer_url: Optional[str] = None
    total_episodes: Optional[int] = None

class Anime(BaseModel):
    id: str
    title: str
    title_english: Optional[str] = None
    title_japanese: Optional[str] = None
    description: str
    genres: List[str]
    year: int
    status: str
    rating: float
    cover_image: str
    banner_image: Optional[str] = None
    trailer_url: Optional[str] = None
    total_episodes: Optional[int] = None
    view_count: int = 0
    created_at: datetime
    updated_at: datetime

# Episode Models
class EpisodeCreate(BaseModel):
    anime_id: str
    episode_number: int
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None

class Episode(BaseModel):
    id: str
    anime_id: str
    episode_number: int
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    view_count: int = 0
    created_at: datetime

# Comment Models
class CommentCreate(BaseModel):
    anime_id: str
    episode_id: Optional[str] = None
    text: str

class Comment(BaseModel):
    id: str
    anime_id: str
    episode_id: Optional[str] = None
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    text: str
    created_at: datetime

# Admin Models
class UserBan(BaseModel):
    user_id: str
    reason: str
    duration: Optional[int] = None

class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "admin"

# Payment Models
class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str

# ============== STARTUP/SHUTDOWN ==============
@app.on_event("startup")
async def startup():
    """Run on app startup"""
    logger.info("Starting up...")
    
    # Initialize storage
    try:
        init_storage()
    except Exception as e:
        logger.error(f"Storage initialization failed: {e}")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.anime.create_index("id", unique=True)
    await db.episodes.create_index("id", unique=True)
    await db.episodes.create_index([("anime_id", 1), ("episode_number", 1)])
    
    # Seed admin
    await seed_admin()
    
    logger.info("Startup complete")

async def seed_admin():
    """Seed admin user"""
    try:
        existing = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
        
        if existing is None:
            admin_id = str(uuid.uuid4())
            hashed = hash_password(ADMIN_PASSWORD)
            await db.users.insert_one({
                "id": admin_id,
                "email": ADMIN_EMAIL,
                "password_hash": hashed,
                "name": "Admin",
                "role": "super_admin",
                "avatar": None,
                "is_premium": True,
                "is_banned": False,
                "created_at": datetime.now(timezone.utc)
            })
            logger.info(f"Admin user created: {ADMIN_EMAIL}")
        elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
            await db.users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
            )
            logger.info("Admin password updated")
        
        # Write credentials
        Path("/app/memory").mkdir(exist_ok=True)
        with open("/app/memory/test_credentials.md", "w") as f:
            f.write("# Test Credentials\n\n")
            f.write("## Admin Account\n")
            f.write(f"- Email: {ADMIN_EMAIL}\n")
            f.write(f"- Password: {ADMIN_PASSWORD}\n")
            f.write(f"- Role: super_admin\n\n")
            f.write("## Endpoints\n")
            f.write("- POST /api/auth/register\n")
            f.write("- POST /api/auth/login\n")
            f.write("- GET /api/auth/me\n")
            f.write("- POST /api/auth/logout\n")
    except Exception as e:
        logger.error(f"Admin seeding failed: {e}")

@app.on_event("shutdown")
async def shutdown():
    """Run on app shutdown"""
    client.close()

# ============== AUTH ENDPOINTS ==============
@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
    """Register new user"""
    email = user_data.email.lower()
    
    # Check if user exists
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed = hash_password(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hashed,
        "name": user_data.name,
        "role": "user",
        "avatar": None,
        "is_premium": False,
        "is_banned": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Create tokens
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=900,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    user_doc.pop("password_hash")
    user_doc.pop("_id", None)
    return user_doc

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response, request: Request):
    """Login user"""
    email = credentials.email.lower()
    
    # Find user
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if banned
    if user.get("is_banned"):
        raise HTTPException(status_code=403, detail="Account is banned")
    
    # Check brute force
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempts = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    
    if attempts and attempts.get("count", 0) >= 5:
        lockout_until = attempts.get("locked_until")
        if lockout_until and lockout_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later")
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {
                    "locked_until": datetime.now(timezone.utc) + timedelta(minutes=15),
                    "last_attempt": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Clear failed attempts
    await db.login_attempts.delete_one({"identifier": identifier})
    
    # Create tokens
    access_token = create_access_token(user["id"], email)
    refresh_token = create_refresh_token(user["id"])
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=900,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    user.pop("password_hash")
    return user

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user"""
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    """Logout user"""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    """Refresh access token"""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Create new access token
        access_token = create_access_token(user["id"], user["email"])
        
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=900,
            path="/"
        )
        
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/forgot-password")
async def forgot_password(data: PasswordResetRequest):
    """Request password reset"""
    email = data.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If email exists, reset link will be sent"}
    
    # Generate reset token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": user["id"],
        "expires_at": expires_at,
        "used": False
    })
    
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    logger.info(f"Password reset link: {reset_link}")
    
    return {"message": "If email exists, reset link will be sent"}

@api_router.post("/auth/reset-password")
async def reset_password(data: PasswordReset):
    """Reset password"""
    # Find token
    token_doc = await db.password_reset_tokens.find_one({"token": data.token}, {"_id": 0})
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    if token_doc.get("used"):
        raise HTTPException(status_code=400, detail="Token already used")
    
    if token_doc["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    
    # Update password
    hashed = hash_password(data.new_password)
    await db.users.update_one(
        {"id": token_doc["user_id"]},
        {"$set": {"password_hash": hashed}}
    )
    
    # Mark token as used
    await db.password_reset_tokens.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successful"}

# ============== GOOGLE OAUTH ENDPOINTS ==============
@api_router.post("/auth/google/session")
async def google_session(data: GoogleSessionCreate, response: Response):
    """Create session from Google OAuth"""
    try:
        # Call Emergent Auth API
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": data.session_id},
                timeout=30
            )
            resp.raise_for_status()
            session_data = resp.json()
        
        # Check if user exists
        user = await db.users.find_one({"email": session_data["email"]}, {"_id": 0})
        
        if not user:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "email": session_data["email"],
                "name": session_data["name"],
                "avatar": session_data.get("picture"),
                "role": "user",
                "is_premium": False,
                "is_banned": False,
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(user)
            user.pop("_id")
        
        # Check if banned
        if user.get("is_banned"):
            raise HTTPException(status_code=403, detail="Account is banned")
        
        # Create session
        session_token = session_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.insert_one({
            "user_id": user.get("user_id") or user["id"],
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=604800,
            path="/"
        )
        
        user.pop("password_hash", None)
        return user
    except httpx.HTTPError as e:
        logger.error(f"Google OAuth error: {e}")
        raise HTTPException(status_code=400, detail="Invalid session ID")

@api_router.get("/auth/google/me")
async def google_me(request: Request):
    """Get current Google OAuth user"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    user.pop("password_hash", None)
    return user

@api_router.post("/auth/google/logout")
async def google_logout(request: Request, response: Response):
    """Logout Google OAuth user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============== ANIME ENDPOINTS ==============
@api_router.get("/anime")
async def get_anime_list(
    page: int = 1,
    limit: int = 20,
    genre: Optional[str] = None,
    status: Optional[str] = None,
    year: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at"
):
    """Get anime list with filters"""
    skip = (page - 1) * limit
    query = {}
    
    if genre:
        query["genres"] = genre
    if status:
        query["status"] = status
    if year:
        query["year"] = year
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"title_english": {"$regex": search, "$options": "i"}},
            {"title_japanese": {"$regex": search, "$options": "i"}}
        ]
    
    sort_order = -1 if sort_by in ["rating", "view_count", "created_at"] else 1
    
    anime_list = await db.anime.find(query, {"_id": 0}).sort(sort_by, sort_order).skip(skip).limit(limit).to_list(limit)
    total = await db.anime.count_documents(query)
    
    return {
        "anime": anime_list,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/anime/trending")
async def get_trending_anime(limit: int = 10):
    """Get trending anime"""
    anime_list = await db.anime.find({}, {"_id": 0}).sort("view_count", -1).limit(limit).to_list(limit)
    return anime_list

@api_router.get("/anime/latest")
async def get_latest_anime(limit: int = 10):
    """Get latest anime"""
    anime_list = await db.anime.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return anime_list

@api_router.get("/anime/{anime_id}")
async def get_anime(anime_id: str):
    """Get anime by ID"""
    anime = await db.anime.find_one({"id": anime_id}, {"_id": 0})
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    
    # Increment view count
    await db.anime.update_one({"id": anime_id}, {"$inc": {"view_count": 1}})
    anime["view_count"] = anime.get("view_count", 0) + 1
    
    return anime

@api_router.post("/anime", dependencies=[Depends(get_current_admin)])
async def create_anime(anime_data: AnimeCreate, request: Request):
    """Create new anime (admin only)"""
    anime_id = str(uuid.uuid4())
    
    anime_doc = {
        "id": anime_id,
        **anime_data.model_dump(),
        "view_count": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.anime.insert_one(anime_doc)
    anime_doc.pop("_id")
    
    return anime_doc

@api_router.put("/anime/{anime_id}", dependencies=[Depends(get_current_admin)])
async def update_anime(anime_id: str, anime_data: AnimeCreate, request: Request):
    """Update anime (admin only)"""
    anime = await db.anime.find_one({"id": anime_id}, {"_id": 0})
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    
    await db.anime.update_one(
        {"id": anime_id},
        {"$set": {**anime_data.model_dump(), "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Anime updated successfully"}

@api_router.delete("/anime/{anime_id}", dependencies=[Depends(get_current_admin)])
async def delete_anime(anime_id: str, request: Request):
    """Delete anime (admin only)"""
    await db.anime.delete_one({"id": anime_id})
    await db.episodes.delete_many({"anime_id": anime_id})
    return {"message": "Anime deleted successfully"}

# ============== EPISODE ENDPOINTS ==============
@api_router.get("/anime/{anime_id}/episodes")
async def get_episodes(anime_id: str):
    """Get episodes for anime"""
    episodes = await db.episodes.find({"anime_id": anime_id}, {"_id": 0}).sort("episode_number", 1).to_list(1000)
    return episodes

@api_router.get("/episodes/{episode_id}")
async def get_episode(episode_id: str):
    """Get episode by ID"""
    episode = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Increment view count
    await db.episodes.update_one({"id": episode_id}, {"$inc": {"view_count": 1}})
    episode["view_count"] = episode.get("view_count", 0) + 1
    
    return episode

@api_router.post("/episodes", dependencies=[Depends(get_current_admin)])
async def create_episode(episode_data: EpisodeCreate, request: Request):
    """Create new episode (admin only)"""
    episode_id = str(uuid.uuid4())
    
    episode_doc = {
        "id": episode_id,
        **episode_data.model_dump(),
        "video_url": None,
        "thumbnail": None,
        "view_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.episodes.insert_one(episode_doc)
    episode_doc.pop("_id")
    
    return episode_doc

@api_router.post("/episodes/{episode_id}/upload-video", dependencies=[Depends(get_current_admin)])
async def upload_video(episode_id: str, file: UploadFile = File(...), request: Request = None):
    """Upload video for episode (admin only)"""
    episode = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Validate file type
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Upload to storage
    ext = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    path = f"{APP_NAME}/videos/{episode['anime_id']}/{episode_id}.{ext}"
    
    data = await file.read()
    result = put_object(path, data, file.content_type)
    
    # Update episode
    video_url = f"/api/files/{result['path']}"
    await db.episodes.update_one(
        {"id": episode_id},
        {"$set": {"video_url": video_url}}
    )
    
    return {"message": "Video uploaded successfully", "video_url": video_url}

@api_router.post("/episodes/{episode_id}/upload-thumbnail", dependencies=[Depends(get_current_admin)])
async def upload_thumbnail(episode_id: str, file: UploadFile = File(...), request: Request = None):
    """Upload thumbnail for episode (admin only)"""
    episode = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Upload to storage
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/thumbnails/{episode['anime_id']}/{episode_id}.{ext}"
    
    data = await file.read()
    result = put_object(path, data, file.content_type)
    
    # Update episode
    thumbnail_url = f"/api/files/{result['path']}"
    await db.episodes.update_one(
        {"id": episode_id},
        {"$set": {"thumbnail": thumbnail_url}}
    )
    
    return {"message": "Thumbnail uploaded successfully", "thumbnail_url": thumbnail_url}

@api_router.delete("/episodes/{episode_id}", dependencies=[Depends(get_current_admin)])
async def delete_episode(episode_id: str, request: Request):
    """Delete episode (admin only)"""
    await db.episodes.delete_one({"id": episode_id})
    return {"message": "Episode deleted successfully"}

# ============== FILE SERVE ENDPOINT ==============
@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    """Serve file from storage"""
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception as e:
        logger.error(f"File serve error: {e}")
        raise HTTPException(status_code=404, detail="File not found")

# ============== COMMENT ENDPOINTS ==============
@api_router.get("/comments/{anime_id}")
async def get_comments(anime_id: str, episode_id: Optional[str] = None):
    """Get comments for anime/episode"""
    query = {"anime_id": anime_id}
    if episode_id:
        query["episode_id"] = episode_id
    
    comments = await db.comments.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return comments

@api_router.post("/comments", dependencies=[Depends(get_current_user)])
async def create_comment(comment_data: CommentCreate, request: Request):
    """Create comment"""
    user = await get_current_user(request)
    
    comment_id = str(uuid.uuid4())
    comment_doc = {
        "id": comment_id,
        **comment_data.model_dump(),
        "user_id": user["id"],
        "user_name": user["name"],
        "user_avatar": user.get("avatar"),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.comments.insert_one(comment_doc)
    comment_doc.pop("_id")
    
    return comment_doc

@api_router.delete("/comments/{comment_id}", dependencies=[Depends(get_current_user)])
async def delete_comment(comment_id: str, request: Request):
    """Delete comment"""
    user = await get_current_user(request)
    
    comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment["user_id"] != user["id"] and user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.comments.delete_one({"id": comment_id})
    return {"message": "Comment deleted successfully"}

# ============== USER WATCHLIST/FAVORITES ==============
@api_router.get("/user/watchlist", dependencies=[Depends(get_current_user)])
async def get_watchlist(request: Request):
    """Get user's watchlist"""
    user = await get_current_user(request)
    
    watchlist = await db.watchlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    anime_ids = [item["anime_id"] for item in watchlist]
    
    anime_list = await db.anime.find({"id": {"$in": anime_ids}}, {"_id": 0}).to_list(1000)
    return anime_list

@api_router.post("/user/watchlist", dependencies=[Depends(get_current_user)])
async def add_to_watchlist(data: Dict[str, str], request: Request):
    """Add anime to watchlist"""
    user = await get_current_user(request)
    anime_id = data.get("anime_id")
    
    # Check if already in watchlist
    existing = await db.watchlist.find_one({"user_id": user["id"], "anime_id": anime_id}, {"_id": 0})
    if existing:
        return {"message": "Already in watchlist"}
    
    await db.watchlist.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "anime_id": anime_id,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Added to watchlist"}

@api_router.delete("/user/watchlist/{anime_id}", dependencies=[Depends(get_current_user)])
async def remove_from_watchlist(anime_id: str, request: Request):
    """Remove anime from watchlist"""
    user = await get_current_user(request)
    await db.watchlist.delete_one({"user_id": user["id"], "anime_id": anime_id})
    return {"message": "Removed from watchlist"}

@api_router.get("/user/favorites", dependencies=[Depends(get_current_user)])
async def get_favorites(request: Request):
    """Get user's favorites"""
    user = await get_current_user(request)
    
    favorites = await db.favorites.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    anime_ids = [item["anime_id"] for item in favorites]
    
    anime_list = await db.anime.find({"id": {"$in": anime_ids}}, {"_id": 0}).to_list(1000)
    return anime_list

@api_router.post("/user/favorites", dependencies=[Depends(get_current_user)])
async def add_to_favorites(data: Dict[str, str], request: Request):
    """Add anime to favorites"""
    user = await get_current_user(request)
    anime_id = data.get("anime_id")
    
    existing = await db.favorites.find_one({"user_id": user["id"], "anime_id": anime_id}, {"_id": 0})
    if existing:
        return {"message": "Already in favorites"}
    
    await db.favorites.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "anime_id": anime_id,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Added to favorites"}

@api_router.delete("/user/favorites/{anime_id}", dependencies=[Depends(get_current_user)])
async def remove_from_favorites(anime_id: str, request: Request):
    """Remove anime from favorites"""
    user = await get_current_user(request)
    await db.favorites.delete_one({"user_id": user["id"], "anime_id": anime_id})
    return {"message": "Removed from favorites"}

# ============== WATCH HISTORY ==============
@api_router.post("/user/watch-history", dependencies=[Depends(get_current_user)])
async def add_watch_history(data: Dict[str, Any], request: Request):
    """Add watch history"""
    user = await get_current_user(request)
    
    anime_id = data.get("anime_id")
    episode_id = data.get("episode_id")
    progress = data.get("progress", 0)
    
    await db.watch_history.update_one(
        {"user_id": user["id"], "anime_id": anime_id, "episode_id": episode_id},
        {
            "$set": {
                "progress": progress,
                "watched_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    return {"message": "Watch history updated"}

@api_router.get("/user/watch-history", dependencies=[Depends(get_current_user)])
async def get_watch_history(request: Request):
    """Get watch history"""
    user = await get_current_user(request)
    
    history = await db.watch_history.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("watched_at", -1).limit(50).to_list(50)
    
    return history

# ============== ADMIN ENDPOINTS ==============
@api_router.post("/admin/create", dependencies=[Depends(get_current_admin)])
async def create_admin(admin_data: AdminCreate, request: Request):
    """Create new admin (super_admin only)"""
    current_admin = await get_current_admin(request)
    
    if current_admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    email = admin_data.email.lower()
    
    # Check if user exists
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create admin
    admin_id = str(uuid.uuid4())
    hashed = hash_password(admin_data.password)
    
    admin_doc = {
        "id": admin_id,
        "email": email,
        "password_hash": hashed,
        "name": admin_data.name,
        "role": admin_data.role,
        "avatar": None,
        "is_premium": True,
        "is_banned": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(admin_doc)
    admin_doc.pop("password_hash")
    admin_doc.pop("_id")
    
    return admin_doc

@api_router.post("/admin/ban-user", dependencies=[Depends(get_current_admin)])
async def ban_user(ban_data: UserBan, request: Request):
    """Ban user (admin only)"""
    user = await db.users.find_one({"id": ban_data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Cannot ban admin users")
    
    # Ban user
    await db.users.update_one(
        {"id": ban_data.user_id},
        {"$set": {"is_banned": True}}
    )
    
    # Log ban
    await db.user_bans.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": ban_data.user_id,
        "reason": ban_data.reason,
        "duration": ban_data.duration,
        "banned_at": datetime.now(timezone.utc),
        "banned_until": datetime.now(timezone.utc) + timedelta(hours=ban_data.duration) if ban_data.duration else None
    })
    
    return {"message": "User banned successfully"}

@api_router.post("/admin/unban-user", dependencies=[Depends(get_current_admin)])
async def unban_user(data: Dict[str, str], request: Request):
    """Unban user (admin only)"""
    user_id = data.get("user_id")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_banned": False}}
    )
    
    return {"message": "User unbanned successfully"}

@api_router.get("/admin/users", dependencies=[Depends(get_current_admin)])
async def get_users(request: Request, page: int = 1, limit: int = 20):
    """Get all users (admin only)"""
    skip = (page - 1) * limit
    
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.users.count_documents({})
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/admin/analytics", dependencies=[Depends(get_current_admin)])
async def get_analytics(request: Request):
    """Get analytics (admin only)"""
    total_users = await db.users.count_documents({})
    total_anime = await db.anime.count_documents({})
    total_episodes = await db.episodes.count_documents({})
    total_comments = await db.comments.count_documents({})
    premium_users = await db.users.count_documents({"is_premium": True})
    
    return {
        "total_users": total_users,
        "total_anime": total_anime,
        "total_episodes": total_episodes,
        "total_comments": total_comments,
        "premium_users": premium_users
    }

# ============== STRIPE PAYMENT ENDPOINTS ==============
@api_router.post("/payments/checkout")
async def create_checkout(data: CheckoutRequest, request: Request):
    """Create Stripe checkout session"""
    user = await get_current_user(request)
    
    # Get package
    if data.package_id not in SUBSCRIPTION_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package = SUBSCRIPTION_PACKAGES[data.package_id]
    amount = package["price"]
    
    # Create URLs
    success_url = f"{data.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/pricing"
    
    # Create Stripe checkout
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "package_id": data.package_id,
            "duration_days": str(package["duration_days"])
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Store transaction
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["id"],
        "package_id": data.package_id,
        "amount": amount,
        "currency": "usd",
        "status": "pending",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    """Get payment status"""
    user = await get_current_user(request)
    
    # Get transaction
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If already processed, return status
    if transaction["payment_status"] == "paid":
        return transaction
    
    # Check with Stripe
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "status": status.status,
                "payment_status": status.payment_status,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # If paid, activate premium
    if status.payment_status == "paid" and transaction["payment_status"] != "paid":
        package_id = transaction["package_id"]
        package = SUBSCRIPTION_PACKAGES[package_id]
        
        subscription_end = datetime.now(timezone.utc) + timedelta(days=package["duration_days"])
        
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "is_premium": True,
                    "subscription_status": "active",
                    "subscription_end_date": subscription_end
                }
            }
        )
    
    transaction["status"] = status.status
    transaction["payment_status"] = status.payment_status
    
    return transaction

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": webhook_response.session_id},
            {
                "$set": {
                    "status": webhook_response.event_type,
                    "payment_status": webhook_response.payment_status,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/admin/update-payment-method", dependencies=[Depends(get_current_admin)])
async def update_payment_method(data: Dict[str, str], request: Request):
    """Update user payment method (admin only)"""
    # This would require Stripe Customer Portal integration
    # For now, just return a placeholder
    return {"message": "Payment method update not yet implemented"}

# ============== EXTERNAL API INTEGRATION ==============
@api_router.get("/external/jikan/{mal_id}")
async def get_jikan_anime(mal_id: int):
    """Get anime from Jikan API"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://api.jikan.moe/v4/anime/{mal_id}", timeout=10)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"Jikan API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch from Jikan API")

@api_router.get("/external/anilist/{anilist_id}")
async def get_anilist_anime(anilist_id: int):
    """Get anime from AniList API"""
    query = '''
    query ($id: Int) {
        Media (id: $id, type: ANIME) {
            id
            title {
                romaji
                english
                native
            }
            description
            genres
            seasonYear
            status
            averageScore
            coverImage {
                large
            }
            bannerImage
        }
    }
    '''
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://graphql.anilist.co",
                json={"query": query, "variables": {"id": anilist_id}},
                timeout=10
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"AniList API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch from AniList API")

# ============== INCLUDE ROUTER & MIDDLEWARE ==============
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
