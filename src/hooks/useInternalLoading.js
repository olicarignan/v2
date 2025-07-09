"use client";

import { useState, useEffect } from "react";

export const useInternalLoading = (projects, isLoading, onLoadComplete) => {
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalProgress, setInternalProgress] = useState(0);

  useEffect(() => {
    if (isLoading) return; // Use external loading state

    if (projects.length === 0) {
      // Simulate loading for default projects
      const loadingInterval = setInterval(() => {
        setInternalProgress((prev) => {
          if (prev >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
              setInternalLoading(false);
              if (onLoadComplete) onLoadComplete();
            }, 500); // Small delay for smooth transition
            return 100;
          }
          return prev + Math.random() * 15 + 5; // Random increment between 5-20
        });
      }, 100);

      return () => clearInterval(loadingInterval);
    } else {
      // If projects are provided, skip internal loading
      setInternalLoading(false);
    }
  }, [projects.length, isLoading, onLoadComplete]);

  return { internalLoading, internalProgress };
};
