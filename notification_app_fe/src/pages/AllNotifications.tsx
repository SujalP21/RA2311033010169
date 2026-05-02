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

  const { markAsViewed, isViewed } = useViewedState();

  // compute stats from current batch
  const stats = useMemo(() => {
    const counts = { total: notifications.length, Placement: 0, Result: 0, Event: 0, newCount: 0 };
    notifications.forEach((n) => {
      counts[n.Type]++;
      if (!isViewed(n.ID)) counts.newCount++;
    });
    return counts;
  }, [notifications, isViewed]);

  const handleTypeChange = async (type: NotificationType | null) => {
    setTypeFilter(type);
    setPage(1);
    await Log("frontend", "info", "page", `Filter changed to: ${type || "all"}`);
  };

  const handleLimitChange = async (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    await Log("frontend", "info", "page", `Limit changed to: ${newLimit}`);
  };

  const handlePageChange = async (newPage: number) => {
    setPage(newPage);
    await Log("frontend", "info", "page", `Navigated to page ${newPage}`);
  };

  return (
    <div>
      <div className="page-header">
        <h2>All Notifications</h2>
        <p>Browse all campus notifications with filtering and pagination</p>
      </div>

      {/* stats */}
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
          <div className="stat-value">{stats.newCount}</div>
          <div className="stat-label">New</div>
        </div>
      </div>

      <FilterBar
        activeType={typeFilter}
        onTypeChange={handleTypeChange}
        limit={limit}
        onLimitChange={handleLimitChange}
      />

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading notifications...</span>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>Failed to load notifications: {error}</p>
          <button onClick={reload}>Retry</button>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="empty-state">
          <p>No notifications found for this filter.</p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <>
          <div className="notifications-grid">
            {notifications.map((n) => (
              <NotificationCard
                key={n.ID}
                notification={n}
                isViewed={isViewed(n.ID)}
                onView={markAsViewed}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            onPageChange={handlePageChange}
            hasMore={notifications.length === limit}
          />
        </>
      )}
    </div>
  );
}
