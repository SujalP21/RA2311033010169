import type { NotificationType } from "../types";

interface FilterBarProps {
  activeType: NotificationType | null;
  onTypeChange: (type: NotificationType | null) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
}

export function FilterBar({ activeType, onTypeChange, limit, onLimitChange }: FilterBarProps) {
  const types: { label: string; value: NotificationType | null; className: string }[] = [
    { label: "All", value: null, className: "" },
    { label: "Placement", value: "Placement", className: "placement" },
    { label: "Result", value: "Result", className: "result" },
    { label: "Event", value: "Event", className: "event" },
  ];

  return (
    <div className="filter-bar">
      <div className="filter-group">
        {types.map((t) => (
          <button
            key={t.label}
            className={`filter-btn ${t.className} ${activeType === t.value ? "active" : ""}`}
            onClick={() => onTypeChange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="limit-selector">
        <label htmlFor="limit-select">Show:</label>
        <select
          id="limit-select"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
        </select>
      </div>
    </div>
  );
}
