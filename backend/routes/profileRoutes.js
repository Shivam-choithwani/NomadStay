const express = require("express");
const router = express.Router();
const { 
  getUserProfile, 
  updateProfile, 
  uploadAvatar,
  uploadGovId,
  sendPhoneOTP,
  verifyPhoneOTP
} = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");
const { uploadSingleAvatar, uploadSingleGovId } = require("../middleware/uploadMiddleware");

// Retrieve user's public profile
router.get("/:id", getUserProfile);

// Update current user's profile details
router.put("/me", protect, updateProfile);

// Upload user avatar
router.put("/me/avatar", protect, uploadSingleAvatar, uploadAvatar);

// Upload Government ID document
router.put("/me/gov-id", protect, uploadSingleGovId, uploadGovId);

// Send simulated phone OTP verification code
router.post("/me/send-otp", protect, sendPhoneOTP);

// Verify simulated phone OTP verification code
router.post("/me/verify-otp", protect, verifyPhoneOTP);

module.exports = router;
