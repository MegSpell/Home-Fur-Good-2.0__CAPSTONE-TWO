// src/components/MultiBreedDropdown.jsx
// ------------------------------------------------------------
// MultiBreedDropdown
//
// This component lets the user:
//
//   - Choose "all breeds" (no filter)
//   - OR search and pick specific dog breeds from a scrollable list
//   - See selected breeds displayed as "pills" underneath
//
// It pulls the official list of breeds from the backend via `getBreeds()`
// and then uses local state + search to filter / select them.
//
// Props:
//   - allBreeds (boolean)
//       true  -> "Show all breeds" mode (no specific filters)
//       false -> user is selecting specific breeds
//
//   - setAllBreeds (fn)
//       Setter for allBreeds (lives in parent component)
//
//   - selectedBreeds (array of strings)
//       Example: ["Beagle", "Golden Retriever"]
//
//   - setSelectedBreeds (fn)
//       Setter for selectedBreeds (lives in parent component)
// ------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { getBreeds } from "../api";

export default function MultiBreedDropdown({
  allBreeds,
  setAllBreeds,
  selectedBreeds,
  setSelectedBreeds,
}) {
  // List of all possible breeds from the backend
  const [breeds, setBreeds] = useState([]);

  // The text in the search input used to filter the list
  const [search, setSearch] = useState("");

  // Simple loading flag while we fetch the breeds from the server
  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------------
  // Load all dog breeds once (on mount)
  // ------------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // getBreeds() should return an array of breed names like:
        // ["Beagle", "Labrador Retriever", ...]
        const result = await getBreeds();
        setBreeds(result || []);
      } catch (err) {
        // In a real app, you might show a flash message.
        console.error("Error loading breeds:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // ------------------------------------------------------------
  // Filter breeds based on the search text
  //
  // useMemo is used so we only recompute the filtered list when
  // `breeds` or `search` change, instead of on every single render.
  // ------------------------------------------------------------
  const filteredBreeds = useMemo(() => {
    const term = search.trim().toLowerCase();

    // If there's no search term, show the full list.
    if (!term) return breeds;

    // Otherwise, only include breeds whose name contains the term.
    return breeds.filter((b) => b.toLowerCase().includes(term));
  }, [breeds, search]);

  const selectedCount = selectedBreeds.length;

  // "Custom selection" = user has turned off "all breeds" and
  // has actually chosen at least one specific breed.
  const hasCustomSelection = !allBreeds && selectedCount > 0;

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------

  // Handle toggling the "All Breeds" checkbox.
  function handleAllToggle(evt) {
    const checked = evt.target.checked;

    if (checked) {
      // If user checks "All breeds":
      //   - turn on allBreeds
      //   - clear any previously selected specific breeds
      setAllBreeds(true);
      setSelectedBreeds([]);
    } else {
      // If user unchecks it:
      //   - just turn off allBreeds
      //   - they can now start picking specific breeds
      setAllBreeds(false);
    }
  }

  // Handle selecting/unselecting a specific breed from the list.
  function handleToggleBreed(breedName) {
    // As soon as the user starts picking specific breeds,
    // we automatically turn off "all breeds".
    if (allBreeds) setAllBreeds(false);

    if (selectedBreeds.includes(breedName)) {
      // If the breed is already selected, remove it.
      setSelectedBreeds(selectedBreeds.filter((b) => b !== breedName));
    } else {
      // Otherwise, add it to the list.
      setSelectedBreeds([...selectedBreeds, breedName]);
    }
  }

  // Track changes in the search input.
  function handleSearchChange(evt) {
    setSearch(evt.target.value);
  }

  // Remove a single breed from the "pill" list under the dropdown.
  function removeBreed(breedName) {
    const updated = selectedBreeds.filter((b) => b !== breedName);
    setSelectedBreeds(updated);
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="breed-dropdown">
      {/* Label + hint at the top */}
      <div className="breed-dropdown__top-row">
        <div className="breed-dropdown__label-block">
          <span className="breed-dropdown__label">Breed(s)</span>
          <span className="breed-dropdown__hint">
            Filter by dog breed, or show all.
          </span>
        </div>
      </div>

      {/* Main panel (card with checkbox, search box, and scrollable list) */}
      <div className="breed-dropdown__panel">
        {/* "All breeds" checkbox */}
        <label className="breed-dropdown__all-row">
          <input
            type="checkbox"
            checked={allBreeds && selectedCount === 0}
            onChange={handleAllToggle}
          />
          <span>
            Select this to SHOW ALL BREEDS (or choose from the list below)
          </span>
        </label>

        <br />

        {/* Search box for filtering breeds */}
        <div className="breed-dropdown__search-row">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Type to filter dog breeds…"
            className="breed-dropdown__search-input"
          />
        </div>

        {/* Scrollable list of all filtered breeds with checkboxes */}
        <div className="breed-dropdown__list">
          {filteredBreeds.map((b) => {
            const checked = selectedBreeds.includes(b);
            return (
              <label key={b} className="breed-dropdown__option">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleBreed(b)}
                />
                <span>{b}</span>
              </label>
            );
          })}

          {/* If finished loading and no breeds match the search term, show a message */}
          {!loading && filteredBreeds.length === 0 && (
            <div className="breed-dropdown__empty">
              No breeds match “{search}”.
            </div>
          )}
        </div>
      </div>

      {/* Selected breeds shown underneath as pill-style chips */}
      {hasCustomSelection && (
        <div className="breed-selected-list">
          <span className="breed-selected-list__label">Selected breeds:</span>

          <div className="breed-selected-list__pills">
            {selectedBreeds.map((b) => (
              <span key={b} className="breed-pill">
                <span>{b}</span>
                <button
                  type="button"
                  onClick={() => removeBreed(b)}
                  aria-label={`Remove ${b}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}








// ====== before comments =========
// // src/components/MultiBreedDropdown.jsx
// import { useEffect, useMemo, useState } from "react";
// import { getBreeds } from "../api";

// /**
//  * MultiBreedDropdown – always-visible, scrollable list
//  *
//  * Props:
//  * - allBreeds (bool)
//  * - setAllBreeds (fn)
//  * - selectedBreeds (array of strings)
//  * - setSelectedBreeds (fn)
//  */
// export default function MultiBreedDropdown({
//   allBreeds,
//   setAllBreeds,
//   selectedBreeds,
//   setSelectedBreeds,
// }) {
//   const [breeds, setBreeds] = useState([]);
//   const [search, setSearch] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Load all dog breeds once
//   useEffect(() => {
//     async function load() {
//       try {
//         setLoading(true);
//         const result = await getBreeds(); // array of breed names
//         setBreeds(result || []);
//       } catch (err) {
//         console.error("Error loading breeds:", err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   // Filter breeds based on the search text
//   const filteredBreeds = useMemo(() => {
//     const term = search.trim().toLowerCase();
//     if (!term) return breeds;
//     return breeds.filter((b) => b.toLowerCase().includes(term));
//   }, [breeds, search]);

//   const selectedCount = selectedBreeds.length;
//   const hasCustomSelection = !allBreeds && selectedCount > 0;

//   function handleAllToggle(evt) {
//     const checked = evt.target.checked;
//     if (checked) {
//       // “All breeds” mode: clear custom selections
//       setAllBreeds(true);
//       setSelectedBreeds([]);
//     } else {
//       // Turn off “All breeds”, allow custom selection
//       setAllBreeds(false);
//     }
//   }

//   function handleToggleBreed(breedName) {
//     // As soon as you start picking specific breeds, turn off “all breeds”
//     if (allBreeds) setAllBreeds(false);

//     if (selectedBreeds.includes(breedName)) {
//       setSelectedBreeds(selectedBreeds.filter((b) => b !== breedName));
//     } else {
//       setSelectedBreeds([...selectedBreeds, breedName]);
//     }
//   }

//   function handleSearchChange(evt) {
//     setSearch(evt.target.value);
//   }

//   function removeBreed(breedName) {
//     const updated = selectedBreeds.filter((b) => b !== breedName);
//     setSelectedBreeds(updated);
//   }

//   return (
//     <div className="breed-dropdown">
//       {/* Label + hint */}
//       <div className="breed-dropdown__top-row">
//         <div className="breed-dropdown__label-block">
//           <span className="breed-dropdown__label">Breed(s)</span>
//           <span className="breed-dropdown__hint">
//             Filter by dog breed, or show all.
//           </span>
//         </div>
//       </div>

//       {/* Panel card */}
//       <div className="breed-dropdown__panel">
//         {/* All-breeds checkbox (square, under label) */}
//         <label className="breed-dropdown__all-row">
//           <input
//             type="checkbox"
//             checked={allBreeds && selectedCount === 0}
//             onChange={handleAllToggle}
//           />
//           <span>Select this to SHOW ALL BREEDS (OR chose from the list below)</span>
//         </label>
//         <br></br>

//         {/* Search box */}
//         <div className="breed-dropdown__search-row">
//           <input
//             type="text"
//             value={search}
//             onChange={handleSearchChange}
//             placeholder="Type to filter dog breeds…"
//             className="breed-dropdown__search-input"
//           />
//         </div>

//         {/* Scrollable list of breeds */}
//         <div className="breed-dropdown__list">
//           {filteredBreeds.map((b) => {
//             const checked = selectedBreeds.includes(b);
//             return (
//               <label key={b} className="breed-dropdown__option">
//                 <input
//                   type="checkbox"
//                   checked={checked}
//                   onChange={() => handleToggleBreed(b)}
//                 />
//                 <span>{b}</span>
//               </label>
//             );
//           })}

//           {!loading && filteredBreeds.length === 0 && (
//             <div className="breed-dropdown__empty">
//               No breeds match “{search}”.
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Selected breeds shown underneath as pills */}
//       {hasCustomSelection && (
//         <div className="breed-selected-list">
//           <span className="breed-selected-list__label">Selected breeds:</span>
//           <div className="breed-selected-list__pills">
//             {selectedBreeds.map((b) => (
//               <span key={b} className="breed-pill">
//                 <span>{b}</span>
//                 <button
//                   type="button"
//                   onClick={() => removeBreed(b)}
//                   aria-label={`Remove ${b}`}
//                 >
//                   ✕
//                 </button>
//               </span>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
