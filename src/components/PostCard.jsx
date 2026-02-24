import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Repeat,
  Trash2,
  Bookmark,
  Share2,
  BarChart2,
  CheckCircle2,
  X,
  Send,
  Reply,
  MapPin, // Added MapPin
} from "lucide-react";
import { format } from "timeago.js";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { useFeed } from "../context/FeedContext";
import CommentModal from "./CommentModal";
import RepostModal from "./RepostModal";
import HashtagText from "./HashtagText";
import YouTubePlayer from "./YouTubePlayer";
import ImageView from "./ImageView";
import { shortenAddress } from "../utils/locationHelper";
import PostImageGrid from "./PostImageGrid";

const getYoutubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const POST_BACKGROUNDS_MAP = {
  red_gradient: "linear-gradient(45deg, #FF416C, #FF4B2B)",
  blue_gradient: "linear-gradient(45deg, #2193b0, #6dd5ed)",
  mango: "linear-gradient(45deg, #ffe259, #ffa751)",
  purple_love: "linear-gradient(45deg, #cc2b5e, #753a88)",
  ocean: "linear-gradient(45deg, #2E3192, #1BFFFF)",
  green_beach: "linear-gradient(45deg, #02AAB0, #00CDAC)",
  midnight: "linear-gradient(45deg, #232526, #414345)",
  amin: "linear-gradient(45deg, #8E2DE2, #4A00E0)",
  flare: "linear-gradient(45deg, #f12711, #f5af19)",
  cool_blue: "linear-gradient(45deg, #5433FF, #20BDFF, #A5FECB)",
  pinky: "linear-gradient(45deg, #EC008C, #FC6767)",
};

const PostCard = ({ post, onPostDelete }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(
    post.likes?.find((like) => like._id === currentUser?._id) ? true : false,
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(
    currentUser?.saved?.includes(post._id) ? true : false,
  );
  const [poll, setPoll] = useState(post.poll_question ? post : null);
  const [viewingImage, setViewingImage] = useState(null);
  const youtubeId = post.content ? getYoutubeId(post.content) : null;

  // Sync poll state when post prop changes
  React.useEffect(() => {
    if (post.poll_question) setPoll(post);
  }, [post]);

  // Use a derived state or useEffect for voted to ensure it stays in sync with user/poll
  const voted = React.useMemo(() => {
    if (!currentUser || !poll) return false;
    return poll.poll_options?.some((opt) =>
      opt.votes.some(
        (v) => (typeof v === "string" ? v : v._id) === currentUser._id,
      ),
    );
  }, [poll, currentUser]);

  const handleVote = async (optionIndex) => {
    if (!currentUser || !poll || loading) return;

    // Store previous state for revert
    const previousPoll = poll;

    // Optimistic Update: Remove user from all options, then add to the selected one
    const newPollOptions = poll.poll_options.map((opt, idx) => {
      const filteredVotes = opt.votes.filter(
        (v) => (typeof v === "string" ? v : v._id) !== currentUser._id,
      );
      if (idx === optionIndex) {
        return { ...opt, votes: [...filteredVotes, currentUser._id] };
      }
      return { ...opt, votes: filteredVotes };
    });

    const optimisticPoll = { ...poll, poll_options: newPollOptions };
    setPoll(optimisticPoll);

    try {
      const res = await API.patch(`/post/${post._id}/vote`, { optionIndex });
      setPoll({ ...res.data.newPost });
    } catch (err) {
      console.error(err);
      setPoll(previousPoll);
      alert(err.response?.data?.msg || "Failed to submit vote");
    }
  };

  const toggleLike = async () => {
    // Store current state for potential revert
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    // Optimistic UI update
    setIsLiked(!previousIsLiked);
    setLikesCount((prev) => (previousIsLiked ? prev - 1 : prev + 1));

    try {
      if (previousIsLiked) {
        await API.patch(`/post/${post._id}/unlike`);
      } else {
        await API.patch(`/post/${post._id}/like`);
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        setLoading(true);
        await API.delete(`/post/${post._id}`);
        onPostDelete(post._id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleShare = async (e) => {
    e?.stopPropagation();
    // Copy link is always an option, but for Repost we open the modal
    const action = window.confirm(
      "Would you like to Repost this to your feed? (Cancel to just copy link)",
    );

    if (action) {
      setIsRepostModalOpen(true);
    } else {
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/post/${post._id}`,
        );
        alert("Link copied to clipboard! 🔗");
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const toggleSave = async (e) => {
    e?.stopPropagation();
    if (!currentUser) return;

    const previousIsSaved = isSaved;
    setIsSaved(!previousIsSaved);

    try {
      if (previousIsSaved) {
        await API.patch(`/unSavePost/${post._id}`);
      } else {
        await API.patch(`/savePost/${post._id}`);
      }
    } catch (err) {
      console.error(err);
      setIsSaved(previousIsSaved);
    }
  };

  const { setScrollPosition } = useFeed();

  const handleCardClick = () => {
    setScrollPosition(window.scrollY);
    navigate(`/post/${post._id}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={handleCardClick}
      className={`bg-bg-surface rounded-3xl shadow-sm overflow-hidden transition-opacity cursor-pointer group/card ${loading ? "opacity-50 pointer-events-none" : ""}`}
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${post.user?._id}`);
            }}
            className="flex items-center gap-3 cursor-pointer group/avatar"
          >
            <img
              src={post.user?.avatar}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/5 group-hover/avatar:scale-105 transition-transform"
              alt={post.user?.username}
            />
            <div>
              <h4 className="font-medium text-sm group-hover/avatar:underline decoration-primary">
                {post.user?.username}
              </h4>
              <p className="text-[10px] text-text-secondary font-medium tracking-wide flex items-center gap-1">
                {format(post.createdAt)}
                <span>•</span>
                {post.location?.name || post.address ? (
                  <span className="flex items-center gap-0.5 text-primary">
                    <MapPin size={10} />
                    {shortenAddress(post.location?.name || post.address)}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {currentUser?._id === post.user?._id && (
            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/edit-post/${post._id}`);
                }}
                className="p-2 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-xl transition-colors mr-1"
                title="Edit Post"
              >
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </motion.svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="p-2 hover:bg-error/10 text-text-secondary hover:text-error rounded-xl transition-colors"
                title="Delete Post"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div
        className={`px-4 pb-3 flex flex-col ${post.background && post.background !== "default" ? "aspect-video items-center justify-center text-center p-10 rounded-[2.5rem] mx-4 mb-4 shadow-xl mb-6 transition-all duration-700" : ""}`}
        style={
          post.background && post.background !== "default"
            ? {
                background:
                  POST_BACKGROUNDS_MAP[post.background] || post.background,
              }
            : {}
        }
      >
        <div className="block">
          <p
            className={`whitespace-pre-wrap font-light ${post.background && post.background !== "default" ? "text-2xl drop-shadow-lg" : "text-sm leading-relaxed text-text-primary"}`}
            style={{
              ...(post.textStyle
                ? {
                    ...post.textStyle,
                    fontWeight: 300,
                    color:
                      post.background &&
                      post.background !== "default" &&
                      !post.textStyle.color
                        ? "#FFFFFF"
                        : post.textStyle.color || undefined,
                  }
                : { fontWeight: 300 }),
            }}
          >
            <HashtagText text={post.content} />
          </p>
          {/* Shared Post Rendering (Nesting) */}
          {post.sharedPost && (
            <div
              className={`mt-4 w-full p-4 rounded-3xl border border-bg-primary/20 bg-bg-primary/30 text-left transition-all hover:bg-bg-primary/50 ${post.background ? "max-w-[90%]" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={post.sharedPost.user?.avatar}
                  className="w-6 h-6 rounded-lg object-cover"
                  alt="avatar"
                />
                <span className="font-bold text-xs">
                  {post.sharedPost.user?.username}
                </span>
                <span className="text-[10px] text-text-secondary">
                  • {format(post.sharedPost.createdAt)}
                </span>
              </div>
              <p className="text-xs text-text-primary mb-3 line-clamp-3">
                {post.sharedPost.content}
              </p>
              {post.sharedPost.images && post.sharedPost.images.length > 0 && (
                <div className="rounded-2xl overflow-hidden aspect-video">
                  <img
                    src={post.sharedPost.images[0].url}
                    className="w-full h-full object-cover"
                    alt="shared post"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Poll Component */}
      {poll && (
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-bg-surface border border-bg-primary/20 p-5 rounded-[2rem] shadow-sm ring-1 ring-primary/5">
            <h5 className="font-semibold text-sm mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart2 size={16} className="text-primary" />
              </div>
              {poll.poll_question}
            </h5>
            <div className="space-y-2">
              {(() => {
                const totalVotes = poll.poll_options.reduce(
                  (acc, o) => acc + o.votes.length,
                  0,
                );
                return (
                  <>
                    {poll.poll_options.map((opt, idx) => {
                      const percent =
                        totalVotes === 0
                          ? 0
                          : Math.round((opt.votes.length / totalVotes) * 100);

                      const userVotedForThis = opt.votes.some(
                        (v) =>
                          (typeof v === "string" ? v : v._id) ===
                          currentUser?._id,
                      );

                      return (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(idx);
                          }}
                          disabled={loading}
                          className={`relative w-full h-11 rounded-xl overflow-hidden border transition-all text-left px-4 group/poll
                            ${userVotedForThis ? "border-primary/40 bg-primary/5 shadow-sm" : "border-bg-surface hover:border-primary/30 bg-bg-primary/30"}
                          `}
                        >
                          <motion.div
                            initial={false}
                            animate={{ width: `${percent}%` }}
                            className={`absolute inset-y-0 left-0 pointer-events-none transition-colors ${userVotedForThis ? "bg-primary/20" : "bg-bg-primary/60"}`}
                          />
                          <div className="relative flex items-center justify-between h-full text-xs font-medium pointer-events-none">
                            <span className="flex items-center gap-2">
                              {opt.text}
                              {userVotedForThis && (
                                <CheckCircle2
                                  size={13}
                                  className="text-primary animate-pulse"
                                />
                              )}
                            </span>
                            <span className="text-text-secondary tabular-nums opacity-80 group-hover/poll:opacity-100 transition-opacity">
                              {Math.round(percent)}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    <div className="flex items-center justify-end mt-4 px-1">
                      <p className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest">
                        {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Post Media */}
      <div className="block">
        {post.images && post.images.length > 0 ? (
          <PostImageGrid
            images={post.images}
            onImageClick={(index) => setViewingImage(post.images[index].url)}
          />
        ) : (
          youtubeId && (
            <div className="px-4 pb-4">
              <YouTubePlayer videoId={youtubeId} />
            </div>
          )
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all font-bold text-sm
                ${isLiked ? "bg-error/10 text-error" : "bg-bg-primary hover:bg-primary/10 text-text-secondary hover:text-primary"}
              `}
            >
              <Heart
                size={20}
                fill={isLiked ? "currentColor" : "none"}
                className={isLiked ? "animate-bounce" : ""}
              />
              <span>{likesCount}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-bg-primary hover:bg-primary/10 transition-all text-text-secondary hover:text-primary font-bold text-sm"
            >
              <MessageCircle size={20} />
              <span>{post.comments?.length || 0}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare(e);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-bg-primary hover:bg-primary/10 transition-all text-text-secondary hover:text-primary font-bold text-sm group"
            >
              <Share2
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
          <button
            onClick={toggleSave}
            className={`p-2.5 rounded-2xl transition-all shadow-sm active:scale-95
              ${isSaved ? "bg-primary/20 text-primary shadow-inner" : "bg-bg-primary hover:bg-primary/10 text-text-secondary hover:text-primary"}
            `}
            title={isSaved ? "Remove from bookmarks" : "Save post"}
          >
            <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CommentModal post={post} onClose={() => setIsModalOpen(false)} />
        )}
        {isRepostModalOpen && (
          <RepostModal
            post={post}
            onClose={() => setIsRepostModalOpen(false)}
            onRepostSuccess={() => {
              alert("Successfully reposted! 🚀");
            }}
          />
        )}
      </AnimatePresence>

      <ImageView
        isOpen={!!viewingImage}
        imageUrl={viewingImage}
        onClose={() => setViewingImage(null)}
      />
    </motion.article>
  );
};

export default PostCard;
