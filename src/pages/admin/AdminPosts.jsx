import React, { useState, useEffect } from "react";
import { getAllPosts } from "../../api/adminApi";
import { formatDistanceToNow } from "date-fns";
import "./AdminPosts.css";
import PostCard from "../../components/PostCard"; // Assuming reusing existing component
// Or create a simplified view if PostCard is too complex/coupled

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, text, image, video
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await getAllPosts();
      setPosts(res.posts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPostType = (post) => {
    if (post.images && post.images.length > 0) return "image";
    return "text";
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.user.username.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchesSearch;
    return matchesSearch && getPostType(post) === filter;
  });

  return (
    <div className="admin-posts">
      <div className="page-header">
        <h1>Post Management</h1>
        <div className="controls">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`filter-tab ${filter === "image" ? "active" : ""}`}
              onClick={() => setFilter("image")}
            >
              Images
            </button>
            <button
              className={`filter-tab ${filter === "text" ? "active" : ""}`}
              onClick={() => setFilter("text")}
            >
              Text
            </button>
          </div>
          <div className="search-bar">
            <i className="material-icons">search</i>
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="posts-table-container">
        {loading ? (
          <div className="loading-state">Loading posts...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Post Content</th>
                <th>Author</th>
                <th>Type</th>
                <th>Posted</th>
                <th>Engagement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post._id}>
                  <td className="content-cell">
                    <div className="post-preview">
                      {post.images && post.images.length > 0 && (
                        <img
                          src={post.images[0].url}
                          alt=""
                          className="post-thumb"
                        />
                      )}
                      <span className="post-excerpt">
                        {post.content.substring(0, 50)}
                        {post.content.length > 50 ? "..." : ""}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="user-cell">
                      <img
                        src={post.user.avatar}
                        alt=""
                        className="avatar-xs"
                      />
                      <span className="username">@{post.user.username}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${getPostType(post)}`}>
                      {getPostType(post)}
                    </span>
                  </td>
                  <td>
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td>
                    <div className="stats-cell">
                      <span title="Likes">
                        <i className="material-icons tiny">favorite</i>{" "}
                        {post.likes.length}
                      </span>
                      <span title="Comments">
                        <i className="material-icons tiny">comment</i>{" "}
                        {post.comments.length}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      title="View Post"
                      onClick={() => setSelectedPost(post)}
                    >
                      <i className="material-icons">visibility</i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div
            className="post-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="post-detail-view">
              {/* Simplified post view for admin */}
              <div className="post-header">
                <div className="user-info">
                  <img
                    src={selectedPost.user.avatar}
                    alt=""
                    className="avatar-sm"
                  />
                  <div>
                    <div className="username">{selectedPost.user.username}</div>
                    <div className="time">
                      <div className="time">
                        {formatDistanceToNow(new Date(selectedPost.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  className="close-btn"
                  onClick={() => setSelectedPost(null)}
                >
                  <i className="material-icons">close</i>
                </button>
              </div>

              <div className="post-body">
                <p>{selectedPost.content}</p>
                {selectedPost.images && selectedPost.images.length > 0 && (
                  <div className="post-images">
                    {selectedPost.images.map((img, i) => (
                      <img key={i} src={img.url} alt="" />
                    ))}
                  </div>
                )}
              </div>

              <div className="post-footer">
                <div className="stat">
                  <i className="material-icons">favorite</i>{" "}
                  {selectedPost.likes.length} Likes
                </div>
                <div className="stat">
                  <i className="material-icons">comment</i>{" "}
                  {selectedPost.comments.length} Comments
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
