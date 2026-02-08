import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Grid,
  Bookmark,
  UserPlus,
  UserCheck,
  Mail,
  Calendar,
  MapPin,
  Link as LinkIcon,
  MoreHorizontal,
  MessageCircle,
  Heart,
  Plus,
  X,
  List,
  Image as ImageIcon,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "timeago.js";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import PostCard from "../components/PostCard";
import Sidebar from "../components/Sidebar";
import { imageUpload } from "../utils/imageUpload";
import { toast } from "react-toastify";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts"); // posts, photos, saved, text
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid, list
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editData, setEditData] = useState({
    fullname: "",
    story: "",
    website: "",
    address: "",
  });
  const [avatar, setAvatar] = useState("");
  const [cover, setCover] = useState("");
  const [page, setPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const [textPosts, setTextPosts] = useState([]);
  const [textPage, setTextPage] = useState(1);
  const [textTotalPosts, setTextTotalPosts] = useState(0);
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const searchId = id || currentUser?._id;
        let userData;

        try {
          // Try fetching by ID first
          const res = await API.get(`/user/${searchId}`);
          userData = res.data.user;
        } catch (err) {
          // If ID fetch fails, try fetching by username
          const res = await API.get(`/user_username/${searchId}`);
          userData = res.data.user;
        }

        setProfileUser(userData);
        setEditData({
          fullname: userData.fullname || "",
          story: userData.story || "",
          website: userData.website || "",
          address: userData.address || "",
        });
        setAvatar(userData.avatar || "");
        setCover(userData.cover || "");

        setIsFollowing(
          userData.followers?.some(
            (f) => (typeof f === "string" ? f : f._id) === currentUser?._id,
          ),
        );

        const postsRes = await API.get(
          `/user_posts/${userData._id}?limit=9&media_type=media`,
        );
        setPosts(postsRes.data.posts);
        setTotalPosts(postsRes.data.totalPosts);
        setPage(1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id || currentUser?._id) fetchProfile();
  }, [id, currentUser?._id]);

  useEffect(() => {
    if (
      activeTab === "saved" &&
      id === currentUser?._id &&
      savedPosts.length === 0 &&
      currentUser?.saved?.length > 0
    ) {
      const fetchSaved = async () => {
        try {
          const res = await API.get("/getSavePosts");
          setSavedPosts(res.data.savePosts);
        } catch (err) {
          console.error(err);
        }
      };
      fetchSaved();
    }
  }, [activeTab, id, currentUser?._id, savedPosts.length]);

  useEffect(() => {
    if (activeTab === "text" && textPosts.length === 0 && profileUser?._id) {
      const fetchTextPosts = async () => {
        try {
          setTextLoading(true);
          const res = await API.get(
            `/user_posts/${profileUser._id}?limit=9&media_type=text`,
          );
          setTextPosts(res.data.posts);
          setTextTotalPosts(res.data.totalPosts);
          setTextPage(1);
        } catch (err) {
          console.error(err);
        } finally {
          setTextLoading(false);
        }
      };
      fetchTextPosts();
    }
  }, [activeTab, profileUser?._id, textPosts.length]);

  const handleFollow = async () => {
    if (!profileUser) return;
    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      await API.patch(`/user/${profileUser._id}/${endpoint}`);
      setIsFollowing(!isFollowing);
      // Update local follower count
      setProfileUser((prev) => ({
        ...prev,
        followers: isFollowing
          ? (prev.followers || []).filter(
              (f) => (typeof f === "string" ? f : f._id) !== currentUser?._id,
            )
          : [...(prev.followers || []), currentUser?._id],
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoadMoreLoading(true);
      let newAvatar = avatar;
      let newCover = cover;

      if (typeof avatar !== "string") {
        const res = await imageUpload([avatar]);
        newAvatar = res[0].url;
      }

      if (typeof cover !== "string") {
        const res = await imageUpload([cover]);
        newCover = res[0].url;
      }

      await API.patch("/user", {
        ...editData,
        avatar: newAvatar,
        cover: newCover,
      });

      setProfileUser((prev) => ({
        ...prev,
        ...editData,
        avatar: newAvatar,
        cover: newCover,
      }));
      setIsEditModalOpen(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Something went wrong");
    } finally {
      setLoadMoreLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadMoreLoading) return;

    if (activeTab === "posts") {
      if (posts.length >= totalPosts) return;
      try {
        setLoadMoreLoading(true);
        const res = await API.get(
          `/user_posts/${profileUser._id}?limit=9&page=${page + 1}&media_type=media`,
        );
        setPosts([...posts, ...res.data.posts]);
        setPage(page + 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadMoreLoading(false);
      }
    } else if (activeTab === "text") {
      if (textPosts.length >= textTotalPosts) return;
      try {
        setLoadMoreLoading(true);
        const res = await API.get(
          `/user_posts/${profileUser._id}?limit=9&page=${textPage + 1}&media_type=text`,
        );
        setTextPosts([...textPosts, ...res.data.posts]);
        setTextPage(textPage + 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadMoreLoading(false);
      }
    }
  };

  const isOwner = profileUser?._id === currentUser?._id;

  if (loading && !profileUser) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center space-y-4">
        <p className="font-bold text-text-secondary text-xl">User not found</p>
        <button
          onClick={() => navigate("/")}
          className="text-primary hover:underline"
        >
          Go back home
        </button>
      </div>
    );
  }

  const PostGridItem = ({ post }) => {
    const getYoutubeId = (url) => {
      if (!url) return null;
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    };

    const isNativeVideo =
      post.video ||
      post.images?.some(
        (img) =>
          img.resource_type === "video" ||
          (typeof img === "string" && img.endsWith(".mp4")) ||
          img.url?.endsWith(".mp4"),
      );

    const youtubeId = post.content ? getYoutubeId(post.content) : null;

    const isVideo = isNativeVideo || youtubeId;

    let thumbnail =
      (typeof post.images?.[0] === "string"
        ? post.images[0]
        : post.images?.[0]?.url) ||
      (post.video ? "/video-placeholder.png" : null) ||
      (youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
        : null);

    if (isNativeVideo && thumbnail && thumbnail.includes("cloudinary.com")) {
      thumbnail = thumbnail.replace(/\.[^/.]+$/, ".jpg");
    }

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

    return (
      <div
        onClick={() => navigate(`/post/${post._id}`)}
        className="aspect-square relative group cursor-pointer overflow-hidden bg-bg-surface rounded-xl ring-1 ring-inset ring-black/5"
      >
        {thumbnail ? (
          <>
            <img
              src={thumbnail}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              alt=""
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="p-3 bg-black/40 backdrop-blur-sm rounded-full text-white shadow-xl ring-1 ring-inset ring-white/20">
                  <Play size={20} fill="currentColor" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center p-2 text-center overflow-hidden ${post.background ? "p-4" : ""}`}
            style={
              post.background
                ? {
                    background:
                      POST_BACKGROUNDS_MAP[post.background] || post.background,
                  }
                : {}
            }
          >
            <p
              className={`font-bold line-clamp-4 leading-tight ${post.background ? "text-[10px] text-white drop-shadow-md font-black" : "text-[10px] text-black"}`}
              style={post.textStyle || {}}
            >
              {post.content}
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-sm z-10">
          <div className="flex items-center gap-1">
            <Heart size={16} fill="white" /> {post.likes?.length || 0}
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle size={16} fill="white" />{" "}
            {post.comments?.length || 0}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-20">
      <Sidebar />

      <main className="lg:pl-64 flex justify-center">
        <div className="max-w-7xl w-full">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 flex items-center gap-4 bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-bg-primary rounded-xl"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="font-black text-lg">{profileUser.username}</h2>
          </div>

          {/* Profile Header Section */}
          <div className="bg-bg-surface overflow-hidden lg:rounded-b-[3rem] shadow-xl shadow-black/5 ring-1 ring-inset ring-black/5">
            {/* Cover Photo */}
            <div className="h-48 sm:h-64 lg:h-80 relative group">
              <img
                src={
                  profileUser.cover ||
                  "https://picsum.photos/1200/400?grayscale"
                }
                className="w-full h-full object-cover"
                alt="cover"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all" />
              {/* {isOwner && (
                <button className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-black/80 transition-all">
                  <Plus size={16} />
                  Edit Cover
                </button>
              )} */}
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-8 relative">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 sm:-mt-20">
                {/* Avatar */}
                <div className="relative inline-block group">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[6px] border-bg-surface bg-bg-surface overflow-hidden shadow-2xl relative">
                    <img
                      src={profileUser.avatar}
                      className="w-full h-full object-cover"
                      alt={profileUser.username}
                    />
                    {isOwner && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                        <ImageIcon size={24} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-1 flex flex-wrap gap-3 items-center justify-end">
                  {isOwner ? (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-6 py-3 bg-bg-primary hover:bg-bg-primary/80 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Settings size={18} />
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleFollow}
                        className={`px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 shadow-lg ${
                          isFollowing
                            ? "bg-bg-primary text-text-primary border border-bg-surface"
                            : "bg-primary text-on-primary shadow-primary/20 hover:scale-105 active:scale-95"
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck size={18} />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus size={18} />
                            Follow
                          </>
                        )}
                      </button>
                      <button className="p-3 bg-bg-primary hover:bg-bg-primary/80 rounded-2xl transition-all shadow-sm">
                        <Mail size={18} />
                      </button>
                    </>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-3 bg-bg-primary hover:bg-bg-primary/80 rounded-2xl transition-all shadow-sm"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    <AnimatePresence>
                      {showMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-bg-surface border border-bg-primary/20 rounded-2xl shadow-2xl z-50 py-2 p-1"
                          >
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  window.location.href,
                                );
                                setShowMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-bg-primary/50 rounded-xl text-xs font-bold transition-all"
                            >
                              Copy Profile Link
                            </button>
                            <button className="w-full text-left px-4 py-2 hover:bg-bg-primary/50 rounded-xl text-xs font-bold transition-all">
                              Share Profile
                            </button>
                            {isOwner && (
                              <button
                                onClick={() => navigate("/settings")}
                                className="w-full text-left px-4 py-2 hover:bg-bg-primary/50 rounded-xl text-xs font-bold transition-all text-error"
                              >
                                Account Settings
                              </button>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Name & Bio */}
              <div className="mt-6 space-y-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">
                    {profileUser.fullname}
                  </h1>
                  <p className="text-primary font-bold">
                    @{profileUser.username}
                  </p>
                </div>

                <p className="text-text-primary text-sm leading-relaxed max-w-2xl font-medium">
                  {profileUser.story || "No bio yet."}
                </p>

                {/* Stats */}
                <div className="flex gap-8 py-4 border-y border-bg-primary/10">
                  <div className="text-center group cursor-pointer">
                    <p className="text-xl font-black text-text-primary group-hover:text-primary transition-colors">
                      {posts.length}
                    </p>
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">
                      Posts
                    </p>
                  </div>
                  <div className="text-center group cursor-pointer">
                    <p className="text-xl font-black text-text-primary group-hover:text-primary transition-colors">
                      {profileUser.followers?.length || 0}
                    </p>
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">
                      Followers
                    </p>
                  </div>
                  <div className="text-center group cursor-pointer">
                    <p className="text-xl font-black text-text-primary group-hover:text-primary transition-colors">
                      {profileUser.following?.length || 0}
                    </p>
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">
                      Following
                    </p>
                  </div>
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap gap-4">
                  {profileUser.address && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                      <MapPin size={14} className="text-primary" />
                      {profileUser.address}
                    </div>
                  )}
                  {profileUser.website && (
                    <a
                      href={profileUser.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <LinkIcon size={14} />
                      {profileUser.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                    <Calendar size={14} />
                    Joined {format(profileUser.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center px-4 border-t border-bg-primary/10 bg-bg-surface/50">
              {[
                { id: "posts", icon: Grid, label: "Posts" },
                { id: "text", icon: List, label: "Text" },
                {
                  id: "saved",
                  icon: Bookmark,
                  label: "Saved",
                  ownerOnly: true,
                },
              ].map((tab) => {
                if (tab.ownerOnly && !isOwner) return null;
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-5 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all relative
                      ${active ? "text-primary" : "text-text-secondary hover:text-text-primary"}
                    `}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {active && (
                      <motion.div
                        layoutId="activeProfileTab"
                        className="absolute bottom-0 w-8 h-1 bg-primary rounded-t-full"
                      />
                    )}
                  </button>
                );
              })}

              <div className="flex items-center gap-1 px-4 border-l border-bg-primary/10 h-10 my-auto ml-auto">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-bg-primary"}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-bg-primary"}`}
                >
                  <ArrowLeft className="-rotate-90" size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Feed Content */}
          <div className="mt-8 px-4 sm:px-0">
            <div className="w-full flex justify-center pb-20">
              <div className="w-full max-w-5xl">
                <AnimatePresence mode="wait">
                  {viewMode === "list" ? (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {activeTab === "posts" &&
                        (posts.length > 0 ? (
                          <>
                            {posts.map((post) => (
                              <PostCard
                                key={post._id}
                                post={post}
                                onPostDelete={(pid) =>
                                  setPosts(posts.filter((p) => p._id !== pid))
                                }
                              />
                            ))}
                            {posts.length < totalPosts && (
                              <button
                                onClick={loadMorePosts}
                                disabled={loadMoreLoading}
                                className="w-full py-4 bg-bg-surface hover:bg-bg-primary rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                              >
                                {loadMoreLoading ? (
                                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  "Load More"
                                )}
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 bg-bg-surface rounded-[3rem] shadow-inner opacity-60">
                            <Grid size={48} className="text-text-secondary" />
                            <p className="font-black text-lg">No posts yet</p>
                            <p className="text-xs font-bold text-text-secondary px-10">
                              Start sharing your thoughts with the world
                            </p>
                          </div>
                        ))}

                      {activeTab === "text" &&
                        (textLoading ? (
                          <div className="py-24 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : textPosts.length > 0 ? (
                          <>
                            {textPosts.map((post) => (
                              <PostCard
                                key={post._id}
                                post={post}
                                onPostDelete={(pid) =>
                                  setTextPosts(
                                    textPosts.filter((p) => p._id !== pid),
                                  )
                                }
                              />
                            ))}
                            {textPosts.length < textTotalPosts && (
                              <button
                                onClick={loadMorePosts}
                                disabled={loadMoreLoading}
                                className="w-full py-4 bg-bg-surface hover:bg-bg-primary rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                              >
                                {loadMoreLoading ? (
                                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  "Load More"
                                )}
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 bg-bg-surface rounded-[3rem] shadow-inner opacity-60">
                            <List size={48} className="text-text-secondary" />
                            <p className="font-black text-lg">
                              No text posts yet
                            </p>
                            <p className="text-xs font-bold text-text-secondary px-10">
                              Your text-only updates will appear here
                            </p>
                          </div>
                        ))}

                      {activeTab === "saved" &&
                        isOwner &&
                        (savedPosts.length > 0 ? (
                          savedPosts.map((post) => (
                            <PostCard key={post._id} post={post} />
                          ))
                        ) : (
                          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 bg-bg-surface rounded-[3rem] shadow-inner opacity-60">
                            <Bookmark
                              size={48}
                              className="text-text-secondary"
                            />
                            <p className="font-black text-lg">
                              Nothing saved yet
                            </p>
                            <p className="text-xs font-bold text-text-secondary px-10">
                              Save posts to see them here later
                            </p>
                          </div>
                        ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-4">
                        {activeTab === "posts" ? (
                          posts.length > 0 ? (
                            posts.map((post) => (
                              <PostGridItem key={post._id} post={post} />
                            ))
                          ) : (
                            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-4 bg-bg-surface rounded-[3rem] shadow-inner opacity-60">
                              <Grid size={48} className="text-text-secondary" />
                              <p className="font-black text-lg">No posts yet</p>
                              <p className="text-xs font-bold text-text-secondary px-10">
                                Start sharing your thoughts with the world
                              </p>
                            </div>
                          )
                        ) : activeTab === "text" ? (
                          textLoading ? (
                            <div className="col-span-full py-24 flex items-center justify-center">
                              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : textPosts.length > 0 ? (
                            textPosts.map((post) => (
                              <PostGridItem key={post._id} post={post} />
                            ))
                          ) : (
                            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-4 bg-bg-surface rounded-[3rem] shadow-inner opacity-60">
                              <List size={48} className="text-text-secondary" />
                              <p className="font-black text-lg">
                                No text posts yet
                              </p>
                              <p className="text-xs font-bold text-text-secondary px-10">
                                Your text-only updates will appear here
                              </p>
                            </div>
                          )
                        ) : (
                          activeTab === "saved" &&
                          isOwner &&
                          (savedPosts.length > 0 ? (
                            savedPosts.map((post) => (
                              <PostGridItem key={post._id} post={post} />
                            ))
                          ) : (
                            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-4 bg-bg-surface rounded-[3rem] shadow-inner opacity-60">
                              <Bookmark
                                size={48}
                                className="text-text-secondary"
                              />
                              <p className="font-black text-lg">
                                Nothing saved yet
                              </p>
                              <p className="text-xs font-bold text-text-secondary px-10">
                                Save posts to see them here later
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      {((activeTab === "posts" && posts.length < totalPosts) ||
                        (activeTab === "text" &&
                          textPosts.length < textTotalPosts)) && (
                        <button
                          onClick={loadMorePosts}
                          disabled={loadMoreLoading}
                          className="w-full py-4 bg-bg-surface hover:bg-bg-primary rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          {loadMoreLoading ? (
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Load More"
                          )}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-bg-surface w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black tracking-tight">
                    Edit Profile
                  </h2>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-2 hover:bg-bg-primary rounded-xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form
                  onSubmit={handleUpdateProfile}
                  className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar"
                >
                  {/* Photos Section */}
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">
                      Photos
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Avatar Upload */}
                      <div className="relative group aspect-square rounded-2xl overflow-hidden bg-bg-primary flex flex-col items-center justify-center border-2 border-dashed border-bg-primary/50 hover:border-primary transition-all">
                        {avatar && (
                          <img
                            src={
                              typeof avatar === "string"
                                ? avatar
                                : URL.createObjectURL(avatar)
                            }
                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                            alt="avatar preview"
                          />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-2 pointer-events-none">
                          <ImageIcon size={24} className="text-primary" />
                          <span className="text-[10px] font-black uppercase">
                            Avatar
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAvatar(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      {/* Cover Upload */}
                      <div className="relative group aspect-square rounded-2xl overflow-hidden bg-bg-primary flex flex-col items-center justify-center border-2 border-dashed border-bg-primary/50 hover:border-primary transition-all">
                        {cover && (
                          <img
                            src={
                              typeof cover === "string"
                                ? cover
                                : URL.createObjectURL(cover)
                            }
                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                            alt="cover preview"
                          />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-2 pointer-events-none">
                          <ImageIcon size={24} className="text-primary" />
                          <span className="text-[10px] font-black uppercase">
                            Cover
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCover(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editData.fullname}
                      onChange={(e) =>
                        setEditData({ ...editData, fullname: e.target.value })
                      }
                      className="w-full bg-bg-primary border-none rounded-2xl p-4 font-bold focus:ring-2 ring-primary transition-all"
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      value={editData.story}
                      onChange={(e) =>
                        setEditData({ ...editData, story: e.target.value })
                      }
                      className="w-full bg-bg-primary border-none rounded-2xl p-4 font-bold focus:ring-2 ring-primary transition-all resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">
                        Website
                      </label>
                      <input
                        type="text"
                        value={editData.website}
                        onChange={(e) =>
                          setEditData({ ...editData, website: e.target.value })
                        }
                        className="w-full bg-bg-primary border-none rounded-2xl p-4 font-bold focus:ring-2 ring-primary transition-all text-sm"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editData.address}
                        onChange={(e) =>
                          setEditData({ ...editData, address: e.target.value })
                        }
                        className="w-full bg-bg-primary border-none rounded-2xl p-4 font-bold focus:ring-2 ring-primary transition-all text-sm"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
