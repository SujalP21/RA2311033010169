import { useState, useMemo, useEffect } from "react";
import {
  Box, Typography, Paper, CircularProgress, Alert, Button, Stack,
} from "@mui/material";
import { useNotifications } from "../hooks/useNotifications";
import { useViewedState } from "../hooks/useViewedState";
import { rankNotifications } from "../services/api";
import { NotificationCard } from "../components/NotificationCard";
import { FilterBar } from "../components/FilterBar";
import { Log } from "../services/logger";
import type { NotificationType, ScoredNotification } from "../types";

const STAT_COLORS: Record<string, string> = {
  Placement: "#5C6B4F", Result: "#8B6F47", Event: "#C67F59",
};

export function PriorityInbox() {
  const [typeFilter, setTypeFilter] = useState<NotificationType | null>(null);
  const [topN, setTopN] = useState(10);

  const { notifications, loading, error, reload } = useNotifications({
    page: 1, notificationType: typeFilter,
  });

  const { markViewed, isViewed } = useViewedState();

  const ranked: ScoredNotification[] = useMemo(() => {
    if (notifications.length === 0) return [];
    return rankNotifications(notifications, topN);
  }, [notifications, topN]);

  useEffect(() => {
    if (ranked.length > 0) {
      Log("frontend", "info", "page", `priority: top ${ranked.length} of ${notifications.length}`);
    }
  }, [ranked.length, notifications.length]);

  const stats = useMemo(() => {
    const c = { total: ranked.length, Placement: 0, Result: 0, Event: 0 };
    ranked.forEach((n) => { c[n.Type]++; });
    return c;
  }, [ranked]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Priority Inbox</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Top notifications ranked by type importance and recency
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {[
          { label: "Priority", value: stats.total },
          { label: "Placements", value: stats.Placement, color: STAT_COLORS.Placement },
          { label: "Results", value: stats.Result, color: STAT_COLORS.Result },
          { label: "Events", value: stats.Event, color: STAT_COLORS.Event },
        ].map((s) => (
          <Paper key={s.label} variant="outlined" sx={{ px: 2.5, py: 1.5, flex: 1, minWidth: 100 }}>
            <Typography variant="h5" sx={{ color: s.color || "text.primary" }}>{s.value}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {s.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      <FilterBar
        activeType={typeFilter}
        onTypeChange={(t) => { setTypeFilter(t); Log("frontend", "info", "page", `priority filter: ${t || "all"}`); }}
        limit={topN}
        onLimitChange={setTopN}
      />

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

      {!loading && !error && ranked.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
          Nothing to rank.
        </Typography>
      )}

      {!loading && !error && ranked.length > 0 && (
        <Stack spacing={1.2}>
          {ranked.map((n) => (
            <NotificationCard key={n.ID} notification={n} isViewed={isViewed(n.ID)} onView={markViewed} score={n.priorityScore} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
