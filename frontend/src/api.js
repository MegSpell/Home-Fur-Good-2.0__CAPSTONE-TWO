// src/api.js
// -----------------------------------------------------------
// CENTRAL API HELPER FILE
//
// This file is the “bridge” between your React frontend
// and your Express backend.
//
// Instead of calling fetch() or axios() all over your app,
// we define reusable functions here:
//   - searchDogs()
//   - getDog()
//   - signup(), login()
//   - favorites helpers (add/remove/get)
//   - admin helpers
//   - profile helpers
//
// The whole frontend imports these functions — that way,
// if the backend URL changes, or you add headers/tokens,
// you ONLY change things here.
// -----------------------------------------------------------

import axios from "axios";

// -----------------------------------------------------------
// BASE URL
// The backend server location.
//
// VITE_BACKEND_URL comes from your .env file in Vite:
//   VITE_BACKEND_URL="https://yourapp.com"
// If it's NOT set, we fall back to localhost.
// -----------------------------------------------------------
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// -----------------------------------------------------------
// AXIOS INSTANCE
// Instead of writing axios.get(BASE_URL + "...") every time,
// we create an axios "client" with the base URL built in.
// -----------------------------------------------------------
const client = axios.create({
  baseURL: BASE_URL,
});

// -----------------------------------------------------------
// buildQuery(params)
// Turns an object into a clean querystring.
// Example:
//   { zip: "01844", sex: "Female" }
// becomes:
//   "zip=01844&sex=Female"
//
// It SKIPS empty values so URLs stay clean.
// It handles arrays like breeds: ["Pug", "Beagle"]
// -----------------------------------------------------------
function buildQuery(params = {}) {
  const search = new URLSearchParams();

  for (let [key, val] of Object.entries(params)) {
    // Skip empty/undefined values
    if (val === undefined || val === null || val === "") continue;

    // Special case: arrays → multiple ?key=value
    if (Array.isArray(val)) {
      for (let item of val) {
        search.append(key, item);
      }
    } else {
      search.set(key, val);
    }
  }

  return search.toString();
}

// ===========================================================
// DOG SEARCH + DOG DETAILS
// ===========================================================

/** Search dogs using backend route GET /dogs */
export async function searchDogs(params = {}) {
  // Convert filters → querystring
  const qs = buildQuery(params);

  // Use fetch because it's lightweight for GETs
  const resp = await fetch(`${BASE_URL}/dogs?${qs}`);

  if (!resp.ok) {
    // We read the text so error messages are meaningful
    const text = await resp.text();
    throw new Error(
      `searchDogs failed: ${resp.status} ${resp.statusText} - ${text}`
    );
  }

  // Backend returns JSON: { dogs: [...], total, page }
  return await resp.json();
}

/** Get details for ONE dog: GET /dogs/:id */
export async function getDog(id) {
  const resp = await fetch(`${BASE_URL}/dogs/${id}`);

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(
      `getDog failed: ${resp.status} ${resp.statusText} - ${text}`
    );
  }

  return await resp.json();
}

/** Get list of breeds for the dropdown */
export async function getBreeds() {
  const resp = await fetch(`${BASE_URL}/breeds`);

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(
      `getBreeds failed: ${resp.status} ${resp.statusText} - ${text}`
    );
  }

  const data = await resp.json();

  // Backend might return:
  //   { breeds: ["Pug", "Husky", ...] }
  if (Array.isArray(data?.breeds)) return data.breeds;

  // OR maybe a direct array:
  if (Array.isArray(data)) return data;

  return [];
}

// ===========================================================
// AUTH: SIGNUP + LOGIN
// ===========================================================

/** POST /auth/signup → create account */
export async function signup({ username, password, email, zipcode }) {
  const resp = await client.post("/auth/signup", {
    username,
    password,
    email,
    zipcode,
  });

  // Backend returns { user: {...}}
  return resp.data.user;
}

/** POST /auth/login → return user info */
export async function login({ username, password }) {
  const resp = await client.post("/auth/login", { username, password });
  return resp.data.user;
}

// ===========================================================
// FAVORITES
// (These connect with backend routes under /favorites)
// ===========================================================

/** POST /favorites → add a favorite dog for a user */
export async function addFavorite(username, dogId) {
  const resp = await client.post("/favorites", { username, dogId });
  return resp.data;
}

/** DELETE /favorites → remove a specific favorite */
export async function removeFavorite(username, dogId) {
  const resp = await client.delete("/favorites", {
    data: { username, dogId }, // axios requires DELETE body under `data`
  });
  return resp.data;
}

/** GET /favorites/:username → list of dog IDs user favorited */
export async function getFavorites(username) {
  const resp = await client.get(`/favorites/${username}`);
  return resp.data.favorites || [];
}

/** GET /favorites/least?limit=n → global least-favorited list */
export async function getLeastFavorited(limit = 3) {
  const resp = await client.get(`/favorites/least?limit=${limit}`);
  return resp.data.least;
}

/** GET /favorites → public counts { dogId: count, ... } */
export async function getFavoriteCountsPublic() {
  const resp = await client.get("/favorites");
  return resp.data.counts || {};
}

// ===========================================================
// ADMIN ENDPOINTS
//
// These hit routes under /admin/... and require the user
// to be an admin (your backend protects these routes).
// ===========================================================

/** GET /admin/users → all users + their favorite counts */
export async function getAllUsers() {
  const res = await client.get("/admin/users");
  return res.data.users;
}

/** GET /admin/favorites → global favorite counts */
export async function getFavoriteCountsAdmin() {
  const res = await client.get("/admin/favorites");
  return res.data.counts;
}

/** Duplicate helper (safe to keep) */
export async function adminGetFavoriteSummary() {
  const res = await client.get("/admin/favorites");
  return res.data.counts;
}

/** PATCH /admin/users/:username → update fields (ex: make admin) */
export async function adminUpdateUser(username, data) {
  const res = await client.patch(`/admin/users/${username}`, data);
  return res.data;
}

/** DELETE /admin/users/:username */
export async function adminDeleteUser(username) {
  const res = await client.delete(`/admin/users/${username}`);
  return res.data;
}

// ===========================================================
// PROFILE ENDPOINTS
// GET /profile/:username
// PATCH /profile/:username
//
// Your backend handles saving + returning real user data.
// ===========================================================

/** GET /profile/:username → user profile details */
export async function getProfile(username) {
  const resp = await client.get(`/profile/${username}`);
  return resp.data.user;
}

/** PATCH /profile/:username → update certain fields */
export async function updateProfile(username, data) {
  const resp = await client.patch(`/profile/${username}`, data);
  return resp.data.user;
}

