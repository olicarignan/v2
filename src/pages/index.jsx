"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";

import { useViewport } from "@/hooks/useViewport";

import {
  calculateImageWidth,
  calculateThumbnailPositions,
  calculateTotalWidth,
  clampOffset,
} from "@/utils/helpers";
import { anim } from "@/utils/animate";
import Layout from "@/layouts/Layout";

export default function Home({ home, thumbnailHeightVh = 12, projects = [] }) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeThumbnail, setActiveThumbnail] = useState(0);
  const [currentPage, setCurrentPage] = useState("WORK");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  // Refs
  const thumbnailRefs = useRef([]);
  const thumbnailGridRef = useRef(null);
  const animationFrameRef = useRef(null);
  const momentumRef = useRef(0);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startOffset: 0,
    lastX: 0,
    lastTime: 0,
  });
  const snapTimeoutRef = useRef(null);
  const currentScrollOffsetRef = useRef(0);
  const featuredRef = useRef(null);
  const cursorRef = useRef(null);

  // Custom hooks
  const { viewportHeight, viewportWidth } = useViewport();

  // Detect Safari
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsSafari(userAgent.includes("safari") && !userAgent.includes("chrome"));
  }, []);

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

  // Dynamic left padding - 8px on mobile, 16px on desktop
  const leftPadding = useMemo(() => {
    return isTouchDevice ? 8 : 16;
  }, [isTouchDevice]);

  const { minOffset, maxOffset } = useMemo(() => {
    const max = 0;
    const min =
      generatedThumbnailWidths.length === 0
        ? 0
        : -(thumbnailPositions[thumbnailPositions.length - 1] + leftPadding);
    return { minOffset: min, maxOffset: max };
  }, [thumbnailPositions, generatedThumbnailWidths.length]);

  // Performance-optimized scroll update
  const updateScrollTransform = useCallback((offset) => {
    if (thumbnailGridRef.current) {
      thumbnailGridRef.current.style.transform = `translate3d(${offset}px, 0, 0)`;
      featuredRef.current.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }
    currentScrollOffsetRef.current = offset;
  }, []);

  // Active thumbnail detection based on scroll offset
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

  // Active thumbnail detection based on DOM position
  const updateActiveThumbnailFromDOM = useCallback(() => {
    if (isKeyboardNavigating || projectList.length === 0) return;

    let activeIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    thumbnailRefs.current.forEach((thumbnail, index) => {
      if (!thumbnail) return;

      const thumbnailRect = thumbnail.getBoundingClientRect();
      const targetPosition = leftPadding;
      const distance = Math.abs(thumbnailRect.left - targetPosition);

      if (distance < closestDistance) {
        closestDistance = distance;
        activeIndex = index;
      }
    });

    if (activeIndex < projectList.length) {
      setActiveThumbnail(activeIndex);
    }
  }, [isKeyboardNavigating, projectList.length, leftPadding]);

  // Snap to position function
  const snapToPosition = useCallback(() => {
    if (momentumRef.current !== 0 || isDragging || isKeyboardNavigating) return;

    const activeThumb = thumbnailRefs.current[activeThumbnail];
    if (!activeThumb) return;

    const thumbRect = activeThumb.getBoundingClientRect();
    const targetPosition = leftPadding;
    const currentPosition = thumbRect.left;
    const snapDistance = targetPosition - currentPosition;

    const snapThreshold = isTouchDevice ? 1 : 2;
    if (Math.abs(snapDistance) > snapThreshold) {
      const requiredOffset = currentScrollOffsetRef.current + snapDistance;
      const clampedOffset = clampOffset(requiredOffset, minOffset, maxOffset);

      if (isSafari) {
        // Safari: Enable transition only for snapping
        if (thumbnailGridRef.current) {
          thumbnailGridRef.current.style.transition = "transform 0.3s ease-out";
          featuredRef.current.style.transition = "transform 0.3s ease-out";
        }

        setScrollOffset(clampedOffset);
        updateScrollTransform(clampedOffset);
        updateActiveThumbnailFromOffset(clampedOffset);

        // Disable transition after snap completes
        setTimeout(() => {
          if (thumbnailGridRef.current) {
            thumbnailGridRef.current.style.transition = "none";
            featuredRef.current.style.transition = "none";
          }
        }, 300); // Match transition duration
      } else {
        const duration = isTouchDevice ? 200 : 300;
        const startOffset = currentScrollOffsetRef.current;
        const startTime = performance.now();

        const animateSnap = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          const easeOut = isTouchDevice
            ? 1 - Math.pow(1 - progress, 2.5)
            : 1 - Math.pow(1 - progress, 3);

          const currentSnapOffset =
            startOffset + (clampedOffset - startOffset) * easeOut;
          setScrollOffset(currentSnapOffset);
          updateScrollTransform(currentSnapOffset);
          updateActiveThumbnailFromOffset(currentSnapOffset);

          if (progress < 1) {
            requestAnimationFrame(animateSnap);
          }
        };

        requestAnimationFrame(animateSnap);
      }
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
    isSafari,
    leftPadding,
  ]);

  // Single RAF loop for momentum
  const startAnimationLoop = useCallback(() => {
    if (animationFrameRef.current) return;

    const animate = () => {
      let needsUpdate = false;

      if (
        Math.abs(momentumRef.current) > 0.1 &&
        !dragStateRef.current.isDragging
      ) {
        const decayRate = isTouchDevice ? 0.92 : 0.95;
        momentumRef.current *= decayRate;

        const newOffset = clampOffset(
          currentScrollOffsetRef.current + momentumRef.current,
          minOffset,
          maxOffset
        );

        setScrollOffset(newOffset);
        updateScrollTransform(newOffset);
        updateActiveThumbnailFromOffset(newOffset);

        needsUpdate = true;

        const stopThreshold = isTouchDevice ? 0.05 : 0.1;
        if (Math.abs(momentumRef.current) < stopThreshold) {
          momentumRef.current = 0;
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
    isSafari,
  ]);

  // Wheel handler - Safari optimized
  useEffect(() => {
    if (projectList.length === 0) return;

    const handleWheel = (e) => {
      e.preventDefault();
      setIsKeyboardNavigating(false);

      if (isSafari) {
        // Safari Desktop: Ultra-simple direct scrolling
        const scrollDelta = e.deltaY + e.deltaX;
        const newOffset = clampOffset(
          currentScrollOffsetRef.current - scrollDelta * 0.7,
          minOffset,
          maxOffset
        );

        // Disable CSS transitions on Safari
        if (thumbnailGridRef.current) {
          featuredRef.current.style.transition = "none";
          thumbnailGridRef.current.style.transition = "none";
        }

        // Direct DOM update only - no React state updates
        updateScrollTransform(newOffset);
        updateActiveThumbnailFromOffset(newOffset);

        // Add snap timeout for Safari
        if (snapTimeoutRef.current) {
          clearTimeout(snapTimeoutRef.current);
        }
        snapTimeoutRef.current = setTimeout(snapToPosition, 150);
      } else {
        // Other browsers: Use RAF
        let ticking = false;
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollDelta = e.deltaY + e.deltaX;
            momentumRef.current = 0;

            const newOffset = clampOffset(
              currentScrollOffsetRef.current - scrollDelta * 0.7,
              minOffset,
              maxOffset
            );

            setScrollOffset(newOffset);
            updateScrollTransform(newOffset);
            updateActiveThumbnailFromOffset(newOffset);

            if (snapTimeoutRef.current) {
              clearTimeout(snapTimeoutRef.current);
            }
            snapTimeoutRef.current = setTimeout(snapToPosition, 200);

            ticking = false;
          });
          ticking = true;
        }
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
    isSafari,
  ]);

  // Touch handling
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
        velocityHistory: [],
      };
      setIsDragging(true);
      momentumRef.current = 0;

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
      updateActiveThumbnailFromOffset(newOffset);

      const timeDelta = currentTime - dragStateRef.current.lastTime;
      const positionDelta = touch.clientX - dragStateRef.current.lastX;

      if (timeDelta > 0) {
        const velocity = positionDelta / timeDelta;

        dragStateRef.current.velocityHistory.push({
          velocity,
          time: currentTime,
        });

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

      // Calculate momentum for all mobile devices, but skip for Safari desktop only
      const isSafariDesktop = isSafari && !isTouchDevice;

      if (isSafariDesktop) {
        // Safari Desktop: Skip momentum, just snap
        setTimeout(snapToPosition, 100);
      } else {
        // Mobile (all browsers) and non-Safari desktop: Calculate momentum
        let finalVelocity = 0;

        if (dragStateRef.current.velocityHistory.length > 0) {
          const recentVelocities =
            dragStateRef.current.velocityHistory.slice(-3);
          finalVelocity =
            recentVelocities.reduce((sum, entry) => sum + entry.velocity, 0) /
            recentVelocities.length;

          const velocityMultiplier = isTouchDevice ? 20 : 16;
          finalVelocity *= velocityMultiplier;

          if (Math.abs(finalVelocity) > 2) {
            finalVelocity =
              Math.sign(finalVelocity) * Math.min(Math.abs(finalVelocity), 50);
            momentumRef.current = finalVelocity;
            startAnimationLoop();
          } else {
            setTimeout(snapToPosition, 150);
          }
        } else {
          setTimeout(snapToPosition, 150);
        }
      }

      setTimeout(() => {
        if (thumbnailGridRef.current && !isTouchDevice) {
          thumbnailGridRef.current.style.transition = "transform 0.3s ease-out";
          featuredRef.current.style.transition = "transform 0.3s ease-out";
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
    isSafari,
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

  // Update active thumbnail on scroll offset changes
  useEffect(() => {
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

  // Thumbnail click handler
  const handleThumbnailClick = useCallback(
    (index) => {
      if (index >= thumbnailPositions.length) return;

      setIsKeyboardNavigating(false);
      momentumRef.current = 0;

      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }

      const targetOffset = -thumbnailPositions[index];
      const clampedOffset = clampOffset(targetOffset, minOffset, maxOffset);

      if (thumbnailGridRef.current) {
        const hadTransition =
          thumbnailGridRef.current.style.transition !== "none";
        thumbnailGridRef.current.style.transition = "none";
        featuredRef.current.style.transition = "none";

        setTimeout(() => {
          if (thumbnailGridRef.current && hadTransition && !isTouchDevice) {
            featuredRef.current.style.transition = "transform 0.3s ease-out";
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

  // Cleanup
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

  // Initialize
  useEffect(() => {
    setScrollOffset(0);
    setActiveThumbnail(0);
    updateScrollTransform(0);
  }, [updateScrollTransform]);

  const featuredImage = {
    initial: {
      opacity: 0,
      clipPath: "inset(0 100% 0 0)"
    },
    enter: {
      opacity: 1,
      clipPath: "inset(0 0 0 0)",
      transition: {
        type: "tween",
        duration: 0.75,
        ease: [0, 0.55, 0.45, 1],
      },
    },
    exit: {
      opacity: 1,
      clipPath: "inset(0 0 0 0)",
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
        staggerChildren: 0.025,
        ease: [0.12, 0, 0.39, 0],
      },
    },
  };

  const thumbnailAnimation = {
    initial: {
      y: "calc(100% + 16px)",
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
      y: 0,
      opacity: 1,
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
              transition:
                isTouchDevice || isSafari ? "none" : "transform 0.3s ease-out",
              transform: `translate3d(${scrollOffset}px, 0, 0)`,
            }}
            className={`work__container${isDragging ? " dragging" : ""}`}
            ref={thumbnailGridRef}
          >
            <div
              className="featured"
              ref={featuredRef}
              style={{
                transform: `translate3d(${-scrollOffset}px, 0, 0)`,
                transition: isTouchDevice || isSafari ? "none" : "transform 0.3s ease-out",
              }}
            >
              <motion.img
                {...anim(featuredImage)}
                // ref={featuredRef}
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
