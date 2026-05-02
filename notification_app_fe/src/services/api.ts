/**
 * Notification API service.
 * Handles fetching notifications with query params (limit, page, notification_type).
 */

import { getToken } from "./auth";
import { Log } from "./logger";
import type { Notification, NotificationType } from "../types";

interface FetchOptions {
  limit?: number;
  page?: number;
  notificationType?: NotificationType;
}

interface ApiResponse {
  notifications: Notification[];
}

export async function fetchNotifications(options: FetchOptions = {}): Promise<Notification[]> {
  const { limit, page, notificationType } = options;

  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (page) params.set("page", String(page));
  if (notificationType) params.set("notification_type", notificationType);

  const queryStr = params.toString();
  const url = `/api/notifications${queryStr ? `?${queryStr}` : ""}`;

  await Log("frontend", "info", "api", `Fetching notifications: ${url}`);

  try {
    const token = await getToken();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      await Log("frontend", "error", "api", `API error: HTTP ${response.status}`);
      throw new Error(`API returned ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    const notifications = data.notifications || [];

    await Log("frontend", "info", "api", `Received ${notifications.length} notifications`);
    return notifications;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("frontend", "error", "api", `Fetch failed: ${msg}`);
    throw err;
  }
}

/**
 * Ranks notifications by priority using the same algorithm as the backend.
 */
export function rankNotifications(notifications: Notification[], topN: number = 10) {
  const TYPE_WEIGHTS: Record<string, number> = { Placement: 3, Result: 2, Event: 1 };
  const TYPE_FACTOR = 0.6;
  const RECENCY_FACTOR = 0.4;

  const withTs = notifications.map((n) => ({
    ...n,
    _tsMs: new Date(n.Timestamp).getTime(),
  }));

  const allTs = withTs.map((n) => n._tsMs);
  const minTs = Math.min(...allTs);
  const maxTs = Math.max(...allTs);

  const scored = withTs.map((n) => {
    const typeScore = (TYPE_WEIGHTS[n.Type] || 1) / 3;
    const recencyScore = maxTs === minTs ? 1 : (n._tsMs - minTs) / (maxTs - minTs);
    const priorityScore = TYPE_FACTOR * typeScore + RECENCY_FACTOR * recencyScore;

    return {
      ID: n.ID,
      Type: n.Type,
      Message: n.Message,
      Timestamp: n.Timestamp,
      priorityScore: parseFloat(priorityScore.toFixed(4)),
      typeScore: parseFloat(typeScore.toFixed(4)),
      recencyScore: parseFloat(recencyScore.toFixed(4)),
    };
  });

  scored.sort((a, b) => {
    const diff = b.priorityScore - a.priorityScore;
    if (Math.abs(diff) < 0.0001) {
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    }
    return diff;
  });

  return scored.slice(0, topN);
}
