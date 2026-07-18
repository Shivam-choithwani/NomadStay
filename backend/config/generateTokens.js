const jwt = require("jsonwebtoken");

// Short-lived access token — sent to the client, used on every request
function generateAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });
}

// Long-lived refresh token — stored as httpOnly cookie, used only to mint new access tokens
function generateRefreshToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });
}

module.exports = { generateAccessToken, generateRefreshToken };
