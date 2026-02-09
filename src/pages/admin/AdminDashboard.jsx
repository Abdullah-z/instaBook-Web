import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTotalUsers,
  getTotalPosts,
  getTotalComments,
  getTotalLikes,
  getTotalSpamPosts,
  getOnlineUsers,
} from "../../api/adminApi";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    totalSpamPosts: 0,
    onlineUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [users, posts, comments, likes, spamPosts, online] =
        await Promise.all([
          getTotalUsers(),
          getTotalPosts(),
          getTotalComments(),
          getTotalLikes(),
          getTotalSpamPosts(),
          getOnlineUsers(),
        ]);

      setStats({
        totalUsers: users.total_users,
        totalPosts: posts.total_posts,
        totalComments: comments.total_comments,
        totalLikes: likes.total_likes,
        totalSpamPosts: spamPosts.total_spam_posts,
        onlineUsers: online.total_online_users,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <div
      className={`stat-card ${color}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="stat-icon">
        <i className={`material-icons`}>{icon}</i>
      </div>
      <div className="stat-content">
        <h3>{loading ? "..." : value.toLocaleString()}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of your social media platform</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Online Users"
          value={stats.onlineUsers}
          icon="wifi"
          color="orange"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="people"
          color="blue"
          onClick={() => navigate("/admin/users")}
        />
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          icon="article"
          color="green"
          onClick={() => navigate("/admin/posts")}
        />
        <StatCard
          title="Total Comments"
          value={stats.totalComments}
          icon="comment"
          color="purple"
        />
        <StatCard
          title="Total Likes"
          value={stats.totalLikes}
          icon="favorite"
          color="pink"
        />
      </div>

      {stats.totalSpamPosts > 0 && (
        <div className="alert-card" onClick={() => navigate("/admin/reports")}>
          <div className="alert-icon">
            <i className="material-icons">warning</i>
          </div>
          <div className="alert-content">
            <h3>Reported Posts Require Attention</h3>
            <p>
              {stats.totalSpamPosts} post{stats.totalSpamPosts !== 1 ? "s" : ""}{" "}
              with multiple reports
            </p>
          </div>
          <div className="alert-action">
            <i className="material-icons">arrow_forward</i>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button
            className="action-btn"
            onClick={() => navigate("/admin/users")}
          >
            <i className="material-icons">people</i>
            <span>Manage Users</span>
          </button>
          <button
            className="action-btn"
            onClick={() => navigate("/admin/posts")}
          >
            <i className="material-icons">article</i>
            <span>Manage Posts</span>
          </button>
          <button
            className="action-btn"
            onClick={() => navigate("/admin/reports")}
          >
            <i className="material-icons">flag</i>
            <span>View Reports</span>
          </button>
          <button className="action-btn" onClick={loadStats}>
            <i className="material-icons">refresh</i>
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
