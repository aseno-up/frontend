/**
 * Mobile-specific utility functions for improved UX
 */

/**
 * Detects if the user is on a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Detects if the device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Gets the current viewport width
 */
export function getViewportWidth(): number {
  if (typeof window === "undefined") return 0
  return Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  )
}

/**
 * Checks if viewport is in mobile breakpoint (< 768px)
 */
export function isMobileViewport(): boolean {
  return getViewportWidth() < 768
}

/**
 * Checks if viewport is in tablet breakpoint (768px - 1024px)
 */
export function isTabletViewport(): boolean {
  const width = getViewportWidth()
  return width >= 768 && width < 1024
}

/**
 * Checks if viewport is in desktop breakpoint (>= 1024px)
 */
export function isDesktopViewport(): boolean {
  return getViewportWidth() >= 1024
}

/**
 * Prevents body scroll (useful for modals on mobile)
 */
export function preventBodyScroll() {
  if (typeof document === "undefined") return
  document.body.style.overflow = "hidden"
}

/**
 * Allows body scroll
 */
export function allowBodyScroll() {
  if (typeof document === "undefined") return
  document.body.style.overflow = ""
}

/**
 * Scrolls element into view with mobile-friendly behavior
 */
export function scrollIntoViewMobile(
  element: HTMLElement,
  options?: ScrollIntoViewOptions
) {
  if (typeof window === "undefined") return

  const defaultOptions: ScrollIntoViewOptions = {
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  }

  element.scrollIntoView({ ...defaultOptions, ...options })
}

/**
 * Debounces window resize events for better performance
 */
export function useResizeObserver(
  callback: () => void,
  delay: number = 150
): () => void {
  if (typeof window === "undefined") return () => {}

  let timeoutId: NodeJS.Timeout

  const handleResize = () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(callback, delay)
  }

  window.addEventListener("resize", handleResize)

  return () => {
    clearTimeout(timeoutId)
    window.removeEventListener("resize", handleResize)
  }
}

/**
 * Gets safe area insets for devices with notches (iPhone X+)
 */
export function getSafeAreaInsets() {
  if (typeof window === "undefined")
    return { top: 0, right: 0, bottom: 0, left: 0 }

  const computedStyle = getComputedStyle(document.documentElement)

  return {
    top: parseInt(computedStyle.getPropertyValue("env(safe-area-inset-top)") || "0"),
    right: parseInt(computedStyle.getPropertyValue("env(safe-area-inset-right)") || "0"),
    bottom: parseInt(computedStyle.getPropertyValue("env(safe-area-inset-bottom)") || "0"),
    left: parseInt(computedStyle.getPropertyValue("env(safe-area-inset-left)") || "0"),
  }
}

/**
 * Vibrates the device (if supported) for haptic feedback
 */
export function vibrate(pattern: number | number[] = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern)
  }
}
