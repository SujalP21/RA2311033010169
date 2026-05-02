import { useState, useCallback, useEffect } from "react";
import { Log } from "../services/logger";

const KEY = "viewed_notifs";

// keeps track of which notification IDs the user has already seen
// uses localStorage so it persists across refreshes
export function useViewedState() {
  const [seen, setSeen] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // sync to localStorage when the set changes
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify([...seen]));
  }, [seen]);

  const markViewed = useCallback(async (id: string) => {
    setSeen((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    await Log("frontend", "debug", "state", `marked ${id.slice(0, 8)}... viewed`);
  }, []);

  const isViewed = useCallback((id: string) => seen.has(id), [seen]);

  return { markViewed, isViewed, viewedCount: seen.size };
}
