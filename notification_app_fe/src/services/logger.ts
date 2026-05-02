// browser-side logging middleware
// same Log(stack, level, pkg, msg) interface as the backend package
// but uses fetch instead of node http

import { getToken } from "./auth";

type Stack = "backend" | "frontend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";
type FePkg = "api" | "component" | "hook" | "page" | "state" | "style"
  | "auth" | "config" | "middleware" | "utils";

export async function Log(
  stack: Stack,
  level: Level,
  pkg: FePkg,
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
    // don't let a logging failure break the UI
  }
}
