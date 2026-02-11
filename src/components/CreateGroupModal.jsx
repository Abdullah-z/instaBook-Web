import React, { useState, useEffect } from "react";
import { X, Search, Check, Upload, User } from "lucide-react";
import API from "../utils/api";
import { toast } from "react-toastify";
import { imageUpload } from "../utils/imageUpload";

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await API.get(`/user/search?username=${searchQuery}`);
        setSearchResults(res.data.users);
      } catch (err) {
        console.error(err);
      }
    };
    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleUserSelect = (user) => {
    if (selectedUsers.some((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUsers.length < 2) return;

    setLoading(true);
    try {
      let media = [];
      if (groupAvatar) {
        media = await imageUpload([groupAvatar]);
      }

      const res = await API.post("/message/group", {
        groupName,
        recipients: selectedUsers.map((u) => u._id),
        groupAvatar: media[0]?.url,
      });

      toast.success("Group created!");
      onGroupCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-bg-primary w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-bg-surface flex justify-between items-center">
          <h2 className="text-xl font-bold">Create Group</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-surface rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <div className="w-24 h-24 rounded-full bg-bg-surface border-2 border-dashed border-text-secondary/30 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Group Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="text-text-secondary" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-bold">Change</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Group Name */}
          <div>
            <label className="text-sm font-bold text-text-secondary mb-1 block">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full bg-bg-surface rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
            />
          </div>

          {/* Search Users */}
          <div>
            <label className="text-sm font-bold text-text-secondary mb-1 block">
              Add Members ({selectedUsers.length})
            </label>
            <div className="bg-bg-surface rounded-xl flex items-center px-3 border border-transparent focus-within:border-primary/50 transition-colors">
              <Search size={18} className="text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-transparent border-none focus:ring-0 px-3 py-3 outline-none"
              />
            </div>
          </div>

          {/* Selected Users Chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user._id}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"
                >
                  {user.username}
                  <button
                    onClick={() => handleUserSelect(user)}
                    className="hover:text-error"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Results */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {searchResults.map((user) => {
              const isSelected = selectedUsers.some((u) => u._id === user._id);
              return (
                <div
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-bg-surface"
                  }`}
                >
                  <img
                    src={user.avatar || "https://picsum.photos/50"}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{user.username}</p>
                    <p className="text-xs text-text-secondary">
                      {user.fullname}
                    </p>
                  </div>
                  {isSelected && <Check size={18} className="text-primary" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-bg-surface flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 font-bold rounded-xl hover:bg-bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !groupName.trim() || selectedUsers.length < 2}
            className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
