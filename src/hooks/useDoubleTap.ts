import { useRef, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";

interface UseDoubleTapOptions {
  onDoubleTap: () => void;
  onSingleTap?: () => void;
  delay?: number;
}

export function useDoubleTap({
  onDoubleTap,
  onSingleTap,
  delay = 300,
}: UseDoubleTapOptions) {
  const lastTapTime = useRef(0);
  const timerId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
    };
  }, []);

  const handlePress = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastTapTime.current;

    if (elapsed < delay) {
      // Double tap
      if (timerId.current) {
        clearTimeout(timerId.current);
        timerId.current = null;
      }
      lastTapTime.current = 0;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDoubleTap();
    } else {
      // First tap — wait to see if a second comes
      lastTapTime.current = now;
      if (onSingleTap) {
        timerId.current = setTimeout(() => {
          timerId.current = null;
          onSingleTap();
        }, delay);
      }
    }
  }, [onDoubleTap, onSingleTap, delay]);

  return { handlePress };
}
