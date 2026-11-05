"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const NavigationContext = createContext();

export const useNavigationLoader = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationLoader must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const progressIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const completionTimeoutRef = useRef(null);

  // Reset loading state when pathname changes (navigation complete)
  useEffect(() => {
    if (isLoading) {
      // Clear any existing intervals/timeouts
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Complete the progress bar quickly
      setProgress(100);
      
      // Wait for DOM to be ready and additional time for page rendering
      const checkPageReady = () => {
        // Wait for document to be complete and a bit more time for React rendering
        if (document.readyState === 'complete') {
          setTimeout(() => {
            setIsLoading(false);
            setProgress(0);
          }, 500); // Additional 500ms after document ready
        } else {
          // If document not ready, wait and check again
          setTimeout(checkPageReady, 100);
        }
      };

      // Start checking after initial delay
      completionTimeoutRef.current = setTimeout(checkPageReady, 300);
    }
  }, [pathname, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  const startNavigation = (path) => {
    // Clear any existing intervals/timeouts
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }

    setIsLoading(true);
    setProgress(20); // Start with 20%
    
    // Simulate realistic progress increase
    let currentProgress = 20;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15 + 5; // Increase by 5-20% each time
      
      if (currentProgress >= 85) {
        setProgress(85); // Stay at 85% until navigation completes
        clearInterval(progressIntervalRef.current);
      } else {
        setProgress(currentProgress);
      }
    }, 200); // Slower intervals for more realistic progress

    // Navigate to the page
    router.push(path);

    // Fallback timeout in case navigation doesn't complete
    timeoutRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 800);
    }, 8000); // 8 second fallback
  };

  const value = {
    isLoading,
    progress,
    startNavigation,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
