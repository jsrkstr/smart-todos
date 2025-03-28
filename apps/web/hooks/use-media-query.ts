"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    // Check if window is available (for SSR)
    if (typeof window === "undefined") return
    
    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)
    
    // Create listener function
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }
    
    // Add listener
    media.addEventListener("change", listener)
    
    // Remove listener on cleanup
    return () => {
      media.removeEventListener("change", listener)
    }
  }, [query])
  
  return matches
} 