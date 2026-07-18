const express = require("express");
const router = express.Router();
const { createStayRequest, getStayRequests, updateStayRequestStatus } = require("../controllers/stayRequestController");
const { protect } = require("../middleware/authMiddleware");

router.route("/")
  .post(protect, createStayRequest)
  .get(protect, getStayRequests);

router.route("/:id/status")
  .patch(protect, updateStayRequestStatus);

module.exports = router;
