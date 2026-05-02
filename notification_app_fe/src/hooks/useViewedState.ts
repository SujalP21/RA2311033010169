import { useState, useCallback, useEffect } from "react";
import { Log } from "../services/logger";

const STORAGE_KEY = "viewed_notifications";

/**
 * Tracks which notification IDs have been viewed by the user.
 * Persists to localStorage so state survives page refreshes.
 */
export function useViewedState() {
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // persist to localStorage whenever viewedIds changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...viewedIds]));
  }, [viewedIds]);

  const markAsViewed = useCallback(async (id: string) => {
    setViewedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    await Log("frontend", "debug", "state", `Notification ${id.substring(0, 8)}... marked as viewed`);
  }, []);

  const isViewed = useCallback(
    (id: string) => viewedIds.has(id),
    [viewedIds]
  );

  const viewedCount = viewedIds.size;

  return { markAsViewed, isViewed, viewedCount };
}
