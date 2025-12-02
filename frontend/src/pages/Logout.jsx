// src/pages/Logout.jsx
// ------------------------------------------------------------
// Logout Page
//
// This page immediately logs out the user when loaded.
// After clearing auth state, it redirects them to /login.
//
// It uses logoutUser() from AuthContext, which:
//   - clears user
//   - clears favorites
//   - shows a flash message
// ------------------------------------------------------------

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Logout() {
  const { logoutUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wrap in async IIFE
    (async function doLogout() {
      try {
        await logoutUser();
      } finally {
        navigate("/login", { replace: true });
      }
    })();
  }, [logoutUser, navigate]);

  return <p>Logging you out…</p>;
}







// ===== before comments ======
// // src/pages/Logout.jsx
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// export default function Logout() {
//   const auth = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     async function doLogout() {
//       try {
//         if (auth) {
//           if (typeof auth.logout === "function") {
//             await auth.logout();
//           } else if (typeof auth.setCurrentUser === "function") {
//             auth.setCurrentUser(null);
//           } else if (typeof auth.setUser === "function") {
//             auth.setUser(null);
//           }
//         }
//       } finally {
//         navigate("/login");
//       }
//     }

//     doLogout();
//   }, [auth, navigate]);

//   return <p>Logging you out…</p>;
// }
