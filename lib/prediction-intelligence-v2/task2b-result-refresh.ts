import path from "node:path";

import type {
  MatchResultRow,
  MatchRow,
  ModelVersionRow,
  PredictionMarketRow,
  PredictionResultRow,
  PredictionVersionRow,
} from "../../types/database";
import { fetchApiFootballFixturesByLeague } from "../football-api/api-football-client";
import { createSupabaseScriptAdminClient } from "../supabase/script-admin";
import { evaluatePrediction } from "../model-evaluation";
import { WORLD_CUP_2026_FIXTURES } from "../world-cup-2026";
import { verifyWorldCupProviderFixtureIdentity } from "../world-cup-2026/fixture-registry";
import {
  TASK2B_COMPETITION_SLUG,
  TASK2B_PROVIDER_LEAGUE_ID,
  TASK2B_PROVIDER_SEASON,
  TASK2B_WORLD_CUP_DATE_RANGE,
  assertTask2BAuthorization,
  assertTask2BLocalRunPreflight,
  assertTask2BProviderSnapshot,
  buildTask2BSelectionLabel,
  ensureDirectory,
  normalizeSelectionSpec,
  normalizeUtcInstant,
  readJsonFile,
  resolveTask2BDefaultArtifactsDir,
  sanitizeProviderSnapshot,
  sha256File,
  sha256Json,
  type Task2BAuthorization,
  type Task2BMode,
  type Task2BProviderSnapshot,
  type Task2BProviderStatusClassification,
  type Task2BSelectionSpec,
  writeJsonFile,
} from "./task2b-shared";

const TASK2B2_SCHEMA_NAME = "ufo-task2b-2-result-refresh-v1";
const TASK2B2_SCHEMA_VERSION = 1;
const TASK2B2_V1_MODEL_VERSION = "v0.2-prelaunch";
const TASK2B2_V1_PREDICTION_TYPE = "pre_match_24h";
const TASK2B2_V1_RUN_SCOPE = "public_product";

type ResultClassification =
  | "result_create_and_verify"
  | "result_already_identical"
  | "verified_result_conflict"
  | "terminal_without_score"
  | "home_away_identity_conflict"
  | "not_terminal"
  | "outside_reviewed_action_set";

type EvaluationClassification =
  | "evaluation_create"
  | "evaluation_already_identical"
  | "evaluation_pending"
  | "evaluation_not_eligible"
  | "evaluation_conflict"
  | "evaluation_failed";

type Task2B2CompetitionRow = {
  id: string;
  slug: string;
  usage_scope: "public_product" | "internal_lab";
};

type Task2B2TeamRow = {
  id: string;
  slug: string;
  name: string;
};

export type Task2B2MatchRow = Pick<
  MatchRow,
  | "id"
  | "external_id"
  | "slug"
  | "competition_id"
  | "home_team_id"
  | "away_team_id"
  | "kickoff_at"
  | "status"
  | "intake_source"
>;

export type Task2B2PredictionVersionRow = Pick<
  PredictionVersionRow,
  | "id"
  | "match_id"
  | "model_version_id"
  | "prediction_type"
  | "home_win_prob"
  | "draw_prob"
  | "away_win_prob"
  | "most_likely_score"
  | "top_scores_json"
  | "run_scope"
  | "created_at"
> & {
  model_version: Pick<ModelVersionRow, "id" | "version" | "is_active"> | null;
};

export type Task2B2StageSnapshot = {
  competitions: Task2B2CompetitionRow[];
  teams: Task2B2TeamRow[];
  matches: Task2B2MatchRow[];
  matchResults: Array<
    Pick<
      MatchResultRow,
      | "id"
      | "match_id"
      | "home_goals"
      | "away_goals"
      | "verification_status"
      | "intake_source"
      | "source_note"
      | "reviewed_at"
      | "reviewed_by"
      | "recorded_at"
    >
  >;
  predictionVersions: Task2B2PredictionVersionRow[];
  predictionMarkets: Array<
    Pick<PredictionMarketRow, "id" | "prediction_version_id" | "market" | "selection" | "probability">
  >;
  predictionResults: Array<
    Pick<
      PredictionResultRow,
      | "id"
      | "prediction_version_id"
      | "actual_home_goals"
      | "actual_away_goals"
      | "winner_correct"
      | "btts_correct"
      | "over_2_5_correct"
      | "exact_score_correct"
      | "goal_error"
      | "error_summary"
      | "validated_at"
    >
  >;
};

type StoredPredictionEvaluationPayload = {
  actual_home_goals: number;
  actual_away_goals: number;
  winner_correct: boolean | null;
  btts_correct: boolean | null;
  over_2_5_correct: boolean | null;
  exact_score_correct: boolean | null;
  goal_error: number | null;
  error_summary: string | null;
};

type Task2B2ExpectedPriorState = {
  matchStatus: MatchRow["status"];
  resultState:
    | {
        kind: "missing";
      }
    | {
        kind: "existing";
        verification_status: MatchResultRow["verification_status"];
        home_goals: number;
        away_goals: number;
      };
};

type Task2B2ResultPatch = {
  matchStatus: "finished";
  matchResult: {
    home_goals: number;
    away_goals: number;
    verification_status: "verified";
    intake_source: "api_football";
    source_note: string;
    reviewed_at: string;
    reviewed_by: null;
    recorded_at: string;
  };
};

export type Task2B2PlanRow = {
  matchId: string;
  canonicalFixtureId: string;
  slug: string;
  apiFootballFixtureId: number;
  providerStatus: Task2BProviderStatusClassification;
  providerStatusShort: string;
  providerHomeGoals: number | null;
  providerAwayGoals: number | null;
  storedStatus: MatchRow["status"];
  currentResult:
    | {
        verification_status: MatchResultRow["verification_status"];
        home_goals: number;
        away_goals: number;
      }
    | null;
  resultClassification: ResultClassification;
  evaluationClassification: EvaluationClassification;
  safeAction: boolean;
  expectedPriorState: Task2B2ExpectedPriorState | null;
  resultPatch: Task2B2ResultPatch | null;
  eligiblePredictionVersionId: string | null;
  evaluationFailureReason: string | null;
  exclusionReason: string | null;
};

export type Task2B2Plan = {
  schemaName: typeof TASK2B2_SCHEMA_NAME;
  schemaVersion: typeof TASK2B2_SCHEMA_VERSION;
  generatedAt: string;
  mode: Task2BMode;
  taskSlice: "task2b.2";
  targetProjectRef: string;
  deniedProjectRef: string;
  competitionSlug: typeof TASK2B_COMPETITION_SLUG;
  season: typeof TASK2B_PROVIDER_SEASON;
  selection: Task2BSelectionSpec & { label: string };
  providerSnapshotPath: string;
  providerSnapshotSha256: string;
  snapshotNormalizationVersion: 1;
  observedAt: string;
  stageStateFingerprint: string;
  v1EvaluationIdentity: {
    modelVersion: typeof TASK2B2_V1_MODEL_VERSION;
    predictionType: typeof TASK2B2_V1_PREDICTION_TYPE;
    runScope: typeof TASK2B2_V1_RUN_SCOPE;
  };
  summary: {
    selectedFixtures: number;
    safeActionCount: number;
    resultCreateAndVerifyCount: number;
    resultAlreadyIdenticalCount: number;
    verifiedResultConflictCount: number;
    terminalWithoutScoreCount: number;
    homeAwayIdentityConflictCount: number;
    notTerminalCount: number;
    evaluationCreateCount: number;
    evaluationAlreadyIdenticalCount: number;
    evaluationPendingCount: number;
    evaluationNotEligibleCount: number;
    evaluationConflictCount: number;
    evaluationFailedCount: number;
    zeroWriteConfirmation: boolean;
  };
  globalBlockers: string[];
  rowLevelExclusions: Array<{
    key: string;
    reason: string;
  }>;
  safeActions: Array<{
    key: string;
    matchId: string;
    canonicalFixtureId: string;
    apiFootballFixtureId: number;
    expectedPriorState: Task2B2ExpectedPriorState;
    resultPatch: Task2B2ResultPatch;
    eligiblePredictionVersionId: string | null;
  }>;
  rows: Task2B2PlanRow[];
  stablePlanSha256: string;
};

export type Task2B2ApplyResult = {
  completedActionKeys: string[];
  failedActionKey: string | null;
  ambiguousActionKey: string | null;
  resultWritesApplied: number;
  attemptedEvaluationCount: number;
  completedEvaluationCount: number;
  evaluationWritesApplied: number;
  completedEvaluationKeys: string[];
  evaluationFailures: string[];
};

export type Task2B2VerificationResult = {
  reviewedResultActionCount: number;
  satisfiedResultActionCount: number;
  missingResultActionCount: number;
  mismatchedResultActionCount: number;
  ambiguousResultActionCount: number;
  reviewedEvaluationCount: number;
  satisfiedEvaluationCount: number;
  missingEvaluationCount: number;
  mismatchedEvaluationCount: number;
  pendingEvaluationCount: number;
  excludedRowCount: number;
  verificationPassed: boolean;
  missingResultActionKeys: string[];
  mismatchedResultActionKeys: string[];
  ambiguousResultActionKeys: string[];
  missingEvaluationActionKeys: string[];
  mismatchedEvaluationActionKeys: string[];
};

type Task2B2DatabaseAdapter = {
  readStageSnapshot(): Promise<Task2B2StageSnapshot>;
  rereadState(matchIds: string[], predictionVersionIds: string[]): Promise<Pick<Task2B2StageSnapshot, "matches" | "matchResults" | "predictionResults">>;
  applyResultCore(action: {
    matchId: string;
    expectedExternalId: string;
    expectedPriorState: Task2B2ExpectedPriorState;
    resultPatch: Task2B2ResultPatch;
  }): Promise<{
    outcome: "applied" | "already_satisfied" | "stale_prior_state" | "verified_result_conflict" | "missing_match";
    resultWritesApplied: number;
    matchResultId: string | null;
  }>;
  insertPredictionResult(payload: Omit<PredictionResultRow, "id" | "created_at">): Promise<{ id: string }>;
  updatePredictionResult(
    resultId: string,
    payload: Omit<PredictionResultRow, "id" | "prediction_version_id" | "created_at">,
  ): Promise<void>;
};

type RunTask2B2Input = {
  repoRoot: string;
  artifactsDir: string;
  envSupabaseUrl: string | undefined;
  projectRef: string;
  denyProjectRef: string;
  dryRun: boolean;
  apply: boolean;
  verify: boolean;
  reviewedPlanPath?: string | null;
  reviewedStablePlanSha256?: string | null;
  providerSnapshotPath?: string | null;
  selection: Partial<Task2BSelectionSpec>;
};

export type RunTask2B2Result = {
  plan: Task2B2Plan;
  artifactPath: string;
  providerSnapshotPath: string;
  providerSnapshotSha256: string;
  applyResult: Task2B2ApplyResult | null;
  verificationResult: Task2B2VerificationResult | null;
};

type Task2B2ResultCoreRpcOutcome = "applied" | "already_satisfied" | "stale_prior_state" | "verified_result_conflict" | "missing_match";

type Task2B2ResultCoreRpcResult = {
  outcome: Task2B2ResultCoreRpcOutcome;
  resultWritesApplied: number;
  matchResultId: string | null;
};

function parseProviderFixtureId(externalId: string | null): number | null {
  if (!externalId) {
    return null;
  }

  const match = /^api-football:fixture:(\d+)$/.exec(externalId);
  return match ? Number(match[1]) : null;
}

function buildTask2B2StablePlanPayload(plan: Omit<Task2B2Plan, "generatedAt" | "mode" | "stablePlanSha256">) {
  return {
    schemaName: plan.schemaName,
    schemaVersion: plan.schemaVersion,
    taskSlice: plan.taskSlice,
    targetProjectRef: plan.targetProjectRef,
    deniedProjectRef: plan.deniedProjectRef,
    competitionSlug: plan.competitionSlug,
    season: plan.season,
    selection: plan.selection,
    providerSnapshotSha256: plan.providerSnapshotSha256,
    snapshotNormalizationVersion: plan.snapshotNormalizationVersion,
    observedAt: plan.observedAt,
    stageStateFingerprint: plan.stageStateFingerprint,
    v1EvaluationIdentity: plan.v1EvaluationIdentity,
    summary: {
      ...plan.summary,
      zeroWriteConfirmation: undefined,
    },
    globalBlockers: plan.globalBlockers,
    rowLevelExclusions: plan.rowLevelExclusions,
    safeActions: plan.safeActions,
    rows: plan.rows,
  };
}

function sameVerifiedResultPayload(
  existing:
    | Pick<
        MatchResultRow,
        | "home_goals"
        | "away_goals"
        | "verification_status"
        | "intake_source"
        | "source_note"
        | "reviewed_at"
        | "reviewed_by"
        | "recorded_at"
      >
    | null,
  payload: Task2B2ResultPatch["matchResult"],
) {
  return !!existing &&
    existing.home_goals === payload.home_goals &&
    existing.away_goals === payload.away_goals &&
    existing.verification_status === payload.verification_status &&
    existing.intake_source === payload.intake_source &&
    existing.source_note === payload.source_note &&
    sameVerifiedInstant(existing.reviewed_at, payload.reviewed_at) &&
    existing.reviewed_by === payload.reviewed_by &&
    sameVerifiedInstant(existing.recorded_at, payload.recorded_at);
}

function buildStageFingerprint(snapshot: Task2B2StageSnapshot): string {
  return sha256Json({
    matches: snapshot.matches.map((match) => ({
      id: match.id,
      external_id: match.external_id,
      status: match.status,
      kickoff_at: normalizeUtcInstant(match.kickoff_at),
    })),
    matchResults: snapshot.matchResults.map((row) => ({
      match_id: row.match_id,
      verification_status: row.verification_status,
      home_goals: row.home_goals,
      away_goals: row.away_goals,
    })),
    predictionResults: snapshot.predictionResults.map((row) => ({
      prediction_version_id: row.prediction_version_id,
      actual_home_goals: row.actual_home_goals,
      actual_away_goals: row.actual_away_goals,
      winner_correct: row.winner_correct,
      btts_correct: row.btts_correct,
      over_2_5_correct: row.over_2_5_correct,
      exact_score_correct: row.exact_score_correct,
      goal_error: row.goal_error,
      error_summary: row.error_summary,
    })),
  });
}

function buildSelection(snapshot: Task2B2StageSnapshot, selectionInput: Partial<Task2BSelectionSpec>) {
  const normalized = normalizeSelectionSpec(selectionInput);
  const explicit = Boolean(
    normalized.canonicalFixtureIds.length ||
      normalized.matchIds.length ||
      normalized.apiFootballFixtureIds.length ||
      normalized.matchday !== null ||
      normalized.from ||
      normalized.to,
  );
  if (!explicit) {
    throw new Error("Task 2B.2 requires an explicit bounded selection.");
  }

  const selectedIds = new Set<string>();
  for (const match of snapshot.matches) {
    const providerFixtureId = parseProviderFixtureId(match.external_id);
    const canonicalFixture = WORLD_CUP_2026_FIXTURES.find((fixture) => fixture.matchSlug === match.slug);
    const kickoffDate = normalizeUtcInstant(match.kickoff_at).slice(0, 10);
    const matchday =
      canonicalFixture?.matchNumber != null
        ? canonicalFixture.matchNumber <= 24
          ? 1
          : canonicalFixture.matchNumber <= 48
            ? 2
            : canonicalFixture.matchNumber <= 72
              ? 3
              : null
        : null;

    if (normalized.matchIds.includes(match.id)) {
      selectedIds.add(match.id);
      continue;
    }
    if (canonicalFixture && normalized.canonicalFixtureIds.includes(canonicalFixture.fixtureKey)) {
      selectedIds.add(match.id);
      continue;
    }
    if (providerFixtureId !== null && normalized.apiFootballFixtureIds.includes(providerFixtureId)) {
      selectedIds.add(match.id);
      continue;
    }
    if (normalized.matchday !== null && matchday === normalized.matchday) {
      selectedIds.add(match.id);
      continue;
    }
    if (normalized.from || normalized.to) {
      if (normalized.from && kickoffDate < normalized.from) {
        continue;
      }
      if (normalized.to && kickoffDate > normalized.to) {
        continue;
      }
      selectedIds.add(match.id);
    }
  }

  return {
    ...normalized,
    matchIds: [...selectedIds].sort(),
    label: buildTask2BSelectionLabel(normalized),
  };
}

function selectMatches(snapshot: Task2B2StageSnapshot, selection: Task2BSelectionSpec & { label: string }) {
  const selectedIds = new Set(selection.matchIds);
  return snapshot.matches.filter((match) => selectedIds.has(match.id));
}

function isPredictionTopScoresArray(value: unknown): value is Array<{ score: string; probability: number }> {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        typeof (entry as { score?: unknown }).score === "string" &&
        typeof (entry as { probability?: unknown }).probability === "number",
    )
  );
}

function resolveEvaluationMarkets(
  markets: Task2B2StageSnapshot["predictionMarkets"],
) {
  const probabilities = new Map<string, number>();
  for (const market of markets) {
    if (market.market !== "btts" && market.market !== "over_2_5") {
      continue;
    }
    const key = `${market.market}:${market.selection}`;
    if (!probabilities.has(key)) {
      probabilities.set(key, market.probability);
    }
  }
  const expectedKeys = ["btts:yes", "btts:no", "over_2_5:over", "over_2_5:under"];
  if (!expectedKeys.every((key) => probabilities.has(key))) {
    return null;
  }
  return {
    btts: {
      yes: probabilities.get("btts:yes")!,
      no: probabilities.get("btts:no")!,
    },
    overUnder25: {
      over: probabilities.get("over_2_5:over")!,
      under: probabilities.get("over_2_5:under")!,
    },
  };
}

function buildEvaluationPayload(args: {
  prediction: Task2B2PredictionVersionRow;
  markets: Task2B2StageSnapshot["predictionMarkets"];
  actualHomeGoals: number;
  actualAwayGoals: number;
}): { status: "ready"; payload: StoredPredictionEvaluationPayload } | { status: "failure"; reason: string } {
  if (!isPredictionTopScoresArray(args.prediction.top_scores_json)) {
    return { status: "failure", reason: "prediction_top_scores_invalid" };
  }
  const resolvedMarkets = resolveEvaluationMarkets(args.markets);
  if (!resolvedMarkets) {
    return { status: "failure", reason: "prediction_markets_incomplete" };
  }

  const evaluation = evaluatePrediction(
    {
      predictionVersionId: args.prediction.id,
      matchId: args.prediction.match_id,
      probabilities: {
        oneXTwo: {
          homeWin: args.prediction.home_win_prob,
          draw: args.prediction.draw_prob,
          awayWin: args.prediction.away_win_prob,
        },
        btts: resolvedMarkets.btts,
        overUnder25: resolvedMarkets.overUnder25,
      },
      mostLikelyScore: args.prediction.most_likely_score,
      topScorelines: args.prediction.top_scores_json,
    },
    {
      matchId: args.prediction.match_id,
      homeGoals: args.actualHomeGoals,
      awayGoals: args.actualAwayGoals,
      verificationStatus: "verified",
    },
  );

  if (evaluation.status !== "evaluable" || !evaluation.predictionResultsPayload) {
    return { status: "failure", reason: evaluation.reason ?? "evaluation_not_evaluable" };
  }

  const { prediction_version_id, ...payload } = evaluation.predictionResultsPayload;
  void prediction_version_id;
  return {
    status: "ready",
    payload,
  };
}

function sameEvaluationPayload(existing: Task2B2StageSnapshot["predictionResults"][number] | null, payload: StoredPredictionEvaluationPayload) {
  return !!existing &&
    existing.actual_home_goals === payload.actual_home_goals &&
    existing.actual_away_goals === payload.actual_away_goals &&
    existing.winner_correct === payload.winner_correct &&
    existing.btts_correct === payload.btts_correct &&
    existing.over_2_5_correct === payload.over_2_5_correct &&
    existing.exact_score_correct === payload.exact_score_correct &&
    existing.goal_error === payload.goal_error &&
    existing.error_summary === payload.error_summary;
}

function sameVerifiedInstant(left: string, right: string) {
  try {
    return normalizeUtcInstant(left) === normalizeUtcInstant(right);
  } catch {
    return false;
  }
}

function buildVerifiedSourceNote(args: {
  providerFixtureId: number;
  providerStatusShort: string;
  providerResponseAt: string;
}) {
  return [
    "task2b_result_refresh",
    "provider=api_football",
    "verification_status=verified",
    "verification_method=trusted_provider_auto",
    `provider_fixture_id=${args.providerFixtureId}`,
    `provider_status_short=${args.providerStatusShort}`,
    `provider_response_at=${args.providerResponseAt}`,
  ].join(" ");
}

function resolveCanonicalProviderFixtureEvidence(
  canonicalFixture: (typeof WORLD_CUP_2026_FIXTURES)[number],
  providerFixtures: Task2BProviderSnapshot["fixtures"],
) {
  const matches = providerFixtures
    .map((providerFixture) => ({
      providerFixture,
      identity: verifyWorldCupProviderFixtureIdentity({
        canonicalFixture: {
          fixtureKey: canonicalFixture.fixtureKey,
          homeTeamKey: canonicalFixture.homeTeamKey,
          awayTeamKey: canonicalFixture.awayTeamKey,
          kickoffAt: canonicalFixture.kickoffAt,
        },
        providerFixture: {
          provider: "api-football",
          providerFixtureId: providerFixture.providerFixtureId,
          kickoffAt: providerFixture.kickoffAt,
          timezone: providerFixture.timezone,
          status: providerFixture.providerStatus,
          statusShort: providerFixture.providerStatusShort,
          elapsedMinutes: providerFixture.elapsedMinutes,
          competition: providerFixture.competition,
          homeTeam: { ...providerFixture.homeTeam, winner: null },
          awayTeam: { ...providerFixture.awayTeam, winner: null },
          goals: providerFixture.goals,
        },
      }),
    }))
    .filter(({ identity }) => identity.ok || identity.conflictCode === "provider_kickoff_mismatch");

  if (matches.length !== 1) {
    return null;
  }

  const match = matches[0]!;
  return {
    providerFixture: match.providerFixture,
    reason: match.identity.ok
      ? "Stored fixture does not yet have an exact API-Football external identity."
      : match.identity.conflictReason,
  };
}

function buildPlanArtifactPath(artifactsDir: string, mode: Task2BMode): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(artifactsDir, `task2b-2-result-refresh-${mode}-${timestamp}.json`);
}

function buildProviderSnapshotPath(artifactsDir: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(artifactsDir, `task2b-2-provider-snapshot-${timestamp}.json`);
}

export function evaluateTask2B2Eligibility(plan: Task2B2Plan): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (plan.globalBlockers.length > 0) {
    reasons.push(...plan.globalBlockers);
  }
  if (plan.safeActions.length === 0) {
    reasons.push("No exact safe result actions were available.");
  }
  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

function planTask2B2FromSnapshot(args: {
  authorization: Task2BAuthorization;
  stageSnapshot: Task2B2StageSnapshot;
  providerSnapshot: Task2BProviderSnapshot;
  providerSnapshotPath: string;
  providerSnapshotSha256: string;
  selectionInput: Partial<Task2BSelectionSpec>;
  now: string;
}): Task2B2Plan {
  assertTask2BProviderSnapshot(args.providerSnapshot);
  const selection = buildSelection(args.stageSnapshot, args.selectionInput);
  const selectedMatches = selectMatches(args.stageSnapshot, selection);
  const teamById = new Map(args.stageSnapshot.teams.map((team) => [team.id, team]));
  const resultByMatchId = new Map(args.stageSnapshot.matchResults.map((result) => [result.match_id, result]));
  const predictionVersionsByMatchId = new Map<string, Task2B2PredictionVersionRow[]>();
  const marketsByPredictionId = new Map<string, Task2B2StageSnapshot["predictionMarkets"]>();
  const predictionResultByPredictionId = new Map(
    args.stageSnapshot.predictionResults.map((result) => [result.prediction_version_id, result]),
  );
  const providerById = new Map(args.providerSnapshot.fixtures.map((fixture) => [fixture.providerFixtureId, fixture]));
  const providerOwnership = new Map<number, string[]>();

  for (const match of args.stageSnapshot.matches) {
    const providerId = parseProviderFixtureId(match.external_id);
    if (providerId === null) {
      continue;
    }
    const owners = providerOwnership.get(providerId) ?? [];
    owners.push(match.id);
    providerOwnership.set(providerId, owners);
  }
  for (const prediction of args.stageSnapshot.predictionVersions) {
    const rows = predictionVersionsByMatchId.get(prediction.match_id) ?? [];
    rows.push(prediction);
    predictionVersionsByMatchId.set(prediction.match_id, rows);
  }
  for (const market of args.stageSnapshot.predictionMarkets) {
    const rows = marketsByPredictionId.get(market.prediction_version_id) ?? [];
    rows.push(market);
    marketsByPredictionId.set(market.prediction_version_id, rows);
  }

  const globalBlockers: string[] = [];
  const rowLevelExclusions: Task2B2Plan["rowLevelExclusions"] = [];
  const safeActions: Task2B2Plan["safeActions"] = [];
  const rows: Task2B2PlanRow[] = [];

  for (const match of selectedMatches) {
    const providerFixtureId = parseProviderFixtureId(match.external_id);
    const canonicalFixture = WORLD_CUP_2026_FIXTURES.find((fixture) => fixture.matchSlug === match.slug);
    if (!canonicalFixture) {
      rowLevelExclusions.push({
        key: `${match.id}:canonical_missing`,
        reason: "Stored match did not resolve to a canonical World Cup fixture.",
      });
      rows.push({
        matchId: match.id,
        canonicalFixtureId: "unknown",
        slug: match.slug,
        apiFootballFixtureId: providerFixtureId ?? -1,
        providerStatus: "unsupported",
        providerStatusShort: "UNKNOWN",
        providerHomeGoals: null,
        providerAwayGoals: null,
        storedStatus: match.status,
        currentResult: null,
        resultClassification: "home_away_identity_conflict",
        evaluationClassification: "evaluation_not_eligible",
        safeAction: false,
        expectedPriorState: null,
        resultPatch: null,
        eligiblePredictionVersionId: null,
        evaluationFailureReason: null,
        exclusionReason: "Stored match did not resolve to a canonical World Cup fixture.",
      });
      continue;
    }
    if (providerFixtureId === null) {
      const canonicalProviderFixtureEvidence = resolveCanonicalProviderFixtureEvidence(
        canonicalFixture,
        args.providerSnapshot.fixtures,
      );
      const canonicalProviderFixture = canonicalProviderFixtureEvidence?.providerFixture ?? null;
      const exclusionReason =
        canonicalProviderFixtureEvidence?.reason ??
        "Stored fixture does not yet have an exact API-Football external identity.";
      rowLevelExclusions.push({
        key: `${match.id}:${canonicalFixture.fixtureKey}`,
        reason: exclusionReason,
      });
      rows.push({
        matchId: match.id,
        canonicalFixtureId: canonicalFixture.fixtureKey,
        slug: match.slug,
        apiFootballFixtureId: canonicalProviderFixture?.providerFixtureId ?? -1,
        providerStatus: canonicalProviderFixture?.normalizedStatus ?? "unsupported",
        providerStatusShort: canonicalProviderFixture?.providerStatusShort ?? "UNKNOWN",
        providerHomeGoals: canonicalProviderFixture?.goals.home ?? null,
        providerAwayGoals: canonicalProviderFixture?.goals.away ?? null,
        storedStatus: match.status,
        currentResult: null,
        resultClassification: "outside_reviewed_action_set",
        evaluationClassification: "evaluation_not_eligible",
        safeAction: false,
        expectedPriorState: null,
        resultPatch: null,
        eligiblePredictionVersionId: null,
        evaluationFailureReason: null,
        exclusionReason,
      });
      continue;
    }

    const providerFixture = providerById.get(providerFixtureId);
    const currentResult = resultByMatchId.get(match.id) ?? null;
    const homeTeamName = teamById.get(match.home_team_id)?.name ?? match.home_team_id;
    const awayTeamName = teamById.get(match.away_team_id)?.name ?? match.away_team_id;
    let resultClassification: ResultClassification = "not_terminal";
    let evaluationClassification: EvaluationClassification = "evaluation_not_eligible";
    let safeAction = false;
    let expectedPriorState: Task2B2ExpectedPriorState | null = null;
    let resultPatch: Task2B2ResultPatch | null = null;
    let eligiblePredictionVersionId: string | null = null;
    let evaluationFailureReason: string | null = null;
    let exclusionReason: string | null = null;
    let providerStatus: Task2BProviderStatusClassification = "unsupported";
    let providerStatusShort = "UNKNOWN";
    let providerHomeGoals: number | null = null;
    let providerAwayGoals: number | null = null;

    if (!providerFixture) {
      resultClassification = "outside_reviewed_action_set";
      exclusionReason = `Reviewed league snapshot did not contain provider fixture ${providerFixtureId}.`;
    } else if ((providerOwnership.get(providerFixtureId)?.length ?? 0) > 1) {
      resultClassification = "home_away_identity_conflict";
      exclusionReason = `Provider fixture ${providerFixtureId} is owned by multiple stored fixtures.`;
      providerStatus = providerFixture.normalizedStatus;
      providerStatusShort = providerFixture.providerStatusShort;
      providerHomeGoals = providerFixture.goals.home;
      providerAwayGoals = providerFixture.goals.away;
    } else {
      providerStatus = providerFixture.normalizedStatus;
      providerStatusShort = providerFixture.providerStatusShort;
      providerHomeGoals = providerFixture.goals.home;
      providerAwayGoals = providerFixture.goals.away;
      const identity = verifyWorldCupProviderFixtureIdentity({
        canonicalFixture: {
          fixtureKey: canonicalFixture.fixtureKey,
          homeTeamKey: canonicalFixture.homeTeamKey,
          awayTeamKey: canonicalFixture.awayTeamKey,
          kickoffAt: canonicalFixture.kickoffAt,
        },
        providerFixture: {
          provider: "api-football",
          providerFixtureId,
          kickoffAt: providerFixture.kickoffAt,
          timezone: providerFixture.timezone,
          status: providerFixture.providerStatus,
          statusShort: providerFixture.providerStatusShort,
          elapsedMinutes: providerFixture.elapsedMinutes,
          competition: providerFixture.competition,
          homeTeam: { ...providerFixture.homeTeam, winner: null },
          awayTeam: { ...providerFixture.awayTeam, winner: null },
          goals: providerFixture.goals,
        },
      });

      if (!identity.ok || homeTeamName === awayTeamName) {
        resultClassification = "home_away_identity_conflict";
        exclusionReason = identity.ok ? "Stored home/away team identity was invalid." : identity.conflictReason;
      } else if (providerFixture.normalizedStatus !== "terminal_ft") {
        resultClassification = "not_terminal";
        exclusionReason = `Provider status ${providerFixture.providerStatusShort} is not a supported terminal FT result.`;
      } else if (
        typeof providerFixture.goals.home !== "number" ||
        typeof providerFixture.goals.away !== "number"
      ) {
        resultClassification = "terminal_without_score";
        exclusionReason = "Terminal provider row did not include both scores.";
      } else if (
        currentResult?.verification_status === "verified" &&
        (currentResult.home_goals !== providerFixture.goals.home ||
          currentResult.away_goals !== providerFixture.goals.away)
      ) {
        resultClassification = "verified_result_conflict";
        exclusionReason = `Stored verified score ${currentResult.home_goals}-${currentResult.away_goals} differed from provider ${providerFixture.goals.home}-${providerFixture.goals.away}.`;
      } else {
        resultClassification =
          currentResult?.verification_status === "verified"
            ? "result_already_identical"
            : "result_create_and_verify";
        safeAction = true;
        expectedPriorState = {
          matchStatus: match.status,
          resultState: currentResult
            ? {
                kind: "existing",
                verification_status: currentResult.verification_status,
                home_goals: currentResult.home_goals,
                away_goals: currentResult.away_goals,
              }
            : { kind: "missing" },
        };
        resultPatch = {
          matchStatus: "finished",
          matchResult: {
            home_goals: providerFixture.goals.home,
            away_goals: providerFixture.goals.away,
            verification_status: "verified",
            intake_source: "api_football",
            source_note: buildVerifiedSourceNote({
              providerFixtureId,
              providerStatusShort: providerFixture.providerStatusShort,
              providerResponseAt: args.providerSnapshot.observedAt,
            }),
            reviewed_at: args.providerSnapshot.observedAt,
            reviewed_by: null,
            recorded_at: currentResult?.recorded_at ?? args.providerSnapshot.observedAt,
          },
        };

        const eligiblePredictions = (predictionVersionsByMatchId.get(match.id) ?? []).filter(
          (prediction) =>
            prediction.model_version?.version === TASK2B2_V1_MODEL_VERSION &&
            prediction.prediction_type === TASK2B2_V1_PREDICTION_TYPE &&
            prediction.run_scope === TASK2B2_V1_RUN_SCOPE &&
            Date.parse(prediction.created_at) < Date.parse(normalizeUtcInstant(match.kickoff_at)),
        );

        if (eligiblePredictions.length === 0) {
          evaluationClassification = "evaluation_pending";
        } else if (eligiblePredictions.length > 1) {
          evaluationClassification = "evaluation_conflict";
        } else {
          const prediction = eligiblePredictions[0]!;
          eligiblePredictionVersionId = prediction.id;
          const evaluation = buildEvaluationPayload({
            prediction,
            markets: marketsByPredictionId.get(prediction.id) ?? [],
            actualHomeGoals: providerFixture.goals.home,
            actualAwayGoals: providerFixture.goals.away,
          });
          if (evaluation.status === "failure") {
            evaluationClassification = "evaluation_failed";
            evaluationFailureReason = evaluation.reason;
          } else {
            const existingEvaluation = predictionResultByPredictionId.get(prediction.id) ?? null;
            evaluationClassification = existingEvaluation
              ? sameEvaluationPayload(existingEvaluation, evaluation.payload)
                ? "evaluation_already_identical"
                : "evaluation_create"
              : "evaluation_create";
          }
        }
      }
    }

    const row: Task2B2PlanRow = {
      matchId: match.id,
      canonicalFixtureId: canonicalFixture.fixtureKey,
      slug: match.slug,
      apiFootballFixtureId: providerFixtureId,
      providerStatus,
      providerStatusShort,
      providerHomeGoals,
      providerAwayGoals,
      storedStatus: match.status,
      currentResult: currentResult
        ? {
            verification_status: currentResult.verification_status,
            home_goals: currentResult.home_goals,
            away_goals: currentResult.away_goals,
          }
        : null,
      resultClassification,
      evaluationClassification,
      safeAction,
      expectedPriorState,
      resultPatch,
      eligiblePredictionVersionId,
      evaluationFailureReason,
      exclusionReason,
    };
    rows.push(row);

    const key = `${row.matchId}:${row.canonicalFixtureId}:${row.apiFootballFixtureId}`;
    if (safeAction && expectedPriorState && resultPatch) {
      safeActions.push({
        key,
        matchId: row.matchId,
        canonicalFixtureId: row.canonicalFixtureId,
        apiFootballFixtureId: row.apiFootballFixtureId,
        expectedPriorState,
        resultPatch,
        eligiblePredictionVersionId,
      });
    } else if (exclusionReason) {
      rowLevelExclusions.push({ key, reason: exclusionReason });
    }
  }

  const basePlan: Omit<Task2B2Plan, "stablePlanSha256"> = {
    schemaName: TASK2B2_SCHEMA_NAME,
    schemaVersion: TASK2B2_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    mode: args.authorization.mode,
    taskSlice: "task2b.2",
    targetProjectRef: args.authorization.projectRef,
    deniedProjectRef: args.authorization.denyProjectRef,
    competitionSlug: TASK2B_COMPETITION_SLUG,
    season: TASK2B_PROVIDER_SEASON,
    selection,
    providerSnapshotPath: args.providerSnapshotPath,
    providerSnapshotSha256: args.providerSnapshotSha256,
    snapshotNormalizationVersion: 1,
    observedAt: args.providerSnapshot.observedAt,
    stageStateFingerprint: buildStageFingerprint(args.stageSnapshot),
    v1EvaluationIdentity: {
      modelVersion: TASK2B2_V1_MODEL_VERSION,
      predictionType: TASK2B2_V1_PREDICTION_TYPE,
      runScope: TASK2B2_V1_RUN_SCOPE,
    },
    summary: {
      selectedFixtures: rows.length,
      safeActionCount: rows.filter((row) => row.safeAction).length,
      resultCreateAndVerifyCount: rows.filter((row) => row.resultClassification === "result_create_and_verify").length,
      resultAlreadyIdenticalCount: rows.filter((row) => row.resultClassification === "result_already_identical").length,
      verifiedResultConflictCount: rows.filter((row) => row.resultClassification === "verified_result_conflict").length,
      terminalWithoutScoreCount: rows.filter((row) => row.resultClassification === "terminal_without_score").length,
      homeAwayIdentityConflictCount: rows.filter((row) => row.resultClassification === "home_away_identity_conflict").length,
      notTerminalCount: rows.filter((row) => row.resultClassification === "not_terminal").length,
      evaluationCreateCount: rows.filter((row) => row.evaluationClassification === "evaluation_create").length,
      evaluationAlreadyIdenticalCount: rows.filter((row) => row.evaluationClassification === "evaluation_already_identical").length,
      evaluationPendingCount: rows.filter((row) => row.evaluationClassification === "evaluation_pending").length,
      evaluationNotEligibleCount: rows.filter((row) => row.evaluationClassification === "evaluation_not_eligible").length,
      evaluationConflictCount: rows.filter((row) => row.evaluationClassification === "evaluation_conflict").length,
      evaluationFailedCount: rows.filter((row) => row.evaluationClassification === "evaluation_failed").length,
      zeroWriteConfirmation: args.authorization.mode !== "apply",
    },
    globalBlockers: [...new Set(globalBlockers)],
    rowLevelExclusions,
    safeActions,
    rows,
  };

  return {
    ...basePlan,
    stablePlanSha256: sha256Json(buildTask2B2StablePlanPayload(basePlan)),
  };
}

function assertReviewedTask2B2PlanBinding(input: {
  reviewedPlan: Task2B2Plan;
  reviewedStablePlanSha256: string;
  authorization: Task2BAuthorization;
  reviewedSnapshotSha256: string;
}): void {
  if (input.reviewedPlan.mode !== "dry_run") {
    throw new Error("Task 2B.2 apply/verify requires a reviewed dry-run artifact.");
  }
  if (
    input.reviewedPlan.targetProjectRef !== input.authorization.projectRef ||
    input.reviewedPlan.deniedProjectRef !== input.authorization.denyProjectRef
  ) {
    throw new Error("Task 2B.2 reviewed artifact target binding differed.");
  }
  if (input.reviewedStablePlanSha256 !== input.reviewedPlan.stablePlanSha256) {
    throw new Error("Task 2B.2 reviewed stable plan SHA did not match the reviewed artifact.");
  }
  if (input.reviewedSnapshotSha256 !== input.reviewedPlan.providerSnapshotSha256) {
    throw new Error("Task 2B.2 reviewed provider snapshot checksum differed.");
  }

  const reviewedSemanticSha = sha256Json(buildTask2B2StablePlanPayload(input.reviewedPlan));
  if (reviewedSemanticSha !== input.reviewedPlan.stablePlanSha256) {
    throw new Error("Task 2B.2 reviewed artifact checksum did not match its contents.");
  }
}

export async function applyTask2B2Plan(input: {
  reviewedPlan: Task2B2Plan;
  currentPlan: Task2B2Plan;
  reviewedStablePlanSha256: string;
  reviewedSnapshotSha256: string;
  authorization: Task2BAuthorization;
  databaseAdapter: Task2B2DatabaseAdapter;
  now: string;
  snapshot: Task2B2StageSnapshot;
}): Promise<Task2B2ApplyResult> {
  const reviewedEligibility = evaluateTask2B2Eligibility(input.reviewedPlan);
  if (!reviewedEligibility.eligible) {
    throw new Error(`Task 2B.2 apply refused because the reviewed plan is ineligible: ${reviewedEligibility.reasons.join(" | ")}`);
  }
  const currentEligibility = evaluateTask2B2Eligibility(input.currentPlan);
  if (!currentEligibility.eligible) {
    throw new Error(`Task 2B.2 apply refused because the current plan is ineligible: ${currentEligibility.reasons.join(" | ")}`);
  }
  assertReviewedTask2B2PlanBinding({
    reviewedPlan: input.reviewedPlan,
    reviewedStablePlanSha256: input.reviewedStablePlanSha256,
    authorization: input.authorization,
    reviewedSnapshotSha256: input.reviewedSnapshotSha256,
  });

  const completedActionKeys: string[] = [];
  let failedActionKey: string | null = null;
  let ambiguousActionKey: string | null = null;
  let resultWritesApplied = 0;
  let attemptedEvaluationCount = 0;
  let completedEvaluationCount = 0;
  let evaluationWritesApplied = 0;
  const completedEvaluationKeys: string[] = [];
  const evaluationFailures: string[] = [];

  const reread = await input.databaseAdapter.rereadState(
    input.reviewedPlan.safeActions.map((row) => row.matchId),
    input.reviewedPlan.safeActions.flatMap((row) =>
      row.eligiblePredictionVersionId ? [row.eligiblePredictionVersionId] : [],
    ),
  );
  const matchById = new Map(reread.matches.map((match) => [match.id, match]));
  const resultByMatchId = new Map(reread.matchResults.map((result) => [result.match_id, result]));
  const predictionResultsByPredictionId = new Map(
    reread.predictionResults.map((result) => [result.prediction_version_id, result]),
  );
  const predictionById = new Map(input.snapshot.predictionVersions.map((prediction) => [prediction.id, prediction]));
  const marketsByPredictionId = new Map<string, Task2B2StageSnapshot["predictionMarkets"]>();
  for (const market of input.snapshot.predictionMarkets) {
    const rows = marketsByPredictionId.get(market.prediction_version_id) ?? [];
    rows.push(market);
    marketsByPredictionId.set(market.prediction_version_id, rows);
  }

  for (const action of input.reviewedPlan.safeActions) {
    const currentMatch = matchById.get(action.matchId);
    const currentResult = resultByMatchId.get(action.matchId) ?? null;
    if (!currentMatch) {
      throw new Error(`Task 2B.2 apply refused because match ${action.matchId} disappeared.`);
    }
    if (currentMatch.status !== action.expectedPriorState.matchStatus) {
      throw new Error(`Task 2B.2 apply refused because match ${action.matchId} status drifted before apply.`);
    }
    if (action.expectedPriorState.resultState.kind === "missing") {
      if (currentResult) {
        throw new Error(`Task 2B.2 apply refused because match ${action.matchId} gained a result before apply.`);
      }
    } else if (
      !currentResult ||
      currentResult.verification_status !== action.expectedPriorState.resultState.verification_status ||
      currentResult.home_goals !== action.expectedPriorState.resultState.home_goals ||
      currentResult.away_goals !== action.expectedPriorState.resultState.away_goals
    ) {
      throw new Error(`Task 2B.2 apply refused because match ${action.matchId} result drifted before apply.`);
    }

    let storedVerifiedResult: MatchResultRow | null = null;
    const expectedExternalId = `api-football:fixture:${action.apiFootballFixtureId}`;
    try {
      const resultCore = await input.databaseAdapter.applyResultCore({
        matchId: action.matchId,
        expectedExternalId,
        expectedPriorState: action.expectedPriorState,
        resultPatch: action.resultPatch,
      });

      if (resultCore.outcome === "missing_match") {
        failedActionKey = action.key;
        break;
      }
      if (resultCore.outcome === "stale_prior_state" || resultCore.outcome === "verified_result_conflict") {
        failedActionKey = action.key;
        break;
      }

      resultWritesApplied += resultCore.resultWritesApplied;
      const currentStoredResultId = resultCore.matchResultId ?? currentResult?.id ?? `applied:${action.matchId}`;
      storedVerifiedResult = {
        id: currentStoredResultId,
        match_id: action.matchId,
        ...action.resultPatch.matchResult,
      };
      resultByMatchId.set(action.matchId, storedVerifiedResult);
      currentMatch.status = "finished";
      completedActionKeys.push(action.key);
    } catch {
      const recovery = await input.databaseAdapter.rereadState(
        [action.matchId],
        action.eligiblePredictionVersionId ? [action.eligiblePredictionVersionId] : [],
      );
      const recoveryResult = recovery.matchResults.find((result) => result.match_id === action.matchId);
      const recoveryMatch = recovery.matches.find((match) => match.id === action.matchId) ?? null;
      if (
        recoveryMatch?.status === "finished" &&
        recoveryResult &&
        recoveryResult.verification_status === "verified" &&
        recoveryResult.home_goals === action.resultPatch.matchResult.home_goals &&
        recoveryResult.away_goals === action.resultPatch.matchResult.away_goals
      ) {
        ambiguousActionKey = action.key;
        completedActionKeys.push(action.key);
        storedVerifiedResult = {
          ...recoveryResult,
        };
        continue;
      }

      ambiguousActionKey = action.key;
      break;
    }

    if (action.eligiblePredictionVersionId && storedVerifiedResult) {
      attemptedEvaluationCount += 1;
      const prediction = predictionById.get(action.eligiblePredictionVersionId);
      if (!prediction) {
        evaluationFailures.push(`${action.key}:prediction_missing`);
        continue;
      }

      const evaluation = buildEvaluationPayload({
        prediction,
        markets: marketsByPredictionId.get(prediction.id) ?? [],
        actualHomeGoals: storedVerifiedResult.home_goals,
        actualAwayGoals: storedVerifiedResult.away_goals,
      });
      if (evaluation.status === "failure") {
        evaluationFailures.push(`${action.key}:${evaluation.reason}`);
        continue;
      }

      try {
        const existingEvaluation = predictionResultsByPredictionId.get(prediction.id) ?? null;
        if (existingEvaluation) {
          if (!sameEvaluationPayload(existingEvaluation, evaluation.payload)) {
            await input.databaseAdapter.updatePredictionResult(existingEvaluation.id, {
              ...evaluation.payload,
              validated_at: action.resultPatch.matchResult.reviewed_at,
            });
            evaluationWritesApplied += 1;
          }
        } else {
          const inserted = await input.databaseAdapter.insertPredictionResult({
            prediction_version_id: prediction.id,
            ...evaluation.payload,
            validated_at: action.resultPatch.matchResult.reviewed_at,
          });
          predictionResultsByPredictionId.set(prediction.id, {
            id: inserted.id,
            prediction_version_id: prediction.id,
            ...evaluation.payload,
            validated_at: action.resultPatch.matchResult.reviewed_at,
          });
          evaluationWritesApplied += 1;
        }
        completedEvaluationCount += 1;
        completedEvaluationKeys.push(action.key);
      } catch (error) {
        evaluationFailures.push(
          `${action.key}:persistence_error:${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (failedActionKey || ambiguousActionKey) {
      break;
    }
  }

  return {
    completedActionKeys,
    failedActionKey,
    ambiguousActionKey,
    resultWritesApplied,
    attemptedEvaluationCount,
    completedEvaluationCount,
    evaluationWritesApplied,
    completedEvaluationKeys,
    evaluationFailures,
  };
}

export function verifyTask2B2ReviewedPlan(input: {
  reviewedPlan: Task2B2Plan;
  currentPlan: Task2B2Plan;
  reviewedStablePlanSha256: string;
  reviewedSnapshotSha256: string;
  authorization: Task2BAuthorization;
  stageSnapshot: Task2B2StageSnapshot;
}): Task2B2VerificationResult {
  assertReviewedTask2B2PlanBinding({
    reviewedPlan: input.reviewedPlan,
    reviewedStablePlanSha256: input.reviewedStablePlanSha256,
    authorization: input.authorization,
    reviewedSnapshotSha256: input.reviewedSnapshotSha256,
  });

  const currentSemanticSha = sha256Json(buildTask2B2StablePlanPayload(input.currentPlan));
  if (currentSemanticSha !== input.currentPlan.stablePlanSha256) {
    throw new Error("Task 2B.2 current plan checksum did not match its contents.");
  }

  const matchById = new Map(input.stageSnapshot.matches.map((match) => [match.id, match]));
  const resultByMatchId = new Map(input.stageSnapshot.matchResults.map((result) => [result.match_id, result]));
  const predictionById = new Map(input.stageSnapshot.predictionVersions.map((prediction) => [prediction.id, prediction]));
  const marketsByPredictionId = new Map<string, Task2B2StageSnapshot["predictionMarkets"]>();
  for (const market of input.stageSnapshot.predictionMarkets) {
    const rows = marketsByPredictionId.get(market.prediction_version_id) ?? [];
    rows.push(market);
    marketsByPredictionId.set(market.prediction_version_id, rows);
  }
  const predictionResultsByPredictionId = new Map(
    input.stageSnapshot.predictionResults.map((result) => [result.prediction_version_id, result]),
  );

  const missingResultActionKeys: string[] = [];
  const mismatchedResultActionKeys: string[] = [];
  const ambiguousResultActionKeys: string[] = [];
  const missingEvaluationActionKeys: string[] = [];
  const mismatchedEvaluationActionKeys: string[] = [];
  let satisfiedResultActionCount = 0;
  let satisfiedEvaluationCount = 0;

  for (const action of input.reviewedPlan.safeActions) {
    const match = matchById.get(action.matchId) ?? null;
    if (!match) {
      missingResultActionKeys.push(action.key);
      continue;
    }

    const expectedExternalId = `api-football:fixture:${action.apiFootballFixtureId}`;
    const result = resultByMatchId.get(action.matchId) ?? null;
    const resultMatches = sameVerifiedResultPayload(result, action.resultPatch.matchResult);
    const matchMatches = match.external_id === expectedExternalId && match.status === "finished";

    if (!matchMatches || !resultMatches) {
      if (match.external_id !== expectedExternalId) {
        ambiguousResultActionKeys.push(action.key);
      } else if (!result) {
        missingResultActionKeys.push(action.key);
      } else {
        mismatchedResultActionKeys.push(action.key);
      }
      continue;
    }

    satisfiedResultActionCount += 1;

    if (!action.eligiblePredictionVersionId) {
      continue;
    }

    const prediction = predictionById.get(action.eligiblePredictionVersionId) ?? null;
    if (!prediction) {
      missingEvaluationActionKeys.push(action.key);
      continue;
    }
    const evaluation = buildEvaluationPayload({
      prediction,
      markets: marketsByPredictionId.get(prediction.id) ?? [],
      actualHomeGoals: action.resultPatch.matchResult.home_goals,
      actualAwayGoals: action.resultPatch.matchResult.away_goals,
    });
    if (evaluation.status === "failure") {
      mismatchedEvaluationActionKeys.push(action.key);
      continue;
    }

    const storedEvaluation = predictionResultsByPredictionId.get(prediction.id) ?? null;
    if (!storedEvaluation) {
      missingEvaluationActionKeys.push(action.key);
      continue;
    }

    const validatedAtMatches = sameVerifiedInstant(
      storedEvaluation.validated_at,
      action.resultPatch.matchResult.reviewed_at,
    );
    if (!sameEvaluationPayload(storedEvaluation, evaluation.payload) || !validatedAtMatches) {
      mismatchedEvaluationActionKeys.push(action.key);
      continue;
    }

    satisfiedEvaluationCount += 1;
  }

  const reviewedEvaluationCount = input.reviewedPlan.rows.filter(
    (row) => row.safeAction && row.evaluationClassification === "evaluation_create",
  ).length;
  const pendingEvaluationCount = input.reviewedPlan.rows.filter(
    (row) => row.safeAction && row.evaluationClassification === "evaluation_pending",
  ).length;
  const excludedRowCount = input.reviewedPlan.rows.filter((row) => !row.safeAction).length;

  const missingResultActionCount = missingResultActionKeys.length;
  const mismatchedResultActionCount = mismatchedResultActionKeys.length;
  const ambiguousResultActionCount = ambiguousResultActionKeys.length;
  const missingEvaluationCount = missingEvaluationActionKeys.length;
  const mismatchedEvaluationCount = mismatchedEvaluationActionKeys.length;
  const verificationPassed =
    missingResultActionCount === 0 &&
    mismatchedResultActionCount === 0 &&
    ambiguousResultActionCount === 0 &&
    missingEvaluationCount === 0 &&
    mismatchedEvaluationCount === 0;

  return {
    reviewedResultActionCount: input.reviewedPlan.safeActions.length,
    satisfiedResultActionCount,
    missingResultActionCount,
    mismatchedResultActionCount,
    ambiguousResultActionCount,
    reviewedEvaluationCount,
    satisfiedEvaluationCount,
    missingEvaluationCount,
    mismatchedEvaluationCount,
    pendingEvaluationCount,
    excludedRowCount,
    verificationPassed,
    missingResultActionKeys,
    mismatchedResultActionKeys,
    ambiguousResultActionKeys,
    missingEvaluationActionKeys,
    mismatchedEvaluationActionKeys,
  };
}

function createLiveTask2B2DatabaseAdapter(): Task2B2DatabaseAdapter {
  const supabase = createSupabaseScriptAdminClient();

  return {
    async readStageSnapshot() {
      const { data: competitionData, error: competitionError } = await supabase
        .from("competitions")
        .select("id, slug, usage_scope")
        .eq("slug", TASK2B_COMPETITION_SLUG);
      if (competitionError) {
        throw new Error(`Failed to read competitions: ${competitionError.message}`);
      }
      const competitionIds = ((competitionData ?? []) as Task2B2CompetitionRow[]).map((row) => row.id);
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("id, external_id, slug, competition_id, home_team_id, away_team_id, kickoff_at, status, intake_source")
        .in("competition_id", competitionIds.length > 0 ? competitionIds : ["00000000-0000-0000-0000-000000000000"])
        .order("kickoff_at", { ascending: true });
      if (matchError) {
        throw new Error(`Failed to read matches: ${matchError.message}`);
      }
      const matches = (matchData ?? []) as Task2B2MatchRow[];
      const matchIds = matches.map((match) => match.id);
      const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];
      const [{ data: teamData, error: teamError }, { data: resultData, error: resultError }, { data: modelData, error: modelError }, { data: predictionData, error: predictionError }] =
        await Promise.all([
          supabase.from("teams").select("id, slug, name").in("id", teamIds.length > 0 ? teamIds : ["00000000-0000-0000-0000-000000000000"]),
          supabase
            .from("match_results")
            .select("id, match_id, home_goals, away_goals, verification_status, intake_source, source_note, reviewed_at, reviewed_by, recorded_at")
            .in("match_id", matchIds.length > 0 ? matchIds : ["00000000-0000-0000-0000-000000000000"]),
          supabase.from("model_versions").select("id, version, is_active"),
          supabase
            .from("prediction_versions")
            .select("id, match_id, model_version_id, prediction_type, home_win_prob, draw_prob, away_win_prob, most_likely_score, top_scores_json, run_scope, created_at")
            .in("match_id", matchIds.length > 0 ? matchIds : ["00000000-0000-0000-0000-000000000000"])
            .eq("prediction_type", TASK2B2_V1_PREDICTION_TYPE)
            .eq("run_scope", TASK2B2_V1_RUN_SCOPE),
        ]);
      if (teamError || resultError || modelError || predictionError) {
        throw new Error(
          `Failed to read Task 2B.2 support tables: ${teamError?.message ?? resultError?.message ?? modelError?.message ?? predictionError?.message}`,
        );
      }
      const modelById = new Map(((modelData ?? []) as Pick<ModelVersionRow, "id" | "version" | "is_active">[]).map((model) => [model.id, model]));
      const predictions = ((predictionData ?? []) as Omit<Task2B2PredictionVersionRow, "model_version">[]).map((prediction) => ({
        ...prediction,
        model_version: modelById.get(prediction.model_version_id) ?? null,
      }));
      const predictionIds = predictions.map((prediction) => prediction.id);
      const [{ data: marketData, error: marketError }, { data: predictionResultData, error: predictionResultError }] = await Promise.all([
        supabase
          .from("prediction_markets")
          .select("id, prediction_version_id, market, selection, probability")
          .in("prediction_version_id", predictionIds.length > 0 ? predictionIds : ["00000000-0000-0000-0000-000000000000"]),
        supabase
          .from("prediction_results")
          .select("id, prediction_version_id, actual_home_goals, actual_away_goals, winner_correct, btts_correct, over_2_5_correct, exact_score_correct, goal_error, error_summary, validated_at")
          .in("prediction_version_id", predictionIds.length > 0 ? predictionIds : ["00000000-0000-0000-0000-000000000000"]),
      ]);
      if (marketError || predictionResultError) {
        throw new Error(`Failed to read Task 2B.2 child rows: ${marketError?.message ?? predictionResultError?.message}`);
      }

      return {
        competitions: (competitionData ?? []) as Task2B2CompetitionRow[],
        teams: (teamData ?? []) as Task2B2TeamRow[],
        matches,
        matchResults: (resultData ?? []) as Task2B2StageSnapshot["matchResults"],
        predictionVersions: predictions,
        predictionMarkets: (marketData ?? []) as Task2B2StageSnapshot["predictionMarkets"],
        predictionResults: (predictionResultData ?? []) as Task2B2StageSnapshot["predictionResults"],
      };
    },
    async rereadState(matchIds, predictionVersionIds) {
      const [{ data: matchData, error: matchError }, { data: resultData, error: resultError }, { data: predictionResultData, error: predictionResultError }] =
        await Promise.all([
          supabase
            .from("matches")
            .select("id, external_id, slug, competition_id, home_team_id, away_team_id, kickoff_at, status, intake_source")
            .in("id", matchIds.length > 0 ? matchIds : ["00000000-0000-0000-0000-000000000000"]),
          supabase
            .from("match_results")
            .select("id, match_id, home_goals, away_goals, verification_status, intake_source, source_note, reviewed_at, reviewed_by, recorded_at")
            .in("match_id", matchIds.length > 0 ? matchIds : ["00000000-0000-0000-0000-000000000000"]),
          supabase
            .from("prediction_results")
            .select("id, prediction_version_id, actual_home_goals, actual_away_goals, winner_correct, btts_correct, over_2_5_correct, exact_score_correct, goal_error, error_summary, validated_at")
            .in("prediction_version_id", predictionVersionIds.length > 0 ? predictionVersionIds : ["00000000-0000-0000-0000-000000000000"]),
        ]);
      if (matchError || resultError || predictionResultError) {
        throw new Error(`Failed to reread Task 2B.2 state: ${matchError?.message ?? resultError?.message ?? predictionResultError?.message}`);
      }
      return {
        matches: (matchData ?? []) as Task2B2StageSnapshot["matches"],
        matchResults: (resultData ?? []) as Task2B2StageSnapshot["matchResults"],
        predictionResults: (predictionResultData ?? []) as Task2B2StageSnapshot["predictionResults"],
      };
    },
    async applyResultCore(action): Promise<Task2B2ResultCoreRpcResult> {
      const expectedResultState =
        action.expectedPriorState.resultState.kind === "existing" ? action.expectedPriorState.resultState : null;
      const { data, error } = await supabase.rpc("apply_task2b_stage_result_core", {
        p_match_id: action.matchId,
        p_expected_external_id: action.expectedExternalId,
        p_expected_match_status: action.expectedPriorState.matchStatus,
        p_expected_result_kind: action.expectedPriorState.resultState.kind,
        p_expected_result_verification_status: expectedResultState?.verification_status ?? null,
        p_expected_result_home_goals: expectedResultState?.home_goals ?? null,
        p_expected_result_away_goals: expectedResultState?.away_goals ?? null,
        p_home_goals: action.resultPatch.matchResult.home_goals,
        p_away_goals: action.resultPatch.matchResult.away_goals,
        p_source_note: action.resultPatch.matchResult.source_note,
        p_reviewed_at: action.resultPatch.matchResult.reviewed_at,
        p_reviewed_by: action.resultPatch.matchResult.reviewed_by,
        p_recorded_at: action.resultPatch.matchResult.recorded_at,
      });
      if (error) {
        throw new Error(`Failed to apply Task 2B.2 result core for ${action.matchId}: ${error.message}`);
      }

      const payload = data as Partial<Task2B2ResultCoreRpcResult> | null;
      if (
        !payload ||
        (payload.outcome !== "applied" &&
          payload.outcome !== "already_satisfied" &&
          payload.outcome !== "stale_prior_state" &&
          payload.outcome !== "verified_result_conflict" &&
          payload.outcome !== "missing_match") ||
        typeof payload.resultWritesApplied !== "number"
      ) {
        throw new Error(`Task 2B.2 result core RPC returned an invalid payload for ${action.matchId}.`);
      }

      return {
        outcome: payload.outcome,
        resultWritesApplied: payload.resultWritesApplied,
        matchResultId: typeof payload.matchResultId === "string" ? payload.matchResultId : null,
      };
    },
    async insertPredictionResult(payload) {
      const { data, error } = await supabase.from("prediction_results").insert(payload).select("id").single();
      if (error || !data?.id) {
        throw new Error(`Failed to insert prediction_result for ${payload.prediction_version_id}: ${error?.message ?? "missing row id"}`);
      }
      return { id: data.id as string };
    },
    async updatePredictionResult(resultId, payload) {
      const { error } = await supabase.from("prediction_results").update(payload).eq("id", resultId);
      if (error) {
        throw new Error(`Failed to update prediction_result ${resultId}: ${error.message}`);
      }
    },
  };
}

export function resolveTask2B2Defaults(repoRoot: string) {
  return {
    artifactsDir: resolveTask2BDefaultArtifactsDir(repoRoot, "task2b-2"),
  };
}

export async function runTask2B2ResultRefresh(
  input: RunTask2B2Input,
  dependencies?: {
    databaseAdapter?: Task2B2DatabaseAdapter;
    providerFetcher?: typeof fetchApiFootballFixturesByLeague;
  },
): Promise<RunTask2B2Result> {
  assertTask2BLocalRunPreflight(input.repoRoot, input.artifactsDir, "task2b-2");
  ensureDirectory(input.artifactsDir);
  const authorization = assertTask2BAuthorization({
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    dryRun: input.dryRun,
    apply: input.apply,
    verify: input.verify,
    supabaseUrl: input.envSupabaseUrl,
  });
  const databaseAdapter = dependencies?.databaseAdapter ?? createLiveTask2B2DatabaseAdapter();
  const now = new Date().toISOString();

  let providerSnapshotPath = input.providerSnapshotPath ? path.resolve(input.providerSnapshotPath) : null;
  let providerSnapshot: Task2BProviderSnapshot;
  if (authorization.mode === "dry_run") {
    const providerFetcher = dependencies?.providerFetcher ?? fetchApiFootballFixturesByLeague;
    const providerFixtures = await providerFetcher({
      leagueId: TASK2B_PROVIDER_LEAGUE_ID,
      season: TASK2B_PROVIDER_SEASON,
      from: TASK2B_WORLD_CUP_DATE_RANGE.from,
      to: TASK2B_WORLD_CUP_DATE_RANGE.to,
    });
    providerSnapshot = sanitizeProviderSnapshot({
      fixtures: providerFixtures,
      acquiredAt: now,
      from: TASK2B_WORLD_CUP_DATE_RANGE.from,
      to: TASK2B_WORLD_CUP_DATE_RANGE.to,
    });
    providerSnapshotPath = buildProviderSnapshotPath(input.artifactsDir);
    writeJsonFile(providerSnapshotPath, providerSnapshot);
  } else {
    if (!providerSnapshotPath) {
      throw new Error("Task 2B.2 apply/verify requires --provider-snapshot or a reviewed plan that references one.");
    }
    providerSnapshot = readJsonFile<Task2BProviderSnapshot>(providerSnapshotPath);
  }

  const providerSnapshotSha256 = sha256File(providerSnapshotPath!);
  const stageSnapshot = await databaseAdapter.readStageSnapshot();
  const currentPlan = planTask2B2FromSnapshot({
    authorization,
    stageSnapshot,
    providerSnapshot,
    providerSnapshotPath: providerSnapshotPath!,
    providerSnapshotSha256,
    selectionInput: input.selection,
    now,
  });

  let applyResult: Task2B2ApplyResult | null = null;
  let verificationResult: Task2B2VerificationResult | null = null;
  if (authorization.mode !== "dry_run") {
    if (!input.reviewedPlanPath || !input.reviewedStablePlanSha256) {
      throw new Error("Task 2B.2 apply/verify requires --reviewed-plan and --reviewed-stable-plan-sha256.");
    }
    const reviewedPlan = readJsonFile<Task2B2Plan>(path.resolve(input.reviewedPlanPath));
    const reviewedSnapshotPath = path.resolve(input.providerSnapshotPath ?? reviewedPlan.providerSnapshotPath);
    const reviewedSnapshotSha256 = sha256File(reviewedSnapshotPath);
    if (authorization.mode === "apply") {
      applyResult = await applyTask2B2Plan({
        reviewedPlan,
        currentPlan,
        reviewedStablePlanSha256: input.reviewedStablePlanSha256,
        reviewedSnapshotSha256,
        authorization,
        databaseAdapter,
        now,
        snapshot: stageSnapshot,
      });
    } else {
      verificationResult = verifyTask2B2ReviewedPlan({
        reviewedPlan,
        currentPlan,
        reviewedStablePlanSha256: input.reviewedStablePlanSha256,
        reviewedSnapshotSha256,
        authorization,
        stageSnapshot,
      });
    }
  }

  const artifactPath = buildPlanArtifactPath(input.artifactsDir, authorization.mode);
  const artifactPayload =
    authorization.mode === "apply"
      ? {
          ...currentPlan,
          applySummary: applyResult
            ? {
                attemptedResultActionCount: currentPlan.safeActions.length,
                completedResultActionCount: applyResult.completedActionKeys.length,
                failedResultActionKey: applyResult.failedActionKey,
                ambiguousResultActionKey: applyResult.ambiguousActionKey,
                resultWritesApplied: applyResult.resultWritesApplied,
                attemptedEvaluationCount: applyResult.attemptedEvaluationCount,
                completedEvaluationCount: applyResult.completedEvaluationCount,
                evaluationWritesApplied: applyResult.evaluationWritesApplied,
                evaluationFailures: applyResult.evaluationFailures,
                completedActionKeys: applyResult.completedActionKeys,
                completedEvaluationKeys: applyResult.completedEvaluationKeys,
              }
            : null,
        }
      : authorization.mode === "verification"
        ? {
            ...currentPlan,
            verificationSummary: verificationResult,
          }
      : currentPlan;
  writeJsonFile(artifactPath, artifactPayload);
  return {
    plan: currentPlan,
    artifactPath,
    providerSnapshotPath: providerSnapshotPath!,
    providerSnapshotSha256,
    applyResult,
    verificationResult,
  };
}
