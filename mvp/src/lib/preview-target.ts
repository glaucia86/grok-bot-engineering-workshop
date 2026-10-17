type PreviewEnvironment = Record<string, string | undefined>;

// Retain the full project-name shape; never wildcard the shortened name because
// it also appears on production deployments and may overlap sibling projects.
const deploymentHost = /^grok-bot-workshop-mvp-[a-z0-9]{9}-glaucia86s-projects\.vercel\.app$/;
// Reviewed Vercel metadata: project prj_Q2YoezuOHO6ctl8NCdoHn3DcWqDS,
// deployment dpl_E5tF5ShZckYVw88n8xuhNzGXAVS1. This is a routing exception,
// not live proof of preview status, database isolation or write authorization.
const reviewedDeploymentCommits = new Map([
  ["grok-bot-workshop-bpxtrs2fd-glaucia86s-projects.vercel.app", "70c732f6ea070cc413e1cb1fc91fb352d705e835"],
]);

export function previewTarget(env: PreviewEnvironment) {
  const commit = env.MVP_PREVIEW_COMMIT;
  const databaseId = env.MVP_PREVIEW_QA_DATABASE_ID;
  if (!commit || !/^[a-f0-9]{40}$/i.test(commit)
    || env.MVP_PREVIEW_ISOLATED_AUTHORIZED !== "true"
    || !databaseId || !/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(databaseId)) {
    throw new Error("BLOCKED: supply an exact commit and a non-secret QA database resource ID; isolated preview writes require explicit authorization.");
  }
  let url: URL;
  const rawUrl = env.MVP_PREVIEW_URL ?? "";
  try { url = new URL(rawUrl); }
  catch { throw new Error("BLOCKED: unsafe preview target."); }
  const supportedDeployment = deploymentHost.test(url.hostname)
    || reviewedDeploymentCommits.get(url.hostname) === commit.toLowerCase();
  if (url.protocol !== "https:" || !supportedDeployment
    || url.username || url.password || url.port || url.pathname !== "/"
    || url.search || url.hash
    // Reject parser-normalized spellings: whitespace, encoded hosts, dot paths,
    // backslashes, empty credentials and explicit default ports.
    || (rawUrl !== url.origin && rawUrl !== `${url.origin}/`)) {
    throw new Error("BLOCKED: unsafe preview target.");
  }
  return { origin: url.origin, commit, databaseId };
}

export function permitsPreviewRequest(target: string, origin: string) {
  try { return new URL(target).origin === origin; }
  catch { return false; }
}
