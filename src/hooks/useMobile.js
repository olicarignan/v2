"use client";

import { useState, useLayoutEffect } from "react";

export function useMobile(breakpoint = 768) {
  // Initialize with a function to get immediate value
  const [isMobile, setIsMobile] = useState(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      return window.innerWidth < breakpoint;
    }
    // Default to false for SSR
    return false;
  });

  useLayoutEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Set initial value immediately
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [breakpoint]);

  return isMobile;
}
