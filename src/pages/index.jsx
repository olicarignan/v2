'use client'

import { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo
 } from "react";
import ResizeObserver from "resize-observer-polyfill";

import { elementsOverlap } from '@/utils/elementsOverlap';

import { getPropData } from '@/utils/propData';
import { getHome } from '@/utils/queries';

export default function Home({home, thumbnailHeight = 75, gap = 8}) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeThumbnail, setActiveThumbnail] = useState(0);
  const [imageLoadStates, setImageLoadStates] = useState({});
  const thumbnailRefs = useRef([]);
  const cursorRef = useRef(null);
  const observerRef = useRef(null);

  // Touch handling state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
  const [momentum, setMomentum] = useState(0);

  // Track if we're in keyboard navigation mode to prevent interference
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);

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

    loadImageDimensions();
  }, [projectList, thumbnailHeight]);

  // Calculate cumulative positions for each thumbnail
  const thumbnailPositions = useMemo(() => {
    return generatedThumbnailWidths.reduce((acc, width, index) => {
      if (index === 0) {
        acc.push(0);
      } else {
        acc.push(acc[index - 1] + generatedThumbnailWidths[index - 1] + gap);
      }
      return acc;
    }, []);
  }, [generatedThumbnailWidths, gap]);

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

  // Set up IntersectionObserver for the cursor
  useEffect(() => {
    if (!cursorRef.current || projectList.length === 0) return;

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      // Don't update active thumbnail if we're in keyboard navigation mode
      if (isKeyboardNavigating) return;

      let maxIntersection = 0;
      let activeIndex = 0;

      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > maxIntersection) {
          maxIntersection = entry.intersectionRatio;
          activeIndex = Number.parseInt(entry.target.dataset.index);
        }
      });

      if (maxIntersection > 0 && activeIndex < projectList.length) {
        setActiveThumbnail(activeIndex);
      }
    }, options);

    // Initial observation of all thumbnails
    thumbnailRefs.current.forEach((thumbnail) => {
      if (thumbnail) {
        observerRef.current.observe(thumbnail);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [projectList.length, isKeyboardNavigating]);

  useEffect(() => {
    if (projectList.length === 0) return;

    const handleWheel = (e) => {
      e.preventDefault();

      // Reset keyboard navigation mode
      setIsKeyboardNavigating(false);

      const scrollDelta = e.deltaY + e.deltaX;

      setScrollOffset((prev) => {
        const newOffset = prev - scrollDelta * 0.5;
        const clampedOffset = clampOffset(newOffset);

        const calculatedActive = calculateActiveThumbnail(clampedOffset);
        setActiveThumbnail(calculatedActive);

        return clampedOffset;
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [projectList.length, thumbnailPositions, minOffset, maxOffset]);

  // Touch event handlers
  useEffect(() => {
    if (projectList.length === 0) return;

    const handleTouchStart = (e) => {
      // Reset keyboard navigation mode
      setIsKeyboardNavigating(false);

      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX,
        offset: scrollOffset,
      });
      setMomentum(0);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const newOffset = dragStart.offset + deltaX;
      const clampedOffset = clampOffset(newOffset);

      setScrollOffset(clampedOffset);

      const calculatedActive = calculateActiveThumbnail(clampedOffset);
      setActiveThumbnail(calculatedActive);
    };

    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      setIsDragging(false);

      const touch = e.changedTouches[0];
      const finalDelta = touch.clientX - dragStart.x;
      const momentumValue = finalDelta * 0.1;

      setMomentum(momentumValue);
    };

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
  }, [isDragging, dragStart, scrollOffset, projectList.length]);

  // Apply momentum after touch ends
  useEffect(() => {
    if (momentum === 0 || projectList.length === 0) return;

    const applyMomentum = () => {
      setMomentum((prev) => {
        const newMomentum = prev * 0.95;

        if (Math.abs(newMomentum) < 0.1) {
          return 0;
        }

        setScrollOffset((currentOffset) => {
          const newOffset = currentOffset + newMomentum;
          const clampedOffset = clampOffset(newOffset);

          const calculatedActive = calculateActiveThumbnail(clampedOffset);
          setActiveThumbnail(calculatedActive);

          return clampedOffset;
        });

        return newMomentum;
      });
    };

    const intervalId = setInterval(applyMomentum, 16);

    return () => clearInterval(intervalId);
  }, [momentum, projectList.length]);

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

  // // Cursor interaction
  // useLayoutEffect(() => {
  //   const cursor = cursorRef.current.getBoundingClientRect();
  //   const items = itemRefs.current;
  //   for (let i = 0; i < items.length; i++) {
  //     const item = items[i].getBoundingClientRect();
  //     if (elementsOverlap(item, cursor)) {
  //       requestAnimationFrame(() => setActiveIndex(i));
  //     }
  //   }
  // }, [cursorRef, yProgress]);

  return (
    <main className="work">
      <div className="scroll-container">
        <div
          // ref={scrollRef}
          style={{ transform: `translateX(${scrollOffset}px)` }}
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
          <div className="cursor" ref={cursorRef} />
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