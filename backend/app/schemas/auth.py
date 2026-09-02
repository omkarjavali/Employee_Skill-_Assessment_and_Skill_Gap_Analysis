from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    EmailStr,
    Field
)


# =========================================================
# REGISTER
# =========================================================

class RegisterRequest(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=72
    )

    role_id: int

# =========================================================
# LOGIN
# =========================================================

class LoginRequest(BaseModel):

    email: EmailStr

    password: str


# =========================================================
# USER RESPONSE
# =========================================================

class UserResponse(BaseModel):

    id: int

    name: str

    email: str

    role: str

    role_id: Optional[int] = None

    created_at: datetime


# =========================================================
# AUTH RESPONSE
# =========================================================

class AuthResponse(BaseModel):

    access_token: str

    token_type: str

    user: UserResponse