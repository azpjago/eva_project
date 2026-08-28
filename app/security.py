# app/security.py
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

SECRET_KEY = "SUPER_SECRET_KEY_KEMNAKER_EVA_AI"  # Ganti dengan secret key aman di produksi
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 hari


def hash_password(password: str) -> str:
    # Panggil bcrypt langsung (bukan lewat passlib) — menghindari bug
    # kompatibilitas passlib 1.7.x dengan bcrypt >= 4.1.
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
