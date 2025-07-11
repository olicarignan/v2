"use client";

import {
  useRef,
  useState,
  useEffect,
  useMemo,
} from "react";

import { useViewport } from "@/hooks/useViewport";
import { useInternalLoading } from "@/hooks/useInternalLoading";
import { useMomentum } from "@/hooks/useMomentum";
import { useSnapToPosition } from "@/hooks/useSnapToPosition";
import { useTouchHandling } from "@/hooks/useTouchHandling";
import { useImageLoader } from "@/hooks/useImageLoader";

import { getPropData } from "@/utils/propData";
import { getHome } from "@/gql/queries";
import {
  throttle,
  rafThrottle,
  calculateImageWidth,
  calculateThumbnailPositions,
  calculateTotalWidth,
  clampOffset,
  calculateActiveThumbnail,
} from "@/utils/helpers";

import Layout from "@/layouts/Layout";

export default function Home({
  home,
  thumbnailHeightVh = 12,
  projects = [],
  isLoading = false,
  loadingProgress = 0,
  loadingText = "Loading Portfolio",
  onLoadComplete,
}) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeThumbnail, setActiveThumbnail] = useState(0);
  const thumbnailRefs = useRef([]);
  const cursorRef = useRef(null);
  const featuredRef = useRef(null);

  // Track if we're in keyboard navigation mode to prevent interference
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check if we're on a touch device
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

  // Custom hooks
  const { viewportHeight, viewportWidth } = useViewport();
  const { internalLoading, internalProgress } = useInternalLoading(
    projects,
    isLoading,
    onLoadComplete
  );

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

  const projectList = home.assets;

  // Load image dimensions
  const imageLoadStates = useImageLoader(projectList, thumbnailHeight);

  // Generate thumbnail widths based on image aspect ratios
  const generatedThumbnailWidths = useMemo(() => {
    return projectList.map((project, index) =>
      calculateImageWidth(project, index, thumbnailHeight, imageLoadStates)
    );
  }, [projectList, thumbnailHeight, imageLoadStates]);

  // Calculate cumulative positions for each thumbnail
  const thumbnailPositions = useMemo(() => {
    return calculateThumbnailPositions(generatedThumbnailWidths, dynamicGap);
  }, [generatedThumbnailWidths, dynamicGap]);

  // Calculate total width of all thumbnails
  const totalWidth = useMemo(() => {
    return calculateTotalWidth(thumbnailPositions, generatedThumbnailWidths);
  }, [thumbnailPositions, generatedThumbnailWidths]);

  // Boundary calculations
  const maxOffset = 0; // First thumbnail at 0 position
  const minOffset = useMemo(() => {
    if (generatedThumbnailWidths.length === 0) return 0;

    // The thumbnails start at 16px from the left due to container padding
    // To position the last thumbnail at 16px from left, we need:
    // -(last thumbnail position + 16px initial offset) + 16px target position
    // Which simplifies to: -(last thumbnail position + 16px)
    const lastThumbnailPosition =
      thumbnailPositions[thumbnailPositions.length - 1];
    const containerPadding = 32; // The initial 16px offset from container padding

    return -(lastThumbnailPosition + containerPadding);
  }, [thumbnailPositions]);

  const clampOffsetFn = (offset) => clampOffset(offset, minOffset, maxOffset);

  // Touch handling
  const { isDragging, momentum, setMomentum } = useTouchHandling(
    projectList,
    scrollOffset,
    setScrollOffset,
    clampOffsetFn,
    setIsKeyboardNavigating,
    isTouchDevice
  );

  // Momentum handling - only on non-touch devices
  const momentumEffect = useMomentum(
    momentum,
    setMomentum,
    projectList,
    setScrollOffset,
    clampOffsetFn
  );
  const momentumEffectMemo = useMemo(() => {
    return momentumEffect;
  }, [momentumEffect]);

  // Snap to position
  const isSnapping = useSnapToPosition(
    momentum,
    isDragging,
    isKeyboardNavigating,
    activeThumbnail,
    scrollOffset,
    setScrollOffset,
    thumbnailRefs,
    clampOffsetFn
  );

  // Reset active thumbnail when projects change and ensure we start at 0 offset
  useEffect(() => {
    if (activeThumbnail >= projectList.length) {
      setActiveThumbnail(0);
      setScrollOffset(0); // Explicitly reset to 0
    }
  }, [projectList.length, activeThumbnail]);

  // Ensure we start at 0 offset when component mounts
  useEffect(() => {
    setScrollOffset(0);
    setActiveThumbnail(0);
  }, []);

  // Collision detection for active thumbnail
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

  // Wheel event handling
  useEffect(() => {
    if (projectList.length === 0) return;

    const handleWheel = rafThrottle((e) => {
      e.preventDefault();

      // Reset keyboard navigation mode
      setIsKeyboardNavigating(false);

      const scrollDelta = e.deltaY + e.deltaX;

      setScrollOffset((prev) => {
        const newOffset = prev - scrollDelta * 0.5;
        const clampedOffset = clampOffset(newOffset, minOffset, maxOffset);
        return clampedOffset;
      });
    });

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [projectList.length, thumbnailPositions, minOffset, maxOffset]);

  // Update active thumbnail when scroll offset changes
  useEffect(() => {
    const updateActiveThumbnail = throttle((offset) => {
      if (!isKeyboardNavigating) {
        const calculatedActive = calculateActiveThumbnail(
          offset,
          thumbnailPositions
        );
        setActiveThumbnail(calculatedActive);
      }
    }, 16);

    updateActiveThumbnail(scrollOffset);
  }, [scrollOffset, isKeyboardNavigating, thumbnailPositions]);

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

          // Calculate the distance to move based on the direction
          let scrollDistance = 0;

          if (e.key === "ArrowRight") {
            // Moving right: scroll by the width of the current thumbnail + gap
            scrollDistance = -(
              generatedThumbnailWidths[currentActive] + dynamicGap
            );
          } else {
            // Moving left: scroll by the width of the previous thumbnail + gap
            scrollDistance = generatedThumbnailWidths[newActive] + dynamicGap;
          }

          // Apply the scroll distance to current offset
          const newOffset = scrollOffset + scrollDistance;
          const clampedOffset = clampOffset(newOffset, minOffset, maxOffset);

          setScrollOffset(clampedOffset);
        }

        // Reset keyboard navigation mode after a longer delay to prevent snap interference
        setTimeout(() => {
          setIsKeyboardNavigating(false);
        }, 500); // Increased from 300ms to 500ms
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    projectList.length,
    activeThumbnail,
    scrollOffset,
    generatedThumbnailWidths,
    dynamicGap,
  ]);

  const handleThumbnailClick = (index) => {
    if (index >= thumbnailPositions.length) return;

    // Reset keyboard navigation mode and momentum
    setIsKeyboardNavigating(false);
    setMomentum(0); // Reset any existing momentum

    // Only manipulate transitions on non-touch devices
    const thumbnailGrid = document.querySelector(".work__container");
    const featured = document.querySelector(".featured");
    let hadTransition = false;

    if (!isTouchDevice && thumbnailGrid) {
      hadTransition = thumbnailGrid.style.transition !== "none";
      hadTransition = featured.style.transition !== "none";
      thumbnailGrid.style.transition = "none";
      featured.style.transition = "none";
    }

    // Calculate the position of the clicked thumbnail
    let clickedThumbnailPosition = 0;
    for (let i = 0; i < index; i++) {
      clickedThumbnailPosition += generatedThumbnailWidths[i] + dynamicGap;
    }

    // The target is to position the clicked thumbnail at 16px from the left edge of the viewport
    const targetOffset = -clickedThumbnailPosition;
    const clampedOffset = clampOffset(targetOffset, minOffset, maxOffset);

    // Set the position immediately without transition
    setScrollOffset(clampedOffset);
    setActiveThumbnail(index);

    // Re-enable transition only on non-touch devices and only if it was enabled before
    if (!isTouchDevice && thumbnailGrid && hadTransition) {
      setTimeout(() => {
        thumbnailGrid.style.transition = "transform 0.3s ease-out";
        featured.style.transition = "transform 0.3s ease-out";
      }, 50);
    }
  };

  // // Determine if we should show loading screen
  // const showLoading = isLoading || internalLoading;
  // const currentProgress = isLoading ? loadingProgress : internalProgress;

  // // Show preloader screen
  // if (showLoading) {
  //   return (
  //     <Preloader
  //       progress={currentProgress}
  //       onComplete={onLoadComplete}
  //       loadingText={loadingText}
  //     />
  //   );
  // }

  return (
    <Layout>
      <main className="work">
        <div className="scroll-container">
          <div
            style={{
              transform: `translateX(${scrollOffset}px)`,
              gap: dynamicGap,
              transition: isTouchDevice ? "none" : undefined,
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
              <img
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
                <div
                  className={`item${
                    index === activeThumbnail ? " active" : ""
                  }`}
                  key={asset.id}
                  ref={(el) => (thumbnailRefs.current[index] = el)}
                  onClick={() => handleThumbnailClick(index)}
                >
                  <img src={asset.url} alt={asset.alt} draggable="false" />
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </Layout>
  );
}

export const getStaticProps = async () => {
  const home = await getPropData(getHome);

  return {
    props: {
      ...home,
    },
  };
};
