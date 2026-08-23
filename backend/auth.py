import hashlib
import os
import secrets
import json
import base64
import time
from typing import Optional
from fastapi import Header, HTTPException, Depends, status
from sqlalchemy.orm import Session
import models
from database import get_db

SECRET_KEY = os.environ.get("AEGIS_SECRET_KEY", "aegisaml_super_secret_jwt_key_2026_production")
TOKEN_EXPIRY_SECONDS = 86400 * 7 # 7 days

def hash_password(password: str) -> str:
    """Hash password using PBKDF2 with SHA-256 and a random 16-byte salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against stored salt and key."""
    try:
        parts = hashed_password.split('$')
        if len(parts) != 2:
            return False
        salt, key_hex = parts
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return secrets.compare_digest(key.hex(), key_hex)
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    """Create a signed base64 token with expiration and HMAC signature."""
    payload = data.copy()
    payload["exp"] = int(time.time()) + TOKEN_EXPIRY_SECONDS
    payload_json = json.dumps(payload, sort_keys=True)
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode('utf-8')).decode('utf-8').rstrip('=')
    
    sig = hashlib.sha256(f"{payload_b64}.{SECRET_KEY}".encode('utf-8')).hexdigest()
    return f"{payload_b64}.{sig}"

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify token signature and expiry."""
    try:
        parts = token.strip().split('.')
        if len(parts) != 2:
            return None
        payload_b64, sig = parts
        expected_sig = hashlib.sha256(f"{payload_b64}.{SECRET_KEY}".encode('utf-8')).hexdigest()
        if not secrets.compare_digest(sig, expected_sig):
            return None
        
        # Add padding back if necessary
        padded_b64 = payload_b64 + '=' * (-len(payload_b64) % 4)
        payload_json = base64.urlsafe_b64decode(padded_b64.encode('utf-8')).decode('utf-8')
        payload = json.loads(payload_json)
        
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None

def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """Extract and return the authenticated User if Authorization header is provided, else None."""
    if not authorization:
        return None
    token = authorization
    if authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    
    user_id = payload["sub"]
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> models.User:
    """Require valid authenticated user."""
    user = get_current_user_optional(authorization=authorization, db=db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required or invalid session token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user
