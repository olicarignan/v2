"use client";

import { useState, useEffect, useRef } from "react";

export const useSnapToPosition = (
  momentum,
  isDragging,
  isKeyboardNavigating,
  activeThumbnail,
  scrollOffset,
  setScrollOffset,
  thumbnailRefs,
  clampOffsetFn
) => {
  const [isSnapping, setIsSnapping] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Don't snap if we have momentum, are dragging, or in keyboard navigation mode
    if (momentum !== 0 || isDragging || isKeyboardNavigating) return;

    // Don't snap on initial load - wait for user interaction
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }

    const snapTimeout = setTimeout(() => {
      const activeThumb = thumbnailRefs.current[activeThumbnail];
      if (!activeThumb) return;

      const thumbRect = activeThumb.getBoundingClientRect();
      const targetPosition = 16; // 16px from left edge
      const currentPosition = thumbRect.left;
      const snapDistance = targetPosition - currentPosition;

      // Only snap if we're more than 2px away from target
      if (Math.abs(snapDistance) > 2) {
        setIsSnapping(true);

        // Calculate the required scroll offset adjustment
        const requiredOffset = scrollOffset + snapDistance;
        const clampedOffset = clampOffsetFn(requiredOffset);

        // Animate to the snap position
        const startOffset = scrollOffset;
        const startTime = performance.now();
        const duration = 300; // 300ms snap animation

        const animateSnap = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function for smooth animation
          const easeOut = 1 - Math.pow(1 - progress, 3);

          const currentSnapOffset =
            startOffset + (clampedOffset - startOffset) * easeOut;
          setScrollOffset(currentSnapOffset);

          if (progress < 1) {
            requestAnimationFrame(animateSnap);
          } else {
            setIsSnapping(false);
          }
        };

        requestAnimationFrame(animateSnap);
      }
    }, 200); // Wait 200ms after momentum stops

    return () => clearTimeout(snapTimeout);
  }, [
    momentum,
    isDragging,
    isKeyboardNavigating,
    activeThumbnail,
    scrollOffset,
    setScrollOffset,
    thumbnailRefs,
    clampOffsetFn,
  ]);

  return isSnapping;
};
