const express = require("express");
const router = express.Router();
const { getHistory, updateHistoryNotes } = require("../controllers/historyController");
const { protect } = require("../middleware/authMiddleware");

// All history routes are protected
router.use(protect);

router.get("/", getHistory);
router.put("/:id/notes", updateHistoryNotes);

module.exports = router;
