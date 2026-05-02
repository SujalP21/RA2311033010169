import { useState, useMemo } from "react";
import {
  Box, Typography, Paper, CircularProgress, Alert, Button, Stack,
} from "@mui/material";
import { useNotifications } from "../hooks/useNotifications";
import { useViewedState } from "../hooks/useViewedState";
import { NotificationCard } from "../components/NotificationCard";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { Log } from "../services/logger";
import type { NotificationType } from "../types";

// stat colors matching the earthy theme
const STAT_COLORS: Record<string, string> = {
  Placement: "#5C6B4F", Result: "#8B6F47", Event: "#C67F59",
};

export function AllNotifications() {
  const [typeFilter, setTypeFilter] = useState<NotificationType | null>(null);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const { notifications, loading, error, reload } = useNotifications({
    limit, page, notificationType: typeFilter,
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
    setTypeFilter(t); setPage(1);
    await Log("frontend", "info", "page", `filter: ${t || "all"}`);
  };

  const onLimitChange = async (l: number) => {
    setLimit(l); setPage(1);
    await Log("frontend", "info", "page", `limit: ${l}`);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>All Notifications</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Browse campus notifications with type filters and pagination
      </Typography>

      {/* stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {[
          { label: "Showing", value: stats.total },
          { label: "Placements", value: stats.Placement, color: STAT_COLORS.Placement },
          { label: "Results", value: stats.Result, color: STAT_COLORS.Result },
          { label: "Events", value: stats.Event, color: STAT_COLORS.Event },
          { label: "New", value: stats.unread },
        ].map((s) => (
          <Paper key={s.label} variant="outlined" sx={{ px: 2.5, py: 1.5, flex: 1, minWidth: 100 }}>
            <Typography variant="h5" sx={{ color: s.color || "text.primary" }}>{s.value}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {s.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      <FilterBar activeType={typeFilter} onTypeChange={onTypeChange} limit={limit} onLimitChange={onLimitChange} />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={reload}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
          No notifications match this filter.
        </Typography>
      )}

      {!loading && !error && notifications.length > 0 && (
        <>
          <Stack spacing={1.2}>
            {notifications.map((n) => (
              <NotificationCard key={n.ID} notification={n} isViewed={isViewed(n.ID)} onView={markViewed} />
            ))}
          </Stack>
          <Pagination
            currentPage={page}
            onPageChange={(p) => { setPage(p); Log("frontend", "info", "page", `page ${p}`); }}
            hasMore={notifications.length === limit}
          />
        </>
      )}
    </Box>
  );
}
