import fs from "node:fs";
import path from "node:path";

import { runTask1_1 } from "../../lib/prediction-intelligence-v2/task1-1.ts";
import type { PreparedPaths } from "../../lib/prediction-intelligence-v2/task1.ts";

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
  const artifactDate = "2026-06-21";
  const artifactsDir = path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task1-1", artifactDate);

  const result = await runTask1_1({
    repoRoot,
    rawSnapshotDir,
    preparedDir,
    artifactsDir,
    artifactDate,
  } satisfies PreparedPaths & { artifactDate: string });

  console.log(`artifacts=${artifactsDir}`);
  console.log(`completed_fixtures=${result.refreshPlan.completed_fixtures_discovered}`);
  console.log(`new_results=${result.refreshPlan.newly_discovered_results.length}`);
  console.log(`group_stage_links=${result.classification.group_stage.linked}/${result.classification.group_stage.total}`);
  console.log(`replay_ready=${result.replayCoverageManifest.filter((entry) => entry.replay_readiness === "ready").length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
