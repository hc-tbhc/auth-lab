const bcrypt = require("bcrypt");
const {
  addUser
} = require("../models/users.model");

async function registerUser(req, res) {
  const passwordHash = await bcrypt.hash(
    req.body.password, 10
  );

  const user = await addUser(
    req.body.username,
    passwordHash
  );

  return res.status(201).json({
    user
  });
}

module.exports = {
  registerUser
};