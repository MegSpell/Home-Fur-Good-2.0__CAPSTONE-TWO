// src/pages/Welcome.jsx
// ------------------------------------------------------------
// Welcome Page
//
// This is the main landing page for logged-in users.
//
// It does two big things:
//   1. Shows a friendly welcome card with a CTA to start searching.
//   2. Shows a "Dogs in Need Spotlight" section that highlights dogs
//      with the fewest favorites:
//
//      - If the user *has* a zipcode:
//          -> we search dogs near their zipcode
//          -> we overlay global favorite counts
//          -> we sort by favorites ascending and show the 3 lowest
//
//      - If the user *does NOT* have a zipcode:
//          -> we look at global favorite counts only
//          -> we fetch those specific dogs by ID
//          -> again, we show the 3 lowest
//
// The idea is to give under-loved pups a little extra visibility 💚
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchDogs, getDog, getFavoriteCountsPublic } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Welcome() {
  const { user } = useAuth();

  // Spotlight dogs to render (each is a dog object + favoriteCount)
  const [spotlightDogs, setSpotlightDogs] = useState([]);

  // Convenient boolean: does this user have a zipcode stored?
  const hasZip = Boolean(user?.zipcode);

  // ------------------------------------------------------------
  // Load spotlight dogs whenever zipcode-related info changes
  //
  // NOTE: We branch into two paths:
  //   - With zipcode: "least-favorited near you"
  //   - Without zipcode: global "least-favorited" overall
  // ------------------------------------------------------------
  useEffect(() => {
    async function loadSpotlight() {
      try {
        // ===== CASE 1: User has zipcode -> "least-favorited near you" =====
        if (hasZip) {
          // We fetch:
          //   - `results` = list of dogs near the user's zipcode
          //   - `counts`  = global favorite counts, keyed by dogId
          const [results, counts] = await Promise.all([
            searchDogs({
              zip: user.zipcode,
              miles: 50,
              hasPic: true,
            }),
            getFavoriteCountsPublic(), // shape: { [dogId]: count }
          ]);

          const dogs = results.dogs || [];

          // Attach favoriteCount to each dog in the local search results.
          const withCounts = dogs.map((d) => ({
            ...d,
            favoriteCount: counts[d.id] || 0,
          }));

          // Dogs with fewer favorites first (0 at the top).
          withCounts.sort((a, b) => a.favoriteCount - b.favoriteCount);

          // Take the top 3 least-favorited dogs near the user.
          setSpotlightDogs(withCounts.slice(0, 3));
          return;
        }

        // ===== CASE 2: No zipcode -> global "least favorited" =====

        // We only have counts here, not a local search result.
        const counts = await getFavoriteCountsPublic(); // { [dogId]: count }

        // If nothing has been favorited yet, there is nothing to spotlight.
        const entries = Object.entries(counts); // [ [dogId, count], ... ]
        if (entries.length === 0) {
          setSpotlightDogs([]);
          return;
        }

        // Sort globally by ascending favorite count.
        entries.sort((a, b) => a[1] - b[1]);

        // Take the 3 least-favorited dog IDs.
        const top = entries.slice(0, 3);
        const dogs = [];

        // For each, fetch the full dog details, then attach favoriteCount.
        for (let [dogId, count] of top) {
          const dog = await getDog(dogId);
          dogs.push({
            ...dog,
            favoriteCount: count,
          });
        }

        setSpotlightDogs(dogs);
      } catch (err) {
        console.error("Error loading spotlight dogs:", err);
        // Fail-safe: if something goes wrong, just render no spotlight
        setSpotlightDogs([]);
      }
    }

    loadSpotlight();
  }, [hasZip, user?.zipcode]);

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="welcome-page">
      {/* ===== WELCOME CARD ===== */}
      <div className="welcome-hero">
        <div className="welcome-card">
          <div className="welcome-card-main">
            <h1>Welcome to HOME FUR GOOD, {user?.username}!</h1>
            <p>
              Discover adoptable dogs, save your favorites, and potentially
              give a pup in need their FURever home! Let&apos;s get started!
            </p>

            <Link to="/search" className="btn-primary">
              Search Dogs
            </Link>
          </div>
        </div>
      </div>

      {/* ===== SPOTLIGHT SECTION ===== */}
      {spotlightDogs.length > 0 && (
        <section className="spotlight-section">
          <div className="spotlight-card-wrapper">
            <h2 className="spotlight-title">Dogs in Need Spotlight</h2>
            <p className="spotlight-subtitle">
              {hasZip
                ? "These are some of the least-favorited dogs near your area. Maybe one of them is your next best friend! Just look at those faces!"
                : "These pups haven’t been favorited much yet across the app, so we wanted to spotlight them and give them a little extra boost at finding their FURever home. Please consider adopting one of these adorable dogs."}
            </p>

            <div className="spotlight-grid">
              {spotlightDogs.map((dog) => (
                <Link
                  key={dog.id}
                  to={`/dogs/${dog.id}`}
                  state={{ from: "welcome" }} // lets DogDetail know where we came from
                  className="spotlight-card"
                >
                  {dog.photo && (
                    <img
                      src={dog.photo}
                      alt={dog.name}
                      className="spotlight-card-image"
                    />
                  )}

                  <div className="spotlight-card-body">
                    <h3 className="spotlight-card-name">{dog.name}</h3>

                    <p className="spotlight-card-meta">
                      {dog.city || "Unknown"}
                      {dog.state ? `, ${dog.state}` : ""}
                      {dog.favoriteCount != null && (
                        <>
                          {" • "}
                          <span>
                            {dog.favoriteCount} favorite
                            {dog.favoriteCount === 1 ? "" : "s"}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
