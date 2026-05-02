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

  // fetch all available notifications to rank client-side
  const { notifications, loading, error, reload } = useNotifications({
    page: 1,
    notificationType: typeFilter,
  });

  const { markAsViewed, isViewed } = useViewedState();

  // rank and take top N
  const ranked: ScoredNotification[] = useMemo(() => {
    if (notifications.length === 0) return [];
    return rankNotifications(notifications, topN);
  }, [notifications, topN]);

  // log when ranking completes
  useEffect(() => {
    if (ranked.length > 0) {
      Log("frontend", "info", "page", `Priority inbox: showing top ${ranked.length} of ${notifications.length}`);
    }
  }, [ranked.length, notifications.length]);

  // stats from ranked results
  const stats = useMemo(() => {
    const counts = { total: ranked.length, Placement: 0, Result: 0, Event: 0 };
    ranked.forEach((n) => { counts[n.Type]++; });
    return counts;
  }, [ranked]);

  const handleTypeChange = async (type: NotificationType | null) => {
    setTypeFilter(type);
    await Log("frontend", "info", "page", `Priority filter: ${type || "all"}`);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Priority Inbox</h2>
        <p>Top notifications ranked by importance (Placement &gt; Result &gt; Event) and recency</p>
      </div>

      {/* stats */}
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
        onTypeChange={handleTypeChange}
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
          <p>Failed to load: {error}</p>
          <button onClick={reload}>Retry</button>
        </div>
      )}

      {!loading && !error && ranked.length === 0 && (
        <div className="empty-state">
          <p>No notifications to rank.</p>
        </div>
      )}

      {!loading && !error && ranked.length > 0 && (
        <div className="notifications-grid">
          {ranked.map((n, idx) => (
            <NotificationCard
              key={n.ID}
              notification={n}
              isViewed={isViewed(n.ID)}
              onView={markAsViewed}
              score={n.priorityScore}
            />
          ))}
        </div>
      )}
    </div>
  );
}
