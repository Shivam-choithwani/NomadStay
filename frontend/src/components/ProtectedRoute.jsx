import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  // Wait for the silent-refresh bootstrap to finish before deciding —
  // otherwise a logged-in user gets bounced to /login on every page refresh
  if (isAuthLoading) {
    return <p className="text-center py-8 text-gray-500">Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
