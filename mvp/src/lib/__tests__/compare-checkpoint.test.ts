import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { compareCheckpoint } from "../../../scripts/compare-checkpoint.mjs";

const temporaryRoots: string[] = [];

function write(root: string, path: string, contents = "export {};") {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function fixture(kind: "starter" | "reference") {
  const root = mkdtempSync(join(tmpdir(), `checkpoint-${kind}-`));
  temporaryRoots.push(root);
  for (const path of [
    "src/app/api/feedback/route.ts", "src/lib/feedback-schema.ts", "src/lib/stats.ts", "drizzle/0000_base.sql",
    ...["button", "card", "chart", "input", "label", "textarea"].map((name) => `src/components/ui/${name}.tsx`),
  ]) write(root, path);
  const scripts: Record<string, string> = { "verify:http": "node verify.mjs" };
  if (kind === "reference") {
    for (const path of ["src/app/feedback/page.tsx", "src/app/results/page.tsx", "src/components/feedback-form.tsx", "src/components/feedback-dashboard.tsx"]) write(root, path);
    scripts["test:e2e"] = "playwright test";
    write(root, "src/app/page.tsx", "export default function Page() { return <p>Choose your rating</p> }");
  } else write(root, "src/app/page.tsx", "export default function Page() { return <p>Starter</p> }");
  write(root, "package.json", JSON.stringify({ scripts }));
  return root;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("compareCheckpoint", () => {
  it("accepts a starter and rejects it as a reference", () => {
    const root = fixture("starter");
    expect(compareCheckpoint(root, "starter").ok).toBe(true);
    expect(compareCheckpoint(root, "reference").ok).toBe(false);
  });
  it("accepts a reference and rejects it as a starter", () => {
    const root = fixture("reference");
    expect(compareCheckpoint(root, "reference").ok).toBe(true);
    expect(compareCheckpoint(root, "starter").ok).toBe(false);
  });
  it("recognizes the current MVP checkout as the reference", () => {
    expect(compareCheckpoint(".", "reference").ok).toBe(true);
  });
});
