// RAF-based throttle for smoother animations
export const rafThrottle = (func) => {
  let rafId = null
  return function (...args) {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, args)
        rafId = null
      })
    }
  }
}