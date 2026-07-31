import { create } from "zustand";
import api from "../services/api";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get("/notifications");
      set({
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to load notifications", isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        );
        const countDiff = state.notifications.find((n) => n._id === id && !n.isRead) ? 1 : 0;
        return {
          notifications: updated,
          unreadCount: Math.max(0, state.unreadCount - countDiff),
        };
      });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch("/notifications/read-all");
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  },

  addNotification: (notification) => {
    set((state) => {
      if (state.notifications.some((n) => n._id === notification._id)) return {};
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    });
  },
}));
