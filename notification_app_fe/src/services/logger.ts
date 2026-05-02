/**
 * Browser-compatible logging middleware.
 * Reimplements the Log(stack, level, package, message) interface
 * using fetch API for browser execution.
 */

import { getToken } from "./auth";

type Stack = "backend" | "frontend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";
type FrontendPackage = "api" | "component" | "hook" | "page" | "state" | "style" |
  "auth" | "config" | "middleware" | "utils";

export async function Log(
  stack: Stack,
  level: Level,
  pkg: FrontendPackage,
  message: string
): Promise<void> {
  try {
    const token = await getToken();
    await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stack, level, package: pkg, message }),
    });
  } catch {
    // silently fail — don't break the app if logging fails
  }
}
