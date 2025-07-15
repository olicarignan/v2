"use client";

import { useState, useLayoutEffect } from "react";

export const useViewport = () => {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  useLayoutEffect(() => {
    const updateViewportDimensions = () => {
      // Use visualViewport if available (better for mobile with dynamic viewport)
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        setViewportWidth(window.visualViewport.width);
      } else {
        // Fallback to window.innerHeight/innerWidth
        setViewportHeight(window.innerHeight);
        setViewportWidth(window.innerWidth);
      }
    };

    // Initial measurement
    updateViewportDimensions();

    // Listen for resize events
    const handleResize = () => {
      updateViewportDimensions();
    };

    // Listen for visual viewport changes (mobile address bar, etc.)
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        setViewportWidth(window.visualViewport.width);
      }
    };

    window.addEventListener("resize", handleResize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        "resize",
        handleVisualViewportChange
      );
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          "resize",
          handleVisualViewportChange
        );
      }
    };
  }, []);

  return { viewportHeight, viewportWidth };
};
