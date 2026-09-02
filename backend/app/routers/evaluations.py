from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from datetime import datetime

from app.db.database import get_db

from app.models.user import User
from app.models.answer import Answer
from app.models.assessment_question import AssessmentQuestion
from app.models.question import Question
from app.models.question_option import QuestionOption
from app.models.question_evaluation import QuestionEvaluation
from app.models.question_rubric import QuestionRubric
from app.models.evaluation_criteria_result import (
    EvaluationCriteriaResult
)
from app.models.assessment import Assessment
from app.models.assessment_adaptive_decision import (
    AssessmentAdaptiveDecision
)

from app.schemas.question_evaluation import (
    EvaluationResponse
)

from app.services.ai_evaluator import (
    evaluate_subjective_answer
)

from app.services.adaptive_engine import (
    calculate_next_level
)

from app.services.skill_gap_service import (
    generate_skill_gap_analysis
)

from app.routers.auth import (
    get_current_user
)


router = APIRouter(
    prefix="/api/evaluations",
    tags=["Evaluations"]
)


# =========================================================
# HELPER
# =========================================================

def get_assessment_for_answer(
    db: Session,
    answer: Answer
):

    assessment_question = db.get(
        AssessmentQuestion,
        answer.assessment_question_id
    )

    if not assessment_question:

        raise HTTPException(
            status_code=404,
            detail="Assessment question not found"
        )

    assessment = db.get(
        Assessment,
        assessment_question.assessment_id
    )

    if not assessment:

        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    return (
        assessment_question,
        assessment
    )


# =========================================================
# VERIFY ANSWER OWNERSHIP
# =========================================================

def verify_answer_ownership(
    db: Session,
    answer: Answer,
    current_user: User
):

    (
        assessment_question,
        assessment
    ) = get_assessment_for_answer(
        db,
        answer
    )

    if assessment.user_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="You do not have access to this answer"
        )

    return (
        assessment_question,
        assessment
    )


# =========================================================
# MCQ EVALUATION
# =========================================================

@router.post(
    "/answers/{answer_id}",
    response_model=EvaluationResponse
)
def evaluate_answer(
    answer_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )
):

    # -----------------------------------------------------
    # 1. Find answer
    # -----------------------------------------------------

    answer = db.get(
        Answer,
        answer_id
    )

    if not answer:

        raise HTTPException(
            status_code=404,
            detail="Answer not found"
        )

    # -----------------------------------------------------
    # 2. Verify ownership
    # -----------------------------------------------------

    (
        assessment_question,
        assessment
    ) = verify_answer_ownership(
        db,
        answer,
        current_user
    )

    # -----------------------------------------------------
    # 3. Check whether already evaluated
    # -----------------------------------------------------

    existing_evaluation = (
        db.query(
            QuestionEvaluation
        )
        .filter(
            QuestionEvaluation.answer_id
            == answer_id
        )
        .first()
    )

    if existing_evaluation:

        raise HTTPException(
            status_code=409,
            detail="This answer has already been evaluated"
        )

    # -----------------------------------------------------
    # 4. Find question
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
    # 5. Validate MCQ
    # -----------------------------------------------------

    if question.question_type != "MCQ":

        raise HTTPException(
            status_code=400,
            detail=(
                "This endpoint currently supports "
                "MCQ questions only"
            )
        )

    # -----------------------------------------------------
    # 6. Find correct option
    # -----------------------------------------------------

    correct_option = (
        db.query(
            QuestionOption
        )
        .filter(
            QuestionOption.question_id
            == question.id,

            QuestionOption.is_correct
            == True
        )
        .first()
    )

    if not correct_option:

        raise HTTPException(
            status_code=500,
            detail=(
                "No correct option configured "
                "for this question"
            )
        )

    # -----------------------------------------------------
    # 7. Compare answer
    # -----------------------------------------------------

    employee_answer = (
        answer.answer_text
        .strip()
        .upper()
    )

    correct_answer = (
        correct_option.option_key
        .strip()
        .upper()
    )

    if employee_answer == correct_answer:

        score = 1

        feedback = (
            "Correct answer."
        )

    else:

        score = 0

        feedback = (
            "Incorrect answer."
        )

    max_score = 1

    percentage = (
        score / max_score
    ) * 100

    # -----------------------------------------------------
    # 8. Create evaluation
    # -----------------------------------------------------

    evaluation = QuestionEvaluation(

        answer_id=answer.id,

        score=score,

        max_score=max_score,

        percentage=percentage,

        feedback=feedback
    )

    db.add(
        evaluation
    )

    try:

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to save MCQ evaluation"
        )

    db.refresh(
        evaluation
    )

    print(
        "✅ MCQ EVALUATION CREATED:",
        {
            "evaluation_id":
                evaluation.id,

            "answer_id":
                answer.id,

            "assessment_id":
                assessment.id,

            "user_id":
                assessment.user_id,

            "score":
                score,

            "percentage":
                percentage
        }
    )

    return evaluation


# =========================================================
# AI SUBJECTIVE EVALUATION
# =========================================================

@router.post(
    "/answers/{answer_id}/ai",
    response_model=EvaluationResponse
)
def evaluate_subjective_answer_endpoint(
    answer_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )
):

    # -----------------------------------------------------
    # 1. Find answer
    # -----------------------------------------------------

    answer = db.get(
        Answer,
        answer_id
    )

    if not answer:

        raise HTTPException(
            status_code=404,
            detail="Answer not found"
        )

    # -----------------------------------------------------
    # 2. Verify ownership
    # -----------------------------------------------------

    (
        assessment_question,
        assessment
    ) = verify_answer_ownership(
        db,
        answer,
        current_user
    )

    # -----------------------------------------------------
    # 3. Check existing evaluation
    # -----------------------------------------------------

    existing_evaluation = (
        db.query(
            QuestionEvaluation
        )
        .filter(
            QuestionEvaluation.answer_id
            == answer_id
        )
        .first()
    )

    if existing_evaluation:

        raise HTTPException(
            status_code=409,
            detail="This answer has already been evaluated"
        )

    # -----------------------------------------------------
    # 4. Find question
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
    # 5. Validate question type
    # -----------------------------------------------------

    if question.question_type not in (
        "SHORT_ANSWER",
        "SCENARIO",
        "CASE_STUDY"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This endpoint is only for "
                "subjective questions"
            )
        )

    # -----------------------------------------------------
    # 6. Get rubrics
    # -----------------------------------------------------

    rubrics = (
        db.query(
            QuestionRubric
        )
        .filter(
            QuestionRubric.question_id
            == question.id
        )
        .order_by(
            QuestionRubric.id
        )
        .all()
    )

    if not rubrics:

        raise HTTPException(
            status_code=400,
            detail=(
                "No evaluation rubrics configured "
                "for this question"
            )
        )

    # -----------------------------------------------------
    # 7. Call AI
    # -----------------------------------------------------

    try:

        ai_result = evaluate_subjective_answer(

            question_text=
                question.question_text,

            answer_text=
                answer.answer_text,

            rubrics=
                rubrics
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                f"AI evaluation failed: {str(exc)}"
            )
        )

    # -----------------------------------------------------
    # 8. Validate rubric IDs
    # -----------------------------------------------------

    rubric_map = {

        rubric.id:
            rubric

        for rubric in rubrics
    }

    returned_ids = {

        criterion.rubric_id

        for criterion
        in ai_result.criteria
    }

    expected_ids = set(
        rubric_map.keys()
    )

    if returned_ids != expected_ids:

        raise HTTPException(
            status_code=500,
            detail=(
                "AI returned an incomplete "
                "or invalid rubric evaluation"
            )
        )

    # -----------------------------------------------------
    # 9. Calculate final score in Python
    # -----------------------------------------------------

    total_score = 0

    total_max_score = 0

    criterion_results = []

    for criterion in ai_result.criteria:

        rubric = rubric_map[
            criterion.rubric_id
        ]

        max_score = float(
            rubric.weight
        )

        score = float(
            criterion.score
        )

        if (
            score < 0
            or score > max_score
        ):

            raise HTTPException(
                status_code=500,
                detail=(
                    f"Invalid AI score for "
                    f"rubric {rubric.id}"
                )
            )

        total_score += score

        total_max_score += max_score

        criterion_results.append(
            (
                rubric,
                score,
                criterion.feedback
            )
        )

    if total_max_score == 0:

        raise HTTPException(
            status_code=500,
            detail=(
                "Total rubric weight cannot be zero"
            )
        )

    percentage = (
        total_score
        / total_max_score
    ) * 100

    # -----------------------------------------------------
    # 10. Create overall evaluation
    # -----------------------------------------------------

    evaluation = QuestionEvaluation(

        answer_id=answer.id,

        score=total_score,

        max_score=total_max_score,

        percentage=percentage,

        feedback=
            ai_result.overall_feedback
    )

    db.add(
        evaluation
    )

    db.flush()

    # -----------------------------------------------------
    # 11. Store criterion results
    # -----------------------------------------------------

    for (
        rubric,
        score,
        feedback
    ) in criterion_results:

        result = EvaluationCriteriaResult(

            evaluation_id=
                evaluation.id,

            rubric_id=
                rubric.id,

            score=
                score,

            max_score=
                float(
                    rubric.weight
                ),

            feedback=
                feedback
        )

        db.add(
            result
        )

    try:

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save AI evaluation"
            )
        )

    db.refresh(
        evaluation
    )

    print(
        "✅ AI EVALUATION CREATED:",
        {
            "evaluation_id":
                evaluation.id,

            "answer_id":
                answer.id,

            "assessment_id":
                assessment.id,

            "user_id":
                assessment.user_id,

            "score":
                total_score,

            "max_score":
                total_max_score,

            "percentage":
                percentage
        }
    )

    return evaluation


# =========================================================
# ADAPTIVE DECISION
# =========================================================

@router.post(
    "/{evaluation_id}/adaptive-decision"
)
def create_adaptive_decision(
    evaluation_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )
):

    print(
        "🔥 ADAPTIVE DECISION:",
        {
            "evaluation_id":
                evaluation_id,

            "user_id":
                current_user.id
        }
    )

    # =====================================================
    # 1. FIND EVALUATION
    # =====================================================

    evaluation = db.get(
        QuestionEvaluation,
        evaluation_id
    )

    if not evaluation:

        raise HTTPException(
            status_code=404,
            detail="Evaluation not found"
        )

    # =====================================================
    # 2. FIND ANSWER
    # =====================================================

    answer = db.get(
        Answer,
        evaluation.answer_id
    )

    if not answer:

        raise HTTPException(
            status_code=404,
            detail="Answer not found"
        )

    # =====================================================
    # 3. FIND ASSESSMENT QUESTION
    # =====================================================

    assessment_question = db.get(
        AssessmentQuestion,
        answer.assessment_question_id
    )

    if not assessment_question:

        raise HTTPException(
            status_code=404,
            detail="Assessment question not found"
        )

    # =====================================================
    # 4. FIND ASSESSMENT
    # =====================================================

    assessment = db.get(
        Assessment,
        assessment_question.assessment_id
    )

    if not assessment:

        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    # =====================================================
    # 5. VERIFY OWNERSHIP
    # =====================================================

    if assessment.user_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have access to "
                "this assessment"
            )
        )

    print(
        "✅ Assessment ownership verified:",
        {
            "assessment_id":
                assessment.id,

            "assessment_user_id":
                assessment.user_id,

            "current_user_id":
                current_user.id
        }
    )

    # =====================================================
    # 6. RETRY-SAFE CHECK
    # =====================================================

    existing_decision = (
        db.query(
            AssessmentAdaptiveDecision
        )
        .filter(
            AssessmentAdaptiveDecision.assessment_id
            == assessment.id,

            AssessmentAdaptiveDecision.evaluation_id
            == evaluation.id
        )
        .first()
    )

    if existing_decision:

        print(
            "♻️ ADAPTIVE DECISION ALREADY EXISTS:",
            {
                "adaptive_decision_id":
                    existing_decision.id,

                "assessment_id":
                    assessment.id,

                "evaluation_id":
                    evaluation.id
            }
        )

        return {

            "id":
                existing_decision.id,

            "assessment_id":
                existing_decision.assessment_id,

            "evaluation_id":
                existing_decision.evaluation_id,

            "current_level":
                existing_decision.current_level,

            "average_percentage":
                float(
                    existing_decision.average_percentage
                ),

            "next_level":
                existing_decision.next_level,

            "decision":
                existing_decision.decision,

            "assessment_status":
                assessment.status,

            "final_level":
                assessment.final_level,

            "skill_gap_generated":
                (
                    db.query(
                        generate_skill_gap_analysis
                    )
                    if False
                    else None
                ),

            "created_at":
                existing_decision.created_at
        }

    # =====================================================
    # 7. CURRENT LEVEL
    # =====================================================

    current_level = (
        assessment.current_level
    )

    if current_level is None:

        current_level = (
            assessment.starting_level
        )

        assessment.current_level = (
            current_level
        )

    print(
        "🔥 CURRENT ADAPTIVE LEVEL:",
        {
            "assessment_id":
                assessment.id,

            "current_level":
                current_level
        }
    )

    # =====================================================
    # 8. LAST ADAPTIVE DECISION
    # =====================================================

    last_adaptive_decision = (
        db.query(
            AssessmentAdaptiveDecision
        )
        .filter(
            AssessmentAdaptiveDecision.assessment_id
            == assessment.id
        )
        .order_by(
            AssessmentAdaptiveDecision.id.desc()
        )
        .first()
    )

    # =====================================================
    # 9. CURRENT ADAPTIVE ROUND
    # =====================================================

    query = (
        db.query(
            QuestionEvaluation
        )
        .join(
            Answer,
            Answer.id
            == QuestionEvaluation.answer_id
        )
        .join(
            AssessmentQuestion,
            AssessmentQuestion.id
            == Answer.assessment_question_id
        )
        .filter(
            AssessmentQuestion.assessment_id
            == assessment.id,

            AssessmentQuestion.difficulty_level
            == current_level
        )
    )

    # -----------------------------------------------------
    # Only evaluations after the previous decision
    # -----------------------------------------------------

    if last_adaptive_decision:

        query = query.filter(

            QuestionEvaluation.id
            >
            last_adaptive_decision.evaluation_id
        )

    round_evaluations = (
        query
        .order_by(
            QuestionEvaluation.id.asc()
        )
        .all()
    )

    print(
        "📊 CURRENT ADAPTIVE ROUND:",
        {
            "assessment_id":
                assessment.id,

            "current_level":
                current_level,

            "last_adaptive_decision":
                (
                    last_adaptive_decision.id
                    if last_adaptive_decision
                    else None
                ),

            "evaluation_ids":
                [
                    e.id
                    for e
                    in round_evaluations
                ],

            "evaluation_count":
                len(
                    round_evaluations
                )
        }
    )

    # =====================================================
    # 10. VERIFY EVALUATION BELONGS TO CURRENT ROUND
    # =====================================================

    evaluation_ids = [
        e.id
        for e
        in round_evaluations
    ]

    if evaluation.id not in evaluation_ids:

        raise HTTPException(
            status_code=409,
            detail=(
                "This evaluation does not belong "
                "to the current adaptive round."
            )
        )

    # =====================================================
    # 11. REQUIRE THREE EVALUATIONS
    # =====================================================

    evaluation_count = len(
        round_evaluations
    )

    if evaluation_count < 3:

        print(
            "⏳ COLLECTING ADAPTIVE EVIDENCE:",
            {
                "assessment_id":
                    assessment.id,

                "current_level":
                    current_level,

                "questions_evaluated":
                    evaluation_count,

                "questions_required":
                    3
            }
        )

        return {

            "status":
                "COLLECTING_EVIDENCE",

            "assessment_id":
                assessment.id,

            "evaluation_id":
                evaluation.id,

            "current_level":
                current_level,

            "average_percentage":
                None,

            "next_level":
                None,

            "decision":
                None,

            "questions_evaluated":
                evaluation_count,

            "questions_required":
                3,

            "message":
                (
                    "More questions are required "
                    "before making an adaptive decision."
                )
        }

    # =====================================================
    # 12. ONLY FIRST THREE
    # =====================================================

    if evaluation_count > 3:

        print(
            "⚠️ MORE THAN THREE EVALUATIONS:",
            {
                "assessment_id":
                    assessment.id,

                "current_level":
                    current_level,

                "evaluation_count":
                    evaluation_count
            }
        )

        round_evaluations = (
            round_evaluations[:3]
        )

        evaluation_count = 3

    # =====================================================
    # 13. CALCULATE AVERAGE
    # =====================================================

    average_percentage = (

        sum(
            float(
                e.percentage
            )
            for e
            in round_evaluations
        )

        / evaluation_count
    )

    print(
        "📊 ADAPTIVE AVERAGE:",
        {
            "assessment_id":
                assessment.id,

            "current_level":
                current_level,

            "evaluation_ids":
                [
                    e.id
                    for e
                    in round_evaluations
                ],

            "average_percentage":
                average_percentage
        }
    )

    # =====================================================
    # 14. RUN ADAPTIVE ENGINE
    # =====================================================

    decision = calculate_next_level(

        current_level=
            current_level,

        average_percentage=
            average_percentage
    )

    decision_name = (
        decision.decision
    )

    next_level = (
        decision.next_level
    )

    print(
        "🧠 ADAPTIVE ENGINE RESULT:",
        {
            "current_level":
                current_level,

            "average_percentage":
                average_percentage,

            "next_level":
                next_level,

            "decision":
                decision_name
        }
    )

    # =====================================================
    # 15. DEMOTION AFTER PREVIOUS PROMOTION
    # =====================================================

    if decision_name == "DEMOTE":

        previously_demonstrated = (
            db.query(
                AssessmentAdaptiveDecision
            )
            .filter(

                AssessmentAdaptiveDecision.assessment_id
                == assessment.id,

                AssessmentAdaptiveDecision.decision
                == "PROMOTE",

                AssessmentAdaptiveDecision.next_level
                == next_level
            )
            .first()
        )

        if previously_demonstrated:

            decision_name = (
                "FINALIZE_AFTER_DEMOTION"
            )

            next_level = (
                decision.next_level
            )

            print(
                "🏁 FINALIZING AFTER DEMOTION:",
                {
                    "previous_level":
                        current_level,

                    "final_level":
                        next_level
                }
            )

    # =====================================================
    # 16. APPLY DECISION
    # =====================================================

    if decision_name == "PROMOTE":

        assessment.previous_level = (
            current_level
        )

        assessment.current_level = (
            next_level
        )

        print(
            "⬆️ LEVEL PROMOTED:",
            {
                "from":
                    current_level,

                "to":
                    next_level
            }
        )

    elif decision_name == "DEMOTE":

        assessment.previous_level = (
            current_level
        )

        assessment.current_level = (
            next_level
        )

        print(
            "⬇️ LEVEL DEMOTED:",
            {
                "from":
                    current_level,

                "to":
                    next_level
            }
        )

    elif decision_name == "REMAIN":

        assessment.final_level = (
            current_level
        )

        assessment.status = (
            "COMPLETED"
        )

        assessment.completed_at = (
            datetime.utcnow()
        )

        print(
            "🏁 ASSESSMENT COMPLETED:",
            {
                "final_level":
                    current_level
            }
        )

    elif decision_name == "MASTERY":

        assessment.final_level = (
            current_level
        )

        assessment.status = (
            "COMPLETED"
        )

        assessment.completed_at = (
            datetime.utcnow()
        )

        print(
            "🏆 MASTERY ACHIEVED:",
            {
                "final_level":
                    current_level
            }
        )

    elif (
        decision_name
        == "FINALIZE_AFTER_DEMOTION"
    ):

        assessment.current_level = (
            next_level
        )

        assessment.final_level = (
            next_level
        )

        assessment.status = (
            "COMPLETED"
        )

        assessment.completed_at = (
            datetime.utcnow()
        )

        print(
            "🏁 FINALIZED AFTER DEMOTION:",
            {
                "final_level":
                    next_level
            }
        )

    # =====================================================
    # 17. CREATE ADAPTIVE DECISION
    # =====================================================

    adaptive_decision = (
        AssessmentAdaptiveDecision(

            assessment_id=
                assessment.id,

            evaluation_id=
                evaluation.id,

            current_level=
                current_level,

            average_percentage=
                average_percentage,

            next_level=
                next_level,

            decision=
                decision_name
        )
    )

    db.add(
        adaptive_decision
    )

    db.add(
        assessment
    )

    # =====================================================
    # 18. CRITICAL FIX
    #
    # COMMIT ADAPTIVE STATE BEFORE SKILL GAP
    #
    # This means Skill Gap failure can NEVER roll back:
    #
    # - current_level
    # - previous_level
    # - final_level
    # - status
    # - adaptive decision
    # =====================================================

    try:

        db.commit()

    except Exception as exc:

        db.rollback()

        print(
            "❌ ADAPTIVE DECISION COMMIT FAILED:",
            str(exc)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save adaptive decision"
            )
        )

    db.refresh(
        adaptive_decision
    )

    db.refresh(
        assessment
    )

    # =====================================================
    # 19. SKILL GAP GENERATION
    #
    # This happens AFTER the adaptive state is committed.
    #
    # If this fails, DO NOT rollback the assessment.
    # =====================================================

    skill_gap_generated = False

    skill_gap_error = None

    if assessment.status == "COMPLETED":

        try:

            generate_skill_gap_analysis(

                db=db,

                assessment_id=
                    assessment.id
            )

            skill_gap_generated = True

            print(
                "✅ SKILL GAP GENERATED:",
                {
                    "assessment_id":
                        assessment.id
                }
            )

        except ValueError as exc:

            # -------------------------------------------------
            # IMPORTANT:
            #
            # The adaptive decision has already been committed.
            #
            # We only rollback the unfinished Skill Gap
            # transaction.
            # -------------------------------------------------

            db.rollback()

            skill_gap_error = str(
                exc
            )

            print(
                "⚠️ SKILL GAP GENERATION DEFERRED:",
                {
                    "assessment_id":
                        assessment.id,

                    "reason":
                        skill_gap_error
                }
            )

        except Exception as exc:

            db.rollback()

            skill_gap_error = str(
                exc
            )

            print(
                "❌ SKILL GAP GENERATION FAILED:",
                {
                    "assessment_id":
                        assessment.id,

                    "reason":
                        skill_gap_error
                }
            )

    # =====================================================
    # 20. FINAL REFRESH
    # =====================================================

    db.refresh(
        assessment
    )

    # =====================================================
    # 21. RESULT
    # =====================================================

    print(
        "✅ ADAPTIVE DECISION CREATED:",
        {
            "adaptive_decision_id":
                adaptive_decision.id,

            "assessment_id":
                assessment.id,

            "evaluation_id":
                evaluation.id,

            "user_id":
                assessment.user_id,

            "current_level":
                current_level,

            "average_percentage":
                round(
                    average_percentage,
                    2
                ),

            "next_level":
                next_level,

            "decision":
                decision_name,

            "assessment_status":
                assessment.status,

            "final_level":
                assessment.final_level,

            "skill_gap_generated":
                skill_gap_generated,

            "skill_gap_error":
                skill_gap_error
        }
    )

    return {

        "id":
            adaptive_decision.id,

        "assessment_id":
            adaptive_decision.assessment_id,

        "evaluation_id":
            adaptive_decision.evaluation_id,

        "current_level":
            current_level,

        "average_percentage":
            round(
                average_percentage,
                2
            ),

        "next_level":
            next_level,

        "decision":
            decision_name,

        "assessment_status":
            assessment.status,

        "final_level":
            assessment.final_level,

        "skill_gap_generated":
            skill_gap_generated,

        "skill_gap_error":
            skill_gap_error,

        "created_at":
            adaptive_decision.created_at
    }