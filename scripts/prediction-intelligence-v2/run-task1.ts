import path from "node:path";

import { resolveDefaultPreparedPaths, runTask1, type PreparedPaths } from "../../lib/prediction-intelligence-v2/task1";

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function buildPaths(): PreparedPaths {
  const repoRoot = process.cwd();
  const defaults = resolveDefaultPreparedPaths(repoRoot, path.join("local-run", new Date().toISOString().slice(0, 10)));
  const rawSnapshotDir = getArg("--raw-snapshot-dir") ?? defaults.rawSnapshotDir;
  const preparedDir = getArg("--prepared-dir") ?? defaults.preparedDir;
  const artifactsDir = getArg("--artifacts-dir") ?? defaults.artifactsDir;

  return {
    repoRoot,
    rawSnapshotDir,
    preparedDir,
    artifactsDir,
  };
}

async function main() {
  const paths = buildPaths();
  const result = await runTask1(paths);

  console.log(`artifacts=${paths.artifactsDir}`);
  console.log(`historical_facts=${result.datasets.historicalFacts.length}`);
  console.log(`signal_previews=${result.signalSnapshots.length}`);
  console.log(`schedule_rows=${result.datasets.schedule.length}`);
  console.log(`unresolved_aliases=${result.importPlan.unresolvedAliases.length}`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`PREDICTION_INTELLIGENCE_V2_TASK1_FAILED message=${message}`);
  process.exitCode = 1;
});
