import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { installPreviewTransport } from "./preview-transport";

function listen(server: Server): Promise<string> {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing fixture port");
    resolve(`http://127.0.0.1:${address.port}`);
  }));
}
function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

// Real Chromium + two run-owned localhost servers. No remote calls/database.
test("local preview transport: contains POST, HTTP redirects and popup navigation", async ({ page }) => {
  let escaped = 0;
  let acceptedPosts = 0;
  const outside = createServer((_request, response) => { escaped++; response.end("outside"); });
  outside.on("upgrade", (_request, socket) => { escaped++; socket.end("HTTP/1.1 400 Bad Request\r\n\r\n"); });
  const outsideOrigin = await listen(outside);
  const allowed = createServer((request, response) => {
    if (request.url === "/redirect") {
      response.writeHead(302, { location: `${outsideOrigin}/redirected` });
      return response.end();
    }
    if (request.method === "POST") { acceptedPosts++; return response.end("saved"); }
    response.setHeader("content-type", "text/html");
    response.end("<h1>Local transport fixture</h1>");
  });
  const origin = await listen(allowed);
  try {
    // Positive control: the fixture can observe a real WebSocket handshake.
    await page.goto(origin);
    await page.evaluate((url) => new Promise<void>((resolve) => {
      const socket = new WebSocket(url);
      socket.onclose = () => resolve();
    }), outsideOrigin.replace("http:", "ws:"));
    await expect.poll(() => escaped).toBe(1);
    escaped = 0;
    await installPreviewTransport(page.context(), origin);
    await page.goto(origin);
    await expect(page.getByRole("heading", { name: "Local transport fixture" })).toBeVisible();
    expect(await page.evaluate(() => fetch("/api", { method: "POST", body: "synthetic" }).then((r) => r.text()))).toBe("saved");
    expect(acceptedPosts).toBe(1);
    expect(await page.evaluate((url) => fetch(url, { method: "POST", body: "synthetic" })
      .then(() => false, () => true), `${outsideOrigin}/write`)).toBe(true);
    // An aborted navigation can still commit Chromium's error document after
    // goto rejects. Keep that lifecycle off the page used by the later probes.
    const redirectProbe = await page.context().newPage();
    try {
      await expect(redirectProbe.goto(`${origin}/redirect`)).rejects.toThrow();
    } finally {
      await redirectProbe.close();
    }
    const popupPromise = page.waitForEvent("popup");
    await page.evaluate((url) => window.open(url, "_blank"), `${outsideOrigin}/popup`);
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
    await page.evaluate((url) => new Promise<void>((resolve) => {
      const socket = new WebSocket(url);
      socket.onclose = () => resolve();
      socket.onerror = () => resolve();
    }), outsideOrigin.replace("http:", "ws:"));
    expect(escaped).toBe(0);
    await popup.close();
  } finally {
    await close(allowed);
    await close(outside);
  }
});
