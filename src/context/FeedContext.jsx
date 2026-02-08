import React, { createContext, useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";

const FeedContext = createContext();

export const FeedProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [feedState, setFeedState] = useState({
    posts: [],
    page: 1,
    hasMore: true,
    scrollPosition: 0,
    isLoaded: false,
  });

  // Reset feed when user changes or logs out
  useEffect(() => {
    resetFeed();
  }, [user?._id]);

  const setPosts = (newPosts) => {
    setFeedState((prev) => ({ ...prev, posts: newPosts, isLoaded: true }));
  };

  const setPage = (newPage) => {
    setFeedState((prev) => ({ ...prev, page: newPage }));
  };

  const setHasMore = (hasMore) => {
    setFeedState((prev) => ({ ...prev, hasMore }));
  };

  const setScrollPosition = (position) => {
    setFeedState((prev) => ({ ...prev, scrollPosition: position }));
  };

  const resetFeed = () => {
    setFeedState({
      posts: [],
      page: 1,
      hasMore: true,
      scrollPosition: 0,
      isLoaded: false,
    });
  };

  return (
    <FeedContext.Provider
      value={{
        feedState,
        setPosts,
        setPage,
        setHasMore,
        setScrollPosition,
        resetFeed,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => useContext(FeedContext);
