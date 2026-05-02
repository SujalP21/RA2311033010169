import { Log } from "logging-middleware";
import { Notification } from "./fetchNotifications";
import { TYPE_WEIGHTS, TYPE_W, RECENCY_W, DEFAULT_TOP_N } from "./config";

export interface ScoredNotification extends Notification {
  _scores: {
    typeScore: number;
    recencyScore: number;
    finalScore: number;
  };
}

// maps timestamp to [0,1] where 1 = most recent in batch
function recencyScore(tsMs: number, minTs: number, maxTs: number): number {
  if (maxTs === minTs) return 1;
  return (tsMs - minTs) / (maxTs - minTs);
}

// type weight normalized against the max weight
function typeScore(type: string): number {
  const w = TYPE_WEIGHTS[type] || 1;
  const maxW = Math.max(...Object.values(TYPE_WEIGHTS));
  return w / maxW;
}

// ranks all notifications and returns the top N by priority
// formula: finalScore = TYPE_W * typeScore + RECENCY_W * recencyScore
export async function rankNotifications(
  items: Notification[],
  topN: number = DEFAULT_TOP_N
): Promise<ScoredNotification[]> {
  if (!items || items.length === 0) {
    await Log("backend", "warn", "service", "nothing to rank");
    return [];
  }

  await Log("backend", "info", "service", `ranking ${items.length} items, want top ${topN}`);

  // parse all timestamps
  const withTs = items.map((n) => ({
    ...n,
    _ms: new Date(n.Timestamp).getTime(),
  }));

  const allMs = withTs.map((n) => n._ms);
  const lo = Math.min(...allMs);
  const hi = Math.max(...allMs);

  await Log("backend", "debug", "service",
    `time range: ${new Date(lo).toISOString()} -> ${new Date(hi).toISOString()}`
  );

  // compute composite score for each
  const scored: ScoredNotification[] = withTs.map((n) => {
    const ts = typeScore(n.Type);
    const rs = recencyScore(n._ms, lo, hi);
    const fs = TYPE_W * ts + RECENCY_W * rs;

    return {
      ID: n.ID,
      Type: n.Type,
      Message: n.Message,
      Timestamp: n.Timestamp,
      _scores: {
        typeScore: parseFloat(ts.toFixed(4)),
        recencyScore: parseFloat(rs.toFixed(4)),
        finalScore: parseFloat(fs.toFixed(4)),
      },
    };
  });

  // descending sort, tiebreak by recency
  scored.sort((a, b) => {
    const d = b._scores.finalScore - a._scores.finalScore;
    if (Math.abs(d) < 0.0001) {
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    }
    return d;
  });

  const result = scored.slice(0, topN);

  await Log("backend", "info", "service",
    `done. best=${result[0]?._scores.finalScore}, worst=${result[result.length - 1]?._scores.finalScore}`
  );

  // quick type breakdown
  const counts: Record<string, number> = {};
  result.forEach((n) => { counts[n.Type] = (counts[n.Type] || 0) + 1; });
  await Log("backend", "debug", "service", `types: ${JSON.stringify(counts)}`);

  return result;
}

export { recencyScore, typeScore };
