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
import { FeaturedAsset } from "@/components/FeaturedAsset";
import { useMobile } from "@/hooks/useMobile";

export default function Home({ home, thumbnailHeightVh = 12, projects = [] }) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeThumbnail, setActiveThumbnail] = useState(0);
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
  const currentScrollOffsetRef = useRef(0);
  const featuredRef = useRef(null);
  const cursorRef = useRef(null);

  // Custom hooks
  const { viewportHeight, viewportWidth } = useViewport();
  const isMobile = useMobile();

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
          // setTimeout(snapToPosition, isTouchDevice ? 100 : 200);
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
          currentScrollOffsetRef.current - scrollDelta,
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
      } else {
        // Other browsers: Use RAF
        let ticking = false;
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollDelta = e.deltaY + e.deltaX;
            momentumRef.current = 0;

            const newOffset = clampOffset(
              currentScrollOffsetRef.current - scrollDelta,
              minOffset,
              maxOffset
            );

            setScrollOffset(newOffset);
            updateScrollTransform(newOffset);
            updateActiveThumbnailFromOffset(newOffset);

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

      // Mobile (all browsers) and non-Safari desktop: Calculate momentum
      let finalVelocity = 0;

      if (dragStateRef.current.velocityHistory.length > 0) {
        const recentVelocities = dragStateRef.current.velocityHistory.slice(-3);
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
      updateActiveThumbnailFromOffset(currentScrollOffsetRef.current);
    }
  }, [
    scrollOffset,
    updateActiveThumbnailFromOffset,
    //  updateActiveThumbnailFromDOM
  ]);

  // Update active thumbnail on window resize
  useEffect(() => {
    if (projectList.length === 0) return;

    const handleResize = () => {
      if (!isKeyboardNavigating) {
        requestAnimationFrame(() => {
          if (momentumRef.current === 0) {
            updateActiveThumbnailFromOffset(currentScrollOffsetRef.current);
          }
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [
    isKeyboardNavigating,
    // updateActiveThumbnailFromDOM,
    updateActiveThumbnailFromOffset,
    projectList.length,
  ]);

  // Thumbnail click handler
  const handleThumbnailClick = useCallback(
    (index) => {
      if (index >= thumbnailPositions.length) return;

      setIsKeyboardNavigating(false);

      const targetOffset = -thumbnailPositions[index];
      const clampedOffset = clampOffset(targetOffset, minOffset, maxOffset);

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

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
      clipPath: "inset(0 100% 0 0)",
    },
    enter: {
      opacity: 1,
      clipPath: "inset(0 0 0 0)",
      transition: {
        type: "tween",
        duration: 0.5,
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
        ease: [0, 0.55, 0.45, 1],
      },
    },
    enter: {
      transition: {
        staggerChildren: isMobile ? 0.04 : 0.025,
        ease: [0, 0.55, 0.45, 1],
      },
    },
    exit: {
      transition: {
        duration: 0.5,
        staggerChildren: 0.025,
        ease: [0, 0.55, 0.45, 1],
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
                isTouchDevice  ? "none" : "transform 0.3s ease-out",
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
                transition: isTouchDevice ? "none" : "transform 0.3s ease-out",
              }}
            >
              <motion.div {...anim(featuredImage)} className="featured__inner">
                <FeaturedAsset asset={home.assets[activeThumbnail]} />
              </motion.div>
            </div>
            <div
              className="cursor"
              ref={cursorRef}
              style={{ transform: `translateX(${-scrollOffset}px)` }}
            />
            {home.assets.map((asset, index) => {
              if (asset._modelApiKey === "photo") {
                return (
                  <motion.div
                    variants={thumbnailAnimation}
                    className={`item${
                      index === activeThumbnail ? " active" : ""
                    }`}
                    key={asset.photo.id}
                    ref={(el) => (thumbnailRefs.current[index] = el)}
                    onClick={() => handleThumbnailClick(index)}
                  >
                    <img
                      src={asset.photo.url}
                      alt={asset.photo.alt}
                      draggable="false"
                    />
                  </motion.div>
                );
              }

              if (asset._modelApiKey === "video") {
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
                    <img
                      src={asset.thumbnail.url}
                      alt={asset.thumbnail.alt}
                      draggable="false"
                    />
                  </motion.div>
                );
              }
            })}
          </motion.div>
        </div>
      </main>
    </Layout>
  );
}
