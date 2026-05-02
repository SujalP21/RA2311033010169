// notification API service
// handles fetching + client-side priority ranking

import { getToken } from "./auth";
import { Log } from "./logger";
import type { Notification, NotificationType } from "../types";

interface FetchOpts {
  limit?: number;
  page?: number;
  notificationType?: NotificationType;
}

export async function fetchNotifications(opts: FetchOpts = {}): Promise<Notification[]> {
  const { limit, page, notificationType } = opts;

  // build query string from provided params
  const qs = new URLSearchParams();
  if (limit) qs.set("limit", String(limit));
  if (page) qs.set("page", String(page));
  if (notificationType) qs.set("notification_type", notificationType);

  const qStr = qs.toString();
  const url = `/api/notifications${qStr ? `?${qStr}` : ""}`;

  await Log("frontend", "info", "api", `fetching: ${url}`);

  try {
    const token = await getToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      await Log("frontend", "error", "api", `HTTP ${res.status}`);
      throw new Error(`API returned ${res.status}`);
    }

    const body = await res.json();
    const items: Notification[] = body.notifications || [];

    await Log("frontend", "info", "api", `got ${items.length} notifications`);
    return items;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await Log("frontend", "error", "api", `fetch failed: ${msg}`);
    throw e;
  }
}

// client-side priority ranking — same algorithm as backend
// score = 0.6 * typeWeight + 0.4 * recency
export function rankNotifications(items: Notification[], topN: number = 10) {
  const W: Record<string, number> = { Placement: 3, Result: 2, Event: 1 };
  const TW = 0.6;
  const RW = 0.4;

  const withTs = items.map((n) => ({
    ...n,
    _ms: new Date(n.Timestamp).getTime(),
  }));

  const stamps = withTs.map((n) => n._ms);
  const lo = Math.min(...stamps);
  const hi = Math.max(...stamps);

  const scored = withTs.map((n) => {
    const ts = (W[n.Type] || 1) / 3;
    const rs = hi === lo ? 1 : (n._ms - lo) / (hi - lo);
    const ps = TW * ts + RW * rs;

    return {
      ID: n.ID,
      Type: n.Type,
      Message: n.Message,
      Timestamp: n.Timestamp,
      priorityScore: parseFloat(ps.toFixed(4)),
      typeScore: parseFloat(ts.toFixed(4)),
      recencyScore: parseFloat(rs.toFixed(4)),
    };
  });

  scored.sort((a, b) => {
    const d = b.priorityScore - a.priorityScore;
    if (Math.abs(d) < 0.0001) {
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    }
    return d;
  });

  return scored.slice(0, topN);
}
