import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import api from "../services/api";

import "./AdminUserPerformance.css";


function AdminUserPerformance() {

  const {
    userId
  } = useParams();

  const navigate =
    useNavigate();


  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =========================================================
  // EXPANDED COMPETENCIES
  // =========================================================

  const [
    expandedCompetencies,
    setExpandedCompetencies
  ] = useState({});


  // =========================================================
  // LOAD USER PERFORMANCE
  // =========================================================

  useEffect(() => {

    loadUserPerformance();

  }, [userId]);


  const loadUserPerformance =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await api.get(
            `/admin/users/${userId}`
          );


        console.log(
          "👤 Admin user performance:",
          response.data
        );


        setData(
          response.data
        );

      } catch (err) {

        console.error(
          "❌ Failed to load user performance:",
          err.response?.data ||
            err
        );


        setError(
          err.response?.data?.detail ||
          "Unable to load employee performance."
        );

      } finally {

        setLoading(false);

      }

    };


  // =========================================================
  // TOGGLE COMPETENCY
  // =========================================================

  const toggleCompetency =
    (
      skillIndex,
      competencyId
    ) => {

      const key =
        `${skillIndex}-${competencyId}`;


      setExpandedCompetencies(
        current => ({

          ...current,

          [key]:
            !current[key]

        })
      );

    };


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate =
    (value) => {

      if (!value) {

        return "—";

      }


      const date =
        new Date(value);


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

    };


  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass =
    (status) => {

      if (
        status === "COMPLETED"
      ) {

        return "status-completed";

      }


      if (
        status === "IN_PROGRESS"
      ) {

        return "status-progress";

      }


      return "status-default";

    };


  // =========================================================
  // SKILL GAP STATUS
  // =========================================================

  const getSkillGapClass =
    (status) => {

      if (
        status === "SKILL_GAP"
      ) {

        return "skill-gap-badge";

      }


      if (
        status === "SURPLUS"
      ) {

        return "skill-surplus-badge";

      }


      return "skill-balanced-badge";

    };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="admin-performance-loading">

        <div className="admin-performance-spinner" />

        <p>
          Loading employee performance...
        </p>

      </div>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (

      <div className="admin-performance-page">

        <button
          className="admin-back-button"
          onClick={() =>
            navigate("/admin")
          }
        >
          ← Back to Employees
        </button>


        <div className="admin-performance-error">

          <div className="admin-error-icon">
            !
          </div>

          <h2>
            Unable to load performance
          </h2>

          <p>
            {error}
          </p>

          <button
            className="admin-retry-button"
            onClick={
              loadUserPerformance
            }
          >
            Try Again
          </button>

        </div>

      </div>

    );

  }


  if (!data) {

    return null;

  }


  const user =
    data.user || {};

  const assessments =
    data.assessment_history || [];

  const skillGaps =
    data.skill_gaps || [];


  return (

    <div className="admin-performance-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="admin-performance-topbar">

        <button
          type="button"
          className="admin-back-button"
          onClick={() =>
            navigate("/admin")
          }
        >

          <span>
            ←
          </span>

          Back to Employees

        </button>

      </div>


      {/* =====================================================
          EMPLOYEE HEADER
      ===================================================== */}

      <section className="employee-profile-card">

        <div className="employee-profile-main">

          <div className="employee-avatar">

            {user.name
              ?.charAt(0)
              ?.toUpperCase() || "U"}

          </div>


          <div className="employee-profile-info">

            <div className="employee-name-row">

              <h1>
                {user.name}
              </h1>

              <div className="employee-status-badge">
                  <span className="employee-status-dot" />
                            
                  {user?.role === "ADMIN"
                    ? "Administrator"
                    : "Employee"}
                </div>

            </div>


            <p className="employee-business-role">

              {user.business_role ||
                "Business role not assigned"}

            </p>


            <p className="employee-email">

              {user.email}

            </p>

          </div>

        </div>


        <div className="employee-profile-date">

          <span>
            Joined
          </span>

          <strong>
            {formatDate(
              user.created_at
            )}
          </strong>

        </div>

      </section>


      {/* =====================================================
          ASSESSMENT HISTORY
      ===================================================== */}

      <section className="admin-section">

        <div className="section-heading">

          <div>

            <span className="section-eyebrow">
              ASSESSMENTS
            </span>

            <h2>
              Assessment History
            </h2>

          </div>

        </div>


        <div className="assessment-history-card">

          {assessments.length === 0 ? (

            <div className="empty-state">

              <div className="empty-state-icon">
                📝
              </div>

              <h3>
                No assessments yet
              </h3>

              <p>
                This employee has not attempted
                any assessments.
              </p>

            </div>

          ) : (

            <div className="assessment-table-wrapper">

              <table className="assessment-table">

                <thead>

                  <tr>

                    <th>
                      Skill
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Starting
                    </th>

                    <th>
                      Final
                    </th>

                    <th>
                      Started
                    </th>

                    <th>
                      Completed
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {assessments.map(
                    assessment => (

                      <tr
                        key={
                          assessment.assessment_id
                        }
                      >

                        <td>

                          <div className="assessment-skill">

                            <div className="assessment-skill-icon">
                              {assessment.skill_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "S"}
                            </div>

                            <div>

                              <strong>
                                {
                                  assessment.skill_name ||
                                  "Unknown Skill"
                                }
                              </strong>

                              <span>
                                Assessment #
                                {
                                  assessment.assessment_id
                                }
                              </span>

                            </div>

                          </div>

                        </td>


                        <td>

                          <span
                            className={`assessment-status ${getStatusClass(
                              assessment.status
                            )}`}
                          >

                            <span className="status-dot" />

                            {assessment.status ===
                            "IN_PROGRESS"
                              ? "In Progress"
                              : "Completed"}

                          </span>

                        </td>


                        <td>

                          <span className="level-value">
                            {assessment.starting_level ??
                              "—"}
                          </span>

                        </td>


                        <td>

                          <span
                            className={
                              assessment.final_level !==
                              null
                                ? "level-value level-final"
                                : "level-value muted"
                            }
                          >

                            {assessment.final_level ??
                              "—"}

                          </span>

                        </td>


                        <td>

                          {formatDate(
                            assessment.started_at
                          )}

                        </td>


                        <td>

                          {formatDate(
                            assessment.completed_at
                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          SKILL PERFORMANCE
      ===================================================== */}

      <section className="admin-section">

        <div className="section-heading">

          <div>

            <span className="section-eyebrow">
              PERFORMANCE
            </span>

            <h2>
              Skill Performance
            </h2>

            <p>
              Detailed competency analysis across
              completed skills.
            </p>

          </div>

        </div>


        {skillGaps.length === 0 ? (

          <div className="no-skill-gap-card">

            <div className="no-skill-gap-icon">
              📊
            </div>

            <h3>
              No skill analysis available
            </h3>

            <p>
              Skill performance will appear here
              after an assessment has been completed
              and analyzed.
            </p>

          </div>

        ) : (

          <div className="skill-performance-list">

            {skillGaps.map(
              (skillGap, skillIndex) => {

                const competencies =
                  skillGap.competencies ||
                  [];


                return (

                  <article
                    className="skill-performance-card"
                    key={
                      skillGap.analysis_id
                    }
                  >


                    {/* =========================================
                        SKILL HEADER
                    ========================================= */}

                    <div className="skill-performance-header">

                      <div className="skill-title-area">

                        <div className="skill-large-icon">

                          {skillGap.skill_name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "S"}

                        </div>


                        <div>

                          <div className="skill-title-row">

                            <h3>
                              {skillGap.skill_name}
                            </h3>

                            <span
                              className={
                                getSkillGapClass(
                                  skillGap.status
                                )
                              }
                            >

                              {skillGap.status ===
                              "SKILL_GAP"
                                ? "Skill Gap"
                                : skillGap.status ===
                                  "SURPLUS"
                                ? "Above Target"
                                : "On Target"}

                            </span>

                          </div>


                          <span className="skill-role-label">

                            Target for{" "}

                            {skillGap.role_name ||
                              "assigned role"}

                          </span>

                        </div>

                      </div>


                      <div className="skill-level-summary">

                        <div className="skill-level-block">

                          <span>
                            Expected
                          </span>

                          <strong>
                            Level{" "}
                            {
                              skillGap.expected_level ??
                              "—"
                            }
                          </strong>

                        </div>


                        <div className="skill-level-divider" />


                        <div className="skill-level-block">

                          <span>
                            Final
                          </span>

                          <strong>
                            Level{" "}
                            {
                              skillGap.final_level ??
                              "—"
                            }
                          </strong>

                        </div>


                        <div className="skill-level-divider" />


                        <div className="skill-level-block">

                          <span>
                            {skillGap.gap > 0
                              ? "Gap"
                              : skillGap.surplus > 0
                              ? "Surplus"
                              : "Difference"}
                          </span>

                          <strong
                            className={
                              skillGap.gap > 0
                                ? "difference-negative"
                                : skillGap.surplus > 0
                                ? "difference-positive"
                                : "difference-neutral"
                            }
                          >

                            {skillGap.gap > 0
                              ? skillGap.gap
                              : skillGap.surplus > 0
                              ? `+${skillGap.surplus}`
                              : "0"}

                          </strong>

                        </div>

                      </div>

                    </div>


                    {/* =========================================
                        COMPETENCIES
                    ========================================= */}

                    <div className="competency-section">

                      <div className="competency-heading">

                        <div>

                          <h4>
                            Competency Performance
                          </h4>

                          <span>
                            {competencies.length}{" "}
                            {competencies.length === 1
                              ? "competency"
                              : "competencies"}
                          </span>

                        </div>

                      </div>


                      {competencies.length === 0 ? (

                        <div className="competency-empty">

                          No competency analysis
                          available.

                        </div>

                      ) : (

                        <div className="competency-list">

                          {competencies.map(
                            competency => {

                              const key =
                                `${skillIndex}-${competency.id}`;

                              const isExpanded =
                                Boolean(
                                  expandedCompetencies[
                                    key
                                  ]
                                );

                              const concepts =
                                competency.concepts ||
                                [];


                              return (

                                <div
                                  className={`competency-item ${
                                    isExpanded
                                      ? "expanded"
                                      : ""
                                  }`}
                                  key={
                                    competency.id
                                  }
                                >

                                  <button
                                    type="button"
                                    className="competency-button"
                                    onClick={() =>
                                      toggleCompetency(
                                        skillIndex,
                                        competency.id
                                      )
                                    }
                                  >

                                    <div className="competency-info">

                                      <div className="competency-icon">
                                        ✓
                                      </div>

                                      <div>

                                        <strong>
                                          {
                                            competency.name
                                          }
                                        </strong>

                                        <span>

                                          {
                                            competency.rubric_count
                                          }

                                          {" "}

                                          {competency.rubric_count ===
                                          1
                                            ? "criterion"
                                            : "criteria"}

                                        </span>

                                      </div>

                                    </div>


                                    <div className="competency-right">

                                      <div className="competency-percentage">

                                        {Number(
                                          competency.percentage ||
                                          0
                                        ).toFixed(2)}
                                        %

                                      </div>


                                      <div className="competency-progress">

                                        <div
                                          className="competency-progress-fill"
                                          style={{
                                            width: `${Math.min(
                                              Math.max(
                                                Number(
                                                  competency.percentage ||
                                                  0
                                                ),
                                                0
                                              ),
                                              100
                                            )}%`
                                          }}
                                        />

                                      </div>


                                      <span
                                        className={`competency-chevron ${
                                          isExpanded
                                            ? "open"
                                            : ""
                                        }`}
                                      >
                                        ›
                                      </span>

                                    </div>

                                  </button>


                                  {isExpanded && (

                                    <div className="concept-list">

                                      {concepts.length ===
                                      0 ? (

                                        <div className="concept-empty">
                                          No concepts available.
                                        </div>

                                      ) : (

                                        concepts.map(
                                          concept => (

                                            <div
                                              className="concept-row"
                                              key={
                                                concept.id
                                              }
                                            >

                                              <div className="concept-name">

                                                <span className="concept-dot" />

                                                <span>
                                                  {
                                                    concept.name
                                                  }
                                                </span>

                                              </div>


                                              <div className="concept-result">

                                                <div className="concept-progress">

                                                  <div
                                                    className="concept-progress-fill"
                                                    style={{
                                                      width: `${Math.min(
                                                        Math.max(
                                                          Number(
                                                            concept.percentage ||
                                                            0
                                                          ),
                                                          0
                                                        ),
                                                        100
                                                      )}%`
                                                    }}
                                                  />

                                                </div>


                                                <strong>

                                                  {Number(
                                                    concept.percentage ||
                                                    0
                                                  ).toFixed(2)}
                                                  %

                                                </strong>

                                              </div>

                                            </div>

                                          )
                                        )

                                      )}

                                    </div>

                                  )}

                                </div>

                              );

                            }
                          )}

                        </div>

                      )}

                    </div>


                    {/* =========================================
                        ANALYSIS FOOTER
                    ========================================= */}

                    <div className="skill-performance-footer">

                      <span>

                        Analysis completed{" "}

                        {formatDate(
                          skillGap.created_at
                        )}

                      </span>


                      <span>

                        Assessment #

                        {" "}

                        {
                          skillGap.assessment_id
                        }

                      </span>

                    </div>

                  </article>

                );

              }
            )}

          </div>

        )}

      </section>

    </div>

  );

}


export default AdminUserPerformance;