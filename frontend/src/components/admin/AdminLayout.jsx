import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user || user.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  const links = [
    { path: "/admin", label: "Stats Dashboard", icon: "📊" },
    { path: "/admin/users", label: "Manage Users", icon: "👥" },
    { path: "/admin/listings", label: "Manage Listings", icon: "🏠" },
    { path: "/admin/reviews", label: "Manage Reviews", icon: "⭐" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-150 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-100 bg-teal-50/20">
          <h2 className="text-lg font-bold text-teal-800 flex items-center gap-2">
            <span>🛡️</span> Admin Panel
          </h2>
          <p className="text-xs text-gray-400 mt-1">Logged in as {user.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            ← Back to NomadeStay
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
