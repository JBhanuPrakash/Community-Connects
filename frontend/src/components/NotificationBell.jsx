import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadUnreadCount = async () => {
      try {
        const response = await api.get(
          "/notifications/unread-count/",
        );

        if (active) {
          setUnreadCount(
            response.data.unread_count || 0,
          );
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    };

    loadUnreadCount();

    const intervalId = window.setInterval(
      loadUnreadCount,
      30000,
    );

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <Link
      to="/notifications"
      aria-label="Notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
    >
      <Bell size={21} />

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
          {unreadCount > 99
            ? "99+"
            : unreadCount}
        </span>
      )}
    </Link>
  );
}

export default NotificationBell;