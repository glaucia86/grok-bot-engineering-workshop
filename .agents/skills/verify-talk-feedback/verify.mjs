#!/usr/bin/env node
// Boots the Talk Feedback API, calls its endpoints, and prints evidence.
// Usage: npm run verify   (exit code 0 = all PASS, 1 = any FAIL)
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const freePort = () =>
  new Promise((resolve) => {
    const s = createServer();
    s.listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

const port = Number(process.env.PORT) || (await freePort());
const base = `http://localhost:${port}`;
const server = spawn("npx", ["tsx", "src/server.ts"], {
  env: { ...process.env, PORT: String(port) },
  stdio: "ignore",
  detached: true,
});
const stop = () => {
  try { process.kill(-server.pid); } catch {}
};

async function waitForHealth() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/health`)).ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

// Each check: [name, method, path, body, expected status, extra assertion]
const checks = [
  ["health", "GET", "/health", undefined, 200, (b) => b.status === "ok"],
  ["create feedback", "POST", "/feedback", { talkId: "keynote", author: "verify", comment: "evidence" }, 201, (b) => b.id >= 1],
  ["reject invalid feedback", "POST", "/feedback", { talkId: "keynote" }, 400, () => true],
  ["list feedback", "GET", "/feedback?talkId=keynote", undefined, 200, (b) => Array.isArray(b) && b.length >= 1],
];
// Extra checks (added when features land) live in checks.extra.mjs
try {
  const extra = await import("./checks.extra.mjs");
  checks.push(...extra.default);
} catch (error) {
  stop();
  throw error;
}

let failed = 0;
console.log(`# Verification evidence: Talk Feedback API\n\nServer: ${base} (started ${new Date().toISOString()})\n`);
if (!(await waitForHealth())) {
  console.log("FAIL server did not become healthy");
  stop();
  process.exit(1);
}
for (const [name, method, path, body, status, assert] of checks) {
  const res = await fetch(base + path, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  const ok = res.status === status && assert(json);
  if (!ok) failed++;
  console.log(`## ${ok ? "PASS" : "FAIL"} ${name}`);
  console.log(`$ curl -s -X ${method} ${base}${path}${body ? ` -H 'content-type: application/json' -d '${JSON.stringify(body)}'` : ""}`);
  console.log(`-> ${res.status} (expected ${status}) ${text}\n`);
}
stop();
console.log(`Result: ${checks.length - failed}/${checks.length} PASS`);
process.exit(failed ? 1 : 0);
