"""Auth API - Register, Login, JWT, Refresh, Profile"""
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from database.connection import get_session
from database.models import User, Workspace
from dependencies import get_current_user, get_db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# === Schemas ===
class RegisterRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8)
    preferred_language: str = "en"
    timezone: str = "Asia/Dhaka"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class UpdateProfileRequest(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    preferred_language: str | None = None
    timezone: str | None = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

# === Helpers ===
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: UUID) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire, "type": "access"}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(user_id: UUID) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire, "type": "refresh"}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

# === Routes ===
@router.post("/register", status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with default workspace."""
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Email already registered")

    user = User(
        email=req.email,
        name=req.name,
        password_hash=hash_password(req.password),
        preferred_language=req.preferred_language,
        timezone=req.timezone,
    )
    db.add(user)
    await db.flush()

    # Create default workspace
    workspace = Workspace(user_id=user.id, name="Personal Workspace", description="Your default workspace", industry="general", is_default=True)
    db.add(workspace)
    await db.flush()

    return {
        "user": {"id": str(user.id), "email": user.email, "name": user.name, "preferred_language": user.preferred_language, "timezone": user.timezone, "is_active": user.is_active, "created_at": user.created_at.isoformat()},
        "tokens": {"access_token": create_access_token(user.id), "refresh_token": create_refresh_token(user.id), "token_type": "bearer", "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60},
    }

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(403, "Account deactivated")

    return {
        "user": {"id": str(user.id), "email": user.email, "name": user.name, "preferred_language": user.preferred_language, "timezone": user.timezone, "is_active": user.is_active, "created_at": user.created_at.isoformat()},
        "tokens": {"access_token": create_access_token(user.id), "refresh_token": create_refresh_token(user.id), "token_type": "bearer", "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60},
    }

@router.post("/refresh")
async def refresh_token(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token."""
    try:
        payload = jwt.decode(req.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
        user_id = UUID(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(401, "User not found")
        return {"access_token": create_access_token(user.id), "refresh_token": create_refresh_token(user.id), "token_type": "bearer", "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60}
    except JWTError:
        raise HTTPException(401, "Invalid refresh token")

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return {"id": str(current_user.id), "email": current_user.email, "name": current_user.name, "avatar_url": current_user.avatar_url, "preferred_language": current_user.preferred_language, "timezone": current_user.timezone, "is_active": current_user.is_active, "created_at": current_user.created_at.isoformat()}

@router.patch("/me")
async def update_me(req: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Update profile."""
    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    current_user.updated_at = datetime.utcnow()
    db.add(current_user)
    await db.flush()
    return {"id": str(current_user.id), "email": current_user.email, "name": current_user.name, "avatar_url": current_user.avatar_url, "preferred_language": current_user.preferred_language, "timezone": current_user.timezone}

@router.post("/change-password", status_code=204)
async def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Change password."""
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    current_user.password_hash = hash_password(req.new_password)
    current_user.updated_at = datetime.utcnow()
    db.add(current_user)
