import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Send, Repeat } from "lucide-react";
import { format } from "timeago.js";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";

const RepostModal = ({ post, onClose, onRepostSuccess }) => {
  const { user: currentUser } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRepost = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post(`/post/${post._id}/share`, {
        content: content || "Reposted this.",
      });

      if (onRepostSuccess) {
        onRepostSuccess(res.data.newPost);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to repost");
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
        className="bg-bg-primary w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-bg-surface"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-bg-surface flex items-center justify-between bg-bg-surface/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Repeat size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-black text-xl tracking-tight">Repost</h2>
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                Share Post
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-bg-surface hover:bg-bg-primary rounded-2xl transition-all shadow-sm active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* User Input Area */}
          <div className="flex gap-4">
            <img
              src={currentUser?.avatar}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/10 shadow-md shrink-0"
              alt="me"
            />
            <div className="flex-1 min-w-0">
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a comment to your Repost..."
                className="w-full bg-transparent border-none outline-none py-2 text-lg resize-none placeholder:text-text-secondary/50 font-medium"
                rows={3}
              />
            </div>
          </div>

          {/* Original Post Preview */}
          <div className="rounded-3xl border border-bg-surface bg-bg-surface/50 p-4 space-y-3 relative group">
            <div className="flex items-center gap-2">
              <img
                src={post.user?.avatar}
                className="w-6 h-6 rounded-full object-cover"
                alt="original author"
              />
              <span className="font-bold text-xs">{post.user?.username}</span>
              <span className="text-[10px] text-text-secondary">
                • {format(post.createdAt)}
              </span>
            </div>
            <p className="text-sm text-text-primary line-clamp-3 leading-relaxed">
              {post.content}
            </p>
            {post.images && post.images.length > 0 && (
              <div className="rounded-2xl overflow-hidden aspect-video bg-bg-primary/50 ring-1 ring-inset ring-black/5">
                <img
                  src={post.images[0].url}
                  className="w-full h-full object-cover"
                  alt="post preview"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-bg-surface/30 border-t border-bg-surface flex justify-end">
          <button
            onClick={handleRepost}
            disabled={loading}
            className="px-8 py-3 bg-primary text-on-primary rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Repeat size={18} />
                <span>Repost Now</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RepostModal;
