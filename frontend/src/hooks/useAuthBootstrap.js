import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { refreshSession, getCurrentUser } from "../services/authService";

// Runs once when the app mounts. Tries to use the httpOnly refresh cookie to
// get a fresh access token and the user profile, so a page reload doesn't
// force the user to log in again. Fails silently if there's no valid session.
export function useAuthBootstrap() {
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    async function bootstrap() {
      try {
        const { accessToken } = await refreshSession();
        useAuthStore.getState().setAccessToken(accessToken);
        const user = await getCurrentUser();
        login(user, accessToken);
      } catch (err) {
        // No valid refresh cookie — user simply isn't logged in, not an error to surface
        logout();
      } finally {
        setAuthLoading(false);
      }
    }
    bootstrap();
  }, []);
}
