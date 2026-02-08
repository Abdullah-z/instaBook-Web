import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Store,
  ChevronRight,
  Gavel,
  PackageCheck,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";
import { format } from "timeago.js";

const MyListings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyListings = async () => {
    try {
      setLoading(true);
      const res = await API.get("/listings/me");
      setListings(res.data.listings || []);
    } catch (err) {
      console.error("Failed to load my listings:", err);
      toast.error("Could not load your listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyListings();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await API.delete(`/listings/${id}`);
        setListings((prev) => prev.filter((l) => l._id !== id));
        toast.success("Listing deleted");
      } catch (err) {
        toast.error("Failed to delete listing");
      }
    }
  };

  const toggleSoldStatus = async (id, currentStatus) => {
    try {
      const res = await API.patch(`/listings/${id}/sold`, {
        isSold: !currentStatus,
      });
      setListings((prev) =>
        prev.map((l) => (l._id === id ? { ...l, isSold: !currentStatus } : l)),
      );
      toast.success(!currentStatus ? "Marked as sold" : "Marked as available");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const MyListingCard = ({ item }) => (
    <div className="bg-bg-surface rounded-3xl overflow-hidden border border-bg-primary/5 shadow-sm hover:shadow-xl transition-all group">
      <div
        className="relative aspect-video overflow-hidden bg-bg-primary/50 cursor-pointer"
        onClick={() => navigate(`/listing/${item._id}`)}
      >
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {item.isSold && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-black text-2xl tracking-tighter border-4 border-white px-4 py-1 rotate-[-15deg]">
              SOLD
            </span>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg">
            <span className="text-black font-black text-lg">${item.price}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3
              className="font-black text-xl tracking-tighter line-clamp-1 hover:text-primary cursor-pointer transition-colors"
              onClick={() => navigate(`/listing/${item._id}`)}
            >
              {item.name}
            </h3>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mt-1">
              LISTED {format(item.createdAt).toUpperCase()}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${item.isSold ? "bg-bg-primary text-text-secondary border-bg-primary" : "bg-green-500/10 text-green-600 border-green-500/20"}`}
          >
            {item.isSold ? "Completed" : "Active"}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => navigate(`/edit-listing/${item._id}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-bg-primary hover:bg-primary/10 hover:text-primary rounded-2xl transition-all font-black text-sm"
            >
              <Edit size={16} />
              EDIT
            </button>
            <button
              onClick={() => handleDelete(item._id)}
              className="p-3 bg-bg-primary hover:bg-error/10 hover:text-error rounded-2xl transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <button
            onClick={() => toggleSoldStatus(item._id, item.isSold)}
            className={`flex-1 py-3 rounded-2xl font-black text-sm tracking-tight shadow-lg transition-all active:scale-95 ${item.isSold ? "bg-bg-primary text-text-secondary" : "bg-primary text-on-primary shadow-primary/20"}`}
          >
            {item.isSold ? "RELISH" : "MARK SOLD"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Sidebar />

      <main className="lg:pl-64 flex justify-center min-h-screen pb-20">
        <div className="max-w-[1200px] w-full py-8 px-4 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <button
                onClick={() => navigate("/marketplace")}
                className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-bold text-sm mb-4"
              >
                <ArrowLeft size={16} />
                Marketplace Feed
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <PackageCheck className="text-primary" size={28} />
                </div>
                <h1 className="text-4xl font-black tracking-tighter">
                  My Inventory
                </h1>
              </div>
              <p className="text-text-secondary font-medium ml-1">
                Manage your active listings and track your shop's performance.
              </p>
            </div>

            <button
              onClick={() => navigate("/create-listing")}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              <Plus size={20} />
              <span>POST NEW ITEM</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Total Items",
                value: listings.length,
                icon: ShoppingBag,
              },
              {
                label: "Active",
                value: listings.filter((l) => !l.isSold).length,
                icon: Store,
              },
              {
                label: "Sold",
                value: listings.filter((l) => l.isSold).length,
                icon: CheckCircle2,
              },
              {
                label: "Auctions",
                value: listings.filter((l) => l.listingType !== "Sell").length,
                icon: Gavel,
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-bg-surface p-4 rounded-3xl border border-bg-primary/5 shadow-sm flex items-center gap-4"
              >
                <div className="p-3 bg-bg-primary rounded-2xl text-primary">
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tighter">
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-text-secondary font-bold animate-pulse">
                Scanning inventory...
              </p>
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
              {listings.map((item) => (
                <MyListingCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 space-y-8 text-center bg-bg-surface rounded-[3rem] border border-bg-primary/5 shadow-inner">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative p-10 bg-bg-primary rounded-full border border-primary/20">
                  <ShoppingBag size={80} className="text-primary opacity-40" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tighter">
                  Your shop is empty
                </h2>
                <p className="text-text-secondary font-medium max-w-sm mx-auto leading-relaxed">
                  Ready to declutter? Turn your unwanted items into cash by
                  listing them on the marketplace!
                </p>
              </div>
              <button
                onClick={() => navigate("/create-listing")}
                className="bg-primary text-on-primary px-10 py-4 rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30"
              >
                START SELLING
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyListings;
