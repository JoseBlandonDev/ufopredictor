import { describe, expect, it } from "vitest";

import {
  buildReplayCoverageManifest,
  buildCorrectedEvidencePreviews,
  classifyOfficialScheduleLinks,
  reconcileFinishedFixtures,
} from "./task1-1";
import {
  buildPredictionIntelligenceV2ReplayInput,
  canonicalizeHistoricalFactForReplay,
  type CanonicalTeamAlias,
  type CanonicalTeamLocalization,
  type HistoricalMatchFact,
  type RatingSnapshotRow,
  type ScheduleFixtureLink,
  type WorldCupScheduleMatch,
} from "./task1";
import type { ProviderFixture } from "../football-api/api-football-types";

const scheduleRows: WorldCupScheduleMatch[] = [
  {
    official_match_number: 1,
    stage_key: "group_stage",
    group_key: "A",
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
    group_key: "B",
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
  {
    official_match_number: 73,
    stage_key: "round_of_32",
    group_key: null,
    home_slot: "2A",
    away_slot: "2B",
    home_team_key: null,
    away_team_key: null,
    scheduled_date_et: "2026-06-28",
    published_time_et: "15:00",
    published_timezone: "America/New_York",
    scheduled_at_utc: "2026-06-28T19:00:00Z",
    host_city_key: "z",
    venue_key: "z",
    venue_common_name: "z",
    venue_fifa_name: "z",
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
    pre_match_elo_1: 1500,
    pre_match_elo_2: 2101,
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
    match_date: "2026-06-15",
    date_raw: "June 15 2026",
    date_inference_note: null,
    team_1_name_raw: "Brazil",
    team_2_name_raw: "Morocco",
    team_1_key: "brazil",
    team_2_key: "morocco",
    score_1: 1,
    score_2: 1,
    competition_raw: "World Cup",
    competition_key: "world_cup",
    event_location_raw: "the United States",
    match_type: "official",
    elo_change_1: 0,
    elo_change_2: 0,
    post_match_elo_1: 2000,
    post_match_elo_2: 1800,
    pre_match_elo_1: 2000,
    pre_match_elo_2: 1800,
    rank_change_1: 0,
    rank_change_2: 0,
    post_match_rank_1: 2,
    post_match_rank_2: 10,
    pre_match_rank_1: 2,
    pre_match_rank_2: 10,
    natural_match_key: "fact-2",
  },
];

const eloCurrent: RatingSnapshotRow[] = [
  { source_snapshot_id: "elo-old", effective_date: "2026-06-14", canonical_team_key: "spain", current_rank: 1, elo_rating: 2101, raw_values: {} },
  { source_snapshot_id: "elo-old", effective_date: "2026-06-14", canonical_team_key: "cape_verde", current_rank: 70, elo_rating: 1500, raw_values: {} },
  { source_snapshot_id: "elo-old", effective_date: "2026-06-14", canonical_team_key: "brazil", current_rank: 2, elo_rating: 2000, raw_values: {} },
  { source_snapshot_id: "elo-old", effective_date: "2026-06-14", canonical_team_key: "morocco", current_rank: 10, elo_rating: 1800, raw_values: {} },
  { source_snapshot_id: "elo-new", effective_date: "2026-06-15", canonical_team_key: "spain", current_rank: 1, elo_rating: 2200, raw_values: {} },
];

const eloStart2026: RatingSnapshotRow[] = [
  { source_snapshot_id: "elo-start", effective_date: "2026-01-01", canonical_team_key: "spain", current_rank: 2, elo_rating: 2050, raw_values: {} },
  { source_snapshot_id: "elo-start", effective_date: "2026-01-01", canonical_team_key: "cape_verde", current_rank: 75, elo_rating: 1450, raw_values: {} },
  { source_snapshot_id: "elo-start", effective_date: "2026-01-01", canonical_team_key: "brazil", current_rank: 3, elo_rating: 1980, raw_values: {} },
  { source_snapshot_id: "elo-start", effective_date: "2026-01-01", canonical_team_key: "morocco", current_rank: 12, elo_rating: 1780, raw_values: {} },
];

const fifaRanking: RatingSnapshotRow[] = [
  { source_snapshot_id: "fifa", effective_date: "2026-06-11", canonical_team_key: "spain", current_rank: 3, fifa_points: 1800, raw_values: {} },
  { source_snapshot_id: "fifa", effective_date: "2026-06-11", canonical_team_key: "cape_verde", current_rank: 55, fifa_points: 1350, raw_values: {} },
  { source_snapshot_id: "fifa", effective_date: "2026-06-11", canonical_team_key: "brazil", current_rank: 2, fifa_points: 1850, raw_values: {} },
  { source_snapshot_id: "fifa", effective_date: "2026-06-11", canonical_team_key: "morocco", current_rank: 8, fifa_points: 1700, raw_values: {} },
];

describe("prediction intelligence v2 task1.1", () => {
  it("canonicalizes reversed source orientation and uses official home-away order in replay input", () => {
    const canonicalFact = canonicalizeHistoricalFactForReplay(historicalFacts[0], scheduleRows);
    expect(canonicalFact.team_1_key).toBe("spain");
    expect(canonicalFact.team_2_key).toBe("cape_verde");

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

    expect(replay.officialScheduleMatch?.official_match_number).toBe(1);
  });

  it("uses exact kickoff cutoffs so same-day earlier matches can be included without leaking the current fixture", () => {
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

    expect(replay.sourceSnapshotIds).toContain("elo-old");
    expect(replay.sourceSnapshotIds).not.toContain("elo-new");
    expect(replay.homeSignal.sample_sizes.world_cup_current).toBe(0);
  });

  it("reconciles finished provider fixtures and identifies seeded versus newly discovered results", () => {
    const reconciliationScheduleRows: WorldCupScheduleMatch[] = [
      ...scheduleRows,
      {
        official_match_number: 3,
        stage_key: "group_stage",
        group_key: "C",
        home_slot: "ECU",
        away_slot: "CUW",
        home_team_key: "ecuador",
        away_team_key: "curacao",
        scheduled_date_et: "2026-06-16",
        published_time_et: "20:00",
        published_timezone: "America/New_York",
        scheduled_at_utc: "2026-06-17T00:00:00Z",
        host_city_key: "w",
        venue_key: "w",
        venue_common_name: "w",
        venue_fifa_name: "w",
        country_code: "US",
        source_snapshot_id: "schedule",
      },
    ];
    const reconciliationLocalizations: CanonicalTeamLocalization[] = [
      ...localizations,
      { canonical_team_key: "ecuador", fifa_code: "ECU", iso_alpha3: "ECU", display_name_en: "Ecuador", display_name_es: "Ecuador", elo_name_raw: "Ecuador", translation_status: "ok" },
      { canonical_team_key: "curacao", fifa_code: "CUW", iso_alpha3: "CUW", display_name_en: "Curacao", display_name_es: "Curazao", elo_name_raw: "Curacao", translation_status: "ok" },
    ];
    const reconciliationAliases: CanonicalTeamAlias[] = [
      ...aliases,
      { alias: "Ecuador", canonical_team_key: "ecuador", canonical_name_en: "Ecuador", source_scope: "test", resolution_status: "resolved" },
      { alias: "Curacao", canonical_team_key: "curacao", canonical_name_en: "Curacao", source_scope: "test", resolution_status: "resolved" },
      { alias: "Curaçao", canonical_team_key: "curacao", canonical_name_en: "Curacao", source_scope: "test", resolution_status: "resolved" },
    ];
    const providerFixtures: ProviderFixture[] = [
      {
        provider: "api-football",
        providerFixtureId: 1001,
        kickoffAt: "2026-06-15T18:00:00Z",
        timezone: "UTC",
        status: "finished",
        statusShort: "FT",
        elapsedMinutes: 90,
        competition: { providerCompetitionId: 1, name: "World Cup", country: "World", season: 2026, round: "Group Stage - 1" },
        homeTeam: { providerTeamId: 1, name: "Spain", winner: null },
        awayTeam: { providerTeamId: 2, name: "Cape Verde", winner: null },
        goals: { home: 0, away: 0 },
      },
      {
        provider: "api-football",
        providerFixtureId: 1002,
        kickoffAt: "2026-06-15T14:00:00Z",
        timezone: "UTC",
        status: "finished",
        statusShort: "FT",
        elapsedMinutes: 90,
        competition: { providerCompetitionId: 1, name: "World Cup", country: "World", season: 2026, round: "Group Stage - 1" },
        homeTeam: { providerTeamId: 3, name: "Brazil", winner: null },
        awayTeam: { providerTeamId: 4, name: "Morocco", winner: null },
        goals: { home: 2, away: 1 },
      },
      {
        provider: "api-football",
        providerFixtureId: 1003,
        kickoffAt: "2026-06-17T00:00:00Z",
        timezone: "UTC",
        status: "finished",
        statusShort: "FT",
        elapsedMinutes: 90,
        competition: { providerCompetitionId: 1, name: "World Cup", country: "World", season: 2026, round: "Group Stage - 1" },
        homeTeam: { providerTeamId: 5, name: "Ecuador", winner: null },
        awayTeam: { providerTeamId: 6, name: "Curacao", winner: null },
        goals: { home: 0, away: 0 },
      },
    ];

    const refreshPlan = reconcileFinishedFixtures({
      providerFixtures,
      scheduleRows: reconciliationScheduleRows,
      historicalFacts,
      aliases: reconciliationAliases,
      localizations: reconciliationLocalizations,
      productInventory: {
        competition: { id: "wc", slug: "world-cup-2026", usage_scope: "public_product" },
        matches: [{ id: "m1", external_id: "api-football:fixture:1001", slug: "spain-vs-cape-verde", kickoff_at: "2026-06-15T18:00:00Z", stage: "Group Stage - 1", status: "finished", competition_id: "wc", home_team_id: "t1", away_team_id: "t2", intake_source: "api_football" }],
        teamsById: new Map(),
        resultsByMatchId: new Map(),
        originalPredictionByMatchId: new Map(),
      },
    });

    expect(refreshPlan.completed_fixtures_discovered).toBe(3);
    expect(refreshPlan.already_known_results).toHaveLength(1);
    expect(refreshPlan.score_or_status_corrections).toHaveLength(1);
    expect(refreshPlan.newly_discovered_results).toHaveLength(1);
    expect(refreshPlan.newly_discovered_results[0]?.official_match_number).toBe(3);
  });

  it("classifies unresolved links separately from knockout placeholders", () => {
    const providerFixtures: ProviderFixture[] = [
      {
        provider: "api-football",
        providerFixtureId: 1001,
        kickoffAt: "2026-06-15T18:00:00Z",
        timezone: "UTC",
        status: "finished",
        statusShort: "FT",
        elapsedMinutes: 90,
        competition: { providerCompetitionId: 1, name: "World Cup", country: "World", season: 2026, round: "Group Stage - 1" },
        homeTeam: { providerTeamId: 1, name: "Spain", winner: null },
        awayTeam: { providerTeamId: 2, name: "Cape Verde", winner: null },
        goals: { home: 0, away: 0 },
      },
    ];
    const scheduleLinks: ScheduleFixtureLink[] = [
      { official_match_number: 1, provider_fixture_id: 1001, provider_status: "FT", linked_by: "kickoff_and_teams" },
      { official_match_number: 2, provider_fixture_id: null, provider_status: null, linked_by: "unresolved" },
      { official_match_number: 73, provider_fixture_id: null, provider_status: null, linked_by: "unresolved" },
    ];

    const classification = classifyOfficialScheduleLinks({
      scheduleRows,
      scheduleLinks,
      providerFixtures,
    });

    expect(classification.group_stage.linked).toBe(1);
    expect(classification.totals.group_stage_provider_gap).toBe(1);
    expect(classification.totals.knockout_placeholders).toBe(1);
  });

  it("builds replay readiness entries and corrected evidence previews", () => {
    const refreshPlan = {
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
          classification: "already_known_result" as const,
          note: "ok",
        },
      ],
      newly_discovered_results: [],
      score_or_status_corrections: [],
      unresolved_finished_fixtures: [],
    };

    const manifest = buildReplayCoverageManifest({
      productInventory: {
        competition: { id: "wc", slug: "world-cup-2026", usage_scope: "public_product" },
        matches: [{ id: "m1", external_id: "api-football:fixture:1001", slug: "spain-vs-cape-verde", kickoff_at: "2026-06-15T18:00:00Z", stage: "Group Stage - 1", status: "finished", competition_id: "wc", home_team_id: "t1", away_team_id: "t2", intake_source: "api_football" }],
        teamsById: new Map(),
        resultsByMatchId: new Map(),
        originalPredictionByMatchId: new Map([["m1", { id: "pv1", match_id: "m1", prediction_type: "pre_kickoff", created_at: "2026-06-14T00:00:00Z", run_scope: "public_product" }]]),
      },
      scheduleRows,
      scheduleLinks: [{ official_match_number: 1, provider_fixture_id: 1001, provider_status: "FT", linked_by: "kickoff_and_teams" }],
      refreshPlan,
      aliases,
      localizations,
      historicalFacts,
      eloCurrent,
      eloStart2026,
      fifaRanking,
    });

    expect(manifest[0]?.replay_readiness).toBe("ready");

    const previews = buildCorrectedEvidencePreviews({
      fixtures: [{ home: "spain", away: "cape_verde" }],
      scheduleRows,
      aliases,
      localizations,
      historicalFacts,
      eloCurrent,
      eloStart2026,
      fifaRanking,
      refreshPlan,
    });

    expect(previews[0]?.fixture).toBe("Spain vs Cape Verde");
    expect(previews[0]?.actual_result.scoreline).toBe("0-0");
  });
});
