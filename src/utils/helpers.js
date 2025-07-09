// Throttle function to limit how often a function can be called
export const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;

    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// RAF-based throttle for smoother animations
export const rafThrottle = (func) => {
  let rafId = null;
  return function (...args) {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, args);
        rafId = null;
      });
    }
  };
};

// Function to calculate width from image dimensions or aspect ratio
export const calculateImageWidth = (
  project,
  index,
  thumbnailHeight,
  imageLoadStates
) => {
  // Method 1: If aspect ratio is provided directly
  if (project.aspectRatio) {
    return Math.floor(thumbnailHeight * project.aspectRatio);
  }

  // Method 2: If width and height are provided
  if (project.width && project.height) {
    return Math.floor((project.width / project.height) * thumbnailHeight);
  }

  // Method 3: If image dimensions are loaded from imageLoadStates
  const loadState = imageLoadStates[project.id || index];
  if (loadState && loadState.naturalWidth && loadState.naturalHeight) {
    return Math.floor(
      (loadState.naturalWidth / loadState.naturalHeight) * thumbnailHeight
    );
  }

  // Fallback: square thumbnail while loading
  return thumbnailHeight;
};

// Calculate cumulative positions for each thumbnail
export const calculateThumbnailPositions = (thumbnailWidths, dynamicGap) => {
  return thumbnailWidths.reduce((acc, width, index) => {
    if (index === 0) {
      acc.push(0);
    } else {
      acc.push(acc[index - 1] + thumbnailWidths[index - 1] + dynamicGap);
    }
    return acc;
  }, []);
};

// Calculate total width of all thumbnails
export const calculateTotalWidth = (thumbnailPositions, thumbnailWidths) => {
  if (thumbnailPositions.length === 0) return 0;
  return (
    thumbnailPositions[thumbnailPositions.length - 1] +
    thumbnailWidths[thumbnailWidths.length - 1]
  );
};

// Clamp offset within boundaries
export const clampOffset = (offset, minOffset, maxOffset) => {
  return Math.max(minOffset, Math.min(maxOffset, offset));
};

// Calculate which thumbnail should be active based on offset
export const calculateActiveThumbnail = (offset, thumbnailPositions) => {
  if (thumbnailPositions.length === 0) return 0;

  const adjustedOffset = -offset;

  // Find which thumbnail position is closest to the current offset
  let closestIndex = 0;
  let closestDistance = Math.abs(adjustedOffset - thumbnailPositions[0]);

  for (let i = 1; i < thumbnailPositions.length; i++) {
    const distance = Math.abs(adjustedOffset - thumbnailPositions[i]);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
};