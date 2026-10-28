import {
  Bell,
  CalendarCheck,
  Check,
  CheckCheck,
  MessageCircle,
  Ticket,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import { RowItemSkeleton } from "../components/Skeleton";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchNotifications = useCallback(async () => {
    const response = await api.get("/notifications/");

    return response.data.results || response.data || [];
  }, []);

  useEffect(() => {
    let active = true;

    fetchNotifications()
      .then((items) => {
        if (active) {
          setNotifications(items);
          setLoading(false);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.detail ||
              "Unable to load notifications.",
          );

          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchNotifications]);

  const markAsRead = async (notification) => {
    if (notification.is_read) {
      openNotification(notification);
      return;
    }

    setActionLoading(notification.id);
    setError("");

    try {
      const response = await api.post(
        `/notifications/${notification.id}/read/`,
      );

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? response.data.notification
            : item,
        ),
      );

      openNotification({
        ...notification,
        is_read: true,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to mark notification as read.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openNotification = (notification) => {
    if (notification.target_url) {
      navigate(notification.target_url);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post(
        "/notifications/read-all/",
      );

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
          read_at:
            notification.read_at ||
            new Date().toISOString(),
        })),
      );

      setMessage(response.data.message);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to mark all notifications as read.",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    const confirmed = window.confirm(
      "Delete this notification?",
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(notificationId);
    setError("");
    setMessage("");

    try {
      await api.delete(
        `/notifications/${notificationId}/delete/`,
      );

      setNotifications((previous) =>
        previous.filter(
          (notification) =>
            notification.id !== notificationId,
        ),
      );

      setMessage("Notification deleted.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to delete notification.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-12">

        <RowItemSkeleton rows={5} />

      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
            Updates
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Notifications
          </h1>

          <p className="mt-3 text-slate-600">
            You have {unreadCount} unread notification
            {unreadCount === 1 ? "" : "s"}.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-700 px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
          >
            <CheckCheck size={18} />

            {markingAll
              ? "Marking..."
              : "Mark All as Read"}
          </button>
        )}
      </div>

      {message && (
        <div className="mb-6 rounded-xl bg-green-50 px-5 py-4 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      {!error && notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <Bell
            size={48}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            No notifications
          </h2>

          <p className="mt-2 text-slate-500">
            Your registration and event updates will
            appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              loading={
                actionLoading === notification.id
              }
              onOpen={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function NotificationCard({
  notification,
  loading,
  onOpen,
  onDelete,
}) {
  const icon = getNotificationIcon(
    notification.notification_type,
  );

  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm transition ${
        notification.is_read
          ? "border-slate-200 bg-white"
          : "border-indigo-200 bg-indigo-50/60"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-white p-3 text-indigo-700 shadow-sm">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-slate-900">
                  {notification.title}
                </h2>

                {!notification.is_read && (
                  <span className="rounded-full bg-indigo-700 px-2 py-0.5 text-xs font-semibold text-white">
                    New
                  </span>
                )}
              </div>

              <p className="mt-2 leading-7 text-slate-600">
                {notification.message}
              </p>
            </div>

            <p className="whitespace-nowrap text-xs text-slate-500">
              {formatNotificationDate(
                notification.created_at,
              )}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {notification.target_url && (
              <button
                type="button"
                onClick={() => onOpen(notification)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
              >
                {notification.is_read ? (
                  <Check size={16} />
                ) : (
                  <Bell size={16} />
                )}

                Open
              </button>
            )}

            {!notification.is_read &&
              !notification.target_url && (
                <button
                  type="button"
                  onClick={() =>
                    onOpen(notification)
                  }
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-700 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                >
                  <Check size={16} />
                  Mark as Read
                </button>
              )}

            <button
              type="button"
              onClick={() =>
                onDelete(notification.id)
              }
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function getNotificationIcon(type) {
  const icons = {
    REGISTRATION: <Ticket size={22} />,
    REGISTRATION_CANCELLED: (
      <XCircle size={22} />
    ),
    EVENT_APPROVED: (
      <CalendarCheck size={22} />
    ),
    EVENT_REJECTED: <XCircle size={22} />,
    EVENT_CANCELLED: <XCircle size={22} />,
    REVIEW_REPLY: <MessageCircle size={22} />,
    ATTENDANCE: <CheckCheck size={22} />,
    GENERAL: <Bell size={22} />,
  };

  return icons[type] || icons.GENERAL;
}

function formatNotificationDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const now = new Date();
  const difference =
    now.getTime() - date.getTime();

  const minutes = Math.floor(
    difference / (1000 * 60),
  );

  const hours = Math.floor(
    difference / (1000 * 60 * 60),
  );

  const days = Math.floor(
    difference / (1000 * 60 * 60 * 24),
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default Notifications;