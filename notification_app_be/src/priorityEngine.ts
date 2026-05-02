import { Log } from "logging-middleware";
import { Notification } from "./fetchNotifications";
import {
  TYPE_WEIGHTS,
  TYPE_FACTOR,
  RECENCY_FACTOR,
  DEFAULT_TOP_N,
} from "./config";

export interface ScoredNotification extends Notification {
  _scores: {
    typeScore: number;
    recencyScore: number;
    finalScore: number;
  };
}

/**
 * Normalized recency score mapped to [0, 1].
 * 1 = most recent in the dataset.
 */
function computeRecencyScore(timestampMs: number, minTs: number, maxTs: number): number {
  if (maxTs === minTs) return 1;
  return (timestampMs - minTs) / (maxTs - minTs);
}

function computeTypeScore(type: string): number {
  const weight = TYPE_WEIGHTS[type] || 1;
  const maxWeight = Math.max(...Object.values(TYPE_WEIGHTS));
  return weight / maxWeight;
}

/**
 * Ranks notifications using composite scoring:
 *   finalScore = TYPE_FACTOR * typeScore + RECENCY_FACTOR * recencyScore
 *
 * Time: O(n log n) from sort. For streaming, a min-heap of size N
 * would give O(n log N).
 */
export async function rankNotifications(
  notifications: Notification[],
  topN: number = DEFAULT_TOP_N
): Promise<ScoredNotification[]> {
  if (!notifications || notifications.length === 0) {
    await Log("backend", "warn", "service", "No notifications to rank");
    return [];
  }

  await Log("backend", "info", "service", `Ranking ${notifications.length} notifications to find top ${topN}`);

  // parse timestamps, find bounds
  const withTs = notifications.map((n) => ({
    ...n,
    _tsMs: new Date(n.Timestamp).getTime(),
  }));

  const allTs = withTs.map((n) => n._tsMs);
  const minTs = Math.min(...allTs);
  const maxTs = Math.max(...allTs);

  await Log("backend", "debug", "service", `Time range: ${new Date(minTs).toISOString()} to ${new Date(maxTs).toISOString()}`);

  // score each notification
  const scored: ScoredNotification[] = withTs.map((n) => {
    const typeScore = computeTypeScore(n.Type);
    const recencyScore = computeRecencyScore(n._tsMs, minTs, maxTs);
    const finalScore = TYPE_FACTOR * typeScore + RECENCY_FACTOR * recencyScore;

    return {
      ID: n.ID,
      Type: n.Type,
      Message: n.Message,
      Timestamp: n.Timestamp,
      _scores: {
        typeScore: parseFloat(typeScore.toFixed(4)),
        recencyScore: parseFloat(recencyScore.toFixed(4)),
        finalScore: parseFloat(finalScore.toFixed(4)),
      },
    };
  });

  // sort desc by score, tiebreak by recency
  scored.sort((a, b) => {
    const diff = b._scores.finalScore - a._scores.finalScore;
    if (Math.abs(diff) < 0.0001) {
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    }
    return diff;
  });

  const top = scored.slice(0, topN);

  await Log(
    "backend", "info", "service",
    `Ranked top ${topN}. Best: ${top[0]?._scores.finalScore}, Worst: ${top[top.length - 1]?._scores.finalScore}`
  );

  const typeCounts: Record<string, number> = {};
  top.forEach((n) => { typeCounts[n.Type] = (typeCounts[n.Type] || 0) + 1; });
  await Log("backend", "debug", "service", `Type breakdown: ${JSON.stringify(typeCounts)}`);

  return top;
}

export { computeRecencyScore, computeTypeScore };
