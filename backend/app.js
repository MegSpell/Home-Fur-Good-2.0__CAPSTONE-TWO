// backend/app.js
// ------------------------------------------------------------
// Main Express application for the Home Fur Good backend.
//
// This file:
//   - Configures global middleware (security, logging, CORS, JSON parsing)
//   - Mounts all route modules (auth, dogs, favorites, profile, admin, etc.)
//   - Provides a simple /health route for uptime checks
//   - Adds 404 + general error handling
//
// The Express app is exported so server.js can import and run it.
// ------------------------------------------------------------

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Route modules
import dogsRoutes from "./routes/dogs.js";
import breedsRoutes from "./routes/breeds.js";
import authRoutes from "./routes/auth.js";
import favoritesRoutes from "./routes/favorites.js";
import profileRoutes from "./routes/profile.js";
import adminRoutes from "./routes/admin.js";
import adminUsersRoutes from "./routes/adminUsers.js";

// Error handlers
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

// ------------------------------------------------------------
// GLOBAL MIDDLEWARE
// ------------------------------------------------------------

// Helmet adds small security protections (headers)
app.use(helmet());

// Allow cross-origin requests. Good for dev where backend = 3001 and frontend = 3000.
// `{ origin: true }` means reflect the requesting origin automatically.
app.use(cors({ origin: true, credentials: true }));

// Parse JSON request bodies into req.body
app.use(express.json());

// Logging: shows method, URL, response time (great for debugging requests)
app.use(morgan("dev"));

// ------------------------------------------------------------
// BASIC HEALTH CHECK ROUTE
// ------------------------------------------------------------
//
// Useful for deployment, uptime monitoring, or local debugging.
// Hitting: GET /health -> { ok: true, service: "HFG-Backend" }
app.get("/health", (req, res) => {
  return res.json({ ok: true, service: "HFG-Backend" });
});

// ------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------
//
// All route groups are mounted on clean prefixes.
// Example: GET /dogs -> handled by routes/dogs.js
//

app.use("/auth", authRoutes);           // signup + login
app.use("/dogs", dogsRoutes);           // search + single dog detail
app.use("/breeds", breedsRoutes);       // static list of UI breed names
app.use("/favorites", favoritesRoutes); // add/remove/list favorites
app.use("/profile", profileRoutes);     // user profile GET/PATCH
app.use("/admin", adminRoutes);         // admin views (users & favorites)
app.use("/admin", adminUsersRoutes);    // admin user PATCH + DELETE

// ------------------------------------------------------------
// 404 HANDLER
// ------------------------------------------------------------
// If no above route matched, this runs.
app.use(notFound);

// ------------------------------------------------------------
// GENERAL ERROR HANDLER
// ------------------------------------------------------------
// Any thrown errors inside routes get handled here.
app.use(errorHandler);

export default app;

