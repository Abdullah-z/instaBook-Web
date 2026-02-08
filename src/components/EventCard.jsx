import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Star, CheckCircle2 } from "lucide-react";
import API from "../utils/api";
import { toast } from "react-toastify";
import { format } from "date-fns";

const EventCard = ({ event, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const isInterested = event.interested.some((u) =>
    typeof u === "string" ? u === user?._id : u._id === user?._id,
  );
  const isGoing = event.going.some((u) =>
    typeof u === "string" ? u === user?._id : u._id === user?._id,
  );

  const handleInterested = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.patch(`/event/${event._id}/interested`);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleGoing = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.patch(`/event/${event._id}/going`);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      to={`/event/${event._id}`}
      className="bg-bg-surface rounded-2xl overflow-hidden border border-border transition-all hover:shadow-lg hover:border-primary/50 group flex flex-col h-full"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-bg-primary">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
            <Calendar size={48} className="opacity-20" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-bg-surface/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-border">
          {event.going.length} going • {event.interested.length} interested
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs font-bold text-error uppercase tracking-wide mb-2 flex items-center gap-1">
          <Calendar size={12} />
          {format(new Date(event.date), "EEE, MMM d")} • {event.time}
        </p>

        <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        <div className="flex items-center gap-1 text-text-secondary text-sm mb-4">
          <MapPin size={14} />
          <span className="truncate">{event.address}</span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-border">
          <button
            onClick={handleInterested}
            disabled={loading}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              isInterested
                ? "bg-error text-white shadow-md shadow-error/20"
                : "bg-bg-primary text-text-primary hover:bg-bg-secondary"
            }`}
          >
            <Star size={16} className={isInterested ? "fill-current" : ""} />
            Interested
          </button>

          <button
            onClick={handleGoing}
            disabled={loading}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              isGoing
                ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                : "bg-bg-primary text-text-primary hover:bg-bg-secondary"
            }`}
          >
            <CheckCircle2 size={16} className={isGoing ? "fill-current" : ""} />
            Going
          </button>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
