"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

function isClient() {
  return typeof window !== 'undefined'
}

export function useSessionStorage<T>(key: string, initialValue: T) {
  // Use a ref for tracking whether it's the initial mount
  const isFirstMount = useRef(true);

  // Get from session storage then
  // parse stored json or return initialValue
  const readValue = useCallback((): T => {
    // Prevent build error "window is undefined" but keep working
    if (!isClient()) {
      return initialValue
    }

    try {
      const item = window.sessionStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error)
      return initialValue
    }
  }, [initialValue, key])

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(readValue)

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to sessionStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (!isClient()) {
        console.warn(
          `Tried setting sessionStorage key "${key}" even though environment is not a client`
        )
      }

      try {
        // Allow value to be a function so we have the same API as useState
        const newValue = value instanceof Function ? value(storedValue) : value

        // Save to session storage
        window.sessionStorage.setItem(key, JSON.stringify(newValue))

        // Save state
        setStoredValue(newValue)

        // Dispatch a custom event so other tabs can listen for changes
        window.dispatchEvent(new StorageEvent('storage', { key }))
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // Initialize with the latest sessionStorage value only on first mount
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      setStoredValue(readValue());
    }
  }, []);

  // Listen for changes to this localStorage key in other documents
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        setStoredValue(readValue())
      }
    }

    // Listen for storage events
    if (isClient()) {
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }

    return undefined
  }, [key, readValue])

  return [storedValue, setValue] as const
}