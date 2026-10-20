const request = require("supertest");
const setupTestDb = require("./test-setup");
const db = require("./db/connection");
const bcrypt = require("bcrypt");
const app = require("./app");

beforeEach(async () => {
  await setupTestDb();
});

test("connects to test database", async () => {
  const result = await db.query(
    `SELECT current_user, current_database();`
  );

  expect(result.rows).toEqual([
    {
      current_user: "auth_lab_user_test",
      current_database: "auth_lab_test"
    }
  ]);
});

describe("GET /health", () => {
  test("responds with 200", async () => {
    const response = await request(app)
      .get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "ok"
    });
  });
});

describe("POST /register", () => {
  test("successfully registers a user", async () => {
    const response = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: {
        id: expect.any(Number),
        username: "Pear"
      }
    });
  });

  test("attempt to register with a username that already exist fails", async () => {
    const firstRegistration = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(firstRegistration.status).toBe(201);
    expect(firstRegistration.body).toEqual({
      user: {
        id: expect.any(Number),
        username: "Pear"
      }
    });

    const secondRegistration = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear456"
      });

    expect(secondRegistration.status).toBe(409);
    expect(secondRegistration.body).toEqual({
      message: "Username already exists"
    });

    const usersResult = await db.query(
      `SELECT * FROM users
      WHERE username = $1;`,
      ["Pear"]
    );

    expect(usersResult.rows.length).toBe(1);
  });

  test("trims a username containing whitespace", async () => {
    const response = await request(app)
      .post("/register")
      .send({
        username: "  Pear  ",
        password: "pear123"
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: {
        id: expect.any(Number),
        username: "Pear"
      }
    });
  });

  test("the user's password hash is stored instead of their plaintext password", async () => {
    const response = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
    });

    expect(response.status).toBe(201);

    const userResult = await db.query(
      `SELECT * FROM users
      WHERE id = $1;`,
      [response.body.user.id]
    );

    const user = userResult.rows[0];

    expect(user.password_hash).not.toBe("pear123");

    const passwordMatches = await bcrypt.compare(
      "pear123",
      user.password_hash
    );

    expect(passwordMatches).toBe(true);
  });

  test("an unsuccessful registration does not create a new user", async () => {
    const usersBefore = await db.query(
      `SELECT * FROM users;`
    );

    const response = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: null
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Invalid request body"
    });

    const usersAfter = await db.query(
      `SELECT * FROM users;`
    );

    expect(usersAfter.rows).toEqual(usersBefore.rows);
  });

  test.each([
    ["username is not a string", { username: 42, password: "pear123" }],
    ["username is empty", { username: "", password: "pear123" }],
    ["username is whitespace-only", { username: "  ", password: "pear123" }],
    ["password is not a string", { username: "Pear", password: 42 }],
    ["password is empty", { username: "Pear", password: "" }],
    ["password is whitespace-only", { username: "Pear", password: "  " }],
    ["body is missing a property", { username: "Pear" }],
    ["body contains an unexpected property", { username: "Pear", role: "admin" }],
    ["body is an array", []],
    ["body is an empty object", {}]
  ])("reject request if %s", async (description, body) => {
    const response = await request(app)
      .post("/register")
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Invalid request body"
    });
  });
});

describe("POST /login", () => {
  test("successfully logs in with valid credentials", async () => {
    const registerUser = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerUser.status).toBe(201);

    const response = await request(app)
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: registerUser.body.user.id,
        username: "Pear"
      }
    });
    expect(response.headers["set-cookie"][0])
      .toContain("SameSite=Lax");
  });

  test("attempting to login using an unknown username fails", async () => {
    const response = await request(app)
      .post("/login")
      .send({
        username: "Hair",
        password: "pear123"
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Invalid username or password"
    });
  });

  test("a user cannot login as an existing user with an incorrect password", async () => {
    const registerUser = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerUser.status).toBe(201);

    const response = await request(app)
      .post("/login")
      .send({
        username: "Pear",
        password: "pair123"
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Invalid username or password"
    });
  });
});

describe("GET /me", () => {
  test("an authenticated user can retrieve their own details", async () => {
    const registerUser = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerUser.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    const getPear = await pear
      .get("/me");

    expect(getPear.status).toBe(200);
    expect(getPear.body).toEqual(
      registerUser.body
    );
  });

  test("an unauthenticated request is rejected", async () => {
    const response = await request(app)
      .get("/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Authentication required"
    });
  });

  test("request from an authenticated user whose account no-longer exists is rejected", async () => {
    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    await db.query(
      `DELETE FROM users
      WHERE id = $1;`,
      [registerPear.body.user.id]
    );

    const getPear = await pear
      .get("/me");

    expect(getPear.status).toBe(401);
    expect(getPear.body).toEqual({
      message: "Authentication required"
    });
  });
});

describe("POST /logout", () => {
  test("an authenticated user can log out successfully", async () => {
    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    const getLoggedInPear = await pear
      .get("/me");

    expect(getLoggedInPear.status).toBe(200);
    expect(getLoggedInPear.body).toEqual(
      registerPear.body
    );

    const logoutPear = await pear
      .post("/logout");

    expect(logoutPear.status).toBe(200);
    expect(logoutPear.body).toEqual({
      message: "Logged out"
    });

    const getLoggedOutPear = await pear
      .get("/me");

    expect(getLoggedOutPear.status).toBe(401);
    expect(getLoggedOutPear.body).toEqual({
      message: "Authentication required"
    });
  });

  test("an unauthenticated user cannot log out", async () => {
    const response = await request(app)
      .post("/logout");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Authentication required"
    });
  });
});

describe("PATCH /users/me", () => {
  test("an authenticated user can successfully update their username", async () => {
    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    const updatePear = await pear
      .patch("/users/me")
      .send({
        username: "Spear"
      });

    expect(updatePear.status).toBe(200);
    expect(updatePear.body).toEqual({
      user: {
        id: registerPear.body.user.id,
        username: "Spear"
      }
    });

    const updatePearResult = await db.query(
      `SELECT username
      FROM users
      WHERE id = $1;`,
      [registerPear.body.user.id]
    );

    const updatedPear = updatePearResult.rows[0];

    expect(updatedPear.username).toBe("Spear");
  });

  test("an unauthenticated user is rejected", async () => {
    const response = await request(app)
      .patch("/users/me")
      .send({
        username: "Spear"
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Authentication required"
    });
  });

  test("an authenticated request to update with an already-taken username is rejected", async () => {
    const registerDonald = await request(app)
      .post("/register")
      .send({
        username: "Donald",
        password: "FagenNotTrump"
      });

    expect(registerDonald.status).toBe(201);

    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    const updatePear = await pear
      .patch("/users/me")
      .send({
        username: "Donald"
      });

    expect(updatePear.status).toBe(409);
    expect(updatePear.body).toEqual({
      message: "Username already exists"
    });

    const donaldResult = await db.query(
      `SELECT username
      FROM users
      WHERE id = $1;`,
      [registerDonald.body.user.id]
    );

    const donaldRow = donaldResult.rows[0];

    expect(donaldRow.username).toBe("Donald");

    const pearResult = await db.query(
      `SELECT username
      FROM users
      WHERE id = $1;`,
      [registerPear.body.user.id]
    );

    const pearRow = pearResult.rows[0];

    expect(pearRow.username).toBe("Pear");
  });

  test.each([
    ["missing username", {}],
    ["invalid username type", { username: 123 }],
    ["empty username string", { username: "" }],
    ["whitespace-only username", { username: "   " }],
    ["unexpected extra field", { username: "Spear", role: "admin" }],
    ["array request body", []]
  ])("rejects request with %s", async (description, body) => {
    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    const updatePear = await pear
      .patch("/users/me")
      .send(body);

    expect(updatePear.status).toBe(400);
    expect(updatePear.body).toEqual({
      message: "Invalid request body"
    });

    const pearUpdateResult = await db.query(
      `SELECT username
      FROM users
      WHERE id = $1;`,
      [registerPear.body.user.id]
    );

    const pearRow = pearUpdateResult.rows[0];

    expect(pearRow.username).toBe("Pear");
  });

  test("username containing whitespace gets trimmed and stored", async () => {
    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    const updatePear = await pear
      .patch("/users/me")
      .send({
        username: "  Spear  "
      });

    expect(updatePear.status).toBe(200);
    expect(updatePear.body).toEqual({
      user: {
        id: registerPear.body.user.id,
        username: "Spear"
      }
    });

    const pearUpdateResult = await db.query(
      `SELECT username
      FROM users
      WHERE id = $1;`,
      [registerPear.body.user.id]
    );

    const pearRow = pearUpdateResult.rows[0];

    expect(pearRow.username).toBe("Spear");
  });
});

describe("PATCH /users/me/password", () => {
  test("an authenticated user can successfully update their password", async () => {
    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    const updatePearPassword = await pear
      .patch("/users/me/password")
      .send({
        currentPassword: "pear123",
        newPassword: "pear456"
      });

    expect(updatePearPassword.status).toBe(200);
    expect(updatePearPassword.body).toEqual({
      message: "Password changed"
    });

    const oldPasswordLogin = await request(app)
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(oldPasswordLogin.status).toBe(401);
    expect(oldPasswordLogin.body).toEqual({
      message: "Invalid username or password"
    });

    const newPasswordLogin = await request(app)
      .post("/login")
      .send({
        username: "Pear",
        password: "pear456"
      });

    expect(newPasswordLogin.status).toBe(200);
    expect(newPasswordLogin.body).toEqual({
      user: {
        id: registerPear.body.user.id,
        username: "Pear"
      }
    });
  });

  test("an authenticated request that supplies an incorrect password is rejected", async () => {
    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    const updatePearPassword = await pear
      .patch("/users/me/password")
      .send({
        currentPassword: "wrongpassword",
        newPassword: "pear456"
      });

    expect(updatePearPassword.status).toBe(401);
    expect(updatePearPassword.body).toEqual({
      message: "Invalid current password"
    });

    const newPasswordLogin = await request(app)
      .post("/login")
      .send({
        username: "Pear",
        password: "pear456"
      });

    expect(newPasswordLogin.status).toBe(401);
    expect(newPasswordLogin.body).toEqual({
      message: "Invalid username or password"
    });

    const oldPasswordLogin = await request(app)
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(oldPasswordLogin.status).toBe(200);
    expect(oldPasswordLogin.body).toEqual({
      user: {
        id: registerPear.body.user.id,
        username: "Pear"
      }
    });
  });

  test("a request from an unauthenticated user is rejected", async () => {
    const response = await request(app)
      .patch("/users/me/password")
      .send({
        currentPassword: "pear123",
        newPassword: "pear456"
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Authentication required"
    });
  });

  test.each([
    ["the currentPassword field is missing", { newPassword: "pear456" }],
    ["the newPassword field is missing", { currentPassword: "pear123" }],
    ["the currentPassword field is not a string", {
      currentPassword: 42,
      newPassword: "pear456"
    }],
    ["the newPassword field is not a string", {
      currentPassword: "pear123",
      newPassword: 42
    }],
    ["the currentPassword field is whitespace-only", {
      currentPassword: "   ",
      newPassword: "pear456"
    }],
    ["the newPassword field is whitespace-only", {
      currentPassword: "pear123",
      newPassword: "   "
    }],
    ["the currentPassword field is empty", {
      currentPassword: "",
      newPassword: "pear456"
    }],
    ["the newPassword field is empty", {
      currentPassword: "pear123",
      newPassword: ""
    }],
    ["body contains an unexpected field", {
      currentPassword: "pear123",
      newPassword: "pear456",
      role: "admin"
    }],
    ["body is empty", {}],
    ["body is an array", []]
  ])("rejects request if %s", async (description, body) => {
    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    const updatePearPassword = await pear
      .patch("/users/me/password")
      .send(body);

    expect(updatePearPassword.status).toBe(400);
    expect(updatePearPassword.body).toEqual({
      message: "Invalid request body"
    });

    const originalPasswordLogin = await request(app)
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(originalPasswordLogin.status).toBe(200);
    expect(originalPasswordLogin.body).toEqual({
      user: {
        id: registerPear.body.user.id,
        username: "Pear"
      }
    });
  });
});

describe("DELETE /users/me", () => {
  test("an authenticated user can successfully delete their account", async () => {
    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    const deletePear = await pear
      .delete("/users/me");

    expect(deletePear.status).toBe(204);
    expect(deletePear.text).toBe("");

    const getPear = await pear
      .get("/me");

    expect(getPear.status).toBe(401);
    expect(getPear.body).toEqual({
      message: "Authentication required"
    });

    const loginPearAfterDelete = await request(app)
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPearAfterDelete.status).toBe(401);
    expect(loginPearAfterDelete.body).toEqual({
      message: "Invalid username or password"
    });
  });

  test("an unauthenticated user cannot delete an account", async () => {
    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const deletePear = await request(app)
      .delete("/users/me");

    expect(deletePear.status).toBe(401);
    expect(deletePear.body).toEqual({
      message: "Authentication required"
    });

    const loginPear = await request(app)
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);
    expect(loginPear.body).toEqual({
      user: {
        id: registerPear.body.user.id,
        username: "Pear"
      }
    });
  });

  test("a second deletion request is rejected after account deletion", async () => {
    const registerPear = await request(app)
      .post("/register")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(registerPear.status).toBe(201);

    const pear = request.agent(app);

    const loginPear = await pear
      .post("/login")
      .send({
        username: "Pear",
        password: "pear123"
      });

    expect(loginPear.status).toBe(200);

    const deletePearOnce = await pear
      .delete("/users/me");

    expect(deletePearOnce.status).toBe(204);
    expect(deletePearOnce.text).toBe("");

    const deletePearTwice = await pear
      .delete("/users/me");

    expect(deletePearTwice.status).toBe(401);
    expect(deletePearTwice.body).toEqual({
      message: "Authentication required"
    });
  });
});

afterAll(async () => {
  await db.end();
});