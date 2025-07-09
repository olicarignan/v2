"use client";

import { useState, useEffect } from "react";

export const useImageLoader = (projectList, thumbnailHeight) => {
  const [imageLoadStates, setImageLoadStates] = useState({});

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

  return imageLoadStates;
};
