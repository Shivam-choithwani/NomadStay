const Notification = require("../models/Notification");

// @route GET /api/notifications
// @access Private
async function getNotifications(req, res) {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications", error: err.message });
  }
}

// @route PATCH /api/notifications/:id/read
// @access Private
async function markAsRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: "Failed to mark notification as read", error: err.message });
  }
}

// @route PATCH /api/notifications/read-all
// @access Private
async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all notifications as read", error: err.message });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
