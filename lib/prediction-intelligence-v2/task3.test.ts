import fs from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { resolveDefaultPreparedPaths } from "./task1";
import {
  assertTask3ALocalOnlyPreflight,
  resolveTask3ALocalPlannerGuard,
  runTask3A,
  type Task3APaths,
} from "./task3";

const repoRoot = process.cwd();
const localRunRoot = path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task3a", "local-run");
const historicalRoot = path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task3a", "2026-06-22");
const task2Root = path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task2", "local-run");
const cleanupDirs = new Set<string>();

function buildTask3Paths(artifactsDir: string): Task3APaths {
  const defaults = resolveDefaultPreparedPaths(repoRoot, path.join("local-run", "task3-test"));
  return {
    repoRoot,
    rawSnapshotDir: defaults.rawSnapshotDir,
    preparedDir: defaults.preparedDir,
    artifactsDir,
    artifactDate: "2026-06-25",
    generationCutoff: "2026-06-21T00:00:00Z",
    task2_3ArtifactDate: "2026-06-21",
    plannerInput: {
      targetLabel: "test_local_workspace",
    },
  };
}

function registerCleanup(dirPath: string): string {
  cleanupDirs.add(dirPath);
  return dirPath;
}

afterEach(() => {
  for (const dirPath of cleanupDirs) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  cleanupDirs.clear();
});

describe("prediction intelligence v2 task3", () => {
  it("builds a local-only planner guard without environment authorization", () => {
    const guard = resolveTask3ALocalPlannerGuard({
      artifactsDir: path.join(localRunRoot, "unit-guard"),
      targetLabel: "owner_review_only",
    });

    expect(guard.executionMode).toBe("local_only_planner");
    expect(guard.targetLabel).toBe("owner_review_only");
    expect(guard.credentialsRequired).toBe(false);
    expect(guard.networkAccessRequired).toBe(false);
    expect(guard.productionExecutionAuthorized).toBe(false);
    expect(guard.stageExecutionAuthorized).toBe(false);
    expect(guard.remoteExecutionAuthorized).toBe(false);
    expect(guard.importExecutionAuthorized).toBe(false);
    expect(guard.publicationAuthorized).toBe(false);
    expect(guard.historicalCommandEvidenceInert).toBe(true);
  });

  it("accepts a valid nested task3a local-run child directory", () => {
    const artifactsDir = path.join(localRunRoot, "2026-06-25", "nested");
    expect(() => assertTask3ALocalOnlyPreflight(buildTask3Paths(artifactsDir))).not.toThrow();
  });

  it("rejects the local-run root, historical directories, external paths, sibling trees, traversal escapes, lookalikes, and non-empty output directories", () => {
    const nonEmptyDir = registerCleanup(path.join(localRunRoot, "2026-06-25", "non-empty"));
    fs.mkdirSync(nonEmptyDir, { recursive: true });
    fs.writeFileSync(path.join(nonEmptyDir, "existing.txt"), "occupied\n", "utf8");

    const cases = [
      localRunRoot,
      historicalRoot,
      path.join(historicalRoot, "child"),
      path.resolve(repoRoot, "..", "task3a-guard-outside"),
      path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task3a", "scratch"),
      path.join(task2Root, "2026-06-25"),
      path.join(localRunRoot, "..", "..", "task2", "local-run", "2026-06-25"),
      path.join(localRunRoot, "2026-06-25", "..", "..", "evil"),
      path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task3a", "local-run-lookalike", "2026-06-25"),
      nonEmptyDir,
    ];

    for (const candidate of cases) {
      expect(() => assertTask3ALocalOnlyPreflight(buildTask3Paths(candidate))).toThrow();
    }
  });

  it("generates dry-run artifacts only inside a selected local-run child and keeps historical evidence untouched", async () => {
    const artifactsDir = registerCleanup(path.join(localRunRoot, "2026-06-25", `run-${Date.now()}`));
    const historicalReadme = fs.readFileSync(path.join(historicalRoot, "README.txt"), "utf8");

    const result = await runTask3A(buildTask3Paths(artifactsDir));

    expect(result.safeApproximationUsed).toBe(true);
    expect(result.generatedArtifacts).toHaveLength(10);
    expect(result.releaseReview.liveResultRefreshAvailable).toBe(false);
    expect(result.releaseReview.futureFixtureCount).toBeGreaterThan(0);
    expect(result.guard.remoteExecutionAuthorized).toBe(false);
    expect(result.migrationPlanner.executionStatus).toBe("explicitly_denied_planner_only");
    expect(result.importPlanner.executionStatus).toBe("explicitly_denied_planner_only");
    expect(result.signalPersistencePlan.executionStatus).toBe("explicitly_denied_planner_only");
    expect(result.immutablePublicationPlan.executionStatus).toBe("explicitly_denied_planner_only");
    expect(result.torneoExportPlan.executionStatus).toBe("explicitly_denied_planner_only");

    const generatedFiles = fs.readdirSync(artifactsDir).sort();
    expect(generatedFiles).toEqual(
      [
        "README.txt",
        "current-cutoff-release-review.json",
        "database-target-status.json",
        "environment-guard.json",
        "future-safe-development-command.txt",
        "idempotent-import-plan.json",
        "immutable-publication-plan.json",
        "migration-planner.json",
        "signal-persistence-plan.json",
        "torneo-mundialista-export-dry-run.json",
      ].sort(),
    );

    const inertCommandText = fs.readFileSync(path.join(artifactsDir, "future-safe-development-command.txt"), "utf8");
    expect(inertCommandText).toContain("historical_command_text_is_inert=true");
    expect(fs.readFileSync(path.join(historicalRoot, "README.txt"), "utf8")).toBe(historicalReadme);
  });

  it("keeps the task3 implementation and runner free of forbidden live-operation dependencies", () => {
    const forbiddenSnippets = [
      "fetchApiFootballFixturesByLeague",
      "createClient",
      "SUPABASE",
      "service role",
      "dotenv",
      ".env.local",
      ".env.example",
      "process.env",
      "child_process",
      "exec(",
      "execFile(",
      "spawn(",
      "fetch(",
      "axios",
      "http://",
      "https://",
    ];

    const files = [
      path.join(repoRoot, "lib", "prediction-intelligence-v2", "task3.ts"),
      path.join(repoRoot, "scripts", "prediction-intelligence-v2", "run-task3a.ts"),
    ];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, "utf8");
      for (const snippet of forbiddenSnippets) {
        expect(content.includes(snippet), `${path.basename(filePath)} should not include ${snippet}`).toBe(false);
      }
    }
  });
});
