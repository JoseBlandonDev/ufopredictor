import { describe, expect, it } from "vitest";

import type {
  RunTask2B1Result,
  Task2B1ApplyResult,
  Task2B1Plan,
  Task2B1VerifyResult,
} from "../../lib/prediction-intelligence-v2/task2b-fixture-refresh";
import {
  buildTask2B1RunnerOutput,
  getTask2B1RunnerExitCode,
} from "./run-task2b-1-fixture-refresh";

function buildPlan(mode: Task2B1Plan["mode"], overrides?: Partial<Task2B1Plan>): Task2B1Plan {
  return {
    schemaName: "ufo-task2b-1-fixture-refresh-v1",
    schemaVersion: 1,
    generatedAt: "2026-06-28T00:00:00.000Z",
    mode,
    taskSlice: "task2b.1",
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
    summary: {
      selectedFixtures: 72,
      safeActionCount: 0,
      alreadyIdenticalCount: 0,
      providerLinkOnlyCount: 0,
      kickoffOnlyCount: 0,
      providerLinkAndKickoffCount: 0,
      terminalResultReadyCount: 65,
      liveStateObservedCount: 2,
      postponedStateObservedCount: 0,
      cancelledStateObservedCount: 0,
      abandonedStateObservedCount: 0,
      blockedKickoffConflictCount: 3,
      duplicateProviderOwnershipCount: 0,
      identityConflictCount: 0,
      unsupportedProviderStateCount: 0,
      providerOnlyUnknownCount: 1,
      zeroWriteConfirmation: true,
    },
    globalBlockers: [],
    rowLevelExclusions: [],
    safeActions: [],
    rows: [],
    providerOnlyRows: [],
    stablePlanSha256: "stable-sha",
    ...overrides,
  };
}

function buildResult(input: {
  plan: Task2B1Plan;
  applyResult?: Task2B1ApplyResult | null;
  verifyResult?: Task2B1VerifyResult | null;
}): RunTask2B1Result {
  return {
    plan: input.plan,
    artifactPath: "D:\\artifact.json",
    providerSnapshotPath: "D:\\snapshot.json",
    providerSnapshotSha256: "snapshot-sha",
    applyResult: input.applyResult ?? null,
    verifyResult: input.verifyResult ?? null,
  };
}

describe("task2b.1 runner exit semantics", () => {
  it("dry-run with no eligible actions exits nonzero", () => {
    const result = buildResult({
      plan: buildPlan("dry_run"),
    });

    expect(getTask2B1RunnerExitCode(result)).toBe(1);
  });

  it("verification with verificationPassed=true exits zero even when safeActionCount=0", () => {
    const result = buildResult({
      plan: buildPlan("verification"),
      verifyResult: {
        verificationPassed: true,
        reviewedActionCount: 41,
        satisfiedActionCount: 41,
        missingActionCount: 0,
        mismatchedActionCount: 0,
        ambiguousActionCount: 0,
        pendingReviewedActionCount: 0,
        satisfiedActionKeys: ["a"],
        missingActionKeys: [],
        ambiguousActionKeys: [],
        pendingReviewedActionKeys: [],
        mismatches: [],
      },
    });

    expect(getTask2B1RunnerExitCode(result)).toBe(0);
    const output = buildTask2B1RunnerOutput(result).join("\n");
    expect(output).toContain("mode=verification");
    expect(output).toContain("reviewed_action_count=41");
    expect(output).toContain("satisfied_action_count=41");
    expect(output).toContain("verification_passed=true");
    expect(output).not.toContain("apply_eligible=");
  });

  it("verification with missing actions exits nonzero", () => {
    const result = buildResult({
      plan: buildPlan("verification"),
      verifyResult: {
        verificationPassed: false,
        reviewedActionCount: 41,
        satisfiedActionCount: 40,
        missingActionCount: 1,
        mismatchedActionCount: 0,
        ambiguousActionCount: 0,
        pendingReviewedActionCount: 0,
        satisfiedActionKeys: [],
        missingActionKeys: ["a"],
        ambiguousActionKeys: [],
        pendingReviewedActionKeys: [],
        mismatches: [],
      },
    });

    expect(getTask2B1RunnerExitCode(result)).toBe(1);
  });

  it("verification with mismatches exits nonzero", () => {
    const result = buildResult({
      plan: buildPlan("verification"),
      verifyResult: {
        verificationPassed: false,
        reviewedActionCount: 41,
        satisfiedActionCount: 40,
        missingActionCount: 0,
        mismatchedActionCount: 1,
        ambiguousActionCount: 0,
        pendingReviewedActionCount: 0,
        satisfiedActionKeys: [],
        missingActionKeys: [],
        ambiguousActionKeys: [],
        pendingReviewedActionKeys: [],
        mismatches: [{ actionKey: "a", matchId: "m", field: "external_id", expected: "x", actual: "y" }],
      },
    });

    expect(getTask2B1RunnerExitCode(result)).toBe(1);
  });

  it("verification with ambiguous ownership exits nonzero", () => {
    const result = buildResult({
      plan: buildPlan("verification"),
      verifyResult: {
        verificationPassed: false,
        reviewedActionCount: 41,
        satisfiedActionCount: 40,
        missingActionCount: 0,
        mismatchedActionCount: 0,
        ambiguousActionCount: 1,
        pendingReviewedActionCount: 0,
        satisfiedActionKeys: [],
        missingActionKeys: [],
        ambiguousActionKeys: ["a"],
        pendingReviewedActionKeys: [],
        mismatches: [],
      },
    });

    expect(getTask2B1RunnerExitCode(result)).toBe(1);
  });

  it("verification with pending reviewed actions exits nonzero", () => {
    const result = buildResult({
      plan: buildPlan("verification"),
      verifyResult: {
        verificationPassed: false,
        reviewedActionCount: 41,
        satisfiedActionCount: 40,
        missingActionCount: 0,
        mismatchedActionCount: 0,
        ambiguousActionCount: 0,
        pendingReviewedActionCount: 1,
        satisfiedActionKeys: [],
        missingActionKeys: [],
        ambiguousActionKeys: [],
        pendingReviewedActionKeys: ["a"],
        mismatches: [],
      },
    });

    expect(getTask2B1RunnerExitCode(result)).toBe(1);
  });

  it("apply summary with all attempted actions completed exits zero", () => {
    const result = buildResult({
      plan: buildPlan("apply", {
        summary: {
          ...buildPlan("apply").summary,
          safeActionCount: 2,
        },
        safeActions: [
          {
            key: "a",
            matchId: "m1",
            canonicalFixtureId: "wc2026-match-001",
            apiFootballFixtureId: 1,
            safeAction: "update_provider_link",
            patch: { external_id: "api-football:fixture:1" },
            expectedPriorState: {
              externalId: null,
              kickoffAt: "2026-06-11T19:00:00.000Z",
              notStartedBefore: "2026-06-11T19:00:00.000Z",
            },
          },
          {
            key: "b",
            matchId: "m2",
            canonicalFixtureId: "wc2026-match-002",
            apiFootballFixtureId: 2,
            safeAction: "update_provider_link",
            patch: { external_id: "api-football:fixture:2" },
            expectedPriorState: {
              externalId: null,
              kickoffAt: "2026-06-12T19:00:00.000Z",
              notStartedBefore: "2026-06-12T19:00:00.000Z",
            },
          },
        ],
      }),
      applyResult: {
        completedActionKeys: ["a", "b"],
        failedActionKey: null,
        ambiguousActionKey: null,
        writesApplied: 2,
      },
    });

    expect(getTask2B1RunnerExitCode(result)).toBe(0);
    const output = buildTask2B1RunnerOutput(result).join("\n");
    expect(output).toContain("attempted_action_count=2");
    expect(output).toContain("completed_action_count=2");
  });

  it("apply summary with failed or ambiguous action exits nonzero", () => {
    const failedResult = buildResult({
      plan: buildPlan("apply", { safeActions: [{ key: "a" } as Task2B1Plan["safeActions"][number]] }),
      applyResult: {
        completedActionKeys: [],
        failedActionKey: "a",
        ambiguousActionKey: null,
        writesApplied: 0,
      },
    });
    const ambiguousResult = buildResult({
      plan: buildPlan("apply", { safeActions: [{ key: "a" } as Task2B1Plan["safeActions"][number]] }),
      applyResult: {
        completedActionKeys: ["a"],
        failedActionKey: null,
        ambiguousActionKey: "a",
        writesApplied: 1,
      },
    });

    expect(getTask2B1RunnerExitCode(failedResult)).toBe(1);
    expect(getTask2B1RunnerExitCode(ambiguousResult)).toBe(1);
  });
});
