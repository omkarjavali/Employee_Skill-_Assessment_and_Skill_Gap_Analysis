from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


# =========================================================
# PASSWORD HASHING
# =========================================================

def hash_password(
    password: str
) -> str:

    password_bytes = password.encode(
        "utf-8"
    )

    # bcrypt supports a maximum of 72 bytes
    if len(password_bytes) > 72:

        raise ValueError(
            "Password must not exceed 72 bytes"
        )

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode(
        "utf-8"
    )


def verify_password(
    plain_password: str,
    password_hash: str
) -> bool:

    password_bytes = plain_password.encode(
        "utf-8"
    )

    if len(password_bytes) > 72:

        return False

    return bcrypt.checkpw(
        password_bytes,
        password_hash.encode(
            "utf-8"
        )
    )


# =========================================================
# JWT
# =========================================================

def create_access_token(
    data: dict
) -> str:

    payload = data.copy()

    expire = (
        datetime.now(
            timezone.utc
        )
        + timedelta(
            minutes=
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload["exp"] = expire

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )


def decode_access_token(
    token: str
) -> dict:

    try:

        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[
                settings.JWT_ALGORITHM
            ]
        )

        return payload

    except JWTError as exc:

        print(
            "🔥 JWT DECODE ERROR:",
            type(exc).__name__,
            str(exc)
        )

        raise ValueError(
            "Invalid or expired token"
        )