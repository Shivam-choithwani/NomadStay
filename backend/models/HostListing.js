const mongoose = require("mongoose");

const hostListingSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 2000,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: 200,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    // GeoJSON Point — enables MongoDB geospatial queries (e.g. $near)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    maxGuests: {
      type: Number,
      default: 1,
      min: 1,
    },
    amenities: {
      type: [String],
      default: [],
    },
    photos: {
      type: [String], // Cloudinary URLs, added in Phase 5
      default: [],
    },
    houseRules: {
      type: String,
      default: "",
    },
    availableDates: {
      type: [Date],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Geospatial index — required for $near / $geoWithin queries used in search filters later
hostListingSchema.index({ location: "2dsphere" });

hostListingSchema.post("save", async function(doc) {
  try {
    const { addSyncListingJob } = require("../workers/qdrantQueue");
    
    // Push to background queue instead of blocking the request
    await addSyncListingJob(doc);
    
  } catch (err) {
    console.error("Error adding listing to Qdrant sync queue:", err);
  }
});

module.exports = mongoose.model("HostListing", hostListingSchema);
