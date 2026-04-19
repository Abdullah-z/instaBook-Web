import React, { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import GuestBanner from "../components/GuestBanner";
import publicApi from "../utils/publicApi";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import ThemeSwitcher from "../components/ThemeSwitcher";

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExplore = async () => {
      try {
        const res = await publicApi.get("/public_explore?num=20");
        setPosts(res.data.posts);
      } catch (err) {
        console.error("Failed to fetch explore feed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExplore();
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-24">
      {/* Simple Header for Guests */}
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-bg-surface px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src="/circles.png" alt="Circles Logo" className="w-10 h-10 object-contain" />
          <span className="font-extrabold text-2xl tracking-tighter hidden sm:block">Circles Explore</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          {user ? (
            <Link
              to="/"
              className="px-4 py-2 rounded-full bg-bg-surface text-text-primary font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Go to Home
            </Link>
          ) : (
            <Link
              to="/login?redirect=explore"
              className="px-4 py-2 rounded-full bg-primary text-on-primary font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Log in
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-[650px] mx-auto py-8 px-4 space-y-6">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-black tracking-tighter">Discover</h1>
          <p className="text-text-secondary font-medium mt-1">
            See what's happening around the world on Circles.
          </p>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post._id} post={post} readOnly={!user} />
            ))
          ) : (
            <p className="text-center text-text-secondary py-10">No public posts found. Check back later!</p>
          )}
        </div>
      </main>

      {!user && <GuestBanner />}
    </div>
  );
};

export default Explore;
