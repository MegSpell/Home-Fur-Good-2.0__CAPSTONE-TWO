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

