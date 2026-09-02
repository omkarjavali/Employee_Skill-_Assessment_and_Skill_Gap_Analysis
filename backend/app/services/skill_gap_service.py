from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.answer import Answer
from app.models.question_evaluation import QuestionEvaluation
from app.models.evaluation_criteria_result import EvaluationCriteriaResult
from app.models.question_rubric import QuestionRubric

from app.models.user import User
from app.models.role import Role
from app.models.role_skill import RoleSkill
from app.models.skill import Skill

from app.models.skill_gap_analysis import SkillGapAnalysis
from app.models.skill_gap_detail import SkillGapDetail

from app.models.skill_concept import SkillConcept
from app.models.skill_competency import SkillCompetency


# =========================================================
# GENERATE SKILL GAP ANALYSIS
# =========================================================

def generate_skill_gap_analysis(
    db: Session,
    assessment_id: int
):

    print(
        "🔥 GENERATING SKILL GAP:",
        {
            "assessment_id": assessment_id
        }
    )

    # =====================================================
    # 1. GET COMPLETED ASSESSMENT
    # =====================================================

    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.id == assessment_id
        )
        .first()
    )

    if not assessment:

        raise ValueError(
            "Assessment not found"
        )

    if assessment.status != "COMPLETED":

        raise ValueError(
            "Skill Gap Analysis can only be generated "
            "for a completed assessment"
        )

    if assessment.final_level is None:

        raise ValueError(
            "Assessment does not have a final level"
        )

    # =====================================================
    # 2. GET USER
    # =====================================================

    user = (
        db.query(User)
        .filter(
            User.id == assessment.user_id
        )
        .first()
    )

    if not user:

        raise ValueError(
            "User not found"
        )

    print(
        "🔥 SKILL GAP USER:",
        {
            "user_id": user.id,
            "name": user.name,
            "role_id": user.role_id
        }
    )

    # =====================================================
    # 3. GET USER'S ASSIGNED ROLE
    #
    # IMPORTANT:
    # We now use users.role_id.
    #
    # We DO NOT require a SelfAssessment.
    # =====================================================

    if user.role_id is None:

        raise ValueError(
            "No role assigned to user"
        )

    role = (
        db.query(Role)
        .filter(
            Role.id == user.role_id
        )
        .first()
    )

    if not role:

        raise ValueError(
            "Assigned role not found"
        )

    print(
        "🔥 SKILL GAP ROLE:",
        {
            "role_id": role.id,
            "role_name": role.name
        }
    )

    # =====================================================
    # 4. GET SKILL
    # =====================================================

    skill = (
        db.query(Skill)
        .filter(
            Skill.id == assessment.skill_id
        )
        .first()
    )

    if not skill:

        raise ValueError(
            "Skill not found"
        )

    print(
        "🔥 SKILL GAP SKILL:",
        {
            "skill_id": skill.id,
            "skill_name": skill.name
        }
    )

    # =====================================================
    # 5. GET EXPECTED LEVEL
    # =====================================================

    role_skill = (
        db.query(RoleSkill)
        .filter(
            RoleSkill.role_id == user.role_id,
            RoleSkill.skill_id == assessment.skill_id
        )
        .first()
    )

    if not role_skill:

        raise ValueError(
            f"No expected level configured for "
            f"role '{role.name}' and "
            f"skill '{skill.name}'"
        )

    expected_level = int(
        role_skill.expected_level
    )

    final_level = int(
        assessment.final_level
    )

    print(
        "🔥 LEVEL COMPARISON:",
        {
            "expected_level": expected_level,
            "final_level": final_level
        }
    )

    # =====================================================
    # 6. CALCULATE OVERALL GAP
    # =====================================================

    if final_level < expected_level:

        gap = (
            expected_level
            - final_level
        )

        surplus = 0

        status = "SKILL_GAP"

    elif final_level == expected_level:

        gap = 0

        surplus = 0

        status = "MEETS_EXPECTATION"

    else:

        gap = 0

        surplus = (
            final_level
            - expected_level
        )

        status = "ABOVE_EXPECTATION"

    # =====================================================
    # 7. PREVENT DUPLICATE ANALYSIS
    # =====================================================

    existing_analysis = (
        db.query(SkillGapAnalysis)
        .filter(
            SkillGapAnalysis.assessment_id
            == assessment_id
        )
        .first()
    )

    if existing_analysis:

        print(
            "♻️ SKILL GAP ALREADY EXISTS:",
            {
                "analysis_id":
                    existing_analysis.id,

                "assessment_id":
                    assessment_id
            }
        )

        return existing_analysis

    # =====================================================
    # 8. CREATE MAIN ANALYSIS
    # =====================================================

    analysis = SkillGapAnalysis(

        assessment_id=
            assessment.id,

        user_id=
            assessment.user_id,

        skill_id=
            assessment.skill_id,

        role_id=
            user.role_id,

        expected_level=
            expected_level,

        final_level=
            final_level,

        gap=
            gap,

        surplus=
            surplus,

        status=
            status
    )

    db.add(
        analysis
    )

    db.flush()

    print(
        "🔥 SKILL GAP ANALYSIS CREATED:",
        {
            "analysis_id":
                analysis.id,

            "assessment_id":
                assessment.id,

            "user_id":
                user.id,

            "role_id":
                user.role_id,

            "skill_id":
                assessment.skill_id,

            "expected_level":
                expected_level,

            "final_level":
                final_level,

            "gap":
                gap,

            "surplus":
                surplus,

            "status":
                status
        }
    )

    # =====================================================
    # 9. GET ANSWERS FOR THIS ASSESSMENT ONLY
    # =====================================================

    answers = (
        db.query(Answer)
        .join(
            AssessmentQuestion,
            AssessmentQuestion.id
            == Answer.assessment_question_id
        )
        .filter(
            AssessmentQuestion.assessment_id
            == assessment.id
        )
        .all()
    )

    answer_ids = [
        answer.id
        for answer in answers
    ]

    # =====================================================
    # 10. GET EVALUATIONS
    # =====================================================

    evaluations = []

    if answer_ids:

        evaluations = (
            db.query(
                QuestionEvaluation
            )
            .filter(
                QuestionEvaluation.answer_id.in_(
                    answer_ids
                )
            )
            .order_by(
                QuestionEvaluation.id.desc()
            )
            .all()
        )

    evaluation_ids = [
        evaluation.id
        for evaluation in evaluations
    ]

    # =====================================================
    # 11. GET CRITERIA RESULTS
    # =====================================================

    criteria_results = []

    if evaluation_ids:

        criteria_results = (
            db.query(
                EvaluationCriteriaResult
            )
            .filter(
                EvaluationCriteriaResult.evaluation_id.in_(
                    evaluation_ids
                )
            )
            .order_by(
                EvaluationCriteriaResult.id.desc()
            )
            .all()
        )

    # =====================================================
    # 12. KEEP LATEST RESULT FOR EACH RUBRIC
    # =====================================================

    latest_by_rubric = {}

    for result in criteria_results:

        rubric_id = result.rubric_id

        if rubric_id not in latest_by_rubric:

            latest_by_rubric[
                rubric_id
            ] = result

    unique_results = list(
        latest_by_rubric.values()
    )

    # =====================================================
    # 13. LOAD RUBRICS + CONCEPTS + COMPETENCIES
    # =====================================================

    rubric_ids = [
        result.rubric_id
        for result in unique_results
    ]

    rubric_map = {}

    if rubric_ids:

        rubric_rows = (
            db.query(
                QuestionRubric,
                SkillConcept,
                SkillCompetency
            )
            .join(
                SkillConcept,
                QuestionRubric.concept_id
                == SkillConcept.id
            )
            .join(
                SkillCompetency,
                SkillConcept.competency_id
                == SkillCompetency.id
            )
            .filter(
                QuestionRubric.id.in_(
                    rubric_ids
                )
            )
            .all()
        )

        for (
            rubric,
            concept,
            competency
        ) in rubric_rows:

            rubric_map[
                rubric.id
            ] = {

                "rubric":
                    rubric,

                "concept":
                    concept,

                "competency":
                    competency
            }

    # =====================================================
    # 14. VALIDATE CONCEPT MAPPING
    # =====================================================

    missing_mappings = []

    for result in unique_results:

        if result.rubric_id not in rubric_map:

            missing_mappings.append(
                result.rubric_id
            )

    if missing_mappings:

        db.rollback()

        raise ValueError(
            "The following evaluated rubrics "
            "are not mapped to a competency/concept: "
            f"{missing_mappings}"
        )

    # =====================================================
    # 15. CREATE SKILL GAP DETAILS
    # =====================================================

    for result in unique_results:

        score = float(
            result.score
        )

        max_score = float(
            result.max_score
        )

        if max_score > 0:

            percentage = (
                score
                / max_score
            ) * 100

        else:

            percentage = 0

        # -------------------------------------------------
        # Classification
        # -------------------------------------------------

        if percentage >= 80:

            classification = (
                "STRENGTH"
            )

        elif percentage >= 60:

            classification = (
                "DEVELOPMENT_AREA"
            )

        else:

            classification = (
                "GAP"
            )

        # -------------------------------------------------
        # Create detail
        # -------------------------------------------------

        detail = SkillGapDetail(

            skill_gap_analysis_id=
                analysis.id,

            rubric_id=
                result.rubric_id,

            score=
                score,

            max_score=
                max_score,

            percentage=
                percentage,

            classification=
                classification,

            feedback=
                result.feedback
        )

        db.add(
            detail
        )

    # =====================================================
    # 16. COMMIT SKILL GAP
    # =====================================================

    try:

        db.commit()

    except Exception as exc:

        db.rollback()

        print(
            "❌ SKILL GAP COMMIT FAILED:",
            {
                "assessment_id":
                    assessment_id,

                "error":
                    str(exc)
            }
        )

        raise

    db.refresh(
        analysis
    )

    # =====================================================
    # 17. DEBUG
    # =====================================================

    print(
        "🔥 CREATED SKILL GAP:",
        {
            "analysis_id":
                analysis.id,

            "assessment_id":
                analysis.assessment_id,

            "user_id":
                analysis.user_id,

            "role_id":
                analysis.role_id,

            "skill_id":
                analysis.skill_id
        }
    )

    print(
        "🔥 SKILL:",
        skill.name
    )

    print(
        "🔥 EXPECTED LEVEL:",
        expected_level
    )

    print(
        "🔥 FINAL LEVEL:",
        final_level
    )

    print(
        "🔥 GAP:",
        gap
    )

    print(
        "🔥 SURPLUS:",
        surplus
    )

    print(
        "🔥 STATUS:",
        status
    )

    print(
        "🔥 COMPETENCY/RUBRIC MAPPINGS:"
    )

    for result in unique_results:

        mapping = rubric_map[
            result.rubric_id
        ]

        print(
            "   RUBRIC:",
            result.rubric_id,

            "-> CONCEPT:",
            mapping[
                "concept"
            ].name,

            "-> COMPETENCY:",
            mapping[
                "competency"
            ].name
        )

    return analysis