import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";
import "./Assessment.css";


function Assessment() {

  const { assessmentId } = useParams();
  const navigate = useNavigate();


  // =========================================================
  // QUESTION STATE
  // =========================================================

  const [question, setQuestion] = useState(null);

  const [answer, setAnswer] = useState("");

  const [selectedOption, setSelectedOption] =
    useState("");


  // =========================================================
  // ASSESSMENT STATE
  // =========================================================

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [answered, setAnswered] =
    useState(false);

  const [assessmentCompleted, setAssessmentCompleted] =
    useState(false);


  // =========================================================
  // EVALUATION STATE
  // =========================================================

  /*
   * IMPORTANT
   *
   * answer ID and evaluation ID are separate.
   *
   * answer ID:
   *   Used to evaluate an answer.
   *
   * evaluation ID:
   *   Used to run the adaptive decision.
   *
   * If evaluation succeeds but adaptive decision fails,
   * we MUST NOT evaluate the answer again.
   *
   * We retry the adaptive decision using evaluation ID.
   */

  const [currentAnswerId, setCurrentAnswerId] =
    useState(null);

  const [currentEvaluationId, setCurrentEvaluationId] =
    useState(null);

  const [adaptiveResult, setAdaptiveResult] =
    useState(null);


  // =========================================================
  // DEBUG
  // =========================================================

  console.log(
    "🔥 Assessment ID:",
    assessmentId
  );


  // =========================================================
  // PERSIST PENDING EVALUATION
  // =========================================================

  /*
   * Store the evaluation ID locally.
   *
   * This protects us if the user leaves the assessment
   * after evaluation succeeded but before adaptive decision
   * succeeded.
   */

  const pendingEvaluationStorageKey =
    `pending_evaluation_${assessmentId}`;


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {

    if (!assessmentId) {

      console.error(
        "❌ No assessmentId found in URL"
      );

      setError(
        "Assessment ID is missing. Please return to My Assessments and select an assessment."
      );

      setLoading(false);

      return;
    }

    loadNextQuestion();

  }, [assessmentId]);


  // =========================================================
  // GENERATE SKILL GAP
  // =========================================================

  const goToSkillGap = async () => {

    try {

      console.log(
        "🔥 Generating Skill Gap Analysis for:",
        assessmentId
      );

      const response =
        await api.post(
          `/skill-gap/assessments/${assessmentId}`
        );

      console.log(
        "✅ Skill Gap Analysis created:",
        response.data
      );

      navigate(
        `/skill-gap/${assessmentId}`
      );

    } catch (err) {

      console.error(
        "❌ Skill Gap Analysis error:",
        err.response?.data || err
      );

      const detail =
        err.response?.data?.detail;


      // -----------------------------------------------------
      // Analysis already exists
      // -----------------------------------------------------

      if (
        typeof detail === "string" &&
        detail
          .toLowerCase()
          .includes("already exists")
      ) {

        navigate(
          `/skill-gap/${assessmentId}`
        );

        return;
      }


      setError(
        typeof detail === "string"
          ? detail
          : "Assessment completed, but Skill Gap Analysis could not be generated."
      );

    }

  };


  // =========================================================
  // LOAD NEXT QUESTION
  // =========================================================

  const loadNextQuestion = async () => {

    if (!assessmentId) {
      return;
    }

    try {

      setLoading(true);

      setError("");

      setAnswer("");

      setSelectedOption("");

      setAnswered(false);

      setCurrentAnswerId(null);

      setCurrentEvaluationId(null);

      setAdaptiveResult(null);


      console.log(
        "🔥 Loading question for assessment:",
        assessmentId
      );


      const response =
        await api.post(
          `/assessments/${assessmentId}/next-question`
        );


      console.log(
        "✅ Next question response:",
        response.data
      );


      // =====================================================
      // ASSESSMENT COMPLETED
      // =====================================================

      if (
        response.data?.completed === true
      ) {

        console.log(
          "🎉 Assessment completed:",
          response.data
        );

        setAssessmentCompleted(true);

        await goToSkillGap();

        return;
      }


      // =====================================================
      // NORMAL QUESTION
      // =====================================================

      setQuestion(
        response.data
      );


    } catch (err) {

      console.error(
        "❌ Next question error:",
        err.response?.data || err
      );


      const detail =
        err.response?.data?.detail;


      // =====================================================
      // NO UNUSED QUESTION
      // =====================================================

      if (
        typeof detail === "string" &&
        detail
          .toLowerCase()
          .includes("no unused question")
      ) {

        console.log(
          "🎉 No unused questions remaining."
        );

        await goToSkillGap();

        return;
      }


      // =====================================================
      // ADAPTIVE LEVEL HAS NO QUESTIONS
      //
      // This is important.
      //
      // If the previous answer was evaluated but the
      // adaptive decision failed, the backend may report:
      //
      // "No unanswered questions are available at
      // adaptive level X..."
      //
      // Do NOT blindly retry next-question forever.
      // =====================================================

      if (
        typeof detail === "string" &&
        (
          detail
            .toLowerCase()
            .includes(
              "no unanswered questions are available"
            )
          ||
          detail
            .toLowerCase()
            .includes(
              "adaptive decision must be completed"
            )
        )
      ) {

        console.warn(
          "⚠️ Current adaptive level has no unanswered questions.",
          detail
        );


        /*
         * Check whether we have a pending evaluation
         * stored from the previous attempt.
         */

        const savedEvaluationId =
          sessionStorage.getItem(
            pendingEvaluationStorageKey
          );


        if (savedEvaluationId) {

          console.log(
            "♻️ Found pending adaptive evaluation:",
            savedEvaluationId
          );


          try {

            setSubmitting(true);

            setError("");


            const adaptive =
              await runAdaptiveDecision(
                Number(
                  savedEvaluationId
                )
              );


            console.log(
              "✅ Recovered adaptive decision:",
              adaptive
            );


            sessionStorage.removeItem(
              pendingEvaluationStorageKey
            );


            setAdaptiveResult(
              adaptive
            );


            if (
              adaptive?.assessment_status ===
              "COMPLETED"
            ) {

              setAssessmentCompleted(
                true
              );

              setAnswered(
                true
              );

              setLoading(false);

              return;
            }


            /*
             * Decision successfully applied.
             *
             * Now request the next question.
             */

            await loadNextQuestion();

            return;

          } catch (adaptiveError) {

            console.error(
              "❌ Failed to recover adaptive decision:",
              adaptiveError.response?.data ||
                adaptiveError
            );


            const adaptiveDetail =
              adaptiveError
                .response
                ?.data
                ?.detail;


            setError(
              typeof adaptiveDetail ===
              "string"
                ? adaptiveDetail
                : "The previous answer was evaluated, but the adaptive decision could not be completed. Please retry."
            );

            return;

          } finally {

            setSubmitting(false);

          }

        }


        setError(
          detail
        );

        return;
      }


      // =====================================================
      // ASSESSMENT NOT IN PROGRESS
      // =====================================================

      if (
        typeof detail === "string" &&
        detail
          .toLowerCase()
          .includes("not in progress")
      ) {

        setAssessmentCompleted(
          true
        );

        await goToSkillGap();

        return;
      }


      // =====================================================
      // FASTAPI VALIDATION ERROR
      // =====================================================

      if (
        Array.isArray(detail)
      ) {

        const messages =
          detail
            .map(
              (item) =>
                item.msg
            )
            .filter(Boolean);


        setError(
          messages.length > 0
            ? messages.join(". ")
            : "The server rejected the request."
        );

        return;
      }


      // =====================================================
      // NORMAL API ERROR
      // =====================================================

      if (
        typeof detail === "string"
      ) {

        setError(
          detail
        );

        return;
      }


      setError(
        "Unable to load the next question. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // EVALUATE ANSWER
  // =========================================================

  const evaluateAnswer = async (
    answerId
  ) => {

    if (!answerId) {

      throw new Error(
        "Answer ID is missing. Cannot evaluate the answer."
      );

    }


    if (!question) {

      throw new Error(
        "Question information is missing."
      );

    }


    const isMCQ =
      question.question_type ===
      "MCQ";


    console.log(
      "🔥 Evaluating answer:",
      answerId,
      question.question_type
    );


    let response;


    // =====================================================
    // MCQ
    // =====================================================

    if (isMCQ) {

      response =
        await api.post(
          `/evaluations/answers/${answerId}`
        );

    }


    // =====================================================
    // SUBJECTIVE
    // =====================================================

    else {

      response =
        await api.post(
          `/evaluations/answers/${answerId}/ai`
        );

    }


    console.log(
      "✅ Evaluation response:",
      response.data
    );


    const evaluationId =
      response.data?.id;


    if (!evaluationId) {

      throw new Error(
        "Evaluation ID was not returned by the server."
      );

    }


    // -----------------------------------------------------
    // Save evaluation ID in React state
    // -----------------------------------------------------

    setCurrentEvaluationId(
      evaluationId
    );


    // -----------------------------------------------------
    // Persist evaluation ID.
    //
    // If adaptive decision fails and user exits,
    // we can recover it later.
    // -----------------------------------------------------

    sessionStorage.setItem(
      pendingEvaluationStorageKey,
      String(evaluationId)
    );


    return response.data;

  };


  // =========================================================
  // RUN ADAPTIVE DECISION
  // =========================================================

  const runAdaptiveDecision = async (
    evaluationId
  ) => {

    if (!evaluationId) {

      throw new Error(
        "Evaluation ID is missing."
      );

    }


    console.log(
      "🧠 Running adaptive decision:",
      evaluationId
    );


    const response =
      await api.post(
        `/evaluations/${evaluationId}/adaptive-decision`
      );


    console.log(
      "🧠 Adaptive decision response:",
      response.data
    );


    setAdaptiveResult(
      response.data
    );


    return response.data;

  };


  // =========================================================
  // EVALUATE + ADAPT
  // =========================================================

  const evaluateAndAdapt = async (
    answerId
  ) => {

    try {

      setSubmitting(true);

      setError("");


      // =====================================================
      // STEP 1
      // Evaluate answer
      // =====================================================

      const evaluation =
        await evaluateAnswer(
          answerId
        );


      console.log(
        "📊 Evaluation created:",
        evaluation
      );


      // =====================================================
      // STEP 2
      // Adaptive decision
      // =====================================================

      const adaptive =
        await runAdaptiveDecision(
          evaluation.id
        );


      console.log(
        "🧠 Adaptive result:",
        adaptive
      );


      // =====================================================
      // Adaptive decision succeeded
      // =====================================================

      sessionStorage.removeItem(
        pendingEvaluationStorageKey
      );


      // =====================================================
      // COLLECTING EVIDENCE
      // =====================================================

      if (
        adaptive?.status ===
        "COLLECTING_EVIDENCE"
      ) {

        console.log(
          "📚 Collecting evidence:",
          adaptive.questions_evaluated,
          "/",
          adaptive.questions_required
        );


        setAnswered(
          true
        );

        return;
      }


      // =====================================================
      // ASSESSMENT COMPLETED
      // =====================================================

      if (
        adaptive?.assessment_status ===
        "COMPLETED"
      ) {

        console.log(
          "🎉 Adaptive engine completed assessment:",
          adaptive
        );


        setAnswered(
          true
        );

        setAssessmentCompleted(
          true
        );

        return;
      }


      // =====================================================
      // PROMOTE
      // =====================================================

      if (
        adaptive?.decision ===
        "PROMOTE"
      ) {

        console.log(
          `⬆️ Adaptive level promotion: ${adaptive.current_level} → ${adaptive.next_level}`
        );

      }


      // =====================================================
      // DEMOTE
      // =====================================================

      if (
        adaptive?.decision ===
        "DEMOTE"
      ) {

        console.log(
          `⬇️ Adaptive level demotion: ${adaptive.current_level} → ${adaptive.next_level}`
        );

      }


      // =====================================================
      // REMAIN
      // =====================================================

      if (
        adaptive?.decision ===
        "REMAIN"
      ) {

        console.log(
          "🟡 Assessment remains at current level and is completed."
        );


        setAssessmentCompleted(
          true
        );

      }


      // =====================================================
      // MASTERY
      // =====================================================

      if (
        adaptive?.decision ===
        "MASTERY"
      ) {

        console.log(
          "🏆 Mastery achieved."
        );


        setAssessmentCompleted(
          true
        );

      }


      // =====================================================
      // FINALIZE AFTER DEMOTION
      // =====================================================

      if (
        adaptive?.decision ===
        "FINALIZE_AFTER_DEMOTION"
      ) {

        console.log(
          "🛑 Assessment finalized after demotion."
        );


        setAssessmentCompleted(
          true
        );

      }


      setAnswered(
        true
      );


    } catch (err) {

      console.error(
        "❌ Evaluation/adaptive error:",
        err.response?.data ||
          err
      );


      const detail =
        err.response?.data?.detail;


      // =====================================================
      // FASTAPI VALIDATION ERROR
      // =====================================================

      if (
        Array.isArray(detail)
      ) {

        const messages =
          detail
            .map(
              (item) =>
                item.msg
            )
            .filter(Boolean);


        setError(
          messages.length > 0
            ? messages.join(". ")
            : "Unable to evaluate the answer."
        );

        return;
      }


      // =====================================================
      // NORMAL API ERROR
      // =====================================================

      if (
        typeof detail ===
        "string"
      ) {

        setError(
          detail
        );

        return;
      }


      // =====================================================
      // JAVASCRIPT ERROR
      // =====================================================

      if (
        err instanceof Error
      ) {

        setError(
          err.message
        );

        return;
      }


      setError(
        "Unable to evaluate the answer. Please try again."
      );

    } finally {

      setSubmitting(false);

    }

  };


  // =========================================================
  // SUBMIT ANSWER
  // =========================================================

  const submitAnswer = async () => {

    if (!question) {
      return;
    }


    const finalAnswer =
      question.question_type ===
      "MCQ"

        ? selectedOption

        : answer.trim();


    // =====================================================
    // VALIDATE
    // =====================================================

    if (!finalAnswer) {

      setError(
        "Please provide an answer before continuing."
      );

      return;
    }


    try {

      setSubmitting(
        true
      );

      setError("");


      console.log(
        "🔥 Submitting answer:",
        finalAnswer
      );


      // =====================================================
      // STEP 1
      // SAVE ANSWER
      // =====================================================

      const response =
        await api.post(
          `/assessments/questions/${question.assessment_question_id}/answer`,
          {
            answer_text:
              finalAnswer
          }
        );


      console.log(
        "✅ Answer submitted:",
        response.data
      );


      const answerId =
        response.data?.id;


      if (!answerId) {

        throw new Error(
          "Answer ID was not returned by the server."
        );

      }


      // =====================================================
      // IMPORTANT
      //
      // Store answer ID BEFORE evaluation.
      // =====================================================

      setCurrentAnswerId(
        answerId
      );


      // =====================================================
      // STEP 2 + 3
      //
      // Evaluate answer
      // +
      // Run adaptive decision
      // =====================================================

      await evaluateAndAdapt(
        answerId
      );


    } catch (err) {

      console.error(
        "❌ Submit answer error:",
        err.response?.data ||
          err
      );


      const detail =
        err.response?.data?.detail;


      // =====================================================
      // FASTAPI VALIDATION ERROR
      // =====================================================

      if (
        Array.isArray(detail)
      ) {

        const messages =
          detail
            .map(
              (item) =>
                item.msg
            )
            .filter(Boolean);


        setError(
          messages.length > 0
            ? messages.join(". ")
            : "Unable to submit the answer."
        );

        return;
      }


      // =====================================================
      // NORMAL API ERROR
      // =====================================================

      if (
        typeof detail ===
        "string"
      ) {

        setError(
          detail
        );

        return;
      }


      // =====================================================
      // JAVASCRIPT ERROR
      // =====================================================

      if (
        err instanceof Error
      ) {

        setError(
          err.message
        );

        return;
      }


      setError(
        "Unable to submit the answer. Please try again."
      );

    } finally {

      setSubmitting(
        false
      );

    }

  };


  // =========================================================
  // RETRY ADAPTIVE DECISION
  // =========================================================

  /*
   * THIS IS THE IMPORTANT FIX.
   *
   * Previously:
   *
   * retryEvaluation()
   *      ↓
   * evaluateAndAdapt(answerId)
   *      ↓
   * evaluate answer AGAIN
   *      ↓
   * 409 Already Evaluated
   *
   *
   * Now:
   *
   * retryEvaluation()
   *      ↓
   * adaptive decision ONLY
   *      ↓
   * /evaluations/{evaluationId}/adaptive-decision
   */

  const retryEvaluation = async () => {

    let evaluationId =
      currentEvaluationId;


    // -----------------------------------------------------
    // If React state does not contain it, recover it from
    // sessionStorage.
    // -----------------------------------------------------

    if (!evaluationId) {

      const savedEvaluationId =
        sessionStorage.getItem(
          pendingEvaluationStorageKey
        );


      if (
        savedEvaluationId
      ) {

        evaluationId =
          Number(
            savedEvaluationId
          );

        setCurrentEvaluationId(
          evaluationId
        );

      }

    }


    if (!evaluationId) {

      setError(
        "The evaluation ID could not be found. Please return to Assessments and continue the assessment."
      );

      return;
    }


    try {

      setSubmitting(
        true
      );

      setError("");


      console.log(
        "🔄 Retrying ADAPTIVE DECISION only:",
        evaluationId
      );


      const adaptive =
        await runAdaptiveDecision(
          evaluationId
        );


      console.log(
        "✅ Adaptive retry successful:",
        adaptive
      );


      // -----------------------------------------------------
      // Adaptive decision completed successfully.
      // -----------------------------------------------------

      sessionStorage.removeItem(
        pendingEvaluationStorageKey
      );


      // =====================================================
      // ASSESSMENT COMPLETED
      // =====================================================

      if (
        adaptive?.assessment_status ===
        "COMPLETED"
      ) {

        setAnswered(
          true
        );

        setAssessmentCompleted(
          true
        );

        return;
      }


      // =====================================================
      // COLLECTING EVIDENCE
      // =====================================================

      if (
        adaptive?.status ===
        "COLLECTING_EVIDENCE"
      ) {

        setAnswered(
          true
        );

        return;
      }


      // =====================================================
      // PROMOTE / DEMOTE
      // =====================================================

      if (
        adaptive?.decision ===
          "PROMOTE" ||

        adaptive?.decision ===
          "DEMOTE"
      ) {

        console.log(
          `📈 Adaptive level changed: ${adaptive.current_level} → ${adaptive.next_level}`
        );

      }


      setAnswered(
        true
      );


    } catch (err) {

      console.error(
        "❌ Adaptive retry failed:",
        err.response?.data ||
          err
      );


      const detail =
        err.response?.data?.detail;


      if (
        typeof detail ===
        "string"
      ) {

        setError(
          detail
        );

        return;
      }


      setError(
        "Unable to complete the adaptive decision. Please try again."
      );

    } finally {

      setSubmitting(
        false
      );

    }

  };


  // =========================================================
  // NEXT QUESTION
  // =========================================================

  const handleNextQuestion = async () => {

    // -------------------------------------------------------
    // If adaptive engine completed assessment
    // -------------------------------------------------------

    if (
      assessmentCompleted
    ) {

      await goToSkillGap();

      return;
    }


    // -------------------------------------------------------
    // Otherwise request next question
    // -------------------------------------------------------

    await loadNextQuestion();

  };


  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {

    return (

      <div className="assessment-state">

        <div className="assessment-loader"></div>

        <p>
          Loading question...
        </p>

      </div>

    );

  }


  // =========================================================
  // ERROR SCREEN
  // =========================================================

  if (
    error &&
    !question
  ) {

    return (

      <div className="assessment-state assessment-error">

        <h2>
          Unable to load assessment
        </h2>

        <p>
          {error}
        </p>


        <div className="assessment-error-actions">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/assessments"
              )
            }
          >
            Back to Assessments
          </button>


          {assessmentId && (

            <button
              type="button"
              onClick={
                loadNextQuestion
              }
            >
              Try Again
            </button>

          )}

        </div>

      </div>

    );

  }


  // =========================================================
  // NO QUESTION
  // =========================================================

  if (!question) {
    return null;
  }


  const isMCQ =
    question.question_type ===
    "MCQ";


  // =========================================================
  // DYNAMIC SKILL NAME
  // =========================================================

  const skillName =
    question.skill_name ||
    question.skill ||
    "Skill";


  // =========================================================
  // MAIN SCREEN
  // =========================================================

  return (

    <div className="assessment-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="assessment-header">

        <div>

          <p className="assessment-eyebrow">
            SKILLLENS
          </p>


          <h1>
            {skillName} Assessment
          </h1>


          <p className="assessment-subtitle">
            Test your practical{" "}
            {skillName} skills.
          </p>

        </div>


        <div className="question-number">

          <span>
            Question
          </span>

          <strong>
            {question.sequence_number}
          </strong>

        </div>

      </header>


      {/* =====================================================
          PROGRESS
      ===================================================== */}

      <div className="assessment-progress">

        <div
          className="assessment-progress-bar"
          style={{
            width: `${Math.min(
              question.sequence_number * 10,
              100
            )}%`
          }}
        />

      </div>


      {/* =====================================================
          QUESTION CARD
      ===================================================== */}

      <main className="question-card">


        {/* =================================================
            META
        ================================================= */}

        <div className="question-meta">

          <span className="difficulty">
            Level {question.level}
          </span>


          <span className="question-type">

            {isMCQ

              ? "Multiple Choice"

              : question.question_type ===
                "SHORT_ANSWER"

              ? "Short Answer"

              : question.question_type ===
                "SCENARIO"

              ? "Scenario"

              : question.question_type ===
                "CASE_STUDY"

              ? "Case Study"

              : "Written Response"}

          </span>

        </div>


        {/* =================================================
            QUESTION
        ================================================= */}

        <h2>
          {question.question_text}
        </h2>


        {/* =================================================
            MCQ OPTIONS
        ================================================= */}

        {isMCQ && (

          <div className="options">

            {question.options?.map(
              (option) => (

                <button
                  key={
                    option.option_key
                  }
                  type="button"
                  className={`option ${
                    selectedOption ===
                    option.option_key
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedOption(
                      option.option_key
                    )
                  }
                  disabled={
                    answered ||
                    submitting
                  }
                >

                  <span className="option-key">
                    {
                      option.option_key
                    }
                  </span>


                  <span className="option-text">
                    {
                      option.option_text
                    }
                  </span>


                  <span className="option-check">

                    {selectedOption ===
                    option.option_key
                      ? "✓"
                      : ""}

                  </span>

                </button>

              )
            )}

          </div>

        )}


        {/* =================================================
            SUBJECTIVE ANSWER
        ================================================= */}

        {!isMCQ && (

          <div className="answer-area">

            <textarea
              value={
                answer
              }
              onChange={(event) =>
                setAnswer(
                  event.target.value
                )
              }
              placeholder="Type your answer here..."
              disabled={
                answered ||
                submitting
              }
              rows={9}
            />


            <div className="character-hint">

              Explain your answer clearly
              and include relevant examples
              where appropriate.

            </div>

          </div>

        )}


        {/* =================================================
            ADAPTIVE STATUS
        ================================================= */}

        {adaptiveResult?.status ===
          "COLLECTING_EVIDENCE" && (

          <div className="answer-success">

            ✓ Answer evaluated successfully.

            <br />

            Evidence collected:{" "}

            {
              adaptiveResult.questions_evaluated
            }

            {" / "}

            {
              adaptiveResult.questions_required
            }

          </div>

        )}


        {/* =================================================
            COMPLETED MESSAGE
        ================================================= */}

        {answered &&
          assessmentCompleted && (

          <div className="answer-success">

            ✓ Assessment decision completed.

          </div>

        )}


        {/* =================================================
            EVALUATION ERROR
        ================================================= */}

        {error && (

          <div className="answer-error">

            {error}

          </div>

        )}


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="question-actions">


          {/* -----------------------------------------------
              EXIT
          ----------------------------------------------- */}

          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(
                "/assessments"
              )
            }
            disabled={
              submitting
            }
          >
            Exit Assessment
          </button>


          {/* =================================================
              NOT YET ANSWERED
          ================================================= */}

          {!answered &&
            !currentAnswerId && (

            <button
              type="button"
              className="submit-button"
              onClick={
                submitAnswer
              }
              disabled={
                submitting
              }
            >

              {submitting
                ? "Evaluating..."
                : "Submit Answer"}

              <span>
                →
              </span>

            </button>

          )}


          {/* =================================================
              ANSWER SAVED + ADAPTIVE DECISION FAILED
          ================================================= */}

          {!answered &&
            currentEvaluationId &&
            error && (

            <button
              type="button"
              className="submit-button"
              onClick={
                retryEvaluation
              }
              disabled={
                submitting
              }
            >

              {submitting
                ? "Retrying..."
                : "Retry Adaptive Decision"}

              <span>
                ↻
              </span>

            </button>

          )}


          {/* =================================================
              ANSWER SAVED BUT EVALUATION FAILED
          ================================================= */}

          {!answered &&
            currentAnswerId &&
            !currentEvaluationId &&
            error && (

            <button
              type="button"
              className="submit-button"
              onClick={
                async () => {

                  try {

                    setSubmitting(
                      true
                    );

                    setError("");

                    await evaluateAndAdapt(
                      currentAnswerId
                    );

                  } finally {

                    setSubmitting(
                      false
                    );

                  }

                }
              }
              disabled={
                submitting
              }
            >

              {submitting
                ? "Retrying..."
                : "Retry Evaluation"}

              <span>
                ↻
              </span>

            </button>

          )}


          {/* =================================================
              EVALUATED
          ================================================= */}

          {answered && (

            <button
              type="button"
              className="submit-button"
              onClick={
                handleNextQuestion
              }
              disabled={
                submitting
              }
            >

              {assessmentCompleted
                ? "View Skill Gap"
                : "Next Question"}

              <span>
                →
              </span>

            </button>

          )}

        </div>


      </main>

    </div>

  );

}


export default Assessment;