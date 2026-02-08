import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  MessageSquare,
  Phone,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Trash2,
  Edit,
  Store,
  Gavel,
  CheckCircle2,
  Download,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "../components/Sidebar";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { VoiceCallContext } from "../context/VoiceCallContext";
import { toast } from "react-toastify";
import { format } from "timeago.js";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startCall } = useContext(VoiceCallContext) || {};

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [placingBid, setPlacingBid] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const loadListing = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/listings/${id}`);
      setListing(res.data.listing);
      if (res.data.listing.price) {
        setBidAmount(
          (
            res.data.listing.currentBid + 1 || res.data.listing.price
          ).toString(),
        );
      }
    } catch (err) {
      console.error("Failed to load listing:", err);
      toast.error("Could not load listing details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListing();
  }, [id]);

  useEffect(() => {
    if (!listing?.bidEndTime || listing.isSold) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(listing.bidEndTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Auction Ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${days > 0 ? days + "d " : ""}${hours}h ${minutes}m ${seconds}s`,
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [listing]);

  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);
    const currentBid = parseFloat(listing.currentBid || 0);
    const price = parseFloat(listing.price);

    console.log(
      `Bid Attempt: Amount=${amount}, Current=${currentBid}, Price=${price}`,
    );

    if (isNaN(amount)) {
      return toast.error("Please enter a valid amount");
    }

    if (amount <= currentBid) {
      return toast.error(
        `Bid must be higher than current bid ($${currentBid})`,
      );
    }

    if (amount > price) {
      return toast.error(`Bid cannot exceed asking price ($${price})`);
    }

    setPlacingBid(true);
    try {
      const res = await API.patch(`/listings/${id}/bid`, { amount });
      console.log("Bid Success Response:", res.data);
      setListing(res.data.listing);
      toast.success(res.data.msg);
    } catch (err) {
      console.error("Bid API Error:", err);
      const errorMsg =
        err.response?.data?.msg || "Failed to place bid. Please try again.";
      toast.error(errorMsg);
      // Fallback alert for critical failure visibility if toast fails
      if (!err.response) alert("Network Error: " + errorMsg);
    } finally {
      setPlacingBid(false);
    }
  };

  const handleMessageSeller = () => {
    if (listing?.user) {
      navigate(`/messages?id=${listing.user._id}`);
    }
  };

  const handleCallSeller = () => {
    if (listing?.user && startCall) {
      startCall(listing.user);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await API.delete(`/listings/${id}`);
        toast.success("Listing deleted");
        navigate("/marketplace");
      } catch (err) {
        toast.error("Failed to delete listing");
      }
    }
  };

  const toggleSoldStatus = async () => {
    try {
      const res = await API.patch(`/listings/${id}/sold`, {
        isSold: !listing.isSold,
      });
      setListing(res.data.listing);
      toast.success(
        listing.isSold
          ? "Listing marked as available"
          : "Listing marked as sold",
      );
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center lg:pl-64">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!listing) return null;

  const isOwner = user?._id === listing.user?._id;
  const isBiddable =
    listing.listingType === "Bid" || listing.listingType === "Both";

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Sidebar />

      <main className="lg:pl-64 flex justify-center pb-20">
        <div className="max-w-[1200px] w-full p-4 lg:p-8 space-y-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-bold group"
          >
            <div className="p-2 bg-bg-surface rounded-xl group-hover:bg-primary/10 transition-all">
              <ArrowLeft size={20} />
            </div>
            Back to Marketplace
          </button>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {/* Left Column: Images */}
            <div className="space-y-6">
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-bg-surface border border-bg-primary/5 shadow-2xl group">
                {listing.images && listing.images.length > 0 ? (
                  <>
                    <img
                      src={listing.images[currentImageIndex]}
                      alt={listing.name}
                      className="w-full h-full object-cover"
                    />
                    {listing.isSold && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-10">
                        <span className="text-white font-black text-6xl tracking-tighter border-8 border-white px-8 py-2 rotate-[-15deg]">
                          SOLD
                        </span>
                      </div>
                    )}
                    {listing.images.length > 1 && (
                      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev > 0 ? prev - 1 : listing.images.length - 1,
                            )
                          }
                          className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl pointer-events-auto hover:bg-primary hover:text-white transition-all transform hover:scale-110"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev < listing.images.length - 1 ? prev + 1 : 0,
                            )
                          }
                          className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl pointer-events-auto hover:bg-primary hover:text-white transition-all transform hover:scale-110"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary gap-4">
                    <Store size={64} className="opacity-20" />
                    <p className="font-bold">No images available</p>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {listing.images?.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-4 transition-all ${currentImageIndex === idx ? "border-primary scale-105 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"}`}
                    >
                      <img src={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Info & Actions */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter leading-tight">
                      {listing.name}
                    </h1>
                    <div className="flex items-center gap-2 text-text-secondary font-medium">
                      <MapPin size={16} className="text-primary" />
                      <span>{listing.address}</span>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/edit-listing/${listing._id}`)}
                        className="p-3 bg-bg-surface border border-bg-primary/10 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="p-3 bg-bg-surface border border-bg-primary/10 rounded-2xl hover:bg-error/10 hover:text-error transition-all shadow-sm"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary px-6 py-2 rounded-2xl">
                    <span className="text-3xl font-black tracking-tighter">
                      ${listing.price}
                    </span>
                  </div>
                  <div className="text-text-secondary text-sm font-bold flex flex-col">
                    <span>
                      LISTED {format(listing.createdAt).toUpperCase()}
                    </span>
                    <span className="text-primary">
                      Condition: New • {listing.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Auction Section */}
              {isBiddable && (
                <div className="bg-bg-surface rounded-3xl p-6 border-2 border-primary/20 shadow-xl shadow-primary/5 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none">
                    <Gavel size={120} />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                    <div>
                      <p className="text-sm font-extrabold text-text-secondary uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Gavel size={14} className="text-primary" /> Current Bid
                      </p>
                      <p className="text-4xl font-black text-primary tracking-tighter">
                        ${listing.currentBid || 0}
                      </p>
                    </div>
                    <div className="bg-bg-primary/50 backdrop-blur-md px-5 py-3 rounded-2xl border border-primary/20 flex items-center gap-3">
                      <Clock className="text-error animate-pulse" size={20} />
                      <div>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest leading-none mb-1">
                          Ends in
                        </p>
                        <p className="text-xl font-black text-error tracking-tighter leading-none">
                          {timeLeft}
                        </p>
                      </div>
                    </div>
                  </div>

                  {listing.highestBidder && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 w-fit relative z-10">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <p className="text-sm font-bold">
                        Highest bidder:{" "}
                        <span className="text-primary">
                          @{listing.highestBidder.username}
                        </span>
                      </p>
                    </div>
                  )}

                  {!isOwner &&
                    !listing.isSold &&
                    timeLeft !== "Auction Ended" && (
                      <div className="flex gap-2 relative z-10">
                        <div className="relative flex-1 group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-lg text-text-secondary group-focus-within:text-primary">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="Place your bid"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="w-full bg-bg-primary border-2 border-transparent focus:border-primary py-4 pl-8 pr-4 rounded-2xl outline-none font-black text-lg transition-all"
                          />
                        </div>
                        <button
                          onClick={handlePlaceBid}
                          disabled={placingBid}
                          className="bg-primary text-on-primary px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-50"
                        >
                          {placingBid ? "BIDDING..." : "BID NOW"}
                        </button>
                      </div>
                    )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary rounded-full"></span>
                  Description
                </h3>
                <p className="text-text-secondary font-medium leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>

              {/* Seller & Map Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Seller Info */}
                <div className="bg-bg-surface p-6 rounded-[2rem] border border-bg-primary/5 shadow-sm space-y-4">
                  <h3 className="font-black tracking-tighter text-lg">
                    Seller Info
                  </h3>
                  <div
                    onClick={() => navigate(`/profile/${listing.user?._id}`)}
                    className="flex items-center gap-4 cursor-pointer group"
                  >
                    <img
                      src={
                        listing.user?.avatar || "https://via.placeholder.com/60"
                      }
                      className="w-14 h-14 rounded-[1.25rem] object-cover ring-4 ring-primary/10 group-hover:scale-105 transition-all"
                    />
                    <div>
                      <h4 className="font-black tracking-tight group-hover:text-primary transition-colors">
                        {listing.user?.fullname || listing.user?.username}
                      </h4>
                      <p className="text-xs text-text-secondary font-bold">
                        Active Community Member
                      </p>
                    </div>
                  </div>

                  {isOwner ? (
                    <button
                      onClick={toggleSoldStatus}
                      className={`w-full py-4 rounded-2xl font-black transition-all ${listing.isSold ? "bg-bg-primary text-text-primary" : "bg-primary text-on-primary shadow-lg shadow-primary/20"}`}
                    >
                      {listing.isSold ? "MARK AS AVAILABLE" : "MARK AS SOLD"}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleMessageSeller}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                        <MessageSquare size={18} />
                        MESSAGE
                      </button>
                      <button
                        onClick={handleCallSeller}
                        className="p-4 bg-bg-primary border border-bg-primary/10 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        <Phone size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Map Preview */}
                <div className="bg-bg-surface p-6 rounded-[2rem] border border-bg-primary/5 shadow-sm space-y-4 h-fit">
                  <h3 className="font-black tracking-tighter text-lg">
                    Location
                  </h3>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-bg-primary/10 relative">
                    {listing.location?.coordinates ? (
                      <MapContainer
                        center={[
                          listing.location.coordinates[1],
                          listing.location.coordinates[0],
                        ]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                        dragging={false}
                        doubleClickZoom={false}
                        scrollWheelZoom={false}
                        className="z-0"
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker
                          position={[
                            listing.location.coordinates[1],
                            listing.location.coordinates[0],
                          ]}
                        />
                      </MapContainer>
                    ) : (
                      <div className="w-full h-full bg-bg-primary/50 flex flex-col items-center justify-center text-text-secondary">
                        <MapPin size={32} className="opacity-20 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">
                          Map unavailable
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-x-4 bottom-4 z-10">
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps?q=${listing.location.coordinates[1]},${listing.location.coordinates[0]}`,
                            "_blank",
                          )
                        }
                        className="w-full bg-white/90 backdrop-blur-md py-2 rounded-xl text-[10px] font-black tracking-widest flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Navigation size={12} /> OPEN IN GOOGLE MAPS
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Tip */}
              <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-[2rem] flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-green-700">
                    Fair Trade & Safety
                  </h4>
                  <p className="text-sm text-green-600/80 font-medium">
                    Meet in public places and inspect items thoroughly before
                    payment. For auctions, your bid is a binding contract.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Loader2 = ({ className }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const Navigation = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

export default ListingDetail;
