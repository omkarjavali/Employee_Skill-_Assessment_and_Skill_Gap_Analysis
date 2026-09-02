from pydantic import BaseModel
from typing import List


class QuestionOptionResponse(BaseModel):
    key: str
    text: str


class QuestionResponse(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    level: int
    question_type: str
    question_text: str
    time_limit_seconds: int | None = None
    options: List[QuestionOptionResponse]