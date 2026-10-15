// Smoke-test the real production server without database credentials or writes.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";

const listener = net.createServer();
await new Promise((resolve, reject) => {
  listener.once("error", reject);
  listener.listen(0, "127.0.0.1", resolve);
});
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const target = `http://127.0.0.1:${port}`;
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
// An explicit empty value prevents Next.js from reloading a URL from .env files.
env.DATABASE_URL = "";
const server = spawn(process.execPath, [
  "node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port),
], { env, stdio: ["ignore", "pipe", "pipe"] });
const exited = once(server, "exit");
let output = "";
server.stdout.on("data", (chunk) => { output += chunk; });
server.stderr.on("data", (chunk) => { output += chunk; });
let spawnError;
server.on("error", (error) => { spawnError = error; });
async function request(path, options = {}) {
  return fetch(`${target}${path}`, { ...options, signal: AbortSignal.timeout(5000) });
}
try {
  let healthy = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (spawnError) throw spawnError;
    if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
    // Own startup marker first: avoid driving an unrelated process after a port race.
    if (output.includes("Ready in")) {
      try {
        const response = await request("/");
        await response.text();
        if (response.status === 200) { healthy = true; break; }
      } catch { /* retry startup until bounded timeout */ }
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(healthy, `Server did not become healthy: ${output}`);
  console.log(`Target: ${target}; owned PID: ${server.pid}; GET /: 200`);
  const old = await request("/feedback", { method: "POST", body: "{}" });
  await old.text();
  assert.equal(old.status, 404);
  console.log("POST /feedback: 404 (separate Next.js app; Fastify unchanged)");
  const invalid = await request("/api/feedback", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ talkId: " ", author: "Ana", comment: "hello", rating: "5" }),
  });
  const errors = await invalid.json();
  assert.equal(invalid.status, 400);
  assert.equal(errors.errors.talkId, "talkId is required");
  assert.equal(errors.errors.rating, "rating must be a number");
  console.log(`POST /api/feedback: 400 ${JSON.stringify(errors)}`);
  console.log("Result: 3/3 HTTP checks PASS; no valid submission or remote DB access");
} finally {
  if (server.exitCode === null && !spawnError) {
    server.kill("SIGTERM");
    const timer = setTimeout(() => server.kill("SIGKILL"), 5000);
    try { await exited; } finally { clearTimeout(timer); }
  }
}
