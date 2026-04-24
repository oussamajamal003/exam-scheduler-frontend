import { useEffect, useRef, useState } from "react";

export function useDelayedLoading(isLoading: boolean, delayMs = 1500) {
  const [shouldShowLoading, setShouldShowLoading] = useState(isLoading);
  const loadingStartedAtRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (isLoading) {
      loadingStartedAtRef.current = Date.now();
      frameRef.current = window.requestAnimationFrame(() => {
        setShouldShowLoading(true);
        frameRef.current = null;
      });
      return;
    }

    const loadingStartedAt = loadingStartedAtRef.current;
    if (loadingStartedAt === null) {
      frameRef.current = window.requestAnimationFrame(() => {
        setShouldShowLoading(false);
        frameRef.current = null;
      });
      return;
    }

    const elapsed = Date.now() - loadingStartedAt;
    const remaining = Math.max(delayMs - elapsed, 0);

    if (remaining === 0) {
      loadingStartedAtRef.current = null;
      frameRef.current = window.requestAnimationFrame(() => {
        setShouldShowLoading(false);
        frameRef.current = null;
      });
      return;
    }

    hideTimeoutRef.current = window.setTimeout(() => {
      setShouldShowLoading(false);
      loadingStartedAtRef.current = null;
      hideTimeoutRef.current = null;
    }, remaining);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [delayMs, isLoading]);

  return shouldShowLoading;
}