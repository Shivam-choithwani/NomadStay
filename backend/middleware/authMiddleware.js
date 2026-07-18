const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protects routes — requires a valid access token in the Authorization header
async function protect(req, res, next) {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // Attach user (minus password) to the request for downstream handlers
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, user no longer exists" });
    }

    next();
  } catch (err) {
    // Distinguish expired tokens from invalid ones — frontend uses this to decide
    // whether to silently refresh or force a re-login
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
}

module.exports = { protect };
