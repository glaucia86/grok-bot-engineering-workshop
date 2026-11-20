import { appendFileSync } from "node:fs";
import { isolatedDatabaseDecision } from "../src/lib/preview-e2e.ts";

const decision = isolatedDatabaseDecision(process.env);
const strict = process.argv.includes("--strict");
console.log(decision.reason);
if (process.env.DISPATCH_ISOLATED_AUTHORIZED !== undefined && process.env.DISPATCH_ISOLATED_AUTHORIZED !== "true") {
  console.error("BLOCKED: dispatch input isolated_authorized is not true.");
  if (strict) process.exit(1);
}
if (
  process.env.DISPATCH_QA_DATABASE_ID !== undefined &&
  process.env.DISPATCH_QA_DATABASE_ID !== process.env.MVP_PREVIEW_APPROVED_QA_DATABASE_ID
) {
  console.error("BLOCKED: qa_database_id does not match MVP_PREVIEW_APPROVED_QA_DATABASE_ID.");
  if (strict) process.exit(1);
}
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `enabled=${decision.enabled ? "true" : "false"}\n`);
}
if (strict && !decision.enabled) process.exit(1);
