// backend/middleware/error.js
// -----------------------------------------
// Centralized error-handling middleware for Express.
// This file defines two pieces of middleware:
//
// 1. notFound   -> runs when no route matches (404 handler)
// 2. errorHandler -> runs when any route/middleware calls next(err)
//
// You typically mount them in app.js like:
//
//   app.use(notFound);       // after all your routes
//   app.use(errorHandler);   // last middleware in the chain
// -----------------------------------------

/**
 * 404 handler: runs when no route matches the incoming request.
 *
 * If the request reaches this middleware, it means:
 *   - The URL didn't match any defined route (e.g., /api/whatever)
 *   - We want to send a consistent JSON error response
 *
 * We don't call `next()` here because we are "handling" the request
 * by sending a response directly.
 */
export function notFound(req, res, next) {
  return res.status(404).json({
    error: {
      message: "Not Found",
      status: 404,
    },
  });
}

/**
 * General error handler: Express will call this whenever
 * `next(err)` is called *anywhere* in our routes/middleware.
 *
 * Pattern:
 *   - Routes can `throw` or call `next(err)`
 *   - This function catches it
 *   - We send back a consistent JSON error format
 *
 * In production, this keeps error responses simple and safe.
 * In development, you might also add more logging or stack traces.
 */
export function errorHandler(err, req, res, next) {
  // If the thrown error had a `status` property (like our custom errors),
  // use that; otherwise default to 500 (Internal Server Error).
  const status = err.status || 500;

  // Same idea for `message`: use the one on the error, or a generic fallback.
  const message = err.message || "Internal Server Error";

  // Don't spam logs during automated tests, but do log in dev/prod.
  if (process.env.NODE_ENV !== "test") {
    console.error("ERROR:", status, message);
  }

  // Send a simple, consistent JSON structure to the client.
  return res.status(status).json({
    error: {
      message,
      status,
    },
  });
}





//=============before comments==================
// export function notFound(req, res, next) {
//   return res.status(404).json({ error: { message: "Not Found", status: 404 } });
// }

// export function errorHandler(err, req, res, next) {
//   const status = err.status || 500;
//   const message = err.message || "Internal Server Error";
//   if (process.env.NODE_ENV !== "test") {
//     console.error("ERROR:", status, message);
//   }
//   return res.status(status).json({ error: { message, status } });
// }
