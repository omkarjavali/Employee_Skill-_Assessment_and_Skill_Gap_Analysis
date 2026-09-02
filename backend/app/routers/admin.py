from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.core.admin_auth import require_admin

from app.models.user import User
from app.models.role import Role
from app.models.skill import Skill
from app.models.assessment import Assessment
from app.models.skill_gap_analysis import SkillGapAnalysis
from app.models.skill_gap_detail import SkillGapDetail
from app.models.question_rubric import QuestionRubric
from app.models.skill_concept import SkillConcept
from app.models.skill_competency import SkillCompetency


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


# =========================================================
# ADMIN ACCESS TEST
# =========================================================

@router.get("/me")
def admin_me(
    current_admin: User = Depends(require_admin)
):

    return {

        "message":
            "Admin access granted",

        "admin": {

            "id":
                current_admin.id,

            "name":
                current_admin.name,

            "email":
                current_admin.email,

            "role":
                current_admin.role,

            "role_id":
                current_admin.role_id

        }

    }


# =========================================================
# GET ALL USERS
# =========================================================

@router.get("/users")
def get_all_users(

    db: Session =
        Depends(get_db),

    current_admin: User =
        Depends(require_admin)

):

    users = (
        db.query(User)
        .filter(
            User.role != "ADMIN"
        )
        .order_by(
            User.created_at.desc()
        )
        .all()
    )

    response = []


    for user in users:

        # -------------------------------------------------
        # All assessments for this user
        # -------------------------------------------------

        assessments = (
            db.query(Assessment)
            .filter(
                Assessment.user_id ==
                user.id
            )
            .all()
        )


        completed_assessments = [

            assessment

            for assessment in assessments

            if assessment.status ==
            "COMPLETED"

        ]


        # -------------------------------------------------
        # Business role
        # -------------------------------------------------

        business_role = None


        if user.role_id:

            role = (
                db.query(Role)
                .filter(
                    Role.id ==
                    user.role_id
                )
                .first()
            )

            if role:

                business_role = (
                    role.name
                )


        # -------------------------------------------------
        # All completed skills
        #
        # If the employee completed
        # the same skill multiple times,
        # only the latest completed
        # assessment is returned.
        # -------------------------------------------------

        skills_assessed = []


        completed_assessments_sorted = sorted(

            completed_assessments,

            key=lambda assessment: (

                assessment.completed_at

                if assessment.completed_at

                else datetime.min

            ),

            reverse=True

        )


        seen_skill_ids = set()


        for assessment in (
            completed_assessments_sorted
        ):

            if (
                assessment.skill_id
                in seen_skill_ids
            ):

                continue


            skill = (
                db.query(Skill)
                .filter(
                    Skill.id ==
                    assessment.skill_id
                )
                .first()
            )


            if not skill:

                continue


            skills_assessed.append({

                "skill_id":
                    skill.id,

                "skill_name":
                    skill.name,

                "final_level":
                    (
                        int(
                            assessment.final_level
                        )

                        if (
                            assessment.final_level
                            is not None
                        )

                        else None
                    )

            })


            seen_skill_ids.add(
                assessment.skill_id
            )


        # -------------------------------------------------
        # Employee response
        # -------------------------------------------------

        response.append({

            "id":
                user.id,

            "name":
                user.name,

            "email":
                user.email,

            "role":
                user.role,

            "business_role":
                business_role,

            "created_at":
                user.created_at,

            "assessment_count":
                len(assessments),

            "completed_assessment_count":
                len(
                    completed_assessments
                ),

            "skills_assessed":
                skills_assessed

        })


    return response


# =========================================================
# GET INDIVIDUAL USER PERFORMANCE
# =========================================================

@router.get("/users/{user_id}")
def get_user_performance(

    user_id: int,

    db: Session =
        Depends(get_db),

    current_admin: User =
        Depends(require_admin)

):

    # -----------------------------------------------------
    # Find user
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.id ==
            user_id
        )
        .first()
    )


    if not user:

        raise HTTPException(

            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "User not found"

        )


    # -----------------------------------------------------
    # Business role
    # -----------------------------------------------------

    business_role = None


    if user.role_id:

        role = (
            db.query(Role)
            .filter(
                Role.id ==
                user.role_id
            )
            .first()
        )


        if role:

            business_role = (
                role.name
            )


    # -----------------------------------------------------
    # Assessments
    # -----------------------------------------------------

    assessments = (
        db.query(Assessment)
        .filter(
            Assessment.user_id ==
            user.id
        )
        .order_by(
            Assessment.started_at.desc()
        )
        .all()
    )


    assessment_history = []


    for assessment in assessments:

        skill = (
            db.query(Skill)
            .filter(
                Skill.id ==
                assessment.skill_id
            )
            .first()
        )


        assessment_history.append({

            "assessment_id":
                assessment.id,

            "skill_id":
                assessment.skill_id,

            "skill_name":
                (
                    skill.name
                    if skill
                    else None
                ),

            "starting_level":
                assessment.starting_level,

            "current_level":
                assessment.current_level,

            "previous_level":
                assessment.previous_level,

            "final_level":
                (
                    int(
                        assessment.final_level
                    )

                    if (
                        assessment.final_level
                        is not None
                    )

                    else None
                ),

            "status":
                assessment.status,

            "started_at":
                assessment.started_at,

            "completed_at":
                assessment.completed_at

        })


    # =====================================================
    # ALL SKILL GAP ANALYSES
    # =====================================================

    analyses = (
        db.query(SkillGapAnalysis)
        .filter(
            SkillGapAnalysis.user_id ==
            user.id
        )
        .order_by(
            SkillGapAnalysis.created_at.desc()
        )
        .all()
    )


    skill_gaps = []


    # =====================================================
    # PROCESS EACH SKILL GAP ANALYSIS
    # =====================================================

    for analysis in analyses:

        # -------------------------------------------------
        # Skill
        # -------------------------------------------------

        skill = (
            db.query(Skill)
            .filter(
                Skill.id ==
                analysis.skill_id
            )
            .first()
        )


        # -------------------------------------------------
        # Role
        # -------------------------------------------------

        role = (
            db.query(Role)
            .filter(
                Role.id ==
                analysis.role_id
            )
            .first()
        )


        # -------------------------------------------------
        # Skill gap object
        # -------------------------------------------------

        skill_gap = {

            "analysis_id":
                analysis.id,

            "assessment_id":
                analysis.assessment_id,

            "skill_id":
                analysis.skill_id,

            "skill_name":
                (
                    skill.name
                    if skill
                    else None
                ),

            "role_id":
                analysis.role_id,

            "role_name":
                (
                    role.name
                    if role
                    else None
                ),

            "expected_level":
                analysis.expected_level,

            "final_level":
                analysis.final_level,

            "gap":
                analysis.gap,

            "surplus":
                analysis.surplus,

            "status":
                analysis.status,

            "created_at":
                analysis.created_at

        }


        # =================================================
        # SKILL GAP DETAILS
        # =================================================

        details = (
            db.query(SkillGapDetail)
            .filter(
                SkillGapDetail
                .skill_gap_analysis_id
                ==
                analysis.id
            )
            .all()
        )


        # =================================================
        # GROUP BY COMPETENCY / CONCEPT
        # =================================================

        competency_map = {}


        for detail in details:

            # -------------------------------------------------
            # Rubric
            # -------------------------------------------------

            rubric = (
                db.query(QuestionRubric)
                .filter(
                    QuestionRubric.id ==
                    detail.rubric_id
                )
                .first()
            )


            if not rubric:

                continue


            # -------------------------------------------------
            # Concept
            # -------------------------------------------------

            concept = (
                db.query(SkillConcept)
                .filter(
                    SkillConcept.id ==
                    rubric.concept_id
                )
                .first()
            )


            if not concept:

                continue


            # -------------------------------------------------
            # Competency
            # -------------------------------------------------

            competency = (
                db.query(SkillCompetency)
                .filter(
                    SkillCompetency.id ==
                    concept.competency_id
                )
                .first()
            )


            if not competency:

                continue


            competency_id = (
                competency.id
            )


            # -------------------------------------------------
            # Create competency
            # -------------------------------------------------

            if (
                competency_id
                not in competency_map
            ):

                competency_map[
                    competency_id
                ] = {

                    "id":
                        competency.id,

                    "name":
                        competency.name,

                    "percentage_total":
                        0,

                    "rubric_count":
                        0,

                    "concepts":
                        {}

                }


            competency_data = (
                competency_map[
                    competency_id
                ]
            )


            # -------------------------------------------------
            # Competency percentage
            # -------------------------------------------------

            competency_data[
                "percentage_total"
            ] += detail.percentage


            competency_data[
                "rubric_count"
            ] += 1


            # -------------------------------------------------
            # Concept
            # -------------------------------------------------

            concept_id = (
                concept.id
            )


            if (
                concept_id
                not in
                competency_data["concepts"]
            ):

                competency_data[
                    "concepts"
                ][concept_id] = {

                    "id":
                        concept.id,

                    "name":
                        concept.name,

                    "percentage_total":
                        0,

                    "rubric_count":
                        0

                }


            concept_data = (
                competency_data[
                    "concepts"
                ][concept_id]
            )


            concept_data[
                "percentage_total"
            ] += detail.percentage


            concept_data[
                "rubric_count"
            ] += 1


        # =================================================
        # FORMAT COMPETENCIES
        # =================================================

        competencies = []


        for competency in (
            competency_map.values()
        ):

            competency_percentage = (

                competency[
                    "percentage_total"
                ]

                /
                competency[
                    "rubric_count"
                ]

                if (
                    competency[
                        "rubric_count"
                    ] > 0
                )

                else 0

            )


            concepts = []


            for concept in (
                competency[
                    "concepts"
                ].values()
            ):

                concept_percentage = (

                    concept[
                        "percentage_total"
                    ]

                    /
                    concept[
                        "rubric_count"
                    ]

                    if (
                        concept[
                            "rubric_count"
                        ] > 0
                    )

                    else 0

                )


                concepts.append({

                    "id":
                        concept["id"],

                    "name":
                        concept["name"],

                    "percentage":
                        round(
                            concept_percentage,
                            2
                        ),

                    "rubric_count":
                        concept[
                            "rubric_count"
                        ]

                })


            competencies.append({

                "id":
                    competency["id"],

                "name":
                    competency["name"],

                "percentage":
                    round(
                        competency_percentage,
                        2
                    ),

                "rubric_count":
                    competency[
                        "rubric_count"
                    ],

                "concepts":
                    concepts

            })


        # -------------------------------------------------
        # Attach competencies to this skill
        # -------------------------------------------------

        skill_gap[
            "competencies"
        ] = competencies


        # -------------------------------------------------
        # Add skill gap to list
        # -------------------------------------------------

        skill_gaps.append(
            skill_gap
        )


    # =====================================================
    # FINAL RESPONSE
    # =====================================================

    return {

        "user": {

            "id":
                user.id,

            "name":
                user.name,

            "email":
                user.email,

            "role":
                user.role,

            "business_role":
                business_role,

            "created_at":
                user.created_at

        },

        "assessment_history":
            assessment_history,

        "skill_gaps":
            skill_gaps

    }