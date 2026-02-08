import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Stories from "../components/Stories";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import Suggestions from "../components/Suggestions";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { useFeed } from "../context/FeedContext"; // Import useFeed

import ShortcutsRow from "../components/ShortcutsRow";

const Home = () => {
  const navigate = useNavigate();
  const {
    feedState,
    setPosts,
    setPage: setContextPage,
    setHasMore: setContextHasMore,
    setScrollPosition,
  } = useFeed();

  // Local loading state for initial fetch or load more
  // We can derive "initial loading" from feedState.isLoaded
  const [loading, setLoading] = useState(!feedState.isLoaded);
  const [loadingMore, setLoadingMore] = useState(false);
  const [trending, setTrending] = useState([]);

  const { token, user } = useAuth();
  const observer = useRef();

  // Use posts from context
  const posts = feedState.posts;
  const page = feedState.page;
  const hasMore = feedState.hasMore;

  // Restore scroll position
  useLayoutEffect(() => {
    if (feedState.scrollPosition > 0) {
      window.scrollTo(0, feedState.scrollPosition);
    }
  }, []);

  // Save scroll position on unmount
  useEffect(() => {
    const handleScroll = () => {
      // Optional: could debounce this
      setScrollPosition(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [setScrollPosition]);

  const lastPostElementRef = React.useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setContextPage(page + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore, page, setContextPage],
  );

  useEffect(() => {
    // If we already have data and we are on the same page as before, don't refetch
    // But wait, if page changed via setContextPage, we need to fetch
    // Logic:
    // If !isLoaded, fetch page 1.
    // If isLoaded, but page > feedState.page (implies we want more data? No, page is part of state)
    // Actually, `useEffect` depends on `page`.
    // If we restored state, `page` might be e.g. 3.
    // If `posts` already has 3 pages of data, we shouldn't fetch page 3 again?
    // The current pagination logic in Home.jsx was: `fetchPosts` calls `/posts?limit=${page * 5}`.
    // It fetches ALL posts up to that limit.
    // So if `page` is 3, it fetches 15 posts.
    // If `posts.length` is already >= 15, we don't need to fetch?

    // Let's refine:
    const fetchPosts = async () => {
      try {
        // If it's a new page request (implied by page change) or initial load
        if (feedState.isLoaded && posts.length >= page * 5) {
          // Already have data for this page
          setLoading(false);
          return;
        }

        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        const res = await API.get(`/posts?limit=${page * 5}`);
        const newPosts = res.data.posts;

        setPosts(newPosts);
        setContextHasMore(newPosts.length >= page * 5);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    if (token) fetchPosts();
  }, [token, page, feedState.isLoaded]); // Added feedState.isLoaded dependency

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await API.get("/trending_hashtags");
        setTrending(res.data.trending || []);
      } catch (err) {
        console.error("Failed to fetch trending tags:", err);
      }
    };
    if (token) fetchTrending();
  }, [token]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Sidebar />

      <main className="lg:pl-64 flex justify-center">
        <div className="max-w-[1100px] w-full flex flex-col lg:flex-row gap-8 py-8 px-4">
          {/* Feed Column */}
          <div className="flex-1 max-w-[650px] space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-black tracking-tighter">
                Good morning,{" "}
                <span className="text-primary">{user?.username}</span>
              </h1>
              <p className="text-text-secondary font-medium">
                Here's what's happening today.
              </p>
            </div>

            <ShortcutsRow />
            <Stories />
            <CreatePost
              onPostCreated={(newPost) => setPosts([newPost, ...posts])}
            />

            <div className="space-y-6">
              {loading && !feedState.isLoaded ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                posts.map((post, index) => (
                  <div
                    key={post._id}
                    ref={index === posts.length - 1 ? lastPostElementRef : null}
                  >
                    <PostCard
                      post={post}
                      onPostDelete={(id) =>
                        setPosts(posts.filter((p) => p._id !== id))
                      }
                    />
                  </div>
                ))
              )}

              {loadingMore && (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <p className="text-center text-text-secondary text-sm py-10 font-medium">
                  You've reached the end of the Prism. ✨
                </p>
              )}
            </div>
          </div>

          {/* Widgets Column */}
          <aside className="hidden xl:block w-80 space-y-6">
            <Suggestions />
            <div className="bg-bg-surface p-6 rounded-[2.5rem] shadow-sm border border-bg-primary/5">
              <div
                className="flex items-center justify-between mb-4 cursor-pointer group/header"
                onClick={() => navigate("/search")}
              >
                <h3 className="font-black text-lg tracking-tight group-hover/header:text-primary transition-colors">
                  Trending for You
                </h3>
                <ChevronRight
                  size={18}
                  className="text-text-secondary group-hover/header:text-primary transition-all group-hover/header:translate-x-1"
                />
              </div>
              <div className="space-y-4">
                {trending.length > 0 ? (
                  trending.map((item) => (
                    <div
                      key={item.tag}
                      className="group cursor-pointer hover:bg-bg-primary/50 p-2 -mx-2 rounded-xl transition-colors"
                      onClick={() =>
                        navigate(
                          `/search?q=${encodeURIComponent("#" + item.tag)}`,
                        )
                      }
                    >
                      <p className="text-primary font-bold">#{item.tag}</p>
                      <p className="text-[10px] text-text-secondary font-medium">
                        {item.count} {item.count === 1 ? "post" : "posts"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-secondary">
                    No trending topics yet.
                  </p>
                )}
              </div>
            </div>
            <div className="px-6 text-xs text-text-secondary">
              <p>&copy; 2026 Prism Social. All rights reserved.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Home;
