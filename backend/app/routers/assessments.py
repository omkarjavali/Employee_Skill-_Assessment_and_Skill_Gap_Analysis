from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db

from app.models.assessment import Assessment
from app.models.skill import Skill
from app.models.user import User
from app.models.assessment_question import AssessmentQuestion
from app.models.question import Question
from app.models.answer import Answer
from app.models.question_option import QuestionOption
from app.models.role_skill import RoleSkill
from app.models.role import Role

from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse
)

from app.schemas.assessment_question import (
    AssessmentQuestionResponse
)

from app.schemas.answer import (
    AnswerCreate,
    AnswerResponse
)

from app.services.assessment_question_service import (
    get_or_create_next_assessment_question,
    complete_assessment
)

from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/api/assessments",
    tags=["Assessments"]
)


# =========================================================
# CREATE ASSESSMENT
# =========================================================

@router.post(
    "",
    response_model=AssessmentResponse
)
def create_assessment(
    request: AssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Current authenticated user comes from JWT
    # -----------------------------------------------------

    user = current_user

    print(
        "🔥 Creating assessment for user:",
        {
            "user_id": user.id,
            "name": user.name,
            "email": user.email
        }
    )

    # -----------------------------------------------------
    # Check skill
    # -----------------------------------------------------

    skill = db.get(
        Skill,
        request.skill_id
    )

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    # -----------------------------------------------------
    # Validate starting level
    # -----------------------------------------------------

    if (
        request.starting_level < 1
        or request.starting_level > 5
    ):
        raise HTTPException(
            status_code=400,
            detail="Starting level must be between 1 and 5"
        )

    # -----------------------------------------------------
    # Verify skill is assigned to user's role
    # -----------------------------------------------------

    if not user.role_id:

        raise HTTPException(
            status_code=400,
            detail="User is not assigned to an assessment role"
        )

    role_skill = (
        db.query(RoleSkill)
        .filter(
            RoleSkill.role_id == user.role_id,
            RoleSkill.skill_id == request.skill_id
        )
        .first()
    )

    if not role_skill:

        raise HTTPException(
            status_code=403,
            detail="This skill is not assigned to your current role"
        )

    # -----------------------------------------------------
    # Create assessment
    # -----------------------------------------------------

    assessment = Assessment(

        user_id=user.id,

        skill_id=request.skill_id,

        starting_level=request.starting_level,

        current_level=request.starting_level,

        status="IN_PROGRESS",

        started_at=datetime.utcnow()
    )

    db.add(assessment)

    db.commit()

    db.refresh(assessment)

    print(
        "✅ CREATED ASSESSMENT:",
        {
            "assessment_id": assessment.id,
            "user_id": assessment.user_id,
            "skill_id": assessment.skill_id,
            "starting_level": assessment.starting_level
        }
    )

    return assessment


# =========================================================
# GET ASSESSMENT QUESTION
# =========================================================

@router.get(
    "/questions/{assessment_question_id}",
    response_model=AssessmentQuestionResponse
)
def get_assessment_question(
    assessment_question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Find assessment question
    # -----------------------------------------------------

    assessment_question = db.get(
        AssessmentQuestion,
        assessment_question_id
    )

    if not assessment_question:

        raise HTTPException(
            status_code=404,
            detail="Assessment question not found"
        )

    # -----------------------------------------------------
    # Find assessment
    # -----------------------------------------------------

    assessment = db.get(
        Assessment,
        assessment_question.assessment_id
    )

    if not assessment:

        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    # -----------------------------------------------------
    # IMPORTANT:
    # Verify assessment belongs to logged-in user
    # -----------------------------------------------------

    if assessment.user_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="You do not have access to this assessment"
        )

    # -----------------------------------------------------
    # Find actual question
    # -----------------------------------------------------

    question = db.get(
        Question,
        assessment_question.question_id
    )

    if not question:

        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    # -----------------------------------------------------
    # MCQ options
    # -----------------------------------------------------

    options = []

    if question.question_type == "MCQ":

        question_options = (
            db.query(QuestionOption)
            .filter(
                QuestionOption.question_id == question.id
            )
            .order_by(
                QuestionOption.option_key
            )
            .all()
        )

        options = [
            {
                "option_key": option.option_key,
                "option_text": option.option_text
            }
            for option in question_options
        ]

    return AssessmentQuestionResponse(

        assessment_question_id=
            assessment_question.id,

        sequence_number=
            assessment_question.sequence_number,

        difficulty_level=
            assessment_question.difficulty_level,

        question_id=
            question.id,

        skill_id=
            question.skill_id,

        level=
            question.level,

        question_type=
            question.question_type,

        question_text=
            question.question_text,

        time_limit_seconds=
            question.time_limit_seconds,

        options=options
    )


# =========================================================
# SUBMIT ANSWER
# =========================================================

@router.post(
    "/questions/{assessment_question_id}/answer",
    response_model=AnswerResponse
)
def submit_answer(
    assessment_question_id: int,
    request: AnswerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    print(
        "🔥 SUBMIT ANSWER:",
        assessment_question_id
    )

    # -----------------------------------------------------
    # Find assessment question
    # -----------------------------------------------------

    assessment_question = db.get(
        AssessmentQuestion,
        assessment_question_id
    )

    if not assessment_question:

        raise HTTPException(
            status_code=404,
            detail="Assessment question not found"
        )

    # -----------------------------------------------------
    # Find assessment
    # -----------------------------------------------------

    assessment = db.get(
        Assessment,
        assessment_question.assessment_id
    )

    if not assessment:

        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    # -----------------------------------------------------
    # IMPORTANT:
    # Verify ownership
    # -----------------------------------------------------

    if assessment.user_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="You do not have access to this assessment"
        )

    # -----------------------------------------------------
    # Check status
    # -----------------------------------------------------

    if assessment.status != "IN_PROGRESS":

        raise HTTPException(
            status_code=400,
            detail="Assessment is not in progress"
        )

    # -----------------------------------------------------
    # Check duplicate answer
    # -----------------------------------------------------

    existing_answer = (
        db.query(Answer)
        .filter(
            Answer.assessment_question_id
            == assessment_question_id
        )
        .first()
    )

    if existing_answer:

        raise HTTPException(
            status_code=409,
            detail="This question has already been answered"
        )

    # -----------------------------------------------------
    # Store answer
    # -----------------------------------------------------

    answer = Answer(

        assessment_question_id=
            assessment_question_id,

        answer_text=
            request.answer_text
    )

    db.add(answer)

    db.commit()

    db.refresh(answer)

    print(
        "✅ ANSWER STORED:",
        {
            "answer_id": answer.id,
            "assessment_question_id":
                assessment_question_id,
            "assessment_id":
                assessment.id,
            "user_id":
                assessment.user_id
        }
    )

    return answer


# =========================================================
# REVIEW COMPLETED ASSESSMENT ANSWERS
# =========================================================

@router.get("/{assessment_id}/review")
def get_assessment_review(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    print(
        "🔥 REVIEW ASSESSMENT:",
        {
            "assessment_id": assessment_id,
            "user_id": current_user.id
        }
    )

    # -----------------------------------------------------
    # Find assessment
    # -----------------------------------------------------

    assessment = db.get(
        Assessment,
        assessment_id
    )

    if not assessment:

        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    # -----------------------------------------------------
    # Verify ownership
    # -----------------------------------------------------

    if assessment.user_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="You do not have access to this assessment"
        )

    # -----------------------------------------------------
    # Find skill
    # -----------------------------------------------------

    skill = db.get(
        Skill,
        assessment.skill_id
    )

    if not skill:

        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    # -----------------------------------------------------
    # Get ONLY answered questions
    # -----------------------------------------------------

    rows = (
        db.query(
            AssessmentQuestion,
            Question,
            Answer
        )
        .join(
            Question,
            Question.id
            == AssessmentQuestion.question_id
        )
        .join(
            Answer,
            Answer.assessment_question_id
            == AssessmentQuestion.id
        )
        .filter(
            AssessmentQuestion.assessment_id
            == assessment.id
        )
        .order_by(
            AssessmentQuestion.sequence_number.asc()
        )
        .all()
    )

    # -----------------------------------------------------
    # Build response
    # -----------------------------------------------------

    questions = []

    for assessment_question, question, answer in rows:

        # -------------------------------------------------
        # Get MCQ options
        #
        # IMPORTANT:
        #
        # We intentionally DO NOT return is_correct.
        #
        # This page is a read-only review of what the
        # employee answered.
        # -------------------------------------------------

        options = []

        if question.question_type == "MCQ":

            question_options = (
                db.query(QuestionOption)
                .filter(
                    QuestionOption.question_id
                    == question.id
                )
                .order_by(
                    QuestionOption.option_key.asc()
                )
                .all()
            )

            options = [
                {
                    "option_key": option.option_key,
                    "option_text": option.option_text
                }
                for option in question_options
            ]

        # -------------------------------------------------
        # Add question
        # -------------------------------------------------

        questions.append({

            "sequence_number":
                assessment_question.sequence_number,

            "difficulty_level":
                assessment_question.difficulty_level,

            "question_id":
                question.id,

            "question_text":
                question.question_text,

            "question_type":
                question.question_type,

            "answer_text":
                answer.answer_text,

            "submitted_at":
                answer.submitted_at,

            "options":
                options
        })

    print(
        "✅ ASSESSMENT REVIEW FOUND:",
        {
            "assessment_id":
                assessment.id,

            "user_id":
                current_user.id,

            "answered_questions":
                len(questions)
        }
    )

    # -----------------------------------------------------
    # Return review
    # -----------------------------------------------------

    return {

        "assessment_id":
            assessment.id,

        "skill_id":
            assessment.skill_id,

        "skill_name":
            skill.name,

        "status":
            assessment.status,

        "started_at":
            assessment.started_at,

        "completed_at":
            assessment.completed_at,

        "questions":
            questions
    }


# =========================================================
# NEXT QUESTION
# =========================================================

@router.post(
    "/{assessment_id}/next-question"
)
def get_next_assessment_question(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Find assessment
    # -----------------------------------------------------

    assessment = db.get(
        Assessment,
        assessment_id
    )

    if not assessment:

        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    # -----------------------------------------------------
    # IMPORTANT:
    # Verify ownership
    # -----------------------------------------------------

    if assessment.user_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have access to "
                "this assessment"
            )
        )

    # -----------------------------------------------------
    # Check status
    # -----------------------------------------------------

    if assessment.status != "IN_PROGRESS":

        raise HTTPException(
            status_code=400,
            detail="Assessment is not in progress"
        )

    # -----------------------------------------------------
    # Determine CURRENT adaptive level
    #
    # IMPORTANT:
    #
    # This value must come from Assessment.current_level.
    #
    # We do NOT calculate or change the level here.
    # -----------------------------------------------------

    target_level = (
        assessment.current_level
    )

    if target_level is None:

        target_level = (
            assessment.starting_level
        )

        assessment.current_level = (
            target_level
        )

        db.commit()

        db.refresh(
            assessment
        )

    print(
        "🔥 NEXT QUESTION REQUEST:",
        {
            "assessment_id":
                assessment.id,

            "user_id":
                current_user.id,

            "current_level":
                assessment.current_level
        }
    )

    # -----------------------------------------------------
    # Get/create question ONLY at current level
    # -----------------------------------------------------

    assessment_question = (
        get_or_create_next_assessment_question(
            db=db,
            assessment=assessment,
            target_level=target_level
        )
    )

    # -----------------------------------------------------
    # NO QUESTION AT CURRENT LEVEL
    #
    # IMPORTANT:
    #
    # Do NOT:
    #
    #   - promote
    #   - demote
    #   - complete
    #
    # The adaptive engine must make that decision.
    # -----------------------------------------------------

    if not assessment_question:

        raise HTTPException(
            status_code=409,
            detail=(
                f"No unanswered questions are available "
                f"at adaptive level {target_level}. "
                f"The adaptive decision must be completed "
                f"before requesting another level."
            )
        )

    # -----------------------------------------------------
    # Get actual question
    # -----------------------------------------------------

    question = db.get(
        Question,
        assessment_question.question_id
    )

    if not question:

        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    # -----------------------------------------------------
    # MCQ options
    # -----------------------------------------------------

    options = []

    if question.question_type == "MCQ":

        question_options = (
            db.query(QuestionOption)
            .filter(
                QuestionOption.question_id
                == question.id
            )
            .order_by(
                QuestionOption.option_key
            )
            .all()
        )

        options = [

            {
                "option_key":
                    option.option_key,

                "option_text":
                    option.option_text
            }

            for option
            in question_options
        ]

    # -----------------------------------------------------
    # Return question
    # -----------------------------------------------------

    return {

        "assessment_question_id":
            assessment_question.id,

        "sequence_number":
            assessment_question.sequence_number,

        "difficulty_level":
            assessment_question.difficulty_level,

        "question_id":
            question.id,

        "skill_id":
            question.skill_id,

        "level":
            question.level,

        "question_type":
            question.question_type,

        "question_text":
            question.question_text,

        "time_limit_seconds":
            question.time_limit_seconds,

        "options":
            options
    }


# =========================================================
# GET CURRENT USER'S ASSESSMENTS
# =========================================================

@router.get("")
def get_assessments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    assessments = (
        db.query(
            Assessment,
            Skill.name.label("skill_name")
        )
        .join(
            Skill,
            Skill.id == Assessment.skill_id
        )
        .filter(
            Assessment.user_id
            == current_user.id
        )
        .order_by(
            Assessment.id.desc()
        )
        .all()
    )

    return [

        {
            "id":
                assessment.id,

            "skill_id":
                assessment.skill_id,

            "skill_name":
                skill_name,

            "starting_level":
                assessment.starting_level,

            "current_level":
                assessment.current_level,

            "final_level":
                assessment.final_level,

            "status":
                assessment.status,

            "started_at":
                assessment.started_at,

            "completed_at":
                assessment.completed_at
        }

        for assessment, skill_name
        in assessments
    ]


# =========================================================
# AVAILABLE ASSESSMENTS
# =========================================================

@router.get("/available")
def get_available_assessments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    user = current_user

    # -----------------------------------------------------
    # User must have a role
    # -----------------------------------------------------

    if not user.role_id:

        raise HTTPException(
            status_code=400,
            detail="User is not assigned to an assessment role"
        )

    # -----------------------------------------------------
    # Get role
    # -----------------------------------------------------

    role = db.get(
        Role,
        user.role_id
    )

    if not role:

        raise HTTPException(
            status_code=404,
            detail="User role not found"
        )

    # -----------------------------------------------------
    # Get role skills
    # -----------------------------------------------------

    role_skills = (
        db.query(
            RoleSkill,
            Skill
        )
        .join(
            Skill,
            Skill.id == RoleSkill.skill_id
        )
        .filter(
            RoleSkill.role_id == role.id
        )
        .order_by(
            Skill.name.asc()
        )
        .all()
    )

    # -----------------------------------------------------
    # Existing assessments for this user only
    # -----------------------------------------------------

    existing_assessments = (
        db.query(Assessment)
        .filter(
            Assessment.user_id
            == current_user.id
        )
        .order_by(
            Assessment.started_at.desc()
        )
        .all()
    )

    latest_by_skill = {}

    for assessment in existing_assessments:

        if assessment.skill_id not in latest_by_skill:

            latest_by_skill[
                assessment.skill_id
            ] = assessment

    # -----------------------------------------------------
    # Build response
    # -----------------------------------------------------

    results = []

    for role_skill, skill in role_skills:

        latest = latest_by_skill.get(
            skill.id
        )

        results.append({

            "skill_id":
                skill.id,

            "skill_name":
                skill.name,

            "skill_description":
                skill.description,

            "expected_level":
                role_skill.expected_level,

            "has_assessment":
                latest is not None,

            "assessment_id":
                latest.id
                if latest
                else None,

            "assessment_status":
                latest.status
                if latest
                else None,

            "current_level":
                latest.current_level
                if latest
                else None,

            "final_level":
                latest.final_level
                if latest
                else None,

            "started_at":
                latest.started_at
                if latest
                else None,

            "completed_at":
                latest.completed_at
                if latest
                else None
        })

    return results