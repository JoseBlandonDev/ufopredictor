import fs from "node:fs";
import path from "node:path";

import { runTask1, type PreparedPaths } from "../../lib/prediction-intelligence-v2/task1.ts";

function loadDotEnvFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional local env.
  }
}

async function main() {
  const repoRoot = process.cwd();
  loadDotEnvFile(path.join(repoRoot, ".env.local"));
  loadDotEnvFile(path.join(repoRoot, ".env.example"));

  const rawSnapshotDir = "C:\\Users\\jonat\\Documents\\ufo-predictor-source-snapshots\\2026-06-20";
  const preparedDir = path.join(rawSnapshotDir, "prepared-v2");
  const artifactsDir = path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task1", "2026-06-20");

  const paths: PreparedPaths = {
    repoRoot,
    rawSnapshotDir,
    preparedDir,
    artifactsDir,
  };

  const result = await runTask1(paths);

  const providerLinkCount = result.importPlan.scheduleFixtureLinks.filter(
    (link) => link.provider_fixture_id != null,
  ).length;
  const unresolvedAliases = result.importPlan.unresolvedAliases.length;

  console.log(`artifacts=${artifactsDir}`);
  console.log(`historical_facts=${result.datasets.historicalFacts.length}`);
  console.log(`signal_previews=${result.signalSnapshots.length}`);
  console.log(`provider_links=${providerLinkCount}/${result.datasets.schedule.length}`);
  console.log(`unresolved_aliases=${unresolvedAliases}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
