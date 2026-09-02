from datetime import datetime

from pydantic import BaseModel, Field


class SelfAssessmentCreate(BaseModel):
    user_id: int
    role_id: int


class SelfAssessmentResponse(BaseModel):
    id: int
    user_id: int
    role_id: int
    status: str
    started_at: datetime
    completed_at: datetime | None = None

    model_config = {
        "from_attributes": True
    }


class SelfAssessmentAnswerCreate(BaseModel):
    skill_id: int
    rating: int = Field(..., ge=1, le=5)


class SelfAssessmentAnswerResponse(BaseModel):
    id: int
    self_assessment_id: int
    skill_id: int
    rating: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class SelfAssessmentSkillResponse(BaseModel):
    skill_id: int
    skill_name: str
    expected_level: int
    self_rating: int | None = None


class SelfAssessmentDetailResponse(BaseModel):
    id: int
    user_id: int
    role_id: int
    role_name: str
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    skills: list[SelfAssessmentSkillResponse]