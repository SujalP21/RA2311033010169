import type { Notification } from "../types";

interface Props {
  notification: Notification;
  isViewed: boolean;
  onView: (id: string) => void;
  score?: number;
}

// relative time string like "3h ago", "2d ago"
function timeAgo(ts: string): string {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function NotificationCard({ notification, isViewed, onView, score }: Props) {
  const { ID, Type, Message, Timestamp } = notification;

  const handleClick = () => {
    if (!isViewed) onView(ID);
  };

  return (
    <div
      className={`notification-card ${isViewed ? "viewed" : "new"}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <div className={isViewed ? "viewed-indicator" : "new-indicator"} />

      <div className="card-content">
        <div className="card-top">
          <span className={`type-badge ${Type.toLowerCase()}`}>{Type}</span>
          {isViewed && <span className="viewed-tag">viewed</span>}
        </div>
        <div className="card-message">{Message}</div>
        <div className="card-timestamp">{timeAgo(Timestamp)}</div>
      </div>

      {score !== undefined && (
        <div className="card-score">⚡ {score}</div>
      )}
    </div>
  );
}
