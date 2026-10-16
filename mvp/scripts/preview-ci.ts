import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { previewTarget } from "../src/lib/preview-target";

type Environment = Record<string, string | undefined>;
const blocked = "BLOCKED: preview CI configuration or authorization is missing or inconsistent.";

// Pure/offline: matching configured IDs are attestations, not provider proof.
export function previewCiTarget(env: Environment) {
  try {
    if (env.GITHUB_ACTIONS !== "true" || env.GITHUB_EVENT_NAME !== "workflow_dispatch"
      || env.GITHUB_REF !== "refs/heads/main" || env.MVP_PREVIEW_QA_ENABLED !== "true") throw new Error(blocked);
    const target = previewTarget(env);
    const approved = previewTarget({
      MVP_PREVIEW_URL: env.MVP_PREVIEW_APPROVED_URL,
      MVP_PREVIEW_COMMIT: env.MVP_PREVIEW_APPROVED_COMMIT,
      MVP_PREVIEW_QA_DATABASE_ID: env.MVP_PREVIEW_APPROVED_QA_DATABASE_ID,
      MVP_PREVIEW_ISOLATED_AUTHORIZED: "true",
    });
    if (target.origin !== approved.origin || target.commit !== approved.commit
      || target.databaseId !== approved.databaseId) throw new Error(blocked);
    return target;
  } catch { throw new Error(blocked); }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    previewCiTarget(process.env);
    if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== "--check")) throw new Error(blocked);
    if (process.argv[2] === "--check") {
      console.log("Preview CI gate passed; isolation and deployment remain operator attestations. No journey started.");
    } else {
      const require = createRequire(import.meta.url);
      const child = spawn(process.execPath, [require.resolve("@playwright/test/cli"), "test", "--config=playwright.preview.config.ts"], {
        stdio: "inherit", windowsHide: true, env: { ...process.env, DATABASE_URL: "" },
      });
      child.once("error", () => { console.error("Preview runner failed to start."); process.exitCode = 1; });
      child.once("close", code => { process.exitCode = code === 0 ? 0 : 1; });
    }
  } catch { console.error(blocked); process.exitCode = 1; }
}
