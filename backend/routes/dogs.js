
// backend/routes/dogs.js
// ------------------------------------------------------------
// Routes for dog search + dog detail.
//
// These routes sit between your frontend and the RescueGroups API.
// They are responsible for:
//   - Calling helper functions that talk to RescueGroups
//   - Mapping the slightly messy API response into a clean shape
//   - Applying *local* breed filtering logic
//
// Exposed endpoints:
//
//   GET /dogs
//     -> search available dogs (with optional filters)
//
//   GET /dogs/:id
//     -> fetch a single dog's full details
// ------------------------------------------------------------

import express from "express";
import { searchAvailableDogs, getDogById } from "../helpers/rescueGroups.js";

const router = new express.Router();

/**
 * Utility: ensure a value is always treated as an array.
 *
 * This is useful because `req.query.breeds` might be:
 *   - undefined
 *   - a single string: "Beagle"
 *   - an array of strings: ["Beagle", "Labrador Retriever"]
 *
 * We normalize it so the rest of our logic can always assume
 * it's working with an array.
 */
function toArray(val) {
  if (val === undefined || val === null) return [];
  return Array.isArray(val) ? val : [val];
}

/**
 * Normalize a breed string into a cleaned-up "searchable" version.
 *
 * RescueGroups breed strings can be messy, for example:
 *   "Labrador Retriever Mix"
 *   "German Shepherd Dog"
 *   "Shepherd / Husky / Mix"
 *
 * We want to compare these somewhat loosely to user-selected breeds,
 * so we:
 *   - lowercase the whole string
 *   - remove words like "mix"/"mixed" and "dog"
 *   - replace punctuation/slashes with spaces
 *   - collapse repeated spaces
 *
 * Result example:
 *   "Labrador Retriever Mix" -> "labrador retriever"
 */
function normalizeBreed(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/mix(ed)?/g, "")      // remove "mix" and "mixed"
    .replace(/dog/g, "")           // remove the word "dog"
    .replace(/[\/,&()-]/g, " ")    // replace punctuation with spaces
    .replace(/\s+/g, " ")          // collapse multiple spaces
    .trim();
}

/**
 * Given a user-selected breed string (like "German Shepherd Dog"),
 * return "tokens" (keywords) we can search for inside the dog's
 * normalized breed string.
 *
 * Example:
 *   "German Shepherd Dog" ->
 *     normalizeBreed -> "german shepherd"
 *     split into tokens -> ["german", "shepherd"]
 *     filter out super-short tokens -> keep tokens length >= 3
 */
function getBreedTokens(sel) {
  const norm = normalizeBreed(sel);
  return norm.split(" ").filter((w) => w.length >= 3);
}

/**
 * GET /dogs
 *
 * Query parameters (examples):
 *   /dogs?zip=01938&miles=50&sex=Female&ageGroup=Adult&breeds=Beagle
 *
 * This route:
 *   1. Calls `searchAvailableDogs` helper to hit the RescueGroups API
 *   2. Maps the raw API data into a clean list of dog objects
 *   3. Applies *local* breed filtering (because RG breed strings are messy)
 *   4. Returns a simple JSON response with:
 *        {
 *          dogs: [...],
 *          page: 1,
 *          total: N,
 *          countReturned: N,
 *          pages: 1
 *        }
 *
 * NOTE: Pagination is currently stubbed as single-page (page=1).
 * You could expand this later if you want true pagination.
 */
router.get("/", async (req, res, next) => {
  try {
    // 1) Call helper to do the actual RescueGroups API request.
    //    req.query can include zip, miles, sex, ageGroup, sizeGroup, etc.
    const data = await searchAvailableDogs(req.query);

    // 2) Handle breed filters locally.
    //
    //    `req.query.breeds` can be a single string or array of strings.
    //    We always treat it as an array internally.
    const breedsFilter = toArray(req.query.breeds);
    const hasBreedFilter = breedsFilter.length > 0;

    // Precompute tokens for each selected breed so we can do
    // partial matching later.
    const breedTokenSets = breedsFilter.map(getBreedTokens);

    // 3) Map the RescueGroups API response into a cleaner "dog" shape.
    //
    //    RG response has structure:
    //      data: [ { id, attributes, relationships }, ... ]
    //      included: [ pictures, locations, ... ]
    //
    //    We pick out:
    //      - id, name, ageGroup, sex
    //      - distance
    //      - first location (city, state)
    //      - thumbnail photo
    //      - external URL (to RG)
    //      - raw breedString (for local filtering)
    let dogs = (data.data || []).map((a) => {
      const attrs = a.attributes || {};
      const rel = a.relationships || {};

      let city = null;
      let state = null;

      // Locations are included separately in `data.included`.
      // The animal's relationships tell us which location ID to use.
      const locId = rel.locations?.data?.[0]?.id;

      if (locId && Array.isArray(data.included)) {
        const loc = data.included.find(
          (x) => x.type === "locations" && x.id === locId
        );
        if (loc?.attributes) {
          city = loc.attributes.city || null;
          state = loc.attributes.state || null;
        }
      }

      return {
        id: a.id,
        name: attrs.name || null,
        ageGroup: attrs.ageGroup || null,
        sex: attrs.sex || null,
        distance: attrs.distance ?? null,
        city,
        state,
        photo: attrs.pictureThumbnailUrl || null,
        url: attrs.url || null,
        breedString: attrs.breedString || "",
      };
    });

    // 4) 🐾 Local breed filtering
    //
    // If the user selected one or more breeds, we:
    //   - Normalize the dog's breedString
    //   - Check whether ANY of the selected breed token sets
    //     have ANY token contained in the dog's normalized breed string.
    //
    // This allows loose matching like:
    //   "German Shepherd" to match "German Shepherd / Husky Mix"
    if (hasBreedFilter) {
      // Debug log (optional). Uncomment if you want to see this in server logs.
      // console.log("🐾 applying local breed filter for:", breedsFilter);

      dogs = dogs.filter((d) => {
        const dogNorm = normalizeBreed(d.breedString);
        if (!dogNorm) return false;

        // Check each set of tokens (for each selected breed).
        return breedTokenSets.some((tokens) =>
          // If ANY token ("german", "shepherd") appears in the dog's
          // normalized breed string, we consider it a match.
          tokens.some((t) => dogNorm.includes(t))
        );
      });
    }

    // 5) Return the final dog list in a simple shape the frontend expects.
    return res.json({
      dogs,
      page: 1,
      total: dogs.length,
      countReturned: dogs.length,
      pages: 1,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /dogs/:id
 *
 * Fetch a single dog's detailed info by its RescueGroups ID.
 *
 * This route:
 *   1. Calls `getDogById` helper
 *   2. Extracts attributes, locations, and pictures
 *   3. Returns a clean, frontend-friendly object with:
 *        - id, name, ageGroup, sex
 *        - city, state, distance
 *        - main photo + an array of photos
 *        - URL to the RescueGroups page (or rescue site as fallback)
 *        - descriptionText + descriptionHtml
 */
router.get("/:id", async (req, res, next) => {
  try {
    const data = await getDogById(req.params.id);

    const raw = data.data;
    // Sometimes RG returns data as [animal], sometimes just animal.
    const a = Array.isArray(raw) ? raw[0] : raw;

    if (!a) {
      // If we didn't get a valid animal back, treat it as "not found".
      throw { status: 404, message: "Dog not found" };
    }

    const attrs = a.attributes || {};
    const rel = a.relationships || {};

    // Collect all full-sized photo URLs from included "pictures".
    const photos = [];
    if (Array.isArray(data.included)) {
      for (let inc of data.included) {
        if (inc.type === "pictures" && inc.attributes?.original?.url) {
          photos.push(inc.attributes.original.url);
        }
      }
    }

    // Extract city/state from related location, similar to the list route,
    // and *also* try to grab a rescue/location website URL if available.
    let city = null;
    let state = null;
    let rescueUrl = null; // 👈 potential fallback if the dog has no personal page

    const locId = rel.locations?.data?.[0]?.id;

    if (locId && Array.isArray(data.included)) {
      const loc = data.included.find(
        (x) => x.type === "locations" && x.id === locId
      );
      if (loc?.attributes) {
        const la = loc.attributes;

        city = la.city || null;
        state = la.state || null;

        // 💡 Best-effort search for any URL-ish fields the location might expose.
        // Not all fields will exist, but grabbing whatever they give us is better
        // than sending the user to a generic RescueGroups page.
        rescueUrl =
          la.url ||
          la.urlWeb ||
          la.website ||
          la.facebookUrl ||
          la.twitter ||
          la.instagram ||
          null;
      }
    }

    // ----- RESCUE / ORGANIZATION URL FALLBACK -----------------
    //
    // Start with the dog's own URL if RescueGroups gave us one.
    // If that is missing or is some generic RG page, but the rescue
    // (location) has a website, we prefer to send users there instead.
    // const dogUrl = attrs.url || null;
    // const finalUrl = dogUrl || rescueUrl || null;

    // ----- RESCUE / ORGANIZATION URL FALLBACK -----------------
//
// We now **prefer the rescue/location website** if we have one,
// since that’s usually where applications or contact info live.
// If there is no rescue site, we fall back to the RescueGroups
// dog URL instead.
const dogUrl = attrs.url || null;

// Prefer rescue site → then RG dog page → then nothing
const finalUrl = rescueUrl || dogUrl || null;


    return res.json({
      id: a.id,
      name: attrs.name || null,
      ageGroup: attrs.ageGroup || null,
      sex: attrs.sex || null,
      city,
      state,
      distance: attrs.distance ?? null,

      // Choose the "best" main photo:
      //   1) first full-sized photo, or
      //   2) thumbnail, or
      //   3) null if nothing is available.
      photo: photos[0] || attrs.pictureThumbnailUrl || null,
      photos,

      // 👇 now this is either:
      //    - the dog's personal RG page (if present), OR
      //    - the rescue/location website/social as a fallback
      url: finalUrl,

      // Optional: you *could* also expose rescueUrl separately later:
      // rescueUrl,

      // Send both plain text and HTML versions of the description.
      descriptionText: attrs.descriptionText || null,
      descriptionHtml: attrs.descriptionHtml || null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;






// // backend/routes/dogs.js
// // ------------------------------------------------------------
// // Routes for dog search + dog detail.
// //
// // These routes sit between your frontend and the RescueGroups API.
// // They are responsible for:
// //   - Calling helper functions that talk to RescueGroups
// //   - Mapping the slightly messy API response into a clean shape
// //   - Applying *local* breed filtering logic
// //
// // Exposed endpoints:
// //
// //   GET /dogs
// //     -> search available dogs (with optional filters)
// //
// //   GET /dogs/:id
// //     -> fetch a single dog's full details
// // ------------------------------------------------------------

// import express from "express";
// import { searchAvailableDogs, getDogById } from "../helpers/rescueGroups.js";

// const router = new express.Router();

// /**
//  * Utility: ensure a value is always treated as an array.
//  *
//  * This is useful because `req.query.breeds` might be:
//  *   - undefined
//  *   - a single string: "Beagle"
//  *   - an array of strings: ["Beagle", "Labrador Retriever"]
//  *
//  * We normalize it so the rest of our logic can always assume
//  * it's working with an array.
//  */
// function toArray(val) {
//   if (val === undefined || val === null) return [];
//   return Array.isArray(val) ? val : [val];
// }

// /**
//  * Normalize a breed string into a cleaned-up "searchable" version.
//  *
//  * RescueGroups breed strings can be messy, for example:
//  *   "Labrador Retriever Mix"
//  *   "German Shepherd Dog"
//  *   "Shepherd / Husky / Mix"
//  *
//  * We want to compare these somewhat loosely to user-selected breeds,
//  * so we:
//  *   - lowercase the whole string
//  *   - remove words like "mix"/"mixed" and "dog"
//  *   - replace punctuation/slashes with spaces
//  *   - collapse repeated spaces
//  *
//  * Result example:
//  *   "Labrador Retriever Mix" -> "labrador retriever"
//  */
// function normalizeBreed(str) {
//   return String(str || "")
//     .toLowerCase()
//     .replace(/mix(ed)?/g, "")      // remove "mix" and "mixed"
//     .replace(/dog/g, "")           // remove the word "dog"
//     .replace(/[\/,&()-]/g, " ")    // replace punctuation with spaces
//     .replace(/\s+/g, " ")          // collapse multiple spaces
//     .trim();
// }

// /**
//  * Given a user-selected breed string (like "German Shepherd Dog"),
//  * return "tokens" (keywords) we can search for inside the dog's
//  * normalized breed string.
//  *
//  * Example:
//  *   "German Shepherd Dog" ->
//  *     normalizeBreed -> "german shepherd"
//  *     split into tokens -> ["german", "shepherd"]
//  *     filter out super-short tokens -> keep tokens length >= 3
//  */
// function getBreedTokens(sel) {
//   const norm = normalizeBreed(sel);
//   return norm.split(" ").filter((w) => w.length >= 3);
// }

// /**
//  * GET /dogs
//  *
//  * Query parameters (examples):
//  *   /dogs?zip=01938&miles=50&sex=Female&ageGroup=Adult&breeds=Beagle
//  *
//  * This route:
//  *   1. Calls `searchAvailableDogs` helper to hit the RescueGroups API
//  *   2. Maps the raw API data into a clean list of dog objects
//  *   3. Applies *local* breed filtering (because RG breed strings are messy)
//  *   4. Returns a simple JSON response with:
//  *        {
//  *          dogs: [...],
//  *          page: 1,
//  *          total: N,
//  *          countReturned: N,
//  *          pages: 1
//  *        }
//  *
//  * NOTE: Pagination is currently stubbed as single-page (page=1).
//  * You could expand this later if you want true pagination.
//  */
// router.get("/", async (req, res, next) => {
//   try {
//     // 1) Call helper to do the actual RescueGroups API request.
//     //    req.query can include zip, miles, sex, ageGroup, sizeGroup, etc.
//     const data = await searchAvailableDogs(req.query);

//     // 2) Handle breed filters locally.
//     //
//     //    `req.query.breeds` can be a single string or array of strings.
//     //    We always treat it as an array internally.
//     const breedsFilter = toArray(req.query.breeds);
//     const hasBreedFilter = breedsFilter.length > 0;

//     // Precompute tokens for each selected breed so we can do
//     // partial matching later.
//     const breedTokenSets = breedsFilter.map(getBreedTokens);

//     // 3) Map the RescueGroups API response into a cleaner "dog" shape.
//     //
//     //    RG response has structure:
//     //      data: [ { id, attributes, relationships }, ... ]
//     //      included: [ pictures, locations, ... ]
//     //
//     //    We pick out:
//     //      - id, name, ageGroup, sex
//     //      - distance
//     //      - first location (city, state)
//     //      - thumbnail photo
//     //      - external URL (to RG)
//     //      - raw breedString (for local filtering)
//     let dogs = (data.data || []).map((a) => {
//       const attrs = a.attributes || {};
//       const rel = a.relationships || {};

//       let city = null;
//       let state = null;

//       // Locations are included separately in `data.included`.
//       // The animal's relationships tell us which location ID to use.
//       const locId = rel.locations?.data?.[0]?.id;

//       if (locId && Array.isArray(data.included)) {
//         const loc = data.included.find(
//           (x) => x.type === "locations" && x.id === locId
//         );
//         if (loc?.attributes) {
//           city = loc.attributes.city || null;
//           state = loc.attributes.state || null;
//         }
//       }

//       return {
//         id: a.id,
//         name: attrs.name || null,
//         ageGroup: attrs.ageGroup || null,
//         sex: attrs.sex || null,
//         distance: attrs.distance ?? null,
//         city,
//         state,
//         photo: attrs.pictureThumbnailUrl || null,
//         url: attrs.url || null,
//         breedString: attrs.breedString || "",
//       };
//     });

//     // 4) 🐾 Local breed filtering
//     //
//     // If the user selected one or more breeds, we:
//     //   - Normalize the dog's breedString
//     //   - Check whether ANY of the selected breed token sets
//     //     have ANY token contained in the dog's normalized breed string.
//     //
//     // This allows loose matching like:
//     //   "German Shepherd" to match "German Shepherd / Husky Mix"
//     if (hasBreedFilter) {
//       // Debug log (optional). Uncomment if you want to see this in server logs.
//       // console.log("🐾 applying local breed filter for:", breedsFilter);

//       dogs = dogs.filter((d) => {
//         const dogNorm = normalizeBreed(d.breedString);
//         if (!dogNorm) return false;

//         // Check each set of tokens (for each selected breed).
//         return breedTokenSets.some((tokens) =>
//           // If ANY token ("german", "shepherd") appears in the dog's
//           // normalized breed string, we consider it a match.
//           tokens.some((t) => dogNorm.includes(t))
//         );
//       });
//     }

//     // 5) Return the final dog list in a simple shape the frontend expects.
//     return res.json({
//       dogs,
//       page: 1,
//       total: dogs.length,
//       countReturned: dogs.length,
//       pages: 1,
//     });
//   } catch (err) {
//     return next(err);
//   }
// });

// /**
//  * GET /dogs/:id
//  *
//  * Fetch a single dog's detailed info by its RescueGroups ID.
//  *
//  * This route:
//  *   1. Calls `getDogById` helper
//  *   2. Extracts attributes, locations, and pictures
//  *   3. Returns a clean, frontend-friendly object with:
//  *        - id, name, ageGroup, sex
//  *        - city, state, distance
//  *        - main photo + an array of photos
//  *        - URL to the RescueGroups page (or rescue site fallback)
//  *        - descriptionText + descriptionHtml
//  */
// router.get("/:id", async (req, res, next) => {
//   try {
//     const data = await getDogById(req.params.id);

//     const raw = data.data;
//     // Sometimes RG returns data as [animal], sometimes just animal.
//     const a = Array.isArray(raw) ? raw[0] : raw;

//     if (!a) {
//       // If we didn't get a valid animal back, treat it as "not found".
//       throw { status: 404, message: "Dog not found" };
//     }

//     const attrs = a.attributes || {};
//     const rel = a.relationships || {};

//     // Collect all full-sized photo URLs from included "pictures".
//     const photos = [];
//     if (Array.isArray(data.included)) {
//       for (let inc of data.included) {
//         if (inc.type === "pictures" && inc.attributes?.original?.url) {
//           photos.push(inc.attributes.original.url);
//         }
//       }
//     }

//     // Extract city/state from related location, similar to the list route.
//     let city = null;
//     let state = null;
//     const locId = rel.locations?.data?.[0]?.id;

//     if (locId && Array.isArray(data.included)) {
//       const loc = data.included.find(
//         (x) => x.type === "locations" && x.id === locId
//       );
//       if (loc?.attributes) {
//         city = loc.attributes.city || null;
//         state = loc.attributes.state || null;
//       }
//     }

//     // ----- RESCUE / ORGANIZATION URL FALLBACK -----------------
//     // Start with the dog's own URL if RescueGroups gave us one.
//     let dogUrl = attrs.url || null;
//     let rescueUrl = null;

//     // Some RescueGroups responses may include organization / group info
//     // in `data.included`. We *try* to find a URL there, but if nothing
//     // exists, this logic will just leave rescueUrl = null.
//     if (Array.isArray(data.included)) {
//       const org = data.included.find((inc) => {
//         // We check a couple of possible type names just in case:
//         return (
//           inc.type === "organizations" ||
//           inc.type === "orgs" ||
//           inc.type === "groups"
//         );
//       });

//       if (org?.attributes) {
//         const o = org.attributes;

//         // Try a few common fields; if none exist, rescueUrl stays null.
//         rescueUrl =
//           o.url ||          // generic URL field
//           o.urlWeb ||       // some APIs use "urlWeb"
//           o.website ||      // or "website"
//           o.websiteUrl ||   // or "websiteUrl"
//           o.facebookUrl ||  // some rescues only list FB
//           o.linkedinUrl ||  // or LinkedIn
//           null;
//       }
//     }

//     // If the dog itself didn't have a URL, but the rescue did,
//     // use that as the main URL we send to the frontend.
//     const finalUrl = dogUrl || rescueUrl || null;

//     return res.json({
//       id: a.id,
//       name: attrs.name || null,
//       ageGroup: attrs.ageGroup || null,
//       sex: attrs.sex || null,
//       city,
//       state,
//       distance: attrs.distance ?? null,

//       // Choose the "best" main photo:
//       //   1) first full-sized photo, or
//       //   2) thumbnail, or
//       //   3) null if nothing is available.
//       photo: photos[0] || attrs.pictureThumbnailUrl || null,
//       photos,

//       // 👇 now this is either the dog detail page, or the rescue's website as fallback
//       url: finalUrl,

//       // Optional: send the rescueUrl separately if you want to show it differently later
//       rescueUrl,

//       // Send both plain text and HTML versions of the description.
//       descriptionText: attrs.descriptionText || null,
//       descriptionHtml: attrs.descriptionHtml || null,
//     });
//   } catch (err) {
//     return next(err);
//   }
// });

// export default router;






// // backend/routes/dogs.js
// // ------------------------------------------------------------
// // Routes for dog search + dog detail.
// //
// // These routes sit between your frontend and the RescueGroups API.
// // They are responsible for:
// //   - Calling helper functions that talk to RescueGroups
// //   - Mapping the slightly messy API response into a clean shape
// //   - Applying *local* breed filtering logic
// //
// // Exposed endpoints:
// //
// //   GET /dogs
// //     -> search available dogs (with optional filters)
// //
// //   GET /dogs/:id
// //     -> fetch a single dog's full details
// // ------------------------------------------------------------

// import express from "express";
// import { searchAvailableDogs, getDogById } from "../helpers/rescueGroups.js";

// const router = new express.Router();

// /**
//  * Utility: ensure a value is always treated as an array.
//  *
//  * This is useful because `req.query.breeds` might be:
//  *   - undefined
//  *   - a single string: "Beagle"
//  *   - an array of strings: ["Beagle", "Labrador Retriever"]
//  *
//  * We normalize it so the rest of our logic can always assume
//  * it's working with an array.
//  */
// function toArray(val) {
//   if (val === undefined || val === null) return [];
//   return Array.isArray(val) ? val : [val];
// }

// /**
//  * Normalize a breed string into a cleaned-up "searchable" version.
//  *
//  * RescueGroups breed strings can be messy, for example:
//  *   "Labrador Retriever Mix"
//  *   "German Shepherd Dog"
//  *   "Shepherd / Husky / Mix"
//  *
//  * We want to compare these somewhat loosely to user-selected breeds,
//  * so we:
//  *   - lowercase the whole string
//  *   - remove words like "mix"/"mixed" and "dog"
//  *   - replace punctuation/slashes with spaces
//  *   - collapse repeated spaces
//  *
//  * Result example:
//  *   "Labrador Retriever Mix" -> "labrador retriever"
//  */
// function normalizeBreed(str) {
//   return String(str || "")
//     .toLowerCase()
//     .replace(/mix(ed)?/g, "")      // remove "mix" and "mixed"
//     .replace(/dog/g, "")           // remove the word "dog"
//     .replace(/[\/,&()-]/g, " ")    // replace punctuation with spaces
//     .replace(/\s+/g, " ")          // collapse multiple spaces
//     .trim();
// }

// /**
//  * Given a user-selected breed string (like "German Shepherd Dog"),
//  * return "tokens" (keywords) we can search for inside the dog's
//  * normalized breed string.
//  *
//  * Example:
//  *   "German Shepherd Dog" ->
//  *     normalizeBreed -> "german shepherd"
//  *     split into tokens -> ["german", "shepherd"]
//  *     filter out super-short tokens -> keep tokens length >= 3
//  */
// function getBreedTokens(sel) {
//   const norm = normalizeBreed(sel);
//   return norm.split(" ").filter((w) => w.length >= 3);
// }

// /**
//  * GET /dogs
//  *
//  * Query parameters (examples):
//  *   /dogs?zip=01938&miles=50&sex=Female&ageGroup=Adult&breeds=Beagle
//  *
//  * This route:
//  *   1. Calls `searchAvailableDogs` helper to hit the RescueGroups API
//  *   2. Maps the raw API data into a clean list of dog objects
//  *   3. Applies *local* breed filtering (because RG breed strings are messy)
//  *   4. Returns a simple JSON response with:
//  *        {
//  *          dogs: [...],
//  *          page: 1,
//  *          total: N,
//  *          countReturned: N,
//  *          pages: 1
//  *        }
//  *
//  * NOTE: Pagination is currently stubbed as single-page (page=1).
//  * You could expand this later if you want true pagination.
//  */
// router.get("/", async (req, res, next) => {
//   try {
//     // 1) Call helper to do the actual RescueGroups API request.
//     //    req.query can include zip, miles, sex, ageGroup, sizeGroup, etc.
//     const data = await searchAvailableDogs(req.query);

//     // 2) Handle breed filters locally.
//     //
//     //    `req.query.breeds` can be a single string or array of strings.
//     //    We always treat it as an array internally.
//     const breedsFilter = toArray(req.query.breeds);
//     const hasBreedFilter = breedsFilter.length > 0;

//     // Precompute tokens for each selected breed so we can do
//     // partial matching later.
//     const breedTokenSets = breedsFilter.map(getBreedTokens);

//     // 3) Map the RescueGroups API response into a cleaner "dog" shape.
//     //
//     //    RG response has structure:
//     //      data: [ { id, attributes, relationships }, ... ]
//     //      included: [ pictures, locations, ... ]
//     //
//     //    We pick out:
//     //      - id, name, ageGroup, sex
//     //      - distance
//     //      - first location (city, state)
//     //      - thumbnail photo
//     //      - external URL (to RG)
//     //      - raw breedString (for local filtering)
//     let dogs = (data.data || []).map((a) => {
//       const attrs = a.attributes || {};
//       const rel = a.relationships || {};

//       let city = null;
//       let state = null;

//       // Locations are included separately in `data.included`.
//       // The animal's relationships tell us which location ID to use.
//       const locId = rel.locations?.data?.[0]?.id;

//       if (locId && Array.isArray(data.included)) {
//         const loc = data.included.find(
//           (x) => x.type === "locations" && x.id === locId
//         );
//         if (loc?.attributes) {
//           city = loc.attributes.city || null;
//           state = loc.attributes.state || null;
//         }
//       }

//       return {
//         id: a.id,
//         name: attrs.name || null,
//         ageGroup: attrs.ageGroup || null,
//         sex: attrs.sex || null,
//         distance: attrs.distance ?? null,
//         city,
//         state,
//         photo: attrs.pictureThumbnailUrl || null,
//         url: attrs.url || null,
//         breedString: attrs.breedString || "",
//       };
//     });

//     // 4) 🐾 Local breed filtering
//     //
//     // If the user selected one or more breeds, we:
//     //   - Normalize the dog's breedString
//     //   - Check whether ANY of the selected breed token sets
//     //     have ANY token contained in the dog's normalized breed string.
//     //
//     // This allows loose matching like:
//     //   "German Shepherd" to match "German Shepherd / Husky Mix"
//     if (hasBreedFilter) {
//       // Debug log (optional). Uncomment if you want to see this in server logs.
//       // console.log("🐾 applying local breed filter for:", breedsFilter);

//       dogs = dogs.filter((d) => {
//         const dogNorm = normalizeBreed(d.breedString);
//         if (!dogNorm) return false;

//         // Check each set of tokens (for each selected breed).
//         return breedTokenSets.some((tokens) =>
//           // If ANY token ("german", "shepherd") appears in the dog's
//           // normalized breed string, we consider it a match.
//           tokens.some((t) => dogNorm.includes(t))
//         );
//       });
//     }

//     // 5) Return the final dog list in a simple shape the frontend expects.
//     return res.json({
//       dogs,
//       page: 1,
//       total: dogs.length,
//       countReturned: dogs.length,
//       pages: 1,
//     });
//   } catch (err) {
//     return next(err);
//   }
// });

// /**
//  * GET /dogs/:id
//  *
//  * Fetch a single dog's detailed info by its RescueGroups ID.
//  *
//  * This route:
//  *   1. Calls `getDogById` helper
//  *   2. Extracts attributes, locations, and pictures
//  *   3. Returns a clean, frontend-friendly object with:
//  *        - id, name, ageGroup, sex
//  *        - city, state, distance
//  *        - main photo + an array of photos
//  *        - URL to the RescueGroups page
//  *        - descriptionText + descriptionHtml
//  */
// router.get("/:id", async (req, res, next) => {
//   try {
//     const data = await getDogById(req.params.id);

//     const raw = data.data;
//     // Sometimes RG returns data as [animal], sometimes just animal.
//     const a = Array.isArray(raw) ? raw[0] : raw;

//     if (!a) {
//       // If we didn't get a valid animal back, treat it as "not found".
//       throw { status: 404, message: "Dog not found" };
//     }

//     const attrs = a.attributes || {};
//     const rel = a.relationships || {};

//     // Collect all full-sized photo URLs from included "pictures".
//     const photos = [];
//     if (Array.isArray(data.included)) {
//       for (let inc of data.included) {
//         if (inc.type === "pictures" && inc.attributes?.original?.url) {
//           photos.push(inc.attributes.original.url);
//         }
//       }
//     }

//     // Extract city/state from related location, similar to the list route.
//     let city = null;
//     let state = null;
//     const locId = rel.locations?.data?.[0]?.id;

//     if (locId && Array.isArray(data.included)) {
//       const loc = data.included.find(
//         (x) => x.type === "locations" && x.id === locId
//       );
//       if (loc?.attributes) {
//         city = loc.attributes.city || null;
//         state = loc.attributes.state || null;
//       }
//     }

//     return res.json({
//       id: a.id,
//       name: attrs.name || null,
//       ageGroup: attrs.ageGroup || null,
//       sex: attrs.sex || null,
//       city,
//       state,
//       distance: attrs.distance ?? null,
//       // Choose the "best" main photo:
//       //   1) first full-sized photo, or
//       //   2) thumbnail, or
//       //   3) null if nothing is available.
//       photo: photos[0] || attrs.pictureThumbnailUrl || null,
//       photos,
//       url: attrs.url || null,
//       // Send both plain text and HTML versions of the description.
//       descriptionText: attrs.descriptionText || null,
//       descriptionHtml: attrs.descriptionHtml || null,
//     });

//   } catch (err) {
//     return next(err);
//   }
// });

// export default router;









//========= before comments=========
// // backend/routes/dogs.js
// import express from "express";
// import { searchAvailableDogs, getDogById } from "../helpers/rescueGroups.js";

// const router = new express.Router();

// function toArray(val) {
//   if (val === undefined || val === null) return [];
//   return Array.isArray(val) ? val : [val];
// }

// function normalizeBreed(str) {
//   return String(str || "")
//     .toLowerCase()
//     .replace(/mix(ed)?/g, "")
//     .replace(/dog/g, "")
//     .replace(/[\/,&()-]/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// function getBreedTokens(sel) {
//   const norm = normalizeBreed(sel);
//   return norm.split(" ").filter((w) => w.length >= 3);
// }

// /** GET /dogs  => list/search dogs */
// router.get("/", async (req, res, next) => {
//   try {
//     const data = await searchAvailableDogs(req.query);

//     const breedsFilter = toArray(req.query.breeds);
//     const hasBreedFilter = breedsFilter.length > 0;
//     const breedTokenSets = breedsFilter.map(getBreedTokens);

//     let dogs = (data.data || []).map((a) => {
//       const attrs = a.attributes || {};
//       const rel = a.relationships || {};

//       let city = null;
//       let state = null;
//       const locId = rel.locations?.data?.[0]?.id;

//       if (locId && Array.isArray(data.included)) {
//         const loc = data.included.find(
//           (x) => x.type === "locations" && x.id === locId
//         );
//         if (loc?.attributes) {
//           city = loc.attributes.city || null;
//           state = loc.attributes.state || null;
//         }
//       }

//       return {
//         id: a.id,
//         name: attrs.name || null,
//         ageGroup: attrs.ageGroup || null,
//         sex: attrs.sex || null,
//         distance: attrs.distance ?? null,
//         city,
//         state,
//         photo: attrs.pictureThumbnailUrl || null,
//         url: attrs.url || null,
//         breedString: attrs.breedString || "",
//       };
//     });

//     // 🐾 Local breed filtering
//     if (hasBreedFilter) {
//       console.log("🐾 applying local breed filter for:", breedsFilter);
//       dogs = dogs.filter((d) => {
//         const dogNorm = normalizeBreed(d.breedString);
//         if (!dogNorm) return false;

//         return breedTokenSets.some((tokens) =>
//           tokens.some((t) => dogNorm.includes(t))
//         );
//       });
//     }

//     return res.json({
//       dogs,
//       page: 1,
//       total: dogs.length,
//       countReturned: dogs.length,
//       pages: 1,
//     });
//   } catch (err) {
//     return next(err);
//   }
// });

// /** GET /dogs/:id  => single dog detail */
// router.get("/:id", async (req, res, next) => {
//   try {
//     const data = await getDogById(req.params.id);
//     const raw = data.data;
//     const a = Array.isArray(raw) ? raw[0] : raw;

//     if (!a) throw { status: 404, message: "Dog not found" };

//     const attrs = a.attributes || {};
//     const rel = a.relationships || {};

//     const photos = [];
//     if (Array.isArray(data.included)) {
//       for (let inc of data.included) {
//         if (inc.type === "pictures" && inc.attributes?.original?.url) {
//           photos.push(inc.attributes.original.url);
//         }
//       }
//     }

//     let city = null;
//     let state = null;
//     const locId = rel.locations?.data?.[0]?.id;

//     if (locId && Array.isArray(data.included)) {
//       const loc = data.included.find(
//         (x) => x.type === "locations" && x.id === locId
//       );
//       if (loc?.attributes) {
//         city = loc.attributes.city || null;
//         state = loc.attributes.state || null;
//       }
//     }

//     return res.json({
//       id: a.id,
//       name: attrs.name || null,
//       ageGroup: attrs.ageGroup || null,
//       sex: attrs.sex || null,
//       city,
//       state,
//       distance: attrs.distance ?? null,
//       photo: photos[0] || attrs.pictureThumbnailUrl || null,
//       photos,
//       url: attrs.url || null,
//       // 👇 send both flavors from RG
//       descriptionText: attrs.descriptionText || null,
//       descriptionHtml: attrs.descriptionHtml || null,
//     });
//   } catch (err) {
//     return next(err);
//   }
// });


// export default router;
