// src/pages/Home.jsx
// ------------------------------------------------------------
// Home (Landing Page)
//
// This is the first page users see when they visit the site.
//
// Behavior:
//   - Shows the Home Fur Good logo large and centered
//   - If the user is NOT logged in → show Login + Signup buttons
//   - If the user IS logged in → show a single button taking
//     them straight to the dog search page
//
// Styling for layout and colors lives entirely in CSS so this
// component stays small and focused.
// ------------------------------------------------------------

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/HFG2-logo.png";

export default function Home() {
  // Pull user from AuthContext.
  // currentUser is kept for backwards compatibility from earlier versions.
  const { user, currentUser } = useAuth();
  const activeUser = user || currentUser || null;

  return (
    <div className="home-page">
      <section className="home-hero">
        {/* Logo Section */}
        <div className="home-logo-wrapper">
          <img
            src={logo}
            alt="Home Fur Good 2.0 logo"
            className="home-logo-main"
          />
        </div>

        {/* CTA (Call to Action) Buttons */}
        <div className="home-cta">
          {!activeUser ? (
            // If not logged in → show Log in + Sign up
            <>
              <Link to="/login" className="home-cta__primary">
                Log in
              </Link>

              <Link to="/signup" className="home-cta__secondary">
                Sign up
              </Link>
            </>
          ) : (
            // If logged in → begin search right away
            <Link to="/search" className="home-cta__primary">
              Start searching dogs
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

