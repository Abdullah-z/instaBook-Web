import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * ImageView Component
 * Provides a full-screen modal for viewing images with animations.
 *
 * @param {boolean} isOpen - Controls visibility of the modal
 * @param {Array} images - Array of images
 * @param {string} imageUrl - Fallback for single image url
 * @param {number} initialIndex - The initial index of the image to display
 * @param {function} onClose - Function to call when closing the modal
 */
const ImageView = ({ isOpen, images, imageUrl, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const imageList = images || (imageUrl ? [imageUrl] : []);

  if (!isOpen || imageList.length === 0) return null;

  const currentImage = typeof imageList[currentIndex] === 'string' 
    ? imageList[currentIndex] 
    : imageList[currentIndex]?.url;
  
  if (!currentImage) return null;

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = currentImage;
    link.download = "image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this image",
          url: currentImage,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(currentImage);
      alert("Link copied to clipboard!");
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < imageList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
        >
          {/* Controls */}
          <div className="absolute top-6 right-6 flex items-center gap-4 z-[5001]">
            <button
              onClick={handleDownload}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10"
              title="Download"
            >
              <Download size={24} />
            </button>
            <button
              onClick={handleShare}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10"
              title="Share"
            >
              <Share2 size={24} />
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>

          {imageList.length > 1 && currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10 z-[5001]"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {imageList.length > 1 && currentIndex < imageList.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10 z-[5001]"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Image Container */}
          <motion.div
            key={currentIndex}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-full max-h-full flex items-center justify-center"
          >
            <img
              src={currentImage}
              alt="Full Screen View"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageView;
