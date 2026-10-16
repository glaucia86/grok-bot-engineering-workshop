import { createServer } from "node:http";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { withPreviewEvidence } from "../src/lib/preview-evidence";

// Evidence lifecycle only: actual loopback POSTs, no remote preview/Neon proof.
for (const status of ["passed", "failed"] as const) {
  test(`local list-independent evidence: ${status} after synthetic POST`, async ({ request }) => {
    const directory = await mkdtemp(join(tmpdir(), "preview-evidence-browser-"));
    let posts = 0;
    const server = createServer((_request, response) => { posts++; response.writeHead(201); response.end("{}"); });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing fixture port");
    const origin = `http://127.0.0.1:${address.port}`;
    const target = { origin: "https://grok-bot-workshop-mvp-abc123xyz-glaucia86s-projects.vercel.app", commit: "a".repeat(40), databaseId: "local-fixture-only" };
    try {
      const journey = withPreviewEvidence(directory, target, async (run) => {
        // The write must have reached disk before even this local POST starts.
        const manifest = JSON.parse(await readFile(join(directory, run.runId, "manifest.json"), "utf8"));
        expect(manifest.talk).toBe(run.talk);
        run.phase("form-submit"); run.postAttempt();
        expect((await request.post(origin, { data: { talkId: run.talk } })).status()).toBe(201);
        if (status === "failed") throw new Error("SYNTHETIC_PRIVATE_FAILURE");
        run.phase("verified");
        return { count: 1, average: 5 };
      });
      if (status === "failed") await expect(journey).rejects.toThrow("SYNTHETIC_PRIVATE_FAILURE");
      else await journey;
      expect(posts).toBe(1);
      const [id] = await readdir(directory);
      const manifest = await readFile(join(directory, id, "manifest.json"), "utf8");
      const outcome = await readFile(join(directory, id, "outcome.json"), "utf8");
      expect(manifest + outcome).not.toContain("SYNTHETIC_PRIVATE_FAILURE");
      expect(JSON.parse(outcome)).toMatchObject({ status, attemptedPosts: 1, cleanup: "PENDING_AUTHORIZED_QA_LIFECYCLE" });
      expect(await readdir(join(directory, id))).toEqual(["manifest.json", "outcome.json"]);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      await rm(directory, { recursive: true, force: true });
    }
  });
}
