const filePath = process.env.NODE_ENV === "test"
  ? ".env.test"
  : ".env.development"

require("dotenv").config({ path: filePath });