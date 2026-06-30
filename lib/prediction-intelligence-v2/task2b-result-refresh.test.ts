import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PredictionResultRow } from "../../types/database";
import type { ProviderFixture } from "../football-api/api-football-types";
import { WORLD_CUP_2026_FIXTURES, WORLD_CUP_2026_TEAMS } from "../world-cup-2026";
import {
  applyTask2B2Plan,
  evaluateTask2B2Eligibility,
  runTask2B2ResultRefresh,
  verifyTask2B2ReviewedPlan,
  type Task2B2PredictionVersionRow,
  type Task2B2StageSnapshot,
} from "./task2b-result-refresh";

const repoRoot = process.cwd();
const artifactsRoot = path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task2b-2", "local-run", "unit-test");
const stageUrl = "https://yfmklapgjrupctgxaako.supabase.co";
let artifactsDir = path.join(artifactsRoot, "initial");

type ProviderFixtureTestOverrides = Partial<Omit<ProviderFixture, "competition" | "homeTeam" | "awayTeam" | "goals" | "scoreBreakdown">> & {
  competition?: Partial<ProviderFixture["competition"]>;
  homeTeam?: Partial<ProviderFixture["homeTeam"]>;
  awayTeam?: Partial<ProviderFixture["awayTeam"]>;
  goals?: Partial<ProviderFixture["goals"]>;
  scoreBreakdown?: Partial<{
    halftime: Partial<NonNullable<ProviderFixture["scoreBreakdown"]>["halftime"]>;
    fulltime: Partial<NonNullable<ProviderFixture["scoreBreakdown"]>["fulltime"]>;
    extratime: Partial<NonNullable<ProviderFixture["scoreBreakdown"]>["extratime"]>;
    penalty: Partial<NonNullable<ProviderFixture["scoreBreakdown"]>["penalty"]>;
  }>;
};

function fixtureByKey(fixtureKey: string) {
  const fixture = WORLD_CUP_2026_FIXTURES.find((candidate) => candidate.fixtureKey === fixtureKey);
  if (!fixture) {
    throw new Error(`Missing fixture ${fixtureKey}`);
  }
  return fixture;
}

function teamName(teamKey: string) {
  return WORLD_CUP_2026_TEAMS.find((team) => team.teamKey === teamKey)?.displayName ?? teamKey;
}

function pickScoreValue(
  score: Partial<{ home: number | null; away: number | null }> | undefined,
  key: "home" | "away",
  fallback: number | null,
) {
  return score && Object.prototype.hasOwnProperty.call(score, key) ? score[key] ?? null : fallback;
}

function buildProviderFixture(fixtureKey: string, overrides: ProviderFixtureTestOverrides = {}): ProviderFixture {
  const fixture = fixtureByKey(fixtureKey);
  const defaultGoals = {
    home: overrides.goals?.home ?? 2,
    away: overrides.goals?.away ?? 1,
  };
  const defaultScoreBreakdown = {
    halftime: {
      home: pickScoreValue(overrides.scoreBreakdown?.halftime, "home", 1),
      away: pickScoreValue(overrides.scoreBreakdown?.halftime, "away", 0),
    },
    fulltime: {
      home: pickScoreValue(overrides.scoreBreakdown?.fulltime, "home", defaultGoals.home),
      away: pickScoreValue(overrides.scoreBreakdown?.fulltime, "away", defaultGoals.away),
    },
    extratime: {
      home: pickScoreValue(overrides.scoreBreakdown?.extratime, "home", null),
      away: pickScoreValue(overrides.scoreBreakdown?.extratime, "away", null),
    },
    penalty: {
      home: pickScoreValue(overrides.scoreBreakdown?.penalty, "home", null),
      away: pickScoreValue(overrides.scoreBreakdown?.penalty, "away", null),
    },
  };
  return {
    provider: "api-football",
    providerFixtureId: overrides.providerFixtureId ?? fixture.apiFootballFixtureId ?? 900000 + fixture.matchNumber,
    kickoffAt: overrides.kickoffAt ?? fixture.kickoffAt,
    timezone: overrides.timezone ?? "UTC",
    status: overrides.status ?? "finished",
    statusShort: overrides.statusShort ?? "FT",
    elapsedMinutes: overrides.elapsedMinutes ?? 90,
    competition: {
      providerCompetitionId: 1,
      name: "World Cup",
      country: "World",
      season: 2026,
      round: `Group Stage - ${fixture.matchNumber <= 24 ? 1 : fixture.matchNumber <= 48 ? 2 : 3}`,
      ...overrides.competition,
    },
    homeTeam: {
      providerTeamId: overrides.homeTeam?.providerTeamId ?? fixture.matchNumber * 10 + 1,
      name: overrides.homeTeam?.name ?? teamName(fixture.homeTeamKey),
      winner: overrides.homeTeam?.winner ?? true,
    },
    awayTeam: {
      providerTeamId: overrides.awayTeam?.providerTeamId ?? fixture.matchNumber * 10 + 2,
      name: overrides.awayTeam?.name ?? teamName(fixture.awayTeamKey),
      winner: overrides.awayTeam?.winner ?? false,
    },
    goals: {
      ...defaultGoals,
    },
    scoreBreakdown: defaultScoreBreakdown,
    decision:
      overrides.decision ??
      (overrides.statusShort === "PEN" ? "penalties" : overrides.statusShort === "AET" ? "extra_time" : "regulation"),
  };
}

function buildPrediction(matchId: string, modelVersionId = "model-v1"): Task2B2PredictionVersionRow {
  return {
    id: `prediction-${matchId}`,
    match_id: matchId,
    model_version_id: modelVersionId,
    prediction_type: "pre_match_24h",
    home_win_prob: 52,
    draw_prob: 26,
    away_win_prob: 22,
    most_likely_score: "2-1",
    top_scores_json: [
      { score: "2-1", probability: 0.2 },
      { score: "1-0", probability: 0.15 },
    ],
    run_scope: "public_product",
    created_at: "2026-06-01T00:00:00Z",
    model_version: {
      id: modelVersionId,
      version: "v0.2-prelaunch",
      is_active: true,
    },
  };
}

function buildStageSnapshot(fixtureKey: string, overrides?: {
  predictionVersions?: Task2B2PredictionVersionRow[];
  predictionMarkets?: Task2B2StageSnapshot["predictionMarkets"];
  matchResults?: Task2B2StageSnapshot["matchResults"];
  predictionResults?: Task2B2StageSnapshot["predictionResults"];
  matchStatus?: "scheduled" | "finished";
}): Task2B2StageSnapshot {
  const fixture = fixtureByKey(fixtureKey);
  const matchId = `match-${fixture.fixtureKey}`;
  const providerFixtureId = fixture.apiFootballFixtureId ?? 900000 + fixture.matchNumber;
  const prediction = buildPrediction(matchId);
  const predictionMarkets: Task2B2StageSnapshot["predictionMarkets"] = [
    { id: "m1", prediction_version_id: prediction.id, market: "btts", selection: "yes", probability: 0.6 },
    { id: "m2", prediction_version_id: prediction.id, market: "btts", selection: "no", probability: 0.4 },
    { id: "m3", prediction_version_id: prediction.id, market: "over_2_5", selection: "over", probability: 0.55 },
    { id: "m4", prediction_version_id: prediction.id, market: "over_2_5", selection: "under", probability: 0.45 },
  ];

  return {
    competitions: [{ id: "competition-1", slug: "world-cup-2026", usage_scope: "public_product" }],
    teams: [
      { id: `team-${fixture.homeTeamKey}`, slug: fixture.homeTeamKey, name: teamName(fixture.homeTeamKey) },
      { id: `team-${fixture.awayTeamKey}`, slug: fixture.awayTeamKey, name: teamName(fixture.awayTeamKey) },
    ],
    matches: [
      {
        id: matchId,
        external_id: `api-football:fixture:${providerFixtureId}`,
        slug: fixture.matchSlug,
        competition_id: "competition-1",
        home_team_id: `team-${fixture.homeTeamKey}`,
        away_team_id: `team-${fixture.awayTeamKey}`,
        kickoff_at: fixture.kickoffAt,
        status: overrides?.matchStatus ?? "scheduled",
        intake_source: "manual",
      },
    ],
    matchResults: overrides?.matchResults ?? [],
    predictionVersions: overrides?.predictionVersions ?? [prediction],
    predictionMarkets: overrides?.predictionMarkets ?? predictionMarkets,
    predictionResults: overrides?.predictionResults ?? [],
  };
}

function buildMemoryAdapter(snapshot: Task2B2StageSnapshot) {
  return {
    rpcCalls: [] as Array<{
      matchId: string;
      expectedExternalId: string;
      expectedPriorState: {
        matchStatus: Task2B2StageSnapshot["matches"][number]["status"];
        resultState:
          | { kind: "missing" }
          | {
              kind: "existing";
              verification_status: Task2B2StageSnapshot["matchResults"][number]["verification_status"];
              home_goals: number;
              away_goals: number;
            };
      };
      resultPatch: {
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
    }>,
    insertedPredictionResults: [] as Array<Omit<PredictionResultRow, "id" | "created_at">>,
    updatedPredictionResults: [] as Array<{
      resultId: string;
      payload: Omit<PredictionResultRow, "id" | "prediction_version_id" | "created_at">;
    }>,
    async readStageSnapshot() {
      return snapshot;
    },
    async rereadState(matchIds: string[], predictionVersionIds: string[]) {
      return {
        matches: snapshot.matches.filter((match) => matchIds.includes(match.id)),
        matchResults: snapshot.matchResults.filter((result) => matchIds.includes(result.match_id)),
        predictionResults: snapshot.predictionResults.filter((result) =>
          predictionVersionIds.includes(result.prediction_version_id),
        ),
      };
    },
    async applyResultCore(action: {
      matchId: string;
      expectedExternalId: string;
      expectedPriorState: {
        matchStatus: Task2B2StageSnapshot["matches"][number]["status"];
        resultState:
          | { kind: "missing" }
          | {
              kind: "existing";
              verification_status: Task2B2StageSnapshot["matchResults"][number]["verification_status"];
              home_goals: number;
              away_goals: number;
            };
      };
      resultPatch: {
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
    }) {
      this.rpcCalls.push(action);
      const match = snapshot.matches.find((candidate) => candidate.id === action.matchId) ?? null;
      if (!match) {
        return { outcome: "missing_match" as const, resultWritesApplied: 0, matchResultId: null };
      }
      if (match.external_id !== action.expectedExternalId || match.status !== action.expectedPriorState.matchStatus) {
        return { outcome: "stale_prior_state" as const, resultWritesApplied: 0, matchResultId: null };
      }

      const existingResult = snapshot.matchResults.find((candidate) => candidate.match_id === action.matchId) ?? null;
      if (action.expectedPriorState.resultState.kind === "missing") {
        if (existingResult) {
          if (
            existingResult.verification_status === "verified" &&
            existingResult.home_goals === action.resultPatch.matchResult.home_goals &&
            existingResult.away_goals === action.resultPatch.matchResult.away_goals &&
            match.status === "finished"
          ) {
            return { outcome: "already_satisfied" as const, resultWritesApplied: 0, matchResultId: existingResult.id };
          }
          if (
            existingResult.verification_status === "verified" &&
            (existingResult.home_goals !== action.resultPatch.matchResult.home_goals ||
              existingResult.away_goals !== action.resultPatch.matchResult.away_goals)
          ) {
            return { outcome: "verified_result_conflict" as const, resultWritesApplied: 0, matchResultId: existingResult.id };
          }
          return { outcome: "stale_prior_state" as const, resultWritesApplied: 0, matchResultId: existingResult.id };
        }
      } else {
        if (!existingResult) {
          return { outcome: "stale_prior_state" as const, resultWritesApplied: 0, matchResultId: null };
        }
        if (
          existingResult.verification_status !== action.expectedPriorState.resultState.verification_status ||
          existingResult.home_goals !== action.expectedPriorState.resultState.home_goals ||
          existingResult.away_goals !== action.expectedPriorState.resultState.away_goals
        ) {
          if (
            existingResult.verification_status === "verified" &&
            existingResult.home_goals === action.resultPatch.matchResult.home_goals &&
            existingResult.away_goals === action.resultPatch.matchResult.away_goals &&
            match.status === "finished"
          ) {
            return { outcome: "already_satisfied" as const, resultWritesApplied: 0, matchResultId: existingResult.id };
          }
          if (
            existingResult.verification_status === "verified" &&
            (existingResult.home_goals !== action.resultPatch.matchResult.home_goals ||
              existingResult.away_goals !== action.resultPatch.matchResult.away_goals)
          ) {
            return { outcome: "verified_result_conflict" as const, resultWritesApplied: 0, matchResultId: existingResult.id };
          }
          return { outcome: "stale_prior_state" as const, resultWritesApplied: 0, matchResultId: existingResult.id };
        }
      }

      let resultWritesApplied = 0;
      let result = existingResult;
      if (!result) {
        result = { id: `result-${snapshot.matchResults.length + 1}`, match_id: action.matchId, ...action.resultPatch.matchResult };
        snapshot.matchResults.push(result);
        resultWritesApplied += 1;
      } else if (
        result.verification_status !== action.resultPatch.matchResult.verification_status ||
        result.home_goals !== action.resultPatch.matchResult.home_goals ||
        result.away_goals !== action.resultPatch.matchResult.away_goals ||
        result.intake_source !== action.resultPatch.matchResult.intake_source ||
        result.source_note !== action.resultPatch.matchResult.source_note ||
        result.reviewed_at !== action.resultPatch.matchResult.reviewed_at ||
        result.recorded_at !== action.resultPatch.matchResult.recorded_at
      ) {
        Object.assign(result, action.resultPatch.matchResult);
        resultWritesApplied += 1;
      }

      if (match.status !== "finished") {
        match.status = "finished";
        resultWritesApplied += 1;
      }

      return {
        outcome: resultWritesApplied === 0 ? ("already_satisfied" as const) : ("applied" as const),
        resultWritesApplied,
        matchResultId: result.id,
      };
    },
    async insertPredictionResult(payload: Omit<PredictionResultRow, "id" | "created_at">) {
      this.insertedPredictionResults.push(payload);
      const id = `prediction-result-${snapshot.predictionResults.length + 1}`;
      snapshot.predictionResults.push({ id, ...payload });
      return { id };
    },
    async updatePredictionResult(resultId: string, payload: Omit<PredictionResultRow, "id" | "prediction_version_id" | "created_at">) {
      this.updatedPredictionResults.push({ resultId, payload });
      const result = snapshot.predictionResults.find((candidate) => candidate.id === resultId);
      if (!result) {
        throw new Error(`Missing prediction result ${resultId}`);
      }
      Object.assign(result, payload);
    },
  };
}

function toEquivalentOffsetInstant(utcInstant: string, offsetHours: number) {
  const shifted = new Date(Date.parse(utcInstant) + offsetHours * 60 * 60 * 1000);
  const iso = shifted.toISOString().replace("Z", "");
  const sign = offsetHours >= 0 ? "+" : "-";
  const absoluteHours = Math.abs(offsetHours).toString().padStart(2, "0");
  return `${iso}${sign}${absoluteHours}:00`;
}

function buildTask2B2VerificationFixtureSet() {
  const excludedFixtureIds = new Map<string, number>([
    ["wc2026-match-006", 1539001],
    ["wc2026-match-020", 1489382],
    ["wc2026-match-036", 1489394],
  ]);
  const groupStageFixtures = WORLD_CUP_2026_FIXTURES.slice(0, 72);
  const eligibleEvaluationFixtures = groupStageFixtures
    .map((fixture) => fixture.fixtureKey)
    .filter((fixtureKey) => !excludedFixtureIds.has(fixtureKey))
    .slice(0, 24);

  const snapshots = groupStageFixtures.map((fixture) => {
    const includePrediction = !excludedFixtureIds.has(fixture.fixtureKey) && eligibleEvaluationFixtures.includes(fixture.fixtureKey);
    const snapshot = buildStageSnapshot(fixture.fixtureKey, {
      predictionVersions: includePrediction ? undefined : [],
      predictionMarkets: includePrediction ? undefined : [],
    });
    if (excludedFixtureIds.has(fixture.fixtureKey)) {
      snapshot.matches[0] = {
        ...snapshot.matches[0]!,
        external_id: null,
      };
      snapshot.predictionVersions = [];
      snapshot.predictionMarkets = [];
    }
    return snapshot;
  });

  const providerFixtures = groupStageFixtures.map((fixture) => {
    const providerFixtureId = excludedFixtureIds.get(fixture.fixtureKey);
    return buildProviderFixture(fixture.fixtureKey, providerFixtureId
      ? {
          providerFixtureId,
          kickoffAt: "2026-06-14T04:00:00Z",
        }
      : {});
  });

  const combinedSnapshot: Task2B2StageSnapshot = {
    competitions: snapshots[0]!.competitions,
    teams: snapshots.flatMap((snapshot) => snapshot.teams),
    matches: snapshots.flatMap((snapshot) => snapshot.matches),
    matchResults: [],
    predictionVersions: snapshots.flatMap((snapshot) => snapshot.predictionVersions),
    predictionMarkets: snapshots.flatMap((snapshot) => snapshot.predictionMarkets),
    predictionResults: [],
  };

  return {
    snapshot: combinedSnapshot,
    providerFixtures,
    excludedFixtureIds,
    selection: {
      from: "2026-06-11",
      to: "2026-06-28",
    },
  };
}

describe("task2b result refresh", () => {
  beforeEach(() => {
    process.env.PREDICTION_INTELLIGENCE_TARGET = "development";
    delete process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE;
    artifactsDir = path.join(artifactsRoot, randomUUID());
    fs.mkdirSync(artifactsDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(artifactsDir, { recursive: true, force: true });
  });

  it("creates a safe verified result and V1 evaluation from the reviewed provider snapshot", async () => {
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey);
    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    expect(result.plan.summary.safeActionCount).toBe(1);
    expect(result.plan.rows[0]?.resultClassification).toBe("result_create_and_verify");
    expect(result.plan.rows[0]?.evaluationClassification).toBe("evaluation_create");
    expect(result.plan.rows[0]?.eligiblePredictionVersionId).toBe(`prediction-match-${fixtureKey}`);
    expect(evaluateTask2B2Eligibility(result.plan)).toEqual({ eligible: true, reasons: [] });
  });

  it("treats PEN as terminal, keeps the regular score, and preserves the shootout winner separately", async () => {
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey, {
      predictionVersions: [
        {
          ...buildPrediction(`match-${fixtureKey}`),
          home_win_prob: 28,
          draw_prob: 46,
          away_win_prob: 26,
          most_likely_score: "1-1",
          top_scores_json: [
            { score: "1-1", probability: 0.22 },
            { score: "1-0", probability: 0.14 },
          ],
        },
      ],
      predictionMarkets: [
        { id: "m1", prediction_version_id: `prediction-match-${fixtureKey}`, market: "btts", selection: "yes", probability: 0.62 },
        { id: "m2", prediction_version_id: `prediction-match-${fixtureKey}`, market: "btts", selection: "no", probability: 0.38 },
        { id: "m3", prediction_version_id: `prediction-match-${fixtureKey}`, market: "over_2_5", selection: "over", probability: 0.31 },
        { id: "m4", prediction_version_id: `prediction-match-${fixtureKey}`, market: "over_2_5", selection: "under", probability: 0.69 },
      ],
    });

    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [
          buildProviderFixture(fixtureKey, {
            statusShort: "PEN",
            goals: { home: 1, away: 1 },
            scoreBreakdown: {
              halftime: { home: 0, away: 1 },
              fulltime: { home: 1, away: 1 },
              extratime: { home: 0, away: 0 },
              penalty: { home: 3, away: 4 },
            },
            homeTeam: { winner: false },
            awayTeam: { winner: true },
            decision: "penalties",
          }),
        ],
      },
    );

    expect(result.plan.summary.safeActionCount).toBe(1);
    expect(result.plan.rows[0]).toMatchObject({
      providerStatusShort: "PEN",
      providerHomeGoals: 1,
      providerAwayGoals: 1,
      resultClassification: "result_create_and_verify",
      evaluationClassification: "evaluation_create",
      safeAction: true,
    });
    expect(result.plan.rows[0]?.resultPatch?.matchResult.home_goals).toBe(1);
    expect(result.plan.rows[0]?.resultPatch?.matchResult.away_goals).toBe(1);
    expect(result.plan.rows[0]?.resultPatch?.matchResult.source_note).toContain("result_decision=penalties");
    expect(result.plan.rows[0]?.resultPatch?.matchResult.source_note).toContain("penalty_score=3-4");
    expect(result.plan.rows[0]?.resultPatch?.matchResult.source_note).toContain("away_winner=true");

    const providerSnapshot = JSON.parse(fs.readFileSync(result.providerSnapshotPath, "utf8"));
    expect(providerSnapshot.fixtures[0]).toMatchObject({
      providerStatusShort: "PEN",
      decision: "penalties",
      homeTeam: { winner: false },
      awayTeam: { winner: true },
      scoreBreakdown: {
        fulltime: { home: 1, away: 1 },
        penalty: { home: 3, away: 4 },
      },
    });
  });

  it("treats AET as terminal but evaluates and persists the regular score period", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-053";
    const predictionId = `prediction-match-${fixtureKey}`;
    const snapshot = buildStageSnapshot(fixtureKey, {
      predictionVersions: [
        {
          ...buildPrediction(`match-${fixtureKey}`),
          id: predictionId,
          home_win_prob: 24,
          draw_prob: 51,
          away_win_prob: 25,
          most_likely_score: "1-1",
          top_scores_json: [
            { score: "1-1", probability: 0.26 },
            { score: "1-0", probability: 0.12 },
          ],
        },
      ],
      predictionMarkets: [
        { id: "m1", prediction_version_id: predictionId, market: "btts", selection: "yes", probability: 0.67 },
        { id: "m2", prediction_version_id: predictionId, market: "btts", selection: "no", probability: 0.33 },
        { id: "m3", prediction_version_id: predictionId, market: "over_2_5", selection: "over", probability: 0.24 },
        { id: "m4", prediction_version_id: predictionId, market: "over_2_5", selection: "under", probability: 0.76 },
      ],
    });

    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [
          buildProviderFixture(fixtureKey, {
            statusShort: "AET",
            goals: { home: 2, away: 1 },
            scoreBreakdown: {
              halftime: { home: 0, away: 0 },
              fulltime: { home: 1, away: 1 },
              extratime: { home: 1, away: 0 },
              penalty: { home: null, away: null },
            },
            homeTeam: { winner: true },
            awayTeam: { winner: false },
            decision: "extra_time",
          }),
        ],
      },
    );

    expect(result.plan.summary.safeActionCount).toBe(1);
    expect(result.plan.rows[0]).toMatchObject({
      providerStatusShort: "AET",
      providerHomeGoals: 1,
      providerAwayGoals: 1,
      resultClassification: "result_create_and_verify",
      evaluationClassification: "evaluation_create",
    });
    expect(result.plan.rows[0]?.resultPatch?.matchResult.home_goals).toBe(1);
    expect(result.plan.rows[0]?.resultPatch?.matchResult.away_goals).toBe(1);
    expect(result.plan.rows[0]?.resultPatch?.matchResult.source_note).toContain("result_decision=extra_time");
    expect(result.plan.rows[0]?.resultPatch?.matchResult.source_note).toContain("extra_time_score=1-0");
    expect(result.plan.rows[0]?.eligiblePredictionVersionId).toBe(predictionId);

    const adapter = buildMemoryAdapter(snapshot);
    const applyResult = await applyTask2B2Plan({
      reviewedPlan: result.plan,
      currentPlan: result.plan,
      reviewedStablePlanSha256: result.plan.stablePlanSha256,
      reviewedSnapshotSha256: result.providerSnapshotSha256,
      authorization: {
        mode: "apply",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: true,
      },
      databaseAdapter: adapter,
      now: "2026-06-30T12:00:00Z",
      snapshot,
    });

    expect(applyResult.completedActionKeys).toHaveLength(1);
    expect(adapter.insertedPredictionResults).toEqual([
      expect.objectContaining({
        prediction_version_id: predictionId,
        actual_home_goals: 1,
        actual_away_goals: 1,
        winner_correct: true,
        btts_correct: true,
        over_2_5_correct: true,
        exact_score_correct: true,
        goal_error: 0,
      }),
    ]);
  });

  it("fails closed for PEN when the fulltime regulation score is missing", async () => {
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey);

    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [
          buildProviderFixture(fixtureKey, {
            statusShort: "PEN",
            goals: { home: 1, away: 1 },
            scoreBreakdown: {
              halftime: { home: 0, away: 1 },
              fulltime: { home: null, away: null },
              extratime: { home: 0, away: 0 },
              penalty: { home: 3, away: 4 },
            },
            homeTeam: { winner: false },
            awayTeam: { winner: true },
            decision: "penalties",
          }),
        ],
      },
    );

    expect(result.plan.summary.safeActionCount).toBe(0);
    expect(result.plan.rows[0]).toMatchObject({
      providerStatusShort: "PEN",
      resultClassification: "terminal_without_score",
      evaluationClassification: "evaluation_not_eligible",
      safeAction: false,
    });
    expect(result.plan.rows[0]?.exclusionReason).toContain("fulltime regulation scores");
  });

  it("keeps PEN rows evaluation-pending when no eligible pre-kickoff prediction exists", async () => {
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey, { predictionVersions: [] });

    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [
          buildProviderFixture(fixtureKey, {
            statusShort: "PEN",
            goals: { home: 1, away: 1 },
            scoreBreakdown: {
              halftime: { home: 0, away: 1 },
              fulltime: { home: 1, away: 1 },
              extratime: { home: 0, away: 0 },
              penalty: { home: 3, away: 4 },
            },
            homeTeam: { winner: false },
            awayTeam: { winner: true },
            decision: "penalties",
          }),
        ],
      },
    );

    expect(result.plan.rows[0]?.resultClassification).toBe("result_create_and_verify");
    expect(result.plan.rows[0]?.evaluationClassification).toBe("evaluation_pending");
    expect(result.plan.rows[0]?.resultPatch?.matchResult.home_goals).toBe(1);
    expect(result.plan.rows[0]?.resultPatch?.matchResult.away_goals).toBe(1);
  });

  it("backfills selected exact fixture ids that are missing from the reviewed league snapshot", async () => {
    const fixtureKey = "wc2026-match-053";
    const fixture = fixtureByKey(fixtureKey);
    const providerFixtureId = fixture.apiFootballFixtureId ?? 900000 + fixture.matchNumber;
    const snapshot = buildStageSnapshot(fixtureKey);
    const exactFixtureCalls: number[] = [];

    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [],
        exactProviderFetcher: async (requestedFixtureId) => {
          exactFixtureCalls.push(requestedFixtureId);
          return buildProviderFixture(fixtureKey, { providerFixtureId: requestedFixtureId });
        },
      },
    );

    expect(exactFixtureCalls).toEqual([providerFixtureId]);
    expect(result.plan.summary.safeActionCount).toBe(1);
    expect(result.plan.rows[0]).toMatchObject({
      apiFootballFixtureId: providerFixtureId,
      resultClassification: "result_create_and_verify",
      evaluationClassification: "evaluation_create",
      safeAction: true,
      exclusionReason: null,
    });
    expect(result.plan.providerSnapshotSha256).toBe(result.providerSnapshotSha256);
  });

  it("keeps safe verified results when no exact immutable V1 prediction is eligible", async () => {
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey, { predictionVersions: [] });
    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    expect(result.plan.rows[0]?.resultClassification).toBe("result_create_and_verify");
    expect(result.plan.rows[0]?.evaluationClassification).toBe("evaluation_pending");
  });

  it("detects multiple eligible immutable V1 predictions as an evaluation conflict", async () => {
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey, {
      predictionVersions: [
        buildPrediction(`match-${fixtureKey}`),
        { ...buildPrediction(`match-${fixtureKey}`, "model-v1b"), id: `prediction-2-match-${fixtureKey}` },
      ],
    });
    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    expect(result.plan.rows[0]?.evaluationClassification).toBe("evaluation_conflict");
    expect(result.plan.rows[0]?.resultClassification).toBe("result_create_and_verify");
  });

  it("routes changed verified scores to reconciliation without overwrite", async () => {
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey, {
      matchResults: [
        {
          id: "result-1",
          match_id: `match-${fixtureKey}`,
          home_goals: 1,
          away_goals: 0,
          verification_status: "verified",
          intake_source: "api_football",
          source_note: "existing",
          reviewed_at: "2026-06-25T01:00:00Z",
          reviewed_by: null,
          recorded_at: "2026-06-25T01:00:00Z",
        },
      ],
    });
    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { goals: { home: 2, away: 1 } })],
      },
    );

    expect(result.plan.rows[0]?.resultClassification).toBe("verified_result_conflict");
    expect(result.plan.summary.safeActionCount).toBe(0);
  });

  it("preserves kickoff-conflict provider identity evidence for linkage-missing exclusions", async () => {
    const fixtureKey = "wc2026-match-006";
    const snapshot = buildStageSnapshot(fixtureKey);
    const providerFixtureId = 1539001;
    snapshot.matches[0] = {
      ...snapshot.matches[0]!,
      external_id: null,
    };

    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [
          buildProviderFixture(fixtureKey, {
            providerFixtureId,
            kickoffAt: "2026-06-14T04:00:00Z",
          }),
        ],
      },
    );

    expect(result.plan.summary.safeActionCount).toBe(0);
    expect(result.plan.rows[0]).toMatchObject({
      canonicalFixtureId: fixtureKey,
      apiFootballFixtureId: providerFixtureId,
      resultClassification: "outside_reviewed_action_set",
      evaluationClassification: "evaluation_not_eligible",
      providerStatus: "terminal_ft",
      providerStatusShort: "FT",
      providerHomeGoals: 2,
      providerAwayGoals: 1,
      safeAction: false,
      resultPatch: null,
      eligiblePredictionVersionId: null,
    });
    expect(result.plan.rows[0]?.exclusionReason).toContain("Canonical fixture wc2026-match-006 references provider fixture 1539001");
    expect(result.plan.rows[0]?.exclusionReason).toContain("differs from canonical kickoff");
    expect(result.plan.rowLevelExclusions).toEqual([
      {
        key: `match-${fixtureKey}:${fixtureKey}`,
        reason: result.plan.rows[0]?.exclusionReason,
      },
    ]);
  });

  it("serializes the three known excluded kickoff-conflict fixtures with exact provider ids", async () => {
    const fixtureKeys = ["wc2026-match-006", "wc2026-match-020", "wc2026-match-036"] as const;
    const providerFixtureIds = new Map<string, number>([
      ["wc2026-match-006", 1539001],
      ["wc2026-match-020", 1489382],
      ["wc2026-match-036", 1489394],
    ]);
    const snapshots = fixtureKeys.map((fixtureKey) => {
      const snapshot = buildStageSnapshot(fixtureKey);
      snapshot.matches[0] = {
        ...snapshot.matches[0]!,
        external_id: null,
      };
      return snapshot;
    });
    const combinedSnapshot: Task2B2StageSnapshot = {
      competitions: snapshots[0]!.competitions,
      teams: snapshots.flatMap((snapshot) => snapshot.teams),
      matches: snapshots.flatMap((snapshot) => snapshot.matches),
      matchResults: [],
      predictionVersions: snapshots.flatMap((snapshot) => snapshot.predictionVersions),
      predictionMarkets: snapshots.flatMap((snapshot) => snapshot.predictionMarkets),
      predictionResults: [],
    };

    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [...fixtureKeys] },
      },
      {
        databaseAdapter: buildMemoryAdapter(combinedSnapshot),
        providerFetcher: async () =>
          fixtureKeys.map((fixtureKey) =>
            buildProviderFixture(fixtureKey, {
              providerFixtureId: providerFixtureIds.get(fixtureKey)!,
            }),
          ),
      },
    );

    const excludedRows = result.plan.rows.filter((row) => fixtureKeys.includes(row.canonicalFixtureId as (typeof fixtureKeys)[number]));
    expect(excludedRows).toHaveLength(3);
    expect(result.plan.safeActions).toHaveLength(0);
    expect(excludedRows.map((row) => `${row.canonicalFixtureId}:${row.apiFootballFixtureId}`)).toEqual([
      "wc2026-match-006:1539001",
      "wc2026-match-020:1489382",
      "wc2026-match-036:1489394",
    ]);
    expect(excludedRows.every((row) => row.safeAction === false)).toBe(true);
    expect(excludedRows.every((row) => row.resultPatch === null)).toBe(true);
    expect(excludedRows.every((row) => row.eligiblePredictionVersionId === null)).toBe(true);
  });

  it("keeps unknown provider identity unresolved when no exact home-away evidence exists", async () => {
    const fixtureKey = "wc2026-match-006";
    const snapshot = buildStageSnapshot(fixtureKey);
    snapshot.matches[0] = {
      ...snapshot.matches[0]!,
      external_id: null,
    };

    const result = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [
          buildProviderFixture(fixtureKey, {
            providerFixtureId: 999999,
            homeTeam: { name: "Wrong Home" },
            awayTeam: { name: "Wrong Away" },
          }),
        ],
      },
    );

    expect(result.plan.rows[0]).toMatchObject({
      canonicalFixtureId: fixtureKey,
      apiFootballFixtureId: -1,
      safeAction: false,
      resultPatch: null,
      eligiblePredictionVersionId: null,
      exclusionReason: "Stored fixture does not yet have an exact API-Football external identity.",
    });
  });

  it("preserves the verified result when evaluation persistence is not eligible", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey, { predictionVersions: [] });
    const adapter = buildMemoryAdapter(snapshot);
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: adapter,
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    const applyResult = await applyTask2B2Plan({
      reviewedPlan: dryRun.plan,
      currentPlan: dryRun.plan,
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "apply",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: true,
      },
      databaseAdapter: adapter,
      now: "2026-06-24T02:00:00Z",
      snapshot,
    });

    expect(snapshot.matchResults[0]?.verification_status).toBe("verified");
    expect(snapshot.matches[0]?.status).toBe("finished");
    expect(applyResult.evaluationFailures).toHaveLength(0);
    expect(applyResult.resultWritesApplied).toBeGreaterThan(0);
    expect(adapter.rpcCalls).toHaveLength(1);
  });

  it("keeps result persistence successful when evaluation write fails after the verified result is stored", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey);
    const adapter = {
      ...buildMemoryAdapter(snapshot),
      async insertPredictionResult() {
        throw new Error("simulated evaluation insert failure");
      },
    };
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    const applyResult = await applyTask2B2Plan({
      reviewedPlan: dryRun.plan,
      currentPlan: dryRun.plan,
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "apply",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: true,
      },
      databaseAdapter: adapter,
      now: "2026-06-24T02:00:00Z",
      snapshot,
    });

    expect(snapshot.matchResults[0]?.verification_status).toBe("verified");
    expect(snapshot.matches[0]?.status).toBe("finished");
    expect(applyResult.failedActionKey).toBeNull();
    expect(applyResult.ambiguousActionKey).toBeNull();
    expect(applyResult.evaluationFailures).toHaveLength(1);
    expect(applyResult.completedActionKeys).toHaveLength(1);
  });

  it("treats exact already-satisfied result core as idempotent", async () => {
    const fixtureKey = "wc2026-match-053";
    const fixture = fixtureByKey(fixtureKey);
    const providerFixtureId = fixture.apiFootballFixtureId ?? 900000 + fixture.matchNumber;
    const dryRunSnapshot = buildStageSnapshot(fixtureKey);
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(dryRunSnapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { providerFixtureId })],
      },
    );
    const safeAction = dryRun.plan.safeActions[0]!;
    const snapshot = buildStageSnapshot(fixtureKey, {
      matchStatus: "finished",
      matchResults: [
        {
          id: "result-1",
          match_id: safeAction.matchId,
          ...safeAction.resultPatch.matchResult,
        },
      ],
    });
    const adapter = buildMemoryAdapter(snapshot);
    const result = await adapter.applyResultCore({
      matchId: safeAction.matchId,
      expectedExternalId: `api-football:fixture:${safeAction.apiFootballFixtureId}`,
      expectedPriorState: {
        matchStatus: "finished",
        resultState: {
          kind: "existing",
          verification_status: "verified",
          home_goals: safeAction.resultPatch.matchResult.home_goals,
          away_goals: safeAction.resultPatch.matchResult.away_goals,
        },
      },
      resultPatch: safeAction.resultPatch,
    });

    expect(result.outcome).toBe("already_satisfied");
    expect(result.resultWritesApplied).toBe(0);
    expect(result.matchResultId).toBe("result-1");
  });

  it("rejects a differing verified result without reporting success", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey, {
      matchResults: [
        {
          id: "result-1",
          match_id: `match-${fixtureKey}`,
          home_goals: 0,
          away_goals: 0,
          verification_status: "verified",
          intake_source: "api_football",
          source_note: "old",
          reviewed_at: "2026-06-25T00:00:00Z",
          reviewed_by: null,
          recorded_at: "2026-06-25T00:00:00Z",
        },
      ],
    });
    const adapter = buildMemoryAdapter(snapshot);
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: adapter,
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    expect(dryRun.plan.summary.safeActionCount).toBe(0);
  });

  it("network ambiguity is only resolved by exact verified score plus finished status", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-053";
    const fixture = fixtureByKey(fixtureKey);
    const providerFixtureId = fixture.apiFootballFixtureId ?? 900000 + fixture.matchNumber;
    const snapshot = buildStageSnapshot(fixtureKey);
    const baseAdapter = buildMemoryAdapter(snapshot);
    const adapter = {
      ...baseAdapter,
      async applyResultCore(action: Parameters<typeof baseAdapter.applyResultCore>[0]) {
        const result = await baseAdapter.applyResultCore(action);
        const match = snapshot.matches[0]!;
        match.status = "scheduled";
        throw new Error(`transport after ${result.outcome}`);
      },
    };
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(buildStageSnapshot(fixtureKey)),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    const applyResult = await applyTask2B2Plan({
      reviewedPlan: dryRun.plan,
      currentPlan: dryRun.plan,
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "apply",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: true,
      },
      databaseAdapter: adapter,
      now: "2026-06-28T02:00:00Z",
      snapshot,
    });

    expect(applyResult.failedActionKey).toBeNull();
    expect(applyResult.ambiguousActionKey).toBe(`match-${fixtureKey}:${fixtureKey}:${providerFixtureId}`);
    expect(applyResult.completedActionKeys).toHaveLength(0);
  });

  it("evaluation runs only after result-core success", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-053";
    const fixture = fixtureByKey(fixtureKey);
    const providerFixtureId = fixture.apiFootballFixtureId ?? 900000 + fixture.matchNumber;
    const snapshot = buildStageSnapshot(fixtureKey);
    const adapter = {
      ...buildMemoryAdapter(snapshot),
      async applyResultCore() {
        return { outcome: "stale_prior_state" as const, resultWritesApplied: 0, matchResultId: null };
      },
    };
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(buildStageSnapshot(fixtureKey)),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    const applyResult = await applyTask2B2Plan({
      reviewedPlan: dryRun.plan,
      currentPlan: dryRun.plan,
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "apply",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: true,
      },
      databaseAdapter: adapter,
      now: "2026-06-28T02:00:00Z",
      snapshot,
    });

    expect(applyResult.failedActionKey).toBe(`match-${fixtureKey}:${fixtureKey}:${providerFixtureId}`);
    expect(applyResult.attemptedEvaluationCount).toBe(0);
  });

  it("apply artifact persists bounded execution evidence including evaluation outcomes", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey);
    const adapter = buildMemoryAdapter(snapshot);
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: adapter,
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );
    const reviewedPlanPath = path.join(artifactsDir, "reviewed-plan.json");
    const reviewedSnapshotPath = path.join(artifactsDir, "reviewed-snapshot.json");
    fs.writeFileSync(reviewedPlanPath, JSON.stringify(dryRun.plan, null, 2));
    fs.copyFileSync(dryRun.providerSnapshotPath, reviewedSnapshotPath);

    const applyRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: false,
        apply: true,
        verify: false,
        reviewedPlanPath,
        reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
        providerSnapshotPath: reviewedSnapshotPath,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: adapter,
      },
    );

    const applyArtifact = JSON.parse(fs.readFileSync(applyRun.artifactPath, "utf8"));
    expect(applyArtifact.applySummary).toMatchObject({
      attemptedResultActionCount: 1,
      completedResultActionCount: 1,
      failedResultActionKey: null,
      ambiguousResultActionKey: null,
      attemptedEvaluationCount: 1,
      completedEvaluationCount: 1,
    });
    expect(applyArtifact.applySummary.completedActionKeys).toHaveLength(1);
    expect(applyArtifact.applySummary.completedEvaluationKeys).toHaveLength(1);
  });

  it("verifies a reviewed dry-run successfully after all 69 result actions and 24 evaluations have been applied", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureSet = buildTask2B2VerificationFixtureSet();
    const snapshot = fixtureSet.snapshot;
    const dryRunAdapter = buildMemoryAdapter(snapshot);
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: fixtureSet.selection,
      },
      {
        databaseAdapter: dryRunAdapter,
        providerFetcher: async () => fixtureSet.providerFixtures,
      },
    );

    expect(dryRun.plan.safeActions).toHaveLength(69);
    expect(dryRun.plan.rows.filter((row) => row.evaluationClassification === "evaluation_create")).toHaveLength(24);
    expect(dryRun.plan.rows.filter((row) => row.evaluationClassification === "evaluation_pending")).toHaveLength(45);
    expect(dryRun.plan.rows.filter((row) => !row.safeAction)).toHaveLength(3);

    await applyTask2B2Plan({
      reviewedPlan: dryRun.plan,
      currentPlan: dryRun.plan,
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "apply",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: true,
      },
      databaseAdapter: dryRunAdapter,
      now: "2026-06-29T08:43:36.824Z",
      snapshot,
    });

    const reviewedPlanPath = path.join(artifactsDir, "reviewed-plan-verify.json");
    const reviewedSnapshotPath = path.join(artifactsDir, "reviewed-snapshot-verify.json");
    fs.writeFileSync(reviewedPlanPath, JSON.stringify(dryRun.plan, null, 2));
    fs.copyFileSync(dryRun.providerSnapshotPath, reviewedSnapshotPath);

    const rpcCountBeforeVerify = dryRunAdapter.rpcCalls.length;
    const insertedPredictionCountBeforeVerify = dryRunAdapter.insertedPredictionResults.length;
    const updatedPredictionCountBeforeVerify = dryRunAdapter.updatedPredictionResults.length;

    const verifyRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: false,
        apply: false,
        verify: true,
        reviewedPlanPath,
        reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
        providerSnapshotPath: reviewedSnapshotPath,
        selection: fixtureSet.selection,
      },
      {
        databaseAdapter: dryRunAdapter,
      },
    );

    expect(verifyRun.verificationResult).toMatchObject({
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
    });
    expect(dryRunAdapter.rpcCalls).toHaveLength(rpcCountBeforeVerify);
    expect(dryRunAdapter.insertedPredictionResults).toHaveLength(insertedPredictionCountBeforeVerify);
    expect(dryRunAdapter.updatedPredictionResults).toHaveLength(updatedPredictionCountBeforeVerify);

    const verifyArtifact = JSON.parse(fs.readFileSync(verifyRun.artifactPath, "utf8"));
    expect(verifyArtifact.verificationSummary).toMatchObject({
      reviewedResultActionCount: 69,
      satisfiedResultActionCount: 69,
      reviewedEvaluationCount: 24,
      satisfiedEvaluationCount: 24,
      pendingEvaluationCount: 45,
      excludedRowCount: 3,
      verificationPassed: true,
    });
  });

  it("verification fails when one reviewed result is missing", async () => {
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey);
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    const verification = verifyTask2B2ReviewedPlan({
      reviewedPlan: dryRun.plan,
      currentPlan: {
        ...dryRun.plan,
        mode: "verification",
      },
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "verification",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: false,
      },
      stageSnapshot: snapshot,
    });

    expect(verification.verificationPassed).toBe(false);
    expect(verification.missingResultActionCount).toBe(1);
  });

  it("verification treats equivalent timestamp offsets as identical for result and evaluation metadata", async () => {
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey);
    const adapter = buildMemoryAdapter(snapshot);
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: adapter,
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );
    const equivalentReviewedAt = toEquivalentOffsetInstant(dryRun.plan.safeActions[0]!.resultPatch.matchResult.reviewed_at, -5);
    const equivalentRecordedAt = toEquivalentOffsetInstant(dryRun.plan.safeActions[0]!.resultPatch.matchResult.recorded_at, -5);
    await applyTask2B2Plan({
      reviewedPlan: dryRun.plan,
      currentPlan: dryRun.plan,
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "apply",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: true,
      },
      databaseAdapter: adapter,
      now: "2026-06-29T08:17:58.292Z",
      snapshot,
    });
    snapshot.matchResults[0] = {
      ...snapshot.matchResults[0]!,
      reviewed_at: equivalentReviewedAt,
      recorded_at: equivalentRecordedAt,
    };
    snapshot.predictionResults[0] = {
      ...snapshot.predictionResults[0]!,
      validated_at: equivalentReviewedAt,
    };

    const verification = verifyTask2B2ReviewedPlan({
      reviewedPlan: dryRun.plan,
      currentPlan: { ...dryRun.plan, mode: "verification" },
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "verification",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: false,
      },
      stageSnapshot: snapshot,
    });

    expect(verification).toMatchObject({
      reviewedResultActionCount: 1,
      satisfiedResultActionCount: 1,
      missingResultActionCount: 0,
      mismatchedResultActionCount: 0,
      ambiguousResultActionCount: 0,
      reviewedEvaluationCount: 1,
      satisfiedEvaluationCount: 1,
      missingEvaluationCount: 0,
      mismatchedEvaluationCount: 0,
      pendingEvaluationCount: 0,
      excludedRowCount: 0,
      verificationPassed: true,
    });
  });

  it("verification fails on one mismatched score, one non-finished match, one missing evaluation, and one differing evaluation", async () => {
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey);
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );
    const action = dryRun.plan.safeActions[0]!;
    const predictionId = action.eligiblePredictionVersionId!;

    snapshot.matches[0]!.status = "finished";
    snapshot.matchResults.push({
      id: "result-1",
      match_id: action.matchId,
      ...action.resultPatch.matchResult,
      home_goals: action.resultPatch.matchResult.home_goals + 1,
    });
    let verification = verifyTask2B2ReviewedPlan({
      reviewedPlan: dryRun.plan,
      currentPlan: { ...dryRun.plan, mode: "verification" },
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "verification",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: false,
      },
      stageSnapshot: snapshot,
    });
    expect(verification.mismatchedResultActionCount).toBe(1);

    snapshot.matchResults[0] = {
      ...snapshot.matchResults[0]!,
      home_goals: action.resultPatch.matchResult.home_goals,
      away_goals: action.resultPatch.matchResult.away_goals,
    };
    snapshot.matches[0]!.status = "scheduled";
    verification = verifyTask2B2ReviewedPlan({
      reviewedPlan: dryRun.plan,
      currentPlan: { ...dryRun.plan, mode: "verification" },
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "verification",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: false,
      },
      stageSnapshot: snapshot,
    });
    expect(verification.mismatchedResultActionCount).toBe(1);

    snapshot.matches[0]!.status = "finished";
    snapshot.matchResults[0] = {
      ...snapshot.matchResults[0]!,
      ...action.resultPatch.matchResult,
    };
    verification = verifyTask2B2ReviewedPlan({
      reviewedPlan: dryRun.plan,
      currentPlan: { ...dryRun.plan, mode: "verification" },
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "verification",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: false,
      },
      stageSnapshot: snapshot,
    });
    expect(verification.missingEvaluationCount).toBe(1);

    snapshot.predictionResults.push({
      id: "prediction-result-1",
      prediction_version_id: predictionId,
      actual_home_goals: 0,
      actual_away_goals: 0,
      winner_correct: false,
      btts_correct: false,
      over_2_5_correct: false,
      exact_score_correct: false,
      goal_error: 3,
      error_summary: "mismatch",
      validated_at: action.resultPatch.matchResult.reviewed_at,
    });
    verification = verifyTask2B2ReviewedPlan({
      reviewedPlan: dryRun.plan,
      currentPlan: { ...dryRun.plan, mode: "verification" },
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "verification",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: false,
      },
      stageSnapshot: snapshot,
    });
    expect(verification.mismatchedEvaluationCount).toBe(1);
  });

  it("verification rejects a modified reviewed plan or provider snapshot binding", async () => {
    const fixtureKey = "wc2026-match-053";
    const snapshot = buildStageSnapshot(fixtureKey);
    const adapter = buildMemoryAdapter(snapshot);
    const dryRun = await runTask2B2ResultRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: adapter,
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    const reviewedPlanPath = path.join(artifactsDir, "tampered-review-plan.json");
    const reviewedSnapshotPath = path.join(artifactsDir, "tampered-review-snapshot.json");
    const tamperedPlan = {
      ...dryRun.plan,
      rows: dryRun.plan.rows.map((row) =>
        row.matchId === `match-${fixtureKey}` ? { ...row, providerHomeGoals: 99 } : row,
      ),
    };
    fs.writeFileSync(reviewedPlanPath, JSON.stringify(tamperedPlan, null, 2));
    fs.copyFileSync(dryRun.providerSnapshotPath, reviewedSnapshotPath);

    await expect(
      runTask2B2ResultRefresh(
        {
          repoRoot,
          artifactsDir,
          envSupabaseUrl: stageUrl,
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          dryRun: false,
          apply: false,
          verify: true,
          reviewedPlanPath,
          reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
          providerSnapshotPath: reviewedSnapshotPath,
          selection: { canonicalFixtureIds: [fixtureKey] },
        },
        {
          databaseAdapter: adapter,
        },
      ),
    ).rejects.toThrow("Task 2B.2 reviewed artifact checksum did not match its contents.");

    fs.writeFileSync(reviewedPlanPath, JSON.stringify(dryRun.plan, null, 2));
    fs.writeFileSync(reviewedSnapshotPath, `${fs.readFileSync(dryRun.providerSnapshotPath, "utf8")}\n`);

    await expect(
      runTask2B2ResultRefresh(
        {
          repoRoot,
          artifactsDir,
          envSupabaseUrl: stageUrl,
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          dryRun: false,
          apply: false,
          verify: true,
          reviewedPlanPath,
          reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
          providerSnapshotPath: reviewedSnapshotPath,
          selection: { canonicalFixtureIds: [fixtureKey] },
        },
        {
          databaseAdapter: adapter,
        },
      ),
    ).rejects.toThrow("Task 2B.2 reviewed provider snapshot checksum differed.");
  });

  it("migration contract is bounded to atomic result-core writes only", () => {
    const migrationPath = path.join(
      repoRoot,
      "supabase",
      "migrations",
      "20260628010000_task2b_stage_result_core_apply.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create or replace function public.apply_task2b_stage_result_core(");
    expect(sql).toContain("set search_path = public");
    expect(sql).toContain("for update");
    expect(sql).toContain("insert into public.match_results");
    expect(sql).toContain("update public.match_results");
    expect(sql).toContain("update public.matches");
    expect(sql).toContain("set status = 'finished'");
    expect(sql).toContain("revoke execute on function public.apply_task2b_stage_result_core");
    expect(sql).toContain("grant execute on function public.apply_task2b_stage_result_core");
    expect(sql).toContain("to service_role");
    expect(sql).not.toContain("prediction_versions");
    expect(sql).not.toContain("prediction_markets");
    expect(sql).not.toContain("prediction_results");
    expect(sql).not.toContain("external_id =");
    expect(sql).not.toContain("kickoff_at");
    expect(sql).not.toContain("access_scope");
  });
});
