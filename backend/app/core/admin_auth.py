from fastapi import (
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


security = HTTPBearer(
    auto_error=False
)


# =========================================================
# GET CURRENT USER
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None =
        Depends(security),

    db: Session =
        Depends(get_db)
):

    # -----------------------------------------------------
    # Authorization header
    # -----------------------------------------------------

    if not credentials:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )


    token = credentials.credentials.strip()


    if not token:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )


    # -----------------------------------------------------
    # Decode JWT
    # -----------------------------------------------------

    try:

        payload = decode_access_token(
            token
        )

    except ValueError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


    # -----------------------------------------------------
    # Get user ID
    # -----------------------------------------------------

    user_id = payload.get(
        "sub"
    )


    if not user_id:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )


    # -----------------------------------------------------
    # Validate user ID
    # -----------------------------------------------------

    try:

        user_id = int(
            user_id
        )

    except (
        TypeError,
        ValueError
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )


    # -----------------------------------------------------
    # Get user from database
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )


    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )


    return user


# =========================================================
# REQUIRE ADMIN
# =========================================================

def require_admin(
    current_user: User =
        Depends(get_current_user)
):

    if (
        not current_user.role
        or current_user.role.upper() != "ADMIN"
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )


    return current_user