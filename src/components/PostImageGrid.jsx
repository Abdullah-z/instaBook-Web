import React from "react";

const PostImageGrid = ({ images, onImageClick }) => {
  const count = images.length;

  if (count === 0) return null;

  const isVideo = (url) =>
    url?.endsWith(".mp4") || url?.includes("resource_type=video");

  const MediaItem = ({ url, index, className, showOverlay, overlayCount }) => {
    const isVid = isVideo(url);

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onImageClick(index);
        }}
        className={`relative cursor-pointer overflow-hidden bg-black ${className}`}
      >
        {isVid ? (
          <video
            src={url}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        ) : (
          <img
            src={url}
            alt={`post media ${index}`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        )}

        {isVid && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <svg
              className="w-12 h-12 text-white/80"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {showOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white text-3xl font-black">
              +{overlayCount}
            </span>
          </div>
        )}
      </div>
    );
  };

  // 1 Image: Full
  if (count === 1) {
    return (
      <div className="px-4">
        <MediaItem
          url={images[0].url}
          index={0}
          className="w-full aspect-video rounded-3xl"
        />
      </div>
    );
  }

  // 2 Images: Side by Side
  if (count === 2) {
    return (
      <div className="px-4 grid grid-cols-2 gap-1 h-[400px]">
        <MediaItem
          url={images[0].url}
          index={0}
          className="rounded-l-3xl h-full"
        />
        <MediaItem
          url={images[1].url}
          index={1}
          className="rounded-r-3xl h-full"
        />
      </div>
    );
  }

  // 3 Images: 1 Top, 2 Bottom
  if (count === 3) {
    return (
      <div className="px-4 flex flex-col gap-1">
        <MediaItem
          url={images[0].url}
          index={0}
          className="w-full h-[300px] rounded-t-3xl"
        />
        <div className="grid grid-cols-2 gap-1 h-[200px]">
          <MediaItem
            url={images[1].url}
            index={1}
            className="rounded-bl-3xl h-full"
          />
          <MediaItem
            url={images[2].url}
            index={2}
            className="rounded-br-3xl h-full"
          />
        </div>
      </div>
    );
  }

  // 4 Images: 1 Top, 3 Bottom
  if (count === 4) {
    return (
      <div className="px-4 flex flex-col gap-1">
        <MediaItem
          url={images[0].url}
          index={0}
          className="w-full h-[300px] rounded-t-3xl"
        />
        <div className="grid grid-cols-3 gap-1 h-[150px]">
          <MediaItem
            url={images[1].url}
            index={1}
            className="rounded-bl-3xl h-full"
          />
          <MediaItem url={images[2].url} index={2} className="h-full" />
          <MediaItem
            url={images[3].url}
            index={3}
            className="rounded-br-3xl h-full"
          />
        </div>
      </div>
    );
  }

  // 5+ Images: 2 Top, 3 Bottom (Matches Tablet/Web standard)
  return (
    <div className="px-4 flex flex-col gap-1">
      <div className="grid grid-cols-2 gap-1 h-[300px]">
        <MediaItem
          url={images[0].url}
          index={0}
          className="rounded-tl-3xl h-full"
        />
        <MediaItem
          url={images[1].url}
          index={1}
          className="rounded-tr-3xl h-full"
        />
      </div>
      <div className="grid grid-cols-3 gap-1 h-[150px]">
        <MediaItem
          url={images[2].url}
          index={2}
          className="rounded-bl-3xl h-full"
        />
        <MediaItem url={images[3].url} index={3} className="h-full" />
        <MediaItem
          url={images[4].url}
          index={4}
          className="rounded-br-3xl h-full"
          showOverlay={count > 5}
          overlayCount={count - 5}
        />
      </div>
    </div>
  );
};

export default React.memo(PostImageGrid);
