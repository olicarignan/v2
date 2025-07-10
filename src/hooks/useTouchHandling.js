"use client";

import { useState, useEffect } from "react";

export const useTouchHandling = (
  projectList,
  scrollOffset,
  setScrollOffset,
  clampOffsetFn,
  setIsKeyboardNavigating,
  isTouchDevice = false // Add this parameter
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0, time: 0 });
  const [momentum, setMomentum] = useState(0);
  const [lastTouchMove, setLastTouchMove] = useState({ x: 0, time: 0 });

  // Touch event handlers
  useEffect(() => {
    if (projectList.length === 0) return;

    const handleTouchStart = (e) => {
      setIsKeyboardNavigating(false);

      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX,
        offset: scrollOffset,
        time: Date.now(),
      });
      setMomentum(0);

      // Store initial touch position for velocity calculation
      setLastTouchMove({
        x: touch.clientX,
        time: Date.now(),
      });
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;

      // Prevent default to avoid page scrolling
      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const newOffset = dragStart.offset + deltaX;
      const clampedOffset = clampOffsetFn(newOffset);

      setScrollOffset(clampedOffset);

      // Update last touch position for velocity calculation (only if momentum is enabled)
      if (!isTouchDevice) {
        setLastTouchMove({
          x: touch.clientX,
          time: Date.now(),
        });
      }
    };

    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      setIsDragging(false);

      // Only calculate momentum on non-touch devices (for trackpad/mouse drag simulation)
      if (!isTouchDevice) {
        // Calculate velocity for momentum
        const endTime = Date.now();
        const timeDiff = endTime - lastTouchMove.time;
        const touch = e.changedTouches[0];
        const distanceDiff = touch.clientX - lastTouchMove.x;

        if (timeDiff > 0 && timeDiff < 100) {
          // Only use recent movement
          const velocity = (distanceDiff / timeDiff) * 16; // Scale for smooth momentum
          if (Math.abs(velocity) > 1) {
            setMomentum(velocity);
          }
        }
      }
    };

    // Add event listeners to document for better touch handling
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    isDragging,
    dragStart,
    scrollOffset,
    lastTouchMove,
    projectList.length,
    clampOffsetFn,
    setIsKeyboardNavigating,
    setScrollOffset,
    isTouchDevice, // Add this dependency
  ]);

  return { isDragging, momentum, setMomentum };
};
