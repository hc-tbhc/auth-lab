function badRequestResponse(res) {
  return res.status(400).json({
    message: "Invalid request body"
  });
}

function validateUserRegistrationBody(req, res, next) {
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

module.exports = {
  validateUserRegistrationBody
};