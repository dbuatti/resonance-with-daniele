import { useState, useEffect } from 'react';

const LOADING_DELAY_MS = 300; // Show skeleton after 300ms

export function useDelayedLoading(isLoading: boolean) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowSkeleton(true);
      }, LOADING_DELAY_MS);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [isLoading]);

  return showSkeleton;
}