// backend/routes/favorites.js
// ------------------------------------------------------------
// Routes for the "favorites" feature.
//
// These routes let the frontend:
//   - Add/remove a favorite dog for a user
//   - Fetch a user's favorites
//   - Get global favorite counts (for admin + spotlight)
//   - Get "least favorited" dogs (by count in the DB)
//
// NOTE:
//   These routes trust the `username` provided in the body/params.
//   In a production app, you would usually:
//     - Use authentication (JWT/cookies)
//     - Derive the username from the logged-in user
// ------------------------------------------------------------

import express from "express";
import {
  addFavorite,
  removeFavorite,
  getFavoritesForUser,
  getFavoriteCounts,
  getLeastFavorited,
} from "../models/favorites.js";

const router = new express.Router();

/**
 * POST /favorites
 *
 * Body:
 *   {
 *     "username": "meg",
 *     "dogId": "1234567"
 *   }
 *
 * Response:
 *   {
 *     "favorited": true,
 *     "favorites": ["1234567", "8901234", ...]
 *   }
 *
 * Behavior:
 *   - Adds (username, dogId) to the favorites table.
 *   - Uses the model's ON CONFLICT logic, so adding the same
 *     favorite twice is harmless.
 *   - Returns the *updated* list of favorites for that user.
 */
router.post("/", async (req, res, next) => {
  try {
    const { username, dogId } = req.body;

    if (!username || !dogId) {
      return res
        .status(400)
        .json({ error: "username and dogId are required" });
    }

    // Convert dogId to string just to be consistent,
    // since IDs from RescueGroups are strings.
    await addFavorite(username, String(dogId));

    // Fetch updated favorites list for this user.
    const favorites = await getFavoritesForUser(username);

    return res.json({ favorited: true, favorites });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /favorites
 *
 * Body:
 *   {
 *     "username": "meg",
 *     "dogId": "1234567"
 *   }
 *
 * Response:
 *   {
 *     "favorited": false,
 *     "favorites": ["8901234", ...]
 *   }
 *
 * Behavior:
 *   - Removes (username, dogId) from the favorites table.
 *   - If it didn't exist, the delete just affects 0 rows (no error).
 *   - Returns the *updated* list of favorites for that user.
 */
router.delete("/", async (req, res, next) => {
  try {
    const { username, dogId } = req.body;

    if (!username || !dogId) {
      return res
        .status(400)
        .json({ error: "username and dogId are required" });
    }

    await removeFavorite(username, String(dogId));

    const favorites = await getFavoritesForUser(username);

    return res.json({ favorited: false, favorites });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /favorites/least?limit=3
 *
 * Query params:
 *   limit (optional, default = 3)
 *
 * Response:
 *   {
 *     "least": [
 *       { "dog_id": "123", "count": 1 },
 *       { "dog_id": "456", "count": 2 },
 *       ...
 *     ]
 *   }
 *
 * IMPORTANT:
 *   - This only includes dogs that have at least *one* favorite.
 *   - Dogs with zero favorites don't appear in this list because
 *     there is no row for them in the favorites table.
 *
 * Your "Least Loved Spotlight" feature can combine:
 *   - This endpoint (to know which dogs get some favorites)
 *   - A local search of adoptable dogs
 *   - Logic in the frontend to prioritize dogs with low counts
 */
router.get("/least", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 3;
    const least = await getLeastFavorited(limit);
    return res.json({ least });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /favorites
 *
 * Response:
 *   {
 *     "counts": {
 *       "dogId1": 5,
 *       "dogId2": 12,
 *       ...
 *     }
 *   }
 *
 * This is useful for:
 *   - Admin dashboards
 *   - Spotlighting the "least loved" or "most loved" dogs
 *   - Displaying favorite counts next to dog cards (if desired)
 */
router.get("/", async (req, res, next) => {
  try {
    const counts = await getFavoriteCounts();
    return res.json({ counts });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /favorites/:username
 *
 * Example:
 *   GET /favorites/meg
 *
 * Response:
 *   {
 *     "favorites": ["123", "456", "789"]
 *   }
 *
 * This is used by:
 *   - The frontend to know which dogs to display as "hearted"
 *   - The logged-in user's "My Favorites" page
 */
router.get("/:username", async (req, res, next) => {
  try {
    const username = req.params.username;
    const favorites = await getFavoritesForUser(username);
    return res.json({ favorites });
  } catch (err) {
    return next(err);
  }
});

export default router;







//====== before comments========

// // backend/routes/favorites.js
// import express from "express";
// import {
//   addFavorite,
//   removeFavorite,
//   getFavoritesForUser,
//   getFavoriteCounts,
//   getLeastFavorited,
// } from "../models/favorites.js";

// const router = new express.Router();

// /**
//  * POST /favorites
//  * Body: { username, dogId }
//  * -> { favorited: true, favorites: [dogId, ...] }
//  */
// router.post("/", async (req, res, next) => {
//   try {
//     const { username, dogId } = req.body;
//     if (!username || !dogId) {
//       return res
//         .status(400)
//         .json({ error: "username and dogId are required" });
//     }

//     await addFavorite(username, String(dogId));
//     const favorites = await getFavoritesForUser(username);
//     return res.json({ favorited: true, favorites });
//   } catch (err) {
//     return next(err);
//   }
// });

// /**
//  * DELETE /favorites
//  * Body: { username, dogId }
//  * -> { favorited: false, favorites: [...] }
//  */
// router.delete("/", async (req, res, next) => {
//   try {
//     const { username, dogId } = req.body;
//     if (!username || !dogId) {
//       return res
//         .status(400)
//         .json({ error: "username and dogId are required" });
//     }

//     await removeFavorite(username, String(dogId));
//     const favorites = await getFavoritesForUser(username);
//     return res.json({ favorited: false, favorites });
//   } catch (err) {
//     return next(err);
//   }
// });

// /**
//  * GET /favorites/least?limit=3
//  * -> { least: [ { dogId, count }, ... ] }
//  *
//  * NOTE: This only returns dogs that have at least 1 favorite.
//  * We’ll later layer on "dogs with zero favorites near you"
//  * using search results + /favorites counts on the frontend.
//  */
// router.get("/least", async (req, res, next) => {
//   try {
//     const limit = Number(req.query.limit) || 3;
//     const least = await getLeastFavorited(limit);
//     return res.json({ least });
//   } catch (err) {
//     return next(err);
//   }
// });

// /**
//  * GET /favorites
//  * -> { counts: { dogId: count, ... } }
//  * (Used by admin + welcome spotlight logic)
//  */
// router.get("/", async (req, res, next) => {
//   try {
//     const counts = await getFavoriteCounts();
//     return res.json({ counts });
//   } catch (err) {
//     return next(err);
//   }
// });

// /**
//  * GET /favorites/:username
//  * -> { favorites: [dogId, ...] }
//  */
// router.get("/:username", async (req, res, next) => {
//   try {
//     const username = req.params.username;
//     const favorites = await getFavoritesForUser(username);
//     return res.json({ favorites });
//   } catch (err) {
//     return next(err);
//   }
// });

// export default router;





