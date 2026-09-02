from datetime import datetime

from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.answer import Answer

from app.services.question_selector import get_next_question


# =========================================================
# ASSESSMENT LEVEL CONFIGURATION
# =========================================================

MIN_LEVEL = 1
MAX_LEVEL = 5


# =========================================================
# CREATE NEXT ASSESSMENT QUESTION
# =========================================================

def create_next_assessment_question(
    db: Session,
    assessment: Assessment,
    target_level: int
):
    """
    Select an unused question for the requested level
    and create a new AssessmentQuestion record.

    IMPORTANT:
    This function ONLY creates a question.

    It does NOT change Assessment.current_level.

    The adaptive engine is the ONLY component responsible
    for changing the assessment level.
    """

    question = get_next_question(
        db=db,
        assessment_id=assessment.id,
        skill_id=assessment.skill_id,
        target_level=target_level
    )

    if not question:
        return None

    # -----------------------------------------------------
    # Determine next sequence number
    # -----------------------------------------------------

    last_question = (
        db.query(AssessmentQuestion)
        .filter(
            AssessmentQuestion.assessment_id
            == assessment.id
        )
        .order_by(
            AssessmentQuestion.sequence_number.desc()
        )
        .first()
    )

    if last_question:

        sequence_number = (
            last_question.sequence_number + 1
        )

    else:

        sequence_number = 1

    # -----------------------------------------------------
    # Create AssessmentQuestion
    # -----------------------------------------------------

    assessment_question = AssessmentQuestion(

        assessment_id=assessment.id,

        question_id=question.id,

        sequence_number=sequence_number,

        difficulty_level=question.level,

        presented_at=datetime.utcnow()
    )

    db.add(
        assessment_question
    )

    db.commit()

    db.refresh(
        assessment_question
    )

    print(
        "🔥 CREATED ASSESSMENT QUESTION:",
        {
            "assessment_id":
                assessment.id,

            "assessment_question_id":
                assessment_question.id,

            "question_id":
                question.id,

            "level":
                question.level,

            "sequence":
                sequence_number
        }
    )

    return assessment_question


# =========================================================
# GET OR CREATE NEXT ASSESSMENT QUESTION
# =========================================================

def get_or_create_next_assessment_question(
    db: Session,
    assessment: Assessment,
    target_level: int
):
    """
    Return the next unanswered question for the
    assessment's CURRENT adaptive level.

    IMPORTANT:

    This function NEVER changes the assessment level.

    The adaptive engine is responsible for:

        PROMOTE
        DEMOTE
        REMAIN
        MASTERY

    If no question exists at the current level,
    return None.

    The caller must NOT interpret this as a promotion.
    """

    # -----------------------------------------------------
    # Determine current level
    # -----------------------------------------------------

    if target_level is None:

        target_level = (
            assessment.current_level
        )

    if target_level is None:

        target_level = (
            assessment.starting_level
        )

    target_level = int(
        target_level
    )

    # -----------------------------------------------------
    # Validate level
    # -----------------------------------------------------

    if target_level < MIN_LEVEL:

        target_level = MIN_LEVEL

    if target_level > MAX_LEVEL:

        target_level = MAX_LEVEL

    print(
        "🔥 GET NEXT QUESTION:",
        {
            "assessment_id":
                assessment.id,

            "current_level":
                assessment.current_level,

            "requested_level":
                target_level
        }
    )

    # -----------------------------------------------------
    # IMPORTANT:
    #
    # DO NOT CHANGE:
    #
    # assessment.current_level
    #
    # This function is NOT an adaptive decision maker.
    # -----------------------------------------------------

    # -----------------------------------------------------
    # Resume an existing unanswered question
    #
    # Restrict this to the CURRENT level.
    #
    # This prevents an old unanswered question from a
    # previous level from blocking a legitimate promotion.
    # -----------------------------------------------------

    existing_question = (
        db.query(AssessmentQuestion)
        .outerjoin(
            Answer,
            Answer.assessment_question_id
            == AssessmentQuestion.id
        )
        .filter(

            AssessmentQuestion.assessment_id
            == assessment.id,

            AssessmentQuestion.difficulty_level
            == target_level,

            Answer.id.is_(None)
        )
        .order_by(
            AssessmentQuestion.sequence_number.asc()
        )
        .first()
    )

    if existing_question:

        print(
            "🔥 RESUMING UNANSWERED QUESTION:",
            {
                "assessment_id":
                    assessment.id,

                "assessment_question_id":
                    existing_question.id,

                "sequence":
                    existing_question.sequence_number,

                "difficulty_level":
                    existing_question.difficulty_level
            }
        )

        return existing_question

    # -----------------------------------------------------
    # Try ONLY the current level
    # -----------------------------------------------------

    print(
        "🔥 CHECKING CURRENT ADAPTIVE LEVEL:",
        {
            "assessment_id":
                assessment.id,

            "level":
                target_level
        }
    )

    assessment_question = (
        create_next_assessment_question(
            db=db,
            assessment=assessment,
            target_level=target_level
        )
    )

    # -----------------------------------------------------
    # Question found
    # -----------------------------------------------------

    if assessment_question:

        print(
            "✅ NEXT QUESTION FOUND:",
            {
                "assessment_id":
                    assessment.id,

                "level":
                    target_level,

                "assessment_question_id":
                    assessment_question.id
            }
        )

        return assessment_question

    # -----------------------------------------------------
    # No question at current level
    # -----------------------------------------------------

    print(
        "⚠️ NO QUESTIONS AVAILABLE AT CURRENT "
        "ADAPTIVE LEVEL:",
        {
            "assessment_id":
                assessment.id,

            "level":
                target_level
        }
    )

    # -----------------------------------------------------
    # VERY IMPORTANT:
    #
    # DO NOT:
    #
    # target_level += 1
    #
    # DO NOT:
    #
    # assessment.current_level = target_level
    #
    # DO NOT automatically complete the assessment.
    #
    # The adaptive decision must determine what happens.
    # -----------------------------------------------------

    return None


# =========================================================
# COMPLETE ASSESSMENT
# =========================================================

def complete_assessment(
    db: Session,
    assessment: Assessment
):
    """
    Complete the assessment and store the final level.

    This function should ONLY be called after the adaptive
    engine has determined that the assessment is complete.
    """

    # -----------------------------------------------------
    # Prevent duplicate completion
    # -----------------------------------------------------

    if assessment.status == "COMPLETED":

        return assessment

    # -----------------------------------------------------
    # Final level
    # -----------------------------------------------------

    if assessment.current_level is not None:

        assessment.final_level = int(
            assessment.current_level
        )

    else:

        assessment.final_level = int(
            assessment.starting_level
        )

    # -----------------------------------------------------
    # Complete assessment
    # -----------------------------------------------------

    assessment.status = "COMPLETED"

    assessment.completed_at = (
        datetime.utcnow()
    )

    db.commit()

    db.refresh(
        assessment
    )

    print(
        "🔥 ASSESSMENT COMPLETED:",
        {
            "assessment_id":
                assessment.id,

            "final_level":
                assessment.final_level
        }
    )

    return assessment