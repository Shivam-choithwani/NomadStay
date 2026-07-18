const TravelHistory = require("../models/TravelHistory");

// @route GET /api/history
// @access Private
// Get logged in user's travel history
async function getHistory(req, res) {
  try {
    const history = await TravelHistory.find({ traveller: req.user._id })
      .populate("host", "name avatarUrl")
      .populate("listing", "title city country photos")
      .sort({ arrivalDate: -1 });

    // Decrypt notes before sending to the client
    const decryptedHistory = history.map(h => {
      const hObj = h.toObject();
      hObj.privateNotes = h.getDecryptedNotes();
      return hObj;
    });

    res.json(decryptedHistory);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch travel history", error: err.message });
  }
}

// @route PUT /api/history/:id/notes
// @access Private
// Update encrypted private notes for a specific history record
async function updateHistoryNotes(req, res) {
  try {
    const { privateNotes } = req.body;
    const historyId = req.params.id;

    const historyRecord = await TravelHistory.findOne({ _id: historyId, traveller: req.user._id });
    if (!historyRecord) {
      return res.status(404).json({ message: "History record not found" });
    }

    historyRecord.privateNotes = privateNotes || "";
    await historyRecord.save();

    const updatedObj = historyRecord.toObject();
    updatedObj.privateNotes = historyRecord.getDecryptedNotes();

    res.json(updatedObj);
  } catch (err) {
    res.status(500).json({ message: "Failed to update notes", error: err.message });
  }
}

module.exports = {
  getHistory,
  updateHistoryNotes,
};
