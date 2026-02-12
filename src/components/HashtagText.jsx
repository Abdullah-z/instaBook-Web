import React from "react";
import { Link, useNavigate } from "react-router-dom";

const HashtagText = ({ text }) => {
  if (!text) return null;

  // Split by spaces but keep the delimiters to preserve structure if needed,
  // though simple split by space is usually enough for basic parsing.
  // The mobile version splits by (\s+).
  const parts = text.split(/(\s+)/);

  return (
    <span className="text-inherit">
      {parts.map((part, index) => {
        if (part.startsWith("#")) {
          // Hashtag -> Search
          return (
            <Link
              key={index}
              to={`/search?q=${encodeURIComponent(part)}`}
              className="text-primary font-light hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith("@")) {
          // Mention -> Profile (assuming we have a profile route /profile/:username or similar)
          // For now, let's just make it a bold text or link to a profile search
          const username = part.slice(1);
          return (
            <Link
              key={index}
              to={`/profile/${username}`} // Adjust route as per app structure
              className="text-primary font-light hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return part;
      })}
    </span>
  );
};

export default HashtagText;
