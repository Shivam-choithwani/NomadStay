import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useNotificationStore } from "../store/notificationStore";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = Math.floor(seconds / 31536000);

    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return "just now";
  };

  const getNotificationLink = (notification) => {
    const { type } = notification;
    if (type === "stay_request") return "/requests";
    if (type === "review") return "/profile";
    if (type === "message") return "/messages";
    return "#";
  };

  const handleNotificationClick = (id) => {
    markAsRead(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full text-gray-500 hover:text-teal-600 hover:bg-gray-100 transition focus:outline-none cursor-pointer flex items-center justify-center"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 italic bg-white">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif._id}
                  to={getNotificationLink(notif)}
                  onClick={() => handleNotificationClick(notif._id)}
                  className={`block p-4 hover:bg-teal-50/30 transition text-left ${
                    !notif.isRead ? "bg-teal-50/5" : "bg-white"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {notif.type === "stay_request" && (
                        <span className="text-base">📅</span>
                      )}
                      {notif.type === "review" && (
                        <span className="text-base">⭐</span>
                      )}
                      {notif.type === "message" && (
                        <span className="text-base">💬</span>
                      )}
                      {notif.type === "verification" && (
                        <span className="text-base">🛡️</span>
                      )}
                    </div>
                    
                    <div className="space-y-0.5 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-xs font-semibold text-gray-900 ${!notif.isRead ? "font-bold text-teal-950" : ""}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
