import { Log } from "logging-middleware";
import { fetchNotifications } from "./fetchNotifications";
import { rankNotifications, ScoredNotification } from "./priorityEngine";
import { DEFAULT_TOP_N } from "./config";

function fmtRow(n: ScoredNotification, rank: number): string {
  return [
    `  #${rank}`,
    `  ID:      ${n.ID}`,
    `  Type:    ${n.Type}`,
    `  Message: ${n.Message}`,
    `  Time:    ${n.Timestamp}`,
    `  Score:   ${n._scores.finalScore} (type=${n._scores.typeScore}, recency=${n._scores.recencyScore})`,
    `  ${"─".repeat(58)}`,
  ].join("\n");
}

function printTable(items: ScoredNotification[]): void {
  const hdr = `${"#".padEnd(5)}${"Type".padEnd(12)}${"Score".padEnd(9)}${"Message".padEnd(34)}Timestamp`;
  const line = "─".repeat(hdr.length);

  process.stdout.write(`\n${line}\n${hdr}\n${line}\n`);

  items.forEach((n, i) => {
    process.stdout.write(
      `${String(i + 1).padEnd(5)}` +
      `${n.Type.padEnd(12)}` +
      `${String(n._scores.finalScore).padEnd(9)}` +
      `${n.Message.substring(0, 32).padEnd(34)}` +
      `${n.Timestamp}\n`
    );
  });

  process.stdout.write(`${line}\n`);
}

async function main(): Promise<void> {
  const topN = parseInt(process.argv[2], 10) || DEFAULT_TOP_N;

  await Log("backend", "info", "controller", `priority inbox starting, top ${topN}`);

  try {
    const all = await fetchNotifications();
    await Log("backend", "info", "controller", `got ${all.length} total`);

    if (all.length === 0) {
      process.stdout.write("No notifications.\n");
      await Log("backend", "warn", "controller", "empty response from API");
      return;
    }

    const top = await rankNotifications(all, topN);

    // header
    process.stdout.write(
      `\n╔══════════════════════════════════════════════════╗\n` +
      `║      PRIORITY INBOX — Top ${String(topN).padEnd(3)} Notifications    ║\n` +
      `╚══════════════════════════════════════════════════╝\n\n`
    );
    process.stdout.write(`Total: ${all.length} | Showing: ${top.length}\n`);
    process.stdout.write(`Score = 0.6*type + 0.4*recency\n`);
    process.stdout.write(`Weights: Placement(3) > Result(2) > Event(1)\n\n`);

    top.forEach((n, i) => process.stdout.write(fmtRow(n, i + 1) + "\n"));
    printTable(top);

    // type breakdown
    const counts: Record<string, number> = {};
    top.forEach((n) => { counts[n.Type] = (counts[n.Type] || 0) + 1; });
    process.stdout.write(
      `\nBreakdown: ${Object.entries(counts).map(([t, c]) => `${t}=${c}`).join(", ")}\n`
    );

    await Log("backend", "info", "controller", `done, showed ${top.length}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await Log("backend", "fatal", "controller", `crashed: ${msg}`);
    process.stderr.write(`Error: ${msg}\n`);
    process.exit(1);
  }
}

main();
