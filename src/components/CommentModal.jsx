import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Heart, Reply, MessageCircle } from "lucide-react";
import { format } from "timeago.js";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";

const CommentModal = ({ post, onClose }) => {
  const { user: currentUser } = useAuth();
  const [content, setContent] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [loading, setLoading] = useState(false);
  const [onReply, setOnReply] = useState(null); // { id, username }

  const handleComment = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setLoading(true);
      const data = {
        postId: post._id,
        content,
        postUserId: post.user._id,
        reply: onReply ? onReply.id : undefined,
        tag: onReply ? onReply.username : undefined,
      };

      const res = await API.post("/comment", data);

      const newComment = {
        ...res.data.newComment,
        user: currentUser,
      };

      setComments([newComment, ...comments]);
      setContent("");
      setOnReply(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-bg-primary w-full max-w-3xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-bg-surface flex items-center justify-between bg-bg-surface/50">
          <div className="flex flex-col">
            <h2 className="font-black text-xl tracking-tight">
              Post Discussions
            </h2>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
              Interactive Feedback
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-bg-surface hover:bg-bg-primary rounded-2xl transition-all shadow-sm active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-8">
          {/* Post Preview (Left - Desktop) */}
          <div className="lg:w-[40%] space-y-4 shrink-0">
            <div className="bg-bg-surface p-4 rounded-[2rem] space-y-4 shadow-sm border border-bg-primary/10">
              <div className="flex items-center gap-3">
                <img
                  src={post.user?.avatar}
                  className="w-10 h-10 rounded-xl object-cover shadow-sm"
                  alt="avatar"
                />
                <div>
                  <h4 className="font-bold text-sm tracking-tight">
                    {post.user?.username}
                  </h4>
                  <p className="text-[10px] text-text-secondary uppercase font-medium">
                    {format(post.createdAt)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Shared Post in Preview */}
              {post.sharedPost && (
                <div className="p-3 rounded-2xl border border-bg-primary/20 bg-bg-primary/30 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <img
                      src={post.sharedPost.user?.avatar}
                      className="w-5 h-5 rounded-lg object-cover"
                      alt="avatar"
                    />
                    <span className="font-bold text-[10px]">
                      {post.sharedPost.user?.username}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-primary line-clamp-2">
                    {post.sharedPost.content}
                  </p>
                </div>
              )}

              {post.images && post.images.length > 0 && (
                <img
                  src={post.images[0].url}
                  className="w-full h-48 object-cover rounded-2xl shadow-md"
                  alt="post"
                />
              )}
            </div>
          </div>

          {/* Comments List (Right - Desktop) */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-black text-sm mb-6 flex items-center gap-3">
              <MessageCircle size={18} className="text-primary" />
              COMMENTS{" "}
              <span className="text-text-secondary">({comments.length})</span>
            </h3>
            <div className="flex-1 space-y-5 pr-2 no-scrollbar overflow-y-auto">
              {comments.map((comment, index) => (
                <div
                  key={index}
                  className={`flex gap-3 group transition-all ${comment.reply ? "ml-10 border-l-2 border-bg-surface pl-4" : ""}`}
                >
                  <img
                    src={comment.user?.avatar}
                    className="w-8 h-8 rounded-lg object-cover shadow-sm mt-1"
                    alt="avatar"
                  />
                  <div className="flex-1">
                    <div className="bg-bg-surface p-3 rounded-2xl rounded-tl-none ring-1 ring-bg-primary/5 shadow-sm group-hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-bold text-xs">
                          {comment.user?.username}
                        </h5>
                        {comment.tag && (
                          <span className="text-[10px] text-primary font-bold">
                            @{comment.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-primary leading-tight">
                        {comment.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 px-1">
                      <span className="text-[9px] text-text-secondary font-medium">
                        {format(comment.createdAt)}
                      </span>
                      <button
                        onClick={() => {
                          setOnReply({
                            id: comment._id,
                            username: comment.user.username,
                          });
                          setContent(`@${comment.user.username} `);
                        }}
                        className="text-[9px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3 opacity-50">
                  <MessageCircle size={40} className="text-text-secondary" />
                  <p className="text-xs text-text-secondary italic font-medium">
                    Be the first to spark the conversation...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer (Input) */}
        <div className="p-6 bg-bg-surface/80 backdrop-blur-md border-t border-bg-primary/20">
          {onReply && (
            <div className="flex items-center justify-between mb-2 px-4 py-2 bg-primary/10 rounded-xl">
              <p className="text-[10px] font-bold text-primary">
                Replying to @{onReply.username}
              </p>
              <button
                onClick={() => {
                  setOnReply(null);
                  setContent("");
                }}
                className="text-[10px] text-error font-black uppercase"
              >
                Cancel
              </button>
            </div>
          )}
          <form onSubmit={handleComment} className="flex gap-4">
            <img
              src={currentUser?.avatar}
              className="w-11 h-11 rounded-2xl object-cover shadow-lg ring-2 ring-primary/10"
              alt="my avatar"
            />
            <div className="flex-1 relative">
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  onReply
                    ? `Reply to ${onReply.username}...`
                    : "Write a thoughtful comment..."
                }
                className="w-full bg-bg-primary border-none outline-none py-3.5 pl-5 pr-14 rounded-2xl text-sm shadow-inner"
              />
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="absolute right-2 top-1.5 p-2 bg-primary text-on-primary rounded-xl shadow-xl shadow-primary/30 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CommentModal;
