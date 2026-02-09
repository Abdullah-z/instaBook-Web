import React, { useEffect, useState, useContext, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "timeago.js";
import {
  Send,
  Image as ImageIcon,
  Phone,
  Video,
  Info,
  User,
  Loader2,
  ArrowLeft,
  MapPin,
  Navigation,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { SocketContext } from "../context/SocketContext";
import { toast } from "react-toastify";
import { imageUpload } from "../utils/imageUpload";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { VoiceCallContext } from "../context/VoiceCallContext";
import Draggable from "react-draggable";

const Messages = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useContext(SocketContext) || {};
  const {
    startCall,
    callState,
    acceptCall,
    rejectCall,
    leaveCall,
    localVideoTrack,
    remoteUsers,
    simulateIncomingCall,
  } = useContext(VoiceCallContext) || {};

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [isHD, setIsHD] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);

  const scrollRef = useRef();
  const localVideoRef = useRef();

  // Use search params to handle selected chat ?id=...
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get("id");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await API.get("/conversations?limit=50");
        setConversations(res.data.conversations || []);

        // If ID in URL, find or fetch that user to start chat
        if (selectedUserId) {
          const existingConv = res.data.conversations.find((c) => {
            const other = c.recipients.find((r) => r._id !== user._id);
            return other?._id === selectedUserId;
          });

          if (existingConv) {
            const other = existingConv.recipients.find(
              (r) => r._id !== user._id,
            );
            setCurrentChat(other);
          } else {
            // Fetch user info if not in conversations list
            try {
              const userRes = await API.get(`/user/${selectedUserId}`);
              setCurrentChat(userRes.data.user);
            } catch (e) {
              console.error("User not found");
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchConversations();
  }, [user, selectedUserId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat) return;
      setMessagesLoading(true);
      try {
        const res = await API.get(`/message/${currentChat._id}?limit=50`);
        setMessages(res.data.messages.reverse()); // Reverse to show newest at bottom
      } catch (err) {
        console.error(err);
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [currentChat]);

  // Real-time message handling
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      // Update conversation list
      setConversations((prev) => {
        const existing = prev.find((c) => {
          const other = c.recipients.find((r) => r._id !== user._id);
          return (
            other?._id === (msg.sender._id || msg.sender) ||
            other?._id === (msg.recipient._id || msg.recipient)
          );
        });

        if (existing) {
          // Move to top and update text
          const others = prev.filter((c) => c !== existing);
          return [
            { ...existing, text: msg.text, updatedAt: msg.createdAt },
            ...others,
          ];
        }
        return prev; // Or re-fetch conversations to get new new one
      });

      // If chat is open, append message
      if (
        currentChat &&
        (msg.sender._id === currentChat._id ||
          msg.recipient._id === currentChat._id)
      ) {
        setMessages((prev) => [...prev, msg]);
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    socket.on("addMessageToClient", handleMessage);

    return () => socket.off("addMessageToClient", handleMessage);
  }, [socket, currentChat, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && images.length === 0) return;

    const isGroup = currentChat.isGroup;
    const msgData = {
      recipient: isGroup ? undefined : currentChat._id,
      conversationId: isGroup ? currentChat._id : undefined,
      text: newMessage,
      media: [],
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    const tempId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        ...msgData,
        _id: tempId,
        sender: user,
      },
    ]);
    setNewMessage("");
    setImages([]);

    try {
      let media = [];
      if (images.length > 0) media = await imageUpload(images, isHD);

      const res = await API.post("/message", {
        ...msgData,
        media,
        location: undefined, // Location handled separately
      });

      // Socket emit
      socket.emit("addMessage", {
        ...res.data.newMessage,
        sender: user,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    }
  };

  const handleImageChange = (e) => {
    const files = [...e.target.files];
    setImages(files);
  };

  const getOtherUser = (conversation) => {
    if (!user) return null;
    return conversation.recipients?.find((r) => r._id !== user._id);
  };

  const handleLocationSelect = async (loc) => {
    setShowLocation(false);
    const isGroup = currentChat.isGroup;
    // Send location message
    try {
      const msgData = {
        recipient: isGroup ? undefined : currentChat._id,
        conversationId: isGroup ? currentChat._id : undefined,
        text: `📍 Shared Location: ${loc.description}`,
        location: {
          lat: loc.coordinates[1],
          lon: loc.coordinates[0],
          address: loc.description,
        },
        createdAt: new Date().toISOString(),
      };

      const res = await API.post("/message", msgData);
      socket.emit("addMessage", { ...res.data.newMessage, sender: user });
      setMessages((prev) => [
        ...prev,
        { ...msgData, sender: user, _id: Date.now() },
      ]);
    } catch (e) {
      toast.error("Failed to share location");
    }
  };

  const shareCurrentLocation = async () => {
    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        return;
      }

      toast.info("Getting your location...");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get address
          let address = "Shared Location";
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            );
            const data = await response.json();
            if (data.display_name) {
              address = data.display_name;
            }
          } catch (err) {
            console.error("Reverse geocoding failed:", err);
          }

          // Send location message
          try {
            const isGroup = currentChat.isGroup;
            const msgData = {
              recipient: isGroup ? undefined : currentChat._id,
              conversationId: isGroup ? currentChat._id : undefined,
              text: `📍 Current Location`,
              location: {
                lat: latitude,
                lon: longitude,
                address: address,
              },
              createdAt: new Date().toISOString(),
            };

            const res = await API.post("/message", msgData);
            socket.emit("addMessage", { ...res.data.newMessage, sender: user });
            setMessages((prev) => [
              ...prev,
              { ...msgData, sender: user, _id: Date.now() },
            ]);
            toast.success("Location shared!");
          } catch (e) {
            toast.error("Failed to share location");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Location permission denied");
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            toast.error("Location information unavailable");
          } else if (error.code === error.TIMEOUT) {
            toast.error("Location request timed out");
          } else {
            toast.error("Failed to get location");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    } catch (err) {
      console.error("Error sharing location:", err);
      toast.error("Failed to share location");
    }
  };

  // Play video tracks
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
  }, [localVideoTrack]);

  useEffect(() => {
    remoteUsers.forEach((user) => {
      const el = document.getElementById(`remote-video-${user.uid}`);
      if (el && user.videoTrack) {
        user.videoTrack.play(el);
      }
    });
  }, [remoteUsers]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex relative">
      <Sidebar />

      {showLocation && (
        <LocationAutocomplete
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocation(false)}
        />
      )}

      <main className="lg:pl-64 flex-1 flex h-screen overflow-hidden">
        {/* Chat List (Sidebar on page) */}
        <div
          className={`w-full lg:w-96 border-r border-bg-surface flex flex-col bg-bg-primary ${currentChat ? "hidden lg:flex" : "flex"}`}
        >
          <div className="p-4 border-b border-bg-surface">
            <h1 className="text-2xl font-black tracking-tight">Messages</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                <p>No conversations yet.</p>
                <p className="text-sm mt-2">Start chatting with people!</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherUser(conv);
                if (!other && !conv.isGroup) return null;

                const displayName = conv.isGroup
                  ? conv.groupName
                  : other.username;
                const displayAvatar = conv.isGroup
                  ? conv.groupAvatar
                  : other.avatar;
                const isActive = conv.isGroup
                  ? currentChat?._id === conv._id
                  : currentChat?._id === other._id;
                const isOnline = !conv.isGroup && onlineUsers.has(other._id);

                return (
                  <div
                    key={conv._id}
                    onClick={() => {
                      setCurrentChat(conv.isGroup ? conv : other);
                      setSearchParams({
                        id: conv.isGroup ? conv._id : other._id,
                      });
                    }}
                    className={`flex items-center gap-4 p-4 hover:bg-bg-surface cursor-pointer transition-colors ${isActive ? "bg-bg-surface border-l-4 border-primary" : ""}`}
                  >
                    <div className="relative">
                      <img
                        src={displayAvatar || "https://picsum.photos/50"}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-bg-primary"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-bold truncate">{displayName}</h3>
                        <span className="text-xs text-text-secondary whitespace-nowrap">
                          {format(conv.updatedAt)}
                        </span>
                      </div>
                      <p
                        className={`text-sm truncate ${isActive ? "text-text-primary" : "text-text-secondary"}`}
                      >
                        {conv.text ||
                          (conv.media?.length > 0
                            ? "Sent an attachment"
                            : "No messages")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div
          className={`flex-1 flex flex-col bg-bg-surface/30 ${!currentChat ? "hidden lg:flex" : "flex"}`}
        >
          {!currentChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
              <div className="w-20 h-20 bg-bg-surface rounded-full flex items-center justify-center mb-4">
                <Send size={40} className="ml-2" />
              </div>
              <h2 className="text-xl font-bold">Your Messages</h2>
              <p>Select a chat to start messaging</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-bg-surface flex justify-between items-center bg-bg-primary/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentChat(null)}
                    className="lg:hidden p-2 -ml-2"
                  >
                    <ArrowLeft />
                  </button>
                  <div className="relative">
                    <img
                      src={
                        (currentChat.isGroup
                          ? currentChat.groupAvatar
                          : currentChat.avatar) || "https://picsum.photos/50"
                      }
                      alt={
                        currentChat.isGroup
                          ? currentChat.groupName
                          : currentChat.username
                      }
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {!currentChat.isGroup &&
                      onlineUsers.has(currentChat._id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-bg-primary"></div>
                      )}
                  </div>
                  <div>
                    <h3 className="font-bold">
                      {currentChat.isGroup
                        ? currentChat.groupName
                        : currentChat.username}
                    </h3>
                    <span className="text-xs text-text-secondary">
                      {currentChat.isGroup
                        ? `${currentChat.recipients?.length || 0} members`
                        : onlineUsers.has(currentChat._id)
                          ? "Active now"
                          : "Offline"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 text-primary">
                  <button
                    onClick={() => startCall(currentChat, false)}
                    className="p-2 hover:bg-bg-surface rounded-full transition-colors"
                  >
                    <Phone size={20} />
                  </button>
                  <button
                    onClick={() => startCall(currentChat, true)}
                    className="p-2 hover:bg-bg-surface rounded-full transition-colors"
                  >
                    <Video size={20} />
                  </button>
                  <button className="p-2 hover:bg-bg-surface rounded-full transition-colors">
                    <Info size={20} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender._id === user._id;

                    // Check if we need to show a date separator
                    const showDateSeparator =
                      idx === 0 ||
                      new Date(messages[idx - 1].createdAt).toDateString() !==
                        new Date(msg.createdAt).toDateString();

                    const messageDate = new Date(msg.createdAt);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    let dateLabel;
                    if (messageDate.toDateString() === today.toDateString()) {
                      dateLabel = "Today";
                    } else if (
                      messageDate.toDateString() === yesterday.toDateString()
                    ) {
                      dateLabel = "Yesterday";
                    } else {
                      dateLabel = messageDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year:
                          messageDate.getFullYear() !== today.getFullYear()
                            ? "numeric"
                            : undefined,
                      });
                    }

                    return (
                      <React.Fragment key={idx}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-bg-surface px-3 py-1 rounded-full text-xs text-text-secondary font-semibold">
                              {dateLabel}
                            </div>
                          </div>
                        )}
                        <div
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl ${msg.call || (msg.location && msg.location.lat) ? "p-0 overflow-hidden" : "p-3"} ${isMe ? "bg-primary text-on-primary" : "bg-bg-surface text-text-primary"}`}
                          >
                            {/* Call Log Card */}
                            {msg.call ? (
                              <div className="p-3 flex items-center gap-3">
                                <div
                                  className={`p-3 rounded-full ${isMe ? "bg-on-primary/10" : "bg-primary/10"}`}
                                >
                                  {msg.call.video ? (
                                    <Video
                                      size={20}
                                      className={
                                        isMe
                                          ? "text-on-primary"
                                          : "text-primary"
                                      }
                                    />
                                  ) : (
                                    <Phone
                                      size={20}
                                      className={
                                        isMe
                                          ? "text-on-primary"
                                          : "text-primary"
                                      }
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p
                                    className={`font-semibold text-sm ${isMe ? "text-on-primary" : "text-text-primary"}`}
                                  >
                                    {msg.call.status === "accepted"
                                      ? `${msg.call.video ? "Video" : "Voice"} call`
                                      : msg.call.status === "rejected"
                                        ? `Declined ${msg.call.video ? "video" : "voice"} call`
                                        : `Missed ${msg.call.video ? "video" : "voice"} call`}
                                  </p>
                                  {msg.call.status === "accepted" &&
                                  msg.call.duration ? (
                                    <p
                                      className={`text-xs ${isMe ? "text-on-primary/70" : "text-text-secondary"}`}
                                    >
                                      {Math.floor(msg.call.duration / 60)} min{" "}
                                      {msg.call.duration % 60} sec
                                    </p>
                                  ) : msg.call.status === "missed" ? (
                                    <p className="text-xs text-error">
                                      Tap to call back
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            ) : msg.location &&
                              msg.location.lat &&
                              msg.location.lon ? (
                              /* Location Card */
                              <div>
                                <div className="p-3 flex items-center gap-3">
                                  <div
                                    className={`p-3 rounded-full ${isMe ? "bg-on-primary/10" : "bg-primary/10"}`}
                                  >
                                    <MapPin
                                      size={20}
                                      className={
                                        isMe
                                          ? "text-on-primary"
                                          : "text-primary"
                                      }
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p
                                      className={`font-semibold text-sm ${isMe ? "text-on-primary" : "text-text-primary"}`}
                                    >
                                      Location
                                    </p>
                                    <p
                                      className={`text-xs ${isMe ? "text-on-primary/70" : "text-text-secondary"}`}
                                    >
                                      {msg.location.address ||
                                        "Shared Location"}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={`flex border-t ${isMe ? "border-on-primary/20" : "border-bg-primary"}`}
                                >
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `/map?lat=${msg.location.lat}&lon=${msg.location.lon}`,
                                        "_blank",
                                      )
                                    }
                                    className={`flex-1 py-2 text-xs font-semibold ${isMe ? "text-on-primary hover:bg-on-primary/10" : "text-primary hover:bg-primary/5"} transition-colors`}
                                  >
                                    View on Map
                                  </button>
                                  <div
                                    className={`w-px ${isMe ? "bg-on-primary/20" : "bg-bg-primary"}`}
                                  />
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `https://maps.google.com/?q=${msg.location.lat},${msg.location.lon}`,
                                        "_blank",
                                      )
                                    }
                                    className={`flex-1 py-2 text-xs font-semibold ${isMe ? "text-on-primary hover:bg-on-primary/10" : "text-primary hover:bg-primary/5"} transition-colors`}
                                  >
                                    Open in Maps
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Regular Message */
                              <>
                                {msg.media && msg.media.length > 0 && (
                                  <div className="mb-2">
                                    {msg.media.map((m, i) => (
                                      <img
                                        key={i}
                                        src={m.url}
                                        alt="attachment"
                                        className="rounded-lg max-h-60 object-cover"
                                      />
                                    ))}
                                  </div>
                                )}
                                {msg.text && <p>{msg.text}</p>}
                                <p
                                  className={`text-[10px] mt-1 text-right ${isMe ? "text-on-primary/70" : "text-text-secondary"}`}
                                >
                                  {format(msg.createdAt)}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSubmit}
                className="p-4 border-t border-bg-surface bg-bg-primary flex flex-col gap-2"
              >
                <div className="flex items-center gap-4 px-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text-secondary hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={isHD}
                      onChange={(e) => setIsHD(e.target.checked)}
                      className="accent-primary"
                    />
                    HD Quality
                  </label>
                  {/* DEBUG BUTTON */}
                  {/* <button
                    type="button"
                    onClick={simulateIncomingCall}
                    className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Test Call
                  </button> */}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowLocationMenu(!showLocationMenu)}
                      className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-primary transition-colors"
                    >
                      <MapPin size={14} /> Share Location
                    </button>
                    {showLocationMenu && (
                      <div className="absolute bottom-full left-0 mb-2 bg-bg-surface border border-bg-primary rounded-lg shadow-lg overflow-hidden z-10 min-w-[200px]">
                        <button
                          type="button"
                          onClick={() => {
                            setShowLocationMenu(false);
                            shareCurrentLocation();
                          }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-bg-primary transition-colors flex items-center gap-2"
                        >
                          <Navigation size={16} className="text-primary" />
                          <div>
                            <p className="font-semibold">Current Location</p>
                            <p className="text-xs text-text-secondary">
                              Share GPS location
                            </p>
                          </div>
                        </button>
                        <div className="border-t border-bg-primary" />
                        <button
                          type="button"
                          onClick={() => {
                            setShowLocationMenu(false);
                            setShowLocation(true);
                          }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-bg-primary transition-colors flex items-center gap-2"
                        >
                          <MapPin size={16} className="text-primary" />
                          <div>
                            <p className="font-semibold">Search Location</p>
                            <p className="text-xs text-text-secondary">
                              Find a place
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 items-end">
                  <label className="p-3 text-primary hover:bg-bg-surface rounded-full cursor-pointer transition-colors">
                    <ImageIcon size={24} />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                  <div className="flex-1 bg-bg-surface rounded-3xl flex items-center px-4 py-2 border border-transparent focus-within:border-primary/50 transition-colors">
                    <input
                      type="text"
                      placeholder="Message..."
                      className="flex-1 bg-transparent border-none focus:ring-0 outline-none py-2"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() && images.length === 0}
                    className="p-3 bg-primary text-on-primary rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                  {Array.from(images).map((file, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-bg-surface"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
