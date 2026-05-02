import { useState, useMemo, useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { useViewedState } from "../hooks/useViewedState";
import { rankNotifications } from "../services/api";
import { NotificationCard } from "../components/NotificationCard";
import { FilterBar } from "../components/FilterBar";
import { Log } from "../services/logger";
import type { NotificationType, ScoredNotification } from "../types";

export function PriorityInbox() {
  const [typeFilter, setTypeFilter] = useState<NotificationType | null>(null);
  const [topN, setTopN] = useState(10);

  // get notifications then rank them client-side
  const { notifications, loading, error, reload } = useNotifications({
    page: 1,
    notificationType: typeFilter,
  });

  const { markViewed, isViewed } = useViewedState();

  const ranked: ScoredNotification[] = useMemo(() => {
    if (notifications.length === 0) return [];
    return rankNotifications(notifications, topN);
  }, [notifications, topN]);

  useEffect(() => {
    if (ranked.length > 0) {
      Log("frontend", "info", "page",
        `priority: top ${ranked.length} of ${notifications.length}`);
    }
  }, [ranked.length, notifications.length]);

  const stats = useMemo(() => {
    const c = { total: ranked.length, Placement: 0, Result: 0, Event: 0 };
    ranked.forEach((n) => { c[n.Type]++; });
    return c;
  }, [ranked]);

  return (
    <div>
      <div className="page-header">
        <h2>Priority Inbox</h2>
        <p>Top notifications ranked by type importance and recency</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Priority</div>
        </div>
        <div className="stat-card placement">
          <div className="stat-value">{stats.Placement}</div>
          <div className="stat-label">Placements</div>
        </div>
        <div className="stat-card result">
          <div className="stat-value">{stats.Result}</div>
          <div className="stat-label">Results</div>
        </div>
        <div className="stat-card event">
          <div className="stat-value">{stats.Event}</div>
          <div className="stat-label">Events</div>
        </div>
      </div>

      <FilterBar
        activeType={typeFilter}
        onTypeChange={(t) => {
          setTypeFilter(t);
          Log("frontend", "info", "page", `priority filter: ${t || "all"}`);
        }}
        limit={topN}
        onLimitChange={setTopN}
      />

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Ranking notifications...</span>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={reload}>Retry</button>
        </div>
      )}

      {!loading && !error && ranked.length === 0 && (
        <div className="empty-state">Nothing to rank.</div>
      )}

      {!loading && !error && ranked.length > 0 && (
        <div className="notifications-grid">
          {ranked.map((n) => (
            <NotificationCard
              key={n.ID}
              notification={n}
              isViewed={isViewed(n.ID)}
              onView={markViewed}
              score={n.priorityScore}
            />
          ))}
        </div>
      )}
    </div>
  );
}
