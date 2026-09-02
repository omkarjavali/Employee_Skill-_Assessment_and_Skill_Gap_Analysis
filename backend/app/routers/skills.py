from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.skill import Skill
from app.models.role_skill import RoleSkill
from app.schemas.skill import SkillResponse, RoleSkillResponse


router = APIRouter(
    prefix="/api/skills",
    tags=["Skills"]
)


@router.get("", response_model=list[SkillResponse])
def get_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).all()
    return skills


@router.get(
    "/role/{role_id}",
    response_model=list[RoleSkillResponse]
)
def get_role_skills(
    role_id: int,
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            RoleSkill.skill_id,
            Skill.name.label("skill_name"),
            RoleSkill.expected_level
        )
        .join(
            Skill,
            Skill.id == RoleSkill.skill_id
        )
        .filter(
            RoleSkill.role_id == role_id
        )
        .all()
    )

    return results