import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import API from "../utils/api";
import { AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const Stories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [showViewer, setShowViewer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await API.get("/stories");
        setStories(res.data.stories || []);
      } catch (err) {
        console.error("Fetch stories error:", err);
      }
    };
    fetchStories();
  }, []);

  const handleOpenViewer = (index) => {
    setCurrentIndex(index);
    setShowViewer(true);
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowViewer(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="bg-bg-surface p-4 rounded-3xl overflow-hidden shadow-sm">
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {/* My Story */}
        <div
          onClick={() =>
            toast.info(
              "Story creation is integrated in the 'Create Post' section below!",
            )
          }
          className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer group"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary p-0.5 transition-transform group-hover:scale-105">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  className="w-full h-full rounded-full object-cover"
                  alt="my avatar"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-bg-primary flex items-center justify-center text-primary font-bold">
                  {user?.fullname?.charAt(0) || "?"}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full border-2 border-bg-surface flex items-center justify-center">
              <Plus size={12} className="text-on-primary" />
            </div>
          </div>
          <span className="text-xs font-semibold truncate w-full text-center">
            Your Story
          </span>
        </div>

        {/* Other Stories */}
        {stories.map((story, index) => (
          <motion.div
            key={story._id || index}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleOpenViewer(index)}
            className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full border-2 border-primary p-0.5 ring-2 ring-primary/20">
              <img
                src={
                  story.user?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user?.username || index}`
                }
                className="w-full h-full rounded-full object-cover"
                alt={story.user?.username || "user"}
              />
            </div>
            <span className="text-xs font-medium truncate w-full text-center">
              {story.user?.username}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {showViewer && stories[currentIndex] && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md aspect-[9/16] bg-bg-surface overflow-hidden sm:rounded-[2.5rem] shadow-2xl"
            >
              {/* Header */}
              <div className="absolute top-0 inset-x-0 p-6 z-10 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={stories[currentIndex].user?.avatar}
                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover"
                    alt=""
                  />
                  <div>
                    <p className="text-white font-black text-sm">
                      {stories[currentIndex].user?.username}
                    </p>
                    <p className="text-white/60 text-[10px] font-bold">
                      {format(stories[currentIndex].createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewer(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Progress Bar Container */}
              <div className="absolute top-4 inset-x-6 z-20 flex gap-1 h-1">
                {stories.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full overflow-hidden transition-all h-full ${
                      i < currentIndex
                        ? "bg-white"
                        : i === currentIndex
                          ? "bg-white/30"
                          : "bg-white/10"
                    }`}
                  >
                    {i === currentIndex && (
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        onAnimationComplete={handleNext}
                        className="h-full bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Media Content */}
              <div className="w-full h-full flex items-center justify-center bg-bg-primary">
                {stories[currentIndex].images?.[0] ? (
                  <img
                    src={
                      typeof stories[currentIndex].images[0] === "string"
                        ? stories[currentIndex].images[0]
                        : stories[currentIndex].images[0].url
                    }
                    className="w-full h-full object-cover"
                    alt="story"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center p-12 text-center"
                    style={{
                      background:
                        stories[currentIndex].background ||
                        "linear-gradient(45deg, #FF6B6B, #FFD93D)",
                    }}
                  >
                    <p className="text-2xl font-black text-white leading-tight drop-shadow-lg">
                      {stories[currentIndex].content}
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="absolute inset-y-0 inset-x-0 flex items-center justify-between px-4 z-10">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white ${
                    currentIndex === 0 ? "opacity-0 invisible" : "opacity-100"
                  }`}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Stories;
