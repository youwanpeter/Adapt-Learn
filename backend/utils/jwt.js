const jwt = require("jsonwebtoken");

function signAccessToken(payload, secret, options = { expiresIn: "7d" }) {
  return jwt.sign(payload, secret, options);
}

module.exports = { signAccessToken };
