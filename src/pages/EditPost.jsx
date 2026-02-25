import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Image,
  X,
  Palette,
  Check,
  Video,
  MapPin,
  Youtube,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import API from "../utils/api";
import { imageUpload } from "../utils/imageUpload";
import { POST_BACKGROUNDS, TEXT_COLORS, FONT_SIZES } from "../utils/postTheme";
import { useAuth } from "../hooks/useAuth";
import LocationAutocomplete from "../components/LocationAutocomplete";

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [images, setImages] = useState([]); // Array of strings (urls) or objects {file, preview}
  const [removedImages, setRemovedImages] = useState([]); // Track removed existing images

  const [youtubeLink, setYoutubeLink] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [createdAt, setCreatedAt] = useState("");

  // Styles
  const [selectedBgId, setSelectedBgId] = useState("default");
  const [textColor, setTextColor] = useState("default");
  const [fontSize, setFontSize] = useState(16);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isHD, setIsHD] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Mentions
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef(null);

  // Load Post Data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await API.get(`/post/${id}`);
        const post = res.data.post;

        if (post.user._id !== user?._id) {
          alert("You are not authorized to edit this post.");
          navigate("/");
          return;
        }

        setContent(post.content);
        setImages(post.images || []);
        setSelectedBgId(post.background || "default");
        if (post.textStyle) {
          setTextColor(post.textStyle.color || "default");
          setFontSize(post.textStyle.fontSize || 16);
        }
        if (post.location) {
          setLocationName(post.address || post.location.name || "");
          if (post.location.coordinates) {
            setLocationCoords(post.location.coordinates);
          }
        }
        setIsHD(post.isHD || false);
        setCreatedAt(
          post.createdAt
            ? new Date(post.createdAt).toISOString().slice(0, 16)
            : "",
        );
        // Extract youtube link from content if simple append?
        // Logic might be complex if embedded in text. Let's leave it in content for now or see if we can extract.
        // If the user appended it manually, it is part of content.
      } catch (err) {
        console.error(err);
        alert("Failed to load post");
        navigate("/");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate, user]);

  // Mention Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (mentionQuery) {
        try {
          const res = await API.get(`/search?username=${mentionQuery}`);
          setMentionUsers(res.data.users);
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

    const lastWord = val.slice(0, e.target.selectionStart).split(/\s/).pop();
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

  const handleImageChange = (e) => {
    if (selectedBgId !== "default") return;

    const files = [...e.target.files];
    if (images.length + files.length > 8) {
      return alert("You can only upload up to 8 images.");
    }

    files.forEach((file) => {
      if (!file) return;
      const reader = new FileReader();
      const isVideo = file.type.startsWith("video");
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImages((prev) => [
          ...prev,
          { file, preview: reader.result, isVideo, isNew: true },
        ]);
      };
    });
  };

  const removeImage = (index) => {
    const imageToRemove = images[index];
    if (!imageToRemove.isNew) {
      setRemovedImages((prev) => [...prev, imageToRemove]);
    }
    setImages(images.filter((_, i) => i !== index));
  };

  const moveImage = (index, direction) => {
    const newImages = [...images];
    const targetIndex = direction === "left" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    setImages(newImages);
  };

  const getLocation = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let media = images.filter((img) => !img.isNew); // Keep existing
      const newFiles = images.filter((img) => img.isNew).map((img) => img.file);

      if (newFiles.length > 0) {
        const uploaded = await imageUpload(newFiles);
        media = [...media, ...uploaded];
      }

      let finalContent = content;
      if (youtubeLink) {
        finalContent += `\n${youtubeLink}`;
      }

      const updateData = {
        content: finalContent,
        images: media,
        background: selectedBgId !== "default" ? selectedBgId : undefined,
        textStyle: {
          fontSize,
          color: textColor === "default" ? undefined : textColor,
          fontWeight: "bold",
        },
        address: locationName,
        location: locationCoords
          ? { type: "Point", coordinates: locationCoords }
          : undefined,
        isHD,
        createdAt,
      };

      await API.patch(`/post/${id}`, updateData);
      navigate(`/post/${id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update post");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  const activeBg =
    POST_BACKGROUNDS.find((b) => b.id === selectedBgId) || POST_BACKGROUNDS[0];
  const isDefaultBg = selectedBgId === "default";
  const bgStyle = isDefaultBg
    ? {}
    : {
        background: `linear-gradient(45deg, ${activeBg.colors[0]}, ${activeBg.colors[1]})`,
      };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-4 lg:p-8 flex justify-center">
      <div className="w-full max-w-2xl bg-bg-surface rounded-3xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-bg-primary/50 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-bg-primary rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Edit Post</h1>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-primary font-bold hover:underline disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preview / Editor */}
          <div
            className={`w-full min-h-[300px] rounded-3xl flex flex-col items-center justify-center p-8 transition-all relative overflow-hidden
               ${!isDefaultBg ? "shadow-inner" : "bg-bg-primary/30"}
             `}
            style={bgStyle}
          >
            <div className="w-full relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder="What's on your mind?"
                className={`w-full bg-transparent border-none outline-none resize-none text-center
                    ${!isDefaultBg ? "text-white font-black drop-shadow-md placeholder:text-white/60" : "text-text-primary"}
                    `}
                style={{
                  fontSize: `${fontSize}px`,
                  color:
                    !isDefaultBg || textColor !== "default"
                      ? textColor
                      : undefined,
                  minHeight: "150px",
                }}
              />
              {/* Mention Popup */}
              {showMentionPopup && mentionUsers.length > 0 && (
                <div className="absolute top-full left-0 bg-bg-surface shadow-xl rounded-xl z-50 border border-bg-primary max-h-48 overflow-y-auto w-64 text-left">
                  {mentionUsers.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => insertMention(user.username)}
                      className="flex items-center gap-2 p-2 w-full hover:bg-bg-primary transition-colors text-left"
                    >
                      <img
                        src={user.avatar}
                        className="w-8 h-8 rounded-full"
                        alt={user.username}
                      />
                      <div>
                        <div className="font-bold text-sm">{user.username}</div>
                        <div className="text-xs text-text-secondary">
                          {user.fullname}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Media Grid */}
            {isDefaultBg && images.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-6 justify-center">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-32 h-32 group">
                    {img.isNew ? (
                      img.isVideo ? (
                        <video
                          src={img.preview}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <img
                          src={img.preview}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      )
                    ) : img.url.endsWith(".mp4") ||
                      img.resource_type === "video" ? (
                      <video
                        src={img.url}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <img
                        src={img.url}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    )}
                    <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {idx > 0 && (
                        <button
                          onClick={() => moveImage(idx, "left")}
                          className="bg-primary text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                          title="Move Left"
                        >
                          <ChevronLeft size={14} />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          onClick={() => moveImage(idx, "right")}
                          className="bg-primary text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                          title="Move Right"
                        >
                          <ChevronRight size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(idx)}
                        className="bg-error text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata Inputs */}
          <div className="flex gap-4">
            <div className="flex-[2] flex flex-col gap-2 bg-bg-primary/30 p-4 rounded-3xl border border-bg-primary">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-orange-500">
                  <MapPin size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Location
                  </span>
                </div>
                <button
                  onClick={getLocation}
                  disabled={isLocating}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-bg-surface text-primary border border-bg-primary rounded-lg text-xs font-bold hover:bg-bg-primary transition-all"
                >
                  {isLocating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <MapPin size={12} />
                  )}
                  GPS
                </button>
              </div>
              <div
                onClick={() => setShowLocationPicker(true)}
                className="w-full bg-white dark:bg-bg-surface px-4 py-2 rounded-xl text-sm border border-bg-primary cursor-pointer hover:border-primary transition-all flex items-center justify-between"
              >
                <span
                  className={
                    locationName
                      ? "text-text-primary"
                      : "text-text-secondary/50"
                  }
                >
                  {locationName || "Where was this?"}
                </span>
                <MapPin size={14} className="text-text-secondary" />
              </div>

              {showLocationPicker && (
                <LocationAutocomplete
                  onLocationSelect={(loc) => {
                    setLocationName(loc.description);
                    setLocationCoords(loc.coordinates);
                    setShowLocationPicker(false);
                  }}
                  onClose={() => setShowLocationPicker(false)}
                  initialValue={locationName}
                />
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2 bg-bg-primary/30 p-4 rounded-3xl border border-bg-primary">
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <Youtube size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Video Link
                </span>
              </div>
              <input
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="YouTube URL..."
                className="w-full bg-white dark:bg-bg-surface px-4 py-2 rounded-xl text-sm border border-bg-primary focus:border-red-500 outline-none transition-all placeholder:text-text-secondary/50"
              />
            </div>
            <div className="flex-1 flex flex-col gap-2 bg-bg-primary/30 p-4 rounded-3xl border border-bg-primary">
              <div className="flex items-center gap-2 text-purple-500 mb-1">
                <Palette size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Post Date
                </span>
              </div>
              <input
                type="datetime-local"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                className="w-full bg-white dark:bg-bg-surface px-4 py-2 rounded-xl text-sm border border-bg-primary focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Backgrounds */}
            {images.length === 0 && (
              <div>
                <label className="text-sm font-bold text-text-secondary mb-3 block">
                  Background Style
                </label>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                  {POST_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setSelectedBgId(bg.id)}
                      className={`w-12 h-12 rounded-full border-4 transition-all flex-shrink-0
                                ${selectedBgId === bg.id ? "border-primary scale-110 shadow-lg" : "border-transparent border-gray-100"}
                            `}
                      style={{
                        background:
                          bg.id === "default"
                            ? "#fff"
                            : `linear-gradient(45deg, ${bg.colors[0]}, ${bg.colors[1]})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Text Style */}
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1">
                <label className="text-sm font-bold text-text-secondary mb-3 block">
                  Text Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTextColor(c)}
                      className={`w-8 h-8 rounded-full border transition-transform hover:scale-110
                                    ${textColor === c ? "ring-2 ring-primary ring-offset-2" : "border-gray-200"}
                                  `}
                      style={{ backgroundColor: c === "default" ? "#000" : c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <label className="text-sm font-bold text-text-secondary mb-3 block">
                  Font Size
                </label>
                <div className="flex gap-2">
                  {FONT_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all font-bold
                        ${
                          fontSize === size
                            ? "bg-primary text-white shadow-md"
                            : "bg-bg-primary/50 text-text-secondary hover:bg-bg-primary"
                        }`}
                      title={`${size}px`}
                    >
                      <span style={{ fontSize: `${10 + (size - 16) * 0.3}px` }}>
                        A
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Add Media (Only if default bg) */}
            {isDefaultBg && (
              <div className="pt-4 border-t border-bg-primary/50 flex flex-wrap gap-2">
                <label className="flex items-center gap-2 text-green-600 font-bold cursor-pointer hover:bg-green-50 px-4 py-2 rounded-xl transition-colors shrink-0">
                  <Image size={24} />
                  <span>Add Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center gap-2 text-pink-600 font-bold cursor-pointer hover:bg-pink-50 px-4 py-2 rounded-xl transition-colors shrink-0">
                  <Video size={24} />
                  <span>Add Video</span>
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {/* HD Toggle */}
                <button
                  type="button"
                  onClick={() => setIsHD(!isHD)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all shrink-0
                    ${isHD ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-bg-primary/50 text-text-secondary hover:bg-bg-primary"}
                  `}
                >
                  HD
                  <div
                    className={`w-2 h-2 rounded-full ${isHD ? "bg-white animate-pulse" : "bg-text-secondary/30"}`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPost;
