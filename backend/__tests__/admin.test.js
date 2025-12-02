import "./_testSetup.js";
import db from "../db.js";

describe("admin basics in DB", () => {
  test("there is at least one admin user in the inserted data", async () => {
    await db.query(
      `
      INSERT INTO users (username, password_hash, email, zipcode, is_admin)
      VALUES 
        ('admin_test_user', 'hash-admin', 'admin@example.com', '01938', TRUE),
        ('regular_test_user', 'hash-regular', 'reg@example.com', '01938', FALSE)
      `
    );

    const res = await db.query(
      `
      SELECT username, is_admin
      FROM users
      WHERE is_admin = TRUE
      `
    );

    expect(res.rows.length).toBeGreaterThanOrEqual(1);
    expect(res.rows[0].is_admin).toBe(true);
  });
});

