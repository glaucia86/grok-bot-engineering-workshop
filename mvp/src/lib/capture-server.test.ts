import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { startCaptureServer, captureDevice } from "../../scripts/capture-server.mjs";

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });
async function foreignServer() {
  let requests = 0;
  const server = createServer((_request, response) => { requests++; response.end("foreign build"); });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing fixture address");
  cleanup.push(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });
  return { port: address.port, requests: () => requests };
}

describe("owned local capture startup", () => {
  it("never probes a foreign HTTP200 when its child cannot bind the occupied port", async () => {
    const foreign = await foreignServer();
    const args = ["-e", `require('node:http').createServer((_q,r)=>r.end('owned')).listen(${foreign.port},'127.0.0.1',()=>console.log('Ready in fixture'));`];
    await expect(startCaptureServer({ cwd: process.cwd(), port: foreign.port, args, timeoutMs: 3000 })).rejects.toThrow(/owned capture server/i);
    expect(foreign.requests()).toBe(0);
  });
  it("blocks spawn errors before any readiness request", async () => {
    const foreign = await foreignServer();
    await expect(startCaptureServer({ cwd: process.cwd(), port: foreign.port, executable: "capture-nonexistent-executable", timeoutMs: 500 })).rejects.toThrow(/owned capture server/i);
    expect(foreign.requests()).toBe(0);
  });
  it("bounds an unmarked child timeout even while a foreign service returns200", async () => {
    const foreign = await foreignServer();
    const started = Date.now();
    await expect(startCaptureServer({ cwd: process.cwd(), port: foreign.port, args: ["-e", "setInterval(()=>{},1000)"], timeoutMs: 300 })).rejects.toThrow(/timed out/i);
    expect(Date.now() - started).toBeLessThan(3000);
    expect(foreign.requests()).toBe(0);
  });
  it("bounds hanging HTTP after owned startup and releases its child", async () => {
    await expect(startCaptureServer({ cwd: process.cwd(), args: ["-e", "require('node:http').createServer(()=>{}).listen(Number(process.env.CAPTURE_PORT),'127.0.0.1',()=>console.log('Ready in fixture'));"], timeoutMs: 500 })).rejects.toThrow(/timed out/i);
  });
  it("captures only an owned healthy dynamic loopback server and detects its exit", async () => {
    const owned = await startCaptureServer({ cwd: process.cwd(), args: ["-e", "require('node:http').createServer((_q,r)=>r.end('owned fixture')).listen(Number(process.env.CAPTURE_PORT),'127.0.0.1',()=>console.log('Ready in fixture'));"], timeoutMs: 5000 });
    cleanup.push(owned.close);
    expect(owned.origin).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(await (await fetch(owned.origin)).text()).toBe("owned fixture");
    owned.assertRunning();
    await owned.close();
    expect(() => owned.assertRunning()).toThrow(/owned capture server/i);
  });
  it("records runtime platform and supplied actual browser metadata", () => {
    expect(captureDevice("fixture-version", "fixture-user-agent")).toMatchObject({ platform: process.platform, architecture: process.arch, browserVersion: "fixture-version", userAgent: "fixture-user-agent", deviceScaleFactor: 1 });
  });
});
