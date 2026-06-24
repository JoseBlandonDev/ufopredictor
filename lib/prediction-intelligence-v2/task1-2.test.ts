import { describe, expect, it } from "vitest";

import {
  buildHistoricalEloTimeline,
  buildPredictionIntelligenceV2ReplayInput,
  resolveFixturePreMatchElo,
  resolveTeamEloAtCutoff,
  type CanonicalTeamAlias,
  type CanonicalTeamLocalization,
  type HistoricalMatchFact,
  type RatingSnapshotRow,
  type WorldCupScheduleMatch,
} from "./task1";
import { buildTask1_2Coverage } from "./task1-2";
import type { ProductReplayInventory } from "./task1-1";

const scheduleRows: WorldCupScheduleMatch[] = [
  {
    official_match_number: 1,
    stage_key: "group_stage",
    group_key: "H",
    home_slot: "ESP",
    away_slot: "CPV",
    home_team_key: "spain",
    away_team_key: "cape_verde",
    scheduled_date_et: "2026-06-15",
    published_time_et: "14:00",
    published_timezone: "America/New_York",
    scheduled_at_utc: "2026-06-15T18:00:00Z",
    host_city_key: "x",
    venue_key: "x",
    venue_common_name: "x",
    venue_fifa_name: "x",
    country_code: "US",
    source_snapshot_id: "schedule",
  },
  {
    official_match_number: 2,
    stage_key: "group_stage",
    group_key: "C",
    home_slot: "BRA",
    away_slot: "MAR",
    home_team_key: "brazil",
    away_team_key: "morocco",
    scheduled_date_et: "2026-06-15",
    published_time_et: "10:00",
    published_timezone: "America/New_York",
    scheduled_at_utc: "2026-06-15T14:00:00Z",
    host_city_key: "y",
    venue_key: "y",
    venue_common_name: "y",
    venue_fifa_name: "y",
    country_code: "US",
    source_snapshot_id: "schedule",
  },
];

const localizations: CanonicalTeamLocalization[] = [
  { canonical_team_key: "spain", fifa_code: "ESP", iso_alpha3: "ESP", display_name_en: "Spain", display_name_es: "España", elo_name_raw: "Spain", translation_status: "ok" },
  { canonical_team_key: "cape_verde", fifa_code: "CPV", iso_alpha3: "CPV", display_name_en: "Cape Verde", display_name_es: "Cabo Verde", elo_name_raw: "Cape Verde", translation_status: "ok" },
  { canonical_team_key: "brazil", fifa_code: "BRA", iso_alpha3: "BRA", display_name_en: "Brazil", display_name_es: "Brasil", elo_name_raw: "Brazil", translation_status: "ok" },
  { canonical_team_key: "morocco", fifa_code: "MAR", iso_alpha3: "MAR", display_name_en: "Morocco", display_name_es: "Marruecos", elo_name_raw: "Morocco", translation_status: "ok" },
];

const aliases: CanonicalTeamAlias[] = [
  { alias: "Spain", canonical_team_key: "spain", canonical_name_en: "Spain", source_scope: "test", resolution_status: "resolved" },
  { alias: "Cape Verde", canonical_team_key: "cape_verde", canonical_name_en: "Cape Verde", source_scope: "test", resolution_status: "resolved" },
  { alias: "Cabo Verde", canonical_team_key: "cape_verde", canonical_name_en: "Cape Verde", source_scope: "test", resolution_status: "resolved" },
  { alias: "Brazil", canonical_team_key: "brazil", canonical_name_en: "Brazil", source_scope: "test", resolution_status: "resolved" },
  { alias: "Morocco", canonical_team_key: "morocco", canonical_name_en: "Morocco", source_scope: "test", resolution_status: "resolved" },
];

const historicalFacts: HistoricalMatchFact[] = [
  {
    source_snapshot_id: "seed",
    source_file: "results.html",
    source_row_number: 1,
    match_date: "2026-06-15",
    date_raw: "June 15 2026",
    date_inference_note: null,
    team_1_name_raw: "Cape Verde",
    team_2_name_raw: "Spain",
    team_1_key: "cape_verde",
    team_2_key: "spain",
    score_1: 0,
    score_2: 0,
    competition_raw: "World Cup",
    competition_key: "world_cup",
    event_location_raw: "the United States",
    match_type: "official",
    elo_change_1: 1,
    elo_change_2: -1,
    post_match_elo_1: 1501,
    post_match_elo_2: 2100,
    pre_match_elo_1: null,
    pre_match_elo_2: null,
    rank_change_1: 0,
    rank_change_2: 0,
    post_match_rank_1: 70,
    post_match_rank_2: 1,
    pre_match_rank_1: 70,
    pre_match_rank_2: 1,
    natural_match_key: "fact-1",
  },
  {
    source_snapshot_id: "seed",
    source_file: "results.html",
    source_row_number: 2,
    match_date: "2026-06-10",
    date_raw: "June 10 2026",
    date_inference_note: null,
    team_1_name_raw: "Brazil",
    team_2_name_raw: "Morocco",
    team_1_key: "brazil",
    team_2_key: "morocco",
    score_1: 1,
    score_2: 1,
    competition_raw: "Friendly",
    competition_key: "friendly",
    event_location_raw: "neutral",
    match_type: "friendly",
    elo_change_1: 5,
    elo_change_2: -5,
    post_match_elo_1: 1985,
    post_match_elo_2: 1795,
    pre_match_elo_1: 1980,
    pre_match_elo_2: 1800,
    rank_change_1: 0,
    rank_change_2: 0,
    post_match_rank_1: 2,
    post_match_rank_2: 10,
    pre_match_rank_1: 2,
    pre_match_rank_2: 10,
    natural_match_key: "fact-2",
  },
  {
    source_snapshot_id: "seed",
    source_file: "results.html",
    source_row_number: 3,
    match_date: "2026-06-15",
    date_raw: "June 15 2026",
    date_inference_note: null,
    team_1_name_raw: "Brazil",
    team_2_name_raw: "Chile",
    team_1_key: "brazil",
    team_2_key: "chile",
    score_1: 1,
    score_2: 0,
    competition_raw: "Friendly",
    competition_key: "friendly",
    event_location_raw: "neutral",
    match_type: "friendly",
    elo_change_1: 3,
    elo_change_2: -3,
    post_match_elo_1: 1988,
    post_match_elo_2: 1700,
    pre_match_elo_1: 1985,
    pre_match_elo_2: 1703,
    rank_change_1: 0,
    rank_change_2: 0,
    post_match_rank_1: 2,
    post_match_rank_2: 20,
    pre_match_rank_1: 2,
    pre_match_rank_2: 20,
    natural_match_key: "fact-3",
  },
];

const eloCurrent: RatingSnapshotRow[] = [
  { source_snapshot_id: "elo-current", effective_date: "2026-06-20", canonical_team_key: "spain", current_rank: 1, elo_rating: 2200, raw_values: {} },
  { source_snapshot_id: "elo-current", effective_date: "2026-06-20", canonical_team_key: "cape_verde", current_rank: 70, elo_rating: 1600, raw_values: {} },
  { source_snapshot_id: "elo-current", effective_date: "2026-06-20", canonical_team_key: "brazil", current_rank: 2, elo_rating: 2000, raw_values: {} },
  { source_snapshot_id: "elo-current", effective_date: "2026-06-20", canonical_team_key: "morocco", current_rank: 10, elo_rating: 1810, raw_values: {} },
];

const eloStart2026: RatingSnapshotRow[] = [
  { source_snapshot_id: "elo-start", effective_date: "2026-01-01", canonical_team_key: "spain", current_rank: 2, elo_rating: 2050, raw_values: {} },
  { source_snapshot_id: "elo-start", effective_date: "2026-01-01", canonical_team_key: "cape_verde", current_rank: 75, elo_rating: 1450, raw_values: {} },
  { source_snapshot_id: "elo-start", effective_date: "2026-01-01", canonical_team_key: "brazil", current_rank: 3, elo_rating: 1980, raw_values: {} },
  { source_snapshot_id: "elo-start", effective_date: "2026-01-01", canonical_team_key: "morocco", current_rank: 12, elo_rating: 1780, raw_values: {} },
];

const fifaRanking: RatingSnapshotRow[] = [
  { source_snapshot_id: "fifa", effective_date: "2026-06-11", canonical_team_key: "spain", current_rank: 3, fifa_points: 1800, raw_values: { team_name_es_raw: "España" } },
  { source_snapshot_id: "fifa", effective_date: "2026-06-11", canonical_team_key: "islas_de_cabo_verde", current_rank: 55, fifa_points: 1350, raw_values: { team_name_es_raw: "Islas de Cabo Verde" } },
  { source_snapshot_id: "fifa", effective_date: "2026-06-11", canonical_team_key: "brazil", current_rank: 2, fifa_points: 1850, raw_values: { team_name_es_raw: "Brasil" } },
];

describe("prediction intelligence v2 task1.2", () => {
  it("reconstructs exact fixture pre-match elo from post-match and change", () => {
    const resolved = resolveFixturePreMatchElo({
      cutoffAt: "2026-06-15T18:00:00Z",
      fixtureDate: "2026-06-15",
      homeTeamKey: "spain",
      awayTeamKey: "cape_verde",
      historicalFacts,
      eloStart2026,
      scheduleRows,
    });

    expect(resolved.home.eloAtCutoff).toBe(2101);
    expect(resolved.home.eloResolutionMethod).toBe("exact_fixture_pre_match");
    expect(resolved.away.eloAtCutoff).toBe(1500);
  });

  it("uses latest prior post-match fallback and blocks same-day date-only leakage", () => {
    const resolved = resolveTeamEloAtCutoff({
      canonicalTeamKey: "brazil",
      cutoffAt: "2026-06-15T14:00:00Z",
      fixtureDate: "2026-06-15",
      historicalFacts,
      eloStart2026,
      scheduleRows,
      exactFixtureTeamPair: { homeTeamKey: "brazil", awayTeamKey: "morocco" },
    });

    expect(resolved.eloAtCutoff).toBe(1980);
    expect(resolved.eloResolutionMethod).toBe("exact_fixture_pre_match");

    const priorResolved = resolveTeamEloAtCutoff({
      canonicalTeamKey: "morocco",
      cutoffAt: "2026-06-14T12:00:00Z",
      fixtureDate: "2026-06-14",
      historicalFacts,
      eloStart2026,
      scheduleRows,
      exactFixtureTeamPair: null,
    });

    expect(priorResolved.eloAtCutoff).toBe(1780);
    expect(priorResolved.eloResolutionMethod).toBe("start_2026_baseline");
  });

  it("falls back to start-of-2026 when no earlier match exists", () => {
    const resolved = resolveTeamEloAtCutoff({
      canonicalTeamKey: "spain",
      cutoffAt: "2026-01-05T12:00:00Z",
      fixtureDate: "2026-01-05",
      historicalFacts: [],
      eloStart2026,
      scheduleRows,
      exactFixtureTeamPair: null,
    });

    expect(resolved.eloAtCutoff).toBe(2050);
    expect(resolved.eloResolutionMethod).toBe("start_2026_baseline");
  });

  it("does not leak the June 20 current snapshot backward and fixes Spain/Cape Verde FIFA lookup", () => {
    const replay = buildPredictionIntelligenceV2ReplayInput({
      cutoffAt: "2026-06-15T18:00:00Z",
      homeTeamKey: "spain",
      awayTeamKey: "cape_verde",
      historicalFacts,
      aliases,
      eloCurrent,
      eloStart2026,
      fifaRanking,
      localizations,
      schedule: scheduleRows,
    });

    expect(replay.homeSignal.eloAtCutoff).toBe(2101);
    expect(replay.homeSignal.source_snapshot_ids).not.toContain("elo-current");
    expect(replay.awaySignal.fifaAtCutoff).toBe(1350);
    expect(replay.awaySignal.missingOptionalSignals).toEqual([]);
  });

  it("treats missing FIFA as optional instead of blocking replay when Elo is present", () => {
    const productInventory: ProductReplayInventory = {
      competition: { id: "wc", slug: "world-cup-2026", usage_scope: "public_product" },
      matches: [
        {
          id: "m1",
          external_id: "api-football:fixture:1001",
          slug: "spain-vs-cape-verde",
          kickoff_at: "2026-06-15T18:00:00Z",
          stage: "Group Stage",
          status: "finished",
          competition_id: "wc",
          home_team_id: "t1",
          away_team_id: "t2",
          intake_source: "api_football",
        },
      ],
      resultsByMatchId: new Map(),
      originalPredictionByMatchId: new Map([["m1", { id: "pv1", match_id: "m1", prediction_type: "pre_kickoff", created_at: "2026-06-14T00:00:00Z", run_scope: "public_product" }]]),
    };

    const coverage = buildTask1_2Coverage({
      productInventory,
      refreshPlan: {
        completed_fixtures_discovered: 1,
        already_known_results: [
          {
            provider_fixture_id: 1001,
            external_id: "api-football:fixture:1001",
            official_match_number: 1,
            kickoff_at_utc: "2026-06-15T18:00:00Z",
            canonical_home_team_key: "spain",
            canonical_away_team_key: "cape_verde",
            provider_status: "FT",
            provider_score: { home: 0, away: 0 },
            product_match_id: "m1",
            known_historical_result: { scoreline: "0-0", source_snapshot_id: "seed" },
            product_result: null,
            classification: "already_known_result",
            note: "ok",
          },
        ],
        newly_discovered_results: [],
        score_or_status_corrections: [],
        unresolved_finished_fixtures: [],
      },
      scheduleRows,
      scheduleLinks: [{ official_match_number: 1, provider_fixture_id: 1001, provider_status: "FT", linked_by: "kickoff_and_teams" }],
      aliases,
      localizations,
      historicalFacts,
      eloCurrent,
      eloStart2026,
      fifaRanking: fifaRanking.filter((row) => row.canonical_team_key !== "spain"),
    });

    expect(coverage.manifest[0]?.replay_readiness).toBe("ready");
    expect(coverage.manifest[0]?.fifa_coverage).toBe("missing_optional");
  });

  it("builds a historical timeline with baseline and match entries", () => {
    const timeline = buildHistoricalEloTimeline({
      historicalFacts,
      eloStart2026,
      scheduleRows,
    });

    expect(timeline.some((entry) => entry.reconstruction_method === "start_2026_baseline")).toBe(true);
    expect(timeline.some((entry) => entry.natural_match_key === "fact-1" && entry.pre_match_elo === 2101)).toBe(true);
  });
});
