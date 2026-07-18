const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stayRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StayRequest",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating (1-5)"],
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      required: [true, "Please write your review comments"],
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ["host-to-guest", "guest-to-host"],
      required: true,
    },
  },
  { timestamps: true }
);

// A user should only write one review per stay request for guest/host
reviewSchema.index({ stayRequest: 1, author: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
