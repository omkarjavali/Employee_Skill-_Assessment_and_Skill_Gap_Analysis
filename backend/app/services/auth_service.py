from datetime import datetime

from sqlalchemy.orm import Session

from app.models.user import User

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)


# =========================================================
# REGISTER
# =========================================================

def register_user(
    db: Session,
    name: str,
    email: str,
    password: str,
    role_id: int
):

    normalized_email = (
        email.strip().lower()
    )

    # -----------------------------------------------------
    # Validate password BEFORE bcrypt
    # -----------------------------------------------------

    if len(password.encode("utf-8")) > 72:

        raise ValueError(
            "Password must not exceed 72 bytes"
        )

    if len(password) < 8:

        raise ValueError(
            "Password must be at least 8 characters"
        )

    # -----------------------------------------------------
    # Check existing user
    # -----------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email
            == normalized_email
        )
        .first()
    )

    if existing_user:

        raise ValueError(
            "An account with this email already exists"
        )

    # -----------------------------------------------------
    # Hash password
    # -----------------------------------------------------

    password_hash = hash_password(
        password
    )

    # -----------------------------------------------------
    # Create user
    # -----------------------------------------------------

    user = User(
        name=name.strip(),
        email=normalized_email,
        password_hash=password_hash,

        # Application/user type
        role="EMPLOYEE",

        # Business role
        role_id=role_id,

        created_at=datetime.utcnow()
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    return user


# =========================================================
# LOGIN
# =========================================================

def authenticate_user(
    db: Session,
    email: str,
    password: str
):

    normalized_email = (
        email.strip().lower()
    )

    user = (
        db.query(User)
        .filter(
            User.email
            == normalized_email
        )
        .first()
    )

    if not user:

        raise ValueError(
            "Invalid email or password"
        )

    if not verify_password(
        password,
        user.password_hash
    ):

        raise ValueError(
            "Invalid email or password"
        )

    # -----------------------------------------------------
    # Create JWT
    # -----------------------------------------------------

    access_token = create_access_token({

        "sub": str(user.id),

        "email": user.email,

        "role": user.role,

        "role_id": user.role_id

    })

    return user, access_token