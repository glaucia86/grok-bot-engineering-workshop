type PreviewEnvironment = Record<string, string | undefined>;

// Only this project's immutable deployment host shape. Production/custom domains
// and moving git-branch aliases are intentionally unsupported.
const deploymentHost = /^grok-bot-workshop-mvp-[a-z0-9]{9}-glaucia86s-projects\.vercel\.app$/;

export function previewTarget(env: PreviewEnvironment) {
  const commit = env.MVP_PREVIEW_COMMIT;
  const databaseId = env.MVP_PREVIEW_QA_DATABASE_ID;
  if (!commit || !/^[a-f0-9]{40}$/i.test(commit)
    || env.MVP_PREVIEW_ISOLATED_AUTHORIZED !== "true"
    || !databaseId || !/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(databaseId)) {
    throw new Error("BLOCKED: supply an exact commit and a non-secret QA database resource ID; isolated preview writes require explicit authorization.");
  }
  let url: URL;
  try { url = new URL(env.MVP_PREVIEW_URL ?? ""); }
  catch { throw new Error("BLOCKED: unsafe preview target."); }
  if (url.protocol !== "https:" || !deploymentHost.test(url.hostname)
    || url.username || url.password || url.port || url.pathname !== "/"
    || url.search || url.hash || /[?#]/.test(env.MVP_PREVIEW_URL!)) {
    throw new Error("BLOCKED: unsafe preview target.");
  }
  return { origin: url.origin, commit, databaseId };
}

export function permitsPreviewRequest(target: string, origin: string) {
  try { return new URL(target).origin === origin; }
  catch { return false; }
}
