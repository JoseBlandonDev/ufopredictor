import fs from "node:fs";
import path from "node:path";

import { resolveDefaultPreparedPaths } from "../../lib/prediction-intelligence-v2/task1";
import { runTask3A, type Task3APaths } from "../../lib/prediction-intelligence-v2/task3";

function parseFlagValue(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return argv[index + 1] ?? null;
}

function buildDefaultArtifactsDir(repoRoot: string): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10);
  const runPart = now.toISOString().replace(/[:.]/g, "-");
  return path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task3a", "local-run", datePart, runPart);
}

function ensureRunnerOutputPathIsUnused(artifactsDir: string): void {
  if (fs.existsSync(artifactsDir) && fs.readdirSync(artifactsDir).length > 0) {
    throw new Error(`Task 3A runner refused because artifactsDir already exists and is not empty: ${artifactsDir}`);
  }
}

async function main() {
  const repoRoot = process.cwd();
  const defaultPaths = resolveDefaultPreparedPaths(repoRoot, path.join("local-run", new Date().toISOString().slice(0, 10)));
  const artifactDate = parseFlagValue(process.argv, "--artifact-date") ?? new Date().toISOString().slice(0, 10);
  const generationCutoff = parseFlagValue(process.argv, "--generation-cutoff") ?? "2026-06-21T00:00:00Z";
  const task2_3ArtifactDate = parseFlagValue(process.argv, "--task2-3-artifact-date") ?? "2026-06-21";
  const rawSnapshotDir = parseFlagValue(process.argv, "--raw-snapshot-dir") ?? defaultPaths.rawSnapshotDir;
  const preparedDir = parseFlagValue(process.argv, "--prepared-dir") ?? defaultPaths.preparedDir;
  const artifactsDir = parseFlagValue(process.argv, "--artifacts-dir") ?? buildDefaultArtifactsDir(repoRoot);

  ensureRunnerOutputPathIsUnused(artifactsDir);

  const result = await runTask3A({
    repoRoot,
    rawSnapshotDir,
    preparedDir,
    artifactsDir,
    artifactDate,
    generationCutoff,
    task2_3ArtifactDate,
    plannerInput: {
      targetLabel: "local_task3a_runner",
    },
  } satisfies Task3APaths);

  console.log(`artifacts=${artifactsDir}`);
  console.log(`generation_cutoff=${generationCutoff}`);
  console.log(`future_release_fixtures=${result.releaseReview.futureFixtureCount}`);
  console.log(`chosen_candidate=${result.releaseReview.releaseCandidateDecision}`);
  console.log(`execution_authority=denied`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
