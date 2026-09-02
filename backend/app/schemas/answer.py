from datetime import datetime

from pydantic import BaseModel


class AnswerCreate(BaseModel):
    answer_text: str


class AnswerResponse(BaseModel):
    id: int
    assessment_question_id: int
    answer_text: str
    submitted_at: datetime | None