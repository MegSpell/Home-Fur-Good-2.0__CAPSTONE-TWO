// src/pages/Login.jsx
// ------------------------------------------------------------
// Login Page
//
// This page lets existing users log into Home Fur Good 2.0.
//
// Flow:
//   1. User enters username + password
//   2. We call the backend login API
//   3. On success, we:
//        - store the user in AuthContext via loginUser()
//        - redirect either to the page they came from, or /welcome
//   4. On failure, we show a friendly error message.
//
// UI notes:
//   - Reuses the shared "auth-page" and "auth-card" styles
//   - Has a link to switch to the Signup page
// ------------------------------------------------------------

import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login as apiLogin } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  // Local form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Error message for failed login attempts
  const [error, setError] = useState(null);

  // Simple loading flag to disable the button while logging in
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // From AuthContext: function to set the logged-in user + load favorites
  const { loginUser } = useAuth();

  // If the user was redirected here from a protected page,
  // we store where they came from in location.state.from.
  // After logging in, we send them back there.
  // Fallback: go to /welcome.
  const from = location.state?.from?.pathname || "/welcome";

  // ------------------------------------------------------------
  // Handle form submission
  // ------------------------------------------------------------
  async function handleSubmit(evt) {
    evt.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Call backend login API
      const user = await apiLogin({ username, password });

      // Store user in global AuthContext (also loads favorites)
      loginUser(user);

      // Navigate back to where they came from, or /welcome
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      // Show human-readable message (don't surface raw server errors)
      setError("Invalid username or password");
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
        <h1 className="auth-title">Log in</h1>
        <p className="auth-subtitle">
          Welcome back! Let’s find your new best friend.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Error message box */}
          {error && <div className="auth-error">{error}</div>}

          {/* Username field */}
          {/* <div className="form-row">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div> */}

          <div className="form-row">
            <label htmlFor="login-username">Username</label>
            <input
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
            />
            </div>


          {/* Password field */}
          {/* <div className="form-row">
            <label>Password</label>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div> */}

          <div className="form-row">
            <label htmlFor="login-password">Password</label>
            <input
                id="login-password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            </div>


          {/* Submit button */}
          <button className="btn-primary auth-button" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        {/* Switch to Signup link */}
        <p className="auth-switch">
          Don’t have an account?{" "}
          <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}







// ==== before comments =======
// // src/pages/Login.jsx
// import { useState } from "react";
// import { useNavigate, useLocation, Link } from "react-router-dom";
// import { login as apiLogin } from "../api";
// import { useAuth } from "../context/AuthContext";

// export default function Login() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();
//   const location = useLocation();
//   const { loginUser } = useAuth();

//   // If redirected from a protected page, go back there
//   const from = location.state?.from?.pathname || "/welcome";

//   async function handleSubmit(evt) {
//     evt.preventDefault();
//     setError(null);
//     setLoading(true);

//     try {
//       const user = await apiLogin({ username, password });
//       loginUser(user);
//       navigate(from, { replace: true });
//     } catch (err) {
//       console.error("Login error:", err);
//       setError("Invalid username or password");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="auth-page">
//       <div className="auth-card">
//         <h1 className="auth-title">Log in</h1>
//         <p className="auth-subtitle">Welcome back! Let’s find your new best friend.</p>

//         <form className="auth-form" onSubmit={handleSubmit}>
//           {error && <div className="auth-error">{error}</div>}

//           <div className="form-row">
//             <label>Username</label>
//             <input
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               autoComplete="username"
//               required
//             />
//           </div>

//           <div className="form-row">
//             <label>Password</label>
//             <input
//               type="password"
//               value={password}
//               autoComplete="current-password"
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </div>

//           <button className="btn-primary auth-button" disabled={loading}>
//             {loading ? "Logging in…" : "Log in"}
//           </button>
//         </form>

//         <p className="auth-switch">
//           Don’t have an account?{" "}
//           <Link to="/signup">Sign up</Link>
//         </p>
//       </div>
//     </div>
//   );
// }
