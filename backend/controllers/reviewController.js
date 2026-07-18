const Review = require("../models/Review");
const StayRequest = require("../models/StayRequest");
const { createNotification } = require("../services/notificationService");

// @route POST /api/reviews
// @access Private
async function createReview(req, res) {
  try {
    const { stayRequestId, rating, text } = req.body;

    if (!stayRequestId || !rating || !text) {
      return res.status(400).json({ message: "stayRequestId, rating, and text are required" });
    }

    const stay = await StayRequest.findById(stayRequestId);
    if (!stay) {
      return res.status(404).json({ message: "Stay request not found" });
    }

    if (stay.status !== "completed") {
      return res.status(400).json({ message: "You can only review a stay that is marked as completed" });
    }

    const isGuest = stay.guest.toString() === req.user._id.toString();
    const isHost = stay.host.toString() === req.user._id.toString();

    if (!isGuest && !isHost) {
      return res.status(403).json({ message: "You were not a participant in this stay" });
    }

    const reviewType = isGuest ? "guest-to-host" : "host-to-guest";
    const targetUserId = isGuest ? stay.host : stay.guest;

    // Check if review already exists to prevent duplicates
    const existingReview = await Review.findOne({
      stayRequest: stayRequestId,
      author: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already written a review for this stay" });
    }

    const review = await Review.create({
      author: req.user._id,
      target: targetUserId,
      stayRequest: stayRequestId,
      rating,
      text,
      type: reviewType,
    });

    const populatedReview = await Review.findById(review._id).populate("author", "name avatarUrl");

    // Trigger notification to the review target
    try {
      await createNotification({
        recipient: targetUserId,
        type: "review",
        title: "New Review Received ⭐",
        body: `${req.user.name} left you a ${rating}-star review.`,
        data: { reviewId: review._id, stayRequestId },
      });
    } catch (notifErr) {
      console.error("Failed to create review notification:", notifErr);
    }

    res.status(201).json(populatedReview);
  } catch (err) {
    res.status(500).json({ message: "Failed to submit review", error: err.message });
  }
}

// @route GET /api/reviews/user/:userId
// @access Public - fetch all reviews targeted to a user (reviews they received)
async function getUserReviews(req, res) {
  try {
    const reviews = await Review.find({ target: req.params.userId })
      .populate("author", "name avatarUrl locationCity locationCountry")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
}

module.exports = {
  createReview,
  getUserReviews,
};
