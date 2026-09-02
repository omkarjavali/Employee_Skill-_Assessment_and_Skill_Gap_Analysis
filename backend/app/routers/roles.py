from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.role import Role
from app.schemas.role import RoleResponse


router = APIRouter(
    prefix="/api/roles",
    tags=["Roles"]
)


@router.get("", response_model=list[RoleResponse])
def get_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return roles