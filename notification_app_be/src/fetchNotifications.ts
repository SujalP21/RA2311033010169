import * as http from "http";
import { getToken } from "logging-middleware/dist/auth";
import { Log } from "logging-middleware";
import { NOTIFICATIONS_API } from "./config";

export interface Notification {
  ID: string;
  Type: "Placement" | "Result" | "Event";
  Message: string;
  Timestamp: string;
}

// pulls notifications from the evaluation service
export async function fetchNotifications(): Promise<Notification[]> {
  await Log("backend", "info", "service", "starting notification fetch");

  let token: string;
  try {
    token = await getToken();
    await Log("backend", "debug", "service", "got bearer token");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("backend", "error", "service", `token error: ${msg}`);
    throw err;
  }

  return new Promise((resolve, reject) => {
    const parsed = new URL(NOTIFICATIONS_API);

    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
      (res) => {
        let raw = "";
        res.on("data", (c: string) => (raw += c));
        res.on("end", async () => {
          if (res.statusCode !== 200) {
            await Log("backend", "error", "service", `got HTTP ${res.statusCode}`);
            reject(new Error(`API status ${res.statusCode}: ${raw}`));
            return;
          }

          try {
            const body = JSON.parse(raw);
            const items = body.notifications || [];
            await Log("backend", "info", "service", `fetched ${items.length} notifications`);
            resolve(items);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            await Log("backend", "error", "service", `parse error: ${msg}`);
            reject(new Error(`JSON parse failed: ${msg}`));
          }
        });
      }
    );

    req.on("error", async (e) => {
      await Log("backend", "fatal", "service", `network error: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}
