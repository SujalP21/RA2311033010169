import * as http from "http";
import { getToken } from "./auth";

const LOG_API_URL = "http://20.207.122.201/evaluation-service/logs";

// valid values as defined by the evaluation service
const VALID_STACKS = ["backend", "frontend"] as const;
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;

const BACKEND_PACKAGES = [
  "cache", "controller", "cron_job", "db", "domain",
  "handler", "repository", "route", "service",
] as const;

const FRONTEND_PACKAGES = [
  "api", "component", "hook", "page", "state", "style",
] as const;

const SHARED_PACKAGES = ["auth", "config", "middleware", "utils"] as const;

export type Stack = (typeof VALID_STACKS)[number];
export type Level = (typeof VALID_LEVELS)[number];
export type BackendPackage = (typeof BACKEND_PACKAGES)[number] | (typeof SHARED_PACKAGES)[number];
export type FrontendPackage = (typeof FRONTEND_PACKAGES)[number] | (typeof SHARED_PACKAGES)[number];
export type Package = BackendPackage | FrontendPackage;

interface LogResponse {
  success: boolean;
  status?: number;
  body?: unknown;
  error?: string;
  detail?: string;
}

const VALID_PACKAGES: Record<Stack, readonly string[]> = {
  backend: [...BACKEND_PACKAGES, ...SHARED_PACKAGES],
  frontend: [...FRONTEND_PACKAGES, ...SHARED_PACKAGES],
};

function validateParams(stack: string, level: string, pkg: string, message: string): void {
  if (!VALID_STACKS.includes(stack as Stack)) {
    throw new Error(`Invalid stack "${stack}". Must be one of: ${VALID_STACKS.join(", ")}`);
  }
  if (!VALID_LEVELS.includes(level as Level)) {
    throw new Error(`Invalid level "${level}". Must be one of: ${VALID_LEVELS.join(", ")}`);
  }
  if (!pkg || typeof pkg !== "string") {
    throw new Error("Package name must be a non-empty string.");
  }
  const allowed = VALID_PACKAGES[stack as Stack];
  if (!allowed.includes(pkg)) {
    throw new Error(
      `Invalid package "${pkg}" for stack "${stack}". Allowed: ${allowed.join(", ")}`
    );
  }
  if (!message || typeof message !== "string") {
    throw new Error("Message must be a non-empty string.");
  }
}

/**
 * Sends a structured log entry to the evaluation service.
 *
 * @param stack - "backend" or "frontend"
 * @param level - severity: debug | info | warn | error | fatal
 * @param pkg - module/package name (must be valid for the given stack)
 * @param message - human-readable description
 */
export async function Log(
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): Promise<LogResponse> {
  validateParams(stack, level, pkg, message);

  let token: string;
  try {
    token = await getToken();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[LogMiddleware] Auth failure: ${msg}\n`);
    return { success: false, error: "auth_failure", detail: msg };
  }

  const payload = JSON.stringify({ stack, level, package: pkg, message });

  return new Promise((resolve) => {
    const urlObj = new URL(LOG_API_URL);

    const options: http.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        Authorization: `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => (data += chunk));
      res.on("end", () => {
        try {
          const body = JSON.parse(data);
          resolve({ success: res.statusCode === 200, status: res.statusCode!, body });
        } catch {
          resolve({ success: false, status: res.statusCode!, body: data });
        }
      });
    });

    req.on("error", (err) => {
      process.stderr.write(`[LogMiddleware] Network error: ${err.message}\n`);
      resolve({ success: false, error: "network_error", detail: err.message });
    });

    req.write(payload);
    req.end();
  });
}
