"use client";

import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { motion }  from "motion/react"

import { useViewport } from "@/hooks/useViewport";

import {
  calculateImageWidth,
  calculateThumbnailPositions,
  calculateTotalWidth,
  clampOffset,
} from "@/utils/helpers";
import { anim } from "@/utils/animate";
import Layout from "@/layouts/Layout";

export default function Home({
  home,
  thumbnailHeightVh = 12,
  projects = [],
}) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeThumbnail, setActiveThumbnail] = useState(0);
  const [currentPage, setCurrentPage] = useState("WORK");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);

  // Refs
  const thumbnailRefs = useRef([]);
  const thumbnailGridRef = useRef(null);
  const cursorRef = useRef(null);
  const animationFrameRef = useRef(null);
  const momentumRef = useRef(0);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startOffset: 0,
    lastX: 0,
    lastTime: 0,
  });
  const lastScrollTimeRef = useRef(0);
  const snapTimeoutRef = useRef(null);
  const currentScrollOffsetRef = useRef(0); // Track current offset for momentum
  const featuredRef = useRef(null);

  // Custom hooks
  const { viewportHeight, viewportWidth } = useViewport();

  // Memoized calculations
  const thumbnailHeight = useMemo(() => {
    if (viewportHeight === 0) return 75;
    return Math.floor((viewportHeight * thumbnailHeightVh) / 100);
  }, [viewportHeight, thumbnailHeightVh]);

  const dynamicGap = useMemo(() => {
    if (viewportWidth === 0) return 8;
    const halfVw = (viewportWidth * 0.5) / 100;
    return Math.round(Math.max(8, halfVw));
  }, [viewportWidth]);

  const projectList = home.assets;

  const generatedThumbnailWidths = useMemo(() => {
    return projectList.map((project, index) =>
      calculateImageWidth(project, index, thumbnailHeight)
    );
  }, [projectList, thumbnailHeight]);

  const thumbnailPositions = useMemo(() => {
    return calculateThumbnailPositions(generatedThumbnailWidths, dynamicGap);
  }, [generatedThumbnailWidths, dynamicGap]);

  const totalWidth = useMemo(() => {
    return calculateTotalWidth(thumbnailPositions, generatedThumbnailWidths);
  }, [thumbnailPositions, generatedThumbnailWidths]);

  const { minOffset, maxOffset } = useMemo(() => {
    const max = 0;
    const min =
      generatedThumbnailWidths.length === 0
        ? 0
        : -(thumbnailPositions[thumbnailPositions.length - 1] + 16);
    return { minOffset: min, maxOffset: max };
  }, [thumbnailPositions, generatedThumbnailWidths.length]);

  // Performance-optimized scroll update
  const updateScrollTransform = useCallback((offset) => {
    if (thumbnailGridRef.current) {
      thumbnailGridRef.current.style.transform = `translate3d(${offset}px, 0, 0)`;
    }
    currentScrollOffsetRef.current = offset; // Keep ref in sync
  }, []);

  // Active thumbnail detection based on scroll offset (not DOM position)
  const updateActiveThumbnailFromOffset = useCallback(
    (offset) => {
      if (
        isKeyboardNavigating ||
        projectList.length === 0 ||
        thumbnailPositions.length === 0
      )
        return;

      const adjustedOffset = -offset;
      let closestIndex = 0;
      let closestDistance = Math.abs(adjustedOffset - thumbnailPositions[0]);

      for (let i = 1; i < thumbnailPositions.length; i++) {
        const distance = Math.abs(adjustedOffset - thumbnailPositions[i]);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }

      if (closestIndex < projectList.length) {
        setActiveThumbnail(closestIndex);
      }
    },
    [isKeyboardNavigating, projectList.length, thumbnailPositions]
  );

  // Active thumbnail detection based on DOM position (for final alignment check)
  const updateActiveThumbnailFromDOM = useCallback(() => {
    if (isKeyboardNavigating || projectList.length === 0) return;

    let activeIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    thumbnailRefs.current.forEach((thumbnail, index) => {
      if (!thumbnail) return;

      const thumbnailRect = thumbnail.getBoundingClientRect();
      const targetPosition = 16; // 16px from left side of viewport
      const distance = Math.abs(thumbnailRect.left - targetPosition);

      if (distance < closestDistance) {
        closestDistance = distance;
        activeIndex = index;
      }
    });

    if (activeIndex < projectList.length) {
      setActiveThumbnail(activeIndex);
    }
  }, [isKeyboardNavigating, projectList.length]);

  // Snap to position function
  const snapToPosition = useCallback(() => {
    if (momentumRef.current !== 0 || isDragging || isKeyboardNavigating) return;

    const activeThumb = thumbnailRefs.current[activeThumbnail];
    if (!activeThumb) return;

    const thumbRect = activeThumb.getBoundingClientRect();
    const targetPosition = 16; // 16px from left edge
    const currentPosition = thumbRect.left;
    const snapDistance = targetPosition - currentPosition;

    // More sensitive snapping on mobile (1px threshold vs 2px)
    const snapThreshold = isTouchDevice ? 1 : 2;
    if (Math.abs(snapDistance) > snapThreshold) {
      const requiredOffset = currentScrollOffsetRef.current + snapDistance;
      const clampedOffset = clampOffset(requiredOffset, minOffset, maxOffset);

      // Faster snap animation on mobile
      const duration = isTouchDevice ? 200 : 300;
      const startOffset = currentScrollOffsetRef.current;
      const startTime = performance.now();

      const animateSnap = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Slightly different easing for mobile (more responsive)
        const easeOut = isTouchDevice
          ? 1 - Math.pow(1 - progress, 2.5) // Slightly less aggressive easing
          : 1 - Math.pow(1 - progress, 3);

        const currentSnapOffset =
          startOffset + (clampedOffset - startOffset) * easeOut;
        setScrollOffset(currentSnapOffset);
        updateScrollTransform(currentSnapOffset);

        // Update active thumbnail during snap animation
        updateActiveThumbnailFromOffset(currentSnapOffset);

        if (progress < 1) {
          requestAnimationFrame(animateSnap);
        }
      };

      requestAnimationFrame(animateSnap);
    }
  }, [
    activeThumbnail,
    minOffset,
    maxOffset,
    updateScrollTransform,
    isDragging,
    isKeyboardNavigating,
    isTouchDevice,
    updateActiveThumbnailFromOffset,
  ]);

  // Single RAF loop for all animations with improved active element tracking
  const startAnimationLoop = useCallback(() => {
    if (animationFrameRef.current) return;

    const animate = () => {
      let needsUpdate = false;

      // Apply momentum with mobile-friendly decay
      if (
        Math.abs(momentumRef.current) > 0.1 &&
        !dragStateRef.current.isDragging
      ) {
        // Different decay rates for touch vs non-touch devices
        const decayRate = isTouchDevice ? 0.92 : 0.95; // Slower decay on mobile for longer momentum
        momentumRef.current *= decayRate;

        const newOffset = clampOffset(
          currentScrollOffsetRef.current + momentumRef.current,
          minOffset,
          maxOffset
        );

        setScrollOffset(newOffset);
        updateScrollTransform(newOffset);

        // Update active thumbnail immediately during momentum
        updateActiveThumbnailFromOffset(newOffset);

        needsUpdate = true;

        // Lower threshold for mobile to allow longer momentum
        const stopThreshold = isTouchDevice ? 0.05 : 0.1;
        if (Math.abs(momentumRef.current) < stopThreshold) {
          momentumRef.current = 0;
          // Trigger snap after momentum stops (shorter delay on mobile)
          setTimeout(snapToPosition, isTouchDevice ? 100 : 200);
        }
      }

      if (needsUpdate || Math.abs(momentumRef.current) > 0.1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [
    minOffset,
    maxOffset,
    updateScrollTransform,
    updateActiveThumbnailFromOffset,
    snapToPosition,
    isTouchDevice,
  ]);

  // Touch device detection
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    };
    checkTouchDevice();
    window.addEventListener("resize", checkTouchDevice);
    return () => window.removeEventListener("resize", checkTouchDevice);
  }, []);

  // Optimized wheel handler
  useEffect(() => {
    if (projectList.length === 0) return;

    let ticking = false;

    const handleWheel = (e) => {
      e.preventDefault();
      setIsKeyboardNavigating(false);

      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollDelta = e.deltaY + e.deltaX;
          momentumRef.current = 0; // Reset momentum on wheel

          const newOffset = clampOffset(
            currentScrollOffsetRef.current - scrollDelta * 0.5,
            minOffset,
            maxOffset
          );

          setScrollOffset(newOffset);
          updateScrollTransform(newOffset);

          // Update active thumbnail immediately
          updateActiveThumbnailFromOffset(newOffset);

          // Clear any existing snap timeout and set a new one
          if (snapTimeoutRef.current) {
            clearTimeout(snapTimeoutRef.current);
          }
          snapTimeoutRef.current = setTimeout(snapToPosition, 200);

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [
    projectList.length,
    minOffset,
    maxOffset,
    updateScrollTransform,
    snapToPosition,
    updateActiveThumbnailFromOffset,
  ]);

  // Touch handling with proper mobile momentum and snapping
  useEffect(() => {
    if (projectList.length === 0) return;

    const handleTouchStart = (e) => {
      setIsKeyboardNavigating(false);
      const touch = e.touches[0];

      dragStateRef.current = {
        isDragging: true,
        startX: touch.clientX,
        startOffset: currentScrollOffsetRef.current,
        lastX: touch.clientX,
        lastTime: performance.now(),
        velocityHistory: [], // Track velocity over time for better momentum
      };
      setIsDragging(true);
      momentumRef.current = 0;

      // Clear any existing snap timeout
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }

      if (thumbnailGridRef.current) {
        thumbnailGridRef.current.style.transition = "none";
      }
    };

    const handleTouchMove = (e) => {
      if (!dragStateRef.current.isDragging) return;
      e.preventDefault();

      const touch = e.touches[0];
      const currentTime = performance.now();
      const deltaX = touch.clientX - dragStateRef.current.startX;
      const newOffset = clampOffset(
        dragStateRef.current.startOffset + deltaX,
        minOffset,
        maxOffset
      );

      setScrollOffset(newOffset);
      updateScrollTransform(newOffset);

      // Update active thumbnail immediately during drag
      updateActiveThumbnailFromOffset(newOffset);

      // Track velocity history for smoother momentum calculation
      const timeDelta = currentTime - dragStateRef.current.lastTime;
      const positionDelta = touch.clientX - dragStateRef.current.lastX;

      if (timeDelta > 0) {
        const velocity = positionDelta / timeDelta;

        // Keep a rolling history of recent velocities
        dragStateRef.current.velocityHistory.push({
          velocity,
          time: currentTime,
        });

        // Keep only recent history (last 100ms)
        dragStateRef.current.velocityHistory =
          dragStateRef.current.velocityHistory.filter(
            (entry) => currentTime - entry.time < 100
          );
      }

      dragStateRef.current.lastX = touch.clientX;
      dragStateRef.current.lastTime = currentTime;
    };

    const handleTouchEnd = (e) => {
      if (!dragStateRef.current.isDragging) return;

      dragStateRef.current.isDragging = false;
      setIsDragging(false);

      // Calculate momentum based on velocity history
      let finalVelocity = 0;

      if (dragStateRef.current.velocityHistory.length > 0) {
        // Average the recent velocities for smoother momentum
        const recentVelocities = dragStateRef.current.velocityHistory.slice(-3); // Last 3 samples
        finalVelocity =
          recentVelocities.reduce((sum, entry) => sum + entry.velocity, 0) /
          recentVelocities.length;

        // Scale velocity for momentum (higher multiplier for mobile)
        const velocityMultiplier = isTouchDevice ? 20 : 16;
        finalVelocity *= velocityMultiplier;

        // Apply minimum threshold and maximum cap
        if (Math.abs(finalVelocity) > 2) {
          finalVelocity =
            Math.sign(finalVelocity) * Math.min(Math.abs(finalVelocity), 50); // Cap max velocity
          momentumRef.current = finalVelocity;
          startAnimationLoop();
        } else {
          // No significant momentum, snap immediately
          setTimeout(snapToPosition, 150); // Shorter delay on mobile
        }
      } else {
        // No velocity data, snap immediately
        setTimeout(snapToPosition, 150);
      }

      // Re-enable transitions after a delay
      setTimeout(() => {
        if (thumbnailGridRef.current && !isTouchDevice) {
          thumbnailGridRef.current.style.transition = "transform 0.3s ease-out";
        }
      }, 50);
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
  }, [
    projectList.length,
    minOffset,
    maxOffset,
    updateScrollTransform,
    isTouchDevice,
    startAnimationLoop,
    snapToPosition,
    updateActiveThumbnailFromOffset,
  ]);

  // Keyboard navigation
  useEffect(() => {
    if (projectList.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setIsKeyboardNavigating(true);
        momentumRef.current = 0;

        // Clear any existing snap timeout
        if (snapTimeoutRef.current) {
          clearTimeout(snapTimeoutRef.current);
        }

        const currentActive = activeThumbnail;
        let newActive;

        if (e.key === "ArrowLeft") {
          newActive = currentActive > 0 ? currentActive - 1 : currentActive;
        } else {
          newActive =
            currentActive < projectList.length - 1
              ? currentActive + 1
              : currentActive;
        }

        if (newActive !== currentActive) {
          setActiveThumbnail(newActive);

          const targetOffset = -thumbnailPositions[newActive];
          const clampedOffset = clampOffset(targetOffset, minOffset, maxOffset);

          setScrollOffset(clampedOffset);
          updateScrollTransform(clampedOffset);
        }

        // Reset keyboard navigation mode after delay
        setTimeout(() => {
          setIsKeyboardNavigating(false);
        }, 500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    projectList.length,
    activeThumbnail,
    thumbnailPositions,
    minOffset,
    maxOffset,
    updateScrollTransform,
  ]);

  // Update active thumbnail on scroll offset changes (fallback for non-momentum changes)
  useEffect(() => {
    // Only use DOM-based detection when not in momentum mode
    if (momentumRef.current === 0) {
      updateActiveThumbnailFromDOM();
    }
  }, [scrollOffset, updateActiveThumbnailFromDOM]);

  // Update active thumbnail on window resize
  useEffect(() => {
    if (projectList.length === 0) return;

    const handleResize = () => {
      if (!isKeyboardNavigating) {
        requestAnimationFrame(() => {
          if (momentumRef.current === 0) {
            updateActiveThumbnailFromDOM();
          } else {
            updateActiveThumbnailFromOffset(currentScrollOffsetRef.current);
          }
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [
    isKeyboardNavigating,
    updateActiveThumbnailFromDOM,
    updateActiveThumbnailFromOffset,
    projectList.length,
  ]);

  // Optimized thumbnail click
  const handleThumbnailClick = useCallback(
    (index) => {
      if (index >= thumbnailPositions.length) return;

      setIsKeyboardNavigating(false);
      momentumRef.current = 0;

      // Clear any existing snap timeout
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }

      const targetOffset = -thumbnailPositions[index];
      const clampedOffset = clampOffset(targetOffset, minOffset, maxOffset);

      // Disable transition temporarily for immediate positioning
      if (thumbnailGridRef.current) {
        const hadTransition =
          thumbnailGridRef.current.style.transition !== "none";
        thumbnailGridRef.current.style.transition = "none";

        setTimeout(() => {
          if (thumbnailGridRef.current && hadTransition && !isTouchDevice) {
            thumbnailGridRef.current.style.transition =
              "transform 0.3s ease-out";
          }
        }, 50);
      }

      setScrollOffset(clampedOffset);
      setActiveThumbnail(index);
      updateScrollTransform(clampedOffset);
    },
    [
      thumbnailPositions,
      minOffset,
      maxOffset,
      updateScrollTransform,
      isTouchDevice,
    ]
  );

  // Page transition handler
  const handlePageTransition = useCallback(
    (newPage) => {
      if (newPage === currentPage || isTransitioning) return;

      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage(newPage);
        setTimeout(() => setIsTransitioning(false), 300);
      }, 150);
    },
    [currentPage, isTransitioning]
  );

  // Cleanup animation frame and timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }
    };
  }, []);

  // Initialize scroll position
  useEffect(() => {
    setScrollOffset(0);
    setActiveThumbnail(0);
    updateScrollTransform(0);
  }, [updateScrollTransform]);

  const featuredImage = {
    initial: {
      opacity: 0.25,
      x: "-100%"
    },
    enter: {
      opacity: 1,
      x: 0,
      transition: {
        type: "tween",
        duration: 0.75,
        ease: [0, 0.55, 0.45, 1],
        delay: 0.25
      },
    },
    exit: {
      opacity: 0.25,
      x: "-100%",
      transition: {
        duration: 0.5,
        type: "tween",
      }
    },
  };

  const pageAnimation = {
    initial: {
      transition: {
        staggerChildren: (0.025, { from: "last" }),
        ease: [0.12, 0, 0.39, 0],
      },
    },
    enter: {
      transition: {
        staggerChildren: 0.025,
        ease: [0.12, 0, 0.39, 0],
      },
    },
    exit: {
      transition: {
        duration: 0.5,
        staggerChildren: (0.025),
        ease: [0.12, 0, 0.39, 0],
      },
    },
  };

  const thumbnailAnimation = {
    initial: {
      y: "calc(100% + 8px)",
      opacity: 0.5,
      transition: {
        duration: 0.5,
        type: "tween",
        ease: [0, 0.55, 0.45, 1],
      },
    },
    enter: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        type: "tween",
        ease: [0, 0.55, 0.45, 1],
      },
    },
    exit: {
      y: "calc(100% + 8px)",
      opacity: 0.5,
      transition: {
        duration: 0.5,
        type: "tween",
        ease: [0, 0.55, 0.45, 1],
      },
    },
  };

  return (
    <Layout>
      <main className="work">
        <div className="scroll-container">
          <motion.div
            variants={pageAnimation}
            style={{
              gap: `${dynamicGap}px`,
              transition: isTouchDevice ? "none" : "transform 0.3s ease-out",
              transform: `translate3d(${scrollOffset}px, 0, 0)`,
            }}
            className={`work__container${isDragging ? " dragging" : ""}`}
          >
            <div
              className="featured"
              style={{
                transform: `translateX(${-scrollOffset}px)`,
                transition: isTouchDevice ? "none" : undefined,
              }}
            >
              <motion.img
                {...anim(featuredImage)}
                ref={featuredRef}
                src={home.assets[activeThumbnail].url}
                alt={home.assets[activeThumbnail].alt}
              />
            </div>
            <div
              className="cursor"
              ref={cursorRef}
              style={{ transform: `translateX(${-scrollOffset}px)` }}
            />
            {home.assets.map((asset, index) => {
              return (
                <motion.div
                  variants={thumbnailAnimation}
                  className={`item${
                    index === activeThumbnail ? " active" : ""
                  }`}
                  key={asset.id}
                  ref={(el) => (thumbnailRefs.current[index] = el)}
                  onClick={() => handleThumbnailClick(index)}
                >
                  <img src={asset.url} alt={asset.alt} draggable="false" />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </main>
    </Layout>
  );
}
