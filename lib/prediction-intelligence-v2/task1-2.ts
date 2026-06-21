import fs from "node:fs";
import path from "node:path";

import { fetchApiFootballFixturesByLeague } from "../football-api/api-football-client.ts";
import type { ProviderFixture } from "../football-api/api-football-types.ts";
import {
  buildHistoricalEloTimeline,
  buildPredictionIntelligenceV2ReplayInput,
  canonicalizeHistoricalFactForReplay,
  findOfficialScheduleMatchByTeams,
  loadTask1Datasets,
  matchProviderFixture,
  type CanonicalTeamAlias,
  type CanonicalTeamLocalization,
  type HistoricalMatchFact,
  type HistoricalEloTimelineEntry,
  type PreparedPaths,
  type ScheduleFixtureLink,
  type TeamSignalSnapshot,
  type WorldCupScheduleMatch,
} from "./task1.ts";
import {
  loadProductReplayInventory,
  reconcileFinishedFixtures,
  type CompletedFixtureRefreshPlan,
  type ProductReplayInventory,
} from "./task1-1.ts";

export type HistoricalEloTimelineSummary = {
  total_entries: number;
  baseline_entries: number;
  match_entries: number;
  exact_entries: number;
  date_only_entries: number;
  teams_covered: number;
  by_team: Array<{
    canonical_team_key: string;
    entries: number;
  }>;
};

export type EloResolutionAuditEntry = {
  product_match_id: string;
  official_match_number: number | null;
  fixture: string;
  cutoff_at_utc: string;
  team_key: string;
  elo_at_cutoff: number | null;
  resolutionMethod: TeamSignalSnapshot["eloResolutionMethod"];
  timePrecision: "exact" | "date";
  source_snapshot_ids: string[];
  reliability: number;
  source_match_natural_key: string | null;
};

export type ReplayCoverageManifestEntryV2 = {
  product_match_id: string;
  api_football_fixture_id: number | null;
  official_match_number: number | null;
  canonical_home_team_key: string | null;
  canonical_away_team_key: string | null;
  kickoff_utc: string;
  original_prediction_version_id: string;
  result_availability: "available" | "missing";
  evidence_coverage: "ready" | "missing";
  elo_coverage: "ready" | "missing";
  fifa_coverage: "ready" | "missing_optional";
  replay_readiness: "ready" | "blocked";
  blocker: string | null;
};

export type ReplayReadyInputSample = {
  fixture: string;
  official_match_number: number | null;
  kickoff_at_utc: string;
  home_signal: TeamSignalSnapshot;
  away_signal: TeamSignalSnapshot;
  source_snapshot_ids: string[];
};

export type MissingSignalCoverageEntry = {
  fixture: string;
  official_match_number: number | null;
  home_missing_optional_signals: string[];
  away_missing_optional_signals: string[];
  home_fifa_at_cutoff: number | null;
  away_fifa_at_cutoff: number | null;
  replay_ready: boolean;
};

export type CorrectedEvidencePreviewV2 = {
  fixture: string;
  official_match_number: number | null;
  kickoff_at_utc: string;
  canonical_home_team_key: string;
  canonical_away_team_key: string;
  pre_match: {
    home: TeamSignalSnapshot;
    away: TeamSignalSnapshot;
  };
  post_match_result: {
    scoreline: string;
    winner: string;
    source: "historical_fact" | "api_football_refresh" | "pending";
  };
};

function ensureDirectory(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath: string, payload: unknown): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function writeText(filePath: string, payload: string): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, payload, "utf8");
}

function normalizeIdentity(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function parseApiFootballFixtureId(externalId: string | null): number | null {
  if (!externalId) {
    return null;
  }

  const match = /^api-football:fixture:(\d+)$/.exec(externalId);
  return match ? Number(match[1]) : null;
}

function buildAliasIndex(aliases: CanonicalTeamAlias[]): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const alias of aliases) {
    const current = index.get(alias.canonical_team_key) ?? [];
    current.push(alias.alias);
    index.set(alias.canonical_team_key, current);
  }
  return index;
}

function buildLocalizationIndex(localizations: CanonicalTeamLocalization[]): Map<string, CanonicalTeamLocalization> {
  return new Map(localizations.map((localization) => [localization.canonical_team_key, localization]));
}

function buildScheduleLinks(
  scheduleRows: WorldCupScheduleMatch[],
  providerFixtures: ProviderFixture[],
  aliases: CanonicalTeamAlias[],
  localizations: CanonicalTeamLocalization[],
): ScheduleFixtureLink[] {
  const aliasesByTeam = buildAliasIndex(aliases);
  const localizationsByTeam = buildLocalizationIndex(localizations);
  return scheduleRows.map((row) => matchProviderFixture(row, providerFixtures, aliasesByTeam, localizationsByTeam));
}

function findCanonicalHistoricalFactForMatch(
  scheduleMatch: WorldCupScheduleMatch,
  historicalFacts: HistoricalMatchFact[],
  scheduleRows: WorldCupScheduleMatch[],
): HistoricalMatchFact | null {
  return (
    historicalFacts
      .map((fact) => canonicalizeHistoricalFactForReplay(fact, scheduleRows))
      .find(
        (fact) =>
          fact.match_date === scheduleMatch.scheduled_date_et &&
          fact.team_1_key === scheduleMatch.home_team_key &&
          fact.team_2_key === scheduleMatch.away_team_key,
      ) ?? null
  );
}

export function summarizeHistoricalEloTimeline(entries: HistoricalEloTimelineEntry[]): HistoricalEloTimelineSummary {
  return {
    total_entries: entries.length,
    baseline_entries: entries.filter((entry) => entry.reconstruction_method === "start_2026_baseline").length,
    match_entries: entries.filter((entry) => entry.natural_match_key != null).length,
    exact_entries: entries.filter((entry) => entry.timePrecision === "exact").length,
    date_only_entries: entries.filter((entry) => entry.timePrecision === "date").length,
    teams_covered: new Set(entries.map((entry) => entry.canonical_team_key)).size,
    by_team: Array.from(
      entries.reduce((map, entry) => {
        map.set(entry.canonical_team_key, (map.get(entry.canonical_team_key) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    )
      .map(([canonical_team_key, entries]) => ({ canonical_team_key, entries }))
      .sort((left, right) => left.canonical_team_key.localeCompare(right.canonical_team_key)),
  };
}

export function buildTask1_2Coverage(input: {
  productInventory: ProductReplayInventory;
  refreshPlan: CompletedFixtureRefreshPlan;
  scheduleRows: WorldCupScheduleMatch[];
  scheduleLinks: ScheduleFixtureLink[];
  aliases: CanonicalTeamAlias[];
  localizations: CanonicalTeamLocalization[];
  historicalFacts: HistoricalMatchFact[];
  eloCurrent: Array<{ source_snapshot_id: string; effective_date: string; canonical_team_key: string; current_rank: number | null; elo_rating?: number | null; raw_values: Record<string, unknown> }>;
  eloStart2026: Array<{ source_snapshot_id: string; effective_date: string; canonical_team_key: string; current_rank: number | null; elo_rating?: number | null; raw_values: Record<string, unknown> }>;
  fifaRanking: Array<{ source_snapshot_id: string; effective_date: string; canonical_team_key: string; current_rank: number | null; fifa_points?: number | null; raw_values: Record<string, unknown> }>;
}) {
  const refreshByFixtureId = new Map<number, CompletedFixtureRefreshPlan["already_known_results"][number]>();
  for (const entry of [
    ...input.refreshPlan.already_known_results,
    ...input.refreshPlan.newly_discovered_results,
    ...input.refreshPlan.score_or_status_corrections,
    ...input.refreshPlan.unresolved_finished_fixtures,
  ]) {
    refreshByFixtureId.set(entry.provider_fixture_id, entry);
  }

  const localizationByKey = buildLocalizationIndex(input.localizations);
  const manifest: ReplayCoverageManifestEntryV2[] = [];
  const audit: EloResolutionAuditEntry[] = [];
  const missingCoverage: MissingSignalCoverageEntry[] = [];
  const samples: ReplayReadyInputSample[] = [];

  for (const match of input.productInventory.matches) {
    const originalPrediction = input.productInventory.originalPredictionByMatchId.get(match.id);
    if (!originalPrediction) {
      continue;
    }

    const fixtureId = parseApiFootballFixtureId(match.external_id);
    if (fixtureId == null) {
      continue;
    }

    if (!refreshByFixtureId.has(fixtureId)) {
      continue;
    }

    const refreshedResult = refreshByFixtureId.get(fixtureId) ?? null;
    const scheduleLink = input.scheduleLinks.find((link) => link.provider_fixture_id === fixtureId) ?? null;
    const scheduleMatch =
      scheduleLink != null
        ? input.scheduleRows.find((row) => row.official_match_number === scheduleLink.official_match_number) ?? null
        : null;

    const replayInput =
      scheduleMatch?.home_team_key && scheduleMatch?.away_team_key
        ? buildPredictionIntelligenceV2ReplayInput({
            cutoffAt: scheduleMatch.scheduled_at_utc,
            homeTeamKey: scheduleMatch.home_team_key,
            awayTeamKey: scheduleMatch.away_team_key,
            historicalFacts: input.historicalFacts,
            aliases: input.aliases,
            eloCurrent: input.eloCurrent,
            eloStart2026: input.eloStart2026,
            fifaRanking: input.fifaRanking,
            localizations: input.localizations,
            schedule: input.scheduleRows,
          })
        : null;

    const fixtureLabel =
      scheduleMatch?.home_team_key && scheduleMatch?.away_team_key
        ? `${localizationByKey.get(scheduleMatch.home_team_key)?.display_name_en ?? scheduleMatch.home_team_key} vs ${localizationByKey.get(scheduleMatch.away_team_key)?.display_name_en ?? scheduleMatch.away_team_key}`
        : match.slug;

    if (replayInput && scheduleMatch) {
      audit.push({
        product_match_id: match.id,
        official_match_number: scheduleMatch.official_match_number,
        fixture: fixtureLabel,
        cutoff_at_utc: scheduleMatch.scheduled_at_utc,
        team_key: replayInput.homeSignal.canonical_team_key,
        elo_at_cutoff: replayInput.homeSignal.eloAtCutoff,
        resolutionMethod: replayInput.homeSignal.eloResolutionMethod,
        timePrecision: replayInput.homeSignal.eloResolutionMethod === "latest_prior_post_match" ? "date" : "exact",
        source_snapshot_ids: replayInput.homeSignal.eloSourceSnapshotIds,
        reliability: replayInput.homeSignal.eloReliability,
        source_match_natural_key: null,
      });
      audit.push({
        product_match_id: match.id,
        official_match_number: scheduleMatch.official_match_number,
        fixture: fixtureLabel,
        cutoff_at_utc: scheduleMatch.scheduled_at_utc,
        team_key: replayInput.awaySignal.canonical_team_key,
        elo_at_cutoff: replayInput.awaySignal.eloAtCutoff,
        resolutionMethod: replayInput.awaySignal.eloResolutionMethod,
        timePrecision: replayInput.awaySignal.eloResolutionMethod === "latest_prior_post_match" ? "date" : "exact",
        source_snapshot_ids: replayInput.awaySignal.eloSourceSnapshotIds,
        reliability: replayInput.awaySignal.eloReliability,
        source_match_natural_key: null,
      });

      missingCoverage.push({
        fixture: fixtureLabel,
        official_match_number: scheduleMatch.official_match_number,
        home_missing_optional_signals: replayInput.homeSignal.missingOptionalSignals,
        away_missing_optional_signals: replayInput.awaySignal.missingOptionalSignals,
        home_fifa_at_cutoff: replayInput.homeSignal.fifaAtCutoff,
        away_fifa_at_cutoff: replayInput.awaySignal.fifaAtCutoff,
        replay_ready: replayInput.homeSignal.eloAtCutoff != null && replayInput.awaySignal.eloAtCutoff != null && refreshedResult != null,
      });
    }

    const blockers = [
      refreshedResult == null ? `missing_finished_result:${fixtureLabel}:${scheduleMatch?.scheduled_at_utc ?? match.kickoff_at}` : null,
      replayInput == null ? `missing_replay_evidence:${fixtureLabel}:${scheduleMatch?.scheduled_at_utc ?? match.kickoff_at}` : null,
      replayInput?.homeSignal.eloAtCutoff == null
        ? `missing_elo_snapshot:${replayInput?.homeSignal.canonical_team_key ?? scheduleMatch?.home_team_key ?? "unknown"}:${scheduleMatch?.scheduled_at_utc ?? match.kickoff_at}`
        : null,
      replayInput?.awaySignal.eloAtCutoff == null
        ? `missing_elo_snapshot:${replayInput?.awaySignal.canonical_team_key ?? scheduleMatch?.away_team_key ?? "unknown"}:${scheduleMatch?.scheduled_at_utc ?? match.kickoff_at}`
        : null,
    ].filter((value): value is string => value != null);

    manifest.push({
      product_match_id: match.id,
      api_football_fixture_id: fixtureId,
      official_match_number: scheduleMatch?.official_match_number ?? null,
      canonical_home_team_key: scheduleMatch?.home_team_key ?? null,
      canonical_away_team_key: scheduleMatch?.away_team_key ?? null,
      kickoff_utc: scheduleMatch?.scheduled_at_utc ?? match.kickoff_at,
      original_prediction_version_id: originalPrediction.id,
      result_availability: refreshedResult ? "available" : "missing",
      evidence_coverage: replayInput ? "ready" : "missing",
      elo_coverage: replayInput && replayInput.homeSignal.eloAtCutoff != null && replayInput.awaySignal.eloAtCutoff != null ? "ready" : "missing",
      fifa_coverage:
        replayInput && replayInput.homeSignal.fifaAtCutoff != null && replayInput.awaySignal.fifaAtCutoff != null
          ? "ready"
          : "missing_optional",
      replay_readiness: blockers.length === 0 ? "ready" : "blocked",
      blocker: blockers[0] ?? null,
    });

    if (replayInput && scheduleMatch) {
      samples.push({
        fixture: fixtureLabel,
        official_match_number: scheduleMatch.official_match_number,
        kickoff_at_utc: scheduleMatch.scheduled_at_utc,
        home_signal: replayInput.homeSignal,
        away_signal: replayInput.awaySignal,
        source_snapshot_ids: replayInput.sourceSnapshotIds,
      });
    }
  }

  return {
    manifest: manifest.sort((left, right) => left.kickoff_utc.localeCompare(right.kickoff_utc)),
    audit,
    missingCoverage,
    samples,
  };
}

export function buildTask1_2EvidencePreviews(input: {
  fixtures: Array<{ home: string; away: string }>;
  scheduleRows: WorldCupScheduleMatch[];
  aliases: CanonicalTeamAlias[];
  localizations: CanonicalTeamLocalization[];
  historicalFacts: HistoricalMatchFact[];
  eloCurrent: Array<{ source_snapshot_id: string; effective_date: string; canonical_team_key: string; current_rank: number | null; elo_rating?: number | null; raw_values: Record<string, unknown> }>;
  eloStart2026: Array<{ source_snapshot_id: string; effective_date: string; canonical_team_key: string; current_rank: number | null; elo_rating?: number | null; raw_values: Record<string, unknown> }>;
  fifaRanking: Array<{ source_snapshot_id: string; effective_date: string; canonical_team_key: string; current_rank: number | null; fifa_points?: number | null; raw_values: Record<string, unknown> }>;
  refreshPlan: CompletedFixtureRefreshPlan;
}): CorrectedEvidencePreviewV2[] {
  const refreshByMatchNumber = new Map<number, CompletedFixtureRefreshPlan["already_known_results"][number]>();
  for (const entry of [
    ...input.refreshPlan.already_known_results,
    ...input.refreshPlan.newly_discovered_results,
    ...input.refreshPlan.score_or_status_corrections,
  ]) {
    if (entry.official_match_number != null) {
      refreshByMatchNumber.set(entry.official_match_number, entry);
    }
  }

  const localizationByKey = buildLocalizationIndex(input.localizations);

  return input.fixtures.map(({ home, away }) => {
    const scheduleMatch = findOfficialScheduleMatchByTeams(input.scheduleRows, home, away);
    const replayInput = buildPredictionIntelligenceV2ReplayInput({
      cutoffAt: scheduleMatch?.scheduled_at_utc ?? new Date().toISOString(),
      homeTeamKey: home,
      awayTeamKey: away,
      historicalFacts: input.historicalFacts,
      aliases: input.aliases,
      eloCurrent: input.eloCurrent,
      eloStart2026: input.eloStart2026,
      fifaRanking: input.fifaRanking,
      localizations: input.localizations,
      schedule: input.scheduleRows,
    });
    const refreshed = scheduleMatch ? refreshByMatchNumber.get(scheduleMatch.official_match_number) ?? null : null;
    const historicalFact = scheduleMatch ? findCanonicalHistoricalFactForMatch(scheduleMatch, input.historicalFacts, input.scheduleRows) : null;
    const scoreline = historicalFact
      ? `${historicalFact.score_1}-${historicalFact.score_2}`
      : refreshed
        ? `${refreshed.provider_score.home}-${refreshed.provider_score.away}`
        : "pending";
    const winner = historicalFact
      ? historicalFact.score_1 > historicalFact.score_2
        ? localizationByKey.get(home)?.display_name_en ?? home
        : historicalFact.score_2 > historicalFact.score_1
          ? localizationByKey.get(away)?.display_name_en ?? away
          : "Draw"
      : refreshed
        ? (refreshed.provider_score.home ?? 0) > (refreshed.provider_score.away ?? 0)
          ? localizationByKey.get(home)?.display_name_en ?? home
          : (refreshed.provider_score.away ?? 0) > (refreshed.provider_score.home ?? 0)
            ? localizationByKey.get(away)?.display_name_en ?? away
            : "Draw"
        : "pending";

    return {
      fixture: `${localizationByKey.get(home)?.display_name_en ?? home} vs ${localizationByKey.get(away)?.display_name_en ?? away}`,
      official_match_number: scheduleMatch?.official_match_number ?? null,
      kickoff_at_utc: scheduleMatch?.scheduled_at_utc ?? replayInput.cutoffAt,
      canonical_home_team_key: home,
      canonical_away_team_key: away,
      pre_match: {
        home: replayInput.homeSignal,
        away: replayInput.awaySignal,
      },
      post_match_result: {
        scoreline,
        winner,
        source: historicalFact ? "historical_fact" : refreshed ? "api_football_refresh" : "pending",
      },
    };
  });
}

export async function runTask1_2(paths: PreparedPaths & { artifactDate: string }) {
  const datasets = loadTask1Datasets(paths);
  const providerFixtures = await fetchApiFootballFixturesByLeague({
    leagueId: 1,
    season: 2026,
  });
  const productInventory = await loadProductReplayInventory();
  const refreshPlan = reconcileFinishedFixtures({
    providerFixtures,
    scheduleRows: datasets.schedule,
    historicalFacts: datasets.historicalFacts,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
    productInventory,
  });
  const scheduleLinks = buildScheduleLinks(datasets.schedule, providerFixtures, datasets.aliases, datasets.localizations);
  const timeline = buildHistoricalEloTimeline({
    historicalFacts: datasets.historicalFacts,
    eloStart2026: datasets.eloStart2026,
    scheduleRows: datasets.schedule,
  });
  const timelineSummary = summarizeHistoricalEloTimeline(timeline);
  const coverage = buildTask1_2Coverage({
    productInventory,
    refreshPlan,
    scheduleRows: datasets.schedule,
    scheduleLinks,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
    historicalFacts: datasets.historicalFacts,
    eloCurrent: datasets.eloCurrent,
    eloStart2026: datasets.eloStart2026,
    fifaRanking: datasets.fifaRanking,
  });
  const evidencePreviews = buildTask1_2EvidencePreviews({
    fixtures: [
      { home: "germany", away: "curacao" },
      { home: "spain", away: "cape_verde" },
      { home: "brazil", away: "morocco" },
      { home: "germany", away: "ivory_coast" },
      { home: "ecuador", away: "curacao" },
    ],
    scheduleRows: datasets.schedule,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
    historicalFacts: datasets.historicalFacts,
    eloCurrent: datasets.eloCurrent,
    eloStart2026: datasets.eloStart2026,
    fifaRanking: datasets.fifaRanking,
    refreshPlan,
  });

  ensureDirectory(paths.artifactsDir);
  writeJson(path.join(paths.artifactsDir, "historical-elo-timeline-summary.json"), timelineSummary);
  writeJson(path.join(paths.artifactsDir, "elo-resolution-audit.json"), coverage.audit);
  writeJson(path.join(paths.artifactsDir, "replay-coverage-manifest.json"), coverage.manifest);
  writeJson(path.join(paths.artifactsDir, "replay-ready-input-samples.json"), coverage.samples);
  writeJson(path.join(paths.artifactsDir, "corrected-evidence-previews.json"), evidencePreviews);
  writeJson(path.join(paths.artifactsDir, "missing-signal-coverage.json"), coverage.missingCoverage);
  writeText(
    path.join(paths.artifactsDir, "README.txt"),
    [
      "Prediction Intelligence v2 Task 1.2 artifacts",
      `artifact_date=${paths.artifactDate}`,
      `timeline_entries=${timelineSummary.total_entries}`,
      `replay_ready=${coverage.manifest.filter((entry) => entry.replay_readiness === "ready").length}/${coverage.manifest.length}`,
    ].join("\n"),
  );

  return {
    datasets,
    refreshPlan,
    scheduleLinks,
    timelineSummary,
    manifest: coverage.manifest,
    audit: coverage.audit,
    missingCoverage: coverage.missingCoverage,
    samples: coverage.samples,
    evidencePreviews,
  };
}
