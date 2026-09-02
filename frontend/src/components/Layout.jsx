import {
  NavLink,
  Outlet,
  useNavigate
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import api from "../services/api";

import "./Layout.css";


function Layout() {

  const navigate =
    useNavigate();


  const [user, setUser] =
    useState(null);

  const [loadingUser, setLoadingUser] =
    useState(true);


  // =========================================================
  // LOAD AUTHENTICATED USER
  // =========================================================

  useEffect(() => {

    loadCurrentUser();

  }, []);


  const loadCurrentUser =
    async () => {

      try {

        const token =
          localStorage.getItem(
            "access_token"
          );


        if (!token) {

          setUser(null);

          setLoadingUser(false);

          navigate(
            "/login",
            {
              replace: true
            }
          );

          return;

        }


        const response =
          await api.get(
            "/auth/me"
          );


        console.log(
          "👤 Authenticated user:",
          response.data
        );


        setUser(
          response.data
        );


        // Synchronize local storage
        localStorage.setItem(
          "user",
          JSON.stringify(
            response.data
          )
        );

      } catch (err) {

        console.error(
          "❌ Failed to load authenticated user:",
          err.response?.data ||
            err
        );


        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "user"
        );


        setUser(null);


        navigate(
          "/login",
          {
            replace: true
          }
        );

      } finally {

        setLoadingUser(
          false
        );

      }

    };


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout =
    () => {

      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "user"
      );


      setUser(
        null
      );


      navigate(
        "/",
        {
          replace: true
        }
      );

    };


  // =========================================================
  // AUTH LOADING
  // =========================================================

  if (loadingUser) {

    return (

      <div className="app-auth-loading">

        <div className="app-auth-loader" />

        <p>
          Loading your account...
        </p>

      </div>

    );

  }


  // =========================================================
  // MAIN LAYOUT
  // =========================================================

  return (

    <div className="app-layout">


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="app-sidebar">


        {/* ===================================================
            BRAND
        =================================================== */}

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            AI
          </div>


          <div>

            <h2>
              Skill Assessment
            </h2>

            <span>
              AI-powered assessment
            </span>

          </div>

        </div>


        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <nav className="sidebar-navigation">


          {/* =================================================
              ADMIN NAVIGATION
          ================================================= */}

          {user?.role === "ADMIN" ? (

            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `sidebar-nav-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >

              <span className="nav-icon">
                🛡️
              </span>

              <span>
                Admin
              </span>

            </NavLink>

          ) : (

            /* =================================================
                EMPLOYEE NAVIGATION
            ================================================= */

            <>

              {/* Dashboard */}

              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  `sidebar-nav-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >

                <span className="nav-icon">
                  🏠
                </span>

                <span>
                  Dashboard
                </span>

              </NavLink>


              {/* Assessments */}

              <NavLink
                to="/assessments"
                className={({ isActive }) =>
                  `sidebar-nav-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >

                <span className="nav-icon">
                  📝
                </span>

                <span>
                  Assessments
                </span>

              </NavLink>


              {/* Skill Gap */}

              <NavLink
                to="/skill-gap"
                className={({ isActive }) =>
                  `sidebar-nav-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >

                <span className="nav-icon">
                  📊
                </span>

                <span>
                  Skill Gap
                </span>

              </NavLink>

            </>

          )}

        </nav>


        {/* ===================================================
            USER SECTION
        =================================================== */}

        <div className="sidebar-bottom">


          {user && (

            <div className="sidebar-user">

              <div className="sidebar-user-avatar">

                {user.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  "U"}

              </div>


              <div className="sidebar-user-info">

                <strong>
                  {user.name}
                </strong>

                <span>
                  {user.role}
                </span>

              </div>

            </div>

          )}


          <button
            type="button"
            className="logout-button"
            onClick={
              handleLogout
            }
          >

            <span className="logout-icon">
              ↪
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="app-main">

        <Outlet />

      </main>

    </div>

  );

}


export default Layout;