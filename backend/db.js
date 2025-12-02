// backend/db.js
// ------------------------------------------------------------
// Database connection setup (PostgreSQL).
//
// We use the `pg` library's Pool class to create a reusable
// connection pool.
//
// Connection rules:
//   • In TEST mode   (NODE_ENV === "test"):
//       -> always use "postgresql:///homefurgood_test"
//   • Otherwise (dev/prod):
//       -> use process.env.DATABASE_URL if set
//       -> fallback: "postgresql://localhost/hfg2"
// ------------------------------------------------------------

import pkg from "pg";

const { Pool } = pkg;

// Decide which DB URL to use based on NODE_ENV
const isTest = process.env.NODE_ENV === "test";

const connectionString = isTest
  ? "postgresql:///homefurgood_test"
  : process.env.DATABASE_URL || "postgresql://localhost/hfg2";

const db = new Pool({ connectionString });

// Optional logging to make it super obvious where we're connected
db.on("connect", () => {
  console.log("Connected to PostgreSQL via", connectionString);
});

export default db;









// // backend/db.js
// // ------------------------------------------------------------
// // Database connection setup (PostgreSQL).
// //
// // We use the `pg` library's Pool class to create a reusable
// // connection pool. This allows multiple parts of the app to
// // run queries without opening/closing connections manually.
// //
// // Connection priority:
// //   1) process.env.DATABASE_URL  (used in deployed environments)
// //   2) local fallback: "postgresql://localhost/hfg2"
// //
// // Exporting `db` allows route modules and models to call:
// //   db.query("SQL HERE", [params])
// // ------------------------------------------------------------

// import pkg from "pg";

// const { Pool } = pkg;

// // Create a new pool using either the environment variable DATABASE_URL
// // (common in deployment platforms like Render/Heroku)
// // or a default local database name "hfg2" for local development.
// const db = new Pool({
//   connectionString: process.env.DATABASE_URL || "postgresql://localhost/hfg2",

//   // NOTE:
//   // If deploying somewhere that *requires* SSL (like Render or Railway),
//   // you will add:
//   //
//   //   ssl: { rejectUnauthorized: false }
//   //
//   // but only in production environments.
// });

// // Optional event: logs once when the pool establishes a successful connection.
// // Very helpful for debugging, or confirming that your .env variables are correct.
// db.on("connect", () => {
//   console.log("Connected to PostgreSQL (hfg2)");
// });

// // Export the shared database pool.
// export default db;







// ===== before comments =======

// // backend/db.js
// import pkg from "pg";

// const { Pool } = pkg;

// // connection string: use env var if set, else local DB "hfg2"
// const db = new Pool({
//   connectionString: process.env.DATABASE_URL || "postgresql://localhost/hfg2",
//   // You can add ssl config here later if you deploy to Render/Heroku
// });

// // Optional: simple log so you know it connected
// db.on("connect", () => {
//   console.log("Connected to PostgreSQL (hfg2)");
// });

// export default db;
