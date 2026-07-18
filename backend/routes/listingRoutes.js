const express = require("express");
const router = express.Router();
const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  ragSearchListings,
} = require("../controllers/listingController");
const { protect } = require("../middleware/authMiddleware");
const { uploadMultiplePhotos } = require("../middleware/uploadMiddleware");
const { ragSearchLimiter } = require("../middleware/rateLimiter");

router.get("/rag-search", ragSearchLimiter, ragSearchListings);

router.route("/")
  .get(getListings)
  .post(protect, uploadMultiplePhotos, createListing);

router.route("/:id")
  .get(getListingById)
  .put(protect, uploadMultiplePhotos, updateListing)
  .delete(protect, deleteListing);

module.exports = router;
