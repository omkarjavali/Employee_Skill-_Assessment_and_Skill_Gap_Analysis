from pydantic import BaseModel


class AssessmentQuestionOptionResponse(BaseModel):
    option_key: str
    option_text: str


class AssessmentQuestionResponse(BaseModel):
    assessment_question_id: int
    sequence_number: int
    difficulty_level: int
    question_id: int
    skill_id: int
    level: int
    question_type: str
    question_text: str
    time_limit_seconds: int

    options: list[AssessmentQuestionOptionResponse] = []