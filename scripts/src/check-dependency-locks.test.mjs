import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkDependencyLocks } from "./check-dependency-locks.mjs";

test("the pnpm-only guard rejects an imported stale lock but ignores unrelated cache files", async () => {
  const root = await mkdtemp(join(tmpdir(), "studio-lock-guard-test-"));
  try {
    await mkdir(join(root, "artifacts", "studio"), { recursive: true });
    await mkdir(join(root, ".cache"), { recursive: true });
    await writeFile(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'");
    await writeFile(join(root, ".cache", "package-lock.json"), "{}");
    assert.doesNotThrow(() => checkDependencyLocks(root));
    await writeFile(join(root, "artifacts", "studio", "package-lock.json"), "{}");
    assert.throws(() => checkDependencyLocks(root), /Conflicting dependency lockfile/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
