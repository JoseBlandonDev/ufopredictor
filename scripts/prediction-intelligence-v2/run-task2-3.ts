import fs from "node:fs";
import path from "node:path";

import { runTask2_3 } from "../../lib/prediction-intelligence-v2/task2.ts";
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
  const generationCutoff = "2026-06-21T00:00:00Z";
  const artifactsDir = path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task2-3", artifactDate);

  const result = await runTask2_3({
    repoRoot,
    rawSnapshotDir,
    preparedDir,
    artifactsDir,
    artifactDate,
    generationCutoff,
  } satisfies PreparedPaths & { artifactDate: string; generationCutoff: string });

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
