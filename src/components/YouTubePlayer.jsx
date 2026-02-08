import React, { useState } from "react";
import { Play } from "lucide-react";

const YouTubePlayer = ({ videoId }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (!isPlaying) {
    return (
      <div
        className="relative w-full aspect-video rounded-2xl overflow-hidden cursor-pointer group"
        onClick={(e) => {
          e.stopPropagation();
          setIsPlaying(true);
        }}
      >
        <img
          src={thumbnailUrl}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          alt="YouTube Thumbnail"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/80 transition-all border-2 border-white/20 shadow-2xl">
            <Play fill="white" size={40} className="text-white ml-1.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default YouTubePlayer;
