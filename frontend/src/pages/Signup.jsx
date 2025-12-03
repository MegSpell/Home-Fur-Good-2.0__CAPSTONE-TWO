// src/pages/Signup.jsx
// ------------------------------------------------------------
// Signup Page
//
// Lets a new user create an account for Home Fur Good 2.0.
// After successful signup, we:
//
//   - store the user in AuthContext via loginUser()
//   - redirect them to /welcome (or a "from" route, if desired)
//
// Uses the shared auth layout + styles.
// ------------------------------------------------------------

import { useState } from "react";
import { useNavigate, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signup as apiSignup } from "../api";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  // From AuthContext: current user + function to log them in
  const { user, loginUser } = useAuth();

  // Simple form state for the four fields
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    zipcode: "",
    password: "",
  });

  // Error message for failed signup attempts
  const [error, setError] = useState(null);

  // Loading flag to disable button while we talk to the API
  const [loading, setLoading] = useState(false);

  // If user is already logged in, don't show signup form
  // (tests might not depend on this, but it's a nice guard)
  const from = location.state?.from?.pathname || "/welcome";
  if (user) {
    return <Navigate to={from} replace />;
  }

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
  function handleChange(evt) {
    const { name, value } = evt.target;
    setFormData((data) => ({ ...data, [name]: value }));
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Call backend signup endpoint via our API helper
      const newUser = await apiSignup(formData);

      // Store new user in global auth context
      loginUser(newUser);

      // Send them to the welcome page (or where they came from)
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Signup error:", err);

      // Friendly error for the user
      setError("Unable to sign up with those details");
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">
          Save your favorite dogs and see pups in need near your zipcode.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Error message (if any) */}
          {error && <div className="auth-error">{error}</div>}

          {/* Username */}
          <div className="form-row">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              name="username"
              autoComplete="username"
              required
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="form-row">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Zipcode */}
          <div className="form-row">
            <label htmlFor="signup-zipcode">Zipcode</label>
            <input
              id="signup-zipcode"
              name="zipcode"
              required
              value={formData.zipcode}
              onChange={handleChange}
            />
          </div>

          {/* Password */}
          <div className="form-row">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            className="btn-primary auth-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing up…" : "Sign up"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

