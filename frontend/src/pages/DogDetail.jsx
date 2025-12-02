// src/pages/DogDetail.jsx
// ------------------------------------------------------------
// DogDetail Page
//
// This page shows full details for a single dog, including:
//
//   • A large main photo + clickable thumbnails
//   • Name, location, breed, age, sex, size, good-with info
//   • Favorite/unfavorite heart button
//   • Link to the rescue's listing
//
// It also supports a “smart back button” so the user is returned to
// the correct page (welcome, search results, favorites).
//
// Data is loaded from the backend via getDog(id), which resolves
// to a single RescueGroups-formatted dog object.
// ------------------------------------------------------------

import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getDog, addFavorite, removeFavorite } from "../api";
import { useAuth } from "../context/AuthContext";
import noPhoto from "../assets/no-photo.png";

/**
 * Small helper: take a plain text description string and
 * turn any URLs inside it into clickable <a> links.
 *
 * Example strings it will detect:
 *   - "https://www.myrescue.org/apply"
 *   - "http://myrescue.org"
 *   - "www.myrescue.org"
 *
 * Everything else stays as plain text.
 */
function linkifyDescription(text) {
  if (!text) return null;

  // Regex looks for:
  //   - http:// or https:// followed by non-space characters
  //   - OR bare "www." followed by non-space characters
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

  // Split the whole description into pieces:
  //   ["Some text ", "https://foo.com", " more text", "www.bar.org", ...]
  const parts = text.split(urlRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // New regex WITHOUT the global 'g', so .test() works cleanly
    const isUrl = /^(https?:\/\/[^\s]+|www\.[^\s]+)/i.test(part);

    if (!isUrl) {
      // Normal text → just return as a <span>
      return <span key={idx}>{part}</span>;
    }

    // If the part *is* a URL, make sure it has a protocol
    let href = part;
    if (href.toLowerCase().startsWith("www.")) {
      href = `https://${href}`;
    }

    return (
      <a
        key={idx}
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: "underline" }}
      >
        {part}
      </a>
    );
  });
}

export default function DogDetail() {
  // Grab the dog ID from the URL: /dogs/:id
  const { id } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  // From AuthContext: current user + favorites list + setter
  const { user, favorites, setFavorites } = useAuth();

  // Local state
  const [dog, setDog] = useState(null);       // full dog object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Image gallery: which image is shown as the main one
  const [mainPhoto, setMainPhoto] = useState(null);

  // Used to control the smart back button:
  // - "welcome"
  // - "results"
  // - "favorites"
  // - null (unknown)
  const from = location.state?.from || null;

  // ------------------------------------------------------------
  // Load this dog's data from the backend when the ID changes.
  // ------------------------------------------------------------
  useEffect(() => {
    async function fetchDog() {
      try {
        setLoading(true);
        setError(null);

        const data = await getDog(id);
        setDog(data);

        // Decide which photo to show as the large main one
        if (data?.photos && data.photos.length > 0) {
          setMainPhoto(data.photos[0]);
        } else if (data?.photo) {
          setMainPhoto(data.photo);
        } else {
          setMainPhoto(noPhoto);
        }
      } catch (err) {
        console.error("Error fetching dog:", err);
        setError("Could not load dog details.");
      } finally {
        setLoading(false);
      }
    }

    fetchDog();
  }, [id]);

  // ------------------------------------------------------------
  // Basic loading/error states
  // ------------------------------------------------------------
  if (loading) return <p>Loading dog…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!dog) return <p>Dog not found.</p>;

  // ------------------------------------------------------------
  // DESCRIPTION HANDLING
  // RG may send:
  //   - descriptionText (clean text)
  //   - OR descriptionHtml (HTML string)
  // Fallback: strip HTML tags to plain text.
  // ------------------------------------------------------------
  let description = dog.descriptionText;
  if (!description && dog.descriptionHtml) {
    description = dog.descriptionHtml.replace(/<[^>]+>/g, "");
  }

  // ------------------------------------------------------------
  // FAVORITE HANDLING
  // ------------------------------------------------------------
  function isFav(dogId) {
    return favorites.includes(dogId);
  }

  async function toggleFavorite(evt, dogId) {
    evt.preventDefault();   // prevent Link navigation
    evt.stopPropagation();  // ensure only the heart button reacts

    // If not logged in → send to login page
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

  // ------------------------------------------------------------
  // SMART BACK BUTTON
  // Determines where the user should return:
  //   - From welcome spotlight → back to /welcome
  //   - From favorites page → /favorites
  //   - From search results → navigate(-1)
  //   - Otherwise → fallback navigate(-1)
  // ------------------------------------------------------------
  function handleBack() {
    if (from === "welcome") {
      navigate("/welcome");
    } else if (from === "favorites") {
      navigate("/favorites");
    } else if (from === "results") {
      navigate(-1);
    } else {
      navigate(-1);
    }
  }

  const backLabel =
    from === "welcome"
      ? "← Back to welcome"
      : from === "favorites"
      ? "← Back to favorites"
      : "← Back to search results";

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <main className="dog-detail">
      {/* BACK BUTTON */}
      <div className="dog-detail__back">
        <button type="button" className="btn-secondary" onClick={handleBack}>
          {backLabel}
        </button>
      </div>

      <section className="dog-detail__layout">
        {/* ========================================================
            LEFT SIDE: IMAGE GALLERY
        ======================================================== */}
        <div className="dog-detail__media">
          {/* Main image */}
          <img
            src={mainPhoto || noPhoto}
            alt={dog.name}
            className="dog-detail__main-image"
          />

          {/* Thumbnail list */}
          {dog.photos && dog.photos.length > 1 && (
            <div className="dog-detail__thumbs">
              {dog.photos.map((p, idx) => (
                <img
                  key={idx}
                  src={p || noPhoto}
                  alt={`${dog.name} ${idx + 1}`}
                  onClick={() => setMainPhoto(p || noPhoto)}
                  className={
                    "dog-detail__thumb" +
                    ((p || noPhoto) === mainPhoto
                      ? " dog-detail__thumb--active"
                      : "")
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* ========================================================
            RIGHT SIDE: DOG INFORMATION CARD
        ======================================================== */}
        <div className="dog-detail__info-card">
          {/* Name + favorite heart */}
          <div className="dog-detail__name-row">
            <h2 className="dog-detail__name">{dog.name || "Unknown name"}</h2>

            <button
              type="button"
              className={`dog-detail-heart ${isFav(dog.id) ? "active" : ""}`}
              onClick={(e) => toggleFavorite(e, dog.id)}
              aria-label={
                isFav(dog.id)
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
            >
              {isFav(dog.id) ? "❤️" : "🤍"}
            </button>
          </div>

          {/* Location */}
          <p className="dog-detail__location">
            {(dog.city || "Unknown city") + (dog.state ? `, ${dog.state}` : "")}
          </p>

          {/* Quick stats */}
          <div className="dog-detail__quickstats">
            <div>
              <strong>Age:</strong> {dog.ageGroup || "Unknown"}
            </div>
            <div>
              <strong>Sex:</strong> {dog.sex || "Unknown"}
            </div>
            <div>
              <strong>Size:</strong> {dog.sizeGroup || "Unknown"}
            </div>
            <div>
              <strong>Breed:</strong>{" "}
              {dog.breedString || "Breed information not available"}
            </div>
            {dog.distance != null && (
              <div>
                <strong>Approx. distance:</strong>{" "}
                {dog.distance.toFixed?.(1) ?? dog.distance} mi
              </div>
            )}
          </div>

          {/* “Good with …” pills */}
          <div className="dog-detail__pills">
            {dog.isDogsOk && <span className="pill pill--ok">Good with dogs</span>}
            {dog.isCatsOk && <span className="pill pill--ok">Good with cats</span>}
            {dog.isKidsOk && <span className="pill pill--ok">Good with kids</span>}
            {dog.isHousetrained && (
              <span className="pill pill--ok">Housetrained</span>
            )}
            {dog.isSpecialNeeds && (
              <span className="pill pill--alert">Special needs</span>
            )}
            {dog.isNeedingFoster && (
              <span className="pill pill--alert">Needs foster</span>
            )}
          </div>

          {/* Description text (with linkified URLs) */}
          {description && (
            <div className="dog-detail__description">
              {linkifyDescription(description)}
            </div>
          )}

          {/* EXTERNAL LINK TO RESCUE LISTING (existing behavior) */}
          <div className="dog-detail__external">
            {dog.url ? (
              <>
                <a
                  href={dog.url}
                  target="_blank"
                  rel="noreferrer"
                  className="dog-detail__external-btn"
                >
                  View &amp; Apply on Rescue Website
                </a>
                <p className="dog-detail__external-hint">
                  You’ll be taken to the rescue’s website for the most
                  up-to-date info and adoption details.
                </p>
              </>
            ) : (
              <>
                <a
                  href="https://www.rescuegroups.org"
                  target="_blank"
                  rel="noreferrer"
                  className="dog-detail__external-btn"
                >
                  View Rescue Website
                </a>
                <p className="dog-detail__external-hint">
                  No direct listing found — If the description lists a rescue website, use that link for the most accurate info...otherwise this button will take you to RescueGroups.org
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}










// // src/pages/DogDetail.jsx
// // ------------------------------------------------------------
// // DogDetail Page
// //
// // This page shows full details for a single dog, including:
// //
// //   • A large main photo + clickable thumbnails
// //   • Name, location, breed, age, sex, size, good-with info
// //   • Favorite/unfavorite heart button
// //   • Link to the rescue's listing
// //
// // It also supports a “smart back button” so the user is returned to
// // the correct page (welcome, search results, favorites).
// //
// // Data is loaded from the backend via getDog(id), which resolves
// // to a single RescueGroups-formatted dog object.
// // ------------------------------------------------------------

// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { getDog, addFavorite, removeFavorite } from "../api";
// import { useAuth } from "../context/AuthContext";
// import noPhoto from "../assets/no-photo.png";

// export default function DogDetail() {
//   // Grab the dog ID from the URL: /dogs/:id
//   const { id } = useParams();

//   const navigate = useNavigate();
//   const location = useLocation();

//   // From AuthContext: current user + favorites list + setter
//   const { user, favorites, setFavorites } = useAuth();

//   // Local state
//   const [dog, setDog] = useState(null);       // full dog object
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Image gallery: which image is shown as the main one
//   const [mainPhoto, setMainPhoto] = useState(null);

//   // Used to control the smart back button:
//   // - "welcome"
//   // - "results"
//   // - "favorites"
//   // - null (unknown)
//   const from = location.state?.from || null;

//   // ------------------------------------------------------------
//   // Load this dog's data from the backend when the ID changes.
//   // ------------------------------------------------------------
//   useEffect(() => {
//     async function fetchDog() {
//       try {
//         setLoading(true);
//         setError(null);

//         const data = await getDog(id);
//         setDog(data);

//         // Decide which photo to show as the large main one
//         if (data?.photos && data.photos.length > 0) {
//           setMainPhoto(data.photos[0]);
//         } else if (data?.photo) {
//           setMainPhoto(data.photo);
//         } else {
//           setMainPhoto(noPhoto);
//         }
//       } catch (err) {
//         console.error("Error fetching dog:", err);
//         setError("Could not load dog details.");
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchDog();
//   }, [id]);

//   // ------------------------------------------------------------
//   // Basic loading/error states
//   // ------------------------------------------------------------
//   if (loading) return <p>Loading dog…</p>;
//   if (error) return <p style={{ color: "red" }}>{error}</p>;
//   if (!dog) return <p>Dog not found.</p>;

//   // ------------------------------------------------------------
//   // DESCRIPTION HANDLING
//   // RG may send:
//   //   - descriptionText (clean text)
//   //   - OR descriptionHtml (HTML string)
//   // Fallback: strip HTML tags to plain text.
//   // ------------------------------------------------------------
//   let description = dog.descriptionText;
//   if (!description && dog.descriptionHtml) {
//     description = dog.descriptionHtml.replace(/<[^>]+>/g, "");
//   }

//   // ------------------------------------------------------------
//   // FAVORITE HANDLING
//   // ------------------------------------------------------------
//   function isFav(dogId) {
//     return favorites.includes(dogId);
//   }

//   async function toggleFavorite(evt, dogId) {
//     evt.preventDefault();   // prevent Link navigation
//     evt.stopPropagation();  // ensure only the heart button reacts

//     // If not logged in → send to login page
//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     try {
//       if (isFav(dogId)) {
//         // Remove from favorites
//         await removeFavorite(user.username, dogId);
//         setFavorites((f) => f.filter((id) => id !== dogId));
//       } else {
//         // Add to favorites
//         await addFavorite(user.username, dogId);
//         setFavorites((f) => [...f, dogId]);
//       }
//     } catch (err) {
//       console.error("Favorite toggle failed:", err);
//     }
//   }

//   // ------------------------------------------------------------
//   // SMART BACK BUTTON
//   // Determines where the user should return:
//   //   - From welcome spotlight → back to /welcome
//   //   - From favorites page → /favorites
//   //   - From search results → navigate(-1)
//   //   - Otherwise → fallback navigate(-1)
//   // ------------------------------------------------------------
//   function handleBack() {
//     if (from === "welcome") {
//       navigate("/welcome");
//     } else if (from === "favorites") {
//       navigate("/favorites");
//     } else if (from === "results") {
//       navigate(-1);
//     } else {
//       navigate(-1);
//     }
//   }

//   const backLabel =
//     from === "welcome"
//       ? "← Back to welcome"
//       : from === "favorites"
//       ? "← Back to favorites"
//       : "← Back to search results";

//   // ------------------------------------------------------------
//   // RENDER
//   // ------------------------------------------------------------
//   return (
//     <main className="dog-detail">
//       {/* BACK BUTTON */}
//       <div className="dog-detail__back">
//         <button type="button" className="btn-secondary" onClick={handleBack}>
//           {backLabel}
//         </button>
//       </div>

//       <section className="dog-detail__layout">
//         {/* ========================================================
//             LEFT SIDE: IMAGE GALLERY
//         ======================================================== */}
//         <div className="dog-detail__media">
//           {/* Main image */}
//           <img
//             src={mainPhoto || noPhoto}
//             alt={dog.name}
//             className="dog-detail__main-image"
//           />

//           {/* Thumbnail list */}
//           {dog.photos && dog.photos.length > 1 && (
//             <div className="dog-detail__thumbs">
//               {dog.photos.map((p, idx) => (
//                 <img
//                   key={idx}
//                   src={p || noPhoto}
//                   alt={`${dog.name} ${idx + 1}`}
//                   onClick={() => setMainPhoto(p || noPhoto)}
//                   className={
//                     "dog-detail__thumb" +
//                     ((p || noPhoto) === mainPhoto
//                       ? " dog-detail__thumb--active"
//                       : "")
//                   }
//                 />
//               ))}
//             </div>
//           )}
//         </div>

//         {/* ========================================================
//             RIGHT SIDE: DOG INFORMATION CARD
//         ======================================================== */}
//         <div className="dog-detail__info-card">
//           {/* Name + favorite heart */}
//           <div className="dog-detail__name-row">
//             <h2 className="dog-detail__name">{dog.name || "Unknown name"}</h2>

//             <button
//               type="button"
//               className={`dog-detail-heart ${isFav(dog.id) ? "active" : ""}`}
//               onClick={(e) => toggleFavorite(e, dog.id)}
//               aria-label={
//                 isFav(dog.id)
//                   ? "Remove from favorites"
//                   : "Add to favorites"
//               }
//             >
//               {isFav(dog.id) ? "❤️" : "🤍"}
//             </button>
//           </div>

//           {/* Location */}
//           <p className="dog-detail__location">
//             {(dog.city || "Unknown city") + (dog.state ? `, ${dog.state}` : "")}
//           </p>

//           {/* Quick stats */}
//           <div className="dog-detail__quickstats">
//             <div>
//               <strong>Age:</strong> {dog.ageGroup || "Unknown"}
//             </div>
//             <div>
//               <strong>Sex:</strong> {dog.sex || "Unknown"}
//             </div>
//             <div>
//               <strong>Size:</strong> {dog.sizeGroup || "Unknown"}
//             </div>
//             <div>
//               <strong>Breed:</strong>{" "}
//               {dog.breedString || "Breed information not available"}
//             </div>
//             {dog.distance != null && (
//               <div>
//                 <strong>Approx. distance:</strong>{" "}
//                 {dog.distance.toFixed?.(1) ?? dog.distance} mi
//               </div>
//             )}
//           </div>

//           {/* “Good with …” pills */}
//           <div className="dog-detail__pills">
//             {dog.isDogsOk && <span className="pill pill--ok">Good with dogs</span>}
//             {dog.isCatsOk && <span className="pill pill--ok">Good with cats</span>}
//             {dog.isKidsOk && <span className="pill pill--ok">Good with kids</span>}
//             {dog.isHousetrained && (
//               <span className="pill pill--ok">Housetrained</span>
//             )}
//             {dog.isSpecialNeeds && (
//               <span className="pill pill--alert">Special needs</span>
//             )}
//             {dog.isNeedingFoster && (
//               <span className="pill pill--alert">Needs foster</span>
//             )}
//           </div>

//           {/* Description text */}
//           {description && (
//             <div className="dog-detail__description">{description}</div>
//           )}

//           {/* EXTERNAL LINK TO RESCUE LISTING */}
//           <div className="dog-detail__external">
//             {dog.url ? (
//               <>
//                 <a
//                   href={dog.url}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="dog-detail__external-btn"
//                 >
//                   View &amp; Apply on Rescue Website
//                 </a>
//                 <p className="dog-detail__external-hint">
//                   You’ll be taken to the rescue’s website for the most
//                   up-to-date info and adoption details.
//                 </p>
//               </>
//             ) : (
//               <>
//                 <a
//                   href="https://www.rescuegroups.org"
//                   target="_blank"
//                   rel="noreferrer"
//                   className="dog-detail__external-btn"
//                 >
//                   View Rescue Website
//                 </a>
//                 <p className="dog-detail__external-hint">
//                   No direct listing found — visit the rescue’s main website.
//                 </p>
//               </>
//             )}
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }










// =====before comments========
// // src/pages/DogDetail.jsx
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { getDog, addFavorite, removeFavorite } from "../api";
// import { useAuth } from "../context/AuthContext";
// import noPhoto from "../assets/no-photo.png";

// export default function DogDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const { user, favorites, setFavorites } = useAuth();

//   const [dog, setDog] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [mainPhoto, setMainPhoto] = useState(null);

//   // Who sent us here? "welcome" spotlight or "results" page
//   const from = location.state?.from || null;

//   useEffect(() => {
//     async function fetchDog() {
//       try {
//         setLoading(true);
//         setError(null);
//         const data = await getDog(id);
//         setDog(data);

//         // Pick a main photo or fall back to our default
//         if (data?.photos && data.photos.length > 0) {
//           setMainPhoto(data.photos[0]);
//         } else if (data?.photo) {
//           setMainPhoto(data.photo);
//         } else {
//           setMainPhoto(noPhoto);
//         }
//       } catch (err) {
//         console.error("Error fetching dog:", err);
//         setError("Could not load dog details.");
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchDog();
//   }, [id]);

//   if (loading) return <p>Loading dog…</p>;
//   if (error) return <p style={{ color: "red" }}>{error}</p>;
//   if (!dog) return <p>Dog not found.</p>;

//   // Description text with HTML-stripping fallback
//   let description = dog.descriptionText;
//   if (!description && dog.descriptionHtml) {
//     description = dog.descriptionHtml.replace(/<[^>]+>/g, "");
//   }

//   // ----- FAVORITE LOGIC -----
//   function isFav(dogId) {
//     return favorites.includes(dogId);
//   }

//   async function toggleFavorite(evt, dogId) {
//     evt.preventDefault();
//     evt.stopPropagation();

//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     try {
//       if (isFav(dogId)) {
//         await removeFavorite(user.username, dogId);
//         setFavorites((f) => f.filter((id) => id !== dogId));
//       } else {
//         await addFavorite(user.username, dogId);
//         setFavorites((f) => [...f, dogId]);
//       }
//     } catch (err) {
//       console.error("Favorite toggle failed:", err);
//     }
//   }

//   // ----- SMART BACK BUTTON before favorites-----
// //   function handleBack() {
// //     if (from === "welcome") {
// //       navigate("/welcome");
// //     } else if (from === "results") {
// //       navigate(-1); // back to results page
// //     } else {
// //       navigate(-1); // fallback
// //     }
// //   }

// //   const backLabel =
// //     from === "welcome" ? "← Back to welcome" : "← Back to search results";

// // ----- SMART BACK BUTTON -----
// function handleBack() {
//   if (from === "welcome") {
//     navigate("/welcome");
//   } else if (from === "favorites") {
//     navigate("/favorites");
//   } else if (from === "results") {
//     navigate(-1); // back to results page
//   } else {
//     navigate(-1); // fallback
//   }
// }

// const backLabel =
//   from === "welcome"
//     ? "← Back to welcome"
//     : from === "favorites"
//     ? "← Back to favorites"
//     : "← Back to search results";


//   return (
//     <main className="dog-detail">
//       <div className="dog-detail__back">
//         <button
//           type="button"
//           className="btn-secondary"
//           onClick={handleBack}
//         >
//           {backLabel}
//         </button>
//       </div>

//       <section className="dog-detail__layout">
//         {/* LEFT: main image + thumbnails */}
//         <div className="dog-detail__media">
//           <img
//             src={mainPhoto || noPhoto}
//             alt={dog.name}
//             className="dog-detail__main-image"
//           />

//           {dog.photos && dog.photos.length > 1 && (
//             <div className="dog-detail__thumbs">
//               {dog.photos.map((p, idx) => (
//                 <img
//                   key={idx}
//                   src={p || noPhoto}
//                   alt={`${dog.name} ${idx + 1}`}
//                   onClick={() => setMainPhoto(p || noPhoto)}
//                   className={
//                     "dog-detail__thumb" +
//                     ((p || noPhoto) === mainPhoto
//                       ? " dog-detail__thumb--active"
//                       : "")
//                   }
//                 />
//               ))}
//             </div>
//           )}
//         </div>

//         {/* RIGHT: info card */}
//         <div className="dog-detail__info-card">
//           <div className="dog-detail__name-row">
//             <h2 className="dog-detail__name">
//               {dog.name || "Unknown name"}
//             </h2>

//             <button
//               type="button"
//               className={`dog-detail-heart ${
//                 isFav(dog.id) ? "active" : ""
//               }`}
//               onClick={(e) => toggleFavorite(e, dog.id)}
//               aria-label={
//                 isFav(dog.id)
//                   ? "Remove from favorites"
//                   : "Add to favorites"
//               }
//             >
//               {isFav(dog.id) ? "❤️" : "🤍"}
//             </button>
//           </div>

//           <p className="dog-detail__location">
//             {(dog.city || "Unknown city") +
//               (dog.state ? `, ${dog.state}` : "")}
//           </p>

//           <div className="dog-detail__quickstats">
//             <div>
//               <strong>Age:</strong> {dog.ageGroup || "Unknown"}
//             </div>
//             <div>
//               <strong>Sex:</strong> {dog.sex || "Unknown"}
//             </div>
//             <div>
//               <strong>Size:</strong> {dog.sizeGroup || "Unknown"}
//             </div>
//             <div>
//               <strong>Breed:</strong>{" "}
//               {dog.breedString || "Breed information not available"}
//             </div>
//             {dog.distance != null && (
//               <div>
//                 <strong>Approx. distance:</strong>{" "}
//                 {dog.distance.toFixed?.(1) ?? dog.distance} mi
//               </div>
//             )}
//           </div>

//           {/* “Good with…” pills */}
//           <div className="dog-detail__pills">
//             {dog.isDogsOk && (
//               <span className="pill pill--ok">Good with dogs</span>
//             )}
//             {dog.isCatsOk && (
//               <span className="pill pill--ok">Good with cats</span>
//             )}
//             {dog.isKidsOk && (
//               <span className="pill pill--ok">Good with kids</span>
//             )}
//             {dog.isHousetrained && (
//               <span className="pill pill--ok">Housetrained</span>
//             )}
//             {dog.isSpecialNeeds && (
//               <span className="pill pill--alert">Special needs</span>
//             )}
//             {dog.isNeedingFoster && (
//               <span className="pill pill--alert">Needs foster</span>
//             )}
//           </div>

//           {/* DESCRIPTION */}
//           {description && (
//             <div className="dog-detail__description">{description}</div>
//           )}

//           {/* RESCUE WEBSITE CTA */}
//           <div className="dog-detail__external">
//             {dog.url ? (
//               <>
//                 <a
//                   href={dog.url}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="dog-detail__external-btn"
//                 >
//                   View &amp; Apply on Rescue Website
//                 </a>
//                 <p className="dog-detail__external-hint">
//                   You&apos;ll be taken to this dog&apos;s listing on the
//                   rescue&apos;s site for the most up-to-date info and
//                   adoption details.
//                 </p>
//               </>
//             ) : (
//               <>
//                 <a
//                   href="https://www.rescuegroups.org"
//                   target="_blank"
//                   rel="noreferrer"
//                   className="dog-detail__external-btn"
//                 >
//                   View Rescue Website
//                 </a>
//                 <p className="dog-detail__external-hint">
//                   No direct listing found — visit the rescue’s main website
//                   instead.
//                 </p>
//               </>
//             )}
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }

