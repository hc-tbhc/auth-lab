const express = require("express");
const {
  validateCredentialsBody,
  authenticateUser
} = require("../middleware/users.middleware");
const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser
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

module.exports = usersRouter;