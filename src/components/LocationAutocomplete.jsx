import React, { useState, useEffect, useRef } from "react";
import { MapPin, X, Loader2 } from "lucide-react";

const LocationAutocomplete = ({
  onLocationSelect,
  onClose,
  initialValue = "",
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  const searchLocation = async (text) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      let response;
      try {
        response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5&lang=en`,
        );
      } catch (e) {
        response = await fetch(
          `http://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5&lang=en`,
        );
      }

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      const formatted = data.features.map((feature) => {
        const p = feature.properties;
        const parts = [p.name, p.street, p.city, p.state, p.country].filter(
          Boolean,
        );
        return {
          description: parts.join(", "),
          coordinates: feature.geometry.coordinates, // [lon, lat]
        };
      });

      setSuggestions(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => searchLocation(text), 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000] p-4">
      <div className="bg-bg-primary w-full max-w-md rounded-2xl shadow-2xl border border-bg-surface overflow-hidden">
        <div className="p-4 border-b border-bg-surface flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <MapPin className="text-primary" size={20} />
            Share Location
          </h3>
          <button
            onClick={onClose}
            className="hover:bg-bg-surface p-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search for a place..."
            className="w-full bg-bg-surface rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            autoFocus
          />

          <div className="mt-4 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-2">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onLocationSelect(item)}
                    className="w-full text-left p-3 hover:bg-bg-surface rounded-xl transition-colors flex items-start gap-3"
                  >
                    <div className="mt-1 bg-bg-surface p-1.5 rounded-full">
                      <MapPin size={14} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {item.description.split(",")[0]}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length > 2 ? (
              <p className="text-center text-text-secondary py-4">
                No results found
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationAutocomplete;
