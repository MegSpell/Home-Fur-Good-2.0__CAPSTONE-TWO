import "./_testSetup.js";
import db from "../db.js";

describe("favorites table", () => {
  test("can insert and fetch a favorite for a user", async () => {
    const username = "fav_user_test";
    const dogId = "TEST-DOG-123";

    // 1. Insert a user so FK constraint is satisfied
    const userRes = await db.query(
      `
      INSERT INTO users (username, password_hash, email, zipcode, is_admin)
      VALUES ($1, 'test-hash', 'favuser@example.com', '01938', FALSE)
      RETURNING username
      `,
      [username]
    );
    expect(userRes.rows.length).toBe(1);

    // 2. Insert a favorite for that user
    const insertFavRes = await db.query(
      `
      INSERT INTO favorites (username, dog_id)
      VALUES ($1, $2)
      RETURNING username, dog_id
      `,
      [username, dogId]
    );
    expect(insertFavRes.rows.length).toBe(1);

    // 3. Fetch it back and verify
    const fetchRes = await db.query(
      `
      SELECT username, dog_id
      FROM favorites
      WHERE username = $1 AND dog_id = $2
      `,
      [username, dogId]
    );

    expect(fetchRes.rows.length).toBe(1);
    const fetched = fetchRes.rows[0];
    expect(fetched.username).toBe(username);
    expect(fetched.dog_id).toBe(dogId);
  });
});



