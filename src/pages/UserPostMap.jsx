import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  MessageCircle,
  Heart,
  Loader2,
  X,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "timeago.js";
import Sidebar from "../components/Sidebar";
import ImageView from "../components/ImageView";
import { getSharedLocationsAPI } from "../utils/locationAPI";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-toastify";

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createCustomIcon = (type, avatar) => {
  const color = "#FF9800"; // Post color matches mobile

  const html = avatar
    ? `<div class="custom-marker post" style="background: ${color};">
         <div class="marker-pin-pulse"></div>
         <img src="${avatar}" class="marker-avatar" />
       </div>`
    : `<div class="custom-marker post" style="background: ${color};">
         <div class="marker-pin-pulse"></div>
         <div class="marker-dot"></div>
       </div>`;

  return L.divIcon({
    className: "custom-marker-container",
    html,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  });
};

function MapController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

const UserPostMap = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);

  const fetchLocations = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      // Radius 20000 = All for historical view
      const data = await getSharedLocationsAPI(
        0,
        0,
        20000,
        targetUserId,
        timePeriod,
        "post",
      );
      if (Array.isArray(data)) {
        setPosts(data);
        if (data.length > 0) {
          const bounds = data.map((loc) => [loc.latitude, loc.longitude]);
          setMapBounds(bounds);
        }
      }
    } catch (err) {
      console.error("Error fetching user posts on map:", err);
      toast.error("Failed to load post locations");
    } finally {
      setLoading(false);
    }
  }, [targetUserId, timePeriod]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleMarkerClick = (post) => {
    setSelectedPost(post);
  };

  const getVideoThumbnail = (url) => {
    if (!url) return null;
    if (url.includes("cloudinary.com")) {
      return url.replace(/\.[^/.]+$/, ".jpg");
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden flex">
      <Sidebar />

      <main className="flex-1 h-screen flex flex-col relative">
        {/* Top Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center gap-3 z-[1000]">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-bg-surface border-2 border-primary/10 rounded-2xl shadow-2xl hover:bg-bg-primary transition-all text-text-primary"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="flex-1 flex justify-center">
            <div className="bg-black/80 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-2xl border border-white/10">
              {["day", "month", "year", "all"].map((p) => (
                <button
                  key={p}
                  onClick={() => setTimePeriod(p)}
                  className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                    timePeriod === p
                      ? "bg-primary text-on-primary shadow-lg"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[0, 0]}
            zoom={2}
            zoomControl={false}
            className={`h-full w-full ${theme === "dark" ? "dark-map" : ""}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />
            <MapController bounds={mapBounds} />

            <MarkerClusterGroup>
              {posts.map((post) => (
                <Marker
                  key={post._id}
                  position={[post.latitude, post.longitude]}
                  icon={createCustomIcon("post", post.user?.avatar)}
                  eventHandlers={{
                    click: () => handleMarkerClick(post),
                  }}
                />
              ))}
            </MarkerClusterGroup>
          </MapContainer>

          {loading && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1001] bg-bg-surface/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-primary/20">
              <Loader2 className="animate-spin text-primary" size={20} />
              <span className="font-bold text-sm">Loading post history...</span>
            </div>
          )}
        </div>

        {/* Post Detail Drawer (Bottom Sheet style for Web) */}
        <AnimatePresence>
          {selectedPost && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 z-[1001] bg-bg-surface border-t border-bg-primary/20 shadow-[-10px_0_30px_rgba(0,0,0,0.2)] lg:left-64"
            >
              <div className="max-w-xl mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        selectedPost.user?.avatar ||
                        "https://via.placeholder.com/50"
                      }
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                      alt=""
                    />
                    <div>
                      <h3 className="font-black text-lg">
                        {selectedPost.user?.username}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-text-secondary font-bold">
                        <Clock size={12} />
                        {selectedPost.postData?.lastUpdate
                          ? format(selectedPost.postData.lastUpdate)
                          : "Historical Post"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-2 hover:bg-bg-primary rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedPost.postData?.image && (
                    <div className="relative rounded-3xl overflow-hidden aspect-video bg-black group">
                      {selectedPost.postData.resource_type === "video" ||
                      selectedPost.postData.image.endsWith(".mp4") ? (
                        <>
                          <img
                            src={getVideoThumbnail(selectedPost.postData.image)}
                            className="w-full h-full object-cover opacity-60"
                            alt=""
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play size={48} className="text-white fill-white" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={selectedPost.postData.image}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                          alt=""
                          onClick={() =>
                            setViewingImage(selectedPost.postData.image)
                          }
                        />
                      )}
                    </div>
                  )}

                  {selectedPost.address && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary font-bold">
                      <MapPin size={16} className="text-primary" />
                      {selectedPost.address}
                    </div>
                  )}

                  <p className="text-text-primary leading-relaxed font-medium">
                    {selectedPost.postData?.content}
                  </p>

                  <div className="flex gap-6 py-4 border-t border-bg-primary/10">
                    <div className="flex items-center gap-2 text-sm font-black text-text-secondary">
                      <Heart size={18} /> {selectedPost.postData?.likes || 0}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-black text-text-secondary">
                      <MessageCircle size={18} />{" "}
                      {selectedPost.postData?.comments || 0}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/post/${selectedPost.postData.id}`)
                    }
                    className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    View Full Post
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ImageView
          isOpen={!!viewingImage}
          imageUrl={viewingImage}
          onClose={() => setViewingImage(null)}
        />
      </main>
    </div>
  );
};

export default UserPostMap;
