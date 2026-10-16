require("./config/env");
const express = require("express");
const usersRouter = require("./routes/users.routes");
const {
  errorHandler
} = require("./middleware/errors.middleware");
const app = express();

app.use(express.json());

app.use("/", usersRouter);

app.get("/health", (req, res) => {
  return res.status(200).json({
    message: "ok"
  });
});

app.use(errorHandler);

module.exports = app;