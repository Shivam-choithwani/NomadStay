const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      minlength: 6,
      select: false, // never return password by default in queries
      // Not required — Google OAuth users won't have one
    },

    // --- OAuth ---
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values (local-auth users)
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // --- Email verification ---
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // --- Password reset ---
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // --- Profile ---
    avatarUrl: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    languages: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    travelHistory: {
      type: [String],
      default: [],
    },
    socialLinks: {
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
    },
    locationCity: {
      type: String,
      default: "",
      trim: true,
    },
    locationCountry: {
      type: String,
      default: "",
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "prefer-not-to-say", ""],
      default: "",
    },

    // --- Role & status ---
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isHost: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    idDocumentUrl: {
      type: String,
      default: "",
    },
    idVerificationStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    phoneVerificationCode: {
      type: String,
      select: false,
    },
    phoneVerificationExpires: {
      type: Date,
      select: false,
    },
    phoneVerificationStatus: {
      type: String,
      enum: ["unverified", "verified"],
      default: "unverified",
    },

    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving, only if it was modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to check a candidate password against the stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate a random token for email verification; store hash in DB, return raw token
userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return rawToken;
};

// Generate a random token for password reset; store hash in DB, return raw token
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return rawToken;
};

module.exports = mongoose.model("User", userSchema);
