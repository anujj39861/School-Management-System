"use client";
import React from 'react';
import { useNavigationLoader } from '../context/NavigationContext';
import { usePathname } from 'next/navigation';

const NavigationProgressBar = () => {
  const { isLoading, progress } = useNavigationLoader();
  const pathname = usePathname();

  if (!isLoading) return null;

  // Determine the top position based on current route
  const getTopPosition = () => {
    if (!pathname) return 'top-16'; // Default for home page
    
    if (pathname.startsWith('/admin') || 
        pathname.startsWith('/student') || 
        pathname.startsWith('/teacher')) {
      return 'top-16'; // Adjusted to match navbar height
    }
    
    return 'top-16'; // Home navbar
  };

  return (
    <div className={`fixed ${getTopPosition()} left-0 right-0 z-40 h-1 bg-gray-200/20 overflow-hidden`}>
      {/* Main progress bar */}
      <div
        className="h-full bg-gradient-to-r from-cyan-400 via-sky-500 to-purple-600 transition-all ease-out shadow-lg shadow-cyan-500/20 relative"
        style={{
          width: `${progress}%`,
          transition: progress === 100 
            ? 'width 0.3s ease-out' 
            : progress >= 85 
              ? 'width 0.5s ease-out' 
              : 'width 0.4s ease-out',
        }}
      >
        {/* Pulse glow effect - more intense when at 100% */}
        <div className={`absolute inset-0 bg-gradient-to-r from-cyan-400/30 via-sky-500/30 to-purple-600/30 blur-sm ${
          progress === 100 ? 'animate-pulse' : ''
        }`} />
        
        {/* Moving indicator - changes when complete */}
        <div className={`absolute right-0 top-0 w-2 h-full ${
          progress === 100 
            ? 'bg-white/80 animate-pulse' 
            : 'bg-white/60 animate-pulse'
        }`} />
        
        {/* Success indicator when at 100% */}
        {progress === 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default NavigationProgressBar;
