// src/pages/SearchResults.jsx
// ------------------------------------------------------------
// Search Results Page
//
// This page:
//   - Reads search filters from the URL query string
//   - Calls the backend /dogs search API with those filters
//   - Shows a grid of matching dogs
//   - Lets logged-in users favorite/unfavorite dogs
//   - Keeps the "Filters + Edit search" card sticky at the top
//   - Supports "Load more" to reveal dogs in batches
//
// Flow:
//   1. Read filters from URL via useSearchParams()
//   2. If there's no ZIP in the URL, redirect back to /search
//   3. Whenever filters change, run a new search
//   4. Render cards with heart toggles & "Edit search" button
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { searchDogs, addFavorite, removeFavorite } from "../api";
import { useAuth } from "../context/AuthContext";
import noPhoto from "../assets/no-photo.png";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // From AuthContext: current user + favorites list + setter
  const { user, favorites, setFavorites } = useAuth();

  // Local state for search results + loading + error + "load more"
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(60); // show 60 at a time
  const [error, setError] = useState(null);

  // ------------------------------------------------------------
  // Pull filter values from the URL query string
  //
  // Example URL:
  //   /results?zip=02118&miles=50&sex=Female&isDogsOk=true
  // ------------------------------------------------------------
  const zip = searchParams.get("zip");
  const miles = searchParams.get("miles") || "50";
  const sex = searchParams.get("sex") || "";
  const ageGroup = searchParams.get("ageGroup") || "";
  const sizeGroup = searchParams.get("sizeGroup") || "";

  const isDogsOk = searchParams.get("isDogsOk") === "true";
  const isCatsOk = searchParams.get("isCatsOk") === "true";
  const isKidsOk = searchParams.get("isKidsOk") === "true";
  const isHousetrained = searchParams.get("isHousetrained") === "true";
  const isSpecialNeeds = searchParams.get("isSpecialNeeds") === "true";
  const isNeedingFoster = searchParams.get("isNeedingFoster") === "true";

  // Breeds come in as JSON-encoded array (e.g. ["Beagle","Lab"])
  let breeds = [];
  const breedsParam = searchParams.get("breeds");
  if (breedsParam) {
    try {
      const parsed = JSON.parse(breedsParam);
      if (Array.isArray(parsed)) breeds = parsed;
    } catch (e) {
      console.error("Error parsing breeds param:", e);
    }
  }

  // ------------------------------------------------------------
  // Guard: if someone hits /results directly with no ZIP,
  // send them back to the search form.
  // ------------------------------------------------------------
  useEffect(() => {
    if (!zip) {
      navigate("/search", { replace: true });
    }
  }, [zip, navigate]);

  // ------------------------------------------------------------
  // Perform search whenever filters change.
  //
  // We:
  //   - Reset visibleCount back to 60
  //   - Call searchDogs() with all filters
  //   - Store results in `dogs`
  // ------------------------------------------------------------
  useEffect(() => {
    async function doSearch() {
      if (!zip) return;

      setLoading(true);
      setError(null);
      setVisibleCount(60);

      try {
        const res = await searchDogs({
          zip,
          miles,
          hasPic: true,
          sex: sex || undefined,
          ageGroup: ageGroup || undefined,
          sizeGroup: sizeGroup || undefined,
          isDogsOk: isDogsOk || undefined,
          isCatsOk: isCatsOk || undefined,
          isKidsOk: isKidsOk || undefined,
          isHousetrained: isHousetrained || undefined,
          isSpecialNeeds: isSpecialNeeds || undefined,
          isNeedingFoster: isNeedingFoster || undefined,
          ...(breeds.length > 0 ? { breeds } : {}),
        });

        setDogs(res.dogs || []);
      } catch (err) {
        console.error("Search error:", err);
        setError("Sorry, something went wrong while searching.");
      } finally {
        setLoading(false);
      }
    }

    doSearch();
    // We depend on the *values* above; breeds are re-derived from breedsParam
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zip, miles, sex, ageGroup, sizeGroup, breedsParam]);

  // ------------------------------------------------------------
  // FAVORITE LOGIC
  //
  // We re-use the shared backend routes:
  //   - POST /favorites
  //   - DELETE /favorites
  //
  // The AuthContext `favorites` is a simple array of dog IDs.
  // ------------------------------------------------------------
  function isFav(dogId) {
    return favorites.includes(dogId);
  }

  async function toggleFavorite(evt, dogId) {
    evt.preventDefault();    // don’t follow the <Link>
    evt.stopPropagation();   // don’t trigger card navigation

    // If not logged in, send to login page
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      if (isFav(dogId)) {
        // Remove from favorites
        await removeFavorite(user.username, dogId);
        setFavorites((f) => f.filter((id) => id !== dogId));
      } else {
        // Add to favorites
        await addFavorite(user.username, dogId);
        setFavorites((f) => [...f, dogId]);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  }

  // Only show a slice of dogs based on visibleCount
  const visibleDogs = dogs.slice(0, visibleCount);

  // ------------------------------------------------------------
  // Build a human-readable summary of filters to show in the
  // sticky "Filters" card at the top.
  // ------------------------------------------------------------
  const filterBits = [];
  if (zip) filterBits.push(`ZIP ${zip}`);
  if (miles) filterBits.push(`within ${miles} miles`);
  if (sex) filterBits.push(`Sex: ${sex}`);
  if (ageGroup) filterBits.push(`Age: ${ageGroup}`);
  if (sizeGroup) filterBits.push(`Size: ${sizeGroup}`);
  if (breeds.length > 0) filterBits.push(`${breeds.length} breed(s) selected`);
  if (isDogsOk) filterBits.push("Good with dogs");
  if (isCatsOk) filterBits.push("Good with cats");
  if (isKidsOk) filterBits.push("Good with kids");
  if (isHousetrained) filterBits.push("Housetrained");
  if (isSpecialNeeds) filterBits.push("Special needs");
  if (isNeedingFoster) filterBits.push("Needs foster");

  // Increment how many dogs we’re showing
  function loadMore() {
    setVisibleCount((c) => c + 60);
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="search-page">
      <h2>Search Results</h2>

      {/* Sticky filters summary + back-to-search button */}
      <div className="results-summary search-filters-card">
        <div className="results-summary__filters">
          <strong>Filters:</strong>{" "}
          {filterBits.length > 0 ? filterBits.join(" • ") : "None"}
        </div>
        <div className="results-summary__actions">
          <Link
            to={`/search?${searchParams.toString()}`}
            className="btn-secondary"
          >
            Edit search
          </Link>
        </div>
      </div>

      {loading && <p>Loading dogs…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && visibleDogs.length === 0 && (
        <p>No dogs matched your search. Try adjusting your filters.</p>
      )}

      {/* Dog cards grid */}
      <div className="dog-grid">
        {visibleDogs.map((d) => (
          <Link
            key={d.id}
            to={`/dogs/${d.id}`}
            state={{ from: "results" }}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <article className="dog-card">
              {/* PHOTO with fallback */}
              <img
                src={d.photo || noPhoto}
                alt={d.name}
                className="dog-card__image"
              />

              {/* FAVORITE HEART (top-right corner) */}
              <button
                type="button"
                className={`heart-btn ${isFav(d.id) ? "heart--active" : ""}`}
                onClick={(e) => toggleFavorite(e, d.id)}
                aria-label={
                  isFav(d.id)
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
              >
                {isFav(d.id) ? "❤️" : "🤍"}
              </button>

              {/* TEXT BLOCK */}
              <h3 className="dog-card__name">{d.name}</h3>
              <div className="dog-card__meta">
                {(d.city || "Unknown")}
                {d.state ? `, ${d.state}` : ""} •{" "}
                {d.distance != null
                  ? `${d.distance.toFixed?.(1) ?? d.distance} mi`
                  : "?"}
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* "Load more" button if there are still more dogs to show */}
      {visibleCount < dogs.length && (
        <div className="load-more-wrap">
          <button
            type="button"
            className="load-more-btn"
            onClick={loadMore}
          >
            Load more dogs
          </button>
        </div>
      )}
    </div>
  );
}

