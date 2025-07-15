export const usePreloader = async (images, onProgress) => {

  let loaded = 0
  const total = images.length

  const loadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = img.onerror = () => {
        loaded++
        // onProgress(String(loaded).padStart(2, "0"));
        onProgress(Math.floor(loaded / total * 100))
        resolve()
      }
      img.src = src
    })
  }

  await Promise.all(images.map(loadImage))

}