const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("../config/generateTokens");
const { sendMail } = require("../config/mailer");

// Shared cookie options for the refresh token
const refreshCookieOptions = {
  httpOnly: true, // JS on the frontend can never read this — mitigates XSS token theft
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/api/auth", // only sent to auth routes (refresh/logout)
};

// @route POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are all required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({ name, email, password });

    // Generate email verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      const verificationUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email/${verificationToken}`;
      await sendMail({
        to: user.email,
        subject: "Verify your email for StayShare",
        html: `
          <h3>Welcome to StayShare!</h3>
          <p>Hi ${user.name},</p>
          <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" target="_blank">${verificationUrl}</a>
          <p>This link is valid for 24 hours.</p>
        `,
      });
    } catch (mailErr) {
      console.error("Failed to send verification email:", mailErr);
      // Don't fail registration if email fails, but log it
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isHost: user.isHost,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        phone: user.phone,
        languages: user.languages,
        locationCity: user.locationCity,
        locationCountry: user.locationCountry,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        idVerificationStatus: user.idVerificationStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
}

// @route POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // password field has select:false in the schema, so it must be explicitly requested
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      // Same message for both cases — don't reveal whether the email exists
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned." });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isHost: user.isHost,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        phone: user.phone,
        languages: user.languages,
        locationCity: user.locationCity,
        locationCountry: user.locationCountry,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        idVerificationStatus: user.idVerificationStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
}

// @route POST /api/auth/refresh
// Exchanges a valid refresh cookie for a new short-lived access token
async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshToken");

    // Reject if the token doesn't match what's stored — catches stolen/reused tokens
    // after a legitimate refresh has already rotated it
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Refresh token invalid or revoked" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned." });
    }

    const newAccessToken = generateAccessToken(user._id);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Refresh token expired or invalid" });
  }
}

// @route POST /api/auth/logout
async function logout(req, res) {
  const token = req.cookies?.refreshToken;

  if (token) {
    // Invalidate the stored refresh token so it can't be reused even if leaked
    await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: "" });
  }

  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ message: "Logged out successfully" });
}

// @route GET /api/auth/me
// @access Private — returns the logged-in user's profile
async function getCurrentUser(req, res) {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    isHost: req.user.isHost,
    avatarUrl: req.user.avatarUrl,
    isEmailVerified: req.user.isEmailVerified,
    role: req.user.role,
    bio: req.user.bio,
    phone: req.user.phone,
    languages: req.user.languages,
    locationCity: req.user.locationCity,
    locationCountry: req.user.locationCountry,
    dateOfBirth: req.user.dateOfBirth,
    gender: req.user.gender,
    idVerificationStatus: req.user.idVerificationStatus,
  });
}

// @route POST /api/auth/resend-verification
// @access Private
async function resendVerification(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate a new verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email/${verificationToken}`;
    await sendMail({
      to: user.email,
      subject: "Verify your email for StayShare",
      html: `
        <h3>Verify your StayShare Email</h3>
        <p>Hi ${user.name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" target="_blank">${verificationUrl}</a>
        <p>This link is valid for 24 hours.</p>
      `,
    });

    res.json({ message: "Verification email sent!" });
  } catch (err) {
    console.error("Failed to resend verification email:", err);
    res.status(500).json({ message: "Failed to resend verification email" });
  }
}

// @route GET /api/auth/verify-email/:token
async function verifyEmail(req, res) {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({ message: "Verification token is invalid or has expired" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Email verification failed", error: err.message });
  }
}

// @route POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't confirm or deny user existence
      return res.json({ message: "If that email address exists, a password reset link has been sent." });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    try {
      const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password/${resetToken}`;
      await sendMail({
        to: user.email,
        subject: "Password Reset Request for StayShare",
        html: `
          <h3>Reset Password</h3>
          <p>You requested to reset your password. Please click the link below to set a new password:</p>
          <a href="${resetUrl}" target="_blank">${resetUrl}</a>
          <p>This link is valid for 1 hour. If you did not make this request, please ignore this email.</p>
        `,
      });
    } catch (mailErr) {
      console.error("Failed to send reset password email:", mailErr);
      return res.status(500).json({ message: "Error sending reset email. Please try again later." });
    }

    res.json({ message: "If that email address exists, a password reset link has been sent." });
  } catch (err) {
    res.status(500).json({ message: "Forgot password request failed", error: err.message });
  }
}

// @route POST /api/auth/reset-password/:token
async function resetPassword(req, res) {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired" });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Password reset failed", error: err.message });
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
