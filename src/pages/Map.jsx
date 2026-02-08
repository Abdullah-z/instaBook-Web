import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Users,
  Globe,
  Radio,
  Pin,
  Clock,
  X,
  Loader2,
  Navigation,
  User as UserIcon,
  Calendar,
  MessageCircle,
  ChevronDown,
  Search,
  Palette,
} from "lucide-react";
import { ZoomControl } from "react-leaflet";
import Sidebar from "../components/Sidebar";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import {
  shareLocationAPI,
  getSharedLocationsAPI,
  stopSharingAPI,
  createShoutoutAPI,
} from "../utils/locationAPI";
import { getEventsAPI } from "../utils/eventAPI";
import { toast } from "react-toastify";
import { format } from "timeago.js";

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

// Custom marker icons
const createCustomIcon = (type, avatar, isMe) => {
  const colors = {
    live: "#6366f1",
    static: "#00A8FF",
    post: "#FF9800",
    event: "#E4405F",
    shoutout: "#FF00CC",
    focused: "#FF0000",
  };

  const color = colors[type] || colors.live;

  const html = avatar
    ? `<div class="custom-marker ${type}" style="background: ${color};">
         <div class="marker-pin-pulse"></div>
         <img src="${avatar}" class="marker-avatar" />
       </div>`
    : `<div class="custom-marker ${type}" style="background: ${color};">
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

// Blue dot for user location
const blueDotIcon = L.divIcon({
  className: "blue-dot-container",
  html: '<div class="blue-dot-pulse"></div><div class="blue-dot"></div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Map controller component
function MapController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
}

// Click handler component
function MapClickHandler({ onMapClick, isSelectingLocation }) {
  useMapEvents({
    click: (e) => {
      if (isSelectingLocation) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

const Map = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [deviceLocation, setDeviceLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [sharedLocations, setSharedLocations] = useState([]);
  const [sharingVisibility, setSharingVisibility] = useState("off");
  const [sharingType, setSharingType] = useState("live");
  const [sharingDuration, setSharingDuration] = useState(24);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(50);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [events, setEvents] = useState([]);
  const [radiusMenuVisible, setRadiusMenuVisible] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [shoutoutModalVisible, setShoutoutModalVisible] = useState(false);
  const [shoutoutContent, setShoutoutContent] = useState("");
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);

  const queryParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const focusedLat = queryParams.get("lat")
    ? parseFloat(queryParams.get("lat"))
    : null;
  const focusedLng = queryParams.get("lng")
    ? parseFloat(queryParams.get("lng"))
    : null;

  const mapRef = useRef(null);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDeviceLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location");
          // Default to a location if geolocation fails
          setDeviceLocation({ lat: 40.7128, lng: -74.006 }); // New York
        },
      );
    }
  }, []);

  // Fetch shared locations
  const fetchLocations = useCallback(async () => {
    if (!deviceLocation) return;

    setLoading(true);
    try {
      const typeFilter =
        activeFilter === "post"
          ? "post"
          : activeFilter === "shoutout"
            ? "shoutout"
            : activeFilter === "shared"
              ? "live,static"
              : undefined;
      const audienceFilter = activeFilter === "friends" ? "friends" : undefined;

      const data = await getSharedLocationsAPI(
        deviceLocation.lat,
        deviceLocation.lng,
        radius,
        undefined,
        undefined,
        typeFilter,
        audienceFilter,
      );

      setSharedLocations(Array.isArray(data) ? data : []);

      // Fetch Events
      try {
        const eventRes = await getEventsAPI(
          deviceLocation.lat,
          deviceLocation.lng,
          radius,
        );
        setEvents(eventRes.events || []);
      } catch (e) {
        console.error("Error fetching events on map:", e);
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
      toast.error("Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  }, [deviceLocation, radius, activeFilter]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Handle sharing
  const handleShareNow = async () => {
    if (sharingVisibility === "off") {
      toast.error("Please select Friends or Public first");
      return;
    }

    setLoading(true);
    try {
      const lat =
        sharingType === "static" && selectedLocation
          ? selectedLocation.lat
          : deviceLocation?.lat;
      const lng =
        sharingType === "static" && selectedLocation
          ? selectedLocation.lng
          : deviceLocation?.lng;

      if (!lat || !lng) {
        toast.error("Location not available");
        return;
      }

      await shareLocationAPI(
        lat,
        lng,
        sharingVisibility,
        sharingType,
        sharingDuration,
      );
      toast.success(
        `Location shared with ${sharingVisibility} for ${sharingDuration}h!`,
      );
      await fetchLocations();
    } catch (err) {
      console.error("Error sharing location:", err);
      toast.error("Failed to share location");
    } finally {
      setLoading(false);
    }
  };

  const handleStopSharing = async () => {
    try {
      await stopSharingAPI();
      setSharingVisibility("off");
      toast.success("Stopped sharing location");
      await fetchLocations();
    } catch (err) {
      console.error("Error stopping sharing:", err);
      toast.error("Failed to stop sharing");
    }
  };

  const handleCreateShoutout = async () => {
    if (!shoutoutContent.trim()) {
      toast.error("Please enter some graffiti text!");
      return;
    }

    setLoading(true);
    try {
      const lat = selectedLocation?.lat || deviceLocation?.lat;
      const lng = selectedLocation?.lng || deviceLocation?.lng;

      if (!lat || !lng) {
        toast.error("Location not available");
        return;
      }

      await createShoutoutAPI(lat, lng, shoutoutContent, "public");
      toast.success("Graffiti created!");
      setShoutoutContent("");
      setShoutoutModalVisible(false);
      setSelectedLocation(null);
      await fetchLocations();
    } catch (err) {
      console.error("Error creating shoutout:", err);
      toast.error("Failed to create graffiti");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (latlng) => {
    if (isSelectingLocation) {
      setSelectedLocation(latlng);
      setIsSelectingLocation(false);
      setShoutoutModalVisible(true);
    } else {
      setSelectedLocation(latlng);
      setSharingType("static");
    }
  };

  const handleLocationSelect = (item) => {
    const [lng, lat] = item.coordinates;
    setSelectedLocation({ lat, lng });
    setShowSearch(false);
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
    }
  };

  const resetToMyLocation = () => {
    setSelectedLocation(null);
    setSharingType("live");
  };

  // Process markers
  const markers = useMemo(() => {
    const markerList = [];

    sharedLocations.forEach((loc) => {
      if (!loc || !loc.user) return;

      const userId = String(loc.user._id);
      const currentUserId = user?._id ? String(user._id) : null;
      const isMe = userId === currentUserId;

      // Skip own live location (blue dot shows it)
      if (isMe && loc.type === "live") return;

      markerList.push({
        id: loc._id,
        lat: loc.latitude,
        lng: loc.longitude,
        type: loc.type || "live",
        username: loc.user.username,
        fullname: loc.user.fullname,
        avatar: loc.user.avatar,
        isMe,
        userId,
        lastUpdate: loc.lastUpdate || loc.updatedAt,
        postData: loc.postData,
        shoutoutData: loc.content ? { content: loc.content } : undefined,
        address: loc.address,
      });
    });

    // Add Events
    events.forEach((ev) => {
      markerList.push({
        id: ev._id,
        lat: ev.location.coordinates[1],
        lng: ev.location.coordinates[0],
        type: "event",
        username: ev.title,
        fullname: ev.title,
        avatar: ev.image || "",
        isMe: false,
        lastUpdate: ev.updatedAt,
        address: ev.address,
        eventData: ev,
      });
    });

    // Add Focused Point from URL if any
    if (focusedLat && focusedLng) {
      markerList.push({
        id: "focused-point",
        lat: focusedLat,
        lng: focusedLng,
        type: "focused",
        username: "Shared Location",
        fullname: "Pinned Spot",
        avatar: null,
        isMe: false,
        lastUpdate: new Date().toISOString(),
      });
    }

    return markerList;
  }, [sharedLocations, events, user, focusedLat, focusedLng]);

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    setShowBottomSheet(true);
  };

  if (!deviceLocation) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Sidebar />
        <div className="lg:pl-64 flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary relative">
      <Sidebar />

      <main className="lg:pl-64 h-screen flex flex-col">
        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            center={[deviceLocation.lat, deviceLocation.lng]}
            zoom={13}
            zoomControl={false}
            className={`h-full w-full ${theme === "dark" ? "dark-map" : ""}`}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />

            <MapController center={selectedLocation || deviceLocation} />
            <MapClickHandler
              onMapClick={handleMapClick}
              isSelectingLocation={
                sharingType === "static" || isSelectingLocation
              }
            />

            {/* User location blue dot */}
            <Marker
              position={[deviceLocation.lat, deviceLocation.lng]}
              icon={blueDotIcon}
            />

            {/* Selected static location */}
            {selectedLocation && (
              <Marker
                position={[selectedLocation.lat, selectedLocation.lng]}
                icon={createCustomIcon("focused", null, false)}
              />
            )}

            {/* Shared location markers */}
            <MarkerClusterGroup>
              {markers.map((marker) => (
                <Marker
                  key={marker.id}
                  position={[marker.lat, marker.lng]}
                  icon={createCustomIcon(
                    marker.type,
                    marker.avatar,
                    marker.isMe,
                  )}
                  eventHandlers={{
                    click: () => handleMarkerClick(marker),
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">{marker.fullname}</p>
                      <p className="text-xs text-gray-500">
                        @{marker.username}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
          {isSelectingLocation && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-xs md:max-w-md animate-bounce">
              <div className="mx-4 bg-primary text-on-primary px-6 py-4 rounded-3xl shadow-2xl flex items-center justify-between border-2 border-on-primary/20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <MapPin className="animate-pulse" size={24} />
                  </div>
                  <span className="font-bold text-lg">Select spot on map</span>
                </div>
                <button
                  onClick={() => {
                    setIsSelectingLocation(false);
                    setShoutoutModalVisible(true);
                  }}
                  className="bg-black/20 hover:bg-black/40 p-2 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Top Navbar / Search Area */}
          <div className="absolute top-4 left-4 right-4 flex gap-3 z-[1000]">
            <div
              onClick={() => setShowSearch(true)}
              className="flex-1 bg-bg-surface border-2 border-primary/10 rounded-2xl shadow-2xl flex items-center px-4 py-1 cursor-pointer hover:bg-bg-primary transition-colors"
            >
              <Search size={20} className="text-text-secondary mr-3" />
              <input
                type="text"
                readOnly
                placeholder="Search locations..."
                className="flex-1 bg-transparent py-3 outline-none font-semibold text-text-primary cursor-pointer"
              />
            </div>

            <button
              onClick={() => setShoutoutModalVisible(true)}
              className="bg-pink-500 text-white p-4 rounded-2xl shadow-2xl hover:bg-pink-600 transition-all flex items-center justify-center"
              title="Add Graffiti"
            >
              <Palette size={24} />
            </button>
          </div>

          {/* Filter Chips - Positioned below search */}
          <div className="absolute top-24 left-4 right-4 flex gap-2 overflow-x-auto pb-2 z-[1000] no-scrollbar">
            {[
              { value: "all", label: "All", icon: Globe },
              { value: "friends", label: "Friends", icon: Users },
              { value: "shared", label: "Shared", icon: Radio },
              { value: "post", label: "Posts", icon: MapPin },
              { value: "shoutout", label: "Graffiti", icon: MessageCircle },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                  activeFilter === filter.value
                    ? filter.value === "shoutout"
                      ? "bg-pink-500/20 text-pink-500 border-2 border-pink-500"
                      : "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-bg-surface text-text-secondary border-2 border-transparent hover:bg-bg-surface/80"
                }`}
              >
                <filter.icon size={16} />
                {filter.label}
              </button>
            ))}
          </div>

          {/* Radius Selector */}
          <div className="absolute top-40 right-4 z-[1000]">
            <button
              onClick={() => setRadiusMenuVisible(!radiusMenuVisible)}
              className="bg-bg-surface border-2 border-primary/20 text-text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-bg-surface/80 transition-all"
            >
              <Navigation size={18} className="text-primary" />
              {radius >= 10000 ? "All" : `${radius} km`}
              <ChevronDown size={14} />
            </button>

            {radiusMenuVisible && (
              <div className="absolute top-full mt-2 right-0 bg-bg-surface border border-bg-surface rounded-xl shadow-2xl p-2 min-w-[120px] animate-in slide-in-from-top-2 duration-200">
                {[5, 20, 50, 100, 500, 20000].map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRadius(r);
                      setRadiusMenuVisible(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      radius === r
                        ? "bg-primary text-on-primary"
                        : "hover:bg-bg-primary text-text-secondary"
                    }`}
                  >
                    {r >= 10000 ? "All" : `${r} km`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset to My Location Button */}
          {selectedLocation && (
            <button
              onClick={resetToMyLocation}
              className="absolute bottom-32 right-4 bg-primary text-on-primary p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors z-[1000]"
            >
              <Navigation size={24} />
            </button>
          )}
        </div>

        {/* Sharing Panel */}
        <div className="bg-bg-surface border-t border-bg-surface p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Share Your Location</h3>
            {loading && (
              <Loader2 className="animate-spin text-primary" size={20} />
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="text-sm font-semibold text-text-secondary mb-2 block">
              Visibility
            </label>
            <div className="flex gap-2">
              {[
                { value: "off", label: "Off", icon: X },
                { value: "friends", label: "Friends", icon: Users },
                { value: "public", label: "Public", icon: Globe },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSharingVisibility(option.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all ${
                    sharingVisibility === option.value
                      ? "bg-primary text-on-primary"
                      : "bg-bg-primary text-text-secondary hover:bg-bg-primary/80"
                  }`}
                >
                  <option.icon size={16} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type & Duration */}
          {sharingVisibility !== "off" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-text-secondary mb-2 block">
                  Type
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "live", label: "Live", icon: Radio },
                    { value: "static", label: "Static", icon: Pin },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSharingType(option.value)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-semibold text-sm transition-all ${
                        sharingType === option.value
                          ? "bg-primary text-on-primary"
                          : "bg-bg-primary text-text-secondary hover:bg-bg-primary/80"
                      }`}
                    >
                      <option.icon size={14} />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-text-secondary mb-2 block">
                  Duration
                </label>
                <select
                  value={sharingDuration}
                  onChange={(e) => setSharingDuration(Number(e.target.value))}
                  className="w-full bg-bg-primary text-text-primary rounded-xl py-2 px-3 font-semibold text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value={1}>1 hour</option>
                  <option value={3}>3 hours</option>
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                </select>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {sharingVisibility !== "off" && (
            <div className="flex gap-2">
              <button
                onClick={handleShareNow}
                disabled={loading}
                className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Share Now
              </button>
              <button
                onClick={handleStopSharing}
                className="px-6 bg-error/10 text-error py-3 rounded-xl font-bold hover:bg-error/20 transition-colors"
              >
                Stop
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Sheet */}
      {showBottomSheet && selectedMarker && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-end lg:items-center lg:justify-center"
          onClick={() => setShowBottomSheet(false)}
        >
          <div
            className="bg-bg-surface rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md p-6 space-y-4 animate-in slide-in-from-bottom lg:slide-in-from-bottom-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedMarker.avatar || "https://via.placeholder.com/50"
                  }
                  alt={selectedMarker.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-lg">
                    {selectedMarker.fullname}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    @{selectedMarker.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBottomSheet(false)}
                className="p-2 hover:bg-bg-primary rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {selectedMarker.type === "shoutout" &&
              selectedMarker.shoutoutData && (
                <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-4 rounded-2xl border border-pink-500/20">
                  <p className="text-lg font-bold text-pink-500">
                    🌈 {selectedMarker.shoutoutData.content}
                  </p>
                </div>
              )}

            {selectedMarker.type === "event" && selectedMarker.eventData && (
              <div className="space-y-4">
                {selectedMarker.eventData.image && (
                  <img
                    src={selectedMarker.eventData.image}
                    alt="Event"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                )}
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="font-bold text-primary flex items-center gap-2">
                    <Calendar size={18} />
                    {selectedMarker.eventData.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {selectedMarker.eventData.description}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate(`/event/${selectedMarker.eventData._id}`)
                  }
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  View Event Details
                </button>
              </div>
            )}

            {selectedMarker.postData && (
              <div className="space-y-2">
                {selectedMarker.postData.image && (
                  <img
                    src={selectedMarker.postData.image}
                    alt="Post"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                )}
                <button
                  onClick={() =>
                    navigate(`/post/${selectedMarker.postData.id}`)
                  }
                  className="w-full bg-primary text-on-primary py-2 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  View Post
                </button>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock size={16} />
                <span>{format(selectedMarker.lastUpdate)}</span>
              </div>
              {selectedMarker.address && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <MapPin size={16} />
                  <span>{selectedMarker.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-text-secondary">
                <Radio size={16} />
                <span className="capitalize">
                  {selectedMarker.type} Location
                </span>
              </div>
            </div>

            {!selectedMarker.isMe && (
              <button
                onClick={() => navigate(`/profile/${selectedMarker.userId}`)}
                className="w-full bg-bg-primary text-text-primary py-2 rounded-xl font-semibold hover:bg-bg-primary/80 transition-colors flex items-center justify-center gap-2"
              >
                <UserIcon size={16} />
                View Profile
              </button>
            )}
          </div>
        </div>
      )}
      {showSearch && (
        <LocationAutocomplete
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Graffiti Modal */}
      {shoutoutModalVisible && (
        <div className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center p-4">
          <div className="bg-bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-pink-500/20">
            <div className="p-6 border-b border-bg-surface flex justify-between items-center bg-gradient-to-r from-pink-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <Palette className="text-pink-500" size={24} />
                <h3 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Add Graffiti
                </h3>
              </div>
              <button
                onClick={() => setShoutoutModalVisible(false)}
                className="hover:bg-bg-primary p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Your Message
                </label>
                <textarea
                  value={shoutoutContent}
                  onChange={(e) => setShoutoutContent(e.target.value)}
                  placeholder="What's on your mind? 🌈"
                  rows={4}
                  className="w-full bg-bg-primary rounded-2xl p-4 outline-none focus:ring-2 focus:ring-pink-500/50 transition-all font-semibold resize-none text-lg"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShoutoutModalVisible(false);
                    setIsSelectingLocation(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold bg-pink-500/10 text-pink-600 border border-pink-500/20 hover:bg-pink-500/20 transition-all"
                >
                  <MapPin size={20} />
                  {selectedLocation
                    ? "Change Location"
                    : "Tap on Map to Select Location"}
                </button>

                {selectedLocation && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/5 rounded-xl border border-green-500/10 text-xs text-green-600 font-semibold justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    <span>Location selected on map</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-pink-500/5 rounded-xl border border-pink-500/10 text-xs text-pink-600 font-semibold">
                <Pin size={14} />
                <span>
                  {" "}
                  This will be pinned to your current or selected location.
                </span>
              </div>

              <button
                onClick={handleCreateShoutout}
                disabled={loading || !shoutoutContent.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-pink-500/20 transition-all disabled:opacity-50"
              >
                {loading ? "Creating..." : "Drop Graffiti 🎨"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
