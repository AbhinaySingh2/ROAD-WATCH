import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)

def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)

def get_admin_identity() -> tuple[str, str]:
    """
    Returns (admin_email, admin_password_hash).

    Notes:
    - For development/hackathon, `ADMIN_PASSWORD` may be set directly.
    - For production, set `ADMIN_PASSWORD_HASH` and keep `ADMIN_PASSWORD` unset.
    """
    email = settings.ADMIN_EMAIL
    # Prefer hash if provided, otherwise hash the provided password
    password_hash = getattr(settings, "ADMIN_PASSWORD_HASH", None)  # type: ignore[attr-defined]
    if password_hash:
        return email, password_hash

    # If no explicit hash is configured, hash the configured password.
    return email, hash_password(settings.ADMIN_PASSWORD)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    payload = verify_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload["sub"]
