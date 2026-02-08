import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import API from "../utils/api";
import { toast } from "react-toastify";
import { format } from "timeago.js";
import { POST_BACKGROUNDS } from "../utils/postTheme";

const Stories = () => {
  const { user } = useAuth();
  const [groupedStories, setGroupedStories] = useState([]);
  const [showViewer, setShowViewer] = useState(false);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await API.get("/stories");
        setGroupedStories(res.data.stories || []);
      } catch (err) {
        console.error("Fetch stories error:", err);
      }
    };
    fetchStories();
  }, []);

  const currentUserGroup = groupedStories[currentUserIndex];
  const stories = currentUserGroup?.stories || [];
  const currentStory = stories[currentStoryIndex];

  useEffect(() => {
    if (!showViewer || !currentStory) return;

    setProgress(0);
    const duration = 5000; // 5s per story
    const interval = 50;
    const step = 1 / (duration / interval);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          handleNext();
          return 1;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showViewer, currentUserIndex, currentStoryIndex]);

  const handleOpenViewer = (index) => {
    setCurrentUserIndex(index);
    setCurrentStoryIndex(0);
    setShowViewer(true);
  };

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentUserIndex < groupedStories.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      setShowViewer(false);
    }
  };

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1);
      setCurrentStoryIndex(
        groupedStories[currentUserIndex - 1].stories.length - 1,
      );
    }
  };

  return (
    <div className="bg-bg-surface p-6 rounded-[2.5rem] shadow-sm border border-bg-primary/5">
      <div className="flex gap-4 overflow-x-auto no-scrollbar">
        {/* My Story Entry */}
        <div
          onClick={() =>
            toast.info(
              "Story creation is integrated in the 'Create Post' section below!",
            )
          }
          className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary/20 p-1 group-hover:border-primary transition-all duration-300">
              <div className="w-full h-full rounded-full overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    alt="my avatar"
                  />
                ) : (
                  <div className="w-full h-full bg-bg-primary flex items-center justify-center text-primary font-black text-xl">
                    {user?.fullname?.charAt(0) || "?"}
                  </div>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full border-4 border-bg-surface flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Plus size={14} className="text-on-primary font-black" />
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary w-full text-center">
            You
          </span>
        </div>

        {/* Other Stories */}
        {groupedStories.map((group, index) => (
          <motion.div
            key={group.user?._id || index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenViewer(index)}
            className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full border-2 border-primary p-1 ring-4 ring-primary/5">
              <img
                src={group.user?.avatar}
                className="w-full h-full rounded-full object-cover"
                alt={group.user?.username}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-text-primary truncate w-full text-center">
              {group.user?.username}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {showViewer && currentStory && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-2xl px-0 sm:px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg aspect-[9/16] bg-bg-surface overflow-hidden sm:rounded-[3rem] shadow-2xl ring-1 ring-white/10"
            >
              {/* Progress Bars */}
              <div className="absolute top-6 inset-x-8 z-30 flex gap-1.5 h-1">
                {stories.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-white/20 overflow-hidden h-full"
                  >
                    <div
                      className="h-full bg-white transition-all duration-50"
                      style={{
                        width:
                          i < currentStoryIndex
                            ? "100%"
                            : i === currentStoryIndex
                              ? `${progress * 100}%`
                              : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-0 inset-x-0 pt-12 pb-16 px-8 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 p-0.5">
                    <img
                      src={currentUserGroup.user?.avatar}
                      className="w-full h-full rounded-full object-cover"
                      alt=""
                    />
                  </div>
                  <div>
                    <p className="text-white font-black text-lg tracking-tight">
                      {currentUserGroup.user?.username}
                    </p>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                      {format(currentStory.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewer(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white backdrop-blur-md pointer-events-auto"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Media Content */}
              <div className="w-full h-full flex items-center justify-center bg-black">
                {currentStory.images?.[0] ? (
                  currentStory.images[0].resource_type === "video" ||
                  (typeof currentStory.images[0] === "string" &&
                    currentStory.images[0].endsWith(".mp4")) ? (
                    <video
                      src={
                        typeof currentStory.images[0] === "string"
                          ? currentStory.images[0]
                          : currentStory.images[0].url
                      }
                      className="w-full h-full object-contain"
                      autoPlay
                      muted={false}
                      playsInline
                    />
                  ) : (
                    <img
                      src={
                        typeof currentStory.images[0] === "string"
                          ? currentStory.images[0]
                          : currentStory.images[0].url
                      }
                      className="w-full h-full object-contain"
                      alt="story"
                    />
                  )
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center p-12 text-center"
                    style={{
                      background: (() => {
                        const bgId = currentStory.background || "default";
                        if (bgId === "default") return "#ffffff";
                        const bg = POST_BACKGROUNDS.find((b) => b.id === bgId);
                        if (!bg || !bg.colors)
                          return "linear-gradient(45deg, #6366f1, #a855f7)";
                        return `linear-gradient(45deg, ${bg.colors[0]}, ${bg.colors[1]})`;
                      })(),
                    }}
                  >
                    <p
                      className="text-3xl font-black leading-tight drop-shadow-2xl px-6"
                      style={{
                        fontSize: currentStory.textStyle?.fontSize
                          ? `${currentStory.textStyle.fontSize}px`
                          : "32px",
                        color:
                          currentStory.textStyle?.color ||
                          (currentStory.background &&
                          currentStory.background !== "default"
                            ? "#FFFFFF"
                            : "#000000"),
                        fontWeight: currentStory.textStyle?.fontWeight || "900",
                        textShadow:
                          currentStory.background &&
                          currentStory.background !== "default"
                            ? "0 4px 12px rgba(0,0,0,0.5)"
                            : "none",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {currentStory.content}
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation Overlays */}
              <div className="absolute inset-0 z-10 flex">
                <div
                  className="w-1/3 h-full cursor-w-resize"
                  onClick={handlePrev}
                />
                <div
                  className="w-2/3 h-full cursor-e-resize"
                  onClick={handleNext}
                />
              </div>

              {/* Navigation Buttons (Desktop Only) */}
              <div className="hidden sm:flex absolute inset-y-0 inset-x-0 items-center justify-between px-6 z-20 pointer-events-none">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white backdrop-blur-md pointer-events-auto scale-0 group-hover:scale-100"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white backdrop-blur-md pointer-events-auto scale-0 group-hover:scale-100"
                >
                  <ChevronRight size={28} />
                </button>
              </div>

              {/* Footer Content */}
              {currentStory.images?.[0] && currentStory.content && (
                <div className="absolute bottom-0 inset-x-0 p-10 z-20 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-lg font-bold text-center leading-snug drop-shadow-md">
                    {currentStory.content}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Stories;
