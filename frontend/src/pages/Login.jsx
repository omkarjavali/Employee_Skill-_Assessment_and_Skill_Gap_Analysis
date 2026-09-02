import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";
import "./Auth.css";


function Login() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


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


  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

    if (!form.email || !form.password) {

      setError(
        "Please enter your email and password."
      );

      return;
    }

    try {

      setLoading(true);

      const response = await api.post(
        "/auth/login",
        {
          email: form.email,
          password: form.password
        }
      );

      const {
        access_token,
        user
      } = response.data;

      localStorage.setItem(
        "access_token",
        access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      // =====================================================
      // LOGIN SUCCESS
      // =====================================================

      // =====================================================
      // LOGIN SUCCESS
      // =====================================================
          
      if (user?.role === "ADMIN") {
      
        navigate("/admin");
      
      } else {
      
        navigate("/dashboard");
      
      }

    } catch (err) {

      console.error(
        "Login error:",
        err.response?.data || err
      );

      const detail =
        err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to login. Please check your credentials."
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-header">

          <div className="auth-logo">
            AI
          </div>

          <h1>
            Welcome back
          </h1>

          <p>
            Sign in to continue your assessment journey.
          </p>

        </div>


        {error && (

          <div className="auth-error">
            {error}
          </div>

        )}


        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

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
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />

          </div>


          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >

            {loading
              ? "Signing in..."
              : "Sign In"}

          </button>

        </form>


        <div className="auth-footer">

          <span>
            Don't have an account?
          </span>

          <Link to="/register">
            Create an account
          </Link>

        </div>

      </div>

    </div>

  );

}


export default Login;