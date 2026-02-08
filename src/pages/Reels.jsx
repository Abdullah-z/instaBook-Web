import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  Play,
  Pause,
  Loader2,
  X,
  PlusSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { format } from "timeago.js";

const ReelItem = ({ reel, isActive }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(
    reel.likes.some((l) => (l._id || l) === user?._id),
  );
  const [likesCount, setLikesCount] = useState(reel.likes.length);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(() => setIsPaused(true));
    } else {
      videoRef.current?.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  const toggleLike = async (e) => {
    e.stopPropagation();
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    setLikesCount((prev) => (prevLiked ? prev - 1 : prev + 1));

    try {
      if (prevLiked) {
        await API.patch(`/post/${reel._id}/unlike`);
      } else {
        await API.patch(`/post/${reel._id}/like`);
      }
    } catch (err) {
      setIsLiked(prevLiked);
      setLikesCount((prev) => (prevLiked ? prev + 1 : prev - 1));
    }
  };

  const videoUrl = reel.images.find(
    (img) => img.resource_type === "video" || img.url?.endsWith(".mp4"),
  )?.url;

  return (
    <div className="h-full w-full snap-start relative bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        className="h-full w-full object-contain cursor-pointer"
        loop
        playsInline
        onClick={() => {
          if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPaused(false);
          } else {
            videoRef.current.pause();
            setIsPaused(true);
          }
        }}
      />

      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/40 p-6 rounded-full">
              <Play size={64} className="text-white fill-white ml-2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Actions Overlay */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-10">
        <button
          onClick={toggleLike}
          className="flex flex-col items-center gap-1 group"
        >
          <div
            className={`p-3 rounded-full transition-all ${isLiked ? "bg-error text-white" : "bg-black/40 text-white hover:bg-black/60"}`}
          >
            <Heart size={28} fill={isLiked ? "currentColor" : "none"} />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md">
            {likesCount}
          </span>
        </button>

        <button
          onClick={() => navigate(`/post/${reel._id}`)}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="p-3 bg-black/40 rounded-full text-white hover:bg-black/60 transition-all">
            <MessageCircle size={28} />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md">
            {reel.comments.length}
          </span>
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location.origin}/post/${reel._id}`,
            );
            alert("Link copied!");
          }}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="p-3 bg-black/40 rounded-full text-white hover:bg-black/60 transition-all">
            <Share2 size={28} />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md">
            Share
          </span>
        </button>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent pt-20">
        <div
          onClick={() => navigate(`/profile/${reel.user._id}`)}
          className="flex items-center gap-3 mb-3 cursor-pointer group w-fit"
        >
          <img
            src={reel.user.avatar || "https://via.placeholder.com/40"}
            className="w-10 h-10 rounded-full border-2 border-white/20 group-hover:scale-105 transition-transform"
            alt=""
          />
          <span className="text-white font-black text-lg group-hover:underline">
            @{reel.user.username}
          </span>
        </div>
        <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-sm max-w-[85%]">
          {reel.content}
        </p>
      </div>
    </div>
  );
};

const Reels = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef(null);

  const fetchReels = useCallback(async (p) => {
    try {
      const res = await API.get(`/reels?page=${p}&limit=5`);
      if (p === 1) {
        setReels(res.data.posts);
      } else {
        setReels((prev) => [...prev, ...res.data.posts]);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReels(1);
  }, [fetchReels]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const idx = Math.round(scrollTop / clientHeight);
    if (idx !== activeIdx) {
      setActiveIdx(idx);
    }

    // Infinite scroll
    if (scrollTop + clientHeight >= containerRef.current.scrollHeight - 100) {
      // Fetch next page if needed
      // Logic for page management can be added here
    }
  };

  if (loading) {
    return (
      <div className="flex bg-bg-primary h-screen items-center justify-center">
        <Sidebar />
        <main className="lg:pl-64 flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="mt-4 font-bold text-text-secondary">
            Tuning the stage...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-bg-primary h-screen overflow-hidden">
      <Sidebar />

      <main className="lg:pl-64 flex-1 h-screen flex justify-center bg-black lg:bg-bg-primary">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full max-w-[450px] lg:max-w-[400px] h-full overflow-y-auto snap-y no-scrollbar lg:shadow-2xl lg:border-x border-white/5"
        >
          {reels.map((reel, i) => (
            <div key={reel._id} className="h-full w-full">
              <ReelItem reel={reel} isActive={i === activeIdx} />
            </div>
          ))}

          {reels.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-white p-10 text-center">
              <PlusSquare size={64} className="mb-4 opacity-20" />
              <h2 className="text-xl font-black">No Reels Found</h2>
              <p className="text-sm opacity-60 mt-2">
                Be the first to create a video post!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reels;
