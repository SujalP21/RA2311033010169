import { Log } from "logging-middleware";
import { fetchNotifications } from "./fetchNotifications";
import { rankNotifications, ScoredNotification } from "./priorityEngine";
import { DEFAULT_TOP_N } from "./config";

function formatNotification(n: ScoredNotification, rank: number): string {
  return [
    `  Rank #${rank}`,
    `  ID:       ${n.ID}`,
    `  Type:     ${n.Type}`,
    `  Message:  ${n.Message}`,
    `  Time:     ${n.Timestamp}`,
    `  Score:    ${n._scores.finalScore} (type: ${n._scores.typeScore}, recency: ${n._scores.recencyScore})`,
    `  ${"─".repeat(60)}`,
  ].join("\n");
}

function printTable(notifications: ScoredNotification[]): void {
  const header = `${"Rank".padEnd(6)}${"Type".padEnd(12)}${"Score".padEnd(10)}${"Message".padEnd(35)}Timestamp`;
  const sep = "─".repeat(header.length);

  process.stdout.write(`\n${sep}\n${header}\n${sep}\n`);

  notifications.forEach((n, i) => {
    const row =
      `${String(i + 1).padEnd(6)}` +
      `${n.Type.padEnd(12)}` +
      `${String(n._scores.finalScore).padEnd(10)}` +
      `${n.Message.substring(0, 33).padEnd(35)}` +
      `${n.Timestamp}`;
    process.stdout.write(`${row}\n`);
  });

  process.stdout.write(`${sep}\n`);
}

async function main(): Promise<void> {
  const topN = parseInt(process.argv[2], 10) || DEFAULT_TOP_N;

  await Log("backend", "info", "controller", `Starting Priority Inbox — top ${topN}`);

  try {
    const notifications = await fetchNotifications();
    await Log("backend", "info", "controller", `Fetched ${notifications.length} notifications`);

    if (notifications.length === 0) {
      process.stdout.write("No notifications found.\n");
      await Log("backend", "warn", "controller", "Zero notifications returned");
      return;
    }

    const top = await rankNotifications(notifications, topN);

    // display
    process.stdout.write(
      `\n╔══════════════════════════════════════════════════════════════╗\n` +
      `║           PRIORITY INBOX — Top ${String(topN).padEnd(3)} Notifications           ║\n` +
      `╚══════════════════════════════════════════════════════════════╝\n\n`
    );
    process.stdout.write(`Total: ${notifications.length} | Showing: ${top.length}\n`);
    process.stdout.write(`Formula: 0.6 × typeWeight + 0.4 × recencyScore\n`);
    process.stdout.write(`Weights: Placement(3) > Result(2) > Event(1)\n\n`);

    top.forEach((n, i) => process.stdout.write(formatNotification(n, i + 1) + "\n"));
    printTable(top);

    const counts: Record<string, number> = {};
    top.forEach((n) => { counts[n.Type] = (counts[n.Type] || 0) + 1; });
    process.stdout.write(
      `\nType breakdown: ${Object.entries(counts).map(([t, c]) => `${t}: ${c}`).join(" | ")}\n`
    );

    await Log("backend", "info", "controller", `Done — displayed ${top.length} notifications`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("backend", "fatal", "controller", `Priority Inbox failed: ${msg}`);
    process.stderr.write(`Fatal error: ${msg}\n`);
    process.exit(1);
  }
}

main();
