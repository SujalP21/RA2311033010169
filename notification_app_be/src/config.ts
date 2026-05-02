/**
 * Configuration constants for the notification service.
 */

const BASE_URL = "http://20.207.122.201/evaluation-service";

export const NOTIFICATIONS_API = `${BASE_URL}/notifications`;

// Priority weights by notification type
// Placement > Result > Event
export const TYPE_WEIGHTS: Record<string, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

// Weighting factors for composite priority score
// finalScore = (TYPE_FACTOR * typeWeight) + (RECENCY_FACTOR * recencyScore)
export const TYPE_FACTOR = 0.6;
export const RECENCY_FACTOR = 0.4;

export const DEFAULT_TOP_N = 10;
