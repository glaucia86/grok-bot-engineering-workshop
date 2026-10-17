import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const referenceOnly = [
  ["route /feedback", "src/app/feedback/page.tsx"],
  ["route /results", "src/app/results/page.tsx"],
  ["feedback form component", "src/components/feedback-form.tsx"],
  ["feedback dashboard component", "src/components/feedback-dashboard.tsx"],
];
const sharedFiles = [
  ["feedback API route", "src/app/api/feedback/route.ts"],
  ["feedback schema", "src/lib/feedback-schema.ts"],
  ["statistics helper", "src/lib/stats.ts"],
];
const uiPrimitives = ["button.tsx", "card.tsx", "chart.tsx", "input.tsx", "label.tsx", "textarea.tsx"];

function hasScript(root, name) {
  try {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
    return typeof pkg.scripts?.[name] === "string" && pkg.scripts[name].length > 0;
  } catch {
    return false;
  }
}

function hasMigration(root) {
  const directory = resolve(root, "drizzle");
  return existsSync(directory) && readdirSync(directory, { recursive: true }).some((file) => String(file).endsWith(".sql"));
}

export function compareCheckpoint(mvpRoot, expected) {
  if (expected !== "starter" && expected !== "reference") throw new TypeError("expected must be 'starter' or 'reference'");
  const root = resolve(mvpRoot);
  const wantsReference = expected === "reference";
  const rows = referenceOnly.map(([check, file]) => ({ check, present: existsSync(resolve(root, file)), expected: wantsReference }));
  const homepage = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
  rows.push({ check: "form/rating text on homepage", present: /<form\b|feedback\s+form|\brating\b/i.test(homepage), expected: wantsReference });
  rows.push({ check: "test:e2e script", present: hasScript(root, "test:e2e"), expected: wantsReference });
  for (const [check, file] of sharedFiles) rows.push({ check, present: existsSync(resolve(root, file)), expected: true });
  rows.push({ check: "Drizzle migration", present: hasMigration(root), expected: true });
  rows.push({ check: "UI primitives", present: uiPrimitives.every((file) => existsSync(resolve(root, "src/components/ui", file))), expected: true });
  rows.push({ check: "verify:http script", present: hasScript(root, "verify:http"), expected: true });
  const completedRows = rows.map((row) => ({ ...row, pass: row.present === row.expected }));
  return { ok: completedRows.every((row) => row.pass), rows: completedRows };
}

function runCli() {
  const [mvpRoot, flag, expected, ...extra] = process.argv.slice(2);
  if (!mvpRoot || flag !== "--expect" || !expected || extra.length) {
    console.error("Usage: node scripts/compare-checkpoint.mjs <mvp-path> --expect starter|reference");
    process.exitCode = 1;
    return;
  }
  try {
    const result = compareCheckpoint(mvpRoot, expected);
    console.table(result.rows);
    process.exitCode = result.ok ? 0 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) runCli();
