import { afterEach, expect, it } from "vitest";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { buildApp } from "../src/app.js";

const run = promisify(execFile);
const fixtures: string[] = [];
afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function verify(extra?: string, server?: string, env: NodeJS.ProcessEnv = {}) {
  const dir = await mkdtemp(path.join(process.cwd(), ".verify-test-"));
  fixtures.push(dir);
  await cp("src", path.join(dir, "src"), { recursive: true });
  await cp(".agents/skills/verify-talk-feedback", path.join(dir, ".agents/skills/verify-talk-feedback"), { recursive: true });
  await writeFile(path.join(dir, "package.json"), '{"type":"module"}');
  if (extra !== undefined) await writeFile(path.join(dir, ".agents/skills/verify-talk-feedback/checks.extra.mjs"), extra);
  if (server !== undefined) await writeFile(path.join(dir, "src/server.ts"), server);
  try {
    const result = await run(process.execPath, [".agents/skills/verify-talk-feedback/verify.mjs"], {
      cwd: dir, env: { ...process.env, PORT: "0", ...env }, timeout: 20000,
    });
    return { code: 0, ...result };
  } catch (error) {
    const result = error as Error & { code: number; stdout: string; stderr: string };
    return { code: result.code, stdout: result.stdout, stderr: result.stderr };
  }
}

function expectStopped(stdout: string) {
  const pid = Number(stdout.match(/Server PID: (\d+)/)?.[1]);
  expect(pid).toBeGreaterThan(0);
  expect(() => process.kill(pid, 0)).toThrow();
}

it("runs all nine checks with real curl and stops the server", async () => {
  const result = await verify();
  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
  expect(result.stdout).toContain("Result: 9/9 PASS");
  expect(result.stdout.match(/\$ curl/g)).toHaveLength(9);
  expectStopped(result.stdout);
}, 25000);

it("fails and stops the server when a response has the wrong status", async () => {
  const result = await verify('export default [["missing", "GET", "/missing", undefined, 200, () => true]];');
  expect(result.code).toBe(1);
  expect(result.stdout).toContain("FAIL missing");
  expectStopped(result.stdout);
}, 25000);

it("stops the server when a check throws", async () => {
  const result = await verify('export default [["throws", "GET", "/health", undefined, 200, () => { throw new Error("assertion exploded"); }]];');
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("assertion exploded");
  expectStopped(result.stdout);
}, 25000);

it("fails on a broken required import before starting a server", async () => {
  const result = await verify("export default [;");
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("SyntaxError");
  expect(result.stdout).not.toContain("Server PID:");
}, 25000);

it("reports a failed server startup without claiming verification passed", async () => {
  const result = await verify(undefined, "process.exit(7);");
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("server exited before becoming healthy");
  expect(result.stdout).not.toContain("Result: 9/9 PASS");
  expectStopped(result.stdout);
}, 25000);

it("reports curl failures and still stops its server", async () => {
  const result = await verify('export default [["transport", "GET", "/[", undefined, 200, () => true]];');
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("curl");
  expectStopped(result.stdout);
}, 25000);

it("sends curl's actual user agent and preserves JSON payload characters", async () => {
  const result = await verify(`export default [
    ["curl agent", "GET", "/client", undefined, 200, (b) => b.agent.startsWith("curl/")],
    ["payload", "POST", "/feedback", {talkId:"quoted",author:"O'Brien",comment:"Olá \\\"world\\\""}, 201,
      (b) => b.author === "O'Brien" && b.comment === "Olá \\\"world\\\""]
  ];`, `import { buildApp } from "./app.js";
    const app = buildApp();
    app.get("/client", async (request) => ({agent: request.headers["user-agent"]}));
    await app.listen({port: Number(process.env.PORT), host: "127.0.0.1"});
    console.log("Talk Feedback API listening on http://localhost:" + process.env.PORT);`);
  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
  expect(result.stdout).toContain("PASS curl agent");
  expect(result.stdout).toContain("PASS payload");
  expectStopped(result.stdout);
}, 25000);

it("rejects an occupied port without verifying or killing the existing server", async () => {
  const app = buildApp();
  const address = await app.listen({ port: 0, host: "127.0.0.1" });
  try {
    const result = await verify(undefined, undefined, { PORT: new URL(address).port });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("server exited before becoming healthy");
    expect(result.stdout).not.toContain("Result: 9/9 PASS");
    expectStopped(result.stdout);
    expect((await fetch(address + "/health")).status).toBe(200);
  } finally {
    await app.close();
  }
}, 25000);
