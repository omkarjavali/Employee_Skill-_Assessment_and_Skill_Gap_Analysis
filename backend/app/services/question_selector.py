from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.assessment_question import AssessmentQuestion


def get_next_question(
    db: Session,
    assessment_id: int,
    skill_id: int,
    target_level: int
):
    """
    Find an unused active question for the
    requested skill and level.
    """

    # --------------------------------------------------
    # Questions already presented in this assessment
    # --------------------------------------------------

    used_question_ids = (
        db.query(
            AssessmentQuestion.question_id
        )
        .filter(
            AssessmentQuestion.assessment_id
            == assessment_id
        )
    )

    # --------------------------------------------------
    # Find next available question
    # --------------------------------------------------

    question = (
        db.query(Question)
        .filter(
            Question.skill_id == skill_id,
            Question.level == target_level,
            Question.is_active.is_(True),
            ~Question.id.in_(used_question_ids)
        )
        .order_by(
            Question.id.asc()
        )
        .first()
    )

    return question