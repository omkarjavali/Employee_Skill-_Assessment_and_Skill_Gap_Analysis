from pydantic import BaseModel


class SkillResponse(BaseModel):
    id: int
    name: str
    description: str | None = None


class RoleSkillResponse(BaseModel):
    skill_id: int
    skill_name: str
    expected_level: int