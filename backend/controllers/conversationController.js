const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// @route POST /api/conversations
// @access Private
async function createConversation(req, res) {
  try {
    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot start a conversation with yourself" });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
    }).populate("participants", "name avatarUrl isVerified");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
      });
      conversation = await Conversation.findById(conversation._id).populate("participants", "name avatarUrl isVerified");
    }

    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ message: "Failed to initialize conversation", error: err.message });
  }
}

// @route GET /api/conversations
// @access Private - returns conversations user is a part of
async function getConversations(req, res) {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name avatarUrl isVerified")
      .populate("lastMessage.sender", "name")
      .sort({ updatedAt: -1 });

    // Calculate unread count for each conversation
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
        });

        return {
          ...conv.toObject(),
          unreadCount,
        };
      })
    );

    res.json(formattedConversations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch conversations", error: err.message });
  }
}

// @route GET /api/conversations/:id/messages
// @access Private - fetch messages inside thread
async function getMessages(req, res) {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ message: "Not authorized to view this chat history" });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const messages = await Message.find({ conversation: id })
      .populate("sender", "name avatarUrl")
      .sort({ createdAt: -1 }) // get newest first
      .skip(skip)
      .limit(limitNum);

    // Return in chronological order for frontend display
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages", error: err.message });
  }
}

module.exports = {
  createConversation,
  getConversations,
  getMessages,
};
