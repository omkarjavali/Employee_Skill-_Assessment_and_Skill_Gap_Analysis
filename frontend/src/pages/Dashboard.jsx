import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "./Dashboard.css";


function Dashboard() {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [assessments, setAssessments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =========================================================
  // LOAD CURRENT USER + ASSESSMENTS
  // =========================================================

  useEffect(() => {

    loadDashboard();

  }, []);


  const loadDashboard = async () => {

    try {

      setLoading(true);
      setError("");


      // -----------------------------------------------------
      // Get authenticated user
      // -----------------------------------------------------

      const userResponse =
        await api.get("/auth/me");

      console.log(
        "👤 Current user:",
        userResponse.data
      );

      setUser(
        userResponse.data
      );

      // Keep localStorage synchronized
      localStorage.setItem(
        "user",
        JSON.stringify(
          userResponse.data
        )
      );


      // -----------------------------------------------------
      // Get ONLY current user's assessments
      // -----------------------------------------------------

      const assessmentResponse =
        await api.get("/assessments");

      console.log(
        "📊 Dashboard assessments:",
        assessmentResponse.data
      );

      setAssessments(
        Array.isArray(
          assessmentResponse.data
        )
          ? assessmentResponse.data
          : []
      );

    } catch (err) {

      console.error(
        "❌ Dashboard error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.detail ||
        "Unable to load dashboard data."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // COMPLETED ASSESSMENTS
  // =========================================================

  const completedAssessments =
    useMemo(() => {

      return assessments.filter(
        (assessment) =>
          String(
            assessment.status
          ).toUpperCase() === "COMPLETED"
      );

    }, [assessments]);


  // =========================================================
  // IN-PROGRESS ASSESSMENTS
  // =========================================================

  const inProgressAssessments =
    useMemo(() => {

      return assessments.filter(
        (assessment) =>
          String(
            assessment.status
          ).toUpperCase() === "IN_PROGRESS"
      );

    }, [assessments]);


  // =========================================================
  // LATEST COMPLETED ASSESSMENT
  // =========================================================

  const latestCompletedAssessment =
    useMemo(() => {

      return [
        ...completedAssessments
      ]
        .sort(
          (a, b) =>
            new Date(
              b.completed_at ||
              b.started_at ||
              0
            ) -
            new Date(
              a.completed_at ||
              a.started_at ||
              0
            )
        )[0] || null;

    }, [completedAssessments]);


  // =========================================================
  // UNIQUE SKILLS ASSESSED
  // =========================================================

  const skills =
    useMemo(() => {

      const skillMap =
        new Map();


      completedAssessments.forEach(
        (assessment) => {

          if (
            !skillMap.has(
              assessment.skill_id
            )
          ) {

            skillMap.set(
              assessment.skill_id,
              {
                skill_id:
                  assessment.skill_id,

                skill_name:
                  assessment.skill_name,

                latest_level:
                  assessment.final_level,

                latest_assessment_id:
                  assessment.id,

                completed_at:
                  assessment.completed_at
              }
            );

            return;
          }


          const existing =
            skillMap.get(
              assessment.skill_id
            );


          const existingDate =
            new Date(
              existing.completed_at ||
              0
            );


          const currentDate =
            new Date(
              assessment.completed_at ||
              0
            );


          if (
            currentDate >
            existingDate
          ) {

            skillMap.set(
              assessment.skill_id,
              {
                skill_id:
                  assessment.skill_id,

                skill_name:
                  assessment.skill_name,

                latest_level:
                  assessment.final_level,

                latest_assessment_id:
                  assessment.id,

                completed_at:
                  assessment.completed_at
              }
            );

          }

        }
      );


      return Array.from(
        skillMap.values()
      );

    }, [completedAssessments]);


  // =========================================================
  // AVERAGE LEVEL
  // =========================================================

  const averageLevel =
    useMemo(() => {

      if (
        skills.length === 0
      ) {

        return 0;

      }


      const total =
        skills.reduce(
          (sum, skill) =>
            sum +
            Number(
              skill.latest_level || 0
            ),
          0
        );


      return (
        total / skills.length
      ).toFixed(1);

    }, [skills]);


  // =========================================================
  // RECENT ASSESSMENTS
  // =========================================================

  const recentAssessments =
    useMemo(() => {

      return [
        ...assessments
      ]
        .sort(
          (a, b) =>
            new Date(
              b.completed_at ||
              b.started_at ||
              0
            ) -
            new Date(
              a.completed_at ||
              a.started_at ||
              0
            )
        )
        .slice(0, 5);

    }, [assessments]);


  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (date) => {

    if (!date) {
      return "";
    }


    const parsedDate =
      new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return "";

    }


    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );

  };


  // =========================================================
  // CONTINUE ASSESSMENT
  // =========================================================

  const handleContinueAssessment =
    () => {

      navigate(
        "/assessments"
      );

    };


  // =========================================================
  // VIEW SKILL GAP
  // =========================================================

  const handleViewAnalysis =
    () => {

      if (
        !latestCompletedAssessment
      ) {

        return;

      }


      navigate(
        `/skill-gap/${latestCompletedAssessment.id}`
      );

    };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="dashboard-state">

        <div className="dashboard-loader" />

        <p>
          Loading your dashboard...
        </p>

      </div>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (

      <div className="dashboard-state dashboard-error">

        <h2>
          Unable to load dashboard
        </h2>

        <p>
          {error}
        </p>

        <button
          onClick={loadDashboard}
        >
          Try Again
        </button>

      </div>

    );

  }


  // =========================================================
  // MAIN DASHBOARD
  // =========================================================

  return (

    <div className="dashboard-page">

      {/* =====================================================
          PRODUCT HEADER
      ===================================================== */}

      <section className="dashboard-hero">

        <div className="dashboard-hero-copy">

          <p className="dashboard-eyebrow">
            SKILL INTELLIGENCE
          </p>

          <h1>
            Welcome back,{" "}
            <span>{user?.name || "there"}</span>
          </h1>

          <p className="dashboard-subtitle">
            Track your skills, assessment progress and areas
            where you can grow.
          </p>

        </div>

        <button
          type="button"
          className="dashboard-primary-button"
          onClick={() => navigate("/assessments")}
        >
          <span>View Assessments</span>
          <span className="dashboard-button-arrow">→</span>
        </button>

      </section>



      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section className="dashboard-summary">

        <div className="dashboard-stat-card stat-blue">
          <div className="stat-icon">◈</div>

          <div>
            <h3>Skills Assessed</h3>

            <strong>{skills.length}</strong>

            <p>Skills with completed assessments</p>
          </div>
        </div>


        <div className="dashboard-stat-card stat-purple">
          <div className="stat-icon">↗</div>

          <div>
            <h3>Assessments</h3>

            <strong>{assessments.length}</strong>

            <p>Total assessment attempts</p>
          </div>
        </div>


        <div className="dashboard-stat-card stat-green">
          <div className="stat-icon">◎</div>

          <div>
            <h3>Average Level</h3>

            <strong>
              {averageLevel}
              <span className="stat-max">/5</span>
            </strong>

            <p>Across assessed skills</p>
          </div>
        </div>


        <div className="dashboard-stat-card stat-orange">
          <div className="stat-icon">→</div>

          <div>
            <h3>In Progress</h3>

            <strong>{inProgressAssessments.length}</strong>

            <p>Assessments waiting to be completed</p>
          </div>
        </div>

      </section>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="dashboard-content">


        {/* ===================================================
            YOUR SKILLS
        =================================================== */}

        <div className="dashboard-panel dashboard-skills-panel">

          <div className="dashboard-panel-header">

            <div>
              <p className="dashboard-section-eyebrow">
                SKILL OVERVIEW
              </p>

              <h2>Your Skills</h2>

              <p className="dashboard-panel-description">
                Your latest assessed skill levels at a glance.
              </p>
            </div>

            <span className="dashboard-panel-count">
              {skills.length}
            </span>

          </div>


          {skills.length === 0 ? (

            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">◎</div>

              <p>
                Complete an assessment to start building
                your skill profile.
              </p>

              <button
                type="button"
                className="dashboard-view-all"
                onClick={() => navigate("/assessments")}
              >
                Start Assessment →
              </button>
            </div>

          ) : (

            <div className="skill-list">

              {skills.map((skill) => {

                const level =
                  Number(skill.latest_level || 0);

                const percentage =
                  Math.min((level / 5) * 100, 100);

                return (

                  <div
                    className="skill-row"
                    key={skill.skill_id}
                  >

                    <div className="skill-avatar">
                      {skill.skill_name
                        ?.slice(0, 1)
                        ?.toUpperCase() || "S"}
                    </div>

                    <div className="skill-info">
                      <strong>{skill.skill_name}</strong>

                      <span>
                        Latest assessed level
                      </span>
                    </div>


                    <div className="skill-progress">

                      <div className="skill-progress-label">
                        <strong>
                          Level {level}
                        </strong>

                        <span>5</span>
                      </div>

                      <div className="skill-progress-track">

                        <div
                          className="skill-progress-fill"
                          style={{
                            width: `${percentage}%`
                          }}
                        />

                        <div
                          className="skill-progress-marker"
                          style={{
                            left: `${percentage}%`
                          }}
                        />

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </div>


        {/* ===================================================
            RECENT ASSESSMENTS
        =================================================== */}

        <div className="dashboard-panel dashboard-activity-panel">

          <div className="dashboard-panel-header">

            <div>
              <p className="dashboard-section-eyebrow">
                ACTIVITY
              </p>

              <h2>Recent Assessments</h2>

              <p className="dashboard-panel-description">
                Your latest assessment activity.
              </p>
            </div>

            <button
              type="button"
              className="dashboard-view-all"
              onClick={() => navigate("/assessments")}
            >
              View All →
            </button>

          </div>


          <div className="recent-assessments">

            {recentAssessments.length === 0 ? (

              <div className="dashboard-empty compact">
                <p>No assessments yet.</p>
              </div>

            ) : (

              recentAssessments.map((assessment) => (

                <div
                  className="recent-assessment"
                  key={assessment.id}
                >

                  <div className="recent-assessment-icon">
                    <span>
                      {assessment.skill_name
                        ?.slice(0, 1)
                        ?.toUpperCase() || "S"}
                    </span>
                  </div>


                  <div className="recent-assessment-info">

                    <strong>
                      {assessment.skill_name}
                    </strong>

                    <span>
                      {assessment.status === "COMPLETED"
                        ? `Level ${assessment.final_level}`
                        : `Level ${
                            assessment.current_level ||
                            assessment.starting_level
                          }`}
                    </span>

                  </div>


                  <div className="recent-assessment-status">

                    <span
                      className={`status-badge ${
                        assessment.status === "COMPLETED"
                          ? "status-completed"
                          : "status-progress"
                      }`}
                    >
                      {assessment.status === "COMPLETED"
                        ? "COMPLETED"
                        : "IN PROGRESS"}
                    </span>

                    <small>
                      {formatDate(
                        assessment.completed_at ||
                          assessment.started_at
                      )}
                    </small>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          DEVELOPMENT FOCUS
      ===================================================== */}

      <section className="development-focus">

        <div className="development-focus-header">

          <div>
            <p className="dashboard-section-eyebrow">
              KEEP MOVING
            </p>

            <h2>What's next?</h2>

            <p>
              Continue building your profile or explore
              the results you've already earned.
            </p>
          </div>

        </div>


        <div className="development-focus-grid">

          <div className="development-card development-card-primary">

            <div className="development-icon">
              →
            </div>

            <div className="development-content">

              <span className="development-kicker">
                CONTINUE
              </span>

              <h3>
                Continue assessing your skills
              </h3>

              <p>
                Complete in-progress assessments to build
                a more complete skill profile.
              </p>

            </div>

            <button
              type="button"
              className="development-action"
              onClick={handleContinueAssessment}
            >
              Continue →
            </button>

          </div>


          <div className="development-card">

            <div className="development-icon">
              ↗
            </div>

            <div className="development-content">

              <span className="development-kicker">
                DISCOVER
              </span>

              <h3>
                Review your skill gaps
              </h3>

              <p>
                Explore detailed strengths, development
                areas and priority gaps from completed
                assessments.
              </p>

            </div>

            <button
              type="button"
              className="development-action"
              onClick={handleViewAnalysis}
              disabled={!latestCompletedAssessment}
            >
              View Analysis →
            </button>

          </div>

        </div>

      </section>

    </div>

  );

}

export default Dashboard;