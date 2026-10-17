const bcrypt = require("bcrypt");
const {
  addUser,
  getUserByUsername
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

async function loginUser(req, res, next) {
  const username = req.body.username;
  const password = req.body.password;

  const user = await getUserByUsername(
    username
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid username or password"
    });
  }

  const isCorrectPassword = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isCorrectPassword) {
    return res.status(401).json({
      message: "Invalid username or password"
    });
  }

  req.session.regenerate(err => {
    if (err) return next(err);

    req.session.userId = user.id;
    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username
      }
    });
  });
}

function getCurrentUser(req, res) {
  return res.status(200).json({
    user: req.user
  });
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser
};