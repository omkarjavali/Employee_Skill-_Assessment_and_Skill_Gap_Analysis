from collections import defaultdict

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.schemas.skill_gap import (
    SkillGapAnalysisResponse
)

from app.services.skill_gap_service import (
    generate_skill_gap_analysis
)

from app.models.skill_gap_detail import (
    SkillGapDetail
)

from app.models.skill_gap_analysis import (
    SkillGapAnalysis
)

from app.models.skill import Skill
from app.models.role import Role

from app.models.question_rubric import (
    QuestionRubric
)

from app.models.skill_concept import (
    SkillConcept
)

from app.models.skill_competency import (
    SkillCompetency
)


router = APIRouter(
    prefix="/api/skill-gap",
    tags=["Skill Gap Analysis"]
)


# =========================================================
# CLASSIFICATION
# =========================================================

def classify_percentage(
    percentage: float
):

    if percentage >= 80:

        return "STRENGTH"

    elif percentage >= 60:

        return "DEVELOPMENT_AREA"

    else:

        return "GAP"


# =========================================================
# BUILD RESPONSE
# =========================================================

def build_skill_gap_response(
    db: Session,
    analysis: SkillGapAnalysis
):

    # =====================================================
    # 1. GET SKILL
    # =====================================================

    skill = db.get(
        Skill,
        analysis.skill_id
    )

    if not skill:

        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    # =====================================================
    # 2. GET ROLE
    # =====================================================

    role = db.get(
        Role,
        analysis.role_id
    )

    if not role:

        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    # =====================================================
    # 3. GET RUBRIC-LEVEL DETAILS
    #
    # SkillGapDetail
    #     ↓
    # QuestionRubric
    #     ↓
    # SkillConcept
    #     ↓
    # SkillCompetency
    # =====================================================

    details = (
        db.query(
            SkillGapDetail,
            QuestionRubric,
            SkillConcept,
            SkillCompetency
        )
        .join(
            QuestionRubric,
            QuestionRubric.id
            == SkillGapDetail.rubric_id
        )
        .join(
            SkillConcept,
            SkillConcept.id
            == QuestionRubric.concept_id
        )
        .join(
            SkillCompetency,
            SkillCompetency.id
            == SkillConcept.competency_id
        )
        .filter(
            SkillGapDetail.skill_gap_analysis_id
            == analysis.id
        )
        .order_by(
            SkillCompetency.display_order.asc(),
            SkillConcept.display_order.asc(),
            SkillGapDetail.id.asc()
        )
        .all()
    )

    # =====================================================
    # 4. RAW EVIDENCE
    # =====================================================

    evidence = []

    # =====================================================
    # 5. GROUP RUBRICS BY CONCEPT
    # =====================================================

    concept_groups = defaultdict(list)

    # =====================================================
    # 6. GROUP CONCEPTS BY COMPETENCY
    # =====================================================

    competency_groups = defaultdict(
        lambda: {
            "competency": None,
            "concepts": {}
        }
    )

    # =====================================================
    # 7. PROCESS RUBRIC RESULTS
    # =====================================================

    for (
        detail,
        rubric,
        concept,
        competency
    ) in details:

        score = float(
            detail.score
        )

        max_score = float(
            detail.max_score
        )

        percentage = float(
            detail.percentage
        )

        classification = (
            detail.classification
        )

        # -------------------------------------------------
        # RAW EVIDENCE
        # -------------------------------------------------

        evidence.append({

            "rubric_id":
                detail.rubric_id,

            "criterion":
                rubric.criterion,

            "score":
                score,

            "max_score":
                max_score,

            "percentage":
                percentage,

            "classification":
                classification,

            "feedback":
                detail.feedback,

            "concept_id":
                concept.id,

            "concept_name":
                concept.name,

            "competency_id":
                competency.id,

            "competency_name":
                competency.name
        })

        # -------------------------------------------------
        # CONCEPT GROUP
        # -------------------------------------------------

        concept_key = concept.id

        concept_groups[
            concept_key
        ].append({

            "detail": detail,

            "rubric": rubric,

            "concept": concept,

            "competency": competency

        })

        # -------------------------------------------------
        # COMPETENCY GROUP
        # -------------------------------------------------

        competency_groups[
            competency.id
        ]["competency"] = competency

        competency_groups[
            competency.id
        ]["concepts"][
            concept.id
        ] = concept

    # =====================================================
    # 8. BUILD CONCEPT RESULTS
    # =====================================================

    concept_results = {}

    for concept_id, items in (
        concept_groups.items()
    ):

        concept = items[0]["concept"]

        competency = (
            items[0]["competency"]
        )

        # -------------------------------------------------
        # AVERAGE RUBRIC PERCENTAGES
        #
        # IMPORTANT:
        # We use the average only.
        # -------------------------------------------------

        percentages = [
            float(
                item["detail"].percentage
            )
            for item in items
        ]

        if percentages:

            concept_percentage = (
                sum(percentages)
                / len(percentages)
            )

        else:

            concept_percentage = 0.0

        concept_classification = (
            classify_percentage(
                concept_percentage
            )
        )

        concept_results[
            concept_id
        ] = {

            "id":
                concept.id,

            "name":
                concept.name,

            "description":
                concept.description,

            "percentage":
                round(
                    concept_percentage,
                    2
                ),

            "classification":
                concept_classification,

            "rubric_count":
                len(items)
        }

    # =====================================================
    # 9. BUILD COMPETENCY RESULTS
    # =====================================================

    competency_results = []

    for competency_id, group in (
        competency_groups.items()
    ):

        competency = (
            group["competency"]
        )

        concepts = []

        for concept_id in sorted(
            group["concepts"].keys(),
            key=lambda cid:
                (
                    group["concepts"][
                        cid
                    ].display_order
                )
        ):

            concept_result = (
                concept_results.get(
                    concept_id
                )
            )

            if concept_result:

                concepts.append(
                    concept_result
                )

        # -------------------------------------------------
        # AVERAGE CONCEPT PERCENTAGES
        #
        # Again, average only.
        # -------------------------------------------------

        concept_percentages = [

            float(
                concept["percentage"]
            )

            for concept in concepts

        ]

        if concept_percentages:

            competency_percentage = (

                sum(
                    concept_percentages
                )

                / len(
                    concept_percentages
                )

            )

        else:

            competency_percentage = 0.0

        competency_classification = (
            classify_percentage(
                competency_percentage
            )
        )

        competency_results.append({

            "id":
                competency.id,

            "title":
                competency.name,

            "description":
                competency.description,

            "percentage":
                round(
                    competency_percentage,
                    2
                ),

            "classification":
                competency_classification,

            "concepts":
                concepts

        })

    # =====================================================
    # 10. SORT COMPETENCIES
    # =====================================================
    
    competency_results.sort(
        key=lambda item:
            competency_groups[
                item["id"]
            ]["competency"].display_order
    )
    
    # =====================================================
    # 11. SPLIT INTO DASHBOARD SECTIONS
    # =====================================================

    strengths = []
    development_areas = []
    gaps = []

    for competency in (
        competency_results
    ):

        classification = (
            competency[
                "classification"
            ]
        )

        # -------------------------------------------------
        # CARD FORMAT
        # -------------------------------------------------

        card = {

            "id":
                competency["id"],

            "title":
                competency["title"],

            "description":
                competency["description"],

            "percentage":
                competency["percentage"],

            "classification":
                classification,

            "concepts":
                competency["concepts"]

        }

        if classification == "STRENGTH":

            strengths.append(
                card
            )

        elif classification == (
            "DEVELOPMENT_AREA"
        ):

            development_areas.append(
                card
            )

        elif classification == "GAP":

            gaps.append(
                card
            )

    # =====================================================
    # 12. FINAL RESPONSE
    # =====================================================

    return {

        "id":
            analysis.id,

        "assessment_id":
            analysis.assessment_id,

        "user_id":
            analysis.user_id,

        "skill_id":
            analysis.skill_id,

        "role_id":
            analysis.role_id,

        "skill_name":
            skill.name,

        "role_name":
            role.name,

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

        "strengths":
            strengths,

        "development_areas":
            development_areas,

        "gaps":
            gaps,

        "evidence":
            evidence,

        "created_at":
            analysis.created_at
    }


# =========================================================
# CREATE SKILL GAP ANALYSIS
# =========================================================

@router.post(
    "/assessments/{assessment_id}",
    response_model=SkillGapAnalysisResponse
)
def create_skill_gap_analysis(
    assessment_id: int,
    db: Session = Depends(get_db)
):

    try:

        analysis = (
            generate_skill_gap_analysis(
                db=db,
                assessment_id=assessment_id
            )
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    return build_skill_gap_response(
        db=db,
        analysis=analysis
    )


# =========================================================
# GET EXISTING SKILL GAP ANALYSIS
# =========================================================

@router.get(
    "/assessments/{assessment_id}",
    response_model=SkillGapAnalysisResponse
)
def get_skill_gap_analysis(
    assessment_id: int,
    db: Session = Depends(get_db)
):

    analysis = (
        db.query(
            SkillGapAnalysis
        )
        .filter(
            SkillGapAnalysis.assessment_id
            == assessment_id
        )
        .first()
    )

    if not analysis:

        raise HTTPException(
            status_code=404,
            detail="Skill Gap Analysis not found"
        )

    return build_skill_gap_response(
        db=db,
        analysis=analysis
    )