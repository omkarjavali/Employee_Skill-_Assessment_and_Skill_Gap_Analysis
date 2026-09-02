import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./ReviewAnswer.css";

function ReviewAnswer() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD REVIEW
  // KEEP THIS EXACTLY AS YOUR WORKING VERSION
  // =========================================================

  useEffect(() => {
    const loadReview = async () => {
      try {
        setLoading(true);
        setError("");

        console.log(
          "🔥 Loading assessment review:",
          assessmentId
        );

        const response = await api.get(
          `/assessments/${assessmentId}/review`
        );

        console.log(
          "✅ Assessment review:",
          response.data
        );

        setReview(response.data);

      } catch (err) {
        console.error(
          "❌ Assessment review error:",
          err.response?.data || err
        );

        const detail =
          err.response?.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Unable to load your assessment answers."
        );

      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      loadReview();
    }

  }, [assessmentId]);


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="review-answer-page">

        <div className="review-answer-state">

          <div className="review-answer-loader" />

          <p>
            Loading your answers...
          </p>

        </div>

      </div>
    );
  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="review-answer-page">

        <div className="review-answer-state review-answer-error">

          <div className="review-error-icon">
            !
          </div>

          <h2>
            Unable to load answers
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/assessment/${assessmentId}`
              )
            }
          >
            ← Back to Assessment
          </button>

        </div>

      </div>
    );
  }


  // =========================================================
  // NO DATA
  // =========================================================

  if (!review) {
    return null;
  }


  const questions =
    Array.isArray(review.questions)
      ? review.questions
      : [];


  // =========================================================
  // HELPERS
  // =========================================================

  const getQuestionTypeLabel = (
    questionType
  ) => {

    if (
      questionType === "MCQ"
    ) {
      return "Multiple Choice";
    }

    if (
      questionType === "SHORT_ANSWER"
    ) {
      return "Short Answer";
    }

    if (
      questionType === "SCENARIO"
    ) {
      return "Scenario";
    }

    return questionType || "Question";
  };


  const formatDate = (
    value
  ) => {

    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );
  };


  // =========================================================
  // CHECK SELECTED MCQ OPTION
  // =========================================================

  const isSelectedOption = (
    option,
    answerText
  ) => {

    if (!option || !answerText) {
      return false;
    }

    return (
      String(option.option_key)
        .trim()
        .toUpperCase()
      ===
      String(answerText)
        .trim()
        .toUpperCase()
    );
  };


  // =========================================================
  // MAIN UI
  // =========================================================

  return (

    <div className="review-answer-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="review-answer-header">

        <button
          type="button"
          className="review-back-button"
          onClick={() =>
            navigate(
              `/assessments`
            )
          }
        >
          <span>
            ←
          </span>

          Back to Assessment
        </button>


        <div className="review-header-content">

          <div>

            <p className="review-eyebrow">
              ASSESSMENT REVIEW
            </p>

            <h1>
              Review Your Answers
            </h1>

            <p className="review-subtitle">
              Review the questions you attempted and
              the answers you submitted.
            </p>

          </div>


          <div className="review-header-badge">

            <span className="review-status-dot" />

            {review.status === "COMPLETED"
              ? "Completed"
              : "In Progress"}

          </div>

        </div>

      </header>


      {/* =====================================================
          ASSESSMENT SUMMARY
      ===================================================== */}

      <section className="review-summary">

        <div className="review-summary-main">

          <div className="review-skill-icon">

            {review.skill_name
              ?.slice(0, 1)
              ?.toUpperCase() || "S"}

          </div>


          <div>

            <span className="review-summary-label">
              SKILL
            </span>

            <h2>
              {review.skill_name || "Assessment"}
            </h2>

            {review.completed_at && (

              <p>
                Completed{" "}
                {formatDate(
                  review.completed_at
                )}
              </p>

            )}

          </div>

        </div>


        <div className="review-summary-stats">

          <div className="review-summary-stat">

            <strong>
              {questions.length}
            </strong>

            <span>
              Questions
            </span>

          </div>


          <div className="review-summary-divider" />


          <div className="review-summary-stat">

            <strong>
              {new Set(
                questions.map(
                  (question) =>
                    question.difficulty_level
                )
              ).size}
            </strong>

            <span>
              Levels
            </span>

          </div>

        </div>

      </section>


      {/* =====================================================
          QUESTIONS
      ===================================================== */}

      <main className="review-questions">

        <div className="review-section-heading">

          <div>

            <p className="review-eyebrow">
              YOUR RESPONSES
            </p>

            <h2>
              Questions You Attempted
            </h2>

          </div>

          <span className="review-question-count">
            {questions.length}
          </span>

        </div>


        {questions.length === 0 ? (

          <div className="review-no-questions">

            <div className="review-no-questions-icon">
              ?
            </div>

            <h3>
              No answers found
            </h3>

            <p>
              There are no submitted answers for this
              assessment yet.
            </p>

          </div>

        ) : (

          <div className="review-question-list">

            {questions.map(
              (
                question,
                index
              ) => {

                const isMCQ =
                  question.question_type === "MCQ" &&
                  Array.isArray(question.options) &&
                  question.options.length > 0;

                return (

                  <article
                    className="review-question-card"
                    key={
                      question.question_id ||
                      index
                    }
                  >


                    {/* =========================================
                        QUESTION HEADER
                    ========================================== */}

                    <div className="review-question-top">

                      <div className="review-question-number">

                        <span>
                          {String(
                            question.sequence_number ||
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                      </div>


                      <div className="review-question-meta">

                        <span className="review-level-badge">

                          Level{" "}
                          {question.difficulty_level}

                        </span>


                        <span className="review-type-badge">

                          {getQuestionTypeLabel(
                            question.question_type
                          )}

                        </span>

                      </div>

                    </div>


                    {/* =========================================
                        QUESTION
                    ========================================== */}

                    <div className="review-question-body">

                      <p className="review-question-label">
                        QUESTION
                      </p>

                      <h3>
                        {question.question_text}
                      </h3>

                    </div>


                    {/* =========================================
                        MCQ ANSWER
                    ========================================== */}

                    {isMCQ ? (

                      <div className="review-mcq-box">

                        <div className="review-mcq-header">

                          <div className="review-mcq-title">

                            <span className="review-answer-icon">
                              ✓
                            </span>

                            <div>

                              <span className="review-answer-label">
                                YOUR ANSWER
                              </span>

                              <span className="review-answer-helper">
                                Your selected option
                              </span>

                            </div>

                          </div>


                          {question.submitted_at && (

                            <span className="review-submitted-date">

                              Submitted{" "}
                              {formatDate(
                                question.submitted_at
                              )}

                            </span>

                          )}

                        </div>


                        {/* -----------------------------------------
                            ALL MCQ OPTIONS
                        ------------------------------------------ */}

                        <div className="review-mcq-options">

                          {question.options.map(
                            (option) => {

                              const selected =
                                isSelectedOption(
                                  option,
                                  question.answer_text
                                );

                              return (

                                <div
                                  key={
                                    option.option_key
                                  }
                                  className={`review-mcq-option ${
                                    selected
                                      ? "review-mcq-option-selected"
                                      : ""
                                  }`}
                                >

                                  <div className="review-option-key">

                                    {option.option_key}

                                  </div>


                                  <div className="review-option-text">

                                    {option.option_text}

                                  </div>


                                  {selected && (

                                    <div className="review-selected-badge">

                                      <span>
                                        ✓
                                      </span>

                                      Your answer

                                    </div>

                                  )}

                                </div>

                              );

                            }
                          )}

                        </div>

                      </div>

                    ) : (

                      /* =========================================
                         SHORT ANSWER / SCENARIO
                      ========================================== */

                      <div className="review-answer-box">

                        <div className="review-answer-box-header">

                          <div>

                            <span className="review-answer-icon">
                              ✓
                            </span>

                            <span className="review-answer-label">
                              YOUR ANSWER
                            </span>

                          </div>


                          {question.submitted_at && (

                            <span className="review-submitted-date">

                              Submitted{" "}
                              {formatDate(
                                question.submitted_at
                              )}

                            </span>

                          )}

                        </div>


                        <div className="review-answer-content">

                          {question.answer_text ? (

                            <p>
                              {question.answer_text}
                            </p>

                          ) : (

                            <p className="review-no-answer">
                              No answer submitted.
                            </p>

                          )}

                        </div>

                      </div>

                    )}

                  </article>

                );

              }
            )}

          </div>

        )}

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="review-answer-footer">

        <button
          type="button"
          className="review-footer-button"
          onClick={() =>
            navigate(
              `/assessment/${assessmentId}`
            )
          }
        >
          ← Back to Assessment
        </button>


        <span>
          Read-only review
        </span>

      </footer>

    </div>

  );
}

export default ReviewAnswer;