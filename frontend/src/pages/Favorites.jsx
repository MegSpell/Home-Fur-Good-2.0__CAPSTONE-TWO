// src/pages/Favorites.jsx
// ------------------------------------------------------------
// Favorites Page
//
// Shows all dogs that the currently logged-in user has marked
// as favorites.
//
// Flow:
//   - Read the list of favorite dog IDs from AuthContext
//   - For each ID, fetch full dog details from the backend
//   - Display cards very similar to the search results grid
//   - Let user un-favorite dogs directly from this page
//
// Notes:
//   - If the user removes a favorite here, we update BOTH:
//       1) The global favorites in context
//       2) The local dogs[] list so the card disappears
//   - The "smart back" behavior on DogDetail uses
//     state={{ from: "favorites" }} passed into the Link.
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDog, addFavorite, removeFavorite } from "../api";

export default function Favorites() {
  const navigate = useNavigate();

  // From AuthContext:
  //   user        -> logged-in user object
  //   favorites   -> array of favorited dog IDs (strings)
  //   setFavorites-> setter so we can keep global favorites in sync
  const { user, favorites, setFavorites } = useAuth();

  // Local state for the *full dog objects* that correspond to favorites
  const [dogs, setDogs] = useState([]);

  // Loading/error state for fetching the full dog data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simple helper: is a given dog ID currently in favorites?
  function isFav(dogId) {
    return favorites.includes(dogId);
  }

  // ------------------------------------------------------------
  // Load full details for each favorite dog.
  //
  // We:
  //   - Watch for changes in `user` or `favorites`
  //   - If no user or no favorites -> clear dog list
  //   - Else -> fetch each dog's details with getDog(id)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!user) return; // route is protected at a higher level, but safe check

    if (!favorites || favorites.length === 0) {
      setDogs([]);
      return;
    }

    async function loadDogs() {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          favorites.map(async (id) => {
            try {
              // Fetch details for each dog ID.
              return await getDog(id);
            } catch (err) {
              console.error("Failed to load dog", id, err);
              // If one fails, we return null so we can filter it out.
              return null;
            }
          })
        );

        // Filter out any null values (failed loads)
        setDogs(results.filter(Boolean));
      } catch (err) {
        console.error("Error loading favorite dogs:", err);
        setError("Could not load your favorite dogs.");
      } finally {
        setLoading(false);
      }
    }

    loadDogs();
  }, [user, favorites]);

  // ------------------------------------------------------------
  // Toggle favorite (heart button in the favorites grid)
  //
  // - If user is not logged in, send them to login.
  // - If dog is currently a favorite:
  //     -> remove from backend
  //     -> update global favorites list
  //     -> also remove the dog card from local "dogs" state
  // - If dog is NOT currently a favorite (edge case):
  //     -> add to backend + update global favorites
  // ------------------------------------------------------------
  async function toggleFavorite(evt, dogId) {
    evt.preventDefault();
    evt.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      if (isFav(dogId)) {
        // Remove from favorites
        await removeFavorite(user.username, dogId);

        // Update global favorites in context
        setFavorites((f) => f.filter((id) => id !== dogId));

        // Remove this dog from the current page's list of dogs
        setDogs((ds) => ds.filter((d) => d.id !== dogId));
      } else {
        // Rare case: Add from here if not already in favorites.
        await addFavorite(user.username, dogId);
        setFavorites((f) => [...f, dogId]);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="search-page">
      <h2>My Favorite Dogs</h2>

      {loading && <p>Loading your favorites…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Empty state: no favorites to show */}
      {!loading && dogs.length === 0 && (
        <p>
          You haven&apos;t favorited any dogs yet.{" "}
          <Link to="/search">Start a search</Link> to find your new best friend!
        </p>
      )}

      {/* Grid of favorite dogs */}
      {dogs.length > 0 && (
        <div className="dog-grid">
          {dogs.map((d) => (
            <Link
              key={d.id}
              to={`/dogs/${d.id}`}
              state={{ from: "favorites" }} // used by DogDetail smart back button
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <article className="dog-card">
                {/* Dog photo */}
                {d.photo && (
                  <img
                    src={d.photo}
                    alt={d.name}
                    className="dog-card__image"
                  />
                )}

                {/* Heart icon for toggling favorite */}
                <button
                  type="button"
                  className={`heart-btn ${
                    isFav(d.id) ? "heart--active" : ""
                  }`}
                  onClick={(e) => toggleFavorite(e, d.id)}
                  aria-label={
                    isFav(d.id)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  {isFav(d.id) ? "❤️" : "🤍"}
                </button>

                {/* Dog name + location */}
                <h3 className="dog-card__name">{d.name}</h3>
                <div className="dog-card__meta">
                  {d.city || "Unknown"}
                  {d.state ? `, ${d.state}` : ""}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
