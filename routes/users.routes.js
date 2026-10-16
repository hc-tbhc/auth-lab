const express = require("express");
const { validateUserRegistrationBody } = require("../middleware/users.middleware");
const { registerUser } = require("../controllers/users.controller");
const usersRouter = express.Router();

usersRouter.post(
  "/register",
  validateUserRegistrationBody,
  registerUser
);

module.exports = usersRouter;