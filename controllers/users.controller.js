const bcrypt = require("bcrypt");
const {
  addUser,
  getUserByUsername,
  updateUserUsername,
  getPasswordHashById,
  updateUserPassword,
  deleteUserById
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

function logoutUser(req, res, next) {
  req.session.destroy(err => {
    if (err) return next(err);

    res.clearCookie("connect.sid");

    return res.status(200).json({
      message: "Logged out"
    });
  });
}

async function updateUsername(req, res) {
  const user = await updateUserUsername(
    req.user.id,
    req.body.username
  );

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  return res.status(200).json({
    user
  });
}

async function patchPassword(req, res) {
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  const currentPasswordHash = await getPasswordHashById(
    req.user.id
  );

  if (!currentPasswordHash) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  const isCorrectPassword = await bcrypt.compare(
    currentPassword,
    currentPasswordHash
  );

  if (!isCorrectPassword) {
    return res.status(401).json({
      message: "Invalid current password"
    });
  }

  const newPasswordHash = await bcrypt.hash(
    newPassword, 10
  );

  const updatePasswordRes = await updateUserPassword(
    req.user.id,
    newPasswordHash
  );

  if (updatePasswordRes === undefined) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  return res.status(200).json({
    message: "Password changed"
  });
}

async function deleteCurrentUser(req, res, next) {
  const deletedUser = await deleteUserById(
    req.user.id
  );

  if (!deletedUser) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  req.session.destroy(err => {
    if (err) return next(err);

    res.clearCookie("connect.sid");
    return res.status(204).end();
  });
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateUsername,
  patchPassword,
  deleteCurrentUser
};