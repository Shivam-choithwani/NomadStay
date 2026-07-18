const mongoose = require("mongoose");

const stayRequestSchema = new mongoose.Schema(
  {
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HostListing",
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: [true, "Please introduce yourself to the host"],
      maxlength: 1000,
    },
    arrivalDate: {
      type: Date,
      required: [true, "Arrival date is required"],
    },
    departureDate: {
      type: Date,
      required: [true, "Departure date is required"],
    },
    numberOfGuests: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StayRequest", stayRequestSchema);
