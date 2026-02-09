import React, { useState, useEffect } from "react";
import { getAllUsers } from "../../api/adminApi";
import { format } from "date-fns";
import "./AdminUsers.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers();
      setUsers(res.users);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullname.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="admin-users">
      <div className="page-header">
        <h1>User Management</h1>
        <div className="search-bar">
          <i className="material-icons">search</i>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="users-table-container">
        {loading ? (
          <div className="loading-state">Loading users...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Stats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-cell">
                      <img src={user.avatar} alt="" className="avatar-sm" />
                      <div>
                        <div className="username">@{user.username}</div>
                        <div className="fullname">{user.fullname}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={`badge ${user.role === "admin" ? "badge-admin" : "badge-user"}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>{format(new Date(user.createdAt), "MMM d, yyyy")}</td>
                  <td>
                    <div className="stats-cell">
                      <span title="Followers">
                        <i className="material-icons tiny">people</i>{" "}
                        {user.followers.length}
                      </span>
                      <span title="Following">
                        <i className="material-icons tiny">person_add</i>{" "}
                        {user.following.length}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      title="View Details"
                      onClick={() => setSelectedUser(user)}
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

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedUser(null)}
              >
                <i className="material-icons">close</i>
              </button>
            </div>
            <div className="user-profile-modal">
              <div className="profile-header">
                <img src={selectedUser.avatar} alt="" className="avatar-lg" />
                <div className="profile-info">
                  <h3>{selectedUser.fullname}</h3>
                  <p className="username">@{selectedUser.username}</p>
                  <p className="email">{selectedUser.email}</p>
                </div>
              </div>
              <div className="profile-stats">
                <div className="stat-box">
                  <span className="value">{selectedUser.followers.length}</span>
                  <span className="label">Followers</span>
                </div>
                <div className="stat-box">
                  <span className="value">{selectedUser.following.length}</span>
                  <span className="label">Following</span>
                </div>
              </div>
              <div className="profile-details">
                <div className="detail-row">
                  <span className="label">Role</span>
                  <span className="value">{selectedUser.role}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Gender</span>
                  <span className="value">{selectedUser.gender}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Mobile</span>
                  <span className="value">{selectedUser.mobile || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Address</span>
                  <span className="value">{selectedUser.address || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Website</span>
                  <span className="value">
                    {selectedUser.website ? (
                      <a
                        href={selectedUser.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selectedUser.website}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Story</span>
                  <span className="value">{selectedUser.story || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
