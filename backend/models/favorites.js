// backend/models/favorites.js
// ------------------------------------------------------------
// This file contains database helper functions for the
// "favorites" feature of the app.
//
// These functions talk directly to the PostgreSQL database
// using parameterized SQL queries (via our db connection).
//
// They DO NOT:
//   - Handle HTTP requests
//   - Know anything about Express routes
//   - Transform API data
//
// Their ONLY job is to read/write favorite records in the DB.
//
// Table shape:
//   favorites(
//     username TEXT REFERENCES users(username),
//     dog_id   TEXT NOT NULL,
//     PRIMARY KEY (username, dog_id)
//   )
// ------------------------------------------------------------

import db from "../db.js";

/**
 * Add a favorite record for a user.
 *
 * - Inserts (username, dogId) into the favorites table.
 * - Uses ON CONFLICT DO NOTHING so:
 *     * If the user already favorited the dog → no error
 *     * Keeps us from inserting duplicates
 *
 * @param {string} username - The user who is favoriting a dog
 * @param {string} dogId - The RescueGroups dog ID
 */
export async function addFavorite(username, dogId) {
  await db.query(
    `
    INSERT INTO favorites (username, dog_id)
    VALUES ($1, $2)
    ON CONFLICT (username, dogId) DO NOTHING
    `,
    [username, dogId]
  );
}

/**
 * Remove a favorite record for a user.
 *
 * - Deletes exactly one row matching the user + dog combo.
 * - If the row doesn't exist, DELETE simply removes 0 rows
 *   (which is fine — no error).
 */
export async function removeFavorite(username, dogId) {
  await db.query(
    `
    DELETE FROM favorites
     WHERE username = $1
       AND dog_id = $2
    `,
    [username, dogId]
  );
}

/**
 * Get all favorite dog IDs for a single user.
 *
 * - Returns an array like: ["12345", "67890", ...]
 * - Sorted by dogId just so the output is consistent/predictable.
 *
 * @returns {Array<string>} list of dog IDs
 */
export async function getFavoritesForUser(username) {
  const result = await db.query(
    `
    SELECT dog_id AS "dogId"
      FROM favorites
     WHERE username = $1
     ORDER BY dog_id
    `,
    [username]
  );

  // result.rows looks like: [ { dog_id: "123" }, { dogId: "789" }, ... ]
  return result.rows.map(r => r.dogId);
}

/**
 * Get global favorite counts for ALL dogs.
 *
 * Returns an object shaped like:
 *   {
 *     "123": 5,
 *     "456": 12,
 *     "999": 1
 *   }
 *
 * This helps with features like:
 *   - Showing popularity of dogs
 *   - Spotlighting "least favorited" dogs
 */
export async function getFavoriteCounts() {
  const result = await db.query(
    `
    SELECT dog_id AS "dogId",
           COUNT(*)::int AS count
      FROM favorites
     GROUP BY dog_id
    `
  );

  // Convert rows into a dictionary for quick lookup
  const counts = {};
  for (let row of result.rows) {
    counts[row.dogId] = row.count;
  }
  return counts;
}

/**
 * Get the least-favorited dogs.
 *
 * - Useful for the "Least Loved Spotlight" feature.
 * - Orders results by count ASC (lowest first).
 * - Limit defaults to 3 (top three least-liked dogs).
 *
 * Returns objects shaped like:
 *   [ { dog_id: "123", count: 0 }, { dog_id: "456", count: 1 }, ... ]
 *
 * @param {number} limit - Number of dogs to return
 * @returns {Array<{ dogId: string, count: number }>}
 */
export async function getLeastFavorited(limit = 3) {
  const result = await db.query(
    `
    SELECT dog_id AS "dogId",
           COUNT(*)::int AS count
      FROM favorites
     GROUP BY dog_id
     ORDER BY count ASC
     LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}





