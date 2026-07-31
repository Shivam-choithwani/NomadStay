import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getCurrentUser } from "../services/authService";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    async function handleCallback() {
      const token = searchParams.get("token");
      if (token) {
        try {
          // Set temporary token in store so that subsequent getCurrentUser call is authorized
          useAuthStore.getState().setAccessToken(token);

          // Get profile
          const user = await getCurrentUser();

          // Full login state setup
          login(user, token);
          navigate("/");
        } catch (err) {
          console.error("OAuth callback initialization failed", err);
          navigate("/login?error=oauth_init_failed");
        }
      } else {
        navigate("/login?error=no_token");
      }
    }
    handleCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 font-semibold">Completing Google Login...</p>
      </div>
    </div>
  );
}
