import path from "node:path";

import { runTask1_2, type Task12Paths } from "../../lib/prediction-intelligence-v2/task1-2";
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
    path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task1-2", "local-run", new Date().toISOString().slice(0, 10));

  const result = await runTask1_2({
    repoRoot,
    rawSnapshotDir,
    preparedDir,
    artifactsDir,
    artifactDate,
    historicalReferenceDir,
  } satisfies Task12Paths);

  console.log(`artifacts=${artifactsDir}`);
  console.log(`timeline_entries=${result.timelineSummary.total_entries}`);
  console.log(`replay_ready=${result.manifest.filter((entry) => entry.replay_readiness === "ready").length}/${result.manifest.length}`);
  console.log(
    `optional_fifa_missing=${result.missingCoverage.filter((entry) => entry.home_missing_optional_signals.length > 0 || entry.away_missing_optional_signals.length > 0).length}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
