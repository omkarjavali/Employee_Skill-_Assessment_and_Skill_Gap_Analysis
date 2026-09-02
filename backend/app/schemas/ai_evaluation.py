from pydantic import BaseModel, Field


class AICriterionEvaluation(BaseModel):
    rubric_id: int
    score: float = Field(ge=0)
    feedback: str


class AIEvaluationResult(BaseModel):
    criteria: list[AICriterionEvaluation]
    overall_feedback: str

