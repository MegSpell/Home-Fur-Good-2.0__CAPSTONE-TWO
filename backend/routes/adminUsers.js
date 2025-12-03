// backend/routes/adminUsers.js
// ------------------------------------------------------------
// Admin-only user management routes.
//
// This router currently supports:
//
//   PATCH /admin/users/:username
//     - Update a user's:
//         * username
//         * email
//         * zipcode
//         * password (optional, for reset)
//
// In a real production app, you would protect these routes with
// authentication + authorization middleware that ensures the
// current user is an admin before allowing these changes.
// ------------------------------------------------------------

import express from "express";
import db from "../db.js";
import bcrypt from "bcrypt";

const router = new express.Router();

// Same work factor as the regular user model.
// Higher = more secure but slower. 12 is a solid default.
const BCRYPT_WORK_FACTOR = 12;

/**
 * PATCH /admin/users/:username
 *
 * Request params:
 *   :username -> the current username of the user being edited
 *
 * Request body can include:
 *   {
 *     newUsername,   // optional (rename user)
 *     email,         // optional
 *     zipcode,       // optional
 *     password       // optional (reset password)
 *   }
 *
 * Response on success:
 *   {
 *     user: {
 *       username,
 *       email,
 *       zipcode,
 *       isAdmin
 *     }
 *   }
 *
 * Notes:
 *   - We build the SQL query dynamically so we can update
 *     only the fields that were actually provided.
 *   - If NO valid fields are provided, we return a 400 error.
 *   - If the user doesn't exist, we return a 404 error.
 */
router.patch("/users/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const { newUsername, email, zipcode, password } = req.body;

    // We will build a dynamic SET clause like:
    //   "username = $1, email = $2, zipcode = $3"
    const fields = [];
    const values = [];
    let idx = 1;

    // In the admin form, newUsername is typically required,
    // but we still treat it as optional logic-wise.
    if (newUsername) {
      fields.push(`username = $${idx++}`);
      values.push(newUsername);
    }

    if (email) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }

    // Zipcode can be an empty string ("") if the admin clears it.
    // Because empty string is "falsy", we check for undefined instead
    // so that "" is still treated as a valid value to save.
    if (zipcode !== undefined) {
      fields.push(`zipcode = $${idx++}`);
      values.push(zipcode);
    }

    // If a new password is provided, hash it before storing.
    if (password) {
      const hashed = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      fields.push(`password_hash = $${idx++}`);
      values.push(hashed);
    }

    // If no fields were provided to update, this is a bad request.
    if (fields.length === 0) {
      // Use the global error handler for consistent error shape.
      return next({ status: 400, message: "No valid fields to update" });
    }

    // Add the original username as the last parameter, so we can use it
    // in the WHERE clause to select the user to update.
    values.push(username);

    const query = `
      UPDATE users
         SET ${fields.join(", ")}
       WHERE username = $${idx}
       RETURNING username, email, zipcode, is_admin
    `;

    const result = await db.query(query, values);

    // If no rows were returned, then there was no user with that username.
    if (result.rowCount === 0) {
      return next({ status: 404, message: "User not found" });
    }

    const row = result.rows[0];

    return res.json({
      user: {
        username: row.username,
        email: row.email,
        zipcode: row.zipcode,
        isAdmin: row.is_admin,
      },
    });
  } catch (err) {
    // Pass any unexpected errors to the global error handler.
    return next(err);
  }
});

export default router;

