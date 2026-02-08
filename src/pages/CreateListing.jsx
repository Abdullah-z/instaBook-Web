import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Plus,
  X,
  MapPin,
  Clock,
  ShoppingBag,
  Tag,
  AlignLeft,
  Gavel,
  ChevronRight,
  ShieldCheck,
  Store,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import API from "../utils/api";
import { imageUpload } from "../utils/imageUpload";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { toast } from "react-toastify";

const CreateListing = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    listingType: "Sell", // Sell, Bid, Both
    bidEndTime: "",
    address: "",
    phone: "",
    location: null,
  });

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isHD, setIsHD] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [fetchingListing, setFetchingListing] = useState(isEdit);

  const categories = [
    "Electronics",
    "Furniture",
    "Vehicles",
    "Clothing",
    "Real Estate",
    "Services",
    "Collectibles",
    "Home & Garden",
    "Books",
    "Other",
  ];

  useEffect(() => {
    if (isEdit) {
      const fetchListing = async () => {
        try {
          const res = await API.get(`/listings/${id}`);
          const l = res.data.listing;
          setFormData({
            name: l.name,
            description: l.description,
            price: l.price.toString(),
            category: l.category,
            listingType: l.listingType,
            bidEndTime: l.bidEndTime
              ? new Date(l.bidEndTime).toISOString().slice(0, 16)
              : "",
            address: l.address,
            phone: l.phone || "",
            location: l.location,
          });
          setExistingImages(l.images || []);
        } catch (err) {
          toast.error("Failed to fetch listing for edit");
        } finally {
          setFetchingListing(false);
        }
      };
      fetchListing();
    }
  }, [id, isEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCurrentImages = images.length + existingImages.length;
    if (totalCurrentImages + files.length > 3) {
      toast.error("You can only upload a maximum of 3 photos per listing");
      // Take only the first few that fit the limit
      const remainingSlots = 3 - totalCurrentImages;
      if (remainingSlots > 0) {
        setImages((prev) => [...prev, ...files.slice(0, remainingSlots)]);
      }
    } else {
      setImages((prev) => [...prev, ...files]);
    }
  };

  const removeNewImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (loc) => {
    setFormData((prev) => ({
      ...prev,
      address: loc.description,
      location: {
        type: "Point",
        coordinates: loc.coordinates, // [lon, lat]
      },
    }));
    setShowLocationPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0 && existingImages.length === 0) {
      return toast.error("Please upload at least one image");
    }

    if (images.length + existingImages.length > 3) {
      return toast.error("Maximum 3 photos allowed");
    }

    setLoading(true);
    try {
      let uploadedUrls = [];
      if (images.length > 0) {
        const media = await imageUpload(images, isHD);
        uploadedUrls = media.map((m) => m.url);
      }

      const submissionData = {
        ...formData,
        price: parseFloat(formData.price),
        images: [...existingImages, ...uploadedUrls],
      };

      if (isEdit) {
        await API.patch(`/listings/${id}`, submissionData);
        toast.success("Listing updated successfully!");
      } else {
        await API.post("/listings", submissionData);
        toast.success("Listing created successfully!");
      }
      navigate("/marketplace");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Failed to save listing");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingListing) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center lg:pl-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex">
      <Sidebar />

      <main className="lg:pl-64 flex-1 flex justify-center py-12 px-4">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-3 bg-bg-surface border border-bg-primary/5 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-black tracking-tighter">
                  {isEdit ? "Edit Your Listing" : "Create New Listing"}
                </h1>
                <p className="text-text-secondary font-medium uppercase tracking-widest text-[10px]">
                  Marketplace Hub
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-full font-bold text-xs">
              <ShieldCheck size={14} />
              Verified Seller Post
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20"
          >
            {/* Left Section: Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-bg-surface rounded-3xl p-8 border border-bg-primary/5 shadow-sm space-y-6">
                <div className="space-y-4">
                  <h3 className="font-black text-xl tracking-tight flex items-center gap-2">
                    <Tag size={20} className="text-primary" />
                    Basic Information
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">
                      Item Headline
                    </label>
                    <input
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. iPhone 15 Pro Max - Silver"
                      className="w-full bg-bg-primary border-2 border-transparent focus:border-primary/30 p-4 rounded-2xl outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">
                        Category
                      </label>
                      <select
                        required
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full bg-bg-primary border-2 border-transparent focus:border-primary/30 p-4 rounded-2xl outline-none transition-all font-bold appearance-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">
                        Price ($)
                      </label>
                      <input
                        required
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="w-full bg-bg-primary border-2 border-transparent focus:border-primary/30 p-4 rounded-2xl outline-none transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">
                      Detailed Description
                    </label>
                    <textarea
                      required
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={6}
                      placeholder="Tell buyers about your item's condition, features, and why you're selling it..."
                      className="w-full bg-bg-primary border-2 border-transparent focus:border-primary/30 p-4 rounded-2xl outline-none transition-all font-medium resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">
                      Contact Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +1 234 567 890"
                      className="w-full bg-bg-primary border-2 border-transparent focus:border-primary/30 p-4 rounded-2xl outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-bg-primary/10 space-y-4">
                  <h3 className="font-black text-xl tracking-tight flex items-center gap-2">
                    <MapPin size={20} className="text-primary" />
                    Pickup Location
                  </h3>
                  <div
                    onClick={() => setShowLocationPicker(true)}
                    className="w-full bg-bg-primary border-2 border-dashed border-primary/20 p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-bg-surface rounded-xl group-hover:bg-primary/10 transition-all">
                        <MapPin size={24} className="text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold">
                          {formData.address || "Select a location"}
                        </p>
                        <p className="text-[10px] text-text-secondary font-medium uppercase tracking-widest">
                          Public meet-up spot recommended
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-text-secondary" />
                  </div>
                </div>
              </div>

              <div className="bg-bg-surface rounded-3xl p-8 border border-bg-primary/5 shadow-sm space-y-6">
                <h3 className="font-black text-xl tracking-tight flex items-center gap-2">
                  <Gavel size={20} className="text-primary" />
                  Listing Type & Auction
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  {["Sell", "Bid", "Both"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, listingType: type }))
                      }
                      className={`py-4 rounded-2xl font-black text-sm tracking-tight border-2 transition-all ${formData.listingType === type ? "bg-primary text-on-primary border-primary" : "bg-bg-primary border-transparent text-text-secondary hover:border-primary/30"}`}
                    >
                      {type === "Both"
                        ? "Sell + Auction"
                        : type === "Sell"
                          ? "Direct Sale"
                          : "Auction Only"}
                    </button>
                  ))}
                </div>

                {(formData.listingType === "Bid" ||
                  formData.listingType === "Both") && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-4">
                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1 flex items-center gap-2">
                      <Clock size={12} /> Auction Deadline
                    </label>
                    <input
                      type="datetime-local"
                      name="bidEndTime"
                      value={formData.bidEndTime}
                      onChange={handleInputChange}
                      className="w-full bg-bg-primary border-2 border-transparent focus:border-primary/30 p-4 rounded-2xl outline-none transition-all font-bold"
                    />
                    <p className="text-[10px] text-text-secondary font-medium ml-1">
                      Winning bidder must pay within 24h of auction end.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section: Photos & Submit */}
            <div className="space-y-6">
              <div className="bg-bg-surface rounded-3xl p-8 border border-bg-primary/5 shadow-sm space-y-6">
                <h3 className="font-black text-xl tracking-tight flex items-center gap-2">
                  <Upload size={20} className="text-primary" />
                  Item Media
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Current New Images */}
                  {images.map((file, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative aspect-square rounded-2xl overflow-hidden group"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Existing Images (Edit mode) */}
                  {existingImages.map((url, idx) => (
                    <div
                      key={`exist-${idx}`}
                      className="relative aspect-square rounded-2xl overflow-hidden group"
                    >
                      <img src={url} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  <label className="aspect-square rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-primary">
                    <Plus size={24} />
                    <span className="text-[10px] font-black tracking-widest uppercase text-center px-2">
                      Add Photo
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <ul className="text-[10px] text-text-secondary font-medium space-y-1 ml-1 list-disc list-inside">
                  <li>Minimum 1 photo | Maximum 3 photos</li>
                  <li>Clear, well-lit photos work best</li>
                  <li>Max 10MB per image</li>
                </ul>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text-secondary hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={isHD}
                      onChange={(e) => setIsHD(e.target.checked)}
                      className="accent-primary w-4 h-4 rounded-lg"
                    />
                    Upload in HD Quality (No compression)
                  </label>
                </div>
              </div>

              <div className="sticky top-8 space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary py-5 rounded-[2rem] font-black text-lg tracking-tight hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {loading
                    ? "SAVING..."
                    : isEdit
                      ? "UPDATE LISTING"
                      : "LIST ITEM NOW"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full bg-bg-surface border border-bg-primary/10 py-5 rounded-[2rem] font-black text-lg tracking-tight hover:bg-bg-primary transition-all"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {showLocationPicker && (
        <LocationAutocomplete
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
};

export default CreateListing;
