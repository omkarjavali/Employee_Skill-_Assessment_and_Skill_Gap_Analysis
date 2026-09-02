from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.question import Question
from app.models.question_option import QuestionOption
from app.models.skill import Skill
from app.schemas.question import QuestionResponse


router = APIRouter(
    prefix="/api/questions",
    tags=["Questions"]
)


@router.get(
    "/{question_id}",
    response_model=QuestionResponse
)
def get_question(
    question_id: int,
    db: Session = Depends(get_db)
):
    # Find question
    question = db.get(
        Question,
        question_id
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    # Find skill
    skill = db.get(
        Skill,
        question.skill_id
    )

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    # Get options
    options = (
        db.query(QuestionOption)
        .filter(
            QuestionOption.question_id == question_id
        )
        .order_by(
            QuestionOption.option_key
        )
        .all()
    )

    return QuestionResponse(
        id=question.id,
        skill_id=question.skill_id,
        skill_name=skill.name,
        level=question.level,
        question_type=question.question_type,
        question_text=question.question_text,
        time_limit_seconds=question.time_limit_seconds,
        options=[
            {
                "key": option.option_key,
                "text": option.option_text
            }
            for option in options
        ]
    )