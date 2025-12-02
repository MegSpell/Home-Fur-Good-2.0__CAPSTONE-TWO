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







// // src/pages/Signup.jsx
// // ------------------------------------------------------------
// // Signup Page
// //
// // This page lets a brand new user create an account.
// //
// // Flow:
// //   1. If a user is already logged in, redirect them to /welcome.
// //   2. Otherwise, show a simple form with:
// //        - username
// //        - email
// //        - zipcode
// //        - password
// //   3. On submit:
// //        - Call our backend via apiSignup()
// //        - If successful, log the user in via loginUser()
// //        - Show a success flash message
// //        - Navigate to /welcome
// //        - If there is an error, show an error flash instead.
// //
// // NOTE: We keep a local `isSubmitting` flag so we can disable the
// //       button and show "Creating account…" while the request runs.
// // ------------------------------------------------------------

// import { useState } from "react";
// import { useNavigate, Navigate, Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { signup as apiSignup } from "../api";

// export default function Signup() {
//   const navigate = useNavigate();
//   const { user, loginUser, setFlash } = useAuth();

//   // ----------------------------------------------------------
//   // If a user is already logged in, they shouldn't see signup.
//   // We immediately redirect them to /welcome.
//   // ----------------------------------------------------------
//   if (user) {
//     return <Navigate to="/welcome" replace />;
//   }

//   // ----------------------------------------------------------
//   // Local form state
//   //
//   // We keep all fields together in a single `formData` object.
//   // `handleChange` updates the specific key based on input name.
//   // ----------------------------------------------------------
//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//     zipcode: "",
//     password: "",
//   });

//   // True while the signup request is in-flight
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Generic handler for all inputs (uses "name" attribute)
//   function handleChange(evt) {
//     const { name, value } = evt.target;
//     setFormData((f) => ({ ...f, [name]: value }));
//   }

//   // ----------------------------------------------------------
//   // Handle form submission:
//   //
//   //   - Prevent default browser POST
//   //   - Flip on "submitting" state
//   //   - Call apiSignup() with trimmed values
//   //   - On success:
//   //       - log the user in (so they're stored in context)
//   //       - show a flash message
//   //       - navigate to /welcome
//   //   - On error:
//   //       - show error message from backend if available
//   //   - Always:
//   //       - flip "submitting" back to false
//   // ----------------------------------------------------------
//   async function handleSubmit(evt) {
//     evt.preventDefault();
//     setIsSubmitting(true);

//     try {
//       const newUser = await apiSignup({
//         username: formData.username.trim(),
//         email: formData.email.trim(),
//         zipcode: formData.zipcode.trim(),
//         password: formData.password,
//       });

//       // Put the new user into AuthContext so the rest of the app
//       // knows they are logged in.
//       loginUser(newUser);

//       // Friendly welcome message at the top of the screen
//       setFlash({
//         type: "success",
//         message: `Welcome, ${newUser.username}!`,
//       });

//       // Send them to the main logged-in landing page
//       navigate("/welcome");
//     } catch (err) {
//       console.error("Signup failed:", err);
//       const msg =
//         err?.response?.data?.error ||
//         "Signup failed. Please try again.";
//       setFlash({ type: "error", message: msg });
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   // ----------------------------------------------------------
//   // RENDER
//   // ----------------------------------------------------------
//   return (
//     <div className="auth-page">
//       <div className="auth-card">
//         <h1 className="auth-title">Create an account</h1>
//         <p className="auth-subtitle">
//           Save your favorite dogs and see pups in need near your zipcode.
//         </p>

//         {/* <form onSubmit={handleSubmit} className="auth-form">
//           <div className="form-row">
//             <label>Username</label>
//             <input
//               name="username"
//               autoComplete="username"
//               value={formData.username}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div className="form-row">
//             <label>Email</label>
//             <input
//               name="email"
//               type="email"
//               autoComplete="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div className="form-row">
//             <label>Zipcode</label>
//             <input
//               name="zipcode"
//               value={formData.zipcode}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div className="form-row">
//             <label>Password</label>
//             <input
//               name="password"
//               type="password"
//               autoComplete="new-password"
//               value={formData.password}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             className="btn-primary auth-button"
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? "Creating account…" : "Sign up"}
//           </button>
//         </form> */}

//         <form className="auth-form" onSubmit={handleSubmit}>
//   {/* Error message (if any) */}
//   {error && <div className="auth-error">{error}</div>}

//   {/* Username */}
//   <div className="form-row">
//     <label htmlFor="signup-username">Username</label>
//     <input
//       id="signup-username"
//       name="username"
//       autoComplete="username"
//       required
//       value={formData.username}
//       onChange={handleChange}
//     />
//   </div>

//   {/* Email */}
//   <div className="form-row">
//     <label htmlFor="signup-email">Email</label>
//     <input
//       id="signup-email"
//       name="email"
//       type="email"
//       autoComplete="email"
//       required
//       value={formData.email}
//       onChange={handleChange}
//     />
//   </div>

//   {/* Zipcode */}
//   <div className="form-row">
//     <label htmlFor="signup-zipcode">Zipcode</label>
//     <input
//       id="signup-zipcode"
//       name="zipcode"
//       required
//       value={formData.zipcode}
//       onChange={handleChange}
//     />
//   </div>

//   {/* Password */}
//   <div className="form-row">
//     <label htmlFor="signup-password">Password</label>
//     <input
//       id="signup-password"
//       name="password"
//       type="password"
//       autoComplete="new-password"
//       required
//       value={formData.password}
//       onChange={handleChange}
//     />
//   </div>

//   <button className="btn-primary auth-button" type="submit">
//     Sign up
//   </button>
// </form>


//         <p className="auth-switch">
//           Already have an account?{" "}
//           <Link to="/login">Log in</Link>
//         </p>
//       </div>
//     </div>
//   );
// }








// ======= before comments===========
// // src/pages/Signup.jsx
// import { useState } from "react";
// import { useNavigate, Navigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { signup as apiSignup } from "../api";

// export default function Signup() {
//   const navigate = useNavigate();
//   const { user, loginUser, setFlash } = useAuth();

//   // If logged in, redirect
//   if (user) {
//     return <Navigate to="/welcome" replace />;
//   }

//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//     zipcode: "",
//     password: "",
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   function handleChange(evt) {
//     const { name, value } = evt.target;
//     setFormData((f) => ({ ...f, [name]: value }));
//   }

//   async function handleSubmit(evt) {
//     evt.preventDefault();
//     setIsSubmitting(true);

//     try {
//       const newUser = await apiSignup({
//         username: formData.username.trim(),
//         email: formData.email.trim(),
//         zipcode: formData.zipcode.trim(),
//         password: formData.password,
//       });

//       loginUser(newUser); // auto-login the new user

//       setFlash({
//         type: "success",
//         message: `Welcome, ${newUser.username}!`,
//       });

//       navigate("/welcome");
//     } catch (err) {
//       console.error("Signup failed:", err);
//       const msg =
//         err?.response?.data?.error ||
//         "Signup failed. Please try again.";
//       setFlash({ type: "error", message: msg });
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <div className="auth-page">
//       <div className="auth-card">
//         <h1 className="auth-title">Create an account</h1>
//         <p className="auth-subtitle">
//           Save your favorite dogs and see pups in need near your zipcode.
//         </p>

//         <form onSubmit={handleSubmit} className="auth-form">
//           <div className="form-row">
//             <label>Username</label>
//             <input
//               name="username"
//               autoComplete="username"
//               value={formData.username}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div className="form-row">
//             <label>Email</label>
//             <input
//               name="email"
//               type="email"
//               autoComplete="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div className="form-row">
//             <label>Zipcode</label>
//             <input
//               name="zipcode"
//               value={formData.zipcode}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div className="form-row">
//             <label>Password</label>
//             <input
//               name="password"
//               type="password"
//               autoComplete="new-password"
//               value={formData.password}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             className="btn-primary auth-button"
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? "Creating account…" : "Sign up"}
//           </button>
//         </form>

//         <p className="auth-switch">
//           Already have an account? <a href="/login">Log in</a>
//         </p>
//       </div>
//     </div>
//   );
// }

