import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const { data } = await api.get("/admin/stats");
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard metrics");
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) return <p className="text-gray-500 text-sm">Loading stats...</p>;
  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  const requestStats = stats.requestStatusStats || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Platform analytics and key performance indicators.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{stats.totalUsers}</p>
        </div>

        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Stays/Listings</span>
            <span className="text-2xl">🏠</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{stats.totalListings}</p>
        </div>

        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Stay Requests</span>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{stats.totalRequests}</p>
        </div>

        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Host Rating</span>
            <span className="text-2xl">⭐</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{stats.avgRating} / 5.0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Stay Requests Statuses</h3>
          <div className="space-y-3">
            {[
              { status: "pending", label: "Pending Review", color: "bg-yellow-500" },
              { status: "accepted", label: "Approved/Accepted", color: "bg-green-500" },
              { status: "declined", label: "Declined", color: "bg-red-500" },
              { status: "cancelled", label: "Cancelled", color: "bg-gray-405" },
              { status: "completed", label: "Completed Stays", color: "bg-teal-600" },
            ].map((item) => {
              const count = requestStats[item.status] || 0;
              const pct = stats.totalRequests ? Math.round((count / stats.totalRequests) * 100) : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-600">
                    <span>{item.label}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color || "bg-teal-500"}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Quick Actions</h3>
            <p className="text-xs text-gray-500">Go directly to administrative logs and moderation controls.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="/admin/users"
              className="flex items-center justify-center p-3 border border-gray-100 hover:border-gray-250 bg-gray-50 hover:bg-gray-100/50 rounded-xl text-center text-xs font-bold text-gray-700 transition"
            >
              Verify Users
            </a>
            <a
              href="/admin/listings"
              className="flex items-center justify-center p-3 border border-gray-100 hover:border-gray-250 bg-gray-50 hover:bg-gray-100/50 rounded-xl text-center text-xs font-bold text-gray-700 transition"
            >
              Moderate Stays
            </a>
            <a
              href="/admin/reviews"
              className="flex items-center justify-center p-3 border border-gray-100 hover:border-gray-250 bg-gray-50 hover:bg-gray-100/50 rounded-xl text-center text-xs font-bold text-gray-700 transition"
            >
              Inspect Reviews
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
