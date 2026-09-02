from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class AssessmentCreate(BaseModel):
    skill_id: int
    starting_level: int


class AssessmentResponse(BaseModel):
    id: int
    user_id: int
    skill_id: int
    starting_level: int
    final_level: Decimal | None
    status: str
    started_at: datetime | None
    completed_at: datetime | None