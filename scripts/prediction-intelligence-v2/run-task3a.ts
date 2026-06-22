import fs from "node:fs";
import path from "node:path";

import { runTask3A } from "../../lib/prediction-intelligence-v2/task3.ts";
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

  const writeRequested = process.argv.includes("--write");
  const rawSnapshotDir = "C:\\Users\\jonat\\Documents\\ufo-predictor-source-snapshots\\2026-06-20";
  const preparedDir = path.join(rawSnapshotDir, "prepared-v2");
  const artifactDate = new Date().toISOString().slice(0, 10);
  const generationCutoff = new Date().toISOString();
  const artifactsDir = path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task3a", artifactDate);

  const result = await runTask3A({
    repoRoot,
    rawSnapshotDir,
    preparedDir,
    artifactsDir,
    artifactDate,
    generationCutoff,
    task2_3ArtifactDate: "2026-06-21",
    writeRequested,
  } satisfies PreparedPaths & {
    artifactDate: string;
    generationCutoff: string;
    task2_3ArtifactDate: string;
    writeRequested: boolean;
  });

  console.log(`artifacts=${artifactsDir}`);
  console.log(`generation_cutoff=${generationCutoff}`);
  console.log(`future_release_fixtures=${result.releaseReview.futureFixtureCount}`);
  console.log(`chosen_candidate=${result.releaseReview.releaseCandidateDecision}`);
  console.log(`migration_execution=${result.migrationPlanner.migrationExecution}`);
  console.log(`physical_database_validation=${result.migrationPlanner.physicalDatabaseValidation}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
