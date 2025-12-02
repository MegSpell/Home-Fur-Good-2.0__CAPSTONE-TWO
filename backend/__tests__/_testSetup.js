// __tests__/_testSetup.js
import db from "../db.js";

/** Wipe all tables that tests touch, in FK-safe order. */
async function clearTestDB() {
  console.log("🧪 Clearing test DB before test...");

  // Favorites depends on users
  await db.query("DELETE FROM favorites");
  await db.query("DELETE FROM users");
}

/** Run before *each test* in any file that imports this. */
beforeEach(async () => {
  await clearTestDB();
});

// 👉 IMPORTANT: do NOT close the pool here.
// Jest will exit the process when tests are done, and that's fine.
// Closing the shared pool from one file while others still need it
// can cause random flakiness.
console.log("🧪 Jest test setup loaded. NODE_ENV =", process.env.NODE_ENV);
console.log("🧪 DATABASE_URL =", process.env.DATABASE_URL);



