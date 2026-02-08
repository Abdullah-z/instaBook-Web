import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "timeago.js";
import { Bell, Trash2, User, MessageSquare } from "lucide-react";
import Sidebar from "../components/Sidebar";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";

const Notifications = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifies");
        setNotifications(res.data.notifies || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchNotifications();
  }, [token]);

  const handleMarkAsRead = async (notification) => {
    try {
      if (!notification.isRead) {
        await API.patch(`/isReadNotify/${notification._id}`);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n,
          ),
        );
      }

      if (notification.url) {
        if (notification.url.includes("/profile/")) {
          // Extract ID properly in case url structure varies slightly or use the absolute path
          // The mobile app splits by '/profile/', let's assume relative path or absolute
          navigate(notification.url);
        } else if (notification.url.includes("/post/")) {
          navigate(notification.url);
        } else {
          window.location.href = notification.url;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications?"))
      return;

    try {
      await API.delete("/deleteAllNotify");
      setNotifications([]);
      toast.success("All notifications deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete notifications");
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Sidebar />

      <main className="lg:pl-64 flex justify-center">
        <div className="max-w-2xl w-full py-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
              <Bell className="text-primary" size={32} />
              Notifications
            </h1>
            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="text-error font-bold text-sm hover:bg-error/10 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete All
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary opacity-50">
              <Bell size={80} strokeWidth={1} />
              <p className="mt-4 font-bold text-lg">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleMarkAsRead(notification)}
                  className={`
                    group relative p-4 rounded-2xl flex items-start gap-4 cursor-pointer transition-all border
                    ${
                      notification.isRead
                        ? "bg-bg-surface border-bg-primary/5 hover:border-bg-primary/20"
                        : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                    }
                  `}
                >
                  <div className="relative shrink-0">
                    <img
                      src={
                        notification.user?.avatar || "https://picsum.photos/50"
                      }
                      alt={notification.user?.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-bg-surface"
                    />
                    {!notification.isRead && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-bg-surface" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-text-primary">
                        {notification.user?.username}
                      </span>
                      <span className="text-text-secondary text-sm">
                        {notification.text}
                      </span>
                    </div>
                    {notification.content && (
                      <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                    )}
                    <p className="text-xs text-text-secondary font-bold mt-2 flex items-center gap-1">
                      {format(notification.createdAt)}
                    </p>
                  </div>

                  {notification.image && (
                    <img
                      src={notification.image}
                      alt="content"
                      className="w-12 h-12 rounded-lg object-cover ml-auto shrink-0"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
