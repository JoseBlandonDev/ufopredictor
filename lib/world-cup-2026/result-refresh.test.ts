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
    ...overrides,
  };
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
      matchResults: [
        {
          id: "result-1",
          match_id: "match-1",
          home_goals: 1,
          away_goals: 0,
          verification_status: "verified",
          intake_source: "api_football",
          source_note: "manual verified",
          reviewed_at: "2026-06-16T21:00:00Z",
          reviewed_by: null,
          recorded_at: "2026-06-16T20:59:00Z",
        },
      ],
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
  });

  it("keeps unsupported terminal group-stage states in pending review instead of auto-verifying", () => {
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

  it("does not persist a PEN knockout fixture as an ordinary draw", async () => {
    const snapshot = buildKnockoutSnapshot();
    const selection = buildWorldCupResultRefreshSelection(snapshot, {
      externalIds: ["api-football:fixture:1562344"],
    });
    const providerFixtures = [
      buildKnockoutProviderFixture({
        statusShort: "PEN",
        elapsedMinutes: 120,
        homeTeam: { providerTeamId: 101, name: "Brazil", winner: true },
        awayTeam: { providerTeamId: 102, name: "Japan", winner: false },
        goals: { home: 1, away: 1 },
      }),
    ];
    const report = planWorldCupResultRefresh({
      generatedAt: "2026-06-30T00:00:00Z",
      selection,
      snapshot,
      providerFixtures,
    });

    expect(report.rows[0]).toMatchObject({
      trustedAutoVerifyEligible: false,
      resultAction: "none",
      evaluationAction: "none",
      exceptionReason: "unsupported_penalty_semantics",
    });

    const { adapter, operations } = createMemoryWriteAdapter(snapshot);
    const applySelection = resolveWorldCupResultRefreshApplySelection({
      selectedMatches: selection.matches,
      allowExternalIds: ["api-football:fixture:1562344"],
    });

    const counts = await applyWorldCupResultRefreshPlan({
      report,
      snapshot,
      providerFixtures,
      applySelection,
      providerResponseAt: "2026-06-30T01:00:00Z",
      verifiedAt: "2026-06-30T01:00:00Z",
      writeAdapter: adapter,
    });

    expect(counts.resultsCreated).toBe(0);
    expect(counts.resultsUpdated).toBe(0);
    expect(operations.matchResultInserts).toHaveLength(0);
    expect(operations.matchResultUpdates).toHaveLength(0);
  });

  it("keeps the current active-state contract for future and expired knockout entitlements by failing closed on unsupported score semantics", () => {
    const snapshot = buildKnockoutSnapshot({
      matches: [
        {
          id: "match-brazil-japan",
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
        {
          id: "match-ivorycoast-norway",
          external_id: "api-football:fixture:1564789",
          slug: "world-cup-2026-ivory-coast-vs-norway-2026-06-30",
          competition_id: "competition-1",
          season_id: "season-2026",
          home_team_id: "team-ivory-coast",
          away_team_id: "team-norway",
          kickoff_at: "2026-06-30T17:00:00Z",
          stage: "Round of 32",
          status: "scheduled",
          access_scope: "public",
          intake_source: "api_football",
          source_note: null,
        },
        {
          id: "match-france-sweden",
          external_id: "api-football:fixture:1565177",
          slug: "world-cup-2026-france-vs-sweden-2026-06-30",
          competition_id: "competition-1",
          season_id: "season-2026",
          home_team_id: "team-france",
          away_team_id: "team-sweden",
          kickoff_at: "2026-06-30T21:00:00Z",
          stage: "Round of 32",
          status: "scheduled",
          access_scope: "public",
          intake_source: "api_football",
          source_note: null,
        },
      ],
      teams: [
        { id: "team-home", name: "Brazil" },
        { id: "team-away", name: "Japan" },
        { id: "team-germany", name: "Germany" },
        { id: "team-paraguay", name: "Paraguay" },
        { id: "team-netherlands", name: "Netherlands" },
        { id: "team-morocco", name: "Morocco" },
        { id: "team-ivory-coast", name: "Ivory Coast" },
        { id: "team-norway", name: "Norway" },
        { id: "team-france", name: "France" },
        { id: "team-sweden", name: "Sweden" },
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
        buildKnockoutProviderFixture(),
        {
          ...buildKnockoutProviderFixture(),
          providerFixtureId: 1565176,
          kickoffAt: "2026-06-29T20:30:00Z",
          statusShort: "PEN",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 201, name: "Germany", winner: true },
          awayTeam: { providerTeamId: 202, name: "Paraguay", winner: false },
          goals: { home: 1, away: 1 },
        },
        {
          ...buildKnockoutProviderFixture(),
          providerFixtureId: 1562345,
          kickoffAt: "2026-06-30T01:00:00Z",
          statusShort: "PEN",
          elapsedMinutes: 120,
          homeTeam: { providerTeamId: 301, name: "Netherlands", winner: true },
          awayTeam: { providerTeamId: 302, name: "Morocco", winner: false },
          goals: { home: 1, away: 1 },
        },
        {
          ...buildKnockoutProviderFixture(),
          providerFixtureId: 1564789,
          kickoffAt: "2026-06-30T17:00:00Z",
          status: "scheduled",
          statusShort: "NS",
          elapsedMinutes: null,
          homeTeam: { providerTeamId: 401, name: "Ivory Coast", winner: null },
          awayTeam: { providerTeamId: 402, name: "Norway", winner: null },
          goals: { home: null, away: null },
        },
        {
          ...buildKnockoutProviderFixture(),
          providerFixtureId: 1565177,
          kickoffAt: "2026-06-30T21:00:00Z",
          status: "scheduled",
          statusShort: "NS",
          elapsedMinutes: null,
          homeTeam: { providerTeamId: 501, name: "France", winner: null },
          awayTeam: { providerTeamId: 502, name: "Sweden", winner: null },
          goals: { home: null, away: null },
        },
      ],
    });

    expect(report.summary.selectedFixtures).toBe(5);
    expect(report.summary.providerTerminalResults).toBe(3);
    expect(report.summary.resultsCreated).toBe(1);
    expect(report.summary.resultsVerified).toBe(1);
    expect(report.summary.exceptionsOrConflicts).toBe(2);
    expect(report.rows.map((row) => ({
      externalId: row.externalId,
      resultAction: row.resultAction,
      exceptionReason: row.exceptionReason,
      conflictSummary: row.conflictSummary,
      nextStoredStatus: row.nextStoredStatus,
    }))).toEqual([
      {
        externalId: "api-football:fixture:1562344",
        resultAction: "create_verified",
        exceptionReason: null,
        conflictSummary: null,
        nextStoredStatus: "finished",
      },
      {
        externalId: "api-football:fixture:1565176",
        resultAction: "none",
        exceptionReason: "unsupported_penalty_semantics",
        conflictSummary: null,
        nextStoredStatus: "finished",
      },
      {
        externalId: "api-football:fixture:1562345",
        resultAction: "none",
        exceptionReason: "unsupported_penalty_semantics",
        conflictSummary: null,
        nextStoredStatus: "finished",
      },
      {
        externalId: "api-football:fixture:1564789",
        resultAction: "none",
        exceptionReason: null,
        conflictSummary: null,
        nextStoredStatus: "scheduled",
      },
      {
        externalId: "api-football:fixture:1565177",
        resultAction: "none",
        exceptionReason: null,
        conflictSummary: null,
        nextStoredStatus: "scheduled",
      },
    ]);
  });
});
