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
    if (err.code === "23505") {
      const error = new Error("Username already exists");
      error.type = "USERNAME_ALREADY_EXISTS"

      throw error;
    }

    throw err;
  }
}

module.exports = {
  addUser
};