const Notification = require("../models/Notification");
const { sendSocketNotification } = require("../sockets/chatSocket");

async function createNotification({ recipient, type, title, body, data }) {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      body,
      data: data || {},
    });

    // Emit live socket event to the recipient
    sendSocketNotification(recipient, notification);

    return notification;
  } catch (err) {
    console.error("Failed to create notification:", err);
    throw err;
  }
}

module.exports = {
  createNotification,
};
