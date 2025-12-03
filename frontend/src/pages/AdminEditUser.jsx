// src/pages/AdminEditUser.jsx
// ------------------------------------------------------------
// AdminEditUser
//
// This page lets an admin edit another user's account details.
//
// URL pattern:
//   /admin/edit/:username
//
// Behavior:
//   - Reads the :username from the URL
//   - Fetches all users, finds the one matching that username
//   - Pre-fills a form with that user's email + zipcode
//   - Allows admin to optionally reset the user's password
//   - On save, calls adminUpdateUser and sends a flash message
//
// NOTES:
//   - Username itself is shown but is read-only in this UI.
//   - Only admins should be able to reach this page (protected
//     by routing / Admin page access control).
// ------------------------------------------------------------

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAllUsers, adminUpdateUser } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AdminEditUser() {
  // The username we want to edit comes from the URL: /admin/edit/:username
  const { username } = useParams();

  const navigate = useNavigate();

  // We use setFlash from AuthContext to show success/error messages.
  const { setFlash } = useAuth();

  // Local form state for this user.
  // username is read-only here but stored for display.
  const [form, setForm] = useState({
    username: "",
    email: "",
    zipcode: "",
    password: "",
  });

  // Simple loading flag for initial data fetch
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // Initial load:
  //   - Fetch all users
  //   - Find the one whose username matches the URL
  //   - Pre-fill the form with that user's data
  // ------------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const users = await getAllUsers();
        const user = users.find((u) => u.username === username);

        if (!user) {
          // If no user was found, show a flash and bounce back to Admin page.
          setFlash?.({
            type: "error",
            message: "User not found.",
          });
          return navigate("/admin");
        }

        // Pre-fill the form fields with the user's existing data.
        setForm({
          username: user.username,
          email: user.email || "",
          zipcode: user.zipcode || "",
          password: "",
        });

        setLoading(false);
      } catch (err) {
        console.error("Failed to load user for admin edit:", err);
        setFlash?.({
          type: "error",
          message: "Could not load user details.",
        });
        navigate("/admin");
      }
    }

    load();
  }, [username, navigate, setFlash]);

  // ------------------------------------------------------------
  // Handle changes in any input field.
  //
  // The input's "name" attribute matches a key in `form`,
  // so we can dynamically update the corresponding value.
  // ------------------------------------------------------------
  function handleChange(evt) {
    const { name, value } = evt.target;
    setForm((f) => ({
      ...f,
      [name]: value,
    }));
  }

  // ------------------------------------------------------------
  // Handle form submission:
  //
  //   - Prevent default browser submit behavior
  //   - Call adminUpdateUser with updated email/zipcode/password
  //   - Show success or error flash
  //   - Navigate back to the main Admin dashboard
  // ------------------------------------------------------------
  async function handleSubmit(evt) {
    evt.preventDefault();

    try {
      await adminUpdateUser(username, {
        email: form.email,
        zipcode: form.zipcode,
        // Only send password if the field is non-empty.
        // If it's empty, we pass `undefined` so the backend won't change it.
        password: form.password || undefined,
      });

      setFlash?.({
        type: "success",
        message: `Updated profile for ${username}.`,
      });

      navigate("/admin");
    } catch (err) {
      console.error("Admin update failed:", err);
      setFlash?.({
        type: "error",
        message: "Could not update user.",
      });
    }
  }

  // While we are still loading the user data, show a simple loading text.
  if (loading) return <p>Loading…</p>;

  // ------------------------------------------------------------
  // RENDER
  // Reuse the same "auth-card" styles as login/signup
  // so this form visually fits with the rest of the app.
  // ------------------------------------------------------------
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Edit User</h1>
        <p className="auth-subtitle">
          Update account info for <strong>{username}</strong>.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Username (read-only) */}
          <div className="form-row">
            <label>Username</label>
            <input value={form.username} disabled />
          </div>

          {/* Email field */}
          <div className="form-row">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          {/* Zipcode field */}
          <div className="form-row">
            <label>Zipcode</label>
            <input
              name="zipcode"
              value={form.zipcode}
              onChange={handleChange}
            />
          </div>

          {/* Optional password reset field */}
          <div className="form-row">
            <label>Reset password (optional)</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button className="btn-primary auth-button" type="submit">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
