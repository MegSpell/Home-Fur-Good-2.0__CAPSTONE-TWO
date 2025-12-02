// src/pages/Admin.jsx
// ------------------------------------------------------------
// Admin Dashboard
//
// This page is meant for admin users only. It shows:
//
//   - A table of all users (username, email, admin flag)
//   - Each user's favorites + favorites count
//   - A simple way to delete users (except the root admin & yourself)
//   - A raw table of global favorite counts per dog ID
//
// Access control:
//   - Only users with user.isAdmin === true
//   - OR a user whose username is literally "admin"
//     can see this page.
//   - Everyone else sees an "Admin Only" message.
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAllUsers,
  getFavoriteCountsAdmin,
  adminDeleteUser,
} from "../api";
import { Link } from "react-router-dom";

export default function Admin() {
  const { user } = useAuth();

  // List of all users for the admin table
  const [users, setUsers] = useState([]);

  // Global favorite counts: { dogId: count, ... }
  const [favoriteCounts, setFavoriteCounts] = useState({});

  // Simple loading flag for the initial data fetch
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // loadData
  //
  // Fetch both:
  //   - the full user list
  //   - the global favorites counts
  //
  // We use Promise.all so they load in parallel.
  // ------------------------------------------------------------
  async function loadData() {
    try {
      setLoading(true);

      const [u, counts] = await Promise.all([
        getAllUsers(),           // returns array of user objects
        getFavoriteCountsAdmin() // returns { dogId: count, ... }
      ]);

      setUsers(u);
      setFavoriteCounts(counts);
    } catch (err) {
      console.error("Failed loading admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Load admin data once when the page mounts
  useEffect(() => {
    loadData();
  }, []);

  // ------------------------------------------------------------
  // handleDeleteUser
  //
  // Confirm via window.confirm, then call the API to delete.
  // After deletion, refresh the admin data so the tables update.
  // ------------------------------------------------------------
  async function handleDeleteUser(username) {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete user "${username}"?`
    );
    if (!confirmDelete) return;

    try {
      await adminDeleteUser(username);
      await loadData();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  }

  // ------------------------------------------------------------
  // Access Control: Admin Only
  //
  // If the user is NOT an admin and NOT literally "admin",
  // show an info card instead of the dashboard.
  // ------------------------------------------------------------
  if (!user?.isAdmin && user?.username !== "admin") {
    return (
      <div className="info-card">
        <h1>Admin Only</h1>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.username}. You are viewing administrative data.</p>

      {loading && <p>Loading admin data…</p>}

      {!loading && (
        <>
          {/* ======================================================
             USERS TABLE
             - Shows each user + their favorites + actions
          ======================================================= */}
          <h2>All Users</h2>

          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Admin?</th>
                <th># Favorites</th>
                <th>Favorite Dog IDs</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => {
                const isRootAdmin = u.username === "admin";
                const isSelf = u.username === user?.username;

                // Ensure favorites is always an array before using it
                const favsArray = Array.isArray(u.favorites)
                  ? u.favorites
                  : [];

                return (
                  <tr key={u.username}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.isAdmin ? "Yes" : "No"}</td>

                    {/* Prefer u.favoritesCount if provided, fall back to length */}
                    <td>{u.favoritesCount ?? favsArray.length ?? 0}</td>

                    {/* Quick debug-style view of favorite dog IDs */}
                    <td>{favsArray.join(", ")}</td>

                    {/* Actions: Edit link + conditional Delete button */}
                    <td className="admin-table__actions">
                      {/* Edit goes to a dedicated admin edit page */}
                      <Link
                        to={`/admin/edit/${u.username}`}
                        className="admin-btn admin-btn--secondary"
                      >
                        Edit
                      </Link>

                      {/* Don't allow deleting the root admin or yourself */}
                      {!isRootAdmin && !isSelf && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          onClick={() => handleDeleteUser(u.username)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ======================================================
             FAVORITE COUNTS TABLE
             - Shows raw dogId -> favorites count mapping
             - Sorted ascending (least favorited at the top)
          ======================================================= */}
          <h2>Favorite Counts (All Dogs)</h2>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Dog ID</th>
                <th>Favorites</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(favoriteCounts)
                // Sort by count ascending so "least favorited" appear first
                .sort((a, b) => a[1] - b[1])
                .map(([dogId, count]) => (
                  <tr key={dogId}>
                    <td>{dogId}</td>
                    <td>{count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}








// ======= before comments =====
// // src/pages/Admin.jsx
// import { useEffect, useState } from "react";
// import { useAuth } from "../context/AuthContext";
// import {
//   getAllUsers,
//   getFavoriteCountsAdmin,
//   adminDeleteUser,
// } from "../api";
// import { Link } from "react-router-dom";


// export default function Admin() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [favoriteCounts, setFavoriteCounts] = useState({});
//   const [loading, setLoading] = useState(true);

//   async function loadData() {
//     try {
//       setLoading(true);
//       const [u, counts] = await Promise.all([
//         getAllUsers(),
//         getFavoriteCountsAdmin(),
//       ]);
//       setUsers(u);
//       setFavoriteCounts(counts);
//     } catch (err) {
//       console.error("Failed loading admin data:", err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     loadData();
//   }, []);

//   async function handleDeleteUser(username) {
//     const confirmDelete = window.confirm(
//       `Are you sure you want to delete user "${username}"?`
//     );
//     if (!confirmDelete) return;

//     try {
//       await adminDeleteUser(username);
//       await loadData();
//     } catch (err) {
//       console.error("Failed to delete user:", err);
//     }
//   }

//   // For now, Edit is just a placeholder
//   function handleEditUser(username) {
//     alert(`Edit profile for "${username}" coming soon 🙂`);
//   }

//   // Only let real admins see this page
//   if (!user?.isAdmin && user?.username !== "admin") {
//     return (
//       <div className="info-card">
//         <h1>Admin Only</h1>
//         <p>You must be an admin to view this page.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="admin-page">
//       <h1>Admin Dashboard</h1>
//       <p>Welcome, {user?.username}. You are viewing administrative data.</p>

//       {loading && <p>Loading admin data…</p>}

//       {!loading && (
//         <>
//           {/* ===== USERS TABLE ===== */}
//           <h2>All Users</h2>
//           <table className="admin-table">
//             <thead>
//               <tr>
//                 <th>User</th>
//                 <th>Email</th>
//                 <th>Admin?</th>
//                 <th># Favorites</th>
//                 <th>Favorite Dog IDs</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {users.map((u) => {
//                 const isRootAdmin = u.username === "admin";
//                 const isSelf = u.username === user?.username;
//                 const favsArray = Array.isArray(u.favorites)
//                   ? u.favorites
//                   : [];

//                 return (
//                   <tr key={u.username}>
//                     <td>{u.username}</td>
//                     <td>{u.email}</td>
//                     <td>{u.isAdmin ? "Yes" : "No"}</td>
//                     <td>{u.favoritesCount ?? favsArray.length ?? 0}</td>
//                     <td>{favsArray.join(", ")}</td>
//                     <td className="admin-table__actions">
                     

//                       <Link
//                         to={`/admin/edit/${u.username}`}
//                         className="admin-btn admin-btn--secondary"
//                         >
//                         Edit
//                         </Link>


//                       {!isRootAdmin && !isSelf && (
//                         <button
//                           type="button"
//                           className="admin-btn admin-btn--danger"
//                           onClick={() => handleDeleteUser(u.username)}
//                         >
//                           Delete
//                         </button>
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>

//           {/* ===== FAVORITE COUNTS RAW VIEW (DEBUG / INSIGHT) ===== */}
//           <h2>Favorite Counts (All Dogs)</h2>
          

// <table className="admin-table">
//   <thead>
//     <tr>
//       <th>Dog ID</th>
//       <th>Favorites</th>
//     </tr>
//   </thead>
//   <tbody>
//     {Object.entries(favoriteCounts)
//       .sort((a, b) => a[1] - b[1])  // ascending
//       .map(([dogId, count]) => (
//         <tr key={dogId}>
//           <td>{dogId}</td>
//           <td>{count}</td>
//         </tr>
//       ))}
//   </tbody>
// </table>

//         </>
//       )}
//     </div>
//   );
// }


