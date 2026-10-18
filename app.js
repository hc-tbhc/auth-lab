require("./config/env");
const express = require("express");
const session = require("express-session");
const usersRouter = require("./routes/users.routes");
const {
  errorHandler
} = require("./middleware/errors.middleware");
const app = express();

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax"
  }
}));

app.use("/", usersRouter);

app.get("/health", (req, res) => {
  return res.status(200).json({
    message: "ok"
  });
});

app.use(errorHandler);

module.exports = app;