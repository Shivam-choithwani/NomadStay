import { create } from "zustand";

// Access token lives in memory only (not localStorage) — this is deliberate.
// localStorage is readable by any injected JS (XSS risk); an in-memory value
// disappears on tab close, which is fine because the httpOnly refresh cookie
// silently restores the session on reload (see AuthProvider's bootstrap call).
export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthLoading: true, // true until we've attempted the initial silent refresh

  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),

  login: (user, accessToken) => set({ user, accessToken, isAuthLoading: false }),
  logout: () => set({ user: null, accessToken: null, isAuthLoading: false }),
}));
