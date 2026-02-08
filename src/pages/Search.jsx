import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  X,
  User as UserIcon,
  Grid as GridIcon,
  TrendingUp,
  ArrowLeft,
  ChevronRight,
  Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../utils/api";
import PostCard from "../components/PostCard";
import Sidebar from "../components/Sidebar";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all"); // all, users, posts
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await API.get("/trending_hashtags");
        setTrending(res.data.trending || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery, activeTab]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 0) {
        handleSearch(query);
      } else {
        setUsers([]);
        setPosts([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setSearchParams({ q: searchQuery });

      if (activeTab === "all" || activeTab === "users") {
        const res = await API.get(`/search?username=${searchQuery}`);
        setUsers(res.data.users);
      }

      if (activeTab === "all" || activeTab === "posts") {
        const res = await API.get(
          `/search_post?content=${encodeURIComponent(searchQuery)}`,
        );
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "all", label: "Top", icon: TrendingUp },
    { id: "users", label: "People", icon: UserIcon },
    { id: "posts", label: "Posts", icon: GridIcon },
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-20">
      <Sidebar />

      <main className="lg:pl-64 flex justify-center">
        <div className="max-w-3xl w-full px-4 py-8">
          {/* Mobile Back Button (Visible on mobile) */}
          <div className="flex items-center gap-4 mb-6 lg:hidden">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-bg-surface rounded-xl shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-black text-2xl tracking-tighter">Explore</h1>
          </div>

          {/* Search Bar Container */}
          <div className="bg-bg-surface p-2 rounded-[2.5rem] shadow-xl shadow-black/5 ring-1 ring-inset ring-black/5 sticky top-4 z-40 backdrop-blur-xl bg-bg-surface/90">
            <div className="relative flex items-center group">
              <SearchIcon
                className="absolute left-6 text-text-secondary transition-colors group-focus-within:text-primary"
                size={20}
              />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts, #tags, @people..."
                className="w-full bg-bg-primary/50 outline-none pl-14 pr-12 py-4 rounded-[2rem] text-sm font-bold shadow-inner transition-all focus:ring-2 focus:ring-primary/20"
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => {
                      setQuery("");
                      setSearchParams({});
                    }}
                    className="absolute right-4 p-2 bg-text-secondary/10 hover:bg-bg-primary rounded-full transition-colors"
                  >
                    <X size={14} className="text-text-secondary" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-4 px-2 pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative
                      ${active ? "text-primary bg-primary/5" : "text-text-secondary hover:bg-bg-primary/50"}
                    `}
                  >
                    <Icon size={14} />
                    {tab.label}
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-1 w-8 h-1 bg-primary rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 space-y-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary animate-pulse">
                  Scanning Posts
                </p>
              </div>
            ) : !query ? (
              /* Explore/Discovery State */
              <div className="space-y-8">
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-xl tracking-tight">
                      Trending Topics
                    </h3>
                  </div>
                  <div className="grid gap-3">
                    {trending.map((item) => (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        key={item.tag}
                        onClick={() => setQuery(`#${item.tag}`)}
                        className="bg-bg-surface p-5 rounded-3xl border border-bg-primary/5 flex items-center justify-between cursor-pointer hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Hash size={24} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-lg text-primary">
                              #{item.tag}
                            </p>
                            <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">
                              {item.count} {item.count === 1 ? "Post" : "Posts"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          size={20}
                          className="text-text-secondary"
                        />
                      </motion.div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              /* Search Results State */
              <div className="space-y-10">
                {/* People Results */}
                {(activeTab === "all" || activeTab === "users") &&
                  users.length > 0 && (
                    <section>
                      <h3 className="font-black text-lg mb-6 flex items-center gap-3">
                        <UserIcon size={18} className="text-primary" />
                        PEOPLE
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {users.map((user) => (
                          <motion.div
                            whileHover={{ y: -4 }}
                            key={user._id}
                            className="bg-bg-surface p-4 rounded-3xl flex items-center gap-4 border border-bg-primary/5 shadow-sm hover:shadow-xl transition-all cursor-pointer"
                            onClick={() => navigate(`/profile/${user._id}`)}
                          >
                            <img
                              src={user.avatar}
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/5"
                              alt={user.username}
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold truncate">
                                {user.username}
                              </h4>
                              <p className="text-xs text-text-secondary truncate">
                                {user.fullname}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                {/* Post Results */}
                {(activeTab === "all" || activeTab === "posts") &&
                  posts.length > 0 && (
                    <section>
                      <h3 className="font-black text-lg mb-6 flex items-center gap-3">
                        <GridIcon size={18} className="text-primary" />
                        POSTS
                      </h3>
                      <div className="space-y-6">
                        {posts.map((post) => (
                          <PostCard
                            key={post._id}
                            post={post}
                            onPostDelete={(id) =>
                              setPosts((prev) =>
                                prev.filter((p) => p._id !== id),
                              )
                            }
                          />
                        ))}
                      </div>
                    </section>
                  )}

                {/* Empty State for results */}
                {users.length === 0 && posts.length === 0 && (
                  <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <SearchIcon size={48} className="text-text-secondary" />
                    <div>
                      <p className="font-bold text-lg">No Results Found</p>
                      <p className="text-xs">
                        Try checking your spelling or search for something else
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Search;
