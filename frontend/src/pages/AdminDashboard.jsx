import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import api from "../services/api";

import "./AdminDashboard.css";


function AdminDashboard() {

  const navigate = useNavigate();


  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");


  // =========================================================
  // LOAD USERS
  // =========================================================

  useEffect(() => {

    loadUsers();

  }, []);


  const loadUsers = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await api.get(
          "/admin/users"
        );

      setUsers(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (err) {

      console.error(
        "❌ Admin users error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.detail ||
        "Unable to load employees."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // FILTER USERS
  // =========================================================

  const filteredUsers =
    users.filter((user) => {

      const searchValue =
        search
          .trim()
          .toLowerCase();

      if (!searchValue) {
        return true;
      }


      // -----------------------------------------------------
      // Search completed skills
      // -----------------------------------------------------

      const skillsMatch =
        (
          user.skills_assessed || []
        ).some(
          (skill) =>
            skill.skill_name
              ?.toLowerCase()
              .includes(searchValue)
        );


      return (

        user.name
          ?.toLowerCase()
          .includes(searchValue)

        ||

        user.email
          ?.toLowerCase()
          .includes(searchValue)

        ||

        user.business_role
          ?.toLowerCase()
          .includes(searchValue)

        ||

        skillsMatch

      );

    });


  // =========================================================
  // DASHBOARD METRICS
  // =========================================================

  const totalUsers =
    users.length;


  const totalAssessments =
    users.reduce(
      (
        total,
        user
      ) =>
        total +
        (
          user.assessment_count || 0
        ),
      0
    );


  const completedAssessments =
    users.reduce(
      (
        total,
        user
      ) =>
        total +
        (
          user.completed_assessment_count ||
          0
        ),
      0
    );


  const usersWithActivity =
    users.filter(
      (user) =>
        user.completed_assessment_count > 0
    ).length;


  // =========================================================
  // FORMAT LEVEL
  // =========================================================

  const formatLevel =
    (level) => {

      if (
        level === null ||
        level === undefined
      ) {

        return "—";

      }

      return `Level ${level}`;

    };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="admin-dashboard">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="admin-page-header">

        <div>

          <div className="admin-eyebrow">
            ADMIN CONSOLE
          </div>

          <h1>
            Workforce Overview
          </h1>

          <p>
            Monitor employee assessments and
            skill development in one place.
          </p>

        </div>


        <div className="admin-header-badge">

          <span className="admin-status-dot" />

          Administrator

        </div>

      </header>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="admin-error">

          <span>
            ⚠️
          </span>

          {error}

        </div>

      )}


      {/* =====================================================
          METRICS
      ===================================================== */}

      <section className="admin-metrics">


        <div className="admin-metric-card">

          <div className="admin-metric-icon blue">
            👥
          </div>

          <div>

            <span>
              Employees
            </span>

            <strong>
              {totalUsers}
            </strong>

          </div>

        </div>


        <div className="admin-metric-card">

          <div className="admin-metric-icon purple">
            📝
          </div>

          <div>

            <span>
              Assessments
            </span>

            <strong>
              {totalAssessments}
            </strong>

          </div>

        </div>


        <div className="admin-metric-card">

          <div className="admin-metric-icon green">
            ✓
          </div>

          <div>

            <span>
              Completed
            </span>

            <strong>
              {completedAssessments}
            </strong>

          </div>

        </div>


        <div className="admin-metric-card">

          <div className="admin-metric-icon orange">
            📈
          </div>

          <div>

            <span>
              Active Learners
            </span>

            <strong>
              {usersWithActivity}
            </strong>

          </div>

        </div>


      </section>


      {/* =====================================================
          EMPLOYEE SECTION
      ===================================================== */}

      <section className="admin-users-section">


        <div className="admin-section-header">

          <div>

            <h2>
              Employees
            </h2>

            <p>
              View individual assessment performance.
            </p>

          </div>


          <div className="admin-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

        </div>


        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (

          <div className="admin-loading">

            <div className="admin-spinner" />

            <span>
              Loading employees...
            </span>

          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="admin-empty">

            <div>
              👥
            </div>

            <h3>
              No employees found
            </h3>

            <p>
              Try changing your search.
            </p>

          </div>

        ) : (

          <div className="admin-table-wrapper">

            <table className="admin-users-table">

              <thead>

                <tr>

                  <th>
                    Employee
                  </th>

                  <th>
                    Business Role
                  </th>

                  <th>
                    Assessments
                  </th>

                  <th>
                    Skills Assessed
                  </th>

                  <th>
                    View
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredUsers.map(
                  (user) => (

                    <tr
                      key={user.id}
                      onClick={() =>
                        navigate(
                          `/admin/users/${user.id}`
                        )
                      }
                    >


                      {/* ===================================
                          EMPLOYEE
                      =================================== */}

                      <td>

                        <div className="admin-employee">

                          <div className="admin-avatar">

                            {user.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "U"}

                          </div>


                          <div>

                            <strong>
                              {user.name}
                            </strong>

                            <span>
                              {user.email}
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* ===================================
                          BUSINESS ROLE
                      =================================== */}

                      <td>

                        <span className="admin-role">

                          {user.business_role ||
                            "Not assigned"}

                        </span>

                      </td>


                      {/* ===================================
                          ASSESSMENTS
                      =================================== */}

                      <td>

                        <div className="admin-assessment-count">

                          <strong>
                            {
                              user.completed_assessment_count
                              || 0
                            }
                          </strong>

                          <span>
                            /
                            {
                              user.assessment_count
                              || 0
                            }
                          </span>

                        </div>

                      </td>


                      {/* ===================================
                          SKILLS ASSESSED
                      =================================== */}

                      <td>

                        {user.skills_assessed?.length > 0 ? (

                          <div className="admin-skills-list">

                            {user.skills_assessed.map(
                              (skill) => (

                                <div
                                  className="admin-skill-item"
                                  key={skill.skill_id}
                                >

                                  <span className="admin-skill-pill">
                                    {skill.skill_name}
                                  </span>

                                  <span className="admin-skill-level">
                                    {formatLevel(
                                      skill.final_level
                                    )}
                                  </span>

                                </div>

                              )
                            )}

                          </div>

                        ) : (

                          <span className="admin-muted">
                            No assessment
                          </span>

                        )}

                      </td>


                      {/* ===================================
                          ACTION
                      =================================== */}

                      <td>

                        <button
                          type="button"
                          className="admin-view-button"
                          onClick={(event) => {

                            event.stopPropagation();

                            navigate(
                              `/admin/users/${user.id}`
                            );

                          }}
                        >

                          View

                          <span>
                            →
                          </span>

                        </button>

                      </td>


                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


    </div>

  );

}


export default AdminDashboard;