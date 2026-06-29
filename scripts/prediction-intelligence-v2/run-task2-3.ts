import path from "node:path";

import { runTask2_3, type Task2Paths } from "../../lib/prediction-intelligence-v2/task2";
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
  const generationCutoff = "2026-06-21T00:00:00Z";
  const historicalReferenceDir = path.join(
    repoRoot,
    "artifacts",
    "prediction-intelligence-v2",
    "task1-1",
    artifactDate,
  );
  const historicalTask2ReferenceDir = path.join(
    repoRoot,
    "artifacts",
    "prediction-intelligence-v2",
    "task2",
    artifactDate,
  );
  const defaultPaths = resolveDefaultPreparedPaths(repoRoot, path.join("local-run", new Date().toISOString().slice(0, 10)));
  const rawSnapshotDir = parseFlagValue(process.argv, "--raw-snapshot-dir") ?? defaultPaths.rawSnapshotDir;
  const preparedDir = parseFlagValue(process.argv, "--prepared-dir") ?? defaultPaths.preparedDir;
  const artifactsDir =
    parseFlagValue(process.argv, "--artifacts-dir") ??
    path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task2-3", "local-run", new Date().toISOString().slice(0, 10));

  const result = await runTask2_3({
    repoRoot,
    rawSnapshotDir,
    preparedDir,
    artifactsDir,
    artifactDate,
    generationCutoff,
    historicalReferenceDir,
    historicalTask2ReferenceDir,
  } satisfies Task2Paths);

  console.log(`artifacts=${artifactsDir}`);
  console.log(`remaining_future_fixtures=${result.futureComparisons.length}`);
  console.log(`analysis_layer_decision=${result.releaseDecision.analysisLayer}`);
  console.log(`probability_engine_decision=${result.releaseDecision.probabilityEngine}`);
  console.log(`fixtures_requiring_human_review=${result.releaseDecision.fixturesRequiringHumanReview.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
