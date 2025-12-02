// backend/routes/auth.js
// ------------------------------------------------------------
// Routes for authentication-related actions:
//
//   POST /auth/signup  -> create a new user account
//   POST /auth/login   -> verify credentials and "log in"
//
// NOTE:
//   This app does not use JWTs or sessions yet — the frontend
//   simply stores the returned user object in context/state.
// ------------------------------------------------------------

import express from "express";
import bcrypt from "bcrypt";
import db from "../db.js";

const router = new express.Router();

// Work factor controls how expensive the hash is.
// Higher = more secure but slower.
// 12 is a common, solid choice for web apps.
const BCRYPT_WORK_FACTOR = 12;

/**
 * POST /auth/signup
 *
 * Body should look like:
 *   {
 *     "username": "meg",
 *     "password": "supersecret",
 *     "email": "meg@example.com",
 *     "zipcode": "01938"    // optional
 *   }
 *
 * Response on success (201 Created):
 *   {
 *     "user": {
 *       "username": "meg",
 *       "email": "meg@example.com",
 *       "zipcode": "01938",
 *       "isAdmin": false
 *     }
 *   }
 */
router.post("/signup", async (req, res, next) => {
  try {
    const { username, password, email, zipcode } = req.body;

    // Basic validation: these three fields are required.
    // (You could add stronger validation with a schema library later.)
    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ error: "username, password, and email are required" });
    }

    // Hash the plain text password before saving it to the DB.
    // We never store plain text passwords.
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `
      INSERT INTO users (username, password_hash, email, zipcode, is_admin)
      VALUES ($1, $2, $3, $4, FALSE)
      RETURNING username, email, zipcode, is_admin
      `,
      [username, hashedPassword, email, zipcode || null]
    );

    const row = result.rows[0];

    const user = {
      username: row.username,
      email: row.email,
      zipcode: row.zipcode,
      isAdmin: row.is_admin,
    };

    // 201 = "Created" (standard for successful resource creation)
    return res.status(201).json({ user });
  } catch (err) {
    // 23505 = unique_violation in Postgres.
    // Likely triggered if the username or email already exists.
    if (err.code === "23505") {
      return res.status(400).json({ error: "Username already taken" });
    }

    // For anything else, let the global error handler deal with it.
    return next(err);
  }
});

/**
 * POST /auth/login
 *
 * Body should look like:
 *   {
 *     "username": "meg",
 *     "password": "supersecret"
 *   }
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
 * NOTE:
 *   We deliberately do NOT tell the client whether the username
 *   or password was wrong — just "Invalid username or password".
 *   This is a common security practice.
 */
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Make sure both fields were provided.
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username and password are required" });
    }

    // Look up the user by username.
    // We need the stored password_hash to compare with bcrypt.
    const result = await db.query(
      `
      SELECT username,
             password_hash,
             email,
             zipcode,
             is_admin
        FROM users
       WHERE username = $1
      `,
      [username]
    );

    const row = result.rows[0];

    // If no user is found, we still send a generic "Invalid" message.
    if (!row) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Compare the plain text password from the request with
    // the hashed password from the DB.
    const isValid = await bcrypt.compare(password, row.password_hash);

    if (!isValid) {
      // Same generic message to avoid hinting which part is wrong.
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const user = {
      username: row.username,
      email: row.email,
      zipcode: row.zipcode,
      isAdmin: row.is_admin,
    };

    // If we had JWTs, we'd create a token here.
    // For this app, we just send the user info back.
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

export default router;







//========before comments=======
// // backend/routes/auth.js
// import express from "express";
// import bcrypt from "bcrypt";
// import db from "../db.js";

// const router = new express.Router();

// const BCRYPT_WORK_FACTOR = 12;

// /** POST /auth/signup
//  * Body: { username, password, email, zipcode }
//  * -> { user: { username, email, zipcode, isAdmin } }
//  */
// router.post("/signup", async (req, res, next) => {
//   try {
//     const { username, password, email, zipcode } = req.body;

//     if (!username || !password || !email) {
//       return res
//         .status(400)
//         .json({ error: "username, password, and email are required" });
//     }

//     const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

//     const result = await db.query(
//       `INSERT INTO users (username, password_hash, email, zipcode, is_admin)
//        VALUES ($1, $2, $3, $4, FALSE)
//        RETURNING username, email, zipcode, is_admin`,
//       [username, hashedPassword, email, zipcode || null]
//     );

//     const row = result.rows[0];

//     const user = {
//       username: row.username,
//       email: row.email,
//       zipcode: row.zipcode,
//       isAdmin: row.is_admin,
//     };

//     return res.status(201).json({ user });
//   } catch (err) {
//     if (err.code === "23505") {
//       return res.status(400).json({ error: "Username already taken" });
//     }
//     return next(err);
//   }
// });

// /** POST /auth/login
//  * Body: { username, password }
//  * -> { user: { username, email, zipcode, isAdmin } }
//  */
// router.post("/login", async (req, res, next) => {
//   try {
//     const { username, password } = req.body;

//     if (!username || !password) {
//       return res
//         .status(400)
//         .json({ error: "username and password are required" });
//     }

//     const result = await db.query(
//       `SELECT username, password_hash, email, zipcode, is_admin
//          FROM users
//          WHERE username = $1`,
//       [username]
//     );

//     const row = result.rows[0];

//     if (!row) {
//       return res.status(400).json({ error: "Invalid username or password" });
//     }

//     const isValid = await bcrypt.compare(password, row.password_hash);
//     if (!isValid) {
//       return res.status(400).json({ error: "Invalid username or password" });
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




