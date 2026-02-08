import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Grid2X2,
  Trash2,
  Edit,
  MapPin,
  Clock,
  Plus,
} from "lucide-react";
import API from "../utils/api";
import { toast } from "react-toastify";
import { format } from "date-fns";

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchMyEvents = async () => {
    try {
      const res = await API.get(`/user_events/${user._id}`);
      setEvents(res.data.events);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchMyEvents();
    }
  }, [user]);

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await API.delete(`/event/${eventId}`);
        setEvents(events.filter((event) => event._id !== eventId));
        toast.success("Event deleted successfully");
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete event");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-bg-primary text-text-primary">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              My Events
            </span>
            <Grid2X2 className="text-primary" size={32} />
          </h1>
          <p className="text-text-secondary font-medium">
            Manage the events you're hosting
          </p>
        </div>

        <Link
          to="/create-event"
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          Create New
        </Link>
      </div>

      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event._id}
              className="bg-bg-surface rounded-2xl overflow-hidden border border-border flex flex-col group hover:shadow-lg transition-all"
            >
              <Link
                to={`/event/${event._id}`}
                className="block relative aspect-video overflow-hidden"
              >
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-bg-secondary text-text-secondary">
                    <Calendar size={48} className="opacity-20" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-bg-surface/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {event.going.length + event.interested.length} responses
                </div>
              </Link>

              <div className="p-5 flex flex-col flex-1">
                <p className="text-xs font-bold text-error uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Calendar size={12} />
                  {format(new Date(event.date), "EEE, MMM d")} • {event.time}
                </p>
                <h3 className="text-lg font-bold mb-2 line-clamp-1">
                  {event.title}
                </h3>
                <div className="flex items-center gap-1 text-text-secondary text-sm mb-6">
                  <MapPin size={14} />
                  <span className="truncate">{event.address}</span>
                </div>

                <div className="mt-auto flex gap-2 pt-4 border-t border-border">
                  <Link
                    to={`/edit-event/${event._id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold bg-bg-secondary text-text-primary hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <Edit size={16} /> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold bg-error/5 text-error hover:bg-error hover:text-white transition-all"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary bg-bg-surface rounded-3xl border border-border border-dashed">
          <Calendar size={64} className="mb-4 opacity-20" />
          <h2 className="text-xl font-bold mb-2">
            You haven't created any events yet
          </h2>
          <p className="mb-6 text-center max-w-md">
            Host an event and bring your community together!
          </p>
          <Link
            to="/create-event"
            className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            Create First Event
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyEvents;
