import type { BrowserContext, Route } from "@playwright/test";
import { permitsPreviewRequest } from "../src/lib/preview-target";

export async function installPreviewTransport(context: BrowserContext, origin: string) {
  await context.routeWebSocket("**/*", (socket) => socket.close());
  await context.route("**/*", (route) => confinedPreviewRoute(route, origin));
}

export async function confinedPreviewRoute(route: Route, origin: string) {
  if (!permitsPreviewRequest(route.request().url(), origin)) return route.abort("blockedbyclient");
  // Browser routing alone does not intercept every HTTP redirect hop. Fetch
  // exactly once without redirects, then deliver only a final response.
  const response = await route.fetch({ maxRedirects: 0, maxRetries: 0 });
  if (response.status() >= 300 && response.status() < 400) {
    await response.dispose();
    return route.abort("blockedbyclient");
  }
  await route.fulfill({ response });
  await response.dispose();
}
