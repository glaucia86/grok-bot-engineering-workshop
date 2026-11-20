import { appendFileSync } from "node:fs";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.PREVIEW_SHA;
const deadline = Date.now() + 8 * 60 * 1000;

if (!token || !repository || !sha) {
  console.error("BLOCKED: GITHUB_TOKEN, GITHUB_REPOSITORY, and PREVIEW_SHA are required to resolve the preview URL.");
  process.exit(1);
}

const [owner, repo] = repository.split("/");

function selectPreviewOrigin(statuses) {
  for (const status of statuses) {
    if (status.state !== "success" || status.environment !== "Preview" || !status.environment_url) continue;
    let url;
    try {
      url = new URL(status.environment_url);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" || url.username || url.password) continue;
    return url.origin;
  }
  return null;
}

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "mvp-preview-e2e",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    console.error(`BLOCKED: GitHub deployments API returned ${response.status} for ${path}.`);
    process.exit(1);
  }
  return response.json();
}

while (Date.now() < deadline) {
  const deployments = await github(
    `/repos/${owner}/${repo}/deployments?sha=${encodeURIComponent(sha)}&environment=Preview&per_page=20`,
  );
  for (const deployment of deployments) {
    if (deployment.environment !== "Preview" || deployment.sha !== sha) continue;
    const statuses = await github(`/repos/${owner}/${repo}/deployments/${deployment.id}/statuses`);
    const origin = selectPreviewOrigin(statuses);
    if (!origin) continue;
    console.log(`Preview for ${sha}: ${origin}`);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `url=${origin}\n`);
    }
    process.exit(0);
  }
  console.log(`Waiting for a successful Preview deployment of ${sha}...`);
  await new Promise((resolve) => setTimeout(resolve, 15_000));
}

console.error(`BLOCKED: no successful Preview deployment for ${sha} within 8 minutes.`);
process.exit(1);
