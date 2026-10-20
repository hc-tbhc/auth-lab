const express = require("express");
const {
  validateCredentialsBody,
  authenticateUser,
  validateUsernamePatch,
  validatePasswordPatch
} = require("../middleware/users.middleware");
const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateUsername,
  patchPassword,
  deleteCurrentUser
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

usersRouter.patch(
  "/users/me/password",
  authenticateUser,
  validatePasswordPatch,
  patchPassword
);

usersRouter.delete(
  "/users/me",
  authenticateUser,
  deleteCurrentUser
);

module.exports = usersRouter;