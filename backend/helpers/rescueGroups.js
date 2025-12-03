// backend/helpers/rescueGroups.js
// -----------------------------------------
// Helper functions for talking to the RescueGroups.org v5 API.
// This file is responsible ONLY for:
//   - Building the correct request body (filters, radius, etc.)
//   - Making HTTP requests to RescueGroups
//   - Returning the raw data back to our routes
// -----------------------------------------

import axios from "axios";

// Base URL for the RescueGroups v5 API.
// We only ever talk to this API through this helper.
const RG_API_BASE = "https://api.rescuegroups.org/v5";

// API key is stored in an environment variable so we don't
// hard-code secrets into our codebase or commit them to Git.
const API_KEY = process.env.RESCUEGROUPS_API_KEY;

/**
 * Ensure a value is always an array.
 *
 * The "breeds" filter can come in as:
 *   - undefined / null
 *   - a single string    -> "Labrador Retriever"
 *   - an array of strings -> ["Labrador Retriever", "Beagle"]
 *
 * This helper turns everything into an array so the rest of
 * our code can treat it consistently.
 */
function toArray(val) {
  if (val === undefined || val === null) return [];
  return Array.isArray(val) ? val : [val];
}

/**
 * Build the "filters" array for the RescueGroups request body,
 * based on the query parameters coming from the client.
 *
 * IMPORTANT:
 *   This function does **NOT** handle breed filters on purpose.
 *   We filter by breed later in our own code (locally), because
 *   RescueGroups breed data can be a bit messy and we want more
 *   control over how we match it.
 *
 * @param {Object} q - The query object (usually req.query from Express)
 * @returns {Array} - An array of filter objects in the format
 *                    expected by RescueGroups.
 */
function buildFiltersFromQuery(q) {
  const filters = [];

  // ----- Sex filter -----
  // Example values: "Male", "Female"
  if (q.sex) {
    filters.push({
      fieldName: "animals.sex",
      operation: "equal",
      criteria: String(q.sex),
    });
  }

  // ----- Age group filter -----
  // Example values: "Baby", "Young", "Adult", "Senior"
  if (q.ageGroup) {
    filters.push({
      fieldName: "animals.ageGroup",
      operation: "equal",
      criteria: String(q.ageGroup),
    });
  }

  // ----- Size group filter -----
  // Example values: "Small", "Medium", "Large", "Extra Large"
  if (q.sizeGroup) {
    filters.push({
      fieldName: "animals.sizeGroup",
      operation: "equal",
      criteria: String(q.sizeGroup),
    });
  }

  // ----- Boolean filters -----
  // RescueGroups expects "1" for true and "0" for false,
  // so we only push filters when the query param equals the string "true".

  if (q.isDogsOk === "true") {
    filters.push({
      fieldName: "animals.isDogsOk",
      operation: "equal",
      criteria: "1",
    });
  }

  if (q.isCatsOk === "true") {
    filters.push({
      fieldName: "animals.isCatsOk",
      operation: "equal",
      criteria: "1",
    });
  }

  if (q.isKidsOk === "true") {
    filters.push({
      fieldName: "animals.isKidsOk",
      operation: "equal",
      criteria: "1",
    });
  }

  if (q.isHousetrained === "true") {
    filters.push({
      fieldName: "animals.isHousetrained",
      operation: "equal",
      criteria: "1",
    });
  }

  if (q.isSpecialNeeds === "true") {
    filters.push({
      fieldName: "animals.isSpecialNeeds",
      operation: "equal",
      criteria: "1",
    });
  }

  if (q.isNeedingFoster === "true") {
    filters.push({
      fieldName: "animals.isNeedingFoster",
      operation: "equal",
      criteria: "1",
    });
  }

  // 🔴 NOTE: intentionally NO breed filters here.
  // Breeds are handled later in our own code (routes/dogs.js).
  return filters;
}

/**
 * Build the "filterRadius" object, which tells RescueGroups
 * how far away (in miles) from a ZIP code we want to search.
 *
 * If the client did not provide a ZIP, we return undefined and
 * skip adding this property entirely.
 *
 * @param {Object} q - The query object (usually req.query)
 * @returns {Object|undefined} - filterRadius object or undefined.
 */
function buildFilterRadius(q) {
  const zip = q.zip;
  const miles = Number(q.miles) || 50; // default radius to 50 miles

  if (!zip) return undefined;

  return { postalcode: zip, miles };
}

/**
 * Search for available dogs that have photos.
 *
 * This function:
 *   - Ensures we have an API key
 *   - Builds filters (sex, ageGroup, sizeGroup, booleans...)
 *   - Optionally adds a radius filter around a ZIP code
 *   - Calls the RescueGroups search endpoint
 *   - Returns the raw JSON data from RescueGroups
 *
 * Breed filtering is done **later** in our own route logic.
 *
 * @param {Object} query - Query parameters from the client
 * @returns {Promise<Object>} - RescueGroups API response data
 */
export async function searchAvailableDogs(query) {
  // If we don't have an API key, something is wrong with our configuration.
  if (!API_KEY) {
    // We throw a plain object because our Express error handler
    // expects an object with "status" and "message".
    throw { status: 500, message: "Missing RESCUEGROUPS_API_KEY" };
  }

  const url = `${RG_API_BASE}/public/animals/search/available/dogs/haspic`;

  // RescueGroups uses the API key in the Authorization header.
  const headers = {
    Authorization: API_KEY,
    "Content-Type": "application/vnd.api+json",
  };

  // If the user selected specific breeds, we may want to pull
  // more results and then filter down locally.
  const breedsSelected = toArray(query.breeds);
  const hasBreedFilter = breedsSelected.length > 0;

  // Keep limits reasonable but still large enough for "load more" behavior.
  // If we have a breed filter, pull more so we have enough to filter down.
  const apiLimit = hasBreedFilter ? 200 : 150;
  const page = 1; // For now we only request the first page.

  const filters = buildFiltersFromQuery(query);
  const filterRadius = buildFilterRadius(query);

  // This is the request body expected by RescueGroups.
  // "filters" and "filterRadius" control *which* animals we get back.
  const body = {
    data: {
      filters,
      // Only add filterRadius if we actually have a zip code.
      ...(filterRadius ? { filterRadius } : {}),
    },
    include: ["pictures", "locations"], // ask for related photos + location data
    // We do NOT restrict fields so we have full info to work with later.
    sort: ["animals.distance"], // closest animals first
  };

  // DEBUG LOGS:
  // If you ever need to see what's being sent, uncomment these.
  // console.log("🐶 searchAvailableDogs query:", query);
  // console.log("🐶 body.data.filters:", JSON.stringify(body.data.filters, null, 2));
  // console.log("🐶 body.data.filterRadius:", body.data.filterRadius);
  // console.log("🐶 apiLimit used:", apiLimit);

  try {
    const resp = await axios.post(url, body, {
      headers,
      params: { limit: apiLimit, page },
    });

    // We return ONLY the data portion. The route that calls this
    // is responsible for mapping / transforming the data into
    // the shape the frontend expects.
    return resp.data;
  } catch (err) {
    // If RescueGroups gives us an error response, log it for the server
    // and throw a simplified object for our error handler.
    console.error("🚨 RescueGroups error:", err.response?.data || err.message);

    throw {
      status: err.response?.status || 500,
      message: JSON.stringify(err.response?.data || err.message),
    };
  }
}

/**
 * Fetch a single dog by its RescueGroups ID.
 *
 * This is used on the "dog detail" page when a user clicks
 * on a specific dog card to see more information.
 *
 * @param {string|number} id - RescueGroups animal ID
 * @returns {Promise<Object>} - RescueGroups API response data
 */
export async function getDogById(id) {
  if (!API_KEY) {
    throw { status: 500, message: "Missing RESCUEGROUPS_API_KEY" };
  }

  const url = `${RG_API_BASE}/public/animals/${id}`;

  const headers = {
    Authorization: API_KEY,
    "Content-Type": "application/vnd.api+json",
  };

  const resp = await axios.get(url, {
    headers,
    params: {
      include: "pictures,locations", // also fetch related pictures + location
    },
  });

  return resp.data;
}
