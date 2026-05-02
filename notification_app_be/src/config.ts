// config for the notification backend

const BASE = "http://20.207.122.201/evaluation-service";

export const NOTIFICATIONS_API = `${BASE}/notifications`;

// how much each type matters relative to each other
export const TYPE_WEIGHTS: Record<string, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

// composite score = TYPE_W * typeScore + RECENCY_W * recencyScore
export const TYPE_W = 0.6;
export const RECENCY_W = 0.4;

export const DEFAULT_TOP_N = 10;
