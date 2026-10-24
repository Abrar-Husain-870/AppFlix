'use client';

import { useEffect } from 'react';

/**
 * MobileViewportGuard disables unwanted browser pinch-to-zoom gestures
 * on mobile and small-screen devices, keeping AppFlix feeling like a native app.
 */
export default function MobileViewportGuard() {
  useEffect(() => {
    // Prevent multi-touch pinch to zoom (2 or more fingers)
    const handleMultiTouch = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1 && e.cancelable) {
        e.preventDefault();
      }
    };

    // Prevent iOS Safari gesture zooming
    const handleGesture = (e: Event) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    // Lock horizontal window scroll to 0
    const handleScroll = () => {
      if (window.scrollX !== 0) {
        window.scrollTo(0, window.scrollY);
      }
    };

    // Non-passive listeners allow preventDefault()
    window.addEventListener('touchstart', handleMultiTouch, { passive: false });
    window.addEventListener('touchmove', handleMultiTouch, { passive: false });
    window.addEventListener('gesturestart', handleGesture, { passive: false });
    window.addEventListener('gesturechange', handleGesture, { passive: false });
    window.addEventListener('gestureend', handleGesture, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleMultiTouch);
      window.removeEventListener('touchmove', handleMultiTouch);
      window.removeEventListener('gesturestart', handleGesture);
      window.removeEventListener('gesturechange', handleGesture);
      window.removeEventListener('gestureend', handleGesture);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return null;
}
