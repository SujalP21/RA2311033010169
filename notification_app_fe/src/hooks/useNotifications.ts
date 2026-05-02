import { useState, useEffect, useCallback } from "react";
import { fetchNotifications } from "../services/api";
import { Log } from "../services/logger";
import type { Notification, NotificationType } from "../types";

interface Opts {
  limit?: number;
  page?: number;
  notificationType?: NotificationType | null;
}

// hook that fetches notifications with the given filter/pagination params
export function useNotifications(opts: Opts = {}) {
  const { limit, page = 1, notificationType } = opts;
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Log("frontend", "debug", "hook",
        `loading: page=${page}, limit=${limit || "default"}, type=${notificationType || "all"}`);

      const result = await fetchNotifications({
        limit,
        page,
        notificationType: notificationType || undefined,
      });

      setData(result);
      await Log("frontend", "info", "hook", `loaded ${result.length} items`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setError(msg);
      await Log("frontend", "error", "hook", `load failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [limit, page, notificationType]);

  useEffect(() => { load(); }, [load]);

  return { notifications: data, loading, error, reload: load };
}
