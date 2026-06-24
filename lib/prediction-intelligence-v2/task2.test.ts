import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertTask2LocalOnlyPreflight,
  buildChallengerPrediction,
  buildHistoricalReplayCutoff,
  buildMatchFeatureVector,
  buildPublicSafeShadowExport,
  buildTrainingValidationHoldoutManifest,
  filterFutureFixturesByCutoff,
  renderExplanationPreview,
} from "./task2";
import type {
  CanonicalTeamLocalization,
  HistoricalMatchFact,
  RatingSnapshotRow,
  TeamSignalSnapshot,
  WorldCupScheduleMatch,
} from "./task1";
import { resolveDefaultPreparedPaths } from "./task1";

const basePaths = resolveDefaultPreparedPaths(process.cwd(), "task2-test-run");

function makeSignal(args: {
  teamKey: string;
  en: string;
  es: string;
  elo: number | null;
  fifa: number | null;
  missingOptionalSignals?: string[];
}) {
  return {
    signal_version: "test",
    cutoff_at: "2026-06-01T00:00:00Z",
    canonical_team_key: args.teamKey,
    display_name_en: args.en,
    display_name_es: args.es,
    eloAtCutoff: args.elo,
    eloResolutionMethod: args.elo == null ? "unavailable" : "latest_prior_post_match",
    eloSourceSnapshotIds: ["elo:test"],
    eloReliability: args.elo == null ? 0 : 0.9,
    fifaAtCutoff: args.fifa,
    missingOptionalSignals: args.missingOptionalSignals ?? [],
    sample_sizes: {
      last_5: 5,
      last_10: 10,
      last_20: 20,
      world_cup_current: 2,
    },
    recent_form: {
      last_5_points_per_match: 2,
      last_10_points_per_match: 1.8,
      last_20_points_per_match: 1.7,
      last_20_wins: 10,
      last_20_draws: 4,
      last_20_losses: 6,
      goals_for_per_match: 1.6,
      goals_against_per_match: 1,
      goal_difference_per_match: 0.6,
    },
    structural_strength: {
      current_elo: args.elo,
      start_2026_elo: args.elo == null ? null : args.elo - 20,
      fifa_points: args.fifa,
      fifa_rank: args.fifa == null ? null : 24,
      current_elo_rank: 12,
      elo_trend_ytd: 20,
    },
    tournament_form: {
      matches: 2,
      wins: 1,
      draws: 1,
      losses: 0,
      goals_for: 3,
      goals_against: 1,
      scoring_rate: 1,
      clean_sheet_rate: 0.5,
      average_opponent_pre_match_elo: 1750,
      over_under_performance: 0.3,
    },
    attack: {
      scoring_match_rate: 0.75,
      failed_to_score_rate: 0.2,
      two_plus_scored_rate: 0.4,
      btts_rate: 0.45,
      over_2_5_rate: 0.42,
    },
    defense: {
      clean_sheet_rate: 0.35,
      under_2_5_rate: 0.58,
      two_plus_conceded_rate: 0.2,
      official_matches: 14,
      friendly_matches: 6,
      home_matches: 4,
      away_matches: 6,
      neutral_matches: 10,
    },
    performance_vs_expectation: {
      average_opponent_pre_match_elo: 1700,
      strength_of_schedule: 1700,
      result_vs_elo_expectation: 0.12,
      volatility: 0.18,
    },
    reliability: {
      sample_reliability: 0.9,
      world_cup_sample_reliability: 0.5,
      resolved_confederation_support: 1,
    },
    diagnostic_effective_strength: {
      score: 72,
      baseline_structural_strength: 70,
      recent_opponent_adjusted_form: 66,
      tournament_current_form: 61,
      attack: 64,
      defense: 58,
      conversion_and_failed_to_score_risk: 70,
      performance_vs_expectation: 57,
      reliability: 80,
    },
    source_snapshot_ids: ["fact:test", "elo:test"],
  } satisfies TeamSignalSnapshot;
}

function makeHistoricalFact(args: {
  date: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  competition?: string;
  pre1?: number;
  pre2?: number;
  location?: string | null;
}) {
  return {
    source_snapshot_id: "fact:test",
    source_file: "test.csv",
    source_row_number: 1,
    match_date: args.date,
    date_raw: args.date,
    date_inference_note: null,
    team_1_name_raw: args.team1,
    team_2_name_raw: args.team2,
    team_1_key: args.team1,
    team_2_key: args.team2,
    score_1: args.score1,
    score_2: args.score2,
    competition_raw: args.competition ?? "Friendly",
    competition_key: args.competition ?? "friendly",
    event_location_raw: args.location ?? null,
    match_type: args.competition === "friendly" || !args.competition ? "friendly" : "official",
    elo_change_1: 10,
    elo_change_2: -10,
    post_match_elo_1: (args.pre1 ?? 1700) + 10,
    post_match_elo_2: (args.pre2 ?? 1650) - 10,
    pre_match_elo_1: args.pre1 ?? 1700,
    pre_match_elo_2: args.pre2 ?? 1650,
    rank_change_1: null,
    rank_change_2: null,
    post_match_rank_1: null,
    post_match_rank_2: null,
    pre_match_rank_1: null,
    pre_match_rank_2: null,
    natural_match_key: `${args.date}:${args.team1}:${args.team2}`,
  } satisfies HistoricalMatchFact;
}

const localizations: CanonicalTeamLocalization[] = [
  {
    canonical_team_key: "germany",
    fifa_code: "GER",
    iso_alpha3: "DEU",
    display_name_en: "Germany",
    display_name_es: "Alemania",
    elo_name_raw: null,
    translation_status: "ready",
  },
  {
    canonical_team_key: "curacao",
    fifa_code: "CUW",
    iso_alpha3: "CUW",
    display_name_en: "Curacao",
    display_name_es: "Curazao",
    elo_name_raw: null,
    translation_status: "ready",
  },
];

const eloRows: RatingSnapshotRow[] = [
  {
    source_snapshot_id: "elo:test",
    effective_date: "2026-05-20",
    canonical_team_key: "germany",
    current_rank: 8,
    elo_rating: 1890,
    raw_values: {},
  },
  {
    source_snapshot_id: "elo:test",
    effective_date: "2026-05-20",
    canonical_team_key: "curacao",
    current_rank: 55,
    elo_rating: 1590,
    raw_values: {},
  },
];

const eloStartRows: RatingSnapshotRow[] = [
  {
    source_snapshot_id: "elo:start",
    effective_date: "2026-01-01",
    canonical_team_key: "germany",
    current_rank: 10,
    elo_rating: 1870,
    raw_values: {},
  },
  {
    source_snapshot_id: "elo:start",
    effective_date: "2026-01-01",
    canonical_team_key: "curacao",
    current_rank: 57,
    elo_rating: 1570,
    raw_values: {},
  },
];

const fifaRows: RatingSnapshotRow[] = [
  {
    source_snapshot_id: "fifa:test",
    effective_date: "2026-05-15",
    canonical_team_key: "germany",
    current_rank: 9,
    fifa_points: 1788,
    raw_values: {},
  },
  {
    source_snapshot_id: "fifa:test",
    effective_date: "2026-05-15",
    canonical_team_key: "curacao",
    current_rank: 60,
    fifa_points: 1390,
    raw_values: {},
  },
];

const historicalFacts: HistoricalMatchFact[] = [
  makeHistoricalFact({ date: "2025-11-01", team1: "germany", team2: "curacao", score1: 3, score2: 0, competition: "friendly", pre1: 1865, pre2: 1575 }),
  makeHistoricalFact({ date: "2025-10-01", team1: "germany", team2: "curacao", score1: 2, score2: 1, competition: "friendly", pre1: 1860, pre2: 1580 }),
  makeHistoricalFact({ date: "2026-03-01", team1: "germany", team2: "curacao", score1: 1, score2: 0, competition: "world_cup_qualifier", pre1: 1880, pre2: 1585 }),
  makeHistoricalFact({ date: "2026-05-20", team1: "germany", team2: "curacao", score1: 2, score2: 0, competition: "world_cup", pre1: 1885, pre2: 1590 }),
  makeHistoricalFact({ date: "2026-05-25", team1: "curacao", team2: "germany", score1: 1, score2: 1, competition: "world_cup", pre1: 1592, pre2: 1888 }),
];

const scheduleRows: WorldCupScheduleMatch[] = [
  {
    official_match_number: 1,
    stage_key: "group_stage",
    group_key: "A",
    home_slot: "A1",
    away_slot: "A2",
    home_team_key: "germany",
    away_team_key: "curacao",
    scheduled_date_et: "2026-06-14",
    published_time_et: "15:00",
    published_timezone: "ET",
    scheduled_at_utc: "2026-06-14T17:00:00Z",
    host_city_key: "city",
    venue_key: "venue",
    venue_common_name: "Venue",
    venue_fifa_name: "Venue",
    country_code: "US",
    source_snapshot_id: "schedule:test",
  },
];

const baseHomeSignal = makeSignal({
  teamKey: "germany",
  en: "Germany",
  es: "Alemania",
  elo: 1890,
  fifa: 1788,
});

const baseAwaySignal = makeSignal({
  teamKey: "curacao",
  en: "Curacao",
  es: "Curazao",
  elo: 1590,
  fifa: 1390,
  missingOptionalSignals: ["market_context"],
});

describe("prediction intelligence v2 task2", () => {
  it("keeps validation rows before the frozen holdout window", () => {
    const manifest = buildTrainingValidationHoldoutManifest({
      historicalFacts: [
        makeHistoricalFact({ date: "2025-09-01", team1: "germany", team2: "curacao", score1: 1, score2: 0 }),
        makeHistoricalFact({ date: "2026-06-10", team1: "germany", team2: "curacao", score1: 1, score2: 0, competition: "world_cup_qualifier" }),
        makeHistoricalFact({ date: "2026-06-12", team1: "germany", team2: "curacao", score1: 7, score2: 1, competition: "world_cup" }),
      ],
      holdoutRows: [
        {
          fixtureId: "holdout",
          productMatchId: "match-1",
          officialMatchNumber: 10,
          apiFootballFixtureId: 100,
          kickoffAt: "2026-06-14T17:00:00Z",
          homeTeamKey: "germany",
          awayTeamKey: "curacao",
          homeNameEn: "Germany",
          awayNameEn: "Curacao",
          homeNameEs: "Alemania",
          awayNameEs: "Curazao",
          sourceSnapshotIds: ["x"],
          homeSignal: baseHomeSignal,
          awaySignal: baseAwaySignal,
          actual: { homeGoals: 7, awayGoals: 1, score: "7-1", outcome: "home" },
          originalPrediction: {} as never,
          originalMarkets: [],
        },
      ],
      scheduleRows,
    });

    expect(manifest.training.rowCount).toBe(1);
    expect(manifest.validation.rowCount).toBe(1);
    expect(manifest.validation.rows.every((row) => row.cutoffAt < "2026-06-11T00:00:00Z")).toBe(true);
    expect(manifest.validation.rows.some((row) => row.matchDate === "2026-06-12")).toBe(false);
    expect(manifest.holdout.rowCount).toBe(1);
  });

  it("uses conservative start-of-day cutoffs when a historical fixture lacks exact kickoff time", () => {
    const cutoff = buildHistoricalReplayCutoff(
      makeHistoricalFact({ date: "2026-03-01", team1: "germany", team2: "curacao", score1: 1, score2: 0 }),
      [],
    );

    expect(cutoff.datePrecision).toBe("date");
    expect(cutoff.cutoffAt).toBe("2026-03-01T00:00:00Z");
  });

  it("builds deterministic challenger output with normalized probabilities and bounded xG", () => {
    const features = buildMatchFeatureVector({
      fixtureId: "germany-vs-curacao",
      cutoffAt: "2026-06-14T17:00:00Z",
      homeTeamKey: "germany",
      awayTeamKey: "curacao",
      homeSignal: baseHomeSignal,
      awaySignal: baseAwaySignal,
      historicalFacts,
      localizations,
      eloCurrent: eloRows,
      eloStart2026: eloStartRows,
      fifaRanking: fifaRows,
      scheduleRows,
    });

    const first = buildChallengerPrediction({
      candidate: {
        key: "test",
        label: "Test",
        calibrationVersion: "v1",
        effectiveStrengthWeights: { structural: 0.3, recentForm: 0.2, tournamentForm: 0.15, attack: 0.12, defense: 0.1, expectation: 0.08, reliability: 0.05 },
        expectedGoalDifference: { structuralGap: 1, recentGap: 0.6, tournamentGap: 0.4, attackDefenseGap: 0.5, expectationGap: 0.4, reliabilityTilt: 0.15 },
        expectedTotalGoals: { base: 2.4, combinedAttack: 0.6, combinedDefense: 0.18, combinedOpenPlay: 0.5, combinedTournamentOpenPlay: 0.2, favoriteControl: -0.1, reliabilityDrag: -0.14 },
        drawLift: 0.01,
        maxGoals: 8,
      },
      features,
    });
    const second = buildChallengerPrediction({
      candidate: {
        key: "test",
        label: "Test",
        calibrationVersion: "v1",
        effectiveStrengthWeights: { structural: 0.3, recentForm: 0.2, tournamentForm: 0.15, attack: 0.12, defense: 0.1, expectation: 0.08, reliability: 0.05 },
        expectedGoalDifference: { structuralGap: 1, recentGap: 0.6, tournamentGap: 0.4, attackDefenseGap: 0.5, expectationGap: 0.4, reliabilityTilt: 0.15 },
        expectedTotalGoals: { base: 2.4, combinedAttack: 0.6, combinedDefense: 0.18, combinedOpenPlay: 0.5, combinedTournamentOpenPlay: 0.2, favoriteControl: -0.1, reliabilityDrag: -0.14 },
        drawLift: 0.01,
        maxGoals: 8,
      },
      features,
    });

    const oneXTwoSum = first.probabilities.oneXTwo.homeWin + first.probabilities.oneXTwo.draw + first.probabilities.oneXTwo.awayWin;
    const matrixSum = first.scoreMatrix.reduce((total, entry) => total + entry.probability, 0);

    expect(second).toEqual(first);
    expect(Math.abs(oneXTwoSum - 1)).toBeLessThan(0.001);
    expect(Math.abs(matrixSum - 1)).toBeLessThan(0.001);
    expect(first.scoreMatrixTailMass).toBeLessThan(0.02);
    expect(first.expectedGoals.home).toBeGreaterThanOrEqual(0.2);
    expect(first.expectedGoals.away).toBeGreaterThanOrEqual(0.2);
    expect(first.expectedGoals.home).toBeLessThanOrEqual(3.8);
    expect(first.expectedGoals.away).toBeLessThanOrEqual(3.8);
    expect(first.scenarios.map((scenario) => scenario.familyCode)).toEqual([...new Set(first.scenarios.map((scenario) => scenario.familyCode))]);
    expect(first.scenarios.some((scenario) => scenario.familyCode.includes("favorite"))).toBe(true);
    expect(first.evidenceBundle.reasonCodes).toContain("partial_optional_signal_coverage");
  });

  it("renders deterministic Spanish and English explanation previews with localized names", () => {
    const previewEs = renderExplanationPreview({
      locale: "es",
      homeName: "Alemania",
      awayName: "Curazao",
      scenarios: [
        {
          scenarioType: "main",
          familyCode: "favorite_clear_win",
          representativeScore: { home: 2, away: 0 },
          exactScoreProbability: 0.12,
          familyProbability: 0.34,
          supportingReasonCodes: ["home_structural_edge"],
          contradictingReasonCodes: ["balanced_recent_form"],
          requiredMatchScriptCodes: ["favorite_control"],
          riskLevel: "low",
          reliability: 0.8,
          relatedScorelines: [],
        },
      ],
    });
    const previewEn = renderExplanationPreview({
      locale: "en",
      homeName: "Germany",
      awayName: "Curacao",
      scenarios: [
        {
          scenarioType: "main",
          familyCode: "low_scoring_draw",
          representativeScore: { home: 1, away: 1 },
          exactScoreProbability: 0.1,
          familyProbability: 0.24,
          supportingReasonCodes: ["low_total_profile"],
          contradictingReasonCodes: [],
          requiredMatchScriptCodes: ["few_big_chances"],
          riskLevel: "medium",
          reliability: 0.7,
          relatedScorelines: [],
        },
      ],
    });

    expect(previewEs.summary).toContain("Alemania");
    expect(previewEs.summary).toContain("Curazao");
    expect(previewEs.scenarioLines[0]).toContain("victoria clara del favorito");
    expect(previewEn.scenarioLines[0]).toContain("low-scoring draw");
  });

  it("filters future fixtures strictly after the generation cutoff", () => {
    const filtered = filterFutureFixturesByCutoff(
      [
        { kickoffAt: "2026-06-20T23:59:59Z", id: "old" },
        { kickoffAt: "2026-06-21T00:00:00Z", id: "same" },
        { kickoffAt: "2026-06-21T00:00:01Z", id: "future" },
      ],
      "2026-06-21T00:00:00Z",
    );

    expect(filtered.map((entry) => entry.id)).toEqual(["future"]);
  });

  it("builds a public-safe shadow export without evidence or weight internals", () => {
    const exportPayload = buildPublicSafeShadowExport({
      fixtures: [
        {
          productMatchId: "match-1",
          apiFootballFixtureId: 10,
          officialMatchNumber: 1,
          kickoffAt: "2026-06-21T17:00:00Z",
          homeTeamKey: "germany",
          awayTeamKey: "curacao",
          homeNameEn: "Germany",
          awayNameEn: "Curacao",
          homeNameEs: "Alemania",
          awayNameEs: "Curazao",
          prediction: {
            modelVersion: "test",
            candidateKey: "test",
            cutoffAt: "2026-06-21T00:00:00Z",
            expectedGoals: { home: 1.8, away: 0.7, total: 2.5, difference: 1.1 },
            probabilities: {
              oneXTwo: { homeWin: 0.58, draw: 0.24, awayWin: 0.18 },
              btts: { yes: 0.43, no: 0.57 },
              overUnder25: { over: 0.49, under: 0.51 },
            },
            scoreMatrix: [],
            scoreMatrixTailMass: 0.01,
            topScorelines: [],
            mostLikelyScore: "2-0",
            confidence: 67,
            riskLevel: "low",
            scenarios: [
              {
                scenarioType: "main",
                familyCode: "favorite_clear_win",
                representativeScore: { home: 2, away: 0 },
                exactScoreProbability: 0.12,
                familyProbability: 0.34,
                supportingReasonCodes: ["home_structural_edge"],
                contradictingReasonCodes: [],
                requiredMatchScriptCodes: ["favorite_control"],
                riskLevel: "low",
                reliability: 0.8,
                relatedScorelines: [],
              },
            ],
            additionalPlausibleScorelines: [],
            evidenceBundle: {
              homeSubScores: { baselineStrength: 0.8, recentForm: 0.7, tournamentForm: 0.6, attack: 0.7, defense: 0.6, performanceVsExpectation: 0.58, reliability: 0.8 },
              awaySubScores: { baselineStrength: 0.4, recentForm: 0.45, tournamentForm: 0.42, attack: 0.4, defense: 0.38, performanceVsExpectation: 0.44, reliability: 0.72 },
              reasonCodes: [],
              contradictingReasonCodes: [],
              sourceSnapshotIds: [],
            },
            explanationPreviews: {
              en: { locale: "en", summary: "x", scenarioLines: [], reasonLines: [] },
              es: { locale: "es", summary: "x", scenarioLines: [], reasonLines: [] },
            },
          },
        },
      ],
    });

    const fixture = exportPayload.fixtures[0] as Record<string, unknown>;
    expect(exportPayload.schemaVersion).toBe("torneo-mundialista-shadow-export-v2");
    expect(fixture.prediction).toBeDefined();
    expect(fixture).not.toHaveProperty("evidenceBundle");
    expect(JSON.stringify(exportPayload)).not.toContain("effectiveStrengthWeights");
  });

  it("refuses to overwrite the preserved 2026-06-21 task2 historical artifact path", () => {
    expect(() =>
      assertTask2LocalOnlyPreflight({
        ...basePaths,
        artifactsDir: path.join(process.cwd(), "artifacts", "prediction-intelligence-v2", "task2", "2026-06-21"),
        artifactDate: "2026-06-21",
        generationCutoff: "2026-06-21T00:00:00Z",
        historicalReferenceDir: path.join(process.cwd(), "artifacts", "prediction-intelligence-v2", "task1-1", "2026-06-21"),
        historicalTask2ReferenceDir: path.join(process.cwd(), "artifacts", "prediction-intelligence-v2", "task2", "2026-06-21"),
      }),
    ).toThrow(/preserved historical evidence path/i);
  });
});
