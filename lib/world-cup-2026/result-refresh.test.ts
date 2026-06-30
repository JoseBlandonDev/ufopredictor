import { describe, expect, it } from "vitest";
import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import {
  applyWorldCupResultRefreshPlan,
  buildWorldCupResultRefreshSelection,
  planWorldCupResultRefresh,
  resolveWorldCupResultRefreshApplySelection,
  type WorldCupResultRefreshDatabaseSnapshot,
  type WorldCupResultRefreshWriteAdapter,
} from "./result-refresh";

function buildSnapshot(
  overrides: Partial<WorldCupResultRefreshDatabaseSnapshot> = {},
): WorldCupResultRefreshDatabaseSnapshot {
  return {
    competitions: [
      {
        id: "competition-1",
        slug: "world-cup-2026",
        name: "World Cup",
        usage_scope: "public_product",
      },
    ],
    seasons: [
      {
        id: "season-2026",
        competition_id: "competition-1",
        year: 2026,
      },
    ],
    teams: [
      { id: "team-home", name: "France" },
      { id: "team-away", name: "Senegal" },
    ],
    matches: [
      {
        id: "match-1",
        external_id: "api-football:fixture:1489383",
        slug: "world-cup-2026-france-vs-senegal-2026-06-16",
        competition_id: "competition-1",
        season_id: "season-2026",
        home_team_id: "team-home",
        away_team_id: "team-away",
        kickoff_at: "2026-06-16T19:00:00Z",
        stage: "Group Stage - 1",
        status: "scheduled",
        access_scope: "public",
        intake_source: "api_football",
        source_note: null,
      },
    ],
    matchResults: [],
    predictionVersions: [
      {
        id: "prediction-1",
        match_id: "match-1",
        run_scope: "internal_lab",
        prediction_type: "pre_match_24h",
        created_at: "2026-06-15T18:00:00Z",
        home_win_prob: 51.2,
        draw_prob: 27.5,
        away_win_prob: 21.3,
        most_likely_score: "2-1",
        top_scores_json: [
          { score: "2-1", probability: 18.4 },
          { score: "1-0", probability: 12.1 },
        ],
      },
    ],
    predictionMarkets: [
      { prediction_version_id: "prediction-1", market: "btts", selection: "yes", probability: 62.4 },
      { prediction_version_id: "prediction-1", market: "btts", selection: "no", probability: 37.6 },
      { prediction_version_id: "prediction-1", market: "over_2_5", selection: "over", probability: 56.1 },
      { prediction_version_id: "prediction-1", market: "over_2_5", selection: "under", probability: 43.9 },
    ],
    predictionResults: [],
    ...overrides,
  };
}

function buildProviderFixture(
  overrides: Partial<ProviderFixture> = {},
): ProviderFixture {
  return {
    provider: "api-football",
    providerFixtureId: 1489383,
    kickoffAt: "2026-06-16T19:00:00Z",
    timezone: "UTC",
    status: "finished",
    statusShort: "FT",
    elapsedMinutes: 90,
    competition: {
      providerCompetitionId: 1,
      name: "World Cup",
      country: "World",
      season: 2026,
      round: "Group Stage - 1",
    },
    homeTeam: {
      providerTeamId: 1,
      name: "France",
      winner: true,
    },
    awayTeam: {
      providerTeamId: 2,
      name: "Senegal",
      winner: false,
    },
    goals: {
      home: 2,
      away: 1,
    },
    score: {
      halftime: { home: 1, away: 0 },
      fulltime: { home: 2, away: 1 },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
    ...overrides,
  };
}

function buildKnockoutSnapshot(
  overrides: Partial<WorldCupResultRefreshDatabaseSnapshot> = {},
): WorldCupResultRefreshDatabaseSnapshot {
  return {
    competitions: [
      {
        id: "competition-1",
        slug: "world-cup-2026",
        name: "World Cup",
        usage_scope: "public_product",
      },
    ],
    seasons: [
      {
        id: "season-2026",
        competition_id: "competition-1",
        year: 2026,
      },
    ],
    teams: [
      { id: "team-home", name: "Brazil" },
      { id: "team-away", name: "Japan" },
    ],
    matches: [
      {
        id: "match-knockout-1",
        external_id: "api-football:fixture:1562344",
        slug: "world-cup-2026-brazil-vs-japan-2026-06-29",
        competition_id: "competition-1",
        season_id: "season-2026",
        home_team_id: "team-home",
        away_team_id: "team-away",
        kickoff_at: "2026-06-29T17:00:00Z",
        stage: "Round of 32",
        status: "scheduled",
        access_scope: "public",
        intake_source: "api_football",
        source_note: null,
      },
    ],
    matchResults: [],
    predictionVersions: [],
    predictionMarkets: [],
    predictionResults: [],
    ...overrides,
  };
}

function buildKnockoutProviderFixture(
  overrides: Partial<ProviderFixture> = {},
): ProviderFixture {
  return {
    provider: "api-football",
    providerFixtureId: 1562344,
    kickoffAt: "2026-06-29T17:00:00Z",
    timezone: "UTC",
    status: "finished",
    statusShort: "FT",
    elapsedMinutes: 90,
    competition: {
      providerCompetitionId: 1,
      name: "World Cup",
      country: "World",
      season: 2026,
      round: "Round of 32",
    },
    homeTeam: {
      providerTeamId: 101,
      name: "Brazil",
      winner: true,
    },
    awayTeam: {
      providerTeamId: 102,
      name: "Japan",
      winner: false,
    },
    goals: {
      home: 2,
      away: 1,
    },
    score: {
      halftime: { home: 1, away: 0 },
      fulltime: { home: 2, away: 1 },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
    ...overrides,
  };
}

function buildStoredMatchResult(
  overrides: Partial<WorldCupResultRefreshDatabaseSnapshot["matchResults"][number]> = {},
): WorldCupResultRefreshDatabaseSnapshot["matchResults"][number] {
  return {
    id: "result-1",
    match_id: "match-1",
    home_goals: 2,
    away_goals: 1,
    decision_method: "ft",
    regulation_home_goals: 2,
    regulation_away_goals: 1,
    after_extra_time_home_goals: null,
    after_extra_time_away_goals: null,
    penalty_home_goals: null,
    penalty_away_goals: null,
    advancing_team_id: null,
    verification_status: "verified",
    intake_source: "api_football",
    source_note: "trusted provider",
    reviewed_at: "2026-06-16T21:00:00Z",
    reviewed_by: null,
    recorded_at: "2026-06-16T20:59:00Z",
    ...overrides,
  };
}

function buildKnockoutPredictionSnapshot(
  overrides: Partial<WorldCupResultRefreshDatabaseSnapshot> = {},
): WorldCupResultRefreshDatabaseSnapshot {
  return buildKnockoutSnapshot({
    predictionVersions: [
      {
        id: "prediction-knockout-1",
        match_id: "match-knockout-1",
        run_scope: "internal_lab",
        prediction_type: "pre_match_24h",
        created_at: "2026-06-29T12:00:00Z",
        home_win_prob: 48.1,
        draw_prob: 28.4,
        away_win_prob: 23.5,
        most_likely_score: "1-0",
        top_scores_json: [{ score: "1-0", probability: 15.1 }],
      },
    ],
    predictionMarkets: [
      { prediction_version_id: "prediction-knockout-1", market: "btts", selection: "yes", probability: 44.2 },
      { prediction_version_id: "prediction-knockout-1", market: "btts", selection: "no", probability: 55.8 },
      { prediction_version_id: "prediction-knockout-1", market: "over_2_5", selection: "over", probability: 37.5 },
      { prediction_version_id: "prediction-knockout-1", market: "over_2_5", selection: "under", probability: 62.5 },
    ],
    ...overrides,
  });
}

function createMemoryWriteAdapter(snapshot: WorldCupResultRefreshDatabaseSnapshot) {
  const operations = {
    matchUpdates: [] as Array<{ matchId: string; payload: Record<string, unknown> }>,
    matchResultInserts: [] as Array<Record<string, unknown>>,
    matchResultUpdates: [] as Array<{ resultId: string; payload: Record<string, unknown> }>,
    predictionResultInserts: [] as Array<Record<string, unknown>>,
    predictionResultUpdates: [] as Array<{ predictionResultId: string; payload: Record<string, unknown> }>,
  };

  const adapter: WorldCupResultRefreshWriteAdapter = {
    async updateMatch(matchId, payload) {
      operations.matchUpdates.push({ matchId, payload: { ...payload } });
      const match = snapshot.matches.find((candidate) => candidate.id === matchId);
      if (match && payload.status) {
        match.status = payload.status;
      }
    },
    async insertMatchResult(payload) {
      operations.matchResultInserts.push({ ...payload });
      const id = `result-${snapshot.matchResults.length + 1}`;
      snapshot.matchResults.push({ id, ...payload });
      return { id };
    },
    async updateMatchResult(resultId, payload) {
      operations.matchResultUpdates.push({ resultId, payload: { ...payload } });
      const result = snapshot.matchResults.find((candidate) => candidate.id === resultId);
      if (!result) {
        throw new Error(`missing result ${resultId}`);
      }
      Object.assign(result, payload);
    },
    async insertPredictionResult(payload) {
      operations.predictionResultInserts.push({ ...payload });
      const id = `prediction-result-${snapshot.predictionResults.length + 1}`;
      snapshot.predictionResults.push({ id, ...payload });
      return { id };
    },
    async updatePredictionResult(predictionResultId, payload) {
      operations.predictionResultUpdates.push({ predictionResultId, payload: { ...payload } });
      const result = snapshot.predictionResults.find((candidate) => candidate.id === predictionResultId);
      if (!result) {
        throw new Error(`missing prediction result ${predictionResultId}`);
      }
      Object.assign(result, payload);
    },
  };

  return { adapter, operations };
}

describe("world cup result refresh", () => {
  it("plans trusted FT results for verified result creation and evaluation persistence", async () => {
    const snapshot = buildSnapshot();
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1489383"],
    });
    const providerFixtures = [buildProviderFixture()];
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-23T00:00:00Z",
      selection,
      snapshot,
      providerFixtures,
    });

    expect(report.summary.selectedFixtures).toBe(1);
    expect(report.summary.resultsCreated).toBe(1);
    expect(report.summary.resultsVerified).toBe(1);
    expect(report.summary.evaluationsCreated).toBe(1);
    expect(report.rows[0]?.trustedAutoVerifyEligible).toBe(true);
    expect(report.rows[0]?.resultAction).toBe("create_verified");
    expect(report.rows[0]?.evaluationAction).toBe("create");

    const { adapter, operations } = createMemoryWriteAdapter(snapshot);
    const applySelection = resolveWorldCupResultRefreshApplySelection({
      selectedMatches: selection.matches,
      allowExternalIds: ["api-football:fixture:1489383"],
    });

    const counts = await applyWorldCupResultRefreshPlan({
      report,
      snapshot,
      providerFixtures,
      applySelection,
      providerResponseAt: "2026-06-23T01:00:00Z",
      verifiedAt: "2026-06-23T01:00:00Z",
      writeAdapter: adapter,
    });

    expect(counts.resultsCreated).toBe(1);
    expect(counts.resultsVerified).toBe(1);
    expect(counts.evaluationsCreated).toBe(1);
    expect(operations.matchResultInserts).toHaveLength(1);
    expect(operations.predictionResultInserts).toHaveLength(1);
    expect(snapshot.matchResults[0]?.verification_status).toBe("verified");
  });

  it("does not overwrite a previously verified result with a different provider score", () => {
    const snapshot = buildSnapshot({
      matchResults: [buildStoredMatchResult({
        home_goals: 1,
        away_goals: 0,
        regulation_home_goals: 1,
        regulation_away_goals: 0,
        source_note: "manual verified",
      })],
    });
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1489383"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-23T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [buildProviderFixture({ goals: { home: 2, away: 1 } })],
    });

    expect(report.summary.exceptionsOrConflicts).toBe(1);
    expect(report.summary.resultsVerified).toBe(0);
    expect(report.rows[0]?.resultAction).toBe("verified_conflict");
    expect(report.rows[0]?.conflictSummary).toContain("stored_verified_score=1-0");
    expect(report.rows[0]?.conflictSummary).toContain("provider_score=2-1");
    expect(report.rows[0]?.conflictSummary).toContain("stored_method=ft");
  });

  it("keeps unsupported terminal group-stage states in pending review instead of auto-verifying", async () => {
    const snapshot = buildSnapshot();
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1489383"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-23T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [
        buildProviderFixture({
          statusShort: "AET",
          elapsedMinutes: 120,
        }),
      ],
    });

    expect(report.rows[0]?.trustedAutoVerifyEligible).toBe(false);
    expect(report.rows[0]?.resultAction).toBe("create_pending_review_exception");
    expect(report.rows[0]?.exceptionReason).toBe("unsupported_terminal_status_for_group_stage");
    expect(report.rows[0]?.evaluationAction).toBe("none");
    expect(report.rows[0]?.structuredResult).toMatchObject({
      decisionMethod: "ft",
      homeGoals: 2,
      awayGoals: 1,
      regulationHomeGoals: 2,
      regulationAwayGoals: 1,
      afterExtraTimeHomeGoals: null,
      afterExtraTimeAwayGoals: null,
      penaltyHomeGoals: null,
      penaltyAwayGoals: null,
      advancingTeamId: null,
    });

    const { adapter, operations } = createMemoryWriteAdapter(snapshot);
    const applySelection = resolveWorldCupResultRefreshApplySelection({
      selectedMatches: selection.matches,
      allowExternalIds: ["api-football:fixture:1489383"],
    });

    const counts = await applyWorldCupResultRefreshPlan({
      report,
      snapshot,
      providerFixtures: [
        buildProviderFixture({
          statusShort: "AET",
          elapsedMinutes: 120,
        }),
      ],
      applySelection,
      providerResponseAt: "2026-06-23T01:00:00Z",
      verifiedAt: "2026-06-23T01:00:00Z",
      writeAdapter: adapter,
    });

    expect(counts.resultsCreated).toBe(1);
    expect(counts.resultsVerified).toBe(0);
    expect(counts.evaluationsCreated).toBe(0);
    expect(counts.evaluationsUpdated).toBe(0);
    expect(operations.matchResultInserts).toHaveLength(1);
    expect(operations.predictionResultInserts).toHaveLength(0);
    expect(snapshot.matchResults[0]).toMatchObject({
      verification_status: "pending_review",
      decision_method: "ft",
      home_goals: 2,
      away_goals: 1,
      regulation_home_goals: 2,
      regulation_away_goals: 1,
      after_extra_time_home_goals: null,
      after_extra_time_away_goals: null,
      penalty_home_goals: null,
      penalty_away_goals: null,
      advancing_team_id: null,
    });
  });

  it("updates postponed status metadata without creating a result", () => {
    const snapshot = buildSnapshot();
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1489383"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-23T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [
        buildProviderFixture({
          status: "scheduled",
          statusShort: "PST",
          elapsedMinutes: null,
          goals: { home: null, away: null },
        }),
      ],
    });

    expect(report.rows[0]?.statusAction).toBe("update");
    expect(report.rows[0]?.nextStoredStatus).toBe("postponed");
    expect(report.rows[0]?.resultAction).toBe("none");
  });

  it("resolves provider-linked canonical fixtures with World Cup catalog aliases", () => {
    const snapshot = buildSnapshot({
      teams: [
        { id: "team-home", name: "South Korea" },
        { id: "team-away", name: "Czechia" },
      ],
      matches: [
        {
          id: "match-1",
          external_id: "api-football:fixture:1538999",
          slug: "world-cup-2026-south-korea-vs-czech-republic-2026-06-12",
          competition_id: "competition-1",
          season_id: "season-2026",
          home_team_id: "team-home",
          away_team_id: "team-away",
          kickoff_at: "2026-06-12T02:00:00Z",
          stage: "Group Stage - 1",
          status: "scheduled",
          access_scope: "public",
          intake_source: "api_football",
          source_note: null,
        },
      ],
      predictionVersions: [],
      predictionMarkets: [],
    });
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1538999"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-23T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [
        buildProviderFixture({
          providerFixtureId: 1538999,
          kickoffAt: "2026-06-12T02:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 1",
          },
          homeTeam: {
            providerTeamId: 10,
            name: "Korea Republic",
            winner: true,
          },
          awayTeam: {
            providerTeamId: 11,
            name: "Czechia",
            winner: false,
          },
          goals: {
            home: 2,
            away: 0,
          },
        }),
      ],
    });

    expect(report.rows[0]?.canonicalFixtureId).toBe("wc2026-match-002");
    expect(report.rows[0]?.trustedAutoVerifyEligible).toBe(true);
  });

  it("resolves Czechia to the canonical Czech Republic fixture and makes the row auto-verify eligible", () => {
    const snapshot = buildSnapshot({
      teams: [
        { id: "team-home", name: "Czechia" },
        { id: "team-away", name: "Mexico" },
      ],
      matches: [
        {
          id: "match-53",
          external_id: "api-football:fixture:1539010",
          slug: "world-cup-2026-czechia-vs-mexico-2026-06-25",
          competition_id: "competition-1",
          season_id: "season-2026",
          home_team_id: "team-home",
          away_team_id: "team-away",
          kickoff_at: "2026-06-25T01:00:00Z",
          stage: "Group Stage - 3",
          status: "scheduled",
          access_scope: "public",
          intake_source: "api_football",
          source_note: null,
        },
      ],
      predictionVersions: [],
      predictionMarkets: [],
    });
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1539010"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-26T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [
        buildProviderFixture({
          providerFixtureId: 1539010,
          kickoffAt: "2026-06-25T01:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 3",
          },
          homeTeam: {
            providerTeamId: 53,
            name: "Czechia",
            winner: false,
          },
          awayTeam: {
            providerTeamId: 54,
            name: "Mexico",
            winner: true,
          },
          goals: {
            home: 0,
            away: 3,
          },
        }),
      ],
    });

    expect(report.rows[0]?.canonicalFixtureId).toBe("wc2026-match-053");
    expect(report.rows[0]?.trustedAutoVerifyEligible).toBe(true);
    expect(report.rows[0]?.resultAction).toBe("create_verified");
  });

  it("resolves Ivory Coast aliases to the canonical Côte d’Ivoire fixture and makes the row auto-verify eligible", () => {
    const snapshot = buildSnapshot({
      teams: [
        { id: "team-home", name: "Curacao" },
        { id: "team-away", name: "Ivory Coast" },
      ],
      matches: [
        {
          id: "match-55",
          external_id: "api-football:fixture:1489409",
          slug: "world-cup-2026-curacao-vs-ivory-coast-2026-06-25",
          competition_id: "competition-1",
          season_id: "season-2026",
          home_team_id: "team-home",
          away_team_id: "team-away",
          kickoff_at: "2026-06-25T20:00:00Z",
          stage: "Group Stage - 3",
          status: "scheduled",
          access_scope: "public",
          intake_source: "api_football",
          source_note: null,
        },
      ],
      predictionVersions: [],
      predictionMarkets: [],
    });
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1489409"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-26T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [
        buildProviderFixture({
          providerFixtureId: 1489409,
          kickoffAt: "2026-06-25T20:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 3",
          },
          homeTeam: {
            providerTeamId: 55,
            name: "Curaçao",
            winner: false,
          },
          awayTeam: {
            providerTeamId: 56,
            name: "Ivory Coast",
            winner: true,
          },
          goals: {
            home: 0,
            away: 2,
          },
        }),
      ],
    });

    expect(report.rows[0]?.canonicalFixtureId).toBe("wc2026-match-055");
    expect(report.rows[0]?.trustedAutoVerifyEligible).toBe(true);
    expect(report.rows[0]?.resultAction).toBe("create_verified");
  });

  it("keeps reversed and unrelated team identities blocked", () => {
    const reversedSnapshot = buildSnapshot({
      teams: [
        { id: "team-home", name: "Mexico" },
        { id: "team-away", name: "Czechia" },
      ],
      matches: [
        {
          id: "match-53",
          external_id: "api-football:fixture:1539010",
          slug: "world-cup-2026-mexico-vs-czechia-2026-06-25",
          competition_id: "competition-1",
          season_id: "season-2026",
          home_team_id: "team-home",
          away_team_id: "team-away",
          kickoff_at: "2026-06-25T01:00:00Z",
          stage: "Group Stage - 3",
          status: "scheduled",
          access_scope: "public",
          intake_source: "api_football",
          source_note: null,
        },
      ],
      predictionVersions: [],
      predictionMarkets: [],
    });
    const reversedSelection = buildWorldCupResultRefreshSelection(reversedSnapshot, {
      externalIds: ["api-football:fixture:1539010"],
    });
    const reversedReport = planWorldCupResultRefresh({
      generatedAt: "2026-06-26T00:00:00Z",
      selection: reversedSelection,
      snapshot: reversedSnapshot,
      providerFixtures: [
        buildProviderFixture({
          providerFixtureId: 1539010,
          kickoffAt: "2026-06-25T01:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 3",
          },
          homeTeam: {
            providerTeamId: 53,
            name: "Czechia",
            winner: false,
          },
          awayTeam: {
            providerTeamId: 54,
            name: "Mexico",
            winner: true,
          },
          goals: {
            home: 0,
            away: 3,
          },
        }),
      ],
    });

    expect(reversedReport.rows[0]?.trustedAutoVerifyEligible).toBe(false);
    expect(reversedReport.rows[0]?.conflictSummary).toContain("reverses the stored home/away team order");

    const unrelatedSnapshot = buildSnapshot({
      teams: [
        { id: "team-home", name: "Atlantis" },
        { id: "team-away", name: "Mexico" },
      ],
      matches: [
        {
          id: "match-53",
          external_id: "api-football:fixture:1539010",
          slug: "world-cup-2026-atlantis-vs-mexico-2026-06-25",
          competition_id: "competition-1",
          season_id: "season-2026",
          home_team_id: "team-home",
          away_team_id: "team-away",
          kickoff_at: "2026-06-25T01:00:00Z",
          stage: "Group Stage - 3",
          status: "scheduled",
          access_scope: "public",
          intake_source: "api_football",
          source_note: null,
        },
      ],
      predictionVersions: [],
      predictionMarkets: [],
    });
    const unrelatedSelection = buildWorldCupResultRefreshSelection(unrelatedSnapshot, {
      externalIds: ["api-football:fixture:1539010"],
    });
    const unrelatedReport = planWorldCupResultRefresh({
      generatedAt: "2026-06-26T00:00:00Z",
      selection: unrelatedSelection,
      snapshot: unrelatedSnapshot,
      providerFixtures: [
        buildProviderFixture({
          providerFixtureId: 1539010,
          kickoffAt: "2026-06-25T01:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 3",
          },
          homeTeam: {
            providerTeamId: 53,
            name: "Czechia",
            winner: false,
          },
          awayTeam: {
            providerTeamId: 54,
            name: "Mexico",
            winner: true,
          },
          goals: {
            home: 0,
            away: 3,
          },
        }),
      ],
    });

    expect(unrelatedReport.rows[0]?.trustedAutoVerifyEligible).toBe(false);
    expect(unrelatedReport.rows[0]?.conflictSummary).toContain("does not map cleanly to canonical World Cup team identities");
  });

  it("is idempotent on a second apply for the same trusted FT result", async () => {
    const snapshot = buildSnapshot();
    const providerFixtures = [buildProviderFixture()];
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1489383"],
    });
    const firstReport = planWorldCupResultRefresh({
      generatedAt: "2026-06-23T00:00:00Z",
      selection,
      snapshot,
      providerFixtures,
    });
    const firstAdapter = createMemoryWriteAdapter(snapshot);
    const applySelection = resolveWorldCupResultRefreshApplySelection({
      selectedMatches: selection.matches,
      allowExternalIds: ["api-football:fixture:1489383"],
    });

    await applyWorldCupResultRefreshPlan({
      report: firstReport,
      snapshot,
      providerFixtures,
      applySelection,
      providerResponseAt: "2026-06-23T01:00:00Z",
      verifiedAt: "2026-06-23T01:00:00Z",
      writeAdapter: firstAdapter.adapter,
    });

    const secondReport = planWorldCupResultRefresh({
      generatedAt: "2026-06-23T02:00:00Z",
      selection,
      snapshot,
      providerFixtures,
    });
    const secondAdapter = createMemoryWriteAdapter(snapshot);
    const secondCounts = await applyWorldCupResultRefreshPlan({
      report: secondReport,
      snapshot,
      providerFixtures,
      applySelection,
      providerResponseAt: "2026-06-23T02:00:00Z",
      verifiedAt: "2026-06-23T02:00:00Z",
      writeAdapter: secondAdapter.adapter,
    });

    expect(secondReport.summary.resultsAlreadyIdentical).toBe(1);
    expect(secondReport.summary.evaluationsAlreadyStored).toBe(1);
    expect(secondCounts.resultsCreated).toBe(0);
    expect(secondCounts.resultsUpdated).toBe(0);
    expect(secondCounts.evaluationsCreated).toBe(0);
    expect(secondCounts.evaluationsUpdated).toBe(0);
    expect(secondCounts.evaluationsAlreadyStored).toBe(1);
    expect(secondAdapter.operations.matchResultInserts).toHaveLength(0);
    expect(secondAdapter.operations.matchResultUpdates).toHaveLength(0);
    expect(secondAdapter.operations.predictionResultInserts).toHaveLength(0);
    expect(secondAdapter.operations.predictionResultUpdates).toHaveLength(0);
  });

  it("resolves runtime knockout identity through the stored provider-linked match contract", () => {
    const snapshot = buildKnockoutSnapshot();
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1562344"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [buildKnockoutProviderFixture()],
    });

    expect(report.rows[0]).toMatchObject({
      storedStage: "Round of 32",
      providerRound: "Round of 32",
      canonicalFixtureId: null,
      trustedAutoVerifyEligible: true,
      resultAction: "create_verified",
    });
  });

  it("fails closed when the knockout provider id does not match the stored external link", () => {
    const snapshot = buildKnockoutSnapshot();
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1562344"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [buildKnockoutProviderFixture({ providerFixtureId: 1999999 })],
    });

    expect(report.rows[0]?.trustedAutoVerifyEligible).toBe(false);
    expect(report.rows[0]?.exceptionReason).toBe("provider_fixture_not_found");
  });

  it("fails closed when a knockout provider fixture reverses home and away teams", () => {
    const snapshot = buildKnockoutSnapshot();
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1562344"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [
        buildKnockoutProviderFixture({
          homeTeam: { providerTeamId: 101, name: "Japan", winner: false },
          awayTeam: { providerTeamId: 102, name: "Brazil", winner: true },
        }),
      ],
    });

    expect(report.rows[0]?.trustedAutoVerifyEligible).toBe(false);
    expect(report.rows[0]?.conflictSummary).toContain("reverses the stored home/away team order");
  });

  it("fails closed when a knockout provider kickoff conflicts with the stored runtime match", () => {
    const snapshot = buildKnockoutSnapshot();
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1562344"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [buildKnockoutProviderFixture({ kickoffAt: "2026-06-29T18:00:00Z" })],
    });

    expect(report.rows[0]?.trustedAutoVerifyEligible).toBe(false);
    expect(report.rows[0]?.conflictSummary).toContain("does not match stored kickoff");
  });

  it("keeps a scheduled knockout fixture read-only without reporting a result conflict", () => {
    const snapshot = buildKnockoutSnapshot();
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1562344"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [
        buildKnockoutProviderFixture({
          status: "scheduled",
          statusShort: "NS",
          elapsedMinutes: null,
          goals: { home: null, away: null },
          homeTeam: { providerTeamId: 101, name: "Brazil", winner: null },
          awayTeam: { providerTeamId: 102, name: "Japan", winner: null },
        }),
      ],
    });

    expect(report.rows[0]).toMatchObject({
      storedStage: "Round of 32",
      providerRound: "Round of 32",
      statusAction: "none",
      resultAction: "none",
      conflictSummary: null,
      exceptionReason: null,
    });
  });

  it("derives knockout terminal football score from fulltime plus extra time", () => {
    const snapshot = buildKnockoutSnapshot();
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1562344"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [
        buildKnockoutProviderFixture({
          statusShort: "AET",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 101, name: "Brazil", winner: true },
          awayTeam: { providerTeamId: 102, name: "Japan", winner: false },
          goals: { home: 2, away: 1 },
          score: {
            halftime: { home: 0, away: 0 },
            fulltime: { home: 1, away: 1 },
            extratime: { home: 1, away: 0 },
            penalty: { home: null, away: null },
          },
        }),
      ],
    });

    expect(report.rows[0]).toMatchObject({
      providerFulltimeHomeGoals: 1,
      providerFulltimeAwayGoals: 1,
      providerExtratimeHomeGoals: 1,
      providerExtratimeAwayGoals: 0,
      resultAction: "create_verified",
      evaluationAction: "ineligible",
      evaluationIneligibleReason: "knockout_evaluation_policy_unconfirmed",
      structuredResult: {
        decisionMethod: "aet",
        regulationHomeGoals: 1,
        regulationAwayGoals: 1,
        afterExtraTimeHomeGoals: 2,
        afterExtraTimeAwayGoals: 1,
        homeGoals: 2,
        awayGoals: 1,
        advancingTeamId: "team-home",
      },
    });
  });

  it("keeps PEN football scores at the post-extra-time draw before penalties", () => {
    const snapshot = buildKnockoutSnapshot();
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1562344"],
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection,
      snapshot,
      providerFixtures: [
        buildKnockoutProviderFixture({
          statusShort: "PEN",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 101, name: "Brazil", winner: false },
          awayTeam: { providerTeamId: 102, name: "Japan", winner: true },
          goals: { home: 1, away: 1 },
          score: {
            halftime: { home: 0, away: 0 },
            fulltime: { home: 1, away: 1 },
            extratime: { home: 0, away: 0 },
            penalty: { home: 3, away: 4 },
          },
        }),
      ],
    });

    expect(report.rows[0]?.structuredResult).toMatchObject({
      decisionMethod: "pen",
      homeGoals: 1,
      awayGoals: 1,
      afterExtraTimeHomeGoals: 1,
      afterExtraTimeAwayGoals: 1,
      penaltyHomeGoals: 3,
      penaltyAwayGoals: 4,
      advancingTeamId: "team-away",
    });
  });

  it("maps the proven Germany vs Paraguay and Netherlands vs Morocco PEN fixtures exactly", () => {
    const snapshot = buildKnockoutSnapshot({
      matches: [
        {
          id: "match-germany-paraguay",
          external_id: "api-football:fixture:1565176",
          slug: "world-cup-2026-germany-vs-paraguay-2026-06-29",
          competition_id: "competition-1",
          season_id: "season-2026",
          home_team_id: "team-germany",
          away_team_id: "team-paraguay",
          kickoff_at: "2026-06-29T20:30:00Z",
          stage: "Round of 32",
          status: "scheduled",
          access_scope: "public",
          intake_source: "api_football",
          source_note: null,
        },
        {
          id: "match-netherlands-morocco",
          external_id: "api-football:fixture:1562345",
          slug: "world-cup-2026-netherlands-vs-morocco-2026-06-30",
          competition_id: "competition-1",
          season_id: "season-2026",
          home_team_id: "team-netherlands",
          away_team_id: "team-morocco",
          kickoff_at: "2026-06-30T01:00:00Z",
          stage: "Round of 32",
          status: "scheduled",
          access_scope: "public",
          intake_source: "api_football",
          source_note: null,
        },
      ],
      teams: [
        { id: "team-germany", name: "Germany" },
        { id: "team-paraguay", name: "Paraguay" },
        { id: "team-netherlands", name: "Netherlands" },
        { id: "team-morocco", name: "Morocco" },
      ],
    });
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      from: "2026-06-29",
      to: "2026-06-30",
    });
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T09:24:51.128Z",
      selection,
      snapshot,
      providerFixtures: [
        buildKnockoutProviderFixture({
          providerFixtureId: 1565176,
          kickoffAt: "2026-06-29T20:30:00Z",
          homeTeam: { providerTeamId: 201, name: "Germany", winner: false },
          awayTeam: { providerTeamId: 202, name: "Paraguay", winner: true },
          statusShort: "PEN",
          elapsedMinutes: 120,
          goals: { home: 1, away: 1 },
          score: {
            halftime: { home: 0, away: 1 },
            fulltime: { home: 1, away: 1 },
            extratime: { home: 0, away: 0 },
            penalty: { home: 3, away: 4 },
          },
        }),
        buildKnockoutProviderFixture({
          providerFixtureId: 1562345,
          kickoffAt: "2026-06-30T01:00:00Z",
          homeTeam: { providerTeamId: 301, name: "Netherlands", winner: false },
          awayTeam: { providerTeamId: 302, name: "Morocco", winner: true },
          statusShort: "PEN",
          elapsedMinutes: 120,
          goals: { home: 1, away: 1 },
          score: {
            halftime: { home: 0, away: 0 },
            fulltime: { home: 1, away: 1 },
            extratime: { home: 0, away: 0 },
            penalty: { home: 2, away: 3 },
          },
        }),
      ],
    });

    expect(report.rows.map((row) => row.structuredResult)).toEqual([
      {
        decisionMethod: "pen",
        homeGoals: 1,
        awayGoals: 1,
        regulationHomeGoals: 1,
        regulationAwayGoals: 1,
        afterExtraTimeHomeGoals: 1,
        afterExtraTimeAwayGoals: 1,
        penaltyHomeGoals: 3,
        penaltyAwayGoals: 4,
        advancingTeamId: "team-paraguay",
        advancingTeamName: "Paraguay",
      },
      {
        decisionMethod: "pen",
        homeGoals: 1,
        awayGoals: 1,
        regulationHomeGoals: 1,
        regulationAwayGoals: 1,
        afterExtraTimeHomeGoals: 1,
        afterExtraTimeAwayGoals: 1,
        penaltyHomeGoals: 2,
        penaltyAwayGoals: 3,
        advancingTeamId: "team-morocco",
        advancingTeamName: "Morocco",
      },
    ]);
  });

  it("fails closed on incomplete or contradictory structured knockout provider data", () => {
    const cases = [
      {
        name: "missing extra-time fields for PEN",
        fixture: buildKnockoutProviderFixture({
          statusShort: "PEN",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 101, name: "Brazil", winner: false },
          awayTeam: { providerTeamId: 102, name: "Japan", winner: true },
          goals: { home: 1, away: 1 },
          score: {
            halftime: { home: 0, away: 0 },
            fulltime: { home: 1, away: 1 },
            extratime: { home: null, away: null },
            penalty: { home: 3, away: 4 },
          },
        }),
        reason: "incomplete_pen_data_missing_extratime_score",
      },
      {
        name: "aggregate goals inconsistent with fulltime plus extratime",
        fixture: buildKnockoutProviderFixture({
          statusShort: "PEN",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 101, name: "Brazil", winner: false },
          awayTeam: { providerTeamId: 102, name: "Japan", winner: true },
          goals: { home: 2, away: 1 },
          score: {
            halftime: { home: 0, away: 0 },
            fulltime: { home: 1, away: 1 },
            extratime: { home: 0, away: 0 },
            penalty: { home: 3, away: 4 },
          },
        }),
        reason: "incomplete_pen_data_extratime_mismatch",
      },
      {
        name: "AET regulation score not drawn",
        fixture: buildKnockoutProviderFixture({
          statusShort: "AET",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 101, name: "Brazil", winner: true },
          awayTeam: { providerTeamId: 102, name: "Japan", winner: false },
          goals: { home: 2, away: 1 },
          score: {
            halftime: { home: 1, away: 0 },
            fulltime: { home: 1, away: 0 },
            extratime: { home: 1, away: 1 },
            penalty: { home: null, away: null },
          },
        }),
        reason: "aet_regulation_score_not_draw",
      },
      {
        name: "PEN regulation score not drawn",
        fixture: buildKnockoutProviderFixture({
          statusShort: "PEN",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 101, name: "Brazil", winner: false },
          awayTeam: { providerTeamId: 102, name: "Japan", winner: true },
          goals: { home: 2, away: 2 },
          score: {
            halftime: { home: 1, away: 0 },
            fulltime: { home: 2, away: 1 },
            extratime: { home: 0, away: 1 },
            penalty: { home: 3, away: 4 },
          },
        }),
        reason: "pen_regulation_score_not_draw",
      },
      {
        name: "PEN terminal football score not drawn",
        fixture: buildKnockoutProviderFixture({
          statusShort: "PEN",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 101, name: "Brazil", winner: true },
          awayTeam: { providerTeamId: 102, name: "Japan", winner: false },
          goals: { home: 2, away: 1 },
          score: {
            halftime: { home: 0, away: 0 },
            fulltime: { home: 1, away: 1 },
            extratime: { home: 1, away: 0 },
            penalty: { home: 4, away: 3 },
          },
        }),
        reason: "penalty_terminal_score_not_draw",
      },
      {
        name: "equal penalty shootout",
        fixture: buildKnockoutProviderFixture({
          statusShort: "PEN",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 101, name: "Brazil", winner: false },
          awayTeam: { providerTeamId: 102, name: "Japan", winner: true },
          goals: { home: 1, away: 1 },
          score: {
            halftime: { home: 0, away: 0 },
            fulltime: { home: 1, away: 1 },
            extratime: { home: 0, away: 0 },
            penalty: { home: 3, away: 3 },
          },
        }),
        reason: "equal_penalty_score",
      },
      {
        name: "contradictory provider winner flags",
        fixture: buildKnockoutProviderFixture({
          statusShort: "PEN",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 101, name: "Brazil", winner: true },
          awayTeam: { providerTeamId: 102, name: "Japan", winner: true },
          goals: { home: 1, away: 1 },
          score: {
            halftime: { home: 0, away: 0 },
            fulltime: { home: 1, away: 1 },
            extratime: { home: 0, away: 0 },
            penalty: { home: 3, away: 4 },
          },
        }),
        reason: "incomplete_pen_data_contradictory_winner_flags",
      },
      {
        name: "advancing team inconsistent with penalty score",
        fixture: buildKnockoutProviderFixture({
          statusShort: "PEN",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 101, name: "Brazil", winner: true },
          awayTeam: { providerTeamId: 102, name: "Japan", winner: false },
          goals: { home: 1, away: 1 },
          score: {
            halftime: { home: 0, away: 0 },
            fulltime: { home: 1, away: 1 },
            extratime: { home: 0, away: 0 },
            penalty: { home: 3, away: 4 },
          },
        }),
        reason: "reversed_winner_data",
      },
    ];

    for (const testCase of cases) {
      const snapshot = buildKnockoutSnapshot();
      const selection = buildWorldCupResultRefreshSelection(snapshot, {
        externalIds: ["api-football:fixture:1562344"],
      });
      const report = planWorldCupResultRefresh({
        generatedAt: "2026-06-30T00:00:00Z",
        selection,
        snapshot,
        providerFixtures: [testCase.fixture],
      });

      expect(report.rows[0]?.exceptionReason, testCase.name).toBe(testCase.reason);
      expect(report.rows[0]?.resultAction, testCase.name).toBe("none");
    }
  });

  it("is idempotent for an identical structured PEN result and does not overwrite a conflicting one", async () => {
    const identicalSnapshot = buildKnockoutSnapshot({
      matchResults: [
        buildStoredMatchResult({
          match_id: "match-knockout-1",
          home_goals: 1,
          away_goals: 1,
          decision_method: "pen",
          regulation_home_goals: 1,
          regulation_away_goals: 1,
          after_extra_time_home_goals: 1,
          after_extra_time_away_goals: 1,
          penalty_home_goals: 3,
          penalty_away_goals: 4,
          advancing_team_id: "team-away",
        }),
      ],
    });
    const selection = buildWorldCupResultRefreshSelection(identicalSnapshot, {
      externalIds: ["api-football:fixture:1562344"],
    });
    const providerFixtures = [
      buildKnockoutProviderFixture({
        statusShort: "PEN",
        elapsedMinutes: 120,
        homeTeam: { providerTeamId: 101, name: "Brazil", winner: false },
        awayTeam: { providerTeamId: 102, name: "Japan", winner: true },
        goals: { home: 1, away: 1 },
        score: {
          halftime: { home: 0, away: 0 },
          fulltime: { home: 1, away: 1 },
          extratime: { home: 0, away: 0 },
          penalty: { home: 3, away: 4 },
        },
      }),
    ];
    const identicalReport = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection,
      snapshot: identicalSnapshot,
      providerFixtures,
    });

    expect(identicalReport.rows[0]).toMatchObject({
      resultAction: "already_identical",
      evaluationAction: "ineligible",
    });

    const { adapter, operations } = createMemoryWriteAdapter(identicalSnapshot);
    await applyWorldCupResultRefreshPlan({
      report: identicalReport,
      snapshot: identicalSnapshot,
      providerFixtures,
      applySelection: resolveWorldCupResultRefreshApplySelection({
        selectedMatches: selection.matches,
        allowExternalIds: ["api-football:fixture:1562344"],
      }),
      providerResponseAt: "2026-06-30T01:00:00Z",
      verifiedAt: "2026-06-30T01:00:00Z",
      writeAdapter: adapter,
    });

    expect(operations.matchResultUpdates).toHaveLength(0);
    expect(operations.predictionResultInserts).toHaveLength(0);

    const conflictingSnapshot = buildKnockoutSnapshot({
      matchResults: [
        buildStoredMatchResult({
          match_id: "match-knockout-1",
          home_goals: 1,
          away_goals: 1,
          decision_method: "pen",
          regulation_home_goals: 1,
          regulation_away_goals: 1,
          after_extra_time_home_goals: 1,
          after_extra_time_away_goals: 1,
          penalty_home_goals: 5,
          penalty_away_goals: 4,
          advancing_team_id: "team-home",
        }),
      ],
    });
    const conflictingReport = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection: buildWorldCupResultRefreshSelection(conflictingSnapshot, {
        externalIds: ["api-football:fixture:1562344"],
      }),
      snapshot: conflictingSnapshot,
      providerFixtures,
    });

    expect(conflictingReport.rows[0]?.resultAction).toBe("verified_conflict");
    expect(conflictingReport.rows[0]?.conflictSummary).toContain("stored_penalties=5-4");
    expect(conflictingReport.rows[0]?.conflictSummary).toContain("provider_penalties=3-4");
  });

  it("keeps AET and PEN evaluations fail-closed and leaves Brazil vs Japan FT behavior unchanged", async () => {
    const knockoutSnapshot = buildKnockoutPredictionSnapshot();
    const knockoutSelection = buildWorldCupResultRefreshSelection(knockoutSnapshot, {
      externalIds: ["api-football:fixture:1562344"],
    });
    const knockoutFixtures = [
      buildKnockoutProviderFixture({
        statusShort: "PEN",
        elapsedMinutes: 120,
        homeTeam: { providerTeamId: 101, name: "Brazil", winner: false },
        awayTeam: { providerTeamId: 102, name: "Japan", winner: true },
        goals: { home: 1, away: 1 },
        score: {
          halftime: { home: 0, away: 0 },
          fulltime: { home: 1, away: 1 },
          extratime: { home: 0, away: 0 },
          penalty: { home: 3, away: 4 },
        },
      }),
    ];
    const knockoutReport = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection: knockoutSelection,
      snapshot: knockoutSnapshot,
      providerFixtures: knockoutFixtures,
    });
    const knockoutAdapter = createMemoryWriteAdapter(knockoutSnapshot);
    const knockoutCounts = await applyWorldCupResultRefreshPlan({
      report: knockoutReport,
      snapshot: knockoutSnapshot,
      providerFixtures: knockoutFixtures,
      applySelection: resolveWorldCupResultRefreshApplySelection({
        selectedMatches: knockoutSelection.matches,
        allowExternalIds: ["api-football:fixture:1562344"],
      }),
      providerResponseAt: "2026-06-30T01:00:00Z",
      verifiedAt: "2026-06-30T01:00:00Z",
      writeAdapter: knockoutAdapter.adapter,
    });

    expect(knockoutCounts.evaluationsCreated).toBe(0);
    expect(knockoutCounts.evaluationsUpdated).toBe(0);
    expect(knockoutCounts.evaluationsIneligible).toBe(1);
    expect(knockoutAdapter.operations.predictionResultInserts).toHaveLength(0);
    expect(knockoutAdapter.operations.predictionResultUpdates).toHaveLength(0);

    const ftSnapshot = buildKnockoutSnapshot();
    const ftSelection = buildWorldCupResultRefreshSelection(ftSnapshot, {
      externalIds: ["api-football:fixture:1562344"],
    });
    const ftReport = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection: ftSelection,
      snapshot: ftSnapshot,
      providerFixtures: [buildKnockoutProviderFixture()],
    });

    expect(ftReport.rows[0]).toMatchObject({
      trustedAutoVerifyEligible: true,
      resultAction: "create_verified",
      evaluationAction: "none",
      structuredResult: {
        decisionMethod: "ft",
        homeGoals: 2,
        awayGoals: 1,
        regulationHomeGoals: 2,
        regulationAwayGoals: 1,
      },
    });
  });
});
