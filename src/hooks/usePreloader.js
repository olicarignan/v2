import { isMobile } from "@/utils/isMobile"

export const usePreloader = async (assets, onProgress) => {

  let loaded = 0

  const loadImage = (asset) => {
    return new Promise((resolve) => {

      if (asset.format === "jpg" || asset.format === "png") {
        const img = new Image()
        img.onload = img.onerror = () => {
          loaded++
          onProgress(loaded.toString().padStart(2, "0"));
          resolve()
        }
        img.src = asset.url
      }

      if (!isMobile() && asset.format === "mp4") {
        const video = document.createElement("video")
        video.src = asset.url
        video.addEventListener("loadeddata", () => {
          loaded++
          onProgress(loaded.toString().padStart(2, "0"));
          resolve()
        })
      }

      if (isMobile() && asset.format === "mp4") {
        const img = new Image();
        img.onload = img.onerror = () => {
          loaded++;
          onProgress(loaded.toString().padStart(2, "0"));
          resolve();
        };
        img.src = asset.video.thumbnailUrl;
      }
    })
  }

  await Promise.all(assets.map(loadImage))
}