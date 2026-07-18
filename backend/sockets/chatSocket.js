const jwt = require("jsonwebtoken");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// Active user connection tracking (userId -> socketId)
const activeUsers = new Map();
let ioInstance = null;

function initializeChatSocket(io) {
  ioInstance = io;
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Token invalid"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: User ${socket.userId}`);
    activeUsers.set(socket.userId, socket.id);

    // Broadcast online status to contacts
    socket.broadcast.emit("user-online", socket.userId);

    // Join a specific conversation room
    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`🗣️ User ${socket.userId} joined room ${conversationId}`);
    });

    // Handle sending message
    socket.on("send-message", async (data) => {
      const { conversationId, text, imageUrl } = data;
      try {
        if (!conversationId || (!text && !imageUrl)) return;

        // Verify user belongs to conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId,
        });

        if (!conversation) {
          return socket.emit("error-message", "Conversation access denied");
        }

        // Save message to DB
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text,
          imageUrl: imageUrl || "",
          readBy: [socket.userId],
        });

        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "name avatarUrl");

        // Update last message in conversation
        conversation.lastMessage = {
          text: text || "Sent an image",
          sender: socket.userId,
          timestamp: new Date(),
        };
        await conversation.save();

        // Broadcast to conversation room
        io.to(conversationId).emit("new-message", populatedMessage);

        // Notify other participant of update if they are not in the room
        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== socket.userId.toString()) {
            const receiverSocketId = activeUsers.get(participantId.toString());
            if (receiverSocketId) {
              io.to(receiverSocketId).emit("conversation-updated", {
                conversationId,
                lastMessage: conversation.lastMessage,
              });
            }
          }
        });
      } catch (err) {
        console.error("Socket send-message error:", err);
      }
    });

    // Typing indicators
    socket.on("typing", (conversationId) => {
      socket.to(conversationId).emit("user-typing", {
        conversationId,
        userId: socket.userId,
      });
    });

    socket.on("stop-typing", (conversationId) => {
      socket.to(conversationId).emit("user-stop-typing", {
        conversationId,
        userId: socket.userId,
      });
    });

    // Mark messages as read
    socket.on("mark-read", async (conversationId) => {
      try {
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: socket.userId },
            readBy: { $ne: socket.userId },
          },
          {
            $addToSet: { readBy: socket.userId },
          }
        );

        socket.to(conversationId).emit("messages-read", {
          conversationId,
          userId: socket.userId,
        });
      } catch (err) {
        console.error("Socket mark-read error:", err);
      }
    });

    // Query online status of standard user list
    socket.on("get-online-status", (userIds, callback) => {
      if (typeof callback !== "function") return;
      const statuses = {};
      userIds.forEach((id) => {
        statuses[id] = activeUsers.has(id);
      });
      callback(statuses);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: User ${socket.userId}`);
      activeUsers.delete(socket.userId);
      socket.broadcast.emit("user-offline", socket.userId);
    });
  });
}

function sendSocketNotification(recipientId, notification) {
  if (!ioInstance) return;
  const recipientSocketId = activeUsers.get(recipientId.toString());
  if (recipientSocketId) {
    ioInstance.to(recipientSocketId).emit("new-notification", notification);
  }
}

module.exports = {
  initializeChatSocket,
  sendSocketNotification,
};
