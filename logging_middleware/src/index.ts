import * as http from "http";
import { getToken } from "./auth";

const LOG_URL = "http://20.207.122.201/evaluation-service/logs";

// allowed values — these are enforced by the evaluation service API
const STACKS = ["backend", "frontend"] as const;
const LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;

const BE_PACKAGES = [
  "cache", "controller", "cron_job", "db", "domain",
  "handler", "repository", "route", "service",
] as const;

const FE_PACKAGES = [
  "api", "component", "hook", "page", "state", "style",
] as const;

const COMMON_PACKAGES = ["auth", "config", "middleware", "utils"] as const;

export type Stack = (typeof STACKS)[number];
export type Level = (typeof LEVELS)[number];
export type BackendPkg = (typeof BE_PACKAGES)[number] | (typeof COMMON_PACKAGES)[number];
export type FrontendPkg = (typeof FE_PACKAGES)[number] | (typeof COMMON_PACKAGES)[number];
export type Pkg = BackendPkg | FrontendPkg;

// map stack -> allowed packages for that stack
const PKG_MAP: Record<Stack, readonly string[]> = {
  backend: [...BE_PACKAGES, ...COMMON_PACKAGES],
  frontend: [...FE_PACKAGES, ...COMMON_PACKAGES],
};

interface LogResult {
  ok: boolean;
  status?: number;
  data?: unknown;
  err?: string;
}

// validates all four params before sending to the API
function check(stack: string, level: string, pkg: string, msg: string): void {
  if (!STACKS.includes(stack as Stack))
    throw new Error(`Bad stack "${stack}"`);
  if (!LEVELS.includes(level as Level))
    throw new Error(`Bad level "${level}"`);
  if (!pkg || !PKG_MAP[stack as Stack]?.includes(pkg))
    throw new Error(`Bad package "${pkg}" for stack "${stack}"`);
  if (!msg)
    throw new Error("Message cannot be empty");
}

// sends a log entry to the evaluation service
// usage: await Log("frontend", "info", "page", "user opened dashboard")
export async function Log(
  stack: Stack,
  level: Level,
  pkg: Pkg,
  message: string
): Promise<LogResult> {
  check(stack, level, pkg, message);

  let token: string;
  try {
    token = await getToken();
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : String(e);
    process.stderr.write(`[log-mw] auth error: ${detail}\n`);
    return { ok: false, err: detail };
  }

  const body = JSON.stringify({ stack, level, package: pkg, message });

  return new Promise((resolve) => {
    const parsed = new URL(LOG_URL);

    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c: string) => (raw += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(raw);
            resolve({ ok: res.statusCode === 200, status: res.statusCode!, data: parsed });
          } catch {
            resolve({ ok: false, status: res.statusCode!, data: raw });
          }
        });
      }
    );

    req.on("error", (e) => {
      process.stderr.write(`[log-mw] network: ${e.message}\n`);
      resolve({ ok: false, err: e.message });
    });

    req.write(body);
    req.end();
  });
}
