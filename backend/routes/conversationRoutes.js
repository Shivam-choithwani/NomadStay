const express = require("express");
const router = express.Router();
const { createConversation, getConversations, getMessages } = require("../controllers/conversationController");
const { protect } = require("../middleware/authMiddleware");

router.route("/")
  .post(protect, createConversation)
  .get(protect, getConversations);

router.route("/:id/messages")
  .get(protect, getMessages);

module.exports = router;
