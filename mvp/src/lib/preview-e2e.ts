export function requirePlaywrightBaseUrl(raw: string | undefined): string {
  if (raw == null || raw.trim() === "") {
    throw new Error(
      "PLAYWRIGHT_BASE_URL is required. Set it to the PR preview origin. This suite never defaults to production.",
    );
  }
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("PLAYWRIGHT_BASE_URL must be an absolute http(s) URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("PLAYWRIGHT_BASE_URL must be an http(s) URL.");
  }
  if (url.username !== "" || url.password !== "") {
    throw new Error("PLAYWRIGHT_BASE_URL must not include credentials.");
  }
  return url.origin;
}

export type PreviewDeploymentStatus = {
  state?: string;
  environment?: string;
  environment_url?: string | null;
};

export function selectPreviewOrigin(statuses: PreviewDeploymentStatus[]): string | null {
  for (const status of statuses) {
    if (status.state !== "success" || status.environment !== "Preview") continue;
    if (!status.environment_url) continue;
    let url: URL;
    try {
      url = new URL(status.environment_url);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" || url.username !== "" || url.password !== "") continue;
    return url.origin;
  }
  return null;
}

export function bypassHeaders(secret: string | undefined): Record<string, string> {
  if (!secret) return {};
  return {
    "x-vercel-protection-bypass": secret,
    "x-vercel-set-bypass-cookie": "true",
  };
}

export function looksLikeVercelLogin(url: string, title: string, bodySample: string): boolean {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("vercel.com/login") || urlLower.includes("vercel.com/sso")) return true;
  const titleLower = title.toLowerCase();
  if (titleLower.includes("vercel") && titleLower.includes("log in")) return true;
  const sample = bodySample.slice(0, 2000).toLowerCase();
  return sample.includes("vercel") && sample.includes("authentication required");
}

export function blockedPreviewMessage(secretConfigured: boolean): string {
  if (secretConfigured) {
    return "BLOCKED: the preview redirected to Vercel login even though VERCEL_AUTOMATION_BYPASS_SECRET is set. The secret value was not logged.";
  }
  return "BLOCKED: the preview redirected to Vercel login and VERCEL_AUTOMATION_BYPASS_SECRET is unset. Create the Vercel Protection Bypass for Automation secret and store it as the GitHub Actions secret VERCEL_AUTOMATION_BYPASS_SECRET.";
}
