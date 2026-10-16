const errorMap = {
  USERNAME_ALREADY_EXISTS: {
    status: 409,
    message: "Username already exists"
  }
};

function errorHandler(err, req, res, next) {
  if (Object.hasOwn(errorMap, err.type)) {
    const { status, message } = errorMap[err.type];

    return res.status(status).json({
      message
    });
  }

  console.error(err);

  return res.status(500).json({
    message: "Internal server error"
  });
}

module.exports = {
  errorHandler
};