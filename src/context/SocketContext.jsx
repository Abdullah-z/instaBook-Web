import React, { createContext, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { AuthContext } from "./AuthContext";
import API from "../utils/api";
import { toast } from "react-toastify";
// import notificationSound from "../assets/notification.mp3";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const refreshNotifications = async () => {
    if (user) {
      try {
        const res = await API.get("/notifies");
        setNotifications(res.data.notifies || []);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }
  };

  useEffect(() => {
    if (user) {
      refreshNotifications();
    } else {
      setNotifications([]); // Clear on logout
      setOnlineUsers(new Set());
    }
  }, [user?._id]);

  useEffect(() => {
    if (user) {
      const socketUrl = "https://instabook-server-production.up.railway.app";
      const newSocket = io(socketUrl, {
        transports: ["websocket"],
        reconnection: true,
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log(`[Socket] Connected with ID: ${newSocket.id}`);
        console.log(`[Socket] Joining as user: ${user._id}`);
        newSocket.emit("joinUser", user._id);

        // DEBUG: Listen for confirmation or errors logic here if server sent them (server doesn't currently)
      });

      newSocket.on("disconnect", (reason) => {
        console.warn(`[Socket] Disconnected: ${reason}`);
      });

      newSocket.on("connect_error", (err) => {
        console.error(`[Socket] Connection Error: ${err.message}`);
      });

      newSocket.on("addMessageToClient", (msg) => {
        // If the message is for me and NOT from me
        const isGroup = !!msg.conversation;
        const isForMe = msg.recipient === user._id || isGroup;
        const isFromMe = msg.sender?._id === user._id;

        if (isForMe && !isFromMe) {
          const senderName = msg.sender?.username || "User";
          const conversationId = isGroup ? msg.conversation : msg.sender?._id;

          toast.info(`New message from ${senderName}`, {
            onClick: () => navigate(`/messages?id=${conversationId}`),
            autoClose: 5000,
            cursor: "pointer",
          });
        }
      });

      newSocket.on("createNotifyToClient", (msg) => {
        setNotifications((prev) => [msg, ...prev]);
        toast.info("New Notification: " + msg.text);

        // Play sound
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch((e) => console.error("Audio play failed", e));
        } catch (e) {
          console.error("Audio error", e);
        }
      });

      newSocket.on("removeNotifyToClient", (msg) => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== msg.id && n.url !== msg.url),
        );
      });

      newSocket.on("userOnlineStatusChanged", (data) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isOnline) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      });

      newSocket.on("onlineUsersList", (userIds) => {
        setOnlineUsers(new Set(userIds));
      });

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        setNotifications,
        unreadCount,
        onlineUsers,
        refreshNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
