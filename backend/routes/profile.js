// backend/routes/profile.js
// ------------------------------------------------------------
// Routes for viewing and updating a user's own profile.
//
// These routes let the frontend:
//   - Fetch a user's profile info (username, email, zipcode, isAdmin)
//   - Update email / zipcode / password for that user
//
// NOTE:
//   In a production app, you would typically:
//     - Require authentication (logged-in user)
//     - Ensure users can *only* update their own profile
//       (not someone else’s)
//   For this demo, we trust the :username param directly.
// ------------------------------------------------------------

import express from "express";
import bcrypt from "bcrypt";
import db from "../db.js";

const router = new express.Router();
const BCRYPT_WORK_FACTOR = 12;

/**
 * GET /profile/:username
 *
 * Example:
 *   GET /profile/meg
 *
 * Response on success:
 *   {
 *     "user": {
 *       "username": "meg",
 *       "email": "meg@example.com",
 *       "zipcode": "01938",
 *       "isAdmin": false
 *     }
 *   }
 *
 * If the user does not exist:
 *   { "error": "User not found" } with status 404
 */
router.get("/:username", async (req, res, next) => {
  try {
    const { username } = req.params;

    const result = await db.query(
      `
      SELECT username,
             email,
             zipcode,
             is_admin
        FROM users
       WHERE username = $1
      `,
      [username]
    );

    const row = result.rows[0];

    if (!row) {
      // Here we send a simple shape instead of going through the global
      // error handler because the frontend expects { error: "..." }.
      return res.status(404).json({ error: "User not found" });
    }

    const user = {
      username: row.username,
      email: row.email,
      zipcode: row.zipcode,
      isAdmin: row.is_admin,
    };

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /profile/:username
 *
 * Request body can include any of:
 *   {
 *     "email":   "new-email@example.com",
 *     "zipcode": "01938",
 *     "password": "newPassword123"   // optional
 *   }
 *
 * Response on success:
 *   {
 *     "user": {
 *       "username": "...",
 *       "email": "...",
 *       "zipcode": "...",
 *       "isAdmin": false
 *     }
 *   }
 *
 * Notes:
 *   - We support "partial updates": any combination of fields is allowed.
 *   - If the password is provided, we hash it before saving.
 *   - If *no* fields are provided, we just re-fetch and return the
 *     existing user instead of throwing an error.
 */
router.patch("/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const { email, zipcode, password } = req.body;

    // We'll build a dynamic SQL SET clause based on which fields
    // were actually provided in the request.
    const fields = [];
    const values = [];
    let idx = 1;

    // --- Conditionally update email ---
    // We check against undefined so that an empty string is still
    // considered a valid value (for example, if you allowed clearing it).
    if (email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }

    // --- Conditionally update zipcode ---
    // If zipcode is undefined, we don't touch that column.
    // If it's provided (even as ""), we store it.
    if (zipcode !== undefined) {
      fields.push(`zipcode = $${idx++}`);
      values.push(zipcode || null); // store null if empty string
    }

    // --- Conditionally update password ---
    // If password is provided and not empty, hash it with bcrypt
    // and update the password_hash field.
    if (password) {
      const hashed = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      fields.push(`password_hash = $${idx++}`);
      values.push(hashed);
    }

    // If nothing was provided to update (fields array is empty),
    // we don't run an UPDATE at all. Instead, we just re-fetch and
    // return the existing user.
    if (fields.length === 0) {
      const existing = await db.query(
        `
        SELECT username,
               email,
               zipcode,
               is_admin
          FROM users
         WHERE username = $1
        `,
        [username]
      );

      const row = existing.rows[0];

      if (!row) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = {
        username: row.username,
        email: row.email,
        zipcode: row.zipcode,
        isAdmin: row.is_admin,
      };

      return res.json({ user });
    }

    // If we DO have fields to update, append the username as the final
    // parameter for the WHERE clause.
    values.push(username);

    const result = await db.query(
      `
      UPDATE users
         SET ${fields.join(", ")}
       WHERE username = $${idx}
       RETURNING username,
                 email,
                 zipcode,
                 is_admin
      `,
      values
    );

    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = {
      username: row.username,
      email: row.email,
      zipcode: row.zipcode,
      isAdmin: row.is_admin,
    };

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

export default router;





//===== before comments ========
// // backend/routes/profile.js
// import express from "express";
// import bcrypt from "bcrypt";
// import db from "../db.js";

// const router = new express.Router();
// const BCRYPT_WORK_FACTOR = 12;

// /** GET /profile/:username
//  * -> { user: { username, email, zipcode, isAdmin } }
//  */
// router.get("/:username", async (req, res, next) => {
//   try {
//     const { username } = req.params;

//     const result = await db.query(
//       `SELECT username, email, zipcode, is_admin
//          FROM users
//          WHERE username = $1`,
//       [username]
//     );

//     const row = result.rows[0];
//     if (!row) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const user = {
//       username: row.username,
//       email: row.email,
//       zipcode: row.zipcode,
//       isAdmin: row.is_admin,
//     };

//     return res.json({ user });
//   } catch (err) {
//     return next(err);
//   }
// });

// /** PATCH /profile/:username
//  * Body can include: { email, zipcode, password }
//  * -> { user: { username, email, zipcode, isAdmin } }
//  */
// router.patch("/:username", async (req, res, next) => {
//   try {
//     const { username } = req.params;
//     const { email, zipcode, password } = req.body;

//     const fields = [];
//     const values = [];
//     let idx = 1;

//     if (email !== undefined) {
//       fields.push(`email = $${idx++}`);
//       values.push(email);
//     }

//     if (zipcode !== undefined) {
//       fields.push(`zipcode = $${idx++}`);
//       values.push(zipcode || null);
//     }

//     if (password) {
//       const hashed = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
//       fields.push(`password_hash = $${idx++}`);
//       values.push(hashed);
//     }

//     // If nothing to update, just re-select the user
//     if (fields.length === 0) {
//       const existing = await db.query(
//         `SELECT username, email, zipcode, is_admin
//            FROM users
//            WHERE username = $1`,
//         [username]
//       );
//       const row = existing.rows[0];
//       if (!row) {
//         return res.status(404).json({ error: "User not found" });
//       }

//       const user = {
//         username: row.username,
//         email: row.email,
//         zipcode: row.zipcode,
//         isAdmin: row.is_admin,
//       };

//       return res.json({ user });
//     }

//     values.push(username);

//     const result = await db.query(
//       `
//       UPDATE users
//       SET ${fields.join(", ")}
//       WHERE username = $${idx}
//       RETURNING username, email, zipcode, is_admin
//       `,
//       values
//     );

//     const row = result.rows[0];
//     if (!row) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const user = {
//       username: row.username,
//       email: row.email,
//       zipcode: row.zipcode,
//       isAdmin: row.is_admin,
//     };

//     return res.json({ user });
//   } catch (err) {
//     return next(err);
//   }
// });

// export default router;
