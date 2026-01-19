"use client"

import { useEffect, useState } from "react"
import {
  isMobileDevice,
  isTouchDevice,
  isMobileViewport,
  isTabletViewport,
  isDesktopViewport,
} from "@/lib/mobile-utils"

/**
 * Hook to detect mobile device and viewport
 * Updates on window resize for responsive behavior
 */
export function useMobile() {
  const [state, setState] = useState({
    isMobile: false,
    isTouch: false,
    isMobileViewport: false,
    isTabletViewport: false,
    isDesktopViewport: false,
  })

  useEffect(() => {
    const updateState = () => {
      setState({
        isMobile: isMobileDevice(),
        isTouch: isTouchDevice(),
        isMobileViewport: isMobileViewport(),
        isTabletViewport: isTabletViewport(),
        isDesktopViewport: isDesktopViewport(),
      })
    }

    // Initial check
    updateState()

    // Update on resize
    window.addEventListener("resize", updateState)

    return () => {
      window.removeEventListener("resize", updateState)
    }
  }, [])

  return state
}

/**
 * Hook to get current viewport width
 * Updates on window resize
 */
export function useViewportWidth() {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => {
      setWidth(window.innerWidth)
    }

    updateWidth()
    window.addEventListener("resize", updateWidth)

    return () => {
      window.removeEventListener("resize", updateWidth)
    }
  }, [])

  return width
}

/**
 * Hook for responsive breakpoints
 * Returns object with boolean values for each breakpoint
 */
export function useBreakpoints() {
  const width = useViewportWidth()

  return {
    isSm: width >= 640,
    isMd: width >= 768,
    isLg: width >= 1024,
    isXl: width >= 1280,
    is2Xl: width >= 1536,
    mobile: width < 768,
    tablet: width >= 768 && width < 1024,
    desktop: width >= 1024,
  }
}
