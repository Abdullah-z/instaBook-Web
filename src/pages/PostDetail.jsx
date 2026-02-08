import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Heart,
  Repeat,
  Bookmark,
  Share2,
  Send,
  BarChart2,
  CheckCircle2,
  MapPin, // Added MapPin
  Edit3,
  Trash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "timeago.js";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import HashtagText from "../components/HashtagText";
import RepostModal from "../components/RepostModal";
import YouTubePlayer from "../components/YouTubePlayer";

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

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [poll, setPoll] = useState(null); // Add poll state
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const youtubeId = post?.content ? getYoutubeId(post.content) : null;

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/post/${id}`);
      const postData = res.data.post;
      setPost(postData);
      setComments(postData.comments || []);
      setLikesCount(postData.likes?.length || 0);
      setIsLiked(
        postData.likes?.some(
          (l) => (typeof l === "string" ? l : l._id) === currentUser?._id,
        ),
      );
      if (postData.poll_question) setPoll(postData); // Set poll data
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionIndex) => {
    if (!currentUser || !poll) return;

    // Optimistic Update
    const previousPoll = poll;
    const newPollOptions = poll.poll_options.map((opt, idx) => {
      const filteredVotes = opt.votes.filter(
        (v) => (typeof v === "string" ? v : v._id) !== currentUser._id,
      );
      if (idx === optionIndex) {
        return { ...opt, votes: [...filteredVotes, currentUser._id] };
      }
      return { ...opt, votes: filteredVotes };
    });

    setPoll({ ...poll, poll_options: newPollOptions });

    try {
      const res = await API.patch(`/post/${id}/vote`, { optionIndex });
      setPoll(res.data.newPost);
    } catch (err) {
      console.error(err);
      setPoll(previousPoll);
      alert("Failed to vote");
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id, currentUser]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      const res = await API.post("/comment", {
        postId: id,
        content: commentContent,
        postUserId: post.user._id,
      });
      const newComment = {
        ...res.data.newComment,
        user: currentUser,
      };
      setComments([newComment, ...comments]);
      setCommentContent("");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLike = async () => {
    const prevIsLiked = isLiked;
    setIsLiked(!prevIsLiked);
    setLikesCount((prev) => (prevIsLiked ? prev - 1 : prev + 1));
    try {
      if (prevIsLiked) await API.patch(`/post/${id}/unlike`);
      else await API.patch(`/post/${id}/like`);
    } catch (err) {
      setIsLiked(prevIsLiked);
      setLikesCount((prev) => (prevIsLiked ? prev + 1 : prev - 1));
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!post)
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-black text-text-primary">
          Post Not Found
        </h1>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-primary text-on-primary rounded-2xl font-bold"
        >
          Return Home
        </button>
      </div>
    );

  const isAuthor = post.user?._id === currentUser?._id;

  const handleDeletePost = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await API.delete(`/post/${id}`);
        navigate("/");
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-bg-surface p-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-bg-surface rounded-xl transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-black text-xl tracking-tight">Post Details</h1>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6 pb-32">
        {/* Main Post Card */}
        <article className="bg-bg-surface rounded-[2.5rem] shadow-sm border border-bg-primary/5 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div
                onClick={() => navigate(`/profile/${post.user?._id}`)}
                className="flex items-center gap-4 cursor-pointer group/avatar"
              >
                <img
                  src={post.user?.avatar}
                  className="w-14 h-14 rounded-full object-cover ring-4 ring-primary/5 group-hover/avatar:scale-105 transition-transform"
                  alt="avatar"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-lg group-hover/avatar:underline decoration-primary">
                    {post.user?.username}
                  </h4>
                  <p className="text-xs text-text-secondary font-medium flex items-center gap-1">
                    {format(post.createdAt)} •
                    {post.location?.name || post.address ? (
                      <span className="flex items-center gap-0.5 text-primary">
                        <MapPin size={12} />
                        {post.location?.name || post.address}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              {isAuthor && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/edit-post/${id}`)}
                    className="p-2.5 bg-bg-primary hover:bg-bg-primary/80 text-text-secondary hover:text-primary rounded-xl transition-all shadow-sm"
                    title="Edit Post"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="p-2.5 bg-bg-primary hover:bg-error/10 text-text-secondary hover:text-error rounded-xl transition-all shadow-sm"
                    title="Delete Post"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              )}
            </div>

            <div
              className={`mb-6 flex flex-col ${post.background ? "min-h-[300px] items-center justify-center text-center p-10 rounded-[2rem]" : ""}`}
              style={
                post.background
                  ? {
                      background:
                        POST_BACKGROUNDS_MAP[post.background] ||
                        post.background,
                    }
                  : {}
              }
            >
              <p
                className={`whitespace-pre-wrap ${post.background ? "text-3xl font-black text-white drop-shadow-xl" : "text-lg leading-relaxed"}`}
              >
                <HashtagText text={post.content} />
              </p>
            </div>

            {/* Poll Section */}
            {poll && (
              <div className="mb-6 space-y-3">
                <div className="bg-bg-primary/30 border border-bg-primary/20 p-5 rounded-[2rem]">
                  <h5 className="font-bold text-sm mb-4 flex items-center gap-3">
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
                                : Math.round(
                                    (opt.votes.length / totalVotes) * 100,
                                  );

                            const userVotedForThis = opt.votes.some(
                              (v) =>
                                (typeof v === "string" ? v : v._id) ===
                                currentUser?._id,
                            );

                            return (
                              <button
                                key={idx}
                                onClick={() => handleVote(idx)}
                                className={`relative w-full h-12 rounded-xl overflow-hidden border transition-all text-left px-4 group/poll
                                  ${userVotedForThis ? "border-primary/40 bg-primary/5" : "border-bg-surface hover:border-primary/30 bg-bg-surface"}
                                `}
                              >
                                <motion.div
                                  initial={false}
                                  animate={{ width: `${percent}%` }}
                                  className={`absolute inset-y-0 left-0 pointer-events-none transition-colors ${userVotedForThis ? "bg-primary/20" : "bg-bg-primary/20"}`}
                                />
                                <div className="relative flex items-center justify-between h-full text-xs font-bold pointer-events-none">
                                  <span className="flex items-center gap-2">
                                    {opt.text}
                                    {userVotedForThis && (
                                      <CheckCircle2
                                        size={14}
                                        className="text-primary animate-pulse"
                                      />
                                    )}
                                  </span>
                                  <span className="text-text-secondary">
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

            {post.images && post.images.length > 0 ? (
              <div className="grid gap-2 mb-6">
                {post.images.map((img, i) => {
                  const isVideo =
                    img.url?.endsWith(".mp4") || img.resource_type === "video";
                  return (
                    <div key={i} className="rounded-3xl overflow-hidden">
                      {isVideo ? (
                        <video
                          src={img.url}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                        />
                      ) : (
                        <img
                          src={img.url}
                          className="w-full object-cover"
                          alt="media"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              youtubeId && (
                <div className="mb-6">
                  <YouTubePlayer videoId={youtubeId} />
                </div>
              )
            )}

            <div className="flex items-center justify-between pt-6 border-t border-bg-primary/10">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleLike}
                  className={`flex items-center gap-2 font-bold text-sm ${isLiked ? "text-error" : "text-text-secondary"}`}
                >
                  <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
                  {likesCount}
                </button>
                <div className="flex items-center gap-2 text-text-secondary font-bold text-sm">
                  <MessageCircle size={22} />
                  {comments.length}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRepostModalOpen(true)}
                  className="p-2 text-text-secondary hover:text-primary transition-colors"
                >
                  <Repeat size={22} />
                </button>
                <button className="p-2 text-text-secondary hover:text-primary transition-colors">
                  <Bookmark size={22} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied! 🔗");
                  }}
                  className="p-2 text-text-secondary hover:text-primary transition-colors"
                >
                  <Share2 size={22} />
                </button>
              </div>
            </div>
          </div>
        </article>

        {isRepostModalOpen && (
          <RepostModal
            post={post}
            onClose={() => setIsRepostModalOpen(false)}
            onRepostSuccess={() => {
              alert("Successfully reposted! 🚀");
            }}
          />
        )}

        {/* Comments Section */}
        <div className="space-y-6">
          <h3 className="font-black text-lg px-2 flex items-center gap-2">
            Discussions{" "}
            <span className="text-text-secondary text-sm">
              ({comments.length})
            </span>
          </h3>

          <div className="space-y-4">
            {comments.map((comment, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={i}
                className={`flex gap-3 ${comment.reply ? "ml-12 border-l-2 border-bg-surface pl-4" : ""}`}
              >
                <img
                  src={comment.user?.avatar}
                  className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0"
                  alt="avatar"
                />
                <div className="flex-1">
                  <div className="bg-bg-surface p-4 rounded-3xl rounded-tl-none shadow-sm border border-bg-primary/5">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-bold text-sm">
                        {comment.user?.username}
                      </h5>
                      <span className="text-[10px] text-text-secondary">
                        {format(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary leading-tight">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Comment Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-primary/80 backdrop-blur-xl border-t border-bg-surface z-50">
        <div className="max-w-3xl mx-auto flex gap-4 items-center">
          <img
            src={currentUser?.avatar}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/10"
            alt="me"
          />
          <form onSubmit={handleComment} className="flex-1 relative">
            <input
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Join the discussion..."
              className="w-full bg-bg-surface border-none outline-none py-3.5 px-6 rounded-2xl text-sm shadow-inner"
            />
            <button
              type="submit"
              disabled={!commentContent.trim()}
              className="absolute right-2 top-1.5 p-2 bg-primary text-on-primary rounded-xl shadow-lg disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
