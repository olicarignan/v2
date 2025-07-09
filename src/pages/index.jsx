'use client'

import { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo
 } from "react";
import ResizeObserver from "resize-observer-polyfill";

import { elementsOverlap } from '@/utils/elementsOverlap';

import { getPropData } from '@/utils/propData';
import { getHome } from '@/utils/queries';
import { rafThrottle } from '@/utils/rafThrottle';
import { throttle } from '@/utils/throttle';

export default function Home({home, thumbnailHeightVh = 12}) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeThumbnail, setActiveThumbnail] = useState(0);
  const [imageLoadStates, setImageLoadStates] = useState({});
  const [viewportHeight, setViewportHeight] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const thumbnailRefs = useRef([]);
  const cursorRef = useRef(null);

  // Touch handling state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0, time: 0 });
  const [momentum, setMomentum] = useState(0);
  const [lastTouchMove, setLastTouchMove] = useState({ x: 0, time: 0 });

  // Track if we're in keyboard navigation mode to prevent interference
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);

  // Add this after the existing state declarations
  const [isSnapping, setIsSnapping] = useState(false);

  // Calculate thumbnail height based on viewport height
  const thumbnailHeight = useMemo(() => {
    if (viewportHeight === 0) return 75; // Fallback while measuring
    return Math.floor((viewportHeight * thumbnailHeightVh) / 100);
  }, [viewportHeight, thumbnailHeightVh]);

  // Calculate dynamic gap: clamped between 8px and 0.5vw
  const dynamicGap = useMemo(() => {
    if (viewportWidth === 0) return 8; // Fallback while measuring
    const halfVw = (viewportWidth * 0.5) / 100; // 0.5vw in pixels
    return Math.max(8, halfVw); // Clamp minimum to 8px
  }, [viewportWidth]);

  // Update viewport height and width on mount and resize
  useEffect(() => {
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

  const projectList = home.assets;

  // Function to calculate width from image dimensions or aspect ratio
  const calculateImageWidth = (project, index) => {
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

  // Generate thumbnail widths based on image aspect ratios
  const generatedThumbnailWidths = useMemo(() => {
    return projectList.map((project, index) =>
      calculateImageWidth(project, index)
    );
  }, [projectList, thumbnailHeight, imageLoadStates]);

  // Load image dimensions for projects that don't have aspect ratio data
  useEffect(() => {
    const loadImageDimensions = async () => {
      const newLoadStates = { ...imageLoadStates };
      let hasChanges = false;

      for (let i = 0; i < projectList.length; i++) {
        const project = projectList[i];
        const projectKey = project.id || i;

        // Skip if we already have dimensions or aspect ratio
        if (
          project.aspectRatio ||
          (project.width && project.height) ||
          newLoadStates[projectKey]
        ) {
          continue;
        }

        // Skip if no image URL
        if (!project.imageUrl) {
          continue;
        }

        try {
          const img = new Image();
          img.crossOrigin = "anonymous"; // Handle CORS for external images

          await new Promise((resolve, reject) => {
            img.onload = () => {
              newLoadStates[projectKey] = {
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                loaded: true,
              };
              hasChanges = true;
              resolve();
            };
            img.onerror = () => {
              newLoadStates[projectKey] = {
                naturalWidth: thumbnailHeight,
                naturalHeight: thumbnailHeight,
                loaded: true,
                error: true,
              };
              hasChanges = true;
              resolve(); // Don't reject, just use fallback
            };
            img.src = project.imageUrl;
          });
        } catch (error) {
          console.warn(
            `Failed to load image for project ${projectKey}:`,
            error
          );
          newLoadStates[projectKey] = {
            naturalWidth: thumbnailHeight,
            naturalHeight: thumbnailHeight,
            loaded: true,
            error: true,
          };
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setImageLoadStates(newLoadStates);
      }
    };

    // Only load images if we have a valid thumbnail height
    if (thumbnailHeight > 0) {
      loadImageDimensions();
    }
  }, [projectList, thumbnailHeight]);

  // Calculate cumulative positions for each thumbnail
  const thumbnailPositions = useMemo(() => {
    return generatedThumbnailWidths.reduce((acc, width, index) => {
      if (index === 0) {
        acc.push(0);
      } else {
        acc.push(
          acc[index - 1] + generatedThumbnailWidths[index - 1] + dynamicGap
        );
      }
      return acc;
    }, []);
  }, [generatedThumbnailWidths, dynamicGap]);

  // Calculate total width of all thumbnails
  const totalWidth = useMemo(() => {
    if (thumbnailPositions.length === 0) return 0;
    return (
      thumbnailPositions[thumbnailPositions.length - 1] +
      generatedThumbnailWidths[generatedThumbnailWidths.length - 1]
    );
  }, [thumbnailPositions, generatedThumbnailWidths]);

  // Boundary calculations
  const maxOffset = 0; // First thumbnail at 0 position
  const minOffset = useMemo(() => {
    if (generatedThumbnailWidths.length === 0) return 0;
    return -totalWidth + generatedThumbnailWidths[0];
  }, [totalWidth, generatedThumbnailWidths]);

  const clampOffset = (offset) => {
    return Math.max(minOffset, Math.min(maxOffset, offset));
  };

  const calculateActiveThumbnail = (offset) => {
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

  // Reset active thumbnail when projects change
  useEffect(() => {
    if (activeThumbnail >= projectList.length) {
      setActiveThumbnail(0);
      setScrollOffset(0);
    }
  }, [projectList.length, activeThumbnail]);

  // Remove the IntersectionObserver effect and replace with collision detection
  useEffect(() => {
    if (!cursorRef.current || projectList.length === 0) return;

    const checkCollisions = () => {
      if (isKeyboardNavigating) return;

      let activeIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      thumbnailRefs.current.forEach((thumbnail, index) => {
        if (!thumbnail) return;

        const thumbnailRect = thumbnail.getBoundingClientRect();

        // Calculate distance from thumbnail's left edge to 16px from viewport left
        const targetPosition = 16; // 16px from left side of viewport
        const distance = Math.abs(thumbnailRect.left - targetPosition);

        // Find the thumbnail whose left edge is closest to exactly 16px from viewport left
        if (distance < closestDistance) {
          closestDistance = distance;
          activeIndex = index;
        }
      });

      // Only set active if we found a valid thumbnail
      if (activeIndex < projectList.length) {
        setActiveThumbnail(activeIndex);
      }
    };

    // Check collisions on scroll offset changes
    checkCollisions();
  }, [scrollOffset, isKeyboardNavigating, projectList.length]);

  // Also check collisions on window resize
  useEffect(() => {
    if (projectList.length === 0) return;

    const handleResize = () => {
      if (!isKeyboardNavigating) {
        const checkCollisions = () => {
          if (!cursorRef.current) return;

          let activeIndex = 0;
          let closestDistance = Number.POSITIVE_INFINITY;

          thumbnailRefs.current.forEach((thumbnail, index) => {
            if (!thumbnail) return;

            const thumbnailRect = thumbnail.getBoundingClientRect();

            // Calculate distance from thumbnail's left edge to 16px from viewport left
            const targetPosition = 16; // 16px from left side of viewport
            const distance = Math.abs(thumbnailRect.left - targetPosition);

            // Find the thumbnail whose left edge is closest to exactly 16px from viewport left
            if (distance < closestDistance) {
              closestDistance = distance;
              activeIndex = index;
            }
          });

          // Only set active if we found a valid thumbnail
          if (activeIndex < projectList.length) {
            setActiveThumbnail(activeIndex);
          }
        };

        // Use RAF to avoid excessive calculations during resize
        requestAnimationFrame(checkCollisions);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isKeyboardNavigating, projectList.length]);

  useEffect(() => {
    if (projectList.length === 0) return;

    const handleWheel = rafThrottle((e) => {
      e.preventDefault();

      // Reset keyboard navigation mode
      setIsKeyboardNavigating(false);

      const scrollDelta = e.deltaY + e.deltaX;

      setScrollOffset((prev) => {
        const newOffset = prev - scrollDelta * 0.5;
        const clampedOffset = clampOffset(newOffset);
        return clampedOffset;
      });
    });

    // Separate throttled function for active thumbnail calculation
    const updateActiveThumbnail = throttle((offset) => {
      const calculatedActive = calculateActiveThumbnail(offset);
      setActiveThumbnail(calculatedActive);
    }, 16); // ~60fps

    // Listen for scroll offset changes to update active thumbnail
    const unsubscribe = () => {
      updateActiveThumbnail(scrollOffset);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [projectList.length, thumbnailPositions, minOffset, maxOffset]);

  // Separate effect to update active thumbnail when scroll offset changes
  useEffect(() => {
    const updateActiveThumbnail = throttle((offset) => {
      if (!isKeyboardNavigating) {
        const calculatedActive = calculateActiveThumbnail(offset);
        setActiveThumbnail(calculatedActive);
      }
    }, 16);

    updateActiveThumbnail(scrollOffset);
  }, [scrollOffset, isKeyboardNavigating, thumbnailPositions]);

  // Touch event handlers - simplified and working version
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
      const clampedOffset = clampOffset(newOffset);

      setScrollOffset(clampedOffset);

      // Update last touch position for velocity calculation
      setLastTouchMove({
        x: touch.clientX,
        time: Date.now(),
      });
    };

    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      setIsDragging(false);

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
  }, [isDragging, dragStart, scrollOffset, lastTouchMove, projectList.length]);

  // Enhanced momentum handling with snap-to-position
  useEffect(() => {
    if (momentum === 0 || projectList.length === 0) return;

    let animationId;

    const applyMomentum = () => {
      setMomentum((prevMomentum) => {
        const newMomentum = prevMomentum * 0.95; // Decay factor

        if (Math.abs(newMomentum) < 0.1) {
          return 0; // Stop momentum when it's too small
        }

        setScrollOffset((currentOffset) => {
          const newOffset = currentOffset + newMomentum;
          return clampOffset(newOffset);
        });

        // Continue animation
        animationId = requestAnimationFrame(applyMomentum);
        return newMomentum;
      });
    };

    animationId = requestAnimationFrame(applyMomentum);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [momentum, projectList.length]);

  // Add snap-to-position effect that triggers when momentum stops
  useEffect(() => {
    if (momentum !== 0 || isDragging || isKeyboardNavigating) return;

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
        const clampedOffset = clampOffset(requiredOffset);

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
  ]);

  // Keyboard navigation
  useEffect(() => {
    if (projectList.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();

        // Set keyboard navigation mode to prevent interference
        setIsKeyboardNavigating(true);

        const currentActive = activeThumbnail;
        let newActive;

        if (e.key === "ArrowLeft") {
          // Don't go below 0 (first thumbnail)
          newActive = currentActive > 0 ? currentActive - 1 : currentActive;
        } else {
          // Don't go above last thumbnail
          newActive =
            currentActive < projectList.length - 1
              ? currentActive + 1
              : currentActive;
        }

        // Only update if we actually changed thumbnails
        if (newActive !== currentActive) {
          // Update active thumbnail immediately
          setActiveThumbnail(newActive);

          // Calculate the offset needed to align this thumbnail at position 0
          const targetOffset = -thumbnailPositions[newActive];
          const clampedOffset = clampOffset(targetOffset);

          setScrollOffset(clampedOffset);
        }

        // Reset keyboard navigation mode after a short delay
        setTimeout(() => {
          setIsKeyboardNavigating(false);
        }, 300);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [projectList.length, thumbnailPositions, activeThumbnail]);

  const handleThumbnailClick = (index) => {
    if (index >= thumbnailPositions.length) return;

    // Reset keyboard navigation mode
    setIsKeyboardNavigating(false);

    const targetOffset = -thumbnailPositions[index];
    const clampedOffset = clampOffset(targetOffset);

    setScrollOffset(clampedOffset);
    setActiveThumbnail(index);
  };

  return (
    <main className="work">
      <div className="scroll-container">
        <div
          style={{ transform: `translateX(${scrollOffset}px)`, gap: dynamicGap }}
          className="work__container"
        >
          <div
            className="featured"
            style={{ transform: `translateX(${-scrollOffset}px)` }}
          >
            <img
              src={home.assets[activeThumbnail].url}
              alt={home.assets[activeThumbnail].alt}
            />
          </div>
          <div className="cursor" ref={cursorRef} style={{ transform: `translateX(${-scrollOffset}px)` }} />
          {home.assets.map((asset, index) => {
            return (
              <div
                className={`item${index === activeThumbnail ? " active" : ""}`}
                key={asset.id}
                ref={(el) => (thumbnailRefs.current[index] = el)}
                onClick={() => handleThumbnailClick(i)}
              >
                <img src={asset.url} alt={asset.alt} />
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export const getStaticProps = async () => {

  const home = await getPropData(getHome);

  return {
    props: {
      ...home
    },
  };

}