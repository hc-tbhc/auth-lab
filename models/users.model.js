const db = require("../db/connection");

async function addUser(username, passwordHash) {
  try {
    const result = await db.query(
      `INSERT INTO users
      (username, password_hash)
      VALUES ($1, $2)
      RETURNING id, username;`,
      [username, passwordHash]
    );

    return result.rows[0];
  } catch (err) {
    if (
      err.code === "23505" &&
      err.constraint === "users_username_key"
    ) {
      const error = new Error("Username already exists");
      error.type = "USERNAME_ALREADY_EXISTS";

      throw error;
    }

    throw err;
  }
}

async function getUserByUsername(username) {
  const result = await db.query(
    `SELECT id, username, password_hash
    FROM users
    WHERE username = $1;`,
    [username]
  );

  return result.rows[0];
}

async function getUserById(userId) {
  const result = await db.query(
    `SELECT id, username
    FROM users
    WHERE id = $1;`,
    [userId]
  );

  return result.rows[0];
}

async function updateUserUsername(userId, username) {
  try {
    const result = await db.query(
      `UPDATE users
      SET username = $2
      WHERE id = $1
      RETURNING id,
      username;`,
      [userId, username]
    );

    return result.rows[0];
  } catch (err) {
    if (
      err.code === "23505" &&
      err.constraint === "users_username_key"
    ) {
      const error = new Error("Username already exists");
      error.type = "USERNAME_ALREADY_EXISTS";

      throw error;
    }

    throw err;
  }
}

module.exports = {
  addUser,
  getUserByUsername,
  getUserById,
  updateUserUsername
};