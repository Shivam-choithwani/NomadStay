import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { BACKEND_URL } from "../services/api";
import { useNotificationStore } from "../store/notificationStore";

export function useSocket() {
  const socketRef = useRef(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const addUserOnline = useChatStore((s) => s.addUserOnline);
  const removeUserOffline = useChatStore((s) => s.removeUserOffline);
  const updateConversationLastMessage = useChatStore((s) => s.updateConversationLastMessage);
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers);

  useEffect(() => {
    if (!accessToken || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to backend Socket.IO server
    const socket = io(BACKEND_URL, {
      auth: { token: accessToken },
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Connected to Chat WebSocket");
    });

    // Listen for new messages
    socket.on("new-message", (message) => {
      addMessage(message);
    });

    // Listen for new notifications
    socket.on("new-notification", (notification) => {
      useNotificationStore.getState().addNotification(notification);
    });

    // Listen for typing events
    socket.on("user-typing", ({ conversationId, userId }) => {
      setTyping(conversationId, userId, true);
    });

    socket.on("user-stop-typing", ({ conversationId, userId }) => {
      setTyping(conversationId, userId, false);
    });

    // Listen for user presence events
    socket.on("user-online", (userId) => {
      addUserOnline(userId);
    });

    socket.on("user-offline", (userId) => {
      removeUserOffline(userId);
    });

    // Listen for lazy thread metadata updates
    socket.on("conversation-updated", ({ conversationId, lastMessage }) => {
      updateConversationLastMessage(conversationId, lastMessage);
    });

    // Query initial online status of active participants
    const intervalId = setInterval(() => {
      const activeParticipants = useChatStore.getState().conversations
        .flatMap((c) => c.participants)
        .map((p) => p._id)
        .filter((id) => id !== user.id);

      if (activeParticipants.length > 0 && socket.connected) {
        socket.emit("get-online-status", activeParticipants, (statuses) => {
          const onlineIds = Object.keys(statuses).filter((id) => statuses[id]);
          setOnlineUsers(onlineIds);
        });
      }
    }, 15000); // refresh every 15s

    return () => {
      clearInterval(intervalId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user]);

  // Event emission triggers
  const sendMessage = (conversationId, text, imageUrl = "") => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("send-message", { conversationId, text, imageUrl });
    }
  };

  const startTyping = (conversationId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("typing", conversationId);
    }
  };

  const stopTyping = (conversationId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("stop-typing", conversationId);
    }
  };

  const markAsRead = (conversationId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("mark-read", conversationId);
    }
  };

  const joinConversation = (conversationId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("join-conversation", conversationId);
    }
  };

  return {
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    joinConversation,
  };
}
