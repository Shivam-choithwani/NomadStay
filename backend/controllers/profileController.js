const User = require("../models/User");

// Helper to calculate profile completion score (0 to 100)
function calculateCompletion(user) {
  let score = 0;
  if (user.avatarUrl) score += 10;
  if (user.bio && user.bio.length > 20) score += 20;
  if (user.phoneVerificationStatus === "verified") score += 10;
  if (user.locationCity && user.locationCountry) score += 15;
  if (user.languages && user.languages.length > 0) score += 15;
  if (user.interests && user.interests.length > 0) score += 10;
  if (user.travelHistory && user.travelHistory.length > 0) score += 10;
  if (user.idVerificationStatus === "approved") score += 10;
  return score;
}

// @route GET /api/users/:id
// @access Public - retrieve user profile
async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.params.id)
      .select("-refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "This user account has been suspended." });
    }

    const userObj = user.toObject();
    userObj.profileCompletion = calculateCompletion(user);

    res.json(userObj);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
}

// @route PUT /api/users/me
// @access Private - update current user's profile details
async function updateProfile(req, res) {
  try {
    const allowedUpdates = [
      "name",
      "bio",
      "phone",
      "languages",
      "interests",
      "travelHistory",
      "socialLinks",
      "locationCity",
      "locationCountry",
      "dateOfBirth",
      "gender",
      "isHost",
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Handle languages string or array parsing
    if (updates.languages && typeof updates.languages === "string") {
      updates.languages = updates.languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
    }

    // Handle interests string or array parsing
    if (updates.interests && typeof updates.interests === "string") {
      updates.interests = updates.interests
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
    }

    // Handle travelHistory string or array parsing
    if (updates.travelHistory && typeof updates.travelHistory === "string") {
      updates.travelHistory = updates.travelHistory
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    // Handle socialLinks parsing if sent as JSON string
    if (updates.socialLinks && typeof updates.socialLinks === "string") {
      try {
        updates.socialLinks = JSON.parse(updates.socialLinks);
      } catch (e) {
        console.error("Failed to parse socialLinks JSON string");
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    const userObj = user.toObject();
    userObj.profileCompletion = calculateCompletion(user);

    res.json(userObj);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
}

// @route PUT /api/users/me/avatar
// @access Private - upload new profile picture
async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please select an image to upload" });
    }

    const fileUrl = req.file.path.startsWith("http")
      ? req.file.path
      : `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: fileUrl },
      { new: true }
    );

    const userObj = user.toObject();
    userObj.profileCompletion = calculateCompletion(user);

    res.json({
      message: "Avatar uploaded successfully",
      avatarUrl: fileUrl,
      user: userObj,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to upload avatar", error: err.message });
  }
}

// @route PUT /api/users/me/gov-id
// @access Private - upload Government ID
async function uploadGovId(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please select an ID document file to upload" });
    }

    const fileUrl = req.file.path.startsWith("http")
      ? req.file.path
      : `/uploads/documents/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        idDocumentUrl: fileUrl,
        idVerificationStatus: "pending",
      },
      { new: true }
    );

    const userObj = user.toObject();
    userObj.profileCompletion = calculateCompletion(user);

    res.json({
      message: "ID document uploaded successfully and is pending review.",
      idDocumentUrl: fileUrl,
      user: userObj,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to upload ID document", error: err.message });
  }
}

const twilio = require("twilio");

// @route POST /api/users/me/send-otp
// @access Private - send OTP
async function sendPhoneOTP(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await User.findByIdAndUpdate(req.user._id, {
      phone,
      phoneVerificationCode: code,
      phoneVerificationExpires: expires,
    });

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `Your StayShare verification code is: ${code}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        console.log(`📨 [TWILIO SMS] Attempted to send real SMS to ${phone}. Code was: ${code}`);
        return res.json({ message: "Verification code sent to your phone!" });
      } catch (smsErr) {
        console.error("Twilio SMS failed:", smsErr);
        return res.status(500).json({ message: "Failed to send SMS to your phone." });
      }
    } else {
      // Fallback to simulated mode
      console.log(`📨 [SIMULATED SMS OTP] Sent code ${code} to ${phone}`);
      return res.json({
        message: "Verification code sent successfully (simulated)",
        simulatedCode: code,
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to send verification code", error: err.message });
  }
}

// @route POST /api/users/me/verify-otp
// @access Private - verify OTP
async function verifyPhoneOTP(req, res) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Verification code is required" });
    }

    const user = await User.findById(req.user._id).select("+phoneVerificationCode +phoneVerificationExpires");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.phoneVerificationCode !== code) {
      return res.status(400).json({ message: "Incorrect verification code" });
    }

    if (new Date() > user.phoneVerificationExpires) {
      return res.status(400).json({ message: "Verification code has expired" });
    }

    user.phoneVerificationStatus = "verified";
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save();

    const userObj = user.toObject();
    userObj.profileCompletion = calculateCompletion(user);

    res.json({
      message: "Phone verified successfully!",
      user: userObj,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to verify code", error: err.message });
  }
}

module.exports = {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  uploadGovId,
  sendPhoneOTP,
  verifyPhoneOTP,
};
