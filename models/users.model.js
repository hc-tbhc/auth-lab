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

async function getPasswordHashById(userId) {
  const result = await db.query(
    `SELECT password_hash
    FROM users
    WHERE id = $1;`,
    [userId]
  );

  return result.rows[0]?.password_hash;
}

async function updateUserPassword(userId, newPasswordHash) {
  const result = await db.query(
    `UPDATE users
    SET password_hash = $2
    WHERE id = $1
    RETURNING id;`,
    [userId, newPasswordHash]
  );

  return result.rows[0]?.id;
}

async function deleteUserById(userId) {
  const result = await db.query(
    `DELETE FROM users
    WHERE id = $1
    RETURNING id;`,
    [userId]
  );

  return result.rows[0]?.id;
}

module.exports = {
  addUser,
  getUserByUsername,
  getUserById,
  updateUserUsername,
  getPasswordHashById,
  updateUserPassword,
  deleteUserById
};