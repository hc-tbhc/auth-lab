const {
  getUserById
} = require("../models/users.model");

function badRequestResponse(res) {
  return res.status(400).json({
    message: "Invalid request body"
  });
}

function validateCredentialsBody(req, res, next) {
  if (
    !req.body
    || typeof req.body !== "object"
    || Array.isArray(req.body)
  ) {
    return badRequestResponse(res);
  }

  const keys = Object.keys(req.body);

  if (keys.length !== 2)
    return badRequestResponse(res);

  const hasValidKeys = keys.every(
    key => key === "username" || key === "password"
  );

  if (!hasValidKeys)
    return badRequestResponse(res);

  const username = req.body.username;
  const password = req.body.password;

  if (typeof username !== "string" || !username.trim().length)
    return badRequestResponse(res);

  if (typeof password !== "string" || !password.trim().length)
    return badRequestResponse(res);

  req.body.username = username.trim();

  return next();
}

async function authenticateUser(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  const user = await getUserById(
    req.session.userId
  );

  if (!user) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  req.user = user;

  return next();
}

function validateUsernamePatch(req, res, next) {
  if (
    !req.body
    || typeof req.body !== "object"
    || Array.isArray(req.body)
  ) {
    return res.status(400).json({
      message: "Invalid request body"
    });
  }

  const keys = Object.keys(req.body);

  if (keys.length !== 1 || keys[0] !== "username") {
    return res.status(400).json({
      message: "Invalid request body"
    });
  }

  const username = req.body.username;

  if (typeof username !== "string" || !username.trim().length) {
    return res.status(400).json({
      message: "Invalid request body"
    });
  }

  req.body.username = username.trim();

  return next();
}

function validatePasswordPatch(req, res, next) {
  if (
    !req.body
    || typeof req.body !== "object"
    || Array.isArray(req.body)
  ) {
    return res.status(400).json({
      message: "Invalid request body"
    });
  }

  const keys = Object.keys(req.body);

  if (keys.length !== 2) {
    return res.status(400).json({
      message: "Invalid request body"
    });
  }

  const hasValidKeys = keys.every(key => {
    return key === "currentPassword"
      || key === "newPassword";
  });

  if (!hasValidKeys) {
    return res.status(400).json({
      message: "Invalid request body"
    });
  }

  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  if (
    typeof currentPassword !== "string"
    || !currentPassword.trim().length
  ) {
    return res.status(400).json({
      message: "Invalid request body"
    });
  }

  if (
    typeof newPassword !== "string"
    || !newPassword.trim().length
  ) {
    return res.status(400).json({
      message: "Invalid request body"
    });
  }

  return next();
}

module.exports = {
  validateCredentialsBody,
  authenticateUser,
  validateUsernamePatch,
  validatePasswordPatch
};