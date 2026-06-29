import path from "node:path";

import { runTask2, type Task2Paths } from "../../lib/prediction-intelligence-v2/task2";
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
    path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task2", "local-run", new Date().toISOString().slice(0, 10));

  const result = await runTask2({
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
  console.log(`train_rows=${result.splitManifest.training.rowCount}`);
  console.log(`validation_rows=${result.splitManifest.validation.rowCount}`);
  console.log(`holdout_rows=${result.splitManifest.holdout.rowCount}`);
  console.log(`selected_candidate=${result.selectedCandidate.candidate.key}`);
  console.log(`future_shadow_predictions=${result.futurePredictions.length}`);
  console.log(`promotion_gate=${result.promotionGate.recommendation}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
