import React, { useState, useEffect, useRef } from "react";
import {
  Image,
  Video,
  MapPin,
  Send,
  Plus,
  BarChart2,
  Check,
  X,
  Palette,
  Type,
  Youtube,
  Loader2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import API from "../utils/api";
import { imageUpload } from "../utils/imageUpload";
import { POST_BACKGROUNDS, TEXT_COLORS, FONT_SIZES } from "../utils/postTheme";
import LocationAutocomplete from "./LocationAutocomplete";

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]); // { file, preview }
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("text"); // 'text', 'poll'
  const [isHD, setIsHD] = useState(false);
  const [postType, setPostType] = useState("feed"); // 'feed', 'story', 'both'

  // Styles
  const [viewStyleOptions, setViewStyleOptions] = useState(false);
  const [selectedBgId, setSelectedBgId] = useState("default");
  const [textColor, setTextColor] = useState("default");
  const [fontSize, setFontSize] = useState(16);

  // Polls
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // Location
  const [locationName, setLocationName] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // YouTube
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState("");

  // Mentions
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = React.useRef(null);

  const activeBg =
    POST_BACKGROUNDS.find((b) => b.id === selectedBgId) || POST_BACKGROUNDS[0];
  const isDefaultBg = selectedBgId === "default";

  // Mention Search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (mentionQuery) {
        try {
          const res = await API.get(`/search?username=${mentionQuery}`);
          setMentionUsers(res.data.users || []);
          setShowMentionPopup(true);
        } catch (err) {
          console.error(err);
        }
      } else {
        setShowMentionPopup(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [mentionQuery]);

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setCursorPos(e.target.selectionStart);

    const textBeforeCursor = val.slice(0, e.target.selectionStart);
    const lastWord = textBeforeCursor.split(/\s/).pop();
    if (lastWord.startsWith("@") && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1));
    } else {
      setMentionQuery("");
      setShowMentionPopup(false);
    }
  };

  const insertMention = (username) => {
    const beforeCursor = content.slice(0, cursorPos);
    const afterCursor = content.slice(cursorPos);
    const lastWordStart = beforeCursor.lastIndexOf("@");

    const newContent =
      beforeCursor.slice(0, lastWordStart) + `@${username} ` + afterCursor;
    setContent(newContent);
    setMentionQuery("");
    setShowMentionPopup(false);

    if (textareaRef.current) textareaRef.current.focus();
  };

  const getGPS = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationCoords([longitude, latitude]);
        try {
          const res = await fetch(
            `https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`,
          );
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const p = data.features[0].properties;
            const parts = [
              p.name,
              p.city || p.town || p.village,
              p.state,
              p.country,
            ].filter(Boolean);
            setLocationName(parts.join(", "));
          } else {
            setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          }
        } catch (err) {
          setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        alert("Could not get location.");
        setIsLocating(false);
      },
    );
  };

  const handleAddYoutubeLink = () => {
    if (!youtubeLink.trim()) {
      setShowYoutubeInput(false);
      return;
    }
    if (
      !youtubeLink.includes("youtube.com") &&
      !youtubeLink.includes("youtu.be")
    ) {
      return alert("Please enter a valid YouTube URL.");
    }
    const newContent = content ? `${content}\n\n${youtubeLink}` : youtubeLink;
    setContent(newContent);
    setYoutubeLink("");
    setShowYoutubeInput(false);
  };

  // Auto-switch style defaults
  useEffect(() => {
    if (selectedBgId !== "default") {
      setTextColor("#FFFFFF");
      setFontSize(30);
    } else {
      setTextColor("default");
      setFontSize(16);
    }
  }, [selectedBgId]);

  const handleImageChange = (e) => {
    if (activeTab === "poll" || !isDefaultBg) return;

    const files = [...e.target.files];
    files.forEach((file) => {
      if (!file) return;
      if (file.size > 1024 * 1024 * 10)
        return alert("Size is too large (max 10MB).");

      const reader = new FileReader();
      const isVideo = file.type.startsWith("video");
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImages((prev) => [
          ...prev,
          { file, preview: reader.result, isVideo },
        ]);
      };
    });
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    if (pollOptions.length < 5) setPollOptions([...pollOptions, ""]);
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      activeTab === "text" &&
      !content.trim() &&
      images.length === 0 &&
      isDefaultBg
    )
      return;
    if (
      activeTab === "poll" &&
      (!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2)
    )
      return;

    try {
      setLoading(true);

      let media = [];
      if (images.length > 0) {
        media = await imageUpload(images.map((img) => img.file));
      }

      const postData = {
        content: activeTab === "poll" ? "" : content,
        images: media,
        background: !isDefaultBg ? selectedBgId : undefined,
        address: locationName,
        location: locationCoords
          ? { type: "Point", coordinates: locationCoords }
          : undefined,
        textStyle: {
          fontSize,
          color: textColor === "default" && isDefaultBg ? undefined : textColor,
          fontWeight: "bold",
        },
        isHD,
        postType,
      };

      if (activeTab === "poll") {
        postData.poll_question = pollQuestion;
        postData.poll_options = pollOptions
          .filter((o) => o.trim())
          .map((text) => ({ text }));
      }

      const res = await API.post("/posts", postData);

      onPostCreated(res.data.newPost);

      // Reset
      setContent("");
      setImages([]);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setSelectedBgId("default");
      setTextColor("default");
      setLocationName("");
      setLocationCoords(null);
      setShowLocationInput(false);
      setActiveTab("text");
      setPostType("feed");
      setViewStyleOptions(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const bgStyle = isDefaultBg
    ? {}
    : {
        background: `linear-gradient(45deg, ${activeBg.colors[0]}, ${activeBg.colors[1]})`,
      };

  return (
    <div className="bg-bg-surface p-6 rounded-3xl shadow-sm space-y-4 relative transition-all duration-300">
      {/* Input Area */}
      <div
        className={`flex gap-4 p-4 rounded-2xl transition-all duration-500 relative ${!isDefaultBg ? "min-h-[200px] items-center justify-center text-center" : ""}`}
        style={bgStyle}
      >
        {isDefaultBg && (
          <img
            src={user?.avatar}
            className="w-12 h-12 rounded-full object-cover shadow-md self-start"
            alt="avatar"
          />
        )}

        <div className="w-full relative">
          {activeTab === "text" ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder={
                !isDefaultBg
                  ? "Type something..."
                  : `What's on your mind, ${user?.username || "user"}?`
              }
              className={`w-full bg-transparent border-none outline-none resize-none placeholder:text-text-secondary/60
                ${
                  !isDefaultBg
                    ? "text-center text-white font-bold drop-shadow-md placeholder:text-white/60"
                    : "text-text-primary"
                }
              `}
              style={{
                fontSize: `${fontSize}px`,
                color:
                  !isDefaultBg || textColor !== "default"
                    ? textColor
                    : undefined,
                height: !isDefaultBg ? "auto" : "120px",
              }}
            />
          ) : (
            <div className="w-full space-y-3 text-left">
              <input
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-transparent text-xl font-bold border-none outline-none placeholder:text-text-secondary"
              />
              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={(e) =>
                        handlePollOptionChange(idx, e.target.value)
                      }
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 bg-bg-primary/50 text-sm px-4 py-2 rounded-xl outline-none border border-transparent focus:border-primary/30 transition-all"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => removePollOption(idx)}
                        className="text-text-secondary hover:text-error"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <button
                    onClick={addPollOption}
                    className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Add Option
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mentions Popup */}
          {showMentionPopup && mentionUsers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 bg-bg-surface shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-2xl z-50 border border-bg-primary max-h-48 overflow-y-auto w-64 text-left animate-in fade-in slide-in-from-bottom-2">
              {mentionUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => insertMention(u.username)}
                  className="flex items-center gap-3 p-3 w-full hover:bg-bg-primary transition-all border-b border-bg-primary last:border-0"
                >
                  <img
                    src={u.avatar}
                    className="w-8 h-8 rounded-full object-cover"
                    alt={u.username}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">
                      @{u.username}
                    </div>
                    <div className="text-[10px] text-text-secondary truncate">
                      {u.fullname}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post Type Selector */}
      <div className="flex flex-col gap-3 py-2 border-t border-bg-primary/30 mt-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
          Post Distribution
        </label>
        <div className="flex gap-2">
          {["feed", "story", "both"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPostType(type)}
              className={`flex-1 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                ${
                  postType === type
                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105"
                    : "bg-bg-primary/50 text-text-secondary hover:bg-bg-primary"
                }
              `}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Media Previews */}
      {images.length > 0 && activeTab === "text" && isDefaultBg && (
        <div className="flex flex-wrap gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative w-24 h-24 group">
              {img.isVideo ? (
                <video
                  src={img.preview}
                  className="w-full h-full object-cover rounded-2xl shadow-sm"
                />
              ) : (
                <img
                  src={img.preview}
                  className="w-full h-full object-cover rounded-2xl shadow-sm"
                  alt="preview"
                />
              )}
              <button
                onClick={() => setImages(images.filter((_, i) => i !== index))}
                className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1.5 shadow-lg scale-0 group-hover:scale-100 transition-transform"
              >
                <X size={12} />
              </button>
              {img.isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white rounded-2xl pointer-events-none">
                  <Video size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Style Controls */}
      {viewStyleOptions && activeTab === "text" && (
        <div className="p-4 bg-bg-primary/30 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 border border-bg-primary">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3 block">
              Background Style
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {POST_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    setSelectedBgId(bg.id);
                    setImages([]);
                  }}
                  className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 flex-shrink-0
                     ${selectedBgId === bg.id ? "border-primary scale-110 shadow-md ring-2 ring-primary/20" : "border-transparent"}
                   `}
                  style={{
                    background:
                      bg.id === "default"
                        ? "#f0f2f5"
                        : `linear-gradient(45deg, ${bg.colors[0]}, ${bg.colors[1]})`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-8 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3 block">
                Text Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {TEXT_COLORS.slice(0, 8).map((c) => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    className={`w-6 h-6 rounded-full border transition-all hover:scale-110
                          ${textColor === c ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-sm" : "border-gray-300"}
                        `}
                    style={{ backgroundColor: c === "default" ? "#000" : c }}
                  >
                    {c === "default" && (
                      <span className="text-[8px] text-white flex items-center justify-center h-full">
                        Aa
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-bg-primary/50 rounded-xl p-1 flex items-center gap-1 border border-bg-primary">
              <button
                onClick={() => setFontSize(Math.max(16, fontSize - 4))}
                className="p-1.5 hover:bg-bg-surface rounded-lg transition-colors"
                title="Decrease font size"
              >
                <Type size={14} />
              </button>
              <span className="text-xs font-mono font-bold w-8 text-center">
                {fontSize}
              </span>
              <button
                onClick={() => setFontSize(Math.min(48, fontSize + 4))}
                className="p-1.5 hover:bg-bg-surface rounded-lg transition-colors"
                title="Increase font size"
              >
                <Type size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Link Input */}
      {showYoutubeInput && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Youtube size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Embed Video
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              placeholder="Paste YouTube link here..."
              className="flex-1 bg-white dark:bg-bg-surface px-4 py-2 rounded-xl text-sm border border-red-200 dark:border-red-900/30 focus:border-red-500 outline-none transition-all"
              autoFocus
            />
            <button
              onClick={handleAddYoutubeLink}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-red-700 transition-all"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Location Input */}
      {showLocationInput && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Tagged Location
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={getGPS}
                disabled={isLocating}
                className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-bg-surface text-blue-600 border border-blue-200 dark:border-blue-900/30 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all"
              >
                {isLocating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <MapPin size={12} />
                )}
                GPS
              </button>
              <button
                onClick={() => {
                  setShowLocationInput(false);
                  setLocationName("");
                  setLocationCoords(null);
                }}
                className="text-text-secondary hover:text-error"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <LocationAutocomplete
            onLocationSelect={(name, coords) => {
              setLocationName(name);
              setLocationCoords(coords);
            }}
            initialValue={locationName}
            placeholder="Where are you?"
          />
        </div>
      )}

      {/* Toolbar & Send */}
      <div className="flex items-center justify-between pt-4 border-t border-bg-primary/50">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {/* Photos */}
          <label
            className={`p-2.5 rounded-2xl transition-all cursor-pointer group shrink-0
              ${activeTab === "poll" || !isDefaultBg ? "opacity-30 pointer-events-none grayscale" : "hover:bg-green-50 text-green-600"}
            `}
            title="Add images"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Image
              size={22}
              className="group-hover:scale-110 transition-transform"
            />
          </label>

          {/* Video */}
          <label
            className={`p-2.5 rounded-2xl transition-all cursor-pointer group shrink-0
              ${activeTab === "poll" || !isDefaultBg ? "opacity-30 pointer-events-none grayscale" : "hover:bg-pink-50 text-pink-600"}
            `}
            title="Add video"
          >
            <input
              type="file"
              multiple
              accept="video/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Video
              size={22}
              className="group-hover:scale-110 transition-transform"
            />
          </label>

          {/* Poll */}
          <button
            onClick={() => {
              setActiveTab(activeTab === "poll" ? "text" : "poll");
              setImages([]);
              setSelectedBgId("default");
            }}
            className={`p-2.5 rounded-2xl transition-all group
               ${activeTab === "poll" ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "hover:bg-orange-50 text-orange-600"}
             `}
            title="Create a poll"
          >
            <BarChart2
              size={22}
              className="group-hover:scale-110 transition-transform"
            />
          </button>

          {/* Style */}
          <button
            onClick={() => {
              setViewStyleOptions(!viewStyleOptions);
              setActiveTab("text");
            }}
            className={`p-2.5 rounded-2xl transition-all group
               ${viewStyleOptions ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "hover:bg-purple-50 text-purple-600"}
             `}
            title="Change background style"
          >
            <Palette
              size={22}
              className="group-hover:scale-110 transition-transform"
            />
          </button>

          {/* Location */}
          <button
            onClick={() => setShowLocationInput(!showLocationInput)}
            className={`p-2.5 rounded-2xl transition-all group
                ${showLocationInput || locationName ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "hover:bg-blue-50 text-blue-600"}
            `}
            title="Tag location"
          >
            <MapPin
              size={22}
              className="group-hover:scale-110 transition-transform"
            />
          </button>

          {/* YouTube */}
          <button
            onClick={() => setShowYoutubeInput(!showYoutubeInput)}
            className={`p-2.5 rounded-2xl transition-all group
                ${showYoutubeInput ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "hover:bg-red-50 text-red-600"}
            `}
            title="Embed YouTube video"
          >
            <Youtube
              size={22}
              className="group-hover:scale-110 transition-transform"
            />
          </button>
          {/* HD Toggle */}
          <button
            type="button"
            onClick={() => setIsHD(!isHD)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl transition-all font-black text-[10px] shrink-0
              ${isHD ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-bg-primary/50 text-text-secondary hover:bg-bg-primary"}
            `}
            title="Toggle HD Upload"
          >
            HD
            <div
              className={`w-2 h-2 rounded-full ${isHD ? "bg-white animate-pulse" : "bg-text-secondary/30"}`}
            />
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            loading ||
            (activeTab === "text" &&
              !content.trim() &&
              images.length === 0 &&
              isDefaultBg) ||
            (activeTab === "poll" && !pollQuestion.trim())
          }
          className="bg-primary text-white pl-5 pr-4 py-2.5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <span>Share Post</span>
              <Send
                size={14}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
