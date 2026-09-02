from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.role import Role
from app.models.role_skill import RoleSkill
from app.models.self_assessment import SelfAssessment
from app.models.self_assessment_answer import SelfAssessmentAnswer
from app.models.skill import Skill
from app.models.user import User
from app.schemas.self_assessment import (
    SelfAssessmentCreate,
    SelfAssessmentResponse,
    SelfAssessmentAnswerCreate,
    SelfAssessmentAnswerResponse,
    SelfAssessmentSkillResponse,
    SelfAssessmentDetailResponse
)


router = APIRouter(
    prefix="/api/self-assessments",
    tags=["Self Assessment"]
)


@router.post(
    "",
    response_model=SelfAssessmentResponse
)
def create_self_assessment(
    request: SelfAssessmentCreate,
    db: Session = Depends(get_db)
):
    # Check that the user exists
    user = db.get(User, request.user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Check that the role exists
    role = db.get(Role, request.role_id)

    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    # Create assessment
    assessment = SelfAssessment(
        user_id=request.user_id,
        role_id=request.role_id,
        status="IN_PROGRESS"
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return assessment

@router.get(
    "/{assessment_id}",
    response_model=SelfAssessmentDetailResponse
)
def get_self_assessment(
    assessment_id: int,
    db: Session = Depends(get_db)
):
    # -----------------------------------------
    # 1. Get the assessment
    # -----------------------------------------

    assessment = db.get(
        SelfAssessment,
        assessment_id
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Self assessment not found"
        )

    # -----------------------------------------
    # 2. Get the role
    # -----------------------------------------

    role = db.get(
        Role,
        assessment.role_id
    )

    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    # -----------------------------------------
    # 3. Get all skills required for this role
    # -----------------------------------------

    role_skills = (
        db.query(
            RoleSkill.skill_id,
            Skill.name.label("skill_name"),
            RoleSkill.expected_level
        )
        .join(
            Skill,
            Skill.id == RoleSkill.skill_id
        )
        .filter(
            RoleSkill.role_id == assessment.role_id
        )
        .all()
    )

    # -----------------------------------------
    # 4. Get employee's answers
    # -----------------------------------------

    answers = (
        db.query(SelfAssessmentAnswer)
        .filter(
            SelfAssessmentAnswer.self_assessment_id == assessment_id
        )
        .all()
    )

    # Create a dictionary for quick lookup
    answer_map = {
        answer.skill_id: answer.rating
        for answer in answers
    }

    # -----------------------------------------
    # 5. Build skill response
    # -----------------------------------------

    skills = []

    for role_skill in role_skills:

        skills.append(
            SelfAssessmentSkillResponse(
                skill_id=role_skill.skill_id,
                skill_name=role_skill.skill_name,
                expected_level=role_skill.expected_level,
                self_rating=answer_map.get(
                    role_skill.skill_id
                )
            )
        )

    # -----------------------------------------
    # 6. Return complete assessment
    # -----------------------------------------

    return SelfAssessmentDetailResponse(
        id=assessment.id,
        user_id=assessment.user_id,
        role_id=assessment.role_id,
        role_name=role.name,
        status=assessment.status,
        started_at=assessment.started_at,
        completed_at=assessment.completed_at,
        skills=skills
    )


@router.post(
    "/{assessment_id}/answers",
    response_model=SelfAssessmentAnswerResponse
)
def add_self_assessment_answer(
    assessment_id: int,
    request: SelfAssessmentAnswerCreate,
    db: Session = Depends(get_db)
):
    # -----------------------------------------
    # 1. Check assessment exists
    # -----------------------------------------

    assessment = db.get(
        SelfAssessment,
        assessment_id
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Self assessment not found"
        )

    # -----------------------------------------
    # 2. Check assessment is still in progress
    # -----------------------------------------

    if assessment.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=400,
            detail="This self assessment is already completed"
        )

    # -----------------------------------------
    # 3. Check skill exists
    # -----------------------------------------

    skill = db.get(
        Skill,
        request.skill_id
    )

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    # -----------------------------------------
    # 4. Check skill belongs to selected role
    # -----------------------------------------

    role_skill = (
        db.query(RoleSkill)
        .filter(
            RoleSkill.role_id == assessment.role_id,
            RoleSkill.skill_id == request.skill_id
        )
        .first()
    )

    if not role_skill:
        raise HTTPException(
            status_code=400,
            detail="This skill is not part of the selected role"
        )

    # -----------------------------------------
    # 5. Check skill has not already been rated
    # -----------------------------------------

    existing_answer = (
        db.query(SelfAssessmentAnswer)
        .filter(
            SelfAssessmentAnswer.self_assessment_id == assessment_id,
            SelfAssessmentAnswer.skill_id == request.skill_id
        )
        .first()
    )

    if existing_answer:
        raise HTTPException(
            status_code=409,
            detail="This skill has already been rated"
        )

    # -----------------------------------------
    # 6. Create answer
    # -----------------------------------------

    answer = SelfAssessmentAnswer(
        self_assessment_id=assessment_id,
        skill_id=request.skill_id,
        rating=request.rating
    )

    db.add(answer)
    db.commit()
    db.refresh(answer)

    return answer

@router.post(
    "/{assessment_id}/complete",
    response_model=SelfAssessmentResponse
)
def complete_self_assessment(
    assessment_id: int,
    db: Session = Depends(get_db)
):
    # -----------------------------------------
    # 1. Find the assessment
    # -----------------------------------------

    assessment = db.get(
        SelfAssessment,
        assessment_id
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Self assessment not found"
        )

    # -----------------------------------------
    # 2. Check assessment status
    # -----------------------------------------

    if assessment.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=400,
            detail="Self assessment is already completed"
        )

    # -----------------------------------------
    # 3. Get all skills required for the role
    # -----------------------------------------

    required_skills = (
        db.query(RoleSkill.skill_id)
        .filter(
            RoleSkill.role_id == assessment.role_id
        )
        .all()
    )

    required_skill_ids = {
        row.skill_id
        for row in required_skills
    }

    # -----------------------------------------
    # 4. Get skills already rated
    # -----------------------------------------

    answered_skills = (
        db.query(SelfAssessmentAnswer.skill_id)
        .filter(
            SelfAssessmentAnswer.self_assessment_id == assessment_id
        )
        .all()
    )

    answered_skill_ids = {
        row.skill_id
        for row in answered_skills
    }

    # -----------------------------------------
    # 5. Find missing skills
    # -----------------------------------------

    missing_skill_ids = (
        required_skill_ids - answered_skill_ids
    )

    if missing_skill_ids:

        missing_skills = (
            db.query(Skill.name)
            .filter(
                Skill.id.in_(missing_skill_ids)
            )
            .all()
        )

        missing_skill_names = [
            row.name
            for row in missing_skills
        ]

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Please rate all required skills",
                "missing_skills": missing_skill_names
            }
        )

    # -----------------------------------------
    # 6. Mark assessment as completed
    # -----------------------------------------

    assessment.status = "COMPLETED"
    assessment.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(assessment)

    return assessment