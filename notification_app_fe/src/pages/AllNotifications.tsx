import { useState, useMemo } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { useViewedState } from "../hooks/useViewedState";
import { NotificationCard } from "../components/NotificationCard";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { Log } from "../services/logger";
import type { NotificationType } from "../types";

export function AllNotifications() {
  const [typeFilter, setTypeFilter] = useState<NotificationType | null>(null);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const { notifications, loading, error, reload } = useNotifications({
    limit,
    page,
    notificationType: typeFilter,
  });

  const { markViewed, isViewed } = useViewedState();

  const stats = useMemo(() => {
    const c = { total: notifications.length, Placement: 0, Result: 0, Event: 0, unread: 0 };
    notifications.forEach((n) => {
      c[n.Type]++;
      if (!isViewed(n.ID)) c.unread++;
    });
    return c;
  }, [notifications, isViewed]);

  const onTypeChange = async (t: NotificationType | null) => {
    setTypeFilter(t);
    setPage(1);
    await Log("frontend", "info", "page", `filter: ${t || "all"}`);
  };

  const onLimitChange = async (l: number) => {
    setLimit(l);
    setPage(1);
    await Log("frontend", "info", "page", `limit: ${l}`);
  };

  return (
    <div>
      <div className="page-header">
        <h2>All Notifications</h2>
        <p>Browse campus notifications with type filters and pagination</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Showing</div>
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
        <div className="stat-card">
          <div className="stat-value">{stats.unread}</div>
          <div className="stat-label">New</div>
        </div>
      </div>

      <FilterBar
        activeType={typeFilter}
        onTypeChange={onTypeChange}
        limit={limit}
        onLimitChange={onLimitChange}
      />

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading...</span>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={reload}>Retry</button>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="empty-state">No notifications match this filter.</div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <>
          <div className="notifications-grid">
            {notifications.map((n) => (
              <NotificationCard
                key={n.ID}
                notification={n}
                isViewed={isViewed(n.ID)}
                onView={markViewed}
              />
            ))}
          </div>
          <Pagination
            currentPage={page}
            onPageChange={(p) => { setPage(p); Log("frontend", "info", "page", `page ${p}`); }}
            hasMore={notifications.length === limit}
          />
        </>
      )}
    </div>
  );
}
