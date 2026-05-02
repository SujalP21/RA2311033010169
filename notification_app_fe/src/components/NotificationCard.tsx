import {
  Card, CardContent, CardActionArea, Box, Chip, Typography, Badge,
} from "@mui/material";
import FiberNewRounded from "@mui/icons-material/FiberNewRounded";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import BoltRounded from "@mui/icons-material/BoltRounded";
import type { Notification } from "../types";

interface Props {
  notification: Notification;
  isViewed: boolean;
  onView: (id: string) => void;
  score?: number;
}

// type -> chip color
const TYPE_COLORS: Record<string, "success" | "warning" | "info"> = {
  Placement: "success",
  Result: "warning",
  Event: "info",
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function NotificationCard({ notification, isViewed, onView, score }: Props) {
  const { ID, Type, Message, Timestamp } = notification;

  return (
    <Card
      sx={{
        opacity: isViewed ? 0.72 : 1,
        borderLeft: isViewed ? "none" : "3px solid",
        borderLeftColor: isViewed ? "transparent" : "warning.main",
        "&:hover": { opacity: 1 },
      }}
    >
      <CardActionArea onClick={() => !isViewed && onView(ID)} sx={{ p: 0 }}>
        <CardContent sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 1.8, px: 2.5 }}>
          {/* new/viewed icon */}
          <Box sx={{ pt: 0.3 }}>
            {isViewed ? (
              <CheckCircleOutlined sx={{ fontSize: 18, color: "divider" }} />
            ) : (
              <Badge variant="dot" color="warning" sx={{ "& .MuiBadge-dot": { width: 9, height: 9, borderRadius: "50%" } }}>
                <FiberNewRounded sx={{ fontSize: 18, color: "warning.main" }} />
              </Badge>
            )}
          </Box>

          {/* content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Chip
                label={Type}
                size="small"
                color={TYPE_COLORS[Type] || "default"}
                variant="outlined"
                sx={{ fontSize: "0.72rem", height: 22 }}
              />
              {isViewed && (
                <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>
                  viewed
                </Typography>
              )}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.3 }}>{Message}</Typography>
            <Typography variant="caption" color="text.secondary">{timeAgo(Timestamp)}</Typography>
          </Box>

          {/* priority score badge */}
          {score !== undefined && (
            <Chip
              icon={<BoltRounded sx={{ fontSize: 14 }} />}
              label={score}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontSize: "0.78rem", fontWeight: 700, mt: 0.5 }}
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
