import { useEffect, useState } from "react";

export function useSwipeHint(storageKey: string, durationMs = 3000) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: number | null = null;

    try {
      const hasSeenHint = window.localStorage.getItem(storageKey) === "1";
      if (hasSeenHint) {
        setShowHint(false);
        return;
      }

      setShowHint(true);
      window.localStorage.setItem(storageKey, "1");
      timeoutId = window.setTimeout(() => setShowHint(false), durationMs);
    } catch {
      setShowHint(true);
      timeoutId = window.setTimeout(() => setShowHint(false), durationMs);
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [storageKey, durationMs]);

  return showHint;
}