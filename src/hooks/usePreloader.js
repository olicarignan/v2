export const usePreloader = async (images, onProgress) => {

  let loaded = 0
  const total = images.length

  const loadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = img.onerror = () => {
        loaded++
        onProgress(loaded.toString().padStart(2, "0"));
        resolve()
      }
      img.src = src
    })
  }

  await Promise.all(images.map(loadImage))

}