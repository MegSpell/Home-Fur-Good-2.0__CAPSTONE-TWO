// src/App.jsx
// ======================================================================
// ROOT FRONTEND COMPONENT
//
// This file handles:
//   • The TOP-LEVEL ROUTE TREE (all pages, public + protected)
//   • Layout structure (header, footer, nav)
//   • Authentication gating (RequireAuth)
//   • Admin mode styling
//   • Navigation dropdown logic
//   • Flash message positioning
//
// Think of this like the “frame” of your entire app.
// All real pages are children of <Layout />.
// ======================================================================

import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Outlet,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import FlashMessages from "./components/FlashMessages.jsx";

import hfgLogo from "./assets/HFG2-icon.png";

// ----------------------
// Import all page files
// ----------------------
import Home from "./pages/Home.jsx";
import Welcome from "./pages/Welcome.jsx";
import Search from "./pages/Search.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import DogDetail from "./pages/DogDetail.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Favorites from "./pages/Favorites.jsx";
import Admin from "./pages/Admin.jsx";
import Profile from "./pages/Profile.jsx";
import AdminEditUser from "./pages/AdminEditUser.jsx";
import About from "./pages/About.jsx";


// ======================================================================
// Fallback Page for Invalid URLs
// ======================================================================
function NotFound() {
  return (
    <div className="info-card">
      <h1>Page not found</h1>
      <p>The page you requested doesn&apos;t exist.</p>
      <Link to="/" className="nav-link nav-link--primary">
        Go home
      </Link>
    </div>
  );
}

// ======================================================================
// Route Guard — Only allows logged-in users to access private routes
//
// HOW IT WORKS:
//   • If user is not logged in → immediately navigate to home ("/")
//   • If user is logged in → render whatever route lives inside
//     <Route element={<RequireAuth />}> ... </Route>
//
// Outlet = React Router placeholder for child route content
// ======================================================================
function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Send user back to home (not /login)
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location }} // store where they came from
      />
    );
  }

  return <Outlet />;
}

// ======================================================================
// LAYOUT WRAPPER — contains:
//   • Header (logo + menu)
//   • Flash messages
//   • Page content (Outlet)
//   • Footer
//
// Every single page is rendered INSIDE this component.
// ======================================================================
function Layout() {
  const auth = useAuth();         // access global auth state
  const navigate = useNavigate();
  const location = useLocation();

  const user = auth?.user || null;
  const isAdmin = user?.isAdmin || user?.username === "admin";

  // Logout function exists only if user is logged in
  const hasLogout = typeof auth?.logoutUser === "function";

  const [menuOpen, setMenuOpen] = useState(false);

  // ----------------------------------------------------------------------
  // CLOSE DROPDOWN MENU WHEN CLICKING OUTSIDE
  //
  // We detect clicks anywhere on the page.
  // If it's not inside the menu → close it.
  // ----------------------------------------------------------------------
  useEffect(() => {
    function handleClickOutside(event) {
      const panel = document.querySelector(".nav-dropdown-panel");
      const toggle = document.querySelector(".nav-dropdown-toggle");

      // If menu is open AND click is outside both the toggle + panel → close
      if (
        menuOpen &&
        panel &&
        !panel.contains(event.target) &&
        toggle &&
        !toggle.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // ----------------------------------------------------------------------
  // LOGOUT BUTTON HANDLER
  //
  // 1. Calls logoutUser() from AuthContext
  // 2. Closes dropdown
  // 3. Waits 1 second so the flash message appears
  // 4. Navigates to home
  // ----------------------------------------------------------------------
  function handleLogout() {
    if (hasLogout) {
      auth.logoutUser();
    }

    setMenuOpen(false);

    setTimeout(() => {
      navigate("/");
    }, 1000);
  }

  const path = location.pathname;

  // ======================================================================
  // RENDER LAYOUT
  // ======================================================================
  return (
    <div className="app-shell">

      {/* ================================================================ */}
      {/* HEADER + NAVBAR */}
      {/* ================================================================ */}
      <header className={`app-header ${isAdmin ? "admin-header" : ""}`}>
        <div className="app-header__inner">

          {/* ------------------------ BRAND LEFT SIDE ------------------------ */}
          <div className="brand-block">
            <img
              src={hfgLogo}
              alt="Home Fur Good logo"
              className="brand-logo"
            />
            <div className="brand-text">
              <span className="brand-title">Home Fur Good 2.0</span>
              <span className="brand-subtitle">
                Bringing dogs home, fur good.
              </span>
            </div>
          </div>

          {/* ADMIN BADGE next to logo */}
          {isAdmin && <div className="admin-badge">ADMIN MODE</div>}

          {/* ------------------------ NAVIGATION DROPDOWN ------------------------ */}
          <nav className="nav-links">
            <div className="nav-dropdown-wrapper">

              {/* MENU BUTTON */}
              <button
                type="button"
                className="nav-dropdown-toggle"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                Menu ▾
              </button>

              {/* DROPDOWN PANEL */}
              {menuOpen && (
                <div className="nav-dropdown-panel">

                  {/* =============================== */}
                  {/* NAV OPTIONS: NOT LOGGED IN */}
                  {/* =============================== */}
                  {!user && (
                    <>
                      {path !== "/" && (
                        <Link
                          to="/"
                          className="nav-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          Home
                        </Link>
                      )}

                      <Link
                        to="/login"
                        className="nav-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        Log in
                      </Link>

                      <Link
                        to="/signup"
                        className="nav-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        Sign up
                      </Link>
                    </>
                  )}

                  {/* =============================== */}
                  {/* NAV OPTIONS: LOGGED IN */}
                  {/* =============================== */}
                  {user && (
                    <>
                      {/* User label */}
                      <div className="nav-user-label">
                        Logged in as <strong>{user.username}</strong>
                      </div>

                      {/* ADMIN PANEL LINK */}
                      {isAdmin && path !== "/admin" && (
                        <Link
                          to="/admin"
                          className="nav-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}

                      {/* HOME (logo landing) */}
                      {path !== "/" && (
                        <Link
                          to="/"
                          className="nav-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          Home (Logo)
                        </Link>
                      )}

                      {/* Welcome page (main logged-in homepage) */}
                      {path !== "/welcome" && (
                        <Link
                          to="/welcome"
                          className="nav-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          Welcome
                        </Link>
                      )}

                      {/* Personal About Page */}
                      {path !== "/about" && (
                        <Link
                          to="/about"
                          className="nav-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          About
                        </Link>
                      )}

                      {/* Favorites */}
                      {path !== "/favorites" && (
                        <Link
                          to="/favorites"
                          className="nav-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          My Favorites
                        </Link>
                      )}

                      {/* Profile */}
                      {path !== "/profile" && (
                        <Link
                          to="/profile"
                          className="nav-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          My Profile
                        </Link>
                      )}

                      {/* Search Dogs */}
                      {path !== "/search" && path !== "/results" && (
                        <Link
                          to="/search"
                          className="nav-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          Search Dogs
                        </Link>
                      )}

                      {/* LOGOUT */}
                      <button
                        type="button"
                        className="nav-item nav-item--danger"
                        onClick={() => {
                          handleLogout();
                          setMenuOpen(false);
                        }}
                      >
                        Log out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* FLASH MESSAGES appear below header */}
      <FlashMessages />

      {/* MAIN CONTENT — this is where actual pages render */}
      <main className="app-main">
        <div className="page-container">
          <Outlet />
        </div>
      </main>

      {/* FOOTER */}
      <footer className={`app-footer ${isAdmin ? "admin-footer" : ""}`}>
        <p>
          Powered by{" "}
          <a
            href="https://rescuegroups.org"
            target="_blank"
            rel="noreferrer"
          >
            RescueGroups.org
          </a>{" "}
          • Built by <a href="https://github.com/MegSpell">Meghan</a> •
          Home Fur Good 2.0
        </p>
      </footer>
    </div>
  );
}

// ======================================================================
// ROOT <App /> — Defines the entire route tree
// ======================================================================
export default function App() {
  return (
    <Routes>
      {/* EVERYTHING gets wrapped in <Layout /> */}
      <Route element={<Layout />}>

        {/* ------------------ PUBLIC ROUTES ------------------ */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ------------------ PROTECTED ROUTES ------------------ */}
        <Route element={<RequireAuth />}>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/about" element={<About />} />
          <Route path="/search" element={<Search />} />
          <Route path="/results" element={<SearchResults />} />
          <Route path="/dogs/:id" element={<DogDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/edit/:username" element={<AdminEditUser />} />
        </Route>

        {/* ------------------ FALLBACK 404 ------------------ */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}









// // src/App.jsx
// import { useState, useEffect } from "react";
// import {
//   Routes,
//   Route,
//   Outlet,
//   Link,
//   useNavigate,
//   useLocation,
//   Navigate,
// } from "react-router-dom";
// import { useAuth } from "./context/AuthContext";

// import FlashMessages from "./components/FlashMessages.jsx";

// import hfgLogo from "./assets/HFG2-icon.png";


// // Pages
// import Home from "./pages/Home.jsx";
// import Welcome from "./pages/Welcome.jsx";
// import Search from "./pages/Search.jsx";
// import SearchResults from "./pages/SearchResults.jsx";
// import DogDetail from "./pages/DogDetail.jsx";
// import Login from "./pages/Login.jsx";
// import Signup from "./pages/Signup.jsx";
// import Favorites from "./pages/Favorites.jsx";
// import Admin from "./pages/Admin.jsx";
// import Profile from "./pages/Profile.jsx";
// import AdminEditUser from "./pages/AdminEditUser.jsx"; 
// import About from "./pages/About.jsx";  


// /** About page – this can become your personal story + your dogs */
// // function About() {
// //   return (
// //     <div className="info-card">
// //       <h1>About Home Fur Good 2.0</h1>
// //       <p>
// //         Home Fur Good 2.0 is a demo adoption app built by Meg for the
// //         Springboard Software Engineering Career Track. It helps potential
// //         adopters discover adoptable dogs, save favorites, and give extra
// //         visibility to pups who aren&apos;t getting as many looks.
// //       </p>
// //       <p>
// //         This page is a great place to share why you built the app and highlight
// //         your own rescue dogs who inspired it.
// //       </p>
// //     </div>
// //   );
// // }

// /** Fallback for unknown routes */
// function NotFound() {
//   return (
//     <div className="info-card">
//       <h1>Page not found</h1>
//       <p>The page you requested doesn&apos;t exist.</p>
//       <Link to="/" className="nav-link nav-link--primary">
//         Go home
//       </Link>
//     </div>
//   );
// }

// /** RequireAuth wrapper – protects private routes */
// function RequireAuth() {
//   const { user } = useAuth();
//   const location = useLocation();

//   if (!user) {
//     // Send unauthenticated users to home instead of login
//     return (
//       <Navigate
//         to="/"
//         replace
//         state={{ from: location }}
//       />
//     );
//   }

//   return <Outlet />;
// }

// /** Layout with header/nav/footer around all pages */
// function Layout() {
//   const auth = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const user = auth?.user || null;
//   const isAdmin = user?.isAdmin || user?.username === "admin";

//   const hasLogout = typeof auth?.logoutUser === "function";

//   const [menuOpen, setMenuOpen] = useState(false);

//   // function handleLogout() {
//   //   if (hasLogout) {
//   //     auth.logoutUser();
//   //   }
//   //   navigate("/");
//   // }

// //   function handleLogout() {
// //   if (hasLogout) {
// //     auth.logoutUser();
// //   }
// //   setMenuOpen(false);

// //   // Always go home after logout
// //   window.location.href = "/";
// // }

// // 👉 Close menu when clicking outside the dropdown
//   useEffect(() => {
//     function handleClickOutside(event) {
//       const panel = document.querySelector(".nav-dropdown-panel");
//       const toggle = document.querySelector(".nav-dropdown-toggle");

//       if (
//         menuOpen &&
//         panel &&
//         !panel.contains(event.target) &&
//         toggle &&
//         !toggle.contains(event.target)
//       ) {
//         setMenuOpen(false);
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [menuOpen]);


// function handleLogout() {
//   if (hasLogout) {
//     auth.logoutUser();
//   }

//   setMenuOpen(false);

//   // Allow flash message to show before navigating
//   setTimeout(() => {
//     navigate("/");
//   }, 1000); // adjust to 1200–1500 if you want longer
// }



//   const path = location.pathname;

//   return (
//     <div className="app-shell">
//       {/* HEADER / NAVBAR */}
      
// <header className={`app-header ${isAdmin ? "admin-header" : ""}`}>

//   <div className="app-header__inner">
//     {/* Left: brand logo + text */}
//     <div className="brand-block">
//       <img
//         src={hfgLogo}
//         alt="Home Fur Good logo"
//         className="brand-logo"
//       />
//       <div className="brand-text">
//         <span className="brand-title">Home Fur Good 2.0</span>
//         <span className="brand-subtitle">
//           Bringing dogs home, fur good.
//         </span>
//       </div>
//     </div>

//             {isAdmin && (
//               <div className="admin-badge">
//                 ADMIN MODE
//               </div>
//             )}

//           {/* Right: dropdown nav */}
//           <nav className="nav-links">
//             <div className="nav-dropdown-wrapper">
//               <button
//                 type="button"
//                 className="nav-dropdown-toggle"
//                 onClick={() => setMenuOpen((prev) => !prev)}
//               >
//                 Menu ▾
//               </button>

//               {menuOpen && (
//                 <div className="nav-dropdown-panel">
//                   {/* NOT LOGGED IN */}
//                   {!user && (
//                     <>
//                       {path !== "/" && (
//                         <Link
//                           to="/"
//                           className="nav-item"
//                           onClick={() => setMenuOpen(false)}
//                         >
//                           Home
//                         </Link>
//                       )}

//                       <Link
//                         to="/login"
//                         className="nav-item"
//                         onClick={() => setMenuOpen(false)}
//                       >
//                         Log in
//                       </Link>

//                       <Link
//                         to="/signup"
//                         className="nav-item"
//                         onClick={() => setMenuOpen(false)}
//                       >
//                         Sign up
//                       </Link>
//                     </>
//                   )}

//                   {/* LOGGED IN */}
//                   {user && (
//                     <>
//                       <div className="nav-user-label">
//                         Logged in as <strong>{user.username}</strong>
//                       </div>

//                         {/* ✅ ADMIN LINK – only show for admin user */}
//                       {isAdmin && path !== "/admin" && (
//                         <Link
//                           to="/admin"
//                           className="nav-item"
//                           onClick={() => setMenuOpen(false)}
//                         >
//                           Admin Panel
//                         </Link>
//                       )}


//                       {/* Hero landing (logo) */}
//                       {path !== "/" && (
//                         <Link
//                           to="/"
//                           className="nav-item"
//                           onClick={() => setMenuOpen(false)}
//                         >
//                           Home (Logo)
//                         </Link>
//                       )}

//                       {/* New Welcome page as main logged-in landing */}
//                       {path !== "/welcome" && (
//                         <Link
//                           to="/welcome"
//                           className="nav-item"
//                           onClick={() => setMenuOpen(false)}
//                         >
//                           Welcome
//                         </Link>
//                       )}

//                       {/* About page with your story + dogs */}
//                       {path !== "/about" && (
//                         <Link
//                           to="/about"
//                           className="nav-item"
//                           onClick={() => setMenuOpen(false)}
//                         >
//                           About
//                         </Link>
//                       )}

//                       {path !== "/favorites" && (
//                         <Link
//                           to="/favorites"
//                           className="nav-item"
//                           onClick={() => setMenuOpen(false)}
//                         >
//                           My Favorites
//                         </Link>
//                       )}

//                       {path !== "/profile" && (
//                         <Link
//                           to="/profile"
//                           className="nav-item"
//                           onClick={() => setMenuOpen(false)}
//                         >
//                           My Profile
//                         </Link>
//                       )}


//                       {/* We show "Search" on any page except /search and /results */}
//                       {path !== "/search" && path !== "/results" && (
//                         <Link
//                           to="/search"
//                           className="nav-item"
//                           onClick={() => setMenuOpen(false)}
//                         >
//                           Search Dogs
//                         </Link>
//                       )}

//                       <button
//                         type="button"
//                         className="nav-item nav-item--danger"
//                         onClick={() => {
//                           handleLogout();
//                           setMenuOpen(false);
//                         }}
//                       >
//                         Log out
//                       </button>
//                     </>
//                   )}
//                 </div>
//               )}
//             </div>
//           </nav>
//         </div>
//       </header>

//          <FlashMessages />

//       {/* MAIN CONTENT */}
//       <main className="app-main">
//         <div className="page-container">
//           <Outlet />
//         </div>
//       </main>

//       {/* FOOTER */}
//       <footer className={`app-footer ${isAdmin ? "admin-footer" : ""}`}>

//         <p>
//           Powered by{" "}
//           <a
//             href="https://rescuegroups.org"
//             target="_blank"
//             rel="noreferrer"
//           >
//             RescueGroups.org
//           </a>{" "}
//           • Built by <a href="https://github.com/MegSpell">Meghan</a> • Home Fur Good 2.0
//         </p>
//       </footer>
//     </div>
//   );
// }

// /** Root App component holds the route tree */
// export default function App() {
//   return (
//     <Routes>
//       <Route element={<Layout />}>
//         {/* Public routes */}
//         <Route path="/" element={<Home />} />
        
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<Signup />} />

//         {/* Protected routes: must be logged in */}
//         <Route element={<RequireAuth />}>
//           <Route path="/welcome" element={<Welcome />} />
//           <Route path="/about" element={<About />} />
//           <Route path="/search" element={<Search />} />
//           <Route path="/results" element={<SearchResults />} />
//           <Route path="/dogs/:id" element={<DogDetail />} />
//           <Route path="/favorites" element={<Favorites />} />
//           <Route path="/admin" element={<Admin />} />
//           <Route path="/profile" element={<Profile />} />
//           <Route path="/admin/edit/:username" element={<AdminEditUser />} />



//         </Route>

//         {/* 404 */}
//         <Route path="*" element={<NotFound />} />
//       </Route>
//     </Routes>
//   );
// }
