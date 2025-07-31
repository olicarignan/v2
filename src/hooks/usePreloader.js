import { isMobile } from "@/utils/isMobile"

export const usePreloader = async (assets, onProgress) => {

  let loaded = 0

  const loadImage = (asset) => {
    return new Promise((resolve) => {

       if (asset._modelApiKey === "photo") {
         const img = new Image();
         img.onload = img.onerror = () => {
           loaded++;
           onProgress(loaded.toString().padStart(2, "0"));
           resolve();
         };
         img.src = asset.photo.url;
       }

       if (!isMobile() && asset._modelApiKey === "video") {
         const video = document.createElement("video");
         video.src = asset.video.url;
         video.addEventListener("loadeddata", () => {
           loaded++;
           onProgress(loaded.toString().padStart(2, "0"));
           resolve();
         });
       }

      if (isMobile() && asset._modelApiKey === "video") {
        const img = new Image();
        img.onload = img.onerror = () => {
          loaded++;
          onProgress(loaded.toString().padStart(2, "0"));
          resolve();
        };
        img.src = asset.thumbnail.src;
      }
    })
  }

  await Promise.all(assets.map(loadImage))
}