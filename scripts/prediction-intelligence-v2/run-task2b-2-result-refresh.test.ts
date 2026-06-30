import { describe, expect, it } from "vitest";

import type {
  RunTask2B2Result,
  Task2B2ApplyResult,
  Task2B2Plan,
  Task2B2VerificationResult,
} from "../../lib/prediction-intelligence-v2/task2b-result-refresh";
import {
  buildTask2B2RunnerOutput,
  getTask2B2RunnerExitCode,
} from "./run-task2b-2-result-refresh";

function buildPlan(mode: Task2B2Plan["mode"], overrides?: Partial<Task2B2Plan>): Task2B2Plan {
  return {
    schemaName: "ufo-task2b-2-result-refresh-v1",
    schemaVersion: 1,
    generatedAt: "2026-06-28T00:00:00.000Z",
    mode,
    taskSlice: "task2b.2",
    targetProjectRef: "yfmklapgjrupctgxaako",
    deniedProjectRef: "gcpdffkgsdomzyoenalg",
    competitionSlug: "world-cup-2026",
    season: 2026,
    selection: {
      canonicalFixtureIds: [],
      matchIds: [],
      apiFootballFixtureIds: [],
      matchday: null,
      from: "2026-06-11",
      to: "2026-06-28",
      label: "range_2026-06-11_2026-06-28",
    },
    providerSnapshotPath: "D:\\snapshot.json",
    providerSnapshotSha256: "snapshot-sha",
    snapshotNormalizationVersion: 1,
    observedAt: "2026-06-28T00:00:00.000Z",
    stageStateFingerprint: "stage-fingerprint",
    v1EvaluationIdentity: {
      modelVersion: "v0.2-prelaunch",
      predictionType: "pre_match_24h",
      runScope: "public_product",
    },
    summary: {
      selectedFixtures: 72,
      safeActionCount: 69,
      resultCreateAndVerifyCount: 69,
      resultAlreadyIdenticalCount: 0,
      verifiedResultConflictCount: 0,
      terminalWithoutScoreCount: 0,
      homeAwayIdentityConflictCount: 0,
      notTerminalCount: 0,
      evaluationCreateCount: 24,
      evaluationAlreadyIdenticalCount: 0,
      evaluationPendingCount: 45,
      evaluationNotEligibleCount: 3,
      evaluationConflictCount: 0,
      evaluationFailedCount: 0,
      zeroWriteConfirmation: mode !== "apply",
    },
    globalBlockers: [],
    rowLevelExclusions: [],
    safeActions: [],
    rows: [],
    stablePlanSha256: "stable-sha",
    ...overrides,
  };
}

function buildResult(input: {
  plan: Task2B2Plan;
  applyResult?: Task2B2ApplyResult | null;
  verificationResult?: Task2B2VerificationResult | null;
}): RunTask2B2Result {
  return {
    plan: input.plan,
    artifactPath: "D:\\artifact.json",
    providerSnapshotPath: "D:\\snapshot.json",
    providerSnapshotSha256: "snapshot-sha",
    applyResult: input.applyResult ?? null,
    verificationResult: input.verificationResult ?? null,
  };
}

describe("task2b.2 runner apply exit semantics", () => {
  it("dry-run with eligible safe actions exits zero", () => {
    const result = buildResult({
      plan: buildPlan("dry_run", {
        safeActions: [
          {
            key: "a",
            matchId: "m1",
            canonicalFixtureId: "wc2026-match-001",
            apiFootballFixtureId: 1,
            expectedPriorState: { matchStatus: "scheduled", resultState: { kind: "missing" } },
            resultPatch: {
              matchStatus: "finished",
              matchResult: {
                home_goals: 1,
                away_goals: 0,
                verification_status: "verified",
                intake_source: "api_football",
                source_note: "x",
                reviewed_at: "2026-06-28T00:00:00.000Z",
                reviewed_by: null,
                recorded_at: "2026-06-28T00:00:00.000Z",
              },
            },
            eligiblePredictionVersionId: null,
          },
        ],
      }),
    });

    expect(getTask2B2RunnerExitCode(result)).toBe(0);
  });

  it("apply full success exits zero and prints result/evaluation summary", () => {
    const result = buildResult({
      plan: buildPlan("apply", {
        safeActions: [
          {
            key: "a",
            matchId: "m1",
            canonicalFixtureId: "wc2026-match-001",
            apiFootballFixtureId: 1,
            expectedPriorState: { matchStatus: "scheduled", resultState: { kind: "missing" } },
            resultPatch: {
              matchStatus: "finished",
              matchResult: {
                home_goals: 1,
                away_goals: 0,
                verification_status: "verified",
                intake_source: "api_football",
                source_note: "x",
                reviewed_at: "2026-06-28T00:00:00.000Z",
                reviewed_by: null,
                recorded_at: "2026-06-28T00:00:00.000Z",
              },
            },
            eligiblePredictionVersionId: "prediction-1",
          },
        ],
      }),
      applyResult: {
        completedActionKeys: ["a"],
        failedActionKey: null,
        ambiguousActionKey: null,
        resultWritesApplied: 2,
        attemptedEvaluationCount: 1,
        completedEvaluationCount: 1,
        evaluationWritesApplied: 1,
        completedEvaluationKeys: ["a"],
        evaluationFailures: [],
      },
    });

    expect(getTask2B2RunnerExitCode(result)).toBe(0);
    const output = buildTask2B2RunnerOutput(result).join("\n");
    expect(output).toContain("attempted_result_action_count=1");
    expect(output).toContain("completed_result_action_count=1");
    expect(output).toContain("attempted_evaluation_count=1");
    expect(output).toContain("completed_evaluation_count=1");
    expect(output).toContain("evaluation_failure_count=0");
  });

  it("apply result-core failure exits nonzero", () => {
    const result = buildResult({
      plan: buildPlan("apply", {
        safeActions: [{ key: "a" } as Task2B2Plan["safeActions"][number]],
      }),
      applyResult: {
        completedActionKeys: [],
        failedActionKey: "a",
        ambiguousActionKey: null,
        resultWritesApplied: 1,
        attemptedEvaluationCount: 0,
        completedEvaluationCount: 0,
        evaluationWritesApplied: 0,
        completedEvaluationKeys: [],
        evaluationFailures: [],
      },
    });

    expect(getTask2B2RunnerExitCode(result)).toBe(1);
  });

  it("apply ambiguous result-core exits nonzero", () => {
    const result = buildResult({
      plan: buildPlan("apply", {
        safeActions: [{ key: "a" } as Task2B2Plan["safeActions"][number]],
      }),
      applyResult: {
        completedActionKeys: ["a"],
        failedActionKey: null,
        ambiguousActionKey: "a",
        resultWritesApplied: 2,
        attemptedEvaluationCount: 1,
        completedEvaluationCount: 0,
        evaluationWritesApplied: 0,
        completedEvaluationKeys: [],
        evaluationFailures: ["a:persistence_error:x"],
      },
    });

    expect(getTask2B2RunnerExitCode(result)).toBe(1);
  });

  it("evaluation-only failure does not make a successful result-core apply exit nonzero", () => {
    const result = buildResult({
      plan: buildPlan("apply", {
        safeActions: [{ key: "a" } as Task2B2Plan["safeActions"][number]],
      }),
      applyResult: {
        completedActionKeys: ["a"],
        failedActionKey: null,
        ambiguousActionKey: null,
        resultWritesApplied: 2,
        attemptedEvaluationCount: 1,
        completedEvaluationCount: 0,
        evaluationWritesApplied: 0,
        completedEvaluationKeys: [],
        evaluationFailures: ["a:persistence_error:x"],
      },
    });

    expect(getTask2B2RunnerExitCode(result)).toBe(0);
  });

  it("verify exits zero only when verification passed and prints verification summary", () => {
    const result = buildResult({
      plan: buildPlan("verification"),
      verificationResult: {
        reviewedResultActionCount: 69,
        satisfiedResultActionCount: 69,
        missingResultActionCount: 0,
        mismatchedResultActionCount: 0,
        ambiguousResultActionCount: 0,
        reviewedEvaluationCount: 24,
        satisfiedEvaluationCount: 24,
        missingEvaluationCount: 0,
        mismatchedEvaluationCount: 0,
        pendingEvaluationCount: 45,
        excludedRowCount: 3,
        verificationPassed: true,
        missingResultActionKeys: [],
        mismatchedResultActionKeys: [],
        ambiguousResultActionKeys: [],
        missingEvaluationActionKeys: [],
        mismatchedEvaluationActionKeys: [],
      },
    });

    expect(getTask2B2RunnerExitCode(result)).toBe(0);
    const output = buildTask2B2RunnerOutput(result).join("\n");
    expect(output).toContain("reviewed_result_action_count=69");
    expect(output).toContain("satisfied_evaluation_count=24");
    expect(output).toContain("verification_passed=true");
  });

  it("verify exits nonzero when verification failed", () => {
    const result = buildResult({
      plan: buildPlan("verification"),
      verificationResult: {
        reviewedResultActionCount: 69,
        satisfiedResultActionCount: 68,
        missingResultActionCount: 1,
        mismatchedResultActionCount: 0,
        ambiguousResultActionCount: 0,
        reviewedEvaluationCount: 24,
        satisfiedEvaluationCount: 24,
        missingEvaluationCount: 0,
        mismatchedEvaluationCount: 0,
        pendingEvaluationCount: 45,
        excludedRowCount: 3,
        verificationPassed: false,
        missingResultActionKeys: ["a"],
        mismatchedResultActionKeys: [],
        ambiguousResultActionKeys: [],
        missingEvaluationActionKeys: [],
        mismatchedEvaluationActionKeys: [],
      },
    });

    expect(getTask2B2RunnerExitCode(result)).toBe(1);
  });
});
