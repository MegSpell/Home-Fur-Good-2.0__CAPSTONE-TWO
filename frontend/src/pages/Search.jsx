// src/pages/Search.jsx
// ------------------------------------------------------------
// Search Page
//
// Lets users build a set of filters to find adoptable dogs:
//
//   - ZIP code + search radius (miles)
//   - Sex, age group, size
//   - Optional multi-breed selection
//   - “Good with” booleans (dogs, cats, kids)
//   - Housetrained, special needs, needs foster
//
// When the form is submitted:
//   - We build a query object (params)
//   - We update the current URL's query string (/search?...)
//   - We navigate to /results with the same query string
//
// We also restore the form state from the URL when the user
// returns from /results, so it feels persistent.
//
// Extra nicety:
//   - If there is NO query string yet, but the logged-in user
//     has a zipcode in their profile, we auto-fill the ZIP field
//     with that value.
// ------------------------------------------------------------

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import MultiBreedDropdown from "../components/MultiBreedDropdown";
import { useAuth } from "../context/AuthContext";

// Simple option lists for dropdowns
const AGE = ["Baby", "Young", "Adult", "Senior"];
const SIZE = ["Small", "Medium", "Large", "X-Large"];
const SEX = ["Male", "Female"];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ----------------------------------------------------------
  // Core search fields
  //
  // ZIP is initialized from the user's profile zipcode if available,
  // otherwise we fall back to "10001".
  // ----------------------------------------------------------
  const [zip, setZip] = useState(() => user?.zipcode || "10001");
  const [miles, setMiles] = useState(50); // search radius

  const [sex, setSex] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [sizeGroup, setSizeGroup] = useState("");

  // ----------------------------------------------------------
  // Multi-breed dropdown state
  //
  // - allBreeds: if true, ignore selectedBreeds and show all breeds
  // - selectedBreeds: array of breed names when user has chosen specifics
  // ----------------------------------------------------------
  const [allBreeds, setAllBreeds] = useState(true);
  const [selectedBreeds, setSelectedBreeds] = useState([]);

  // ----------------------------------------------------------
  // Boolean filters
  // These correspond to RescueGroups boolean flags.
  // ----------------------------------------------------------
  const [isDogsOk, setDogsOk] = useState(false);
  const [isCatsOk, setCatsOk] = useState(false);
  const [isKidsOk, setKidsOk] = useState(false);
  const [isHousetrained, setHousetrained] = useState(false);
  const [isSpecialNeeds, setSpecialNeeds] = useState(false);
  const [isNeedingFoster, setNeedingFoster] = useState(false);

  // ------------------------------------------------------------
  // Restore form values from URL query string on first mount.
  //
  // This makes the search form "sticky" — when the user clicks into
  // results and then comes back, their choices are preserved.
  //
  // Logic:
  //   - If the URL has a `zip` param, we treat the URL as source of truth
  //     and restore all values from it.
  //   - If the URL does NOT have a `zip` and the user has a profile zipcode,
  //     we auto-fill the ZIP field with that.
  // ------------------------------------------------------------
  useEffect(() => {
    const qsZip = searchParams.get("zip");

    if (qsZip) {
      // URL already has filters, so restore from query string.
      const qsMiles = searchParams.get("miles") || "50";
      const qsSex = searchParams.get("sex") || "";
      const qsAge = searchParams.get("ageGroup") || "";
      const qsSize = searchParams.get("sizeGroup") || "";

      const qsDogsOk = searchParams.get("isDogsOk") === "true";
      const qsCatsOk = searchParams.get("isCatsOk") === "true";
      const qsKidsOk = searchParams.get("isKidsOk") === "true";
      const qsHouse = searchParams.get("isHousetrained") === "true";
      const qsSpecial = searchParams.get("isSpecialNeeds") === "true";
      const qsFoster = searchParams.get("isNeedingFoster") === "true";

      const breedsParam = searchParams.get("breeds");

      // Restore core fields
      setZip(qsZip);
      setMiles(qsMiles);
      setSex(qsSex);
      setAgeGroup(qsAge);
      setSizeGroup(qsSize);
      setDogsOk(qsDogsOk);
      setCatsOk(qsCatsOk);
      setKidsOk(qsKidsOk);
      setHousetrained(qsHouse);
      setSpecialNeeds(qsSpecial);
      setNeedingFoster(qsFoster);

      // Restore selected breeds if we find a JSON-encoded list
      if (breedsParam) {
        try {
          const restoredBreeds = JSON.parse(breedsParam);
          if (Array.isArray(restoredBreeds) && restoredBreeds.length > 0) {
            setAllBreeds(false);
            setSelectedBreeds(restoredBreeds);
          }
        } catch (e) {
          console.error("Error parsing breeds from URL", e);
        }
      }
    } else {
      // No zip in URL? If user has a profile zipcode, use that.
      if (user?.zipcode) {
        setZip(user.zipcode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only run once on initial mount

  // ------------------------------------------------------------
  // Handle form submission:
  //
  //   - Build a params object with all filters
  //   - If not in "all breeds" mode, include JSON string of breeds
  //   - Update the /search URL query string
  //   - Navigate to /results?{same params}
  // ------------------------------------------------------------
  function handleSubmit(e) {
    e.preventDefault();

    const params = {
      zip,
      miles,
      sex,
      ageGroup,
      sizeGroup,
      // Boolean values are converted to strings ("true"/"false")
      isDogsOk: String(isDogsOk),
      isCatsOk: String(isCatsOk),
      isKidsOk: String(isKidsOk),
      isHousetrained: String(isHousetrained),
      isSpecialNeeds: String(isSpecialNeeds),
      isNeedingFoster: String(isNeedingFoster),
    };

    // Only send a breed filter if the user has explicitly chosen breeds.
    if (!allBreeds && selectedBreeds.length > 0) {
      params.breeds = JSON.stringify(selectedBreeds);
    }

    // Update URL on /search (so the form is "shareable" and sticky)
    setSearchParams(params);

    // Navigate to /results with the same querystring
    const qs = new URLSearchParams(params).toString();
    navigate(`/results?${qs}`);
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="search-page">
      <h2>Find Adoptable Dogs</h2>

      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-form__grid">
          {/* ZIP / Radius / Sex / Age / Size */}
          <div className="form-group">
            <label>ZIP</label>
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="ZIP"
            />
          </div>

          <div className="form-group">
            <label>Miles</label>
            <input
              type="number"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Sex</label>
            <select value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="">Any</option>
              {SEX.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Age</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
            >
              <option value="">Any</option>
              {AGE.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Size</label>
            <select
              value={sizeGroup}
              onChange={(e) => setSizeGroup(e.target.value)}
            >
              <option value="">Any</option>
              {SIZE.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Breed selector row (full-width) */}
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <MultiBreedDropdown
              allBreeds={allBreeds}
              setAllBreeds={setAllBreeds}
              selectedBreeds={selectedBreeds}
              setSelectedBreeds={setSelectedBreeds}
            />
          </div>

          {/* Boolean filters row (also full-width) */}
          <div className="checkbox-row" style={{ gridColumn: "1 / -1" }}>
            <label>
              <input
                type="checkbox"
                checked={isDogsOk}
                onChange={(e) => setDogsOk(e.target.checked)}
              />{" "}
              Good with dogs
            </label>

            <label>
              <input
                type="checkbox"
                checked={isCatsOk}
                onChange={(e) => setCatsOk(e.target.checked)}
              />{" "}
              Good with cats
            </label>

            <label>
              <input
                type="checkbox"
                checked={isKidsOk}
                onChange={(e) => setKidsOk(e.target.checked)}
              />{" "}
              Good with kids
            </label>

            <label>
              <input
                type="checkbox"
                checked={isHousetrained}
                onChange={(e) => setHousetrained(e.target.checked)}
              />{" "}
              Housetrained
            </label>

            <label>
              <input
                type="checkbox"
                checked={isSpecialNeeds}
                onChange={(e) => setSpecialNeeds(e.target.checked)}
              />{" "}
              Special needs
            </label>

            <label>
              <input
                type="checkbox"
                checked={isNeedingFoster}
                onChange={(e) => setNeedingFoster(e.target.checked)}
              />{" "}
              Needs foster
            </label>
          </div>
        </div>

        {/* Submit button */}
        <div style={{ marginTop: 12 }}>
          <button type="submit">Search</button>
        </div>
      </form>
    </div>
  );
}

