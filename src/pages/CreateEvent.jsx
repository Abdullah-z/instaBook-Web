import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  X,
} from "lucide-react";
import API from "../utils/api";
import { toast } from "react-toastify";
import { imageUpload } from "../utils/imageUpload";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { format } from "date-fns";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For edit mode
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"),
    address: "",
    location: null,
    image: null,
  });

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/event/${id}`);
      const event = res.data.event;
      setFormData({
        title: event.title,
        description: event.description,
        date: format(new Date(event.date), "yyyy-MM-dd"),
        time: event.time,
        address: event.address,
        location: event.location.coordinates,
        image: event.image,
      });
      setImagePreview(event.image);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load event details");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const handleLocationSelect = (loc) => {
    setFormData((prev) => ({
      ...prev,
      address: loc.description,
      location: loc.coordinates,
    }));
    setShowLocationPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.description ||
      !formData.address ||
      !formData.location
    ) {
      return toast.error("Please fill in all required fields");
    }

    setLoading(true);
    try {
      let imageUrl = formData.image;

      // Upload image if it's a file
      if (formData.image instanceof File) {
        const media = await imageUpload([formData.image]);
        imageUrl = media[0].url;
      }

      const eventData = {
        ...formData,
        image: imageUrl,
        location: {
          type: "Point",
          coordinates: formData.location,
        },
      };

      if (id) {
        await API.patch(`/event/${id}`, eventData);
        toast.success("Event updated successfully!");
      } else {
        await API.post("/events", eventData);
        toast.success("Event created successfully!");
      }

      navigate("/events");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <div className="flex justify-center items-center h-screen bg-bg-primary">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-2xl">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-6 transition-colors font-medium"
        >
          <ChevronLeft size={20} />
          Back to Events
        </Link>

        <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
          <Calendar className="text-primary" size={32} />
          {id ? "Edit Event" : "Create New Event"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Photo */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wide">
              Event Cover Photo
            </label>
            <div className="relative group">
              {imagePreview ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-border group-hover:border-primary/50 transition-all">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 bg-bg-surface/80 backdrop-blur text-error p-2 rounded-full hover:bg-error hover:text-white transition-all shadow-sm"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video rounded-2xl border-2 border-dashed border-border hover:border-primary bg-bg-surface/50 cursor-pointer transition-all hover:bg-bg-surface group">
                  <div className="bg-bg-secondary p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon
                      size={32}
                      className="text-text-secondary group-hover:text-primary"
                    />
                  </div>
                  <span className="font-semibold text-text-secondary group-hover:text-primary">
                    Click to upload cover photo
                  </span>
                  <p className="text-xs text-text-secondary mt-1">
                    PNG, JPG up to 10MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wide">
              Event Title
            </label>
            <input
              required
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="What's the name of your event?"
              className="w-full bg-bg-surface border border-border focus:border-primary px-4 py-3 rounded-xl outline-none transition-all placeholder:text-text-secondary/50 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wide">
              Description
            </label>
            <textarea
              required
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Tell people what your event is about..."
              className="w-full bg-bg-surface border border-border focus:border-primary px-4 py-3 rounded-xl outline-none transition-all placeholder:text-text-secondary/50 font-medium resize-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wide flex items-center gap-2">
                <Calendar size={14} /> Date
              </label>
              <input
                required
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={format(new Date(), "yyyy-MM-dd")}
                className="w-full bg-bg-surface border border-border focus:border-primary px-4 py-3 rounded-xl outline-none transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wide flex items-center gap-2">
                <Clock size={14} /> Time
              </label>
              <input
                required
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="w-full bg-bg-surface border border-border focus:border-primary px-4 py-3 rounded-xl outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wide flex items-center gap-2">
              <MapPin size={14} /> Location
            </label>
            <div
              onClick={() => setShowLocationPicker(true)}
              className="w-full bg-bg-surface border border-border hover:border-primary px-4 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
            >
              <span
                className={`font-medium ${formData.address ? "text-text-primary" : "text-text-secondary/50"}`}
              >
                {formData.address || "Search for a location..."}
              </span>
              <MapPin
                size={18}
                className="text-text-secondary group-hover:text-primary transition-colors"
              />
            </div>
          </div>

          {showLocationPicker && (
            <LocationAutocomplete
              onLocationSelect={handleLocationSelect}
              onClose={() => setShowLocationPicker(false)}
              initialValue={formData.address}
            />
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-on-primary font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-8"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {id ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{id ? "Update Event" : "Create Event"}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
