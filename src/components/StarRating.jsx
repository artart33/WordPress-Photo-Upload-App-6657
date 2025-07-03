import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiStar } = FiIcons;

const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (starValue) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue) => {
    if (!readonly) {
      setHoverRating(starValue);
    }
  };

  const handleStarLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <motion.button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            onMouseLeave={handleStarLeave}
            className={`p-1 transition-all duration-200 ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            whileHover={readonly ? {} : { scale: 1.1 }}
            whileTap={readonly ? {} : { scale: 0.9 }}
            disabled={readonly}
          >
            <SafeIcon
              icon={FiStar}
              className={`text-xl transition-all duration-200 ${
                isFilled
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
              style={{
                fill: isFilled ? 'currentColor' : 'none',
                stroke: 'currentColor',
                strokeWidth: isFilled ? 0 : 2
              }}
            />
          </motion.button>
        );
      })}
      {!readonly && (
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating}/5` : 'Beoordeel deze foto'}
        </span>
      )}
    </div>
  );
};

export default StarRating;