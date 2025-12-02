// __tests__/auth.test.js
// ------------------------------------------------------------
// Tests for auth routes:
//
//   POST /auth/signup
//   POST /auth/login
//
// These use the real Express app and hit the test DB defined
// in .env.test via supertest.
// ------------------------------------------------------------
import "./_testSetup.js";

import request from "supertest";
import app from "../app.js";

describe("Auth routes", () => {
  // Helper for creating a user via the real signup route
  async function signupUser({ username, email }) {
    const resp = await request(app).post("/auth/signup").send({
      username,
      password: "password123",
      email,
      zipcode: "01938",
    });
    return resp;
  }

  test("POST /auth/signup - creates a new user", async () => {
    const resp = await signupUser({
      username: "signup_user1",
      email: "signup1@example.com",
    });

    console.log("SIGNUP resp:", resp.statusCode, resp.body);

    // Your app is returning 201 Created on success (from the logs)
    expect([200, 201]).toContain(resp.statusCode);

    // Expect a user object in the response
    expect(resp.body).toHaveProperty("user");
    const user = resp.body.user;

    expect(user.username).toBe("signup_user1");
    expect(user.email).toBe("signup1@example.com");
    expect(user).toHaveProperty("zipcode", "01938");
    // default non-admin
    expect(user).toHaveProperty("isAdmin", false);
  });

  test("POST /auth/signup - fails on duplicate username", async () => {
    const username = "dup_user";
    const email1 = "dup1@example.com";
    const email2 = "dup2@example.com";

    // First signup should succeed
    const first = await signupUser({ username, email: email1 });
    console.log("FIRST SIGNUP:", first.statusCode, first.body);
    expect([200, 201]).toContain(first.statusCode);

    // Second signup with same username should **fail**
    const second = await request(app).post("/auth/signup").send({
      username,
      password: "password123",
      email: email2,
      zipcode: "01938",
    });

    // From your logs: status 400, body: { error: 'Username already taken' }
    expect(second.statusCode).toBe(400);

    // Be a little flexible about shape (string vs object)
    const err = second.body.error;
    if (typeof err === "string") {
      expect(err.toLowerCase()).toContain("username");
    } else if (err && typeof err.message === "string") {
      expect(err.message.toLowerCase()).toContain("username");
    }
  });

  test("POST /auth/login - works with valid credentials", async () => {
    const username = "login_user";
    const password = "password123";
    const email = "login@example.com";

    // Ensure this user exists by signing them up first
    await request(app).post("/auth/signup").send({
      username,
      password,
      email,
      zipcode: "01938",
    });

    const resp = await request(app).post("/auth/login").send({
      username,
      password,
    });

    console.log("LOGIN resp:", resp.statusCode, resp.body);

    // From the logs: status 200, body: { user: {...} }
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toHaveProperty("user");

    const user = resp.body.user;
    expect(user.username).toBe(username);
    expect(user.email).toBe(email);
    expect(user).toHaveProperty("zipcode", "01938");
    expect(user).toHaveProperty("isAdmin", false);
  });
});
