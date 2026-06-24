import path from "node:path";

import { runTask1_1, type Task11Paths } from "../../lib/prediction-intelligence-v2/task1-1";
import { resolveDefaultPreparedPaths } from "../../lib/prediction-intelligence-v2/task1";

function parseFlagValue(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return argv[index + 1] ?? null;
}

async function main() {
  const repoRoot = process.cwd();
  const artifactDate = "2026-06-21";
  const historicalReferenceDir = path.join(
    repoRoot,
    "artifacts",
    "prediction-intelligence-v2",
    "task1-1",
    artifactDate,
  );
  const defaultPaths = resolveDefaultPreparedPaths(repoRoot, path.join("local-run", new Date().toISOString().slice(0, 10)));
  const rawSnapshotDir = parseFlagValue(process.argv, "--raw-snapshot-dir") ?? defaultPaths.rawSnapshotDir;
  const preparedDir = parseFlagValue(process.argv, "--prepared-dir") ?? defaultPaths.preparedDir;
  const artifactsDir =
    parseFlagValue(process.argv, "--artifacts-dir") ??
    path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task1-1", "local-run", new Date().toISOString().slice(0, 10));

  const result = await runTask1_1({
    repoRoot,
    rawSnapshotDir,
    preparedDir,
    artifactsDir,
    artifactDate,
    historicalReferenceDir,
  } satisfies Task11Paths);

  console.log(`artifacts=${artifactsDir}`);
  console.log(`completed_fixtures=${result.reference.refreshPlan.completed_fixtures_discovered}`);
  console.log(`group_stage_links=${result.classification.group_stage.linked}/${result.classification.group_stage.total}`);
  console.log(`replay_ready=${result.replayCoverageManifest.filter((entry) => entry.replay_readiness === "ready").length}`);
  console.log(`historical_reference_entries=${result.reference.replayCoverageManifest.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
