import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  Trash2,
  Edit,
  Loader2,
  ChevronLeft,
  Share2,
} from "lucide-react";
import API from "../utils/api";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await API.get(`/event/${id}`);
      setEvent(res.data.event);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load event details");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (type) => {
    setActionLoading(true);
    try {
      if (type === "interested") await API.patch(`/event/${id}/interested`);
      else await API.patch(`/event/${id}/going`);
      fetchEvent();
      toast.success("Status updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await API.delete(`/event/${id}`);
        toast.success("Event deleted successfully");
        navigate("/events");
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete event");
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-bg-primary">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!event) return null;

  const isOwner = user?._id === event.user._id;
  const isInterested = event.interested.some((u) => u._id === user?._id);
  const isGoing = event.going.some((u) => u._id === user?._id);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-20">
      {/* Header Image */}
      <div className="relative h-[300px] md:h-[400px] bg-bg-surface w-full">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary bg-bg-secondary">
            <Calendar size={64} className="opacity-20" />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <Link
            to="/events"
            className="flex items-center gap-2 bg-bg-surface/80 backdrop-blur px-4 py-2 rounded-full font-bold hover:bg-bg-surface transition-all shadow-sm"
          >
            <ChevronLeft size={20} /> Back
          </Link>
        </div>

        {isOwner && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Link
              to={`/edit-event/${event._id}`}
              className="bg-bg-surface/80 backdrop-blur p-2 rounded-full hover:bg-bg-surface text-primary transition-all shadow-sm"
            >
              <Edit size={20} />
            </Link>
            <button
              onClick={handleDelete}
              className="bg-bg-surface/80 backdrop-blur p-2 rounded-full hover:bg-error hover:text-white text-error transition-all shadow-sm"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
        <div className="bg-bg-surface rounded-3xl p-6 md:p-8 shadow-xl border border-border">
          <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
            <div className="flex-1">
              <p className="text-error font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
                <Calendar size={16} />
                {format(new Date(event.date), "EEEE, MMMM d, yyyy")} •{" "}
                {event.time}
              </p>
              <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                {event.title}
              </h1>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-secondary">
                  <img
                    src={event.user.avatar}
                    alt={event.user.fullname}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs text-text-secondary uppercase font-bold">
                    Hosted by
                  </p>
                  <Link
                    to={`/profile/${event.user._id}`}
                    className="font-bold hover:text-primary transition-colors"
                  >
                    {event.user.fullname}
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              <button
                onClick={() => handleToggle("going")}
                disabled={actionLoading}
                className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold transition-all shadow-lg ${
                  isGoing
                    ? "bg-primary text-on-primary shadow-primary/20 hover:bg-primary-hover"
                    : "bg-bg-secondary text-text-primary hover:bg-bg-tertiary"
                }`}
              >
                <CheckCircle2
                  size={20}
                  className={isGoing ? "fill-current" : ""}
                />
                {isGoing ? "Going" : "Join Event"}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => handleToggle("interested")}
                  disabled={actionLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all border ${
                    isInterested
                      ? "bg-error text-white border-error shadow-md shadow-error/20"
                      : "bg-bg-surface border-border hover:bg-bg-secondary text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Star
                    size={18}
                    className={isInterested ? "fill-current" : ""}
                  />
                  Interested
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center p-3 rounded-xl border border-border hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-all"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pt-8 border-t border-border">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  Details
                </h3>
                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  Attendees ({event.going.length + event.interested.length})
                </h3>

                {event.going.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-bold text-primary uppercase mb-3">
                      Going ({event.going.length})
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {event.going.map((u) => (
                        <Link
                          to={`/profile/${u._id}`}
                          key={u._id}
                          title={u.fullname}
                        >
                          <img
                            src={u.avatar}
                            alt={u.fullname}
                            className="w-10 h-10 rounded-full object-cover border-2 border-bg-surface hover:scale-110 transition-transform"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {event.interested.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-text-secondary uppercase mb-3">
                      Interested ({event.interested.length})
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {event.interested.map((u) => (
                        <Link
                          to={`/profile/${u._id}`}
                          key={u._id}
                          title={u.fullname}
                          className="opacity-70 hover:opacity-100 transition-opacity"
                        >
                          <img
                            src={u.avatar}
                            alt={u.fullname}
                            className="w-8 h-8 rounded-full object-cover border border-bg-surface"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {event.going.length === 0 && event.interested.length === 0 && (
                  <p className="text-text-secondary italic">
                    Be the first to join!
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  Location
                </h3>
                <div className="flex items-start gap-3 mb-4 text-text-secondary">
                  <MapPin className="shrink-0 mt-1" size={20} />
                  <p className="font-medium">{event.address}</p>
                </div>

                {event.location?.coordinates && (
                  <div className="h-48 rounded-2xl overflow-hidden border border-border relative z-0">
                    <MapContainer
                      center={[
                        event.location.coordinates[1],
                        event.location.coordinates[0],
                      ]}
                      zoom={14}
                      scrollWheelZoom={false}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker
                        position={[
                          event.location.coordinates[1],
                          event.location.coordinates[0],
                        ]}
                      >
                        <Popup>{event.title}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
