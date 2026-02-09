import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./AdminLayout.css";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user || user.role !== "admin") {
    // Redirect non-admins if they somehow get here
    // In strict implementation, this might be handled by a route guard component
    return <div className="unauthorized-access">Unauthorized Access</div>;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="admin-layout">
      <div className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo-area">
            <span className="logo-icon">C</span>
            {sidebarOpen && <span className="logo-text">Circles Admin</span>}
          </div>
          <button
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className="material-icons">
              {sidebarOpen ? "chevron_left" : "chevron_right"}
            </i>
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <i className="material-icons">dashboard</i>
            {sidebarOpen && <span>Dashboard</span>}
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <i className="material-icons">people</i>
            {sidebarOpen && <span>Users</span>}
          </NavLink>
          <NavLink
            to="/admin/posts"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <i className="material-icons">article</i>
            {sidebarOpen && <span>Posts</span>}
          </NavLink>
          <NavLink
            to="/admin/reports"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <i className="material-icons">flag</i>
            {sidebarOpen && <span>Reports</span>}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <i className="material-icons">logout</i>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      <div className="admin-content">
        <header className="admin-topbar">
          <div className="topbar-left">
            <h2>Admin Panel</h2>
          </div>
          <div className="topbar-right">
            <div className="admin-profile">
              <img
                src={user.avatar}
                alt={user.username}
                className="avatar-xs"
              />
              <div className="user-details">
                <span className="name">{user.fullname}</span>
                <span className="role">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
