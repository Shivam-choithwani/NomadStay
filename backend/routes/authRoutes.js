const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { generateAccessToken, generateRefreshToken } = require("../config/generateTokens");
const { authLimiter, passwordResetLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, getCurrentUser);

// Verification and Reset
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", authLimiter, protect, resendVerification);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password/:token", passwordResetLimiter, resetPassword);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=oauth_failed` }),
  async (req, res) => {
    try {
      const accessToken = generateAccessToken(req.user._id);
      const refreshToken = generateRefreshToken(req.user._id);

      req.user.refreshToken = refreshToken;
      await req.user.save();

      const refreshCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/api/auth",
      };

      res.cookie("refreshToken", refreshToken, refreshCookieOptions);
      res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/oauth-callback?token=${accessToken}`);
    } catch (err) {
      console.error("OAuth callback error:", err);
      res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=token_generation_failed`);
    }
  }
);

module.exports = router;
