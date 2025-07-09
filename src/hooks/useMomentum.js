"use client";

import { useEffect } from "react";

export const useMomentum = (
  momentum,
  setMomentum,
  projectList,
  setScrollOffset,
  clampOffsetFn
) => {
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
          return clampOffsetFn(newOffset);
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
  }, [
    momentum,
    projectList.length,
    setMomentum,
    setScrollOffset,
    clampOffsetFn,
  ]);
};
