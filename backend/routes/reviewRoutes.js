const express = require("express");
const router = express.Router();
const { createReview, getUserReviews } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

router.route("/")
  .post(protect, createReview);

router.route("/user/:userId")
  .get(getUserReviews);

module.exports = router;
