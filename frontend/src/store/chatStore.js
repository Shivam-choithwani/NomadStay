import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  conversations: [],
  messages: [],
  activeConversation: null,
  typingUsers: {}, // { [conversationId]: [userIds] }
  onlineUsers: [],

  setConversations: (conversations) => set({ conversations }),
  
  setActiveConversation: (activeConversation) => {
    set({ activeConversation, messages: [] });
    // Reset unread count locally when active
    if (activeConversation) {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c
        ),
      }));
    }
  },

  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => {
    const { activeConversation, conversations } = get();
    
    // If message belongs to active thread, append it
    if (activeConversation && message.conversation === activeConversation._id) {
      set((state) => ({ messages: [...state.messages, message] }));
    }

    // Update last message in conversation list
    set({
      conversations: conversations.map((c) => {
        if (c._id === message.conversation) {
          const isOwn = message.sender._id === useChatStore.getState().userId; // we'll read user from authStore
          return {
            ...c,
            lastMessage: {
              text: message.text || "Sent an image",
              sender: message.sender,
              timestamp: message.createdAt,
            },
            unreadCount:
              activeConversation && activeConversation._id === message.conversation
                ? 0
                : isOwn
                ? c.unreadCount
                : (c.unreadCount || 0) + 1,
          };
        }
        return c;
      }),
    });
  },

  updateConversationLastMessage: (conversationId, lastMessage) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, lastMessage } : c
      ),
    }));
  },

  setTyping: (conversationId, userId, isTyping) => {
    set((state) => {
      const activeTyping = state.typingUsers[conversationId] || [];
      let updatedTyping;
      if (isTyping) {
        updatedTyping = activeTyping.includes(userId)
          ? activeTyping
          : [...activeTyping, userId];
      } else {
        updatedTyping = activeTyping.filter((id) => id !== userId);
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updatedTyping,
        },
      };
    });
  },

  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  
  addUserOnline: (userId) => {
    set((state) => ({
      onlineUsers: state.onlineUsers.includes(userId)
        ? state.onlineUsers
        : [...state.onlineUsers, userId],
    }));
  },

  removeUserOffline: (userId) => {
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    }));
  },
}));
