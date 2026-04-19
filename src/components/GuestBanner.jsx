import React from "react";
import { Link } from "react-router-dom";

const GuestBanner = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-[1100px] mx-auto pointer-events-auto">
        <div className="bg-primary text-on-primary rounded-[2rem] shadow-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight">
              Don't miss what's happening
            </h3>
            <p className="text-on-primary/80 font-medium text-sm mt-1">
              Join Circles to like, comment, and connect with people around the world.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/login?redirect=explore"
              className="flex-1 sm:flex-none text-center px-6 py-2.5 rounded-full bg-transparent border border-on-primary text-on-primary font-bold hover:bg-on-primary/10 transition-colors whitespace-nowrap"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="flex-1 sm:flex-none text-center px-6 py-2.5 rounded-full bg-on-primary text-primary font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestBanner;
