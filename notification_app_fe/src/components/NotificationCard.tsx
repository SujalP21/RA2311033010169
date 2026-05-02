import type { Notification } from "../types";

interface NotificationCardProps {
  notification: Notification;
  isViewed: boolean;
  onView: (id: string) => void;
  score?: number;
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationCard({ notification, isViewed, onView, score }: NotificationCardProps) {
  const { ID, Type, Message, Timestamp } = notification;
  const typeClass = Type.toLowerCase();

  const handleClick = () => {
    if (!isViewed) {
      onView(ID);
    }
  };

  return (
    <div
      className={`notification-card ${isViewed ? "viewed" : "new"}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {isViewed ? (
        <div className="viewed-indicator" />
      ) : (
        <div className="new-indicator" />
      )}

      <div className="card-content">
        <div className="card-top">
          <span className={`type-badge ${typeClass}`}>{Type}</span>
          {isViewed && <span className="viewed-tag">viewed</span>}
        </div>
        <div className="card-message">{Message}</div>
        <div className="card-timestamp">{formatTimestamp(Timestamp)}</div>
      </div>

      {score !== undefined && (
        <div className="card-score">
          ⚡ {score}
        </div>
      )}
    </div>
  );
}
