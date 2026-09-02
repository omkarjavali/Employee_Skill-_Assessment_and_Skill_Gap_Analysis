import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "./Assessments.css";


function Assessments() {

  const navigate = useNavigate();


  // =========================================================
  // STATE
  // =========================================================

  const [availableSkills, setAvailableSkills] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [ratingModalOpen, setRatingModalOpen] =
    useState(false);

  const [selectedSkill, setSelectedSkill] =
    useState(null);

  const [selectedLevel, setSelectedLevel] =
    useState(null);

  const [startingAssessment, setStartingAssessment] =
    useState(false);

  const [startError, setStartError] =
    useState("");


  // =========================================================
  // LOAD ASSESSMENTS
  // =========================================================

  useEffect(() => {

    fetchAssessments();

  }, []);


  const fetchAssessments = async () => {

    try {

      setLoading(true);

      setError("");


      const response =
        await api.get("/assessments/available");


      const data =
        Array.isArray(response.data)
          ? response.data
          : [];


      console.log(
        "✅ Available assessment skills:",
        data
      );


      setAvailableSkills(data);

    } catch (err) {

      console.error(
        "❌ Assessment loading error:",
        err.response?.data || err
      );


      const detail =
        err.response?.data?.detail;


      setError(
        typeof detail === "string"
          ? detail
          : "Unable to load your assessments."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // ASSESSMENT GROUPS
  // =========================================================

  const inProgressAssessments =
    availableSkills.filter(
      (skill) =>
        String(
          skill.assessment_status || ""
        ).toUpperCase() === "IN_PROGRESS"
    );


  const completedAssessments =
    availableSkills.filter(
      (skill) =>
        String(
          skill.assessment_status || ""
        ).toUpperCase() === "COMPLETED"
    );


  const availableAssessments =
    availableSkills.filter(
      (skill) =>
        !skill.assessment_status
    );


  // =========================================================
  // STATS
  // =========================================================

  const stats = useMemo(
    () => ({
      skills: availableSkills.length,

      completed:
        completedAssessments.length,

      inProgress:
        inProgressAssessments.length,

      available:
        availableAssessments.length
    }),

    [
      availableSkills.length,
      completedAssessments.length,
      inProgressAssessments.length,
      availableAssessments.length
    ]
  );


  // =========================================================
  // RATING MODAL
  // =========================================================

  const openRatingModal = (skill) => {

    setSelectedSkill(skill);

    setSelectedLevel(null);

    setStartError("");

    setRatingModalOpen(true);

  };


  const closeRatingModal = () => {

    if (startingAssessment) return;


    setRatingModalOpen(false);

    setSelectedSkill(null);

    setSelectedLevel(null);

    setStartError("");

  };


  // =========================================================
  // START ASSESSMENT
  // =========================================================

  const handleStartAssessment = async () => {

    if (!selectedSkill) return;


    if (!selectedLevel) {

      setStartError(
        "Please select your current skill level."
      );

      return;

    }


    try {

      setStartingAssessment(true);

      setStartError("");


      const response =
        await api.post(
          "/assessments",
          {
            skill_id:
              selectedSkill.skill_id,

            starting_level:
              selectedLevel
          }
        );


      const assessmentId =
        response.data?.id;


      if (!assessmentId) {

        throw new Error(
          "Assessment was created but no assessment ID was returned."
        );

      }


      setRatingModalOpen(false);

      setSelectedSkill(null);

      setSelectedLevel(null);


      navigate(
        `/assessment/${assessmentId}`
      );

    } catch (err) {

      console.error(
        "❌ Failed to start assessment:",
        err.response?.data || err
      );


      const detail =
        err.response?.data?.detail;


      setStartError(
        typeof detail === "string"
          ? detail
          : "Unable to start the assessment. Please try again."
      );

    } finally {

      setStartingAssessment(false);

    }

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="assessments-state">

        <div className="assessments-loader" />

        <p>
          Loading assessments...
        </p>

      </div>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (

      <div className="assessments-state error-state">

        <div className="state-icon">
          !
        </div>

        <h2>
          Unable to load assessments
        </h2>

        <p>
          {error}
        </p>

        <button
          onClick={fetchAssessments}
          className="retry-button"
        >
          Try Again
        </button>

      </div>

    );

  }


  // =========================================================
  // MAIN UI
  // =========================================================

  return (

    <div className="assessments-page">


      {/* =====================================================
          HERO
      ===================================================== */}

      <header className="assessments-hero">

        <div className="hero-copy">

          <div className="hero-kicker">

            <span className="hero-kicker-dot" />

            SKILL ASSESSMENT

          </div>


          <h1>
            Build your skill profile.
          </h1>


          <p>
            See where you stand, continue what you
            started, and discover opportunities to grow.
          </p>


          <div className="hero-actions">

            {inProgressAssessments.length > 0 ? (

              <button
                className="hero-primary-action"
                onClick={() =>
                  navigate(
                    `/assessment/${inProgressAssessments[0].assessment_id}`
                  )
                }
              >
                Continue assessment
                <span>→</span>
              </button>

            ) : availableAssessments.length > 0 ? (

              <button
                className="hero-primary-action"
                onClick={() =>
                  openRatingModal(
                    availableAssessments[0]
                  )
                }
              >
                Start an assessment
                <span>→</span>
              </button>

            ) : (

              <button
                className="hero-secondary-action"
                onClick={() =>
                  document
                    .querySelector(".completed-section")
                    ?.scrollIntoView({
                      behavior: "smooth"
                    })
                }
              >
                Review my results
                <span>↓</span>
              </button>

            )}

          </div>

        </div>


        {/* HERO VISUAL */}

        <div
          className="hero-visual"
          aria-hidden="true"
        >

          <div className="hero-orbit hero-orbit-one" />

          <div className="hero-orbit hero-orbit-two" />

          <div className="hero-orbit hero-orbit-three" />


          <div className="assessments-hero-orbit-center">

            <span className="assessments-hero-orbit-number">
              {availableSkills.length}
            </span>

            <span className="assessments-hero-orbit-label">
              Total Skills
            </span>

          </div>


          <div className="hero-floating-card hero-floating-top">

            <span>
              ✓
            </span>

            <div>

              <strong>
                {stats.completed}
              </strong>

              <small>
                completed
              </small>

            </div>

          </div>


          <div className="hero-floating-card hero-floating-bottom">

            <span>
              →
            </span>

            <div>

              <strong>
                {stats.inProgress}
              </strong>

              <small>
                in progress
              </small>

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          STATS
      ===================================================== */}

      <section
        className="assessment-stats"
        aria-label="Assessment summary"
      >

        <StatCard
          icon="✦"
          value={stats.skills}
          label="Skills"
          tone="blue"
        />

        <StatCard
          icon="✓"
          value={stats.completed}
          label="Completed"
          tone="green"
        />

        <StatCard
          icon="→"
          value={stats.inProgress}
          label="In progress"
          tone="amber"
        />

        <StatCard
          icon="＋"
          value={stats.available}
          label="Ready to start"
          tone="purple"
        />

      </section>


      {/* =====================================================
          IN PROGRESS
      ===================================================== */}

      {inProgressAssessments.length > 0 && (

        <section className="assessment-section featured-section">

          <div className="section-heading">

            <div>

              <span className="section-eyebrow">
                PICK UP WHERE YOU LEFT OFF
              </span>

              <h2>
                Continue your assessment
              </h2>

              <p>
                Your unfinished assessment is waiting for you.
              </p>

            </div>

            <span className="section-count">
              {inProgressAssessments.length}
            </span>

          </div>


          <div className="featured-assessment-grid">

            {inProgressAssessments.map(
              (skill) => (

                <FeaturedAssessmentCard
                  key={
                    skill.assessment_id ||
                    skill.skill_id
                  }
                  assessment={skill}
                  onAction={() =>
                    navigate(
                      `/assessment/${skill.assessment_id}`
                    )
                  }
                />

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          AVAILABLE
      ===================================================== */}

      {availableAssessments.length > 0 && (

        <section className="assessment-section available-section">

          <div className="section-heading">

            <div>

              <span className="section-eyebrow">
                READY WHEN YOU ARE
              </span>

              <h2>
                Explore assessments
              </h2>

              <p>
                Start measuring one of your assigned skills.
              </p>

            </div>

            <span className="section-count">
              {availableAssessments.length}
            </span>

          </div>


          <div className="assessment-grid">

            {availableAssessments.map(
              (skill) => (

                <AssessmentCard
                  key={skill.skill_id}
                  assessment={skill}
                  navigate={navigate}
                  onAction={() =>
                    openRatingModal(skill)
                  }
                />

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          COMPLETED
      ===================================================== */}

      {completedAssessments.length > 0 && (

        <section className="assessment-section completed-section">

          <div className="section-heading">

            <div>

              <span className="section-eyebrow">
                YOUR RESULTS
              </span>

              <h2>
                Completed assessments
              </h2>

              <p>
                Review your latest assessment outcomes
                and skill analysis.
              </p>

            </div>

            <span className="section-count">
              {completedAssessments.length}
            </span>

          </div>


          <div className="assessment-grid completed-grid">

            {completedAssessments.map(
              (skill) => (

                <AssessmentCard
                  key={skill.skill_id}
                  assessment={skill}
                  navigate={navigate}
                  onAction={() =>
                    navigate(
                      `/skill-gap/${skill.assessment_id}`
                    )
                  }
                />

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {availableSkills.length === 0 && (

        <div className="empty-state">

          <div className="empty-icon">
            ◎
          </div>

          <span className="section-eyebrow">
            ALL CAUGHT UP
          </span>

          <h2>
            No assessments available
          </h2>

          <p>
            No skills have been assigned to your
            current role yet.
          </p>

        </div>

      )}


      {/* =====================================================
          RATING MODAL
      ===================================================== */}

      {ratingModalOpen &&
        selectedSkill && (

          <div
            className="assessment-rating-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                closeRatingModal();

              }

            }}
          >

            <div className="assessment-rating-modal">

              <button
                type="button"
                className="assessment-rating-close"
                onClick={closeRatingModal}
                disabled={startingAssessment}
                aria-label="Close"
              >
                ×
              </button>


              <div className="modal-skill-badge">

                {getSkillIcon(
                  selectedSkill.skill_name
                )}

              </div>


              <p className="assessment-rating-eyebrow">
                BEFORE YOU BEGIN
              </p>


              <h2>
                Rate your{" "}
                {selectedSkill.skill_name} skill
              </h2>


              <p className="assessment-rating-description">

                Give us your current level before the
                assessment begins. This becomes your
                starting point for the adaptive assessment.

              </p>


              <div className="assessment-rating-options">

                {[1, 2, 3, 4, 5].map(
                  (level) => {

                    const labels = {

                      1: "Beginner",

                      2: "Basic",

                      3: "Intermediate",

                      4: "Advanced",

                      5: "Expert"

                    };


                    const isSelected =
                      selectedLevel === level;


                    return (

                      <button
                        key={level}
                        type="button"
                        className={
                          isSelected
                            ? "assessment-rating-option selected"
                            : "assessment-rating-option"
                        }
                        onClick={() =>
                          setSelectedLevel(level)
                        }
                        disabled={
                          startingAssessment
                        }
                      >

                        <span className="assessment-rating-number">
                          {level}
                        </span>

                        <span className="assessment-rating-label">
                          {labels[level]}
                        </span>

                      </button>

                    );

                  }
                )}

              </div>


              <div className="assessment-rating-selected">

                {selectedLevel ? (

                  <>
                    Your selected level:
                    <strong>
                      {selectedLevel} / 5
                    </strong>
                  </>

                ) : (

                  "Select a level to continue"

                )}

              </div>


              {startError && (

                <div className="assessment-rating-error">
                  {startError}
                </div>

              )}


              <button
                type="button"
                className="assessment-rating-start"
                onClick={handleStartAssessment}
                disabled={
                  !selectedLevel ||
                  startingAssessment
                }
              >

                {startingAssessment
                  ? "Starting Assessment..."
                  : "Start Assessment"}

                {!startingAssessment && (
                  <span>→</span>
                )}

              </button>

            </div>

          </div>

        )}

    </div>

  );

}


// =========================================================
// STAT CARD
// =========================================================

function StatCard({
  icon,
  value,
  label,
  tone
}) {

  return (

    <div
      className={`assessment-stat-card ${tone}`}
    >

      <span className="stat-icon">
        {icon}
      </span>

      <div>

        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </div>

  );

}


// =========================================================
// JOURNEY STEP
// =========================================================

function JourneyStep({
  number,
  title,
  text,
  active,
  complete
}) {

  return (

    <div
      className={`journey-step ${
        active ? "active" : ""
      } ${
        complete ? "complete" : ""
      }`}
    >

      <div className="journey-number">
        {complete ? "✓" : number}
      </div>

      <div>

        <strong>
          {title}
        </strong>

        <span>
          {text}
        </span>

      </div>

    </div>

  );

}


// =========================================================
// FEATURED ASSESSMENT CARD
// =========================================================

function FeaturedAssessmentCard({
  assessment,
  onAction
}) {

  const currentLevel =
    Number(
      assessment.current_level
    );


  const safeLevel =
    Number.isFinite(currentLevel)
      ? Math.max(
          1,
          Math.min(5, currentLevel)
        )
      : 1;


  const progress =
    ((safeLevel - 1) / 4) * 100;


  return (

    <article className="featured-assessment-card">

      <div className="featured-card-glow" />


      <div className="featured-card-top">

        <div className="featured-skill-icon">
          {getSkillIcon(
            assessment.skill_name
          )}
        </div>


        <span className="assessment-status in-progress">
          IN PROGRESS
        </span>

      </div>


      <div className="featured-card-main">

        <div>

          <p className="featured-overline">
            CONTINUE BUILDING
          </p>

          <h3>
            {assessment.skill_name}
          </h3>

          <p className="assessment-role">
            {
              assessment.skill_description ||
              "Skill Assessment"
            }
          </p>

        </div>


        <div className="featured-level">

          <span>
            Current level
          </span>

          <strong>

            {
              Number.isFinite(currentLevel)
                ? currentLevel
                : "—"
            }

            <small>
              /5
            </small>

          </strong>

        </div>

      </div>


      <div className="featured-progress">

        <div className="featured-progress-labels">

          <span>
            Assessment progress
          </span>

          <strong>
            Level {safeLevel}
          </strong>

        </div>


        <div className="featured-progress-track">

          <span
            style={{
              width: `${progress}%`
            }}
          />


          {[1, 2, 3, 4, 5].map(
            (level) => (

              <i
                key={level}
                className={
                  level <= safeLevel
                    ? "reached"
                    : ""
                }
                style={{
                  left:
                    `${((level - 1) / 4) * 100}%`
                }}
              />

            )
          )}

        </div>

      </div>


      <div className="featured-card-footer">

        <div>

          <span>
            Started
          </span>

          <strong>
            {formatDate(
              assessment.started_at
            )}
          </strong>

        </div>


        <button
          type="button"
          className="featured-action"
          onClick={onAction}
        >

          Continue Assessment

          <span>
            →
          </span>

        </button>

      </div>

    </article>

  );

}


// =========================================================
// ASSESSMENT CARD
// =========================================================

function AssessmentCard({
  assessment,
  onAction,
  navigate
}) {

  const status =
    String(
      assessment.assessment_status || ""
    ).toUpperCase();


  const isCompleted =
    status === "COMPLETED";


  const isInProgress =
    status === "IN_PROGRESS";


  const isAvailable =
    !status;


  let currentLevel = null;


  if (isCompleted) {

    currentLevel =
      assessment.final_level;

  } else if (isInProgress) {

    currentLevel =
      assessment.current_level;

  }


  return (

    <article
      className={`assessment-card ${
        isCompleted
          ? "completed-card"
          : ""
      } ${
        isAvailable
          ? "available-card"
          : ""
      }`}
    >

      <div className="card-accent" />


      <div className="card-header">

        <div className="skill-icon">

          {getSkillIcon(
            assessment.skill_name
          )}

        </div>


        <span
          className={`assessment-status ${
            isCompleted
              ? "completed"
              : isInProgress
              ? "in-progress"
              : "available"
          }`}
        >

          {isCompleted
            ? "COMPLETED"
            : isInProgress
            ? "IN PROGRESS"
            : "AVAILABLE"}

        </span>

      </div>


      <div className="card-content">

        <div className="card-title-row">

          <div>

            <h3>
              {assessment.skill_name}
            </h3>

            <p className="assessment-role">

              {
                assessment.skill_description ||
                "Skill Assessment"
              }

            </p>

          </div>


          {isCompleted && (

            <div className="result-icon">

              {getResultIcon(
                assessment
              )}

            </div>

          )}

        </div>


        <div className="level-row">

          <div>

            <span className="level-label">

              {
                isAvailable
                  ? "Expected Level"
                  : "Final Level"
              }

            </span>


            <div className="level-value">

              <strong>

                {
                  isAvailable
                    ? assessment.expected_level
                    : currentLevel
                }

              </strong>

              <small>
                /5
              </small>


              {isCompleted && (

                <>

                  <span className="arrow">
                    →
                  </span>

                  <strong>
                    {assessment.final_level}
                  </strong>

                  <small>
                    /5
                  </small>

                </>

              )}

            </div>

          </div>


          {isCompleted && (

            <div
              className={`result-label ${
                getResultClass(
                  assessment
                )
              }`}
            >

              {getResultLabel(
                assessment
              )}

            </div>

          )}

        </div>


        {!isAvailable && (

          <div className="date-row">

            <span>

              {
                isCompleted
                  ? "Completed"
                  : "Started"
              }

            </span>

            <span>

              {formatDate(
                isCompleted
                  ? assessment.completed_at
                  : assessment.started_at
              )}

            </span>

          </div>

        )}

      </div>


      {/* =====================================================
          ACTIONS
      ===================================================== */}

      {isCompleted ? (

        <div className="completed-card-actions">

          <button
            type="button"
            className="assessment-action primary"
            onClick={onAction}
          >

            View Full Analysis

            <span>
              →
            </span>

          </button>


          <button
            type="button"
            className="assessment-action review-action"
            onClick={() =>
              navigate(
                `/assessment/${assessment.assessment_id}/review`
              )
            }
          >

            Review Your Answers

            <span>
              →
            </span>

          </button>

        </div>

      ) : (

        <button
          type="button"
          className="assessment-action secondary"
          onClick={onAction}
        >

          {
            isInProgress
              ? "Continue Assessment"
              : "Start Assessment"
          }

          <span>
            →
          </span>

        </button>

      )}

    </article>

  );

}


// =========================================================
// RESULT LABEL
// =========================================================

function getResultLabel(
  assessment
) {

  const finalLevel =
    Number(
      assessment.final_level
    );


  const startingLevel =
    Number(
      assessment.starting_level
    );


  if (
    Number.isFinite(finalLevel) &&
    Number.isFinite(startingLevel)
  ) {

    if (
      finalLevel >
      startingLevel
    ) {

      return "Level Increased";

    }


    if (
      finalLevel <
      startingLevel
    ) {

      return "Level Decreased";

    }

  }


  return "Level Maintained";

}


// =========================================================
// RESULT CLASS
// =========================================================

function getResultClass(
  assessment
) {

  const finalLevel =
    Number(
      assessment.final_level
    );


  const startingLevel =
    Number(
      assessment.starting_level
    );


  if (
    Number.isFinite(finalLevel) &&
    Number.isFinite(startingLevel) &&
    finalLevel > startingLevel
  ) {

    return "positive";

  }


  if (
    Number.isFinite(finalLevel) &&
    Number.isFinite(startingLevel) &&
    finalLevel < startingLevel
  ) {

    return "negative";

  }


  return "neutral";

}


// =========================================================
// RESULT ICON
// =========================================================

function getResultIcon(
  assessment
) {

  const finalLevel =
    Number(
      assessment.final_level
    );


  const startingLevel =
    Number(
      assessment.starting_level
    );


  if (
    Number.isFinite(finalLevel) &&
    Number.isFinite(startingLevel) &&
    finalLevel > startingLevel
  ) {

    return "↑";

  }


  if (
    Number.isFinite(finalLevel) &&
    Number.isFinite(startingLevel) &&
    finalLevel < startingLevel
  ) {

    return "↓";

  }


  return "✓";

}


// =========================================================
// SKILL ICON
// =========================================================

function getSkillIcon(
  skill
) {

  const name =
    (skill || "").toLowerCase();


  if (
    name.includes("power bi")
  ) {

    return "📊";

  }


  if (
    name.includes("excel")
  ) {

    return "📗";

  }


  if (
    name.includes("sql")
  ) {

    return "🗄️";

  }


  if (
    name.includes("python")
  ) {

    return "🐍";

  }


  return "🎯";

}


// =========================================================
// DATE
// =========================================================

function formatDate(
  dateString
) {

  if (!dateString) {

    return "—";

  }


  const date =
    new Date(dateString);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";

  }


  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );

}


export default Assessments;