// backend/models/users.js
// ------------------------------------------------------------
// Database helper functions for working with users.
//
// These functions:
//   - Talk directly to the "users" table in PostgreSQL
//   - Handle secure password hashing when updating passwords
//
// They do NOT:
//   - Handle HTTP requests directly
//   - Know anything about Express or routes
//   - Manage auth tokens (that's handled elsewhere)
//
// Table (simplified):
//   users(
//     username      TEXT PRIMARY KEY,
//     email         TEXT NOT NULL UNIQUE,
//     password_hash TEXT NOT NULL,
//     is_admin      BOOLEAN DEFAULT FALSE,
//     zipcode       TEXT
//   )
// ------------------------------------------------------------

import db from "../db.js";
import bcrypt from "bcrypt";

// The "work factor" controls how expensive the bcrypt hash is.
// Higher = more secure but slower. 12 is a common choice for web apps.
const BCRYPT_WORK_FACTOR = 12;

/**
 * Get a user by username.
 *
 * Returns a user object with:
 *   {
 *     username,
 *     email,
 *     isAdmin,
 *     zipcode
 *   }
 *
 * or `null` if no such user exists.
 *
 * NOTE: We intentionally do NOT return the password_hash here.
 */
export async function getUser(username) {
  const result = await db.query(
    `
    SELECT username,
           email,
           is_admin AS "isAdmin",
           zipcode
      FROM users
     WHERE username = $1
    `,
    [username]
  );

  // If there is no matching user, rows[0] will be undefined,
  // so we return null to make that explicit.
  return result.rows[0] || null;
}

/**
 * Update a user's email, password, and/or zipcode.
 *
 * This function supports "partial" updates:
 *   - If a field is undefined, we don't touch it.
 *   - If a password is provided, we hash it before saving.
 *
 * Steps:
 *   1. Build a dynamic SQL SET clause based on which fields are present.
 *   2. If no fields are provided, just return the current user data.
 *   3. Run the UPDATE and return the updated user (without password).
 *
 * @param {string} username - Which user to update
 * @param {Object} fieldsToUpdate - { email, password, zipcode }
 * @returns {Promise<Object|null>} updated user or null if user doesn’t exist
 */
export async function updateUser(username, { email, password, zipcode }) {
  // We'll collect pieces of the SET clause here, e.g.:
  //   ["email = $1", "zipcode = $2", "password_hash = $3"]
  const fields = [];

  // This will hold the actual values for each $ placeholder.
  const values = [];

  // We'll keep track of the $ index (Postgres uses 1-based indexing).
  let idx = 1;

  // ----- Conditionally update email -----
  // Only update if "email" was explicitly provided (could be empty string
  // in some apps, but usually you'll validate it before this point).
  if (email !== undefined) {
    fields.push(`email = $${idx++}`);
    values.push(email);
  }

  // ----- Conditionally update zipcode -----
  if (zipcode !== undefined) {
    fields.push(`zipcode = $${idx++}`);
    values.push(zipcode);
  }

  // ----- Conditionally update password -----
  // If password is provided AND not an empty string,
  // hash it with bcrypt and update password_hash.
  if (password !== undefined && password !== "") {
    const hashed = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    fields.push(`password_hash = $${idx++}`);
    values.push(hashed);
  }

  // If we didn't get any fields to update (everything was undefined),
  // just fetch and return the existing user record as-is.
  if (fields.length === 0) {
    return await getUser(username);
  }

  // Finally, add the username as the last parameter so we can use it
  // in the WHERE clause to choose which user to update.
  values.push(username);

  const result = await db.query(
    `
    UPDATE users
       SET ${fields.join(", ")}
     WHERE username = $${idx}
     RETURNING username,
               email,
               is_admin AS "isAdmin",
               zipcode
    `,
    values
  );

  // If no user matched the given username, rows[0] will be undefined.
  // Callers can check for null to see if the user existed.
  return result.rows[0] || null;
}







//=========before comments===========

// // backend/models/users.js
// import db from "../db.js";
// import bcrypt from "bcrypt";
// const BCRYPT_WORK_FACTOR = 12;

// export async function getUser(username) {
//   const result = await db.query(
//     `SELECT username, email, is_admin AS "isAdmin", zipcode
//      FROM users
//      WHERE username = $1`,
//     [username]
//   );
//   return result.rows[0] || null;
// }

// export async function updateUser(username, { email, password, zipcode }) {
//   // Build dynamic SQL
//   const fields = [];
//   const values = [];
//   let idx = 1;

//   if (email !== undefined) {
//     fields.push(`email = $${idx++}`);
//     values.push(email);
//   }

//   if (zipcode !== undefined) {
//     fields.push(`zipcode = $${idx++}`);
//     values.push(zipcode);
//   }

//   if (password !== undefined && password !== "") {
//     const hashed = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
//     fields.push(`password_hash = $${idx++}`);
//     values.push(hashed);
//   }

//   if (fields.length === 0) return await getUser(username);

//   values.push(username);

//   const result = await db.query(
//     `
//     UPDATE users
//     SET ${fields.join(", ")}
//     WHERE username = $${idx}
//     RETURNING username, email, is_admin AS "isAdmin", zipcode
//     `,
//     values
//   );

//   return result.rows[0];
// }
