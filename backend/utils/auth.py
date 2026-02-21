from typing import Optional
import os
from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.models.user import User

SECRET_KEY = os.getenv("SECRET_KEY", "secret123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def _decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    """Simple dependency that extracts a bearer token from Authorization
    header, decodes it and returns the corresponding User model.

    This is intentionally lightweight for local development. In production
    you'd verify token expiry, scopes and use proper error responses.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    token = parts[1]
    payload = _decode_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(payload["user_id"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def get_current_user_optional(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    """Similar to get_current_user but returns None if no valid token is present."""
    if not authorization:
        return None

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    try:
        token = parts[1]
        payload = _decode_token(token)
        if not payload or "user_id" not in payload:
            return None

        user = db.query(User).filter(User.id == int(payload["user_id"])).first()
        return user
    except Exception:
        return None

from fastapi.security import OAuth2PasswordBearer

# Note: The tokenUrl should match your login route.
# In routers/auth.py, the login route is usually /auth/login or /api/auth/login
# Here we use relative path or absolute path as needed by Swagger UI.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user_object(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current user object from JWT token. Returns User model instance for use in dependencies.
    
    Moved here from routers/auth.py to avoid circular imports.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user
