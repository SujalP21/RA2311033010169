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

interface ApiResponse {
  notifications: Notification[];
}

/**
 * Fetches all notifications from the evaluation service API.
 */
export async function fetchNotifications(): Promise<Notification[]> {
  await Log("backend", "info", "service", "Initiating notification fetch from evaluation service");

  let token: string;
  try {
    token = await getToken();
    await Log("backend", "debug", "service", "Bearer token acquired successfully");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("backend", "error", "service", `Token acquisition failed: ${msg}`);
    throw err;
  }

  return new Promise((resolve, reject) => {
    const urlObj = new URL(NOTIFICATIONS_API);

    const options: http.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => (data += chunk));
      res.on("end", async () => {
        if (res.statusCode !== 200) {
          await Log("backend", "error", "service", `API returned HTTP ${res.statusCode}: ${data}`);
          reject(new Error(`Notification API returned status ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const parsed: ApiResponse = JSON.parse(data);
          const notifications = parsed.notifications || [];
          await Log("backend", "info", "service", `Successfully fetched ${notifications.length} notifications`);
          resolve(notifications);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          await Log("backend", "error", "service", `Failed to parse API response: ${msg}`);
          reject(new Error(`Response parse error: ${msg}`));
        }
      });
    });

    req.on("error", async (err) => {
      await Log("backend", "fatal", "service", `Network request failed: ${err.message}`);
      reject(err);
    });

    req.end();
  });
}
