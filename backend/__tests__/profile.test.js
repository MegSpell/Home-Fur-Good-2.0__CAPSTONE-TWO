import "./_testSetup.js";
import db from "../db.js";

describe("user profile basics", () => {
  test("can update basic profile fields like email and zipcode", async () => {
    const username = "profile_user";
    const origEmail = "original@example.com";
    const origZip = "00000";

    // 1. Insert starting user row
    const insertRes = await db.query(
      `
      INSERT INTO users (username, password_hash, email, zipcode, is_admin)
      VALUES ($1, 'hash123', $2, $3, FALSE)
      RETURNING username, email, zipcode
      `,
      [username, origEmail, origZip]
    );
    expect(insertRes.rows.length).toBe(1);

    // 2. Update email + zip
    const newEmail = "updated@example.com";
    const newZip = "01938";

    const updateRes = await db.query(
      `
      UPDATE users
      SET email = $1,
          zipcode = $2
      WHERE username = $3
      RETURNING username, email, zipcode
      `,
      [newEmail, newZip, username]
    );

    expect(updateRes.rows.length).toBe(1);
    const updated = updateRes.rows[0];
    expect(updated.username).toBe(username);
    expect(updated.email).toBe(newEmail);
    expect(updated.zipcode).toBe(newZip);

    // 3. Double-check by selecting directly from the table
    const checkRes = await db.query(
      `
      SELECT username, email, zipcode
      FROM users
      WHERE username = $1
      `,
      [username]
    );

    expect(checkRes.rows.length).toBe(1);
    expect(checkRes.rows[0].email).toBe(newEmail);
    expect(checkRes.rows[0].zipcode).toBe(newZip);
  });
});

