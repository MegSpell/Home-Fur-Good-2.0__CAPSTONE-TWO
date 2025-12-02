// backend/server.js
// ------------------------------------------------------------
// Entry point for starting the Home Fur Good backend server.
//
// This file:
//   - Loads environment variables from .env using dotenv
//   - Imports the fully-configured Express app from app.js
//   - Starts the HTTP server and listens on the chosen PORT
//
// Why separate server.js and app.js?
//   - app.js sets up routes + middleware.
//   - server.js only starts the server.
//   - This separation is ideal for testing (supertest),
//     because tests can import the Express "app" without
//     actually running the server.
// ------------------------------------------------------------

// Load variables from .env file (RESCUEGROUPS_API_KEY, PORT, DATABASE_URL, etc)
import "dotenv/config";

// Import the configured Express application
import app from "./app.js";

// PORT comes from the environment in production,
// or defaults to 3001 in local development.
const PORT = process.env.PORT || 3001;

// Start the server and begin listening for incoming requests.
// This callback runs once the server is successfully started.
app.listen(PORT, () => {
  console.log(`HFG backend listening on http://localhost:${PORT}`);
});







// ===== before comments ======
// import "dotenv/config";
// import app from "./app.js";

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`HFG backend listening on http://localhost:${PORT}`);
// });
