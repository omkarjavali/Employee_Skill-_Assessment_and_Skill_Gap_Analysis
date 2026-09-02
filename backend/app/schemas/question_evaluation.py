from datetime import datetime

from pydantic import BaseModel


class EvaluationResponse(BaseModel):
    id: int
    answer_id: int
    score: float
    max_score: float
    percentage: float
    feedback: str | None
    evaluated_at: datetime | None