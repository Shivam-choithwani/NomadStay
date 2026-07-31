import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { logoutUser } from "../services/authService";
import { getImageUrl } from "../services/api";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const conversations = useChatStore((s) => s.conversations);
  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  async function handleLogout() {
    try {
      await logoutUser();
    } finally {
      logout();
      setIsOpen(false);
      navigate("/login");
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const avatarUrl = user?.avatarUrl ? getImageUrl(user.avatarUrl) : null;

  return (
    <nav style={{
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(0,0,0,0.08)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-tight gradient-text">
          NomadeStay
        </Link>

        {/* Nav Right */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/explore"
                className="hidden sm:flex text-sm font-semibold transition"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
              >
                Explore Hosts
              </Link>

              <Link
                to="/listings/new"
                className="hidden sm:flex text-sm font-semibold px-4 py-2 rounded-xl transition"
                style={{
                  background: "rgba(244,63,94,0.1)",
                  color: "#e11d48",
                  border: "1px solid rgba(244,63,94,0.2)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(244,63,94,0.18)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(244,63,94,0.1)";
                }}
              >
                + Host a Stay
              </Link>

              <Link
                to="/messages"
                className="text-sm font-semibold flex items-center gap-1.5 transition"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
              >
                Messages
                {totalUnreadCount > 0 && (
                  <span className="btn-glow text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {totalUnreadCount}
                  </span>
                )}
              </Link>

              <NotificationDropdown />

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 focus:outline-none cursor-pointer"
                >
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold uppercase"
                    style={{
                      border: "2px solid rgba(244,63,94,0.5)",
                      background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                      color: "#fff",
                      boxShadow: "0 4px 12px rgba(244,63,94,0.2)",
                    }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 py-1 z-50"
                    style={{
                      background: "rgba(255,255,255,0.98)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: "16px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1), 0 0 20px rgba(244,63,94,0.05)",
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Signed in as</p>
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                    </div>
                    {[
                      { to: "/profile", label: "My Profile", icon: "👤" },
                      { to: "/my-listings", label: "My Listings", icon: "🏠" },
                      { to: "/requests", label: "Stay Requests", icon: "📅" },
                      { to: "/messages", label: "Messages", icon: "💬" },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition cursor-pointer"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = "var(--accent)";
                          e.currentTarget.style.background = "rgba(244,63,94,0.1)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = "var(--text-secondary)";
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}

                    <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "4px 0" }} />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm transition cursor-pointer"
                      style={{ color: "#f87171" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span>🚪</span>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold transition"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="btn-glow text-white text-sm font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
