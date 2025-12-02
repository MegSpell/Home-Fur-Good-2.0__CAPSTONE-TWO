// src/pages/Profile.jsx
// ------------------------------------------------------------
// Profile Page
//
// Lets a logged-in user view and update their own account info:
//
//   - Email
//   - Zipcode
//   - Password (optional reset)
//
// Flow:
//   1. On mount, fetch the latest profile info from the backend
//   2. Pre-fill the form with username, email, zip
//   3. On submit, send updated values to the backend
//   4. If successful:
//        - update the user in AuthContext (so the rest of the app
//          sees the new email/zipcode)
//        - show a success flash message
//        - clear the password field
//      If failure:
//        - log error and show error flash
//
// If no user is logged in, we show a friendly message and reuse
// the auth-page/auth-card layout, but *don’t* attempt to load a profile.
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile } from "../api";

export default function Profile() {
  // From AuthContext:
  //   user      -> currently logged-in user (or null)
  //   loginUser -> used here to refresh user info in context
  //   setFlash  -> show success/error messages at the top of the app
  const { user, loginUser, setFlash } = useAuth();

  // Local form state for the user's profile
  const [form, setForm] = useState({
    username: "",
    email: "",
    zipcode: "",
    password: "",
  });

  // Loading flag while we fetch profile info from backend
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // On mount (and whenever `user` changes):
  //   - If there is a logged-in user, load their profile from backend
  //   - Pre-fill the form fields
  // ------------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const profile = await getProfile(user.username);

        setForm({
          username: profile.username,
          email: profile.email || "",
          zipcode: profile.zipcode || "",
          password: "",
        });

        setLoading(false);
      } catch (err) {
        console.error("Error loading profile:", err);
        setLoading(false);
        // Optional: could show a flash error here as well
      }
    }

    load();
  }, [user]);

  // ------------------------------------------------------------
  // Handle input changes for any form field.
  //
  // Each input's "name" matches a key in `form`, so we update that key.
  // ------------------------------------------------------------
  function handleChange(evt) {
    const { name, value } = evt.target;
    setForm((f) => ({
      ...f,
      [name]: value,
    }));
  }

  // ------------------------------------------------------------
  // Handle form submit:
  //
  //   - Prevent default form behavior
  //   - Call updateProfile on the backend
  //   - If successful, update AuthContext user + show success flash
  //   - Clear the password field
  // ------------------------------------------------------------
  async function handleSubmit(evt) {
    evt.preventDefault();
    if (!user) return;

    try {
      const updated = await updateProfile(user.username, {
        email: form.email,
        zipcode: form.zipcode,
        // Only send a password if the field is non-empty
        password: form.password || undefined,
      });

      // Refresh auth context so the rest of the app sees the new email/zip
      // We spread the existing user object and override just the fields we updated.
      loginUser({
        ...user,
        email: updated.email,
        zipcode: updated.zipcode,
      });

      setFlash?.({
        type: "success",
        message: "Profile updated successfully.",
      });

      // Clear only the password field after a successful save
      setForm((f) => ({ ...f, password: "" }));
    } catch (err) {
      console.error("Error updating profile:", err);
      setFlash?.({
        type: "error",
        message: "Could not update profile. Please try again.",
      });
    }
  }

  // ------------------------------------------------------------
  // If there is no logged-in user, show a gentle locked message.
  // ------------------------------------------------------------
  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">My Profile</h1>
          <p className="auth-subtitle">
            You need to log in to view and edit your profile.
          </p>
        </div>
      </div>
    );
  }

  // While loading profile data, show a simple loading state.
  if (loading) {
    return <p>Loading profile…</p>;
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
  <div className="auth-page">
    <div className="auth-card">
      <h1 className="auth-title">My Profile</h1>
      <p className="auth-subtitle">
        Update your email, zipcode, and password.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Username shown but not editable */}
        <div className="form-row">
          <label htmlFor="profile-username">Username</label>
          <input
            id="profile-username"
            value={form.username}
            disabled
          />
        </div>

        {/* Email input */}
        <div className="form-row">
          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        {/* Zipcode input */}
        <div className="form-row">
          <label htmlFor="profile-zipcode">Zipcode</label>
          <input
            id="profile-zipcode"
            name="zipcode"
            value={form.zipcode}
            onChange={handleChange}
          />
        </div>

        {/* Optional password reset */}
        <div className="form-row">
          <label htmlFor="profile-password">New Password (optional)</label>
          <input
            id="profile-password"
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








// ===== before comments ======
// // src/pages/Profile.jsx
// import { useEffect, useState } from "react";
// import { useAuth } from "../context/AuthContext";
// import { getProfile, updateProfile } from "../api";

// export default function Profile() {
//   const { user, loginUser, setFlash } = useAuth();

//   const [form, setForm] = useState({
//     username: "",
//     email: "",
//     zipcode: "",
//     password: "",
//   });

//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!user) return;

//     async function load() {
//       try {
//         const profile = await getProfile(user.username);

//         setForm({
//           username: profile.username,
//           email: profile.email || "",
//           zipcode: profile.zipcode || "",
//           password: "",
//         });

//         setLoading(false);
//       } catch (err) {
//         console.error("Error loading profile:", err);
//         setLoading(false);
//       }
//     }

//     load();
//   }, [user]);

//   function handleChange(evt) {
//     const { name, value } = evt.target;
//     setForm((f) => ({
//       ...f,
//       [name]: value,
//     }));
//   }

//   async function handleSubmit(evt) {
//     evt.preventDefault();
//     if (!user) return;

//     try {
//       const updated = await updateProfile(user.username, {
//         email: form.email,
//         zipcode: form.zipcode,
//         password: form.password || undefined, // only send if filled in
//       });

//       // Refresh auth context so the rest of the app sees new email/zip
//       loginUser({
//         ...user,
//         email: updated.email,
//         zipcode: updated.zipcode,
//       });

//       setFlash?.({
//         type: "success",
//         message: "Profile updated successfully.",
//       });

//       // clear password field
//       setForm((f) => ({ ...f, password: "" }));
//     } catch (err) {
//       console.error("Error updating profile:", err);
//       setFlash?.({
//         type: "error",
//         message: "Could not update profile. Please try again.",
//       });
//     }
//   }

//   if (!user) {
//     return (
//       <div className="auth-page">
//         <div className="auth-card">
//           <h1 className="auth-title">My Profile</h1>
//           <p className="auth-subtitle">
//             You need to log in to view and edit your profile.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return <p>Loading profile…</p>;
//   }

//   return (
//     <div className="auth-page">
//       <div className="auth-card">
//         <h1 className="auth-title">My Profile</h1>
//         <p className="auth-subtitle">
//           Update your email, zipcode, and password.
//         </p>

//         <form className="auth-form" onSubmit={handleSubmit}>
//           {/* Username shown but not editable */}
//           <div className="form-row">
//             <label>Username</label>
//             <input value={form.username} disabled />
//           </div>

//           <div className="form-row">
//             <label>Email</label>
//             <input
//               name="email"
//               type="email"
//               value={form.email}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="form-row">
//             <label>Zipcode</label>
//             <input
//               name="zipcode"
//               value={form.zipcode}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="form-row">
//             <label>New Password (optional)</label>
//             <input
//               name="password"
//               type="password"
//               value={form.password}
//               onChange={handleChange}
//             />
//           </div>

//           <button className="btn-primary auth-button" type="submit">
//             Save Changes
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
