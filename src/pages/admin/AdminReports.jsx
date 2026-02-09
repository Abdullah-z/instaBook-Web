import React, { useState, useEffect } from "react";
import { getSpamPosts, deleteSpamPost } from "../../api/adminApi";
import { formatDistanceToNow } from "date-fns";
import "./AdminReports.css";

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await getSpamPosts();
      setReports(res.spamPosts);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    ) {
      try {
        await deleteSpamPost(postId);
        // Remove from list
        setReports((prev) => prev.filter((r) => r._id !== postId));
        setSelectedReport(null);
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("Failed to delete post");
      }
    }
  };

  const ReportCard = ({ report }) => (
    <div className="report-card">
      <div className="report-header">
        <div className="user-info">
          <img src={report.user.avatar} alt="" className="avatar-sm" />
          <div>
            <div className="username">@{report.user.username}</div>
            <div className="time">
              {formatDistanceToNow(new Date(report.createdAt), {
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
        <div className="report-badge">
          <i className="material-icons">flag</i>
          {report.reports.length} Reports
        </div>
      </div>

      <div className="report-content">
        <p>{report.content}</p>
        {report.images && report.images.length > 0 && (
          <div className="report-image-preview">
            <img src={report.images[0].url} alt="" />
            {report.images.length > 1 && (
              <span className="image-count">
                +{report.images.length - 1} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="report-actions">
        <button
          className="action-btn-outline"
          onClick={() => setSelectedReport(report)}
        >
          Review Details
        </button>
        <button
          className="action-btn-danger"
          onClick={() => handleDelete(report._id)}
        >
          Delete Post
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-reports">
      <div className="page-header">
        <h1>Content Moderation</h1>
        <p className="subtitle">Review and manage reported content</p>
      </div>

      {loading ? (
        <div className="loading-state">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <i className="material-icons">check_circle</i>
          <h3>All Caught Up!</h3>
          <p>There are no reported posts to review at this moment.</p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <ReportCard key={report._id} report={report} />
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div
            className="post-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="post-detail-view">
              <div className="report-alert-banner">
                <i className="material-icons">warning</i>
                This post has been reported {selectedReport.reports.length}{" "}
                times
              </div>

              <div className="post-header">
                <div className="user-info">
                  <img
                    src={selectedReport.user.avatar}
                    alt=""
                    className="avatar-sm"
                  />
                  <div>
                    <div className="username">
                      {selectedReport.user.username}
                    </div>
                    <div className="time">
                      {formatDistanceToNow(new Date(selectedReport.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
                <button
                  className="close-btn"
                  onClick={() => setSelectedReport(null)}
                >
                  <i className="material-icons">close</i>
                </button>
              </div>

              <div className="post-body">
                <p>{selectedReport.content}</p>
                {/* Images would go here */}
              </div>

              <div className="moderation-actions-panel">
                <h3>Moderation Actions</h3>
                <div className="button-group">
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(selectedReport._id)}
                  >
                    <i className="material-icons">delete</i> Delete Post
                  </button>
                  <button
                    className="dismiss-btn"
                    onClick={() => setSelectedReport(null)}
                  >
                    <i className="material-icons">check</i> Dismiss & Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
