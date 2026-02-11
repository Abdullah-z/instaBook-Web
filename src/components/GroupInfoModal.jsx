import React, { useState, useEffect } from "react";
import { X, Camera, UserPlus, LogOut, Check } from "lucide-react";
import API from "../utils/api";
import { toast } from "react-toastify";
import { imageUpload } from "../utils/imageUpload";
import { useAuth } from "../hooks/useAuth";

const GroupInfoModal = ({ chat, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(chat.groupName);
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(chat.groupAvatar);
  const [loading, setLoading] = useState(false);
  const [addMemberMode, setAddMemberMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [members, setMembers] = useState(chat.recipients || []);

  // Admin transfer modal
  const [showAdminTransfer, setShowAdminTransfer] = useState(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState(null);

  const isAdmin = chat.admins?.some(
    (adminId) => adminId.toString() === user._id.toString(),
  );
  const isLastAdmin =
    isAdmin &&
    chat.admins?.filter((adminId) => adminId.toString() !== user._id.toString())
      .length === 0;

  useEffect(() => {
    setMembers(chat.recipients || []);
    setAvatarPreview(chat.groupAvatar); // Sync avatar preview with chat data
    setGroupName(chat.groupName); // Sync group name
  }, [chat.recipients, chat.groupAvatar, chat.groupName]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await API.get(`/search?username=${searchQuery}`);
        // Filter out existing members
        const filtered = res.data.users.filter(
          (u) => !members.find((m) => m._id === u._id),
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error(err);
      }
    };
    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, members]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      let media = [];
      let avatarUrl = chat.groupAvatar;

      if (groupAvatar) {
        media = await imageUpload([groupAvatar]);
        avatarUrl = media[0].url;
      }

      const res = await API.patch(`/group/${chat._id}`, {
        groupName,
        groupAvatar: avatarUrl,
      });

      toast.success("Group updated!");
      onUpdate(res.data.conversation);
      setIsEditing(false);
      setGroupAvatar(null); // Reset file reference
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update group");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (newMember) => {
    const newMembers = [...members, newMember];
    setMembers(newMembers);
    setAddMemberMode(false);
    setSearchQuery("");

    try {
      const res = await API.patch(`/group/${chat._id}`, {
        recipients: newMembers.map((m) => m._id),
      });
      toast.success("Member added!");
      onUpdate(res.data.conversation);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to add member");
      setMembers(chat.recipients); // Revert on error
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (members.length <= 3) {
      toast.error("Group must have at least 3 members");
      return;
    }

    if (!window.confirm("Remove this member from the group?")) return;

    const newMembers = members.filter((m) => m._id !== memberId);
    setMembers(newMembers);

    try {
      const res = await API.patch(`/group/${chat._id}`, {
        recipients: newMembers.map((m) => m._id),
      });
      toast.success("Member removed!");
      onUpdate(res.data.conversation);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to remove member");
      setMembers(chat.recipients); // Revert on error
    }
  };

  const handleLeaveGroup = async () => {
    if (members.length <= 2) {
      toast.error("Cannot leave. Group must have at least 2 members.");
      return;
    }

    // If last admin, show admin transfer modal
    if (isLastAdmin) {
      setShowAdminTransfer(true);
      return;
    }

    if (!window.confirm("Are you sure you want to leave this group?")) return;

    try {
      await API.post(`/group/${chat._id}/leave`);
      toast.success("Left group successfully");
      onClose();
      window.location.href = "/messages"; // Navigate back to messages
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to leave group");
    }
  };

  const handleConfirmLeaveWithTransfer = async () => {
    if (!selectedNewAdmin) {
      toast.error("Please select a new admin");
      return;
    }

    try {
      await API.post(`/group/${chat._id}/leave`, {
        newAdminId: selectedNewAdmin,
      });
      toast.success("Admin transferred. Left group successfully");
      onClose();
      window.location.href = "/messages";
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to leave group");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
      setIsEditing(true);
    }
  };

  // Non-admin members (exclude current user for admin transfer)
  const potentialAdmins = members.filter((m) => m._id !== user._id);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex justify-end backdrop-blur-sm">
        <div className="bg-bg-primary w-full max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-bg-surface flex justify-between items-center">
            <h2 className="text-xl font-bold">Group Info</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-surface rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Avatar & Name */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <img
                  src={avatarPreview || "https://picsum.photos/50"}
                  alt="Group Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-bg-surface"
                />
                <label className="absolute bottom-0 right-0 p-2 bg-primary text-on-primary rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="flex-1 bg-bg-surface rounded-xl px-3 py-2 outline-none border focus:border-primary"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="bg-primary text-on-primary px-3 py-2 rounded-xl font-bold text-sm"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black">{chat.groupName}</h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-primary text-sm font-bold hover:underline"
                  >
                    Edit
                  </button>
                </div>
              )}
              <p className="text-text-secondary font-medium">
                {members.length} participants
              </p>
            </div>

            {/* Members List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Members</h3>
                <button
                  className="p-2 hover:bg-bg-surface rounded-full text-primary"
                  onClick={() => setAddMemberMode(!addMemberMode)}
                >
                  <UserPlus size={20} />
                </button>
              </div>

              {/* Add Member Search */}
              {addMemberMode && (
                <div className="mt-3 mb-4 bg-bg-surface rounded-xl p-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users to add..."
                    className="w-full bg-transparent py-2 px-1 outline-none"
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {searchResults.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => handleAddMember(user)}
                          className="flex items-center gap-2 p-2 hover:bg-bg-primary rounded-lg cursor-pointer transition-colors"
                        >
                          <img
                            src={user.avatar || "https://picsum.photos/50"}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-bold text-sm">{user.username}</p>
                            <p className="text-xs text-text-secondary">
                              {user.fullname}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-3 p-2 hover:bg-bg-surface rounded-xl transition-colors"
                  >
                    <img
                      src={member.avatar || "https://picsum.photos/50"}
                      alt={member.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{member.username}</p>
                      {chat.admins?.some(
                        (adminId) =>
                          adminId &&
                          member._id &&
                          adminId.toString() === member._id.toString(),
                      ) && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                          Admin
                        </span>
                      )}
                    </div>
                    {member._id !== user._id && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-2 hover:bg-error/10 rounded-full text-error transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 space-y-3 border-t border-bg-surface">
              <button
                onClick={handleLeaveGroup}
                className="w-full flex items-center gap-3 p-3 text-error font-bold hover:bg-error/5 rounded-xl transition-colors"
              >
                <LogOut size={20} />
                {isLastAdmin ? "Leave & Transfer Admin" : "Exit Group"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Transfer Modal */}
      {showAdminTransfer && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-bg-primary rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Transfer Admin Role</h3>
            <p className="text-text-secondary mb-4 text-sm">
              You are the last admin. Please select a new admin before leaving.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {potentialAdmins.map((member) => (
                <div
                  key={member._id}
                  onClick={() => setSelectedNewAdmin(member._id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedNewAdmin === member._id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-bg-surface"
                  }`}
                >
                  <img
                    src={member.avatar || "https://picsum.photos/50"}
                    alt={member.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{member.username}</p>
                    <p className="text-xs text-text-secondary">
                      {member.fullname}
                    </p>
                  </div>
                  {selectedNewAdmin === member._id && (
                    <Check size={18} className="text-primary" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAdminTransfer(false);
                  setSelectedNewAdmin(null);
                }}
                className="flex-1 py-3 font-bold rounded-xl hover:bg-bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeaveWithTransfer}
                disabled={!selectedNewAdmin}
                className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Transfer & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupInfoModal;
