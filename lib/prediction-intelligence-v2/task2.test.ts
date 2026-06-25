import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  TASK2_1_CANDIDATES,
  assertTask2LocalOnlyPreflight,
  buildChallengerPrediction,
  buildExpandedCalibrationManifest,
  buildHistoricalReplayCutoff,
  buildMatchFeatureVector,
  buildPublicSafeShadowExport,
  buildTrainingValidationHoldoutManifest,
  buildValidationSelectionAudit,
  evaluateScenarioRows,
  filterFutureFixturesByCutoff,
  parseOriginalPrediction,
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
  reliability?: number;
  sampleSize?: number;
  missingOptionalSignals?: string[];
}) {
  const sampleSize = args.sampleSize ?? 6;
  return {
    signal_version: "test",
    cutoff_at: "2026-06-01T00:00:00Z",
    canonical_team_key: args.teamKey,
    display_name_en: args.en,
    display_name_es: args.es,
    eloAtCutoff: args.elo,
    eloResolutionMethod: args.elo == null ? "unavailable" : "latest_prior_post_match",
    eloSourceSnapshotIds: ["elo:test"],
    eloReliability: args.reliability ?? 0.8,
    fifaAtCutoff: args.fifa,
    missingOptionalSignals: args.missingOptionalSignals ?? [],
    sample_sizes: {
      last_5: Math.min(sampleSize, 5),
      last_10: Math.min(sampleSize, 10),
      last_20: sampleSize,
      world_cup_current: 1,
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
      matches: 1,
      wins: 1,
      draws: 0,
      losses: 0,
      goals_for: 2,
      goals_against: 0,
      scoring_rate: 1,
      clean_sheet_rate: 1,
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
      sample_reliability: args.reliability ?? 0.8,
      world_cup_sample_reliability: 0.33,
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
  naturalKey?: string;
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
    natural_match_key: args.naturalKey ?? `${args.date}:${args.team1}:${args.team2}`,
  } satisfies HistoricalMatchFact;
}

const localizations: CanonicalTeamLocalization[] = [
  { canonical_team_key: "germany", fifa_code: "GER", iso_alpha3: "DEU", display_name_en: "Germany", display_name_es: "Alemania", elo_name_raw: null, translation_status: "ready" },
  { canonical_team_key: "ivory_coast", fifa_code: "CIV", iso_alpha3: "CIV", display_name_en: "Ivory Coast", display_name_es: "Costa de Marfil", elo_name_raw: null, translation_status: "ready" },
  { canonical_team_key: "curacao", fifa_code: "CUW", iso_alpha3: "CUW", display_name_en: "Curacao", display_name_es: "Curazao", elo_name_raw: null, translation_status: "ready" },
  { canonical_team_key: "argentina", fifa_code: "ARG", iso_alpha3: "ARG", display_name_en: "Argentina", display_name_es: "Argentina", elo_name_raw: null, translation_status: "ready" },
  { canonical_team_key: "austria", fifa_code: "AUT", iso_alpha3: "AUT", display_name_en: "Austria", display_name_es: "Austria", elo_name_raw: null, translation_status: "ready" },
  { canonical_team_key: "mexico", fifa_code: "MEX", iso_alpha3: "MEX", display_name_en: "Mexico", display_name_es: "Mexico", elo_name_raw: null, translation_status: "ready" },
  { canonical_team_key: "united_states", fifa_code: "USA", iso_alpha3: "USA", display_name_en: "United States", display_name_es: "Estados Unidos", elo_name_raw: null, translation_status: "ready" },
  { canonical_team_key: "canada", fifa_code: "CAN", iso_alpha3: "CAN", display_name_en: "Canada", display_name_es: "Canada", elo_name_raw: null, translation_status: "ready" },
  { canonical_team_key: "bolivia", fifa_code: "BOL", iso_alpha3: "BOL", display_name_en: "Bolivia", display_name_es: "Bolivia", elo_name_raw: null, translation_status: "ready" },
];

const eloRows: RatingSnapshotRow[] = [
  { source_snapshot_id: "elo:test", effective_date: "2026-05-19", canonical_team_key: "germany", current_rank: 8, elo_rating: 1880, raw_values: {} },
  { source_snapshot_id: "elo:test", effective_date: "2026-05-20", canonical_team_key: "germany", current_rank: 8, elo_rating: 2000, raw_values: {} },
  { source_snapshot_id: "elo:test", effective_date: "2026-05-19", canonical_team_key: "curacao", current_rank: 55, elo_rating: 1590, raw_values: {} },
  { source_snapshot_id: "elo:test", effective_date: "2026-05-20", canonical_team_key: "curacao", current_rank: 55, elo_rating: 1700, raw_values: {} },
  { source_snapshot_id: "elo:test", effective_date: "2026-05-19", canonical_team_key: "ivory_coast", current_rank: 32, elo_rating: 1710, raw_values: {} },
  { source_snapshot_id: "elo:test", effective_date: "2026-05-19", canonical_team_key: "argentina", current_rank: 3, elo_rating: 1940, raw_values: {} },
  { source_snapshot_id: "elo:test", effective_date: "2026-05-19", canonical_team_key: "austria", current_rank: 23, elo_rating: 1760, raw_values: {} },
  { source_snapshot_id: "elo:test", effective_date: "2026-05-19", canonical_team_key: "mexico", current_rank: 17, elo_rating: 1810, raw_values: {} },
  { source_snapshot_id: "elo:test", effective_date: "2026-05-19", canonical_team_key: "united_states", current_rank: 18, elo_rating: 1805, raw_values: {} },
  { source_snapshot_id: "elo:test", effective_date: "2026-05-19", canonical_team_key: "canada", current_rank: 22, elo_rating: 1775, raw_values: {} },
];

const eloStartRows: RatingSnapshotRow[] = [
  { source_snapshot_id: "elo:start", effective_date: "2026-01-01", canonical_team_key: "germany", current_rank: 10, elo_rating: 1870, raw_values: {} },
  { source_snapshot_id: "elo:start", effective_date: "2026-01-01", canonical_team_key: "curacao", current_rank: 57, elo_rating: 1570, raw_values: {} },
  { source_snapshot_id: "elo:start", effective_date: "2026-01-01", canonical_team_key: "ivory_coast", current_rank: 34, elo_rating: 1700, raw_values: {} },
  { source_snapshot_id: "elo:start", effective_date: "2026-01-01", canonical_team_key: "argentina", current_rank: 4, elo_rating: 1930, raw_values: {} },
  { source_snapshot_id: "elo:start", effective_date: "2026-01-01", canonical_team_key: "austria", current_rank: 24, elo_rating: 1750, raw_values: {} },
  { source_snapshot_id: "elo:start", effective_date: "2026-01-01", canonical_team_key: "mexico", current_rank: 19, elo_rating: 1795, raw_values: {} },
  { source_snapshot_id: "elo:start", effective_date: "2026-01-01", canonical_team_key: "united_states", current_rank: 20, elo_rating: 1790, raw_values: {} },
  { source_snapshot_id: "elo:start", effective_date: "2026-01-01", canonical_team_key: "canada", current_rank: 24, elo_rating: 1760, raw_values: {} },
];

const fifaRows: RatingSnapshotRow[] = [
  { source_snapshot_id: "fifa:test", effective_date: "2026-05-19", canonical_team_key: "germany", current_rank: 9, fifa_points: 1788, raw_values: {} },
  { source_snapshot_id: "fifa:test", effective_date: "2026-05-20", canonical_team_key: "germany", current_rank: 1, fifa_points: 1999, raw_values: {} },
  { source_snapshot_id: "fifa:test", effective_date: "2026-05-19", canonical_team_key: "curacao", current_rank: 60, fifa_points: 1390, raw_values: {} },
  { source_snapshot_id: "fifa:test", effective_date: "2026-05-20", canonical_team_key: "curacao", current_rank: 2, fifa_points: 1888, raw_values: {} },
  { source_snapshot_id: "fifa:test", effective_date: "2026-05-19", canonical_team_key: "ivory_coast", current_rank: 40, fifa_points: 1600, raw_values: {} },
  { source_snapshot_id: "fifa:test", effective_date: "2026-05-19", canonical_team_key: "argentina", current_rank: 2, fifa_points: 1860, raw_values: {} },
  { source_snapshot_id: "fifa:test", effective_date: "2026-05-19", canonical_team_key: "austria", current_rank: 25, fifa_points: 1650, raw_values: {} },
  { source_snapshot_id: "fifa:test", effective_date: "2026-05-19", canonical_team_key: "mexico", current_rank: 18, fifa_points: 1710, raw_values: {} },
  { source_snapshot_id: "fifa:test", effective_date: "2026-05-19", canonical_team_key: "united_states", current_rank: 19, fifa_points: 1700, raw_values: {} },
  { source_snapshot_id: "fifa:test", effective_date: "2026-05-19", canonical_team_key: "canada", current_rank: 28, fifa_points: 1630, raw_values: {} },
];

const historicalFacts: HistoricalMatchFact[] = [
  makeHistoricalFact({ date: "2025-01-01", team1: "bolivia", team2: "curacao", score1: 1, score2: 1, pre1: 1600, pre2: 1550 }),
  makeHistoricalFact({ date: "2025-01-05", team1: "germany", team2: "curacao", score1: 2, score2: 0, pre1: 1850, pre2: 1560 }),
  makeHistoricalFact({ date: "2025-02-05", team1: "curacao", team2: "germany", score1: 1, score2: 1, pre1: 1565, pre2: 1855 }),
  makeHistoricalFact({ date: "2025-03-05", team1: "bolivia", team2: "germany", score1: 0, score2: 2, pre1: 1610, pre2: 1860 }),
  makeHistoricalFact({ date: "2025-04-05", team1: "germany", team2: "ivory_coast", score1: 1, score2: 0, competition: "world_cup_qualifier", pre1: 1860, pre2: 1700 }),
  makeHistoricalFact({ date: "2026-03-01", team1: "germany", team2: "curacao", score1: 1, score2: 0, competition: "world_cup_qualifier", pre1: 1880, pre2: 1585 }),
  makeHistoricalFact({ date: "2026-05-20", team1: "germany", team2: "curacao", score1: 2, score2: 0, competition: "world_cup", pre1: 1885, pre2: 1590 }),
  makeHistoricalFact({ date: "2026-05-25", team1: "curacao", team2: "germany", score1: 1, score2: 1, competition: "world_cup", pre1: 1592, pre2: 1888 }),
];

const scheduleRows: WorldCupScheduleMatch[] = [
  { official_match_number: 1, stage_key: "group_stage", group_key: "A", home_slot: "A1", away_slot: "A2", home_team_key: "germany", away_team_key: "ivory_coast", scheduled_date_et: "2026-06-14", published_time_et: "15:00", published_timezone: "ET", scheduled_at_utc: "2026-06-14T17:00:00Z", host_city_key: "new_york", venue_key: "metlife", venue_common_name: "MetLife", venue_fifa_name: "MetLife", country_code: "USA", source_snapshot_id: "schedule:test" },
  { official_match_number: 2, stage_key: "group_stage", group_key: "A", home_slot: "A1", away_slot: "A2", home_team_key: "argentina", away_team_key: "austria", scheduled_date_et: "2026-06-15", published_time_et: "15:00", published_timezone: "ET", scheduled_at_utc: "2026-06-15T17:00:00Z", host_city_key: "toronto", venue_key: "bmo", venue_common_name: "BMO", venue_fifa_name: "BMO", country_code: "CAN", source_snapshot_id: "schedule:test" },
  { official_match_number: 3, stage_key: "group_stage", group_key: "A", home_slot: "A1", away_slot: "A2", home_team_key: "mexico", away_team_key: "canada", scheduled_date_et: "2026-06-16", published_time_et: "15:00", published_timezone: "ET", scheduled_at_utc: "2026-06-16T17:00:00Z", host_city_key: "mexico_city", venue_key: "azteca", venue_common_name: "Azteca", venue_fifa_name: "Azteca", country_code: "MEX", source_snapshot_id: "schedule:test" },
  { official_match_number: 4, stage_key: "group_stage", group_key: "A", home_slot: "A1", away_slot: "A2", home_team_key: "united_states", away_team_key: "mexico", scheduled_date_et: "2026-06-17", published_time_et: "15:00", published_timezone: "ET", scheduled_at_utc: "2026-06-17T17:00:00Z", host_city_key: "los_angeles", venue_key: "sofi", venue_common_name: "SoFi", venue_fifa_name: "SoFi", country_code: "USA", source_snapshot_id: "schedule:test" },
];

const baseHomeSignal = makeSignal({ teamKey: "germany", en: "Germany", es: "Alemania", elo: 1890, fifa: 1788 });
const baseAwaySignal = makeSignal({ teamKey: "curacao", en: "Curacao", es: "Curazao", elo: 1590, fifa: 1390, missingOptionalSignals: ["market_context"] });

describe("prediction intelligence v2 task2", () => {
  it("expands recoverable historical calibration rows beyond the World Cup team-only subset", () => {
    const holdoutRows = [
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
        actual: { homeGoals: 7, awayGoals: 1, score: "7-1", outcome: "home" as const },
        originalPrediction: {} as never,
        originalMarkets: [],
      },
    ];

    const expanded = buildExpandedCalibrationManifest({
      historicalFacts,
      holdoutRows,
      scheduleRows,
      localizations,
    });

    expect(expanded.splitManifest.training.rowCount).toBeGreaterThan(1);
    expect(expanded.splitManifest.training.teamsCovered).toContain("bolivia");
    expect(expanded.audit.reasonCounts.insufficient_prior_history).toBeGreaterThanOrEqual(1);
    expect(expanded.splitManifest.validation.rows.every((row) => row.cutoffAt < "2026-06-11T00:00:00Z")).toBe(true);
  });

  it("keeps conservative start-of-day cutoffs when a historical fixture lacks exact kickoff time", () => {
    const cutoff = buildHistoricalReplayCutoff(
      makeHistoricalFact({ date: "2026-03-01", team1: "germany", team2: "curacao", score1: 1, score2: 0 }),
      [],
    );

    expect(cutoff.datePrecision).toBe("date");
    expect(cutoff.cutoffAt).toBe("2026-03-01T00:00:00Z");
  });

  it("prevents same-day date-only Elo and FIFA snapshots from leaking into pre-match features", () => {
    const signalWithoutLiveRatings = makeSignal({
      teamKey: "germany",
      en: "Germany",
      es: "Alemania",
      elo: null,
      fifa: null,
      sampleSize: 6,
      reliability: 0.5,
    });
    const awayWithoutLiveRatings = makeSignal({
      teamKey: "curacao",
      en: "Curacao",
      es: "Curazao",
      elo: null,
      fifa: null,
      sampleSize: 6,
      reliability: 0.5,
    });

    const features = buildMatchFeatureVector({
      fixtureId: "germany-vs-curacao",
      cutoffAt: "2026-05-20T17:00:00Z",
      homeTeamKey: "germany",
      awayTeamKey: "curacao",
      homeSignal: signalWithoutLiveRatings,
      awaySignal: awayWithoutLiveRatings,
      historicalFacts,
      localizations,
      eloCurrent: eloRows,
      eloStart2026: eloStartRows,
      fifaRanking: fifaRows,
      scheduleRows,
    });

    expect(features.home.structuralStrength.fifaPoints).toBe(1788);
    expect(features.home.structuralStrength.eloRank).toBe(2);
    expect(features.away.structuralStrength.fifaPoints).toBe(1390);
  });

  it("keeps FIFA optional for older historical rows", () => {
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
      fifaRanking: [],
      scheduleRows,
    });

    expect(features.home.structuralStrength.fifaPoints).toBe(1788);
    expect(features.away.structuralStrength.fifaPoints).toBe(1390);
  });

  it("treats World Cup fixtures as neutral unless a host nation is playing in its own country", () => {
    const neutralGermany = buildMatchFeatureVector({
      fixtureId: "germany-vs-ivory_coast",
      cutoffAt: "2026-06-14T17:00:00Z",
      homeTeamKey: "germany",
      awayTeamKey: "ivory_coast",
      officialMatchNumber: 1,
      homeSignal: baseHomeSignal,
      awaySignal: makeSignal({ teamKey: "ivory_coast", en: "Ivory Coast", es: "Costa de Marfil", elo: 1710, fifa: 1600 }),
      historicalFacts,
      localizations,
      eloCurrent: eloRows,
      eloStart2026: eloStartRows,
      fifaRanking: fifaRows,
      scheduleRows,
    });
    const neutralArgentina = buildMatchFeatureVector({
      fixtureId: "argentina-vs-austria",
      cutoffAt: "2026-06-15T17:00:00Z",
      homeTeamKey: "argentina",
      awayTeamKey: "austria",
      officialMatchNumber: 2,
      homeSignal: makeSignal({ teamKey: "argentina", en: "Argentina", es: "Argentina", elo: 1940, fifa: 1860 }),
      awaySignal: makeSignal({ teamKey: "austria", en: "Austria", es: "Austria", elo: 1760, fifa: 1650 }),
      historicalFacts,
      localizations,
      eloCurrent: eloRows,
      eloStart2026: eloStartRows,
      fifaRanking: fifaRows,
      scheduleRows,
    });
    const mexicoHost = buildMatchFeatureVector({
      fixtureId: "mexico-vs-canada",
      cutoffAt: "2026-06-16T17:00:00Z",
      homeTeamKey: "mexico",
      awayTeamKey: "canada",
      officialMatchNumber: 3,
      homeSignal: makeSignal({ teamKey: "mexico", en: "Mexico", es: "Mexico", elo: 1810, fifa: 1710 }),
      awaySignal: makeSignal({ teamKey: "canada", en: "Canada", es: "Canada", elo: 1775, fifa: 1630 }),
      historicalFacts,
      localizations,
      eloCurrent: eloRows,
      eloStart2026: eloStartRows,
      fifaRanking: fifaRows,
      scheduleRows,
    });
    const usHost = buildMatchFeatureVector({
      fixtureId: "us-vs-mexico",
      cutoffAt: "2026-06-17T17:00:00Z",
      homeTeamKey: "united_states",
      awayTeamKey: "mexico",
      officialMatchNumber: 4,
      homeSignal: makeSignal({ teamKey: "united_states", en: "United States", es: "Estados Unidos", elo: 1805, fifa: 1700 }),
      awaySignal: makeSignal({ teamKey: "mexico", en: "Mexico", es: "Mexico", elo: 1810, fifa: 1710 }),
      historicalFacts,
      localizations,
      eloCurrent: eloRows,
      eloStart2026: eloStartRows,
      fifaRanking: fifaRows,
      scheduleRows,
    });

    expect(neutralGermany.derived.venueContext.fixtureContext).toBe("neutral");
    expect(neutralArgentina.derived.venueContext.fixtureContext).toBe("neutral");
    expect(mexicoHost.derived.venueContext.appliesTo).toBe("home");
    expect(usHost.derived.venueContext.appliesTo).toBe("home");
  });

  it("prioritizes Brier and log loss in candidate selection instead of the old opaque composite", () => {
    const candidateA = TASK2_1_CANDIDATES[0]!;
    const candidateB = TASK2_1_CANDIDATES[1]!;
    const selection = buildValidationSelectionAudit([
      {
        candidate: candidateA,
        validationMetrics: {
          fixtureCount: 10,
          oneXTwo: { multiclassBrier: 0.19, logLoss: 0.95, outcomeAccuracy: 0.5, favoriteAccuracy: 0.6, calibrationByBucket: [] },
          goalsAndMarkets: { totalGoalsMae: 1.4, goalDifferenceMae: 1.1, bttsBrier: 0.2, bttsAccuracy: 0.5, over25Brier: 0.2, over25Accuracy: 0.5 },
          scoreDistribution: { exactScoreTop1Coverage: 0.1, exactScoreTop3Coverage: 0.2, exactScoreTop5Coverage: 0.3, actualScoreProbability: 0.05, scoreMatrixTailMass: 0.01 },
        },
      },
      {
        candidate: candidateB,
        validationMetrics: {
          fixtureCount: 10,
          oneXTwo: { multiclassBrier: 0.205, logLoss: 1.02, outcomeAccuracy: 0.45, favoriteAccuracy: 0.55, calibrationByBucket: [] },
          goalsAndMarkets: { totalGoalsMae: 0.8, goalDifferenceMae: 0.7, bttsBrier: 0.2, bttsAccuracy: 0.5, over25Brier: 0.2, over25Accuracy: 0.5 },
          scoreDistribution: { exactScoreTop1Coverage: 0.1, exactScoreTop3Coverage: 0.2, exactScoreTop5Coverage: 0.3, actualScoreProbability: 0.05, scoreMatrixTailMass: 0.01 },
        },
      },
    ]);

    expect(selection.winner.candidate.key).toBe(candidateA.key);
    expect(selection.ranked[0]?.selectionAudit.multiclassBrier).toBe(0.19);
  });

  it("builds bounded reliability-shrunk hybrid predictions and caps large shifts relative to the baseline", () => {
    const features = buildMatchFeatureVector({
      fixtureId: "germany-vs-curacao",
      cutoffAt: "2026-06-14T17:00:00Z",
      homeTeamKey: "germany",
      awayTeamKey: "curacao",
      homeSignal: makeSignal({ teamKey: "germany", en: "Germany", es: "Alemania", elo: 1890, fifa: 1788, reliability: 0.35, sampleSize: 2 }),
      awaySignal: makeSignal({ teamKey: "curacao", en: "Curacao", es: "Curazao", elo: 1590, fifa: 1390, reliability: 0.35, sampleSize: 2 }),
      historicalFacts,
      localizations,
      eloCurrent: eloRows,
      eloStart2026: eloStartRows,
      fifaRanking: fifaRows,
      scheduleRows,
    });
    const baseline = buildChallengerPrediction({
      candidate: TASK2_1_CANDIDATES.find((candidate) => candidate.key === "v1_compatible_baseline")!,
      features,
    });
    const bounded = buildChallengerPrediction({
      candidate: TASK2_1_CANDIDATES.find((candidate) => candidate.key === "v1_plus_bounded_signals")!,
      features,
    });

    expect(bounded.internalAudit).toBeDefined();
    expect(Math.abs(bounded.expectedGoals.difference - bounded.internalAudit!.v1ExpectedGoalDifference)).toBeLessThanOrEqual(0.42);
    expect(Math.abs(bounded.expectedGoals.total - bounded.internalAudit!.v1ExpectedTotalGoals)).toBeLessThanOrEqual(0.36);
    expect(Math.abs(bounded.probabilities.oneXTwo.homeWin - baseline.probabilities.oneXTwo.homeWin)).toBeLessThanOrEqual(0.1);
  });

  it("keeps scenario families non-overlapping and the evaluator summary consistent", () => {
    const prediction = {
      modelVersion: "test",
      candidateKey: "test",
      cutoffAt: "2026-06-21T00:00:00Z",
      expectedGoals: { home: 1.5, away: 1, total: 2.5, difference: 0.5 },
      probabilities: {
        oneXTwo: { homeWin: 0.48, draw: 0.27, awayWin: 0.25 },
        btts: { yes: 0.4, no: 0.6 },
        overUnder25: { over: 0.45, under: 0.55 },
      },
      scoreMatrix: [],
      scoreMatrixTailMass: 0.01,
      topScorelines: [],
      mostLikelyScore: "2-1",
      confidence: 60,
      riskLevel: "medium" as const,
      scenarios: [
        {
          scenarioType: "main",
          familyCode: "favorite_narrow_win",
          representativeScore: { home: 2, away: 1 },
          exactScoreProbability: 0.12,
          familyProbability: 0.26,
          supportingReasonCodes: [],
          contradictingReasonCodes: [],
          requiredMatchScriptCodes: [],
          riskLevel: "medium" as const,
          reliability: 0.7,
          relatedScorelines: [],
        },
        {
          scenarioType: "supporting",
          familyCode: "low_scoring_draw",
          representativeScore: { home: 1, away: 1 },
          exactScoreProbability: 0.1,
          familyProbability: 0.18,
          supportingReasonCodes: [],
          contradictingReasonCodes: [],
          requiredMatchScriptCodes: [],
          riskLevel: "medium" as const,
          reliability: 0.7,
          relatedScorelines: [],
        },
        {
          scenarioType: "risk",
          familyCode: "open_high_scoring_match",
          representativeScore: { home: 3, away: 2 },
          exactScoreProbability: 0.05,
          familyProbability: 0.12,
          supportingReasonCodes: [],
          contradictingReasonCodes: [],
          requiredMatchScriptCodes: [],
          riskLevel: "high" as const,
          reliability: 0.7,
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
        en: { locale: "en" as const, summary: "x", scenarioLines: [], reasonLines: [] },
        es: { locale: "es" as const, summary: "x", scenarioLines: [], reasonLines: [] },
      },
    };

    const summary = evaluateScenarioRows([
      {
        actual: { homeGoals: 2, awayGoals: 1, outcome: "home" as const },
        prediction,
        favoriteSide: "home",
      },
      {
        actual: { homeGoals: 0, awayGoals: 0, outcome: "draw" as const },
        prediction,
        favoriteSide: "home",
      },
    ]);

    expect(summary.fixtureCount).toBe(2);
    expect(summary.mainScenarioMaterialized).toBe(0.5);
    expect(summary.riskScenarioMaterialized).toBe(0.5);
    expect(summary.perFixture[0]?.resultOutsideAllThreeScenarioFamilies).toBe(false);
    expect(summary.perFixture[1]?.correctTotalGoalRange).toBe(true);
  });

  it("reconstructs a comparable v1 score distribution matrix when stored top scores are partial", () => {
    const parsed = parseOriginalPrediction(
      {
        id: "p1",
        match_id: "m1",
        model_version_id: "v1",
        prediction_type: "pre_match_24h",
        home_win_prob: 52,
        draw_prob: 25,
        away_win_prob: 23,
        expected_home_goals: 1.8,
        expected_away_goals: 0.9,
        most_likely_score: "2-1",
        top_scores_json: [{ score: "2-1", probability: 12 }],
        confidence_score: 60,
        risk_level: "medium",
        run_scope: "public_product",
        created_at: "2026-06-01T00:00:00Z",
      },
      [],
    );

    expect(parsed.topScorelines.length).toBeGreaterThanOrEqual(5);
    expect(parsed.scoreMatrixTailMass).not.toBeNull();
    expect(parsed.scoreMatrixSource).toBe("reconstructed_from_xg");
  });

  it("builds deterministic challenger output, explanation previews, and future cutoffs", () => {
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
    const candidate = TASK2_1_CANDIDATES.find((entry) => entry.key === "v1_plus_bounded_signals_conservative")!;
    const first = buildChallengerPrediction({ candidate, features });
    const second = buildChallengerPrediction({ candidate, features });
    const previewEs = renderExplanationPreview({
      locale: "es",
      homeName: "Alemania",
      awayName: "Curazao",
      scenarios: first.scenarios,
    });

    expect(second).toEqual(first);
    expect(previewEs.summary).toContain("Alemania");
    expect(filterFutureFixturesByCutoff(
      [
        { kickoffAt: "2026-06-20T23:59:59Z", id: "old" },
        { kickoffAt: "2026-06-21T00:00:00Z", id: "same" },
        { kickoffAt: "2026-06-21T00:00:01Z", id: "future" },
      ],
      "2026-06-21T00:00:00Z",
    ).map((entry) => entry.id)).toEqual(["future"]);
  });

  it("builds a public-safe shadow export without internal audit details or weights", () => {
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
          prediction: buildChallengerPrediction({
            candidate: TASK2_1_CANDIDATES.find((entry) => entry.key === "v1_plus_bounded_signals")!,
            features: buildMatchFeatureVector({
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
            }),
          }),
        },
      ],
    });

    expect(exportPayload.schemaVersion).toBe("torneo-mundialista-shadow-export-v2");
    expect(JSON.stringify(exportPayload)).not.toContain("internalAudit");
    expect(JSON.stringify(exportPayload)).not.toContain("hybridAdjustments");
  });

  it("keeps the wrapper manifest API available for existing callers", () => {
    const manifest = buildTrainingValidationHoldoutManifest({
      historicalFacts,
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
          actual: { homeGoals: 7, awayGoals: 1, score: "7-1", outcome: "home" as const },
          originalPrediction: {} as never,
          originalMarkets: [],
        },
      ],
      scheduleRows,
      localizations,
    });

    expect(manifest.holdout.rowCount).toBe(1);
    expect(manifest.training.rowCount).toBeGreaterThan(0);
  });

  it("refuses to overwrite the preserved 2026-06-21 task2 or task2-1 historical artifact path", () => {
    expect(() =>
      assertTask2LocalOnlyPreflight({
        ...basePaths,
        artifactsDir: path.join(process.cwd(), "artifacts", "prediction-intelligence-v2", "task2-1", "2026-06-21"),
        artifactDate: "2026-06-21",
        generationCutoff: "2026-06-21T00:00:00Z",
        historicalReferenceDir: path.join(process.cwd(), "artifacts", "prediction-intelligence-v2", "task1-1", "2026-06-21"),
        historicalTask2ReferenceDir: path.join(process.cwd(), "artifacts", "prediction-intelligence-v2", "task2", "2026-06-21"),
      }),
    ).toThrow(/preserved historical evidence path/i);
  });
});
