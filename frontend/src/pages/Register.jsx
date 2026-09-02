import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";
import "./Auth.css";


function Register() {

  const navigate = useNavigate();


  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role_id: ""
  });


  const [roles, setRoles] = useState([]);

  const [rolesLoading, setRolesLoading] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // =========================================================
  // LOAD ROLES
  // =========================================================

  useEffect(() => {

    const loadRoles = async () => {

      try {

        setRolesLoading(true);

        const response =
          await api.get("/roles");

        const data =
          Array.isArray(response.data)
            ? response.data
            : [];

        setRoles(data);

        // Automatically select the first available role
        if (data.length > 0) {

          setForm((current) => ({

            ...current,

            role_id:
              current.role_id ||
              String(data[0].id)

          }));

        }

      } catch (err) {

        console.error(
          "Failed to load roles:",
          err.response?.data || err
        );

        setError(
          "Unable to load available roles. Please try again."
        );

      } finally {

        setRolesLoading(false);

      }

    };


    loadRoles();

  }, []);


  // =========================================================
  // HANDLE CHANGE
  // =========================================================

  const handleChange = (event) => {

    const {
      name,
      value
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));

  };


  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");


    // -------------------------------------------------------
    // Required fields
    // -------------------------------------------------------

    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword ||
      !form.role_id
    ) {

      setError(
        "Please complete all fields."
      );

      return;
    }


    // -------------------------------------------------------
    // Password length
    // -------------------------------------------------------

    if (form.password.length < 8) {

      setError(
        "Password must be at least 8 characters."
      );

      return;
    }


    // -------------------------------------------------------
    // bcrypt 72-byte limitation
    // -------------------------------------------------------

    if (
      new TextEncoder()
        .encode(form.password)
        .length > 72
    ) {

      setError(
        "Password must not exceed 72 bytes."
      );

      return;
    }


    // -------------------------------------------------------
    // Confirm password
    // -------------------------------------------------------

    if (
      form.password !==
      form.confirmPassword
    ) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    try {

      setLoading(true);


      // -----------------------------------------------------
      // Register
      // -----------------------------------------------------

      const response =
        await api.post(
          "/auth/register",
          {
            name: form.name.trim(),

            email: form.email.trim(),

            password: form.password,

            role_id: Number(
              form.role_id
            )
          }
        );


      const {
        access_token,
        user
      } = response.data;


      // -----------------------------------------------------
      // Store authentication
      // -----------------------------------------------------

      localStorage.setItem(
        "access_token",
        access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );


      // -----------------------------------------------------
      // Go to dashboard
      // -----------------------------------------------------

      navigate(
        "/",
        {
          replace: true
        }
      );

    } catch (err) {

      console.error(
        "Registration error:",
        err.response?.data || err
      );


      const detail =
        err.response?.data?.detail;


      setError(
        typeof detail === "string"
          ? detail
          : "Unable to create your account."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="auth-page">

      <div className="auth-card">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="auth-header">

          <div className="auth-logo">
            AI
          </div>

          <h1>
            Create your account
          </h1>

          <p>
            Start your personalized skills assessment.
          </p>

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div className="auth-error">
            {error}
          </div>

        )}


        {/* ===================================================
            FORM
        =================================================== */}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {/* -------------------------------------------------
              NAME
          ------------------------------------------------- */}

          <div className="auth-field">

            <label htmlFor="name">
              Full Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your name"
              autoComplete="name"
              disabled={loading}
            />

          </div>


          {/* -------------------------------------------------
              EMAIL
          ------------------------------------------------- */}

          <div className="auth-field">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
            />

          </div>


          {/* -------------------------------------------------
              BUSINESS ROLE
          ------------------------------------------------- */}

          <div className="auth-field">

            <label htmlFor="role_id">
              Business Role
            </label>

            <select
              id="role_id"
              name="role_id"
              value={form.role_id}
              onChange={handleChange}
              disabled={
                loading ||
                rolesLoading
              }
            >

              {rolesLoading ? (

                <option value="">
                  Loading roles...
                </option>

              ) : roles.length === 0 ? (

                <option value="">
                  No roles available
                </option>

              ) : (

                roles.map((role) => (

                  <option
                    key={role.id}
                    value={role.id}
                  >
                    {role.name}
                  </option>

                ))

              )}

            </select>


            {/* Role description */}

            {form.role_id && (

              <p className="auth-field-help">

                {
                  roles.find(
                    (role) =>
                      String(role.id) ===
                      String(form.role_id)
                  )?.description
                }

              </p>

            )}

          </div>


          {/* -------------------------------------------------
              PASSWORD
          ------------------------------------------------- */}

          <div className="auth-field">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              disabled={loading}
            />

          </div>


          {/* -------------------------------------------------
              CONFIRM PASSWORD
          ------------------------------------------------- */}

          <div className="auth-field">

            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              disabled={loading}
            />

          </div>


          {/* -------------------------------------------------
              SUBMIT
          ------------------------------------------------- */}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading ||
              rolesLoading ||
              roles.length === 0
            }
          >

            {loading
              ? "Creating account..."
              : "Create Account"}

          </button>

        </form>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="auth-footer">

          <span>
            Already have an account?
          </span>

          <Link to="/login">
            Sign in
          </Link>

        </div>

      </div>

    </div>

  );

}


export default Register;