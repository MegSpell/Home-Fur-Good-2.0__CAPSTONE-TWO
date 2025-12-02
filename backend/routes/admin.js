// backend/routes/admin.js
// ------------------------------------------------------------
// Admin-only routes.
//
// In a real production app, you'd protect these with middleware
// that checks if the current user is an admin before allowing
// access. For this demo, these routes expose:
//
//   GET    /admin/users      -> overview of all users + their favorites
//   GET    /admin/favorites  -> global favorite counts per dog
//   DELETE /admin/users/:username -> delete a user
//
// These routes are mainly for analytics / admin panels and are
// NOT used by regular end-users directly.
// ------------------------------------------------------------

import express from "express";
import db from "../db.js";

const router = new express.Router();

/**
 * GET /admin/users
 *
 * Returns a list of all users with their basic info and favorite dogs.
 *
 * Response shape:
 *   {
 *     users: [
 *       {
 *         username,
 *         email,
 *         zipcode,
 *         isAdmin,
 *         favorites: [ "dogId1", "dogId2", ... ],
 *         favoritesCount: number
 *       },
 *       ...
 *     ]
 *   }
 *
 * How it works:
 *   - We LEFT JOIN users with favorites
 *   - ARRAY_AGG collects all dog_ids for each user into an array
 *   - COUNT(f.dog_id) tells us how many favorites they have
 */
router.get("/users", async (req, res, next) => {
  try {
    const result = await db.query(
      `
      SELECT 
        u.username,
        u.email,
        u.zipcode,
        u.is_admin,
        COALESCE(
          ARRAY_AGG(f.dog_id) FILTER (WHERE f.dog_id IS NOT NULL),
          '{}'::text[]
        ) AS favorites,
        COUNT(f.dog_id) AS favorites_count
      FROM users AS u
      LEFT JOIN favorites AS f
        ON f.username = u.username
      GROUP BY u.username, u.email, u.zipcode, u.is_admin
      ORDER BY u.username
      `
    );

    // Map raw DB rows into a nicer, frontend-friendly shape.
    const users = result.rows.map((row) => ({
      username: row.username,
      email: row.email,
      zipcode: row.zipcode || "",               // fall back to empty string
      isAdmin: row.is_admin,                    // keep as boolean
      favorites: row.favorites || [],           // array of dog IDs
      favoritesCount: Number(row.favorites_count) || 0, // ensure it's a number
    }));

    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /admin/favorites
 *
 * Returns a global count of favorites per dog.
 *
 * Response shape:
 *   {
 *     counts: {
 *       "dogId1": 3,
 *       "dogId2": 10,
 *       ...
 *     }
 *   }
 *
 * This is useful for:
 *   - Showing popularity stats
 *   - Building "Least Loved" or "Most Loved" features
 */
router.get("/favorites", async (req, res, next) => {
  try {
    const result = await db.query(
      `
      SELECT dog_id, COUNT(*) AS count
        FROM favorites
       GROUP BY dog_id
       ORDER BY COUNT(*) ASC
      `
    );

    const counts = {};
    for (let row of result.rows) {
      counts[row.dog_id] = Number(row.count);
    }

    return res.json({ counts });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /admin/users/:username
 *
 * Deletes a user from the database.
 *
 * Response on success:
 *   { deleted: "username" }
 *
 * If the user does not exist:
 *   - We pass an error object to `next()`
 *   - The global errorHandler will send back:
 *       {
 *         error: {
 *           message: "User not found",
 *           status: 404
 *         }
 *       }
 */
router.delete("/users/:username", async (req, res, next) => {
  try {
    const { username } = req.params;

    const result = await db.query(
      `
      DELETE FROM users
       WHERE username = $1
       RETURNING username
      `,
      [username]
    );

    // If no rows were returned, that means there was no user
    // with this username to delete.
    if (result.rowCount === 0) {
      // Let the global error handler format the JSON error response.
      return next({ status: 404, message: "User not found" });
    }

    return res.json({ deleted: username });
  } catch (err) {
    return next(err);
  }
});

export default router;










//=========before comments========
// // backend/routes/admin.js
// import express from "express";
// import db from "../db.js";

// const router = new express.Router();

// /**
//  * GET /admin/users
//  * -> {
//  *   users: [
//  *     {
//  *       username,
//  *       email,
//  *       zipcode,
//  *       isAdmin,
//  *       favorites: [dogId, ...],
//  *       favoritesCount: number
//  *     }
//  *   ]
//  * }
//  */
// router.get("/users", async (req, res, next) => {
//   try {
//     const result = await db.query(
//       `
//       SELECT 
//         u.username,
//         u.email,
//         u.zipcode,
//         u.is_admin,
//         COALESCE(
//           ARRAY_AGG(f.dog_id) FILTER (WHERE f.dog_id IS NOT NULL),
//           '{}'::text[]
//         ) AS favorites,
//         COUNT(f.dog_id) AS favorites_count
//       FROM users AS u
//       LEFT JOIN favorites AS f
//         ON f.username = u.username
//       GROUP BY u.username, u.email, u.zipcode, u.is_admin
//       ORDER BY u.username
//       `
//     );

//     const users = result.rows.map((row) => ({
//       username: row.username,
//       email: row.email,
//       zipcode: row.zipcode || "",
//       isAdmin: row.is_admin,
//       favorites: row.favorites || [],
//       favoritesCount: Number(row.favorites_count) || 0,
//     }));

//     return res.json({ users });
//   } catch (err) {
//     return next(err);
//   }
// });

// /**
//  * GET /admin/favorites
//  * -> { counts: { dogId: count, ... } }
//  */
// router.get("/favorites", async (req, res, next) => {
//   try {
//     const result = await db.query(
//       `
//       SELECT dog_id, COUNT(*) AS count
//       FROM favorites
//       GROUP BY dog_id
//       ORDER BY COUNT(*) ASC
//       `
//     );

//     const counts = {};
//     for (let row of result.rows) {
//       counts[row.dog_id] = Number(row.count);
//     }

//     return res.json({ counts });
//   } catch (err) {
//     return next(err);
//   }
// });

// /**
//  * DELETE /admin/users/:username
//  * -> { deleted: username }
//  */
// router.delete("/users/:username", async (req, res, next) => {
//   try {
//     const { username } = req.params;

//     const result = await db.query(
//       `DELETE FROM users
//        WHERE username = $1
//        RETURNING username`,
//       [username]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     return res.json({ deleted: username });
//   } catch (err) {
//     return next(err);
//   }
// });

// export default router;





