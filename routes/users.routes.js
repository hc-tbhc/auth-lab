const express = require("express");
const {
  validateCredentialsBody,
  authenticateUser,
  validateUsernamePatch
} = require("../middleware/users.middleware");
const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateUsername
} = require("../controllers/users.controller");
const usersRouter = express.Router();

usersRouter.post(
  "/register",
  validateCredentialsBody,
  registerUser
);

usersRouter.post(
  "/login",
  validateCredentialsBody,
  loginUser
);

usersRouter.get(
  "/me",
  authenticateUser,
  getCurrentUser
);

usersRouter.post(
  "/logout",
  authenticateUser,
  logoutUser
);

usersRouter.patch(
  "/users/me",
  authenticateUser,
  validateUsernamePatch,
  updateUsername
);

module.exports = usersRouter;