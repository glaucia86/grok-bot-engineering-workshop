#!/usr/bin/env node
// Boots one owned Node process, executes curl requests, and preserves evidence.
import { execFile, spawn } from "node:child_process";
import { createServer } from "node:net";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";

const exec = promisify(execFile);
const freePort = () => new Promise((resolve, reject) => {
  const socket = createServer();
  socket.once("error", reject);
  socket.listen(0, "127.0.0.1", () => {
    const { port } = socket.address();
    socket.close((error) => error ? reject(error) : resolve(port));
  });
});

// Validate required checks before starting anything that needs cleanup.
const { default: extra } = await import("./checks.extra.mjs");
const checks = [
  ["health", "GET", "/health", undefined, 200, (b) => b.status === "ok"],
  ["create feedback", "POST", "/feedback", { talkId: "keynote", author: "verify", comment: "evidence" }, 201, (b) => b.id >= 1],
  ["reject invalid feedback", "POST", "/feedback", { talkId: "keynote" }, 400, () => true],
  ["list feedback", "GET", "/feedback?talkId=keynote", undefined, 200, (b) => Array.isArray(b) && b.length >= 1],
  ...extra,
];
const port = Number(process.env.PORT) || await freePort();
const base = `http://127.0.0.1:${port}`;
// Load tsx inside Node: no shell, npx wrapper, detached group, or child tree.
const server = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
  env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
let startupError;
let serverErrors = "";
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput = (serverOutput + chunk).slice(-8000); });
server.stderr.on("data", (chunk) => { serverErrors = (serverErrors + chunk).slice(-8000); });
const closed = new Promise((resolve) => {
  server.once("error", (error) => { startupError = error; resolve(); });
  server.once("close", resolve);
});
const stopped = () => startupError || server.exitCode !== null || server.signalCode !== null;
async function stop() {
  if (!stopped()) server.kill();
  // Windows terminates this single process; POSIX gets a bounded graceful exit.
  const timer = setTimeout(() => { if (!stopped()) server.kill("SIGKILL"); }, 2000);
  try { await closed; } finally { clearTimeout(timer); }
}
async function waitForHealth() {
  for (let i = 0; i < 50; i++) {
    if (startupError) throw startupError;
    if (stopped()) throw new Error(`server exited before becoming healthy\n${serverErrors}`);
    try {
      // An occupied PORT might answer health from somebody else's process.
      const ready = serverOutput.includes(`Talk Feedback API listening on http://localhost:${port}`);
      if (ready && (await fetch(`${base}/health`, { signal: AbortSignal.timeout(500) })).ok) return;
    } catch {}
    await delay(200);
  }
  throw new Error(`server did not become healthy\n${serverErrors}`);
}
const quote = (value) => process.platform === "win32"
  ? `'${value.replaceAll("'", "''")}'`
  : `'${value.replaceAll("'", "'\\''")}'`;

let failed = 0;
console.log(`# Verification evidence: Talk Feedback API\n\nServer: ${base} (started ${new Date().toISOString()})\nServer PID: ${server.pid}\n`);
try {
  await waitForHealth();
  for (const [name, method, path, body, status, assert] of checks) {
    if (stopped()) throw new Error(`owned server exited during verification\n${serverErrors}`);
    const args = ["--silent", "--show-error", "--max-time", "5", "--request", method, base + path];
    if (body !== undefined) args.push("--header", "content-type: application/json", "--data-raw", JSON.stringify(body));
    args.push("--write-out", "\\n%{http_code}");
    // This is the actual executable and argument list used below (PowerShell on Windows).
    console.log(`$ curl ${args.map(quote).join(" ")}`);
    const { stdout } = await exec("curl", args, { windowsHide: true, timeout: 7000 });
    if (stopped()) throw new Error(`owned server exited during verification\n${serverErrors}`);
    const split = stdout.lastIndexOf("\n");
    const text = stdout.slice(0, split);
    const actualStatus = Number(stdout.slice(split + 1));
    let json;
    try { json = JSON.parse(text); } catch { json = text; }
    const ok = actualStatus === status && assert(json);
    if (!ok) failed++;
    console.log(`## ${ok ? "PASS" : "FAIL"} ${name}`);
    console.log(`-> ${actualStatus} (expected ${status}) ${text}\n`);
  }
  console.log(`Result: ${checks.length - failed}/${checks.length} PASS`);
  process.exitCode = failed ? 1 : 0;
} catch (error) {
  console.error(`FAIL verification: ${error.message}`);
  process.exitCode = 1;
} finally {
  await stop();
}
