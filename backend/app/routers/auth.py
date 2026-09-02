from fastapi import (
    APIRouter,
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

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserResponse
)

from app.services.auth_service import (
    register_user,
    authenticate_user
)

from app.core.security import (
    create_access_token,
    decode_access_token
)

from app.models.user import User
from app.models.role import Role


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


security = HTTPBearer()


# =========================================================
# REGISTER
# =========================================================

@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):

    try:

        # -------------------------------------------------
        # Verify selected business role
        # -------------------------------------------------

        role = (
            db.query(Role)
            .filter(
                Role.id == request.role_id
            )
            .first()
        )

        if not role:

            raise ValueError(
                "Selected role does not exist"
            )

        # -------------------------------------------------
        # Create user
        # -------------------------------------------------

        user = register_user(
            db=db,
            name=request.name,
            email=request.email,
            password=request.password,
            role_id=request.role_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    # -----------------------------------------------------
    # Automatically log user in
    # -----------------------------------------------------

    access_token = create_access_token({

        "sub": str(user.id),

        "email": user.email,

        "role": user.role,

        "role_id": user.role_id

    })

    return {

        "access_token": access_token,

        "token_type": "bearer",

        "user": user

    }


# =========================================================
# LOGIN
# =========================================================

@router.post(
    "/login",
    response_model=AuthResponse
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    try:

        user, access_token = (
            authenticate_user(
                db=db,
                email=request.email,
                password=request.password
            )
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=401,
            detail=str(exc)
        )

    return {

        "access_token": access_token,

        "token_type": "bearer",

        "user": user

    }


# =========================================================
# CURRENT USER
# =========================================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_current_user(
    credentials:
        HTTPAuthorizationCredentials =
        Depends(security),

    db: Session =
        Depends(get_db)
):

    token = credentials.credentials.strip()

    # -----------------------------------------------------
    # Decode JWT
    # -----------------------------------------------------

    try:

        payload = decode_access_token(
            token
        )

    except ValueError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    # -----------------------------------------------------
    # Get user ID from JWT
    # -----------------------------------------------------

    user_id = payload.get(
        "sub"
    )

    if not user_id:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    # -----------------------------------------------------
    # Get current user
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.id == int(user_id)
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user