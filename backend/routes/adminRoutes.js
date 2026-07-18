const express = require("express");
const router = express.Router();
const {
  getStats,
  getUsers,
  toggleUserBan,
  verifyUserGovId,
  getListings,
  deleteListing,
  getReviews,
  deleteReview,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");

router.use(protect);
router.use(isAdmin);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.patch("/users/:id/ban", toggleUserBan);
router.patch("/users/:id/verify-id", verifyUserGovId);
router.get("/listings", getListings);
router.delete("/listings/:id", deleteListing);
router.get("/reviews", getReviews);
router.delete("/reviews/:id", deleteReview);

module.exports = router;
