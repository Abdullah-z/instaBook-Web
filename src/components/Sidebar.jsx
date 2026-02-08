import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home as HomeIcon,
  Compass,
  Bell,
  MessageSquare,
  User,
  LogOut,
  PlusSquare,
  Search,
  MapPin,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";

import ThemeSwitcher from "./ThemeSwitcher";

const Sidebar = () => {
  const { logout, user } = useAuth();
  const { unreadCount } = useContext(SocketContext) || {};

  const navItems = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Compass, label: "Explore", path: "/search" },
    { icon: MapPin, label: "Map", path: "/map" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: `/profile/${user?._id}` },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 lg:w-64 border-r border-bg-surface bg-bg-primary flex flex-col p-4 transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <span className="text-on-primary font-black text-xl">P</span>
        </div>
        <span className="hidden lg:block font-extrabold text-2xl tracking-tighter">
          Prism
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 p-3 rounded-2xl transition-all group
              ${
                isActive
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "hover:bg-bg-surface text-text-secondary hover:text-text-primary"
              }
            `}
          >
            <div className="relative">
              <item.icon
                size={26}
                className="group-hover:scale-110 transition-transform"
              />
              {item.label === "Notifications" && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-bg-primary">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </div>
              )}
            </div>
            <span className="hidden lg:block text-lg">{item.label}</span>
          </NavLink>
        ))}

        <button className="flex items-center gap-4 p-3 rounded-2xl hover:bg-bg-surface text-text-secondary hover:text-text-primary w-full transition-all group">
          <PlusSquare
            size={26}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="hidden lg:block text-lg">Create</span>
        </button>
      </nav>

      {/* Profile & Logout */}
      <div className="pt-4 border-t border-bg-surface space-y-4">
        <div className="hidden lg:block">
          <ThemeSwitcher />
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-4 p-3 rounded-2xl hover:bg-error/10 text-text-secondary hover:text-error w-full transition-all group"
        >
          <LogOut
            size={26}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="hidden lg:block text-lg">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
