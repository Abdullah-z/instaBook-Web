import React from "react";
import { Store, Calendar, Map as MapIcon, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShortcutsRow = () => {
  const navigate = useNavigate();

  const shortcuts = [
    { icon: Store, label: "Marketplace", path: "/marketplace" },
    { icon: Calendar, label: "Events", path: "/events" },
    { icon: MapIcon, label: "Map", path: "/map" },
    { icon: Compass, label: "Discover", path: "/discover" },
  ];

  return (
    <div className="flex items-center justify-around bg-bg-surface p-4 rounded-3xl shadow-sm border border-bg-primary/5 lg:hidden mb-6">
      {shortcuts.map((item) => (
        <button
          key={item.label}
          onClick={() => navigate(item.path)}
          className="flex flex-col items-center gap-1 group transition-all"
        >
          <div className="p-3 rounded-2xl bg-bg-primary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <item.icon size={22} />
          </div>
          <span className="text-[10px] font-bold text-text-secondary group-hover:text-primary uppercase tracking-tighter">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ShortcutsRow;
