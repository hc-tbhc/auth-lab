const db = require("./db/connection");

async function setupTestDb() {
  await db.query(
    "TRUNCATE TABLE users RESTART IDENTITY;"
  );
}

module.exports = setupTestDb;