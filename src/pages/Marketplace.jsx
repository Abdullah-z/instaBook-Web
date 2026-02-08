import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Store,
  Clock,
  MapPin,
  ChevronRight,
  Filter,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import API from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { format } from "timeago.js";

const Marketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadListings = async () => {
    try {
      setLoading(true);
      const res = await API.get("/listings");
      setListings(res.data.listings || []);
      setFilteredListings(res.data.listings || []);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredListings(listings);
    } else {
      const filtered = listings.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredListings(filtered);
    }
  };

  const ListingCard = ({ item }) => (
    <div
      onClick={() => navigate(`/listing/${item._id}`)}
      className="bg-bg-surface rounded-[2rem] overflow-hidden border border-bg-primary/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
    >
      <div className="relative aspect-square overflow-hidden bg-bg-primary/50">
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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

      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-black text-lg tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <div className="flex items-center gap-1.5 text-text-secondary text-sm font-medium mt-0.5">
            <MapPin size={14} className="text-primary" />
            <span className="line-clamp-1">{item.address}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-bg-primary/10">
          <div className="flex items-center gap-2">
            <img
              src={item.user?.avatar || "https://via.placeholder.com/30"}
              className="w-6 h-6 rounded-full object-cover ring-2 ring-primary/20"
              alt="Seller"
            />
            <span className="text-xs text-text-secondary font-bold">
              @{item.user?.username}
            </span>
          </div>
          <span className="text-[10px] text-text-secondary font-medium">
            {format(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Sidebar />

      <main className="lg:pl-64 flex justify-center min-h-screen">
        <div className="max-w-[1200px] w-full py-8 px-4 lg:px-8 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Store className="text-primary" size={28} />
                </div>
                <h1 className="text-4xl font-black tracking-tighter">
                  Marketplace
                </h1>
              </div>
              <p className="text-text-secondary font-medium ml-1">
                Discover unique items from your community.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/my-listings")}
                className="flex items-center gap-2 px-6 py-3 bg-bg-surface border border-bg-primary/10 rounded-2xl font-bold hover:bg-bg-primary transition-all group"
              >
                <ShoppingBag size={20} className="group-hover:text-primary" />
                <span>My Items</span>
              </button>
              <button
                onClick={() => navigate("/create-listing")}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                <Plus size={20} />
                <span>Sell Item</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Search items, categories, or sellers..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full bg-bg-surface border border-bg-primary/5 py-4 pl-12 pr-4 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-primary/20 focus:bg-bg-primary transition-all font-medium shadow-sm"
              />
            </div>
            <button className="sm:w-auto px-6 py-4 bg-bg-surface border border-bg-primary/5 rounded-[1.5rem] font-bold flex items-center justify-center gap-2 hover:bg-bg-primary transition-all">
              <Filter size={20} className="text-primary" />
              <span>Filters</span>
            </button>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-text-secondary font-bold animate-pulse">
                Finding treasures...
              </p>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {filteredListings.map((item) => (
                <ListingCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center">
              <div className="p-8 bg-bg-surface rounded-full border border-bg-primary/5">
                <ShoppingBag
                  size={64}
                  className="text-text-secondary opacity-20"
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight">
                  No listings found
                </h2>
                <p className="text-text-secondary font-medium max-w-xs mx-auto">
                  Try adjusting your search or be the first to sell something in
                  this category!
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilteredListings(listings);
                }}
                className="text-primary font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Marketplace;
