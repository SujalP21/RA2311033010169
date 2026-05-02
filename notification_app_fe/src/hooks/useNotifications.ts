import { useState, useEffect, useCallback } from "react";
import { fetchNotifications } from "../services/api";
import { Log } from "../services/logger";
import type { Notification, NotificationType } from "../types";

interface UseNotificationsOptions {
  limit?: number;
  page?: number;
  notificationType?: NotificationType | null;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit, page = 1, notificationType } = options;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Log("frontend", "debug", "hook", `Loading notifications: page=${page}, limit=${limit}, type=${notificationType || "all"}`);

      const data = await fetchNotifications({
        limit,
        page,
        notificationType: notificationType || undefined,
      });

      setNotifications(data);
      await Log("frontend", "info", "hook", `Loaded ${data.length} notifications for display`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load notifications";
      setError(msg);
      await Log("frontend", "error", "hook", `Notification load failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [limit, page, notificationType]);

  useEffect(() => {
    load();
  }, [load]);

  return { notifications, loading, error, reload: load };
}
