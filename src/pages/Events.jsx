import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Plus, Grid2X2 } from "lucide-react";
import API from "../utils/api";
import EventCard from "../components/EventCard";
import { toast } from "react-toastify";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await API.get("/events");
      setEvents(res.data.events);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-bg-primary text-text-primary">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            <span className="bg-gradient-to-r from-error to-pink-500 bg-clip-text text-transparent">
              Upcoming Events
            </span>
            <Calendar className="text-error" size={32} />
          </h1>
          <p className="text-text-secondary font-medium">
            Discover what's happening near you
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/create-event"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            Create Event
          </Link>
          <Link
            to="/my-events"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-bg-surface border border-border hover:border-primary/50 hover:bg-bg-secondary text-text-primary px-6 py-3 rounded-xl font-bold transition-all"
          >
            <Grid2X2 size={20} />
            My Created Events
          </Link>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((event) => (
            <EventCard key={event._id} event={event} onUpdate={fetchEvents} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary bg-bg-surface rounded-3xl border border-border border-dashed">
          <Calendar size={64} className="mb-4 opacity-20" />
          <h2 className="text-xl font-bold mb-2">No upcoming events found</h2>
          <p className="mb-6 text-center max-w-md">
            Be the first to create an event and bring the community together!
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

export default Events;
