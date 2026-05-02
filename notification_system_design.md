# Stage 1

## Notification System Design — Priority Inbox

### Problem Statement

The campus notification platform generates a high volume of notifications across three categories — **Placement**, **Result**, and **Event**. Users report losing track of important notifications. The goal is to implement a **Priority Inbox** that surfaces the top `N` most important unread notifications based on type importance and recency.

---

### Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Priority Inbox                        │
│                                                          │
│  ┌────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Fetch      │───>│ Priority     │───>│ Display      │  │
│  │ Module     │    │ Engine       │    │ Formatter    │  │
│  └────────────┘    └──────────────┘    └──────────────┘  │
│        │                  │                    │          │
│        ▼                  ▼                    ▼          │
│  [GET /notifications] [Scoring Algo]   [Ranked Output]   │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │            Logging Middleware (cross-cutting)         │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

### Priority Scoring Algorithm

The composite priority score combines two normalized dimensions:

```
finalScore = (TYPE_FACTOR × typeScore) + (RECENCY_FACTOR × recencyScore)
```

Where:
- `TYPE_FACTOR = 0.6` — Type importance is the primary ranking dimension
- `RECENCY_FACTOR = 0.4` — Recency serves as a secondary factor and tiebreaker

#### Type Weights

| Type       | Weight | Normalized Score | Rationale                                        |
|------------|--------|------------------|--------------------------------------------------|
| Placement  | 3      | 1.000            | Career-impacting; requires immediate attention   |
| Result     | 2      | 0.667            | Academic results; time-sensitive but less urgent  |
| Event      | 1      | 0.333            | General campus events; informational              |

#### Recency Normalization

Timestamps are normalized to a `[0, 1]` range relative to the current batch:

```
recencyScore = (timestamp - minTimestamp) / (maxTimestamp - minTimestamp)
```

- Score of `1.0` = most recent notification in the batch
- Score of `0.0` = oldest notification in the batch
- If all timestamps are identical, all receive a score of `1.0`

#### Tiebreaking

When two notifications have identical composite scores (within a `0.0001` tolerance), the more recent notification is ranked higher.

---

### Handling Continuous Incoming Notifications

The current implementation uses a **sort-and-slice** approach (`O(n log n)`), suitable for moderate batch sizes (< 1000 notifications). For production-scale streaming:

#### Min-Heap Approach (Recommended for Scale)

Maintain a **min-heap** of size `N` (where N = desired top notifications):

1. For each incoming notification, compute its priority score
2. If the heap has fewer than `N` items, insert directly
3. If the new score exceeds the heap minimum, replace the min and re-heapify
4. Time complexity: `O(n log N)` per batch, where N << n

This is optimal when:
- New notifications arrive continuously (streaming/polling)
- Only the top `N` are needed (not a full sort)
- Memory is constrained (only `N` items in memory)

#### Current Implementation Trade-offs

| Aspect          | Current (Sort)       | Min-Heap (Proposed)  |
|-----------------|----------------------|----------------------|
| Time            | O(n log n)           | O(n log N)           |
| Space           | O(n)                 | O(N)                 |
| Best for        | Small batches        | Streaming/large data |
| Implementation  | Simple               | Moderate             |

---

### Module Structure

```
notification_app_be/
├── src/
│   ├── index.js               # Entry point — orchestrates fetch → rank → display
│   ├── fetchNotifications.js  # HTTP client for the Notification API
│   ├── priorityEngine.js      # Scoring algorithm and ranking logic
│   └── config.js              # Centralized constants and tuning parameters
└── package.json

logging_middleware/
├── src/
│   ├── index.js               # Log(stack, level, package, message) function
│   └── auth.js                # Token acquisition and caching
└── package.json
```

---

### Logging Strategy

The logging middleware is integrated at every significant decision point:

| Module             | Level   | Examples                                    |
|--------------------|---------|---------------------------------------------|
| main               | info    | Application start/stop, final results count |
| fetchNotifications | info    | Fetch initiation, response count            |
| fetchNotifications | debug   | Token acquisition status                    |
| fetchNotifications | error   | HTTP errors, parse failures                 |
| fetchNotifications | fatal   | Network unreachable                         |
| priorityEngine     | info    | Ranking started, top/bottom scores          |
| priorityEngine     | debug   | Timestamp range, type distribution          |
| priorityEngine     | warn    | Empty notification set                      |

---

### API Integration

**Notification API (GET)**
- Endpoint: `http://20.207.122.201/evaluation-service/notifications`
- Authentication: Bearer token via `/evaluation-service/auth`
- Response: `{ "notifications": [{ ID, Type, Message, Timestamp }] }`

**Log API (POST)**
- Endpoint: `http://20.207.122.201/evaluation-service/logs`
- Payload: `{ stack, level, package, message }`
- Authentication: Bearer token (same auth flow)

---

### Sample Output

Running `node src/index.js 10` produces:

| Rank | Type      | Score  | Message                          |
|------|-----------|--------|----------------------------------|
| 1    | Placement | 0.98   | Nvidia Corporation hiring        |
| 2    | Placement | 0.8827 | Eli Lilly and Company hiring     |
| 3    | Placement | 0.8439 | Marriott International Inc.      |
| 4    | Result    | 0.80   | mid-sem                          |
| 5    | Result    | 0.7803 | end-sem                          |
| ...  | ...       | ...    | ...                              |

The output confirms the priority model: Placements dominate the top positions due to their higher type weight, while recent Results outrank older Placements (e.g., Rank #4 mid-sem beats Rank #6 Broadcom).
