import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, UserCheck } from "lucide-react";
import API from "../utils/api";

const Suggestions = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await API.get("/suggestionsUser");
        setUsers(res.data.users || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSuggestions();
  }, []);

  const toggleFollow = async (id) => {
    const isFollowing = following[id];

    // Optimistic update
    setFollowing((prev) => ({ ...prev, [id]: !isFollowing }));

    try {
      if (isFollowing) {
        await API.patch(`/user/${id}/unfollow`);
      } else {
        await API.patch(`/user/${id}/follow`);
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      setFollowing((prev) => ({ ...prev, [id]: isFollowing }));
    }
  };

  return (
    <div className="bg-bg-surface p-6 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg">Who to Follow</h3>
        <button className="text-primary text-xs font-bold hover:underline">
          See All
        </button>
      </div>

      <div className="space-y-4">
        {users.slice(0, 5).map((user) => (
          <div
            key={user._id}
            className="flex items-center justify-between group"
          >
            <div
              onClick={() => navigate(`/profile/${user._id}`)}
              className="flex items-center gap-3 cursor-pointer group/user"
            >
              <img
                src={user.avatar}
                className="w-10 h-10 rounded-full object-cover transition-transform group-hover/user:scale-105"
                alt={user.username}
              />
              <div className="max-w-[120px]">
                <h4 className="font-bold text-sm truncate group-hover/user:underline decoration-primary">
                  {user.username}
                </h4>
                <p className="text-[10px] text-text-secondary truncate">
                  Suggested for you
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleFollow(user._id)}
              className={`p-2 rounded-xl transition-all shadow-md active:scale-95
                ${
                  following[user._id]
                    ? "bg-bg-primary text-primary"
                    : "bg-primary text-on-primary hover:opacity-90 shadow-primary/20"
                }
              `}
            >
              {following[user._id] ? (
                <UserCheck size={18} />
              ) : (
                <UserPlus size={18} />
              )}
            </button>
          </div>
        ))}

        {users.length === 0 && (
          <p className="text-center text-xs text-text-secondary py-4">
            No suggestions yet
          </p>
        )}
      </div>
    </div>
  );
};

export default Suggestions;
