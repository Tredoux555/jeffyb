'use client'

import { useState, useEffect } from 'react'

interface UseGoogleMapsResult {
  isLoaded: boolean
  isLoading: boolean
  error: string | null
  scriptLoaded: boolean
}

/**
 * Custom hook to check if Google Maps is already loaded
 * Prevents duplicate LoadScript initialization
 */
export function useGoogleMaps(): UseGoogleMapsResult {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof window !== 'undefined') {
      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      
      if (window.google?.maps) {
        setScriptLoaded(true)
        setIsLoaded(true)
        setIsLoading(false)
      } else if (existingScript) {
        // Script is loading, wait for it
        setIsLoading(true)
        const checkInterval = setInterval(() => {
          if (window.google?.maps) {
            setScriptLoaded(true)
            setIsLoaded(true)
            setIsLoading(false)
            clearInterval(checkInterval)
          }
        }, 100)
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          if (!window.google?.maps) {
            setError('Google Maps failed to load')
            setIsLoading(false)
          }
        }, 10000)
      }
    }
  }, [])

  return {
    isLoaded,
    isLoading,
    error,
    scriptLoaded,
  }
}

