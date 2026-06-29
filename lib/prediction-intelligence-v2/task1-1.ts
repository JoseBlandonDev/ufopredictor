import fs from "node:fs";
import path from "node:path";

import type { ProviderFixture } from "../football-api/api-football-types";
import {
  buildPredictionIntelligenceV2ReplayInput,
  canonicalizeHistoricalFactForReplay,
  findOfficialScheduleMatchByTeams,
  loadTask1Datasets,
  type CanonicalTeamAlias,
  type CanonicalTeamLocalization,
  type HistoricalMatchFact,
  type PreparedPaths,
  type RatingSnapshotRow,
  type ScheduleFixtureLink,
  type WorldCupScheduleMatch,
} from "./task1";

const HISTORICAL_ARTIFACT_DATE = "2026-06-21";

type ProductMatchInventoryRow = {
  id: string;
  external_id: string;
  slug: string;
  kickoff_at: string;
  stage: string;
  status: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  intake_source: string;
};

type ProductPredictionInventoryRow = {
  id: string;
  match_id: string;
  prediction_type: string;
  created_at: string;
  run_scope: string;
};

type ProductResultInventoryRow = {
  match_id: string;
  home_goals: number;
  away_goals: number;
  verification_status: string;
  intake_source: string;
};

type ProductCompetitionRow = {
  id: string;
  slug: string;
  usage_scope: "public_product" | "internal_lab";
};

export type ProductReplayInventory = {
  competition: ProductCompetitionRow;
  matches: ProductMatchInventoryRow[];
  resultsByMatchId: Map<string, ProductResultInventoryRow>;
  originalPredictionByMatchId: Map<string, ProductPredictionInventoryRow>;
};

export type RefreshSourceMode = "web" | "api" | "prepared_seed" | "local_fallback";

export type FinishedFixtureReconciliation = {
  provider_fixture_id: number;
  external_id: string;
  official_match_number: number | null;
  kickoff_at_utc: string;
  canonical_home_team_key: string | null;
  canonical_away_team_key: string | null;
  provider_status: string;
  provider_score: {
    home: number | null;
    away: number | null;
  };
  product_match_id: string | null;
  known_historical_result: {
    scoreline: string;
    source_snapshot_id: string;
  } | null;
  product_result: {
    scoreline: string;
    verification_status: string;
  } | null;
  classification: "already_known_result" | "newly_discovered_result" | "score_or_status_correction" | "unresolved_finished_fixture";
  note: string;
};

export type CompletedFixtureRefreshPlan = {
  completed_fixtures_discovered: number;
  already_known_results: FinishedFixtureReconciliation[];
  newly_discovered_results: FinishedFixtureReconciliation[];
  score_or_status_corrections: FinishedFixtureReconciliation[];
  unresolved_finished_fixtures: FinishedFixtureReconciliation[];
};

export type OfficialScheduleLinkClassificationEntry = {
  official_match_number: number;
  stage_key: string;
  group_key: string | null;
  home_team_key: string | null;
  away_team_key: string | null;
  scheduled_at_utc: string;
  provider_fixture_id: number | null;
  classification:
    | "linked"
    | "knockout_placeholder"
    | "future_not_yet_present_in_api"
    | "group_stage_provider_gap"
    | "identity_linking_defect";
  note: string;
};

export type OfficialScheduleLinkClassification = {
  totals: {
    all_matches: number;
    linked: number;
    knockout_placeholders: number;
    future_not_yet_present_in_api: number;
    group_stage_provider_gap: number;
    identity_linking_defect: number;
  };
  group_stage: {
    total: number;
    linked: number;
    unresolved: number;
  };
  entries: OfficialScheduleLinkClassificationEntry[];
};

export type LiveSourceRefreshValidationEntry = {
  source: "elo_current" | "elo_latest_results" | "elo_fixtures" | "fifa_men_ranking";
  live_extraction_status: "supported" | "unsupported";
  row_count: number;
  latest_effective_date: string | null;
  changed_rows: number | null;
  fallback_used: RefreshSourceMode | null;
  chosen_mode: RefreshSourceMode;
  failure_reason: string | null;
};

export type ReplayCoverageManifestEntry = {
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
  fifa_coverage: "ready" | "missing";
  replay_readiness: "ready" | "blocked";
  blocker: string | null;
};

export type CorrectedEvidencePreview = {
  fixture: string;
  official_match_number: number | null;
  cutoff_at_utc: string;
  canonical_home_team_key: string;
  canonical_away_team_key: string;
  actual_result: {
    scoreline: string;
    winner: string;
    source: "historical_fact" | "api_football_refresh" | "pending";
  };
  home_signal: ReturnType<typeof buildPredictionIntelligenceV2ReplayInput>["homeSignal"];
  away_signal: ReturnType<typeof buildPredictionIntelligenceV2ReplayInput>["awaySignal"];
};

export type Task11HistoricalReference = {
  refreshPlan: CompletedFixtureRefreshPlan;
  classification: OfficialScheduleLinkClassification;
  liveValidation: LiveSourceRefreshValidationEntry[];
  replayCoverageManifest: ReplayCoverageManifestEntry[];
  correctedEvidencePreviews: CorrectedEvidencePreview[];
  readme: string;
};

export type Task11Paths = PreparedPaths & {
  artifactDate: string;
  historicalReferenceDir: string;
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

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function readText(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function parseApiFootballFixtureId(externalId: string | null): number | null {
  if (!externalId) {
    return null;
  }

  const match = /^api-football:fixture:(\d+)$/.exec(externalId);
  return match ? Number(match[1]) : null;
}

function buildFixtureExternalId(fixtureId: number): string {
  return `api-football:fixture:${fixtureId}`;
}

function buildLocalizationIndex(localizations: CanonicalTeamLocalization[]): Map<string, CanonicalTeamLocalization> {
  return new Map(localizations.map((localization) => [localization.canonical_team_key, localization]));
}

function findCanonicalHistoricalFactForScheduleMatch(
  historicalFacts: HistoricalMatchFact[],
  scheduleMatch: WorldCupScheduleMatch,
  scheduleRows: WorldCupScheduleMatch[],
): HistoricalMatchFact | null {
  const candidates = historicalFacts
    .map((fact) => canonicalizeHistoricalFactForReplay(fact, scheduleRows))
    .filter(
      (fact) =>
        fact.match_date === scheduleMatch.scheduled_date_et &&
        fact.team_1_key === scheduleMatch.home_team_key &&
        fact.team_2_key === scheduleMatch.away_team_key,
    );

  return candidates[0] ?? null;
}

export function buildScheduleLinksFromClassification(
  classification: OfficialScheduleLinkClassification,
): ScheduleFixtureLink[] {
  return classification.entries.map((entry) => ({
    official_match_number: entry.official_match_number,
    provider_fixture_id: entry.provider_fixture_id,
    provider_status: entry.classification === "linked" ? "historical_reference" : null,
    linked_by: entry.classification === "linked" ? "preserved_historical_reference" : "unresolved",
  }));
}

export function buildHistoricalProductReplayInventory(
  replayCoverageManifest: ReplayCoverageManifestEntry[],
  refreshPlan: CompletedFixtureRefreshPlan,
  scheduleRows: WorldCupScheduleMatch[],
): ProductReplayInventory {
  const refreshedResults = new Map<string, FinishedFixtureReconciliation>();
  for (const entry of [
    ...refreshPlan.already_known_results,
    ...refreshPlan.newly_discovered_results,
    ...refreshPlan.score_or_status_corrections,
    ...refreshPlan.unresolved_finished_fixtures,
  ]) {
    if (entry.product_match_id) {
      refreshedResults.set(entry.product_match_id, entry);
    }
  }

  const matches = replayCoverageManifest.map((entry) => {
    const scheduleMatch =
      entry.official_match_number != null
        ? scheduleRows.find((row) => row.official_match_number === entry.official_match_number) ?? null
        : null;

    return {
      id: entry.product_match_id,
      external_id:
        entry.api_football_fixture_id != null
          ? buildFixtureExternalId(entry.api_football_fixture_id)
          : `historical-missing-fixture:${entry.product_match_id}`,
      slug: `historical-replay-${entry.product_match_id}`,
      kickoff_at: entry.kickoff_utc,
      stage: scheduleMatch?.stage_key ?? "historical_reference",
      status: entry.result_availability === "available" ? "finished" : "scheduled",
      competition_id: "historical-world-cup-2026",
      home_team_id: entry.canonical_home_team_key ?? "unknown-home-team",
      away_team_id: entry.canonical_away_team_key ?? "unknown-away-team",
      intake_source: "api_football",
    } satisfies ProductMatchInventoryRow;
  });

  const resultsByMatchId = new Map<string, ProductResultInventoryRow>();
  for (const match of matches) {
    const refreshed = refreshedResults.get(match.id);
    if (!refreshed?.product_result) {
      continue;
    }

    const [homeGoals, awayGoals] = refreshed.product_result.scoreline.split("-").map((value) => Number(value));
    resultsByMatchId.set(match.id, {
      match_id: match.id,
      home_goals: homeGoals,
      away_goals: awayGoals,
      verification_status: refreshed.product_result.verification_status,
      intake_source: "api_football",
    });
  }

  const originalPredictionByMatchId = new Map<string, ProductPredictionInventoryRow>();
  for (const entry of replayCoverageManifest) {
    originalPredictionByMatchId.set(entry.product_match_id, {
      id: entry.original_prediction_version_id,
      match_id: entry.product_match_id,
      prediction_type: "pre_kickoff",
      created_at: entry.kickoff_utc,
      run_scope: "public_product",
    });
  }

  return {
    competition: {
      id: "historical-world-cup-2026",
      slug: "world-cup-2026",
      usage_scope: "public_product",
    },
    matches,
    resultsByMatchId,
    originalPredictionByMatchId,
  };
}

export function classifyOfficialScheduleLinks(input: {
  scheduleRows: WorldCupScheduleMatch[];
  scheduleLinks: ScheduleFixtureLink[];
  providerFixtures: ProviderFixture[];
}): OfficialScheduleLinkClassification {
  const entries: OfficialScheduleLinkClassificationEntry[] = input.scheduleRows.map((row) => {
    const link = input.scheduleLinks.find((entry) => entry.official_match_number === row.official_match_number) ?? null;
    if (link?.provider_fixture_id != null) {
      return {
        official_match_number: row.official_match_number,
        stage_key: row.stage_key,
        group_key: row.group_key || null,
        home_team_key: row.home_team_key || null,
        away_team_key: row.away_team_key || null,
        scheduled_at_utc: row.scheduled_at_utc,
        provider_fixture_id: link.provider_fixture_id,
        classification: "linked" as const,
        note: `linked_by=${link.linked_by}`,
      };
    }

    if (!row.home_team_key || !row.away_team_key) {
      return {
        official_match_number: row.official_match_number,
        stage_key: row.stage_key,
        group_key: row.group_key || null,
        home_team_key: row.home_team_key || null,
        away_team_key: row.away_team_key || null,
        scheduled_at_utc: row.scheduled_at_utc,
        provider_fixture_id: null,
        classification: "knockout_placeholder" as const,
        note: "teams_not_known_yet",
      };
    }

    const classification: OfficialScheduleLinkClassificationEntry["classification"] =
      row.stage_key === "group_stage" ? "group_stage_provider_gap" : "future_not_yet_present_in_api";

    return {
      official_match_number: row.official_match_number,
      stage_key: row.stage_key,
      group_key: row.group_key || null,
      home_team_key: row.home_team_key || null,
      away_team_key: row.away_team_key || null,
      scheduled_at_utc: row.scheduled_at_utc,
      provider_fixture_id: null,
      classification,
      note:
        row.stage_key === "group_stage"
          ? "provider_missing_known_group_stage_fixture"
          : "provider_has_not_published_fixture_yet",
    };
  });

  const totals = {
    all_matches: entries.length,
    linked: entries.filter((entry) => entry.classification === "linked").length,
    knockout_placeholders: entries.filter((entry) => entry.classification === "knockout_placeholder").length,
    future_not_yet_present_in_api: entries.filter((entry) => entry.classification === "future_not_yet_present_in_api").length,
    group_stage_provider_gap: entries.filter((entry) => entry.classification === "group_stage_provider_gap").length,
    identity_linking_defect: entries.filter((entry) => entry.classification === "identity_linking_defect").length,
  };

  const groupStageEntries = entries.filter((entry) => entry.stage_key === "group_stage");

  return {
    totals,
    group_stage: {
      total: groupStageEntries.length,
      linked: groupStageEntries.filter((entry) => entry.classification === "linked").length,
      unresolved: groupStageEntries.filter((entry) => entry.classification !== "linked").length,
    },
    entries,
  };
}

export function reconcileFinishedFixtures(input: {
  providerFixtures: ProviderFixture[];
  scheduleRows: WorldCupScheduleMatch[];
  historicalFacts: HistoricalMatchFact[];
  productInventory: ProductReplayInventory;
}): CompletedFixtureRefreshPlan {
  const finishedFixtures = input.providerFixtures.filter(
    (fixture) => fixture.status === "finished" || fixture.statusShort === "FT" || fixture.statusShort === "AET" || fixture.statusShort === "PEN",
  );

  const reconciliations = finishedFixtures.map((fixture) => {
    const externalId = buildFixtureExternalId(fixture.providerFixtureId);
    const scheduleMatch = input.scheduleRows.find(
      (row) =>
        row.scheduled_at_utc === fixture.kickoffAt &&
        row.home_team_key != null &&
        row.away_team_key != null &&
        row.home_team_key === row.home_team_key &&
        row.away_team_key === row.away_team_key,
    ) ?? null;
    const matchedSchedule =
      scheduleMatch ??
      input.scheduleRows.find(
        (row) =>
          row.home_team_key != null &&
          row.away_team_key != null &&
          row.scheduled_at_utc === fixture.kickoffAt,
      ) ??
      null;
    const historicalFact = matchedSchedule
      ? findCanonicalHistoricalFactForScheduleMatch(input.historicalFacts, matchedSchedule, input.scheduleRows)
      : null;
    const productMatch = input.productInventory.matches.find((match) => match.external_id === externalId) ?? null;
    const productResult = productMatch ? input.productInventory.resultsByMatchId.get(productMatch.id) ?? null : null;

    const providerScoreline = `${fixture.goals.home ?? "?"}-${fixture.goals.away ?? "?"}`;
    const historicalScoreline = historicalFact ? `${historicalFact.score_1}-${historicalFact.score_2}` : null;
    const productScoreline = productResult ? `${productResult.home_goals}-${productResult.away_goals}` : null;

    let classification: FinishedFixtureReconciliation["classification"] = "already_known_result";
    let note = "historical fact already covers the completed provider fixture.";

    if (!matchedSchedule) {
      classification = "unresolved_finished_fixture";
      note = "completed provider fixture could not be reconciled to the official schedule.";
    } else if (!historicalFact) {
      classification = "newly_discovered_result";
      note = "completed provider fixture is missing from the prepared historical fact seed.";
    } else if (historicalScoreline !== providerScoreline || (productScoreline && productScoreline !== providerScoreline)) {
      classification = "score_or_status_correction";
      note = "provider result differs from the seeded or product-tracked finished result.";
    }

    return {
      provider_fixture_id: fixture.providerFixtureId,
      external_id: externalId,
      official_match_number: matchedSchedule?.official_match_number ?? null,
      kickoff_at_utc: fixture.kickoffAt,
      canonical_home_team_key: matchedSchedule?.home_team_key ?? null,
      canonical_away_team_key: matchedSchedule?.away_team_key ?? null,
      provider_status: fixture.statusShort,
      provider_score: {
        home: fixture.goals.home,
        away: fixture.goals.away,
      },
      product_match_id: productMatch?.id ?? null,
      known_historical_result: historicalFact
        ? { scoreline: historicalScoreline ?? "", source_snapshot_id: historicalFact.source_snapshot_id }
        : null,
      product_result: productResult
        ? {
            scoreline: productScoreline ?? "",
            verification_status: productResult.verification_status,
          }
        : null,
      classification,
      note,
    };
  });

  return {
    completed_fixtures_discovered: finishedFixtures.length,
    already_known_results: reconciliations.filter((entry) => entry.classification === "already_known_result"),
    newly_discovered_results: reconciliations.filter((entry) => entry.classification === "newly_discovered_result"),
    score_or_status_corrections: reconciliations.filter((entry) => entry.classification === "score_or_status_correction"),
    unresolved_finished_fixtures: reconciliations.filter((entry) => entry.classification === "unresolved_finished_fixture"),
  };
}

export function buildReplayCoverageManifest(input: {
  productInventory: ProductReplayInventory;
  scheduleRows: WorldCupScheduleMatch[];
  scheduleLinks: ScheduleFixtureLink[];
  refreshPlan: CompletedFixtureRefreshPlan;
  aliases: CanonicalTeamAlias[];
  localizations: CanonicalTeamLocalization[];
  historicalFacts: HistoricalMatchFact[];
  eloCurrent: RatingSnapshotRow[];
  eloStart2026: RatingSnapshotRow[];
  fifaRanking: RatingSnapshotRow[];
}): ReplayCoverageManifestEntry[] {
  const refreshByFixtureId = new Map<number, FinishedFixtureReconciliation>();
  for (const entry of [
    ...input.refreshPlan.already_known_results,
    ...input.refreshPlan.newly_discovered_results,
    ...input.refreshPlan.score_or_status_corrections,
    ...input.refreshPlan.unresolved_finished_fixtures,
  ]) {
    refreshByFixtureId.set(entry.provider_fixture_id, entry);
  }

  return input.productInventory.matches
    .filter((match) => input.productInventory.originalPredictionByMatchId.has(match.id))
    .filter((match) => {
      const fixtureId = parseApiFootballFixtureId(match.external_id);
      return fixtureId != null && refreshByFixtureId.has(fixtureId);
    })
    .map((match) => {
      const fixtureId = parseApiFootballFixtureId(match.external_id);
      const scheduleLink = input.scheduleLinks.find((link) => link.provider_fixture_id === fixtureId) ?? null;
      const scheduleMatch =
        scheduleLink != null
          ? input.scheduleRows.find((row) => row.official_match_number === scheduleLink.official_match_number) ?? null
          : null;
      const originalPrediction = input.productInventory.originalPredictionByMatchId.get(match.id);
      const refreshedResult = fixtureId != null ? refreshByFixtureId.get(fixtureId) ?? null : null;

      const canonicalHomeTeamKey = scheduleMatch?.home_team_key ?? null;
      const canonicalAwayTeamKey = scheduleMatch?.away_team_key ?? null;

      const replayInput =
        canonicalHomeTeamKey && canonicalAwayTeamKey && scheduleMatch && originalPrediction
          ? buildPredictionIntelligenceV2ReplayInput({
              cutoffAt: scheduleMatch.scheduled_at_utc,
              homeTeamKey: canonicalHomeTeamKey,
              awayTeamKey: canonicalAwayTeamKey,
              historicalFacts: input.historicalFacts,
              aliases: input.aliases,
              eloCurrent: input.eloCurrent,
              eloStart2026: input.eloStart2026,
              fifaRanking: input.fifaRanking,
              localizations: input.localizations,
              schedule: input.scheduleRows,
            })
          : null;

      const resultAvailability: ReplayCoverageManifestEntry["result_availability"] = refreshedResult ? "available" : "missing";
      const evidenceCoverage: ReplayCoverageManifestEntry["evidence_coverage"] = replayInput ? "ready" : "missing";
      const eloCoverage: ReplayCoverageManifestEntry["elo_coverage"] =
        replayInput &&
        replayInput.homeSignal.structural_strength.current_elo != null &&
        replayInput.awaySignal.structural_strength.current_elo != null
          ? "ready"
          : "missing";
      const fifaCoverage: ReplayCoverageManifestEntry["fifa_coverage"] =
        replayInput &&
        replayInput.homeSignal.structural_strength.fifa_points != null &&
        replayInput.awaySignal.structural_strength.fifa_points != null
          ? "ready"
          : "missing";

      const blockers = [
        scheduleMatch == null ? "missing_official_schedule_match" : null,
        refreshedResult == null ? "missing_finished_result" : null,
        evidenceCoverage !== "ready" ? "missing_replay_evidence" : null,
        eloCoverage !== "ready" ? "missing_elo_snapshot" : null,
        fifaCoverage !== "ready" ? "missing_fifa_snapshot" : null,
      ].filter((value): value is string => value != null);

      const replayReadiness: ReplayCoverageManifestEntry["replay_readiness"] = blockers.length === 0 ? "ready" : "blocked";

      return {
        product_match_id: match.id,
        api_football_fixture_id: fixtureId,
        official_match_number: scheduleMatch?.official_match_number ?? null,
        canonical_home_team_key: canonicalHomeTeamKey,
        canonical_away_team_key: canonicalAwayTeamKey,
        kickoff_utc: scheduleMatch?.scheduled_at_utc ?? match.kickoff_at,
        original_prediction_version_id: originalPrediction?.id ?? "",
        result_availability: resultAvailability,
        evidence_coverage: evidenceCoverage,
        elo_coverage: eloCoverage,
        fifa_coverage: fifaCoverage,
        replay_readiness: replayReadiness,
        blocker: blockers[0] ?? null,
      };
    })
    .sort((left, right) => left.kickoff_utc.localeCompare(right.kickoff_utc));
}

export function buildCorrectedEvidencePreviews(input: {
  fixtures: Array<{ home: string; away: string }>;
  scheduleRows: WorldCupScheduleMatch[];
  aliases: CanonicalTeamAlias[];
  localizations: CanonicalTeamLocalization[];
  historicalFacts: HistoricalMatchFact[];
  eloCurrent: RatingSnapshotRow[];
  eloStart2026: RatingSnapshotRow[];
  fifaRanking: RatingSnapshotRow[];
  refreshPlan: CompletedFixtureRefreshPlan;
}): CorrectedEvidencePreview[] {
  const refreshByMatchNumber = new Map<number, FinishedFixtureReconciliation>();
  for (const entry of [
    ...input.refreshPlan.already_known_results,
    ...input.refreshPlan.newly_discovered_results,
    ...input.refreshPlan.score_or_status_corrections,
  ]) {
    if (entry.official_match_number != null) {
      refreshByMatchNumber.set(entry.official_match_number, entry);
    }
  }

  const localizationsByKey = buildLocalizationIndex(input.localizations);

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
    const historicalFact = scheduleMatch
      ? findCanonicalHistoricalFactForScheduleMatch(input.historicalFacts, scheduleMatch, input.scheduleRows)
      : null;
    const actualResult = historicalFact
      ? {
          scoreline: `${historicalFact.score_1}-${historicalFact.score_2}`,
          winner:
            historicalFact.score_1 > historicalFact.score_2
              ? historicalFact.team_1_name_raw
              : historicalFact.score_2 > historicalFact.score_1
                ? historicalFact.team_2_name_raw
                : "Draw",
          source: "historical_fact" as const,
        }
      : refreshed
        ? {
            scoreline: `${refreshed.provider_score.home}-${refreshed.provider_score.away}`,
            winner:
              (refreshed.provider_score.home ?? 0) > (refreshed.provider_score.away ?? 0)
                ? localizationsByKey.get(home)?.display_name_en ?? home
                : (refreshed.provider_score.away ?? 0) > (refreshed.provider_score.home ?? 0)
                  ? localizationsByKey.get(away)?.display_name_en ?? away
                  : "Draw",
            source: "api_football_refresh" as const,
          }
        : {
            scoreline: "pending",
            winner: "pending",
            source: "pending" as const,
          };

    return {
      fixture: `${localizationsByKey.get(home)?.display_name_en ?? home} vs ${localizationsByKey.get(away)?.display_name_en ?? away}`,
      official_match_number: scheduleMatch?.official_match_number ?? null,
      cutoff_at_utc: scheduleMatch?.scheduled_at_utc ?? replayInput.cutoffAt,
      canonical_home_team_key: home,
      canonical_away_team_key: away,
      actual_result: actualResult,
      home_signal: replayInput.homeSignal,
      away_signal: replayInput.awaySignal,
    };
  });
}

export function loadHistoricalTask11Reference(referenceDir: string): Task11HistoricalReference {
  return {
    readme: readText(path.join(referenceDir, "README.txt")),
    refreshPlan: readJson<CompletedFixtureRefreshPlan>(path.join(referenceDir, "completed-fixture-refresh-plan.json")),
    correctedEvidencePreviews: readJson<CorrectedEvidencePreview[]>(path.join(referenceDir, "corrected-evidence-previews.json")),
    liveValidation: readJson<LiveSourceRefreshValidationEntry[]>(path.join(referenceDir, "live-source-refresh-validation.json")),
    classification: readJson<OfficialScheduleLinkClassification>(path.join(referenceDir, "official-schedule-link-classification.json")),
    replayCoverageManifest: readJson<ReplayCoverageManifestEntry[]>(path.join(referenceDir, "replay-coverage-manifest.json")),
  };
}

function validateHistoricalReferenceAgainstCurrentDatasets(input: {
  scheduleRows: WorldCupScheduleMatch[];
  reference: Task11HistoricalReference;
}): void {
  const scheduleByNumber = new Map(input.scheduleRows.map((row) => [row.official_match_number, row]));

  if (input.reference.classification.entries.length !== input.scheduleRows.length) {
    throw new Error("Historical Task 1.1 classification entry count no longer matches the prepared official schedule.");
  }

  for (const entry of input.reference.classification.entries) {
    const scheduleMatch = scheduleByNumber.get(entry.official_match_number);
    if (!scheduleMatch) {
      throw new Error(`Historical Task 1.1 classification references unknown match ${entry.official_match_number}.`);
    }
  }

  for (const entry of input.reference.replayCoverageManifest) {
    if (entry.official_match_number == null) {
      continue;
    }

    const scheduleMatch = scheduleByNumber.get(entry.official_match_number);
    if (!scheduleMatch) {
      throw new Error(`Historical replay manifest references unknown match ${entry.official_match_number}.`);
    }

    if (
      entry.canonical_home_team_key != null &&
      scheduleMatch.home_team_key != null &&
      entry.canonical_home_team_key !== scheduleMatch.home_team_key
    ) {
      throw new Error(`Historical replay manifest home team mismatch at match ${entry.official_match_number}.`);
    }

    if (
      entry.canonical_away_team_key != null &&
      scheduleMatch.away_team_key != null &&
      entry.canonical_away_team_key !== scheduleMatch.away_team_key
    ) {
      throw new Error(`Historical replay manifest away team mismatch at match ${entry.official_match_number}.`);
    }
  }
}

export function assertTask11LocalOnlyPreflight(paths: Task11Paths): void {
  if (!fs.existsSync(paths.preparedDir)) {
    throw new Error(`Prepared V2 workspace not found: ${paths.preparedDir}`);
  }

  if (!fs.existsSync(paths.historicalReferenceDir)) {
    throw new Error(`Historical Task 1.1 reference directory not found: ${paths.historicalReferenceDir}`);
  }

  if (path.normalize(paths.artifactsDir).includes(path.join("task1-1", HISTORICAL_ARTIFACT_DATE))) {
    throw new Error(
      `Task 1.1 local run refused because artifactsDir points at the preserved historical evidence path (${HISTORICAL_ARTIFACT_DATE}).`,
    );
  }
}

export async function runTask1_1(paths: Task11Paths) {
  assertTask11LocalOnlyPreflight(paths);

  const datasets = loadTask1Datasets(paths);
  const reference = loadHistoricalTask11Reference(paths.historicalReferenceDir);
  validateHistoricalReferenceAgainstCurrentDatasets({
    scheduleRows: datasets.schedule,
    reference,
  });

  const scheduleLinks = buildScheduleLinksFromClassification(reference.classification);
  const classification = classifyOfficialScheduleLinks({
    scheduleRows: datasets.schedule,
    scheduleLinks,
    providerFixtures: [],
  });
  const productInventory = buildHistoricalProductReplayInventory(
    reference.replayCoverageManifest,
    reference.refreshPlan,
    datasets.schedule,
  );
  const replayCoverageManifest = buildReplayCoverageManifest({
    productInventory,
    scheduleRows: datasets.schedule,
    scheduleLinks,
    refreshPlan: reference.refreshPlan,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
    historicalFacts: datasets.historicalFacts,
    eloCurrent: datasets.eloCurrent,
    eloStart2026: datasets.eloStart2026,
    fifaRanking: datasets.fifaRanking,
  });
  const correctedEvidencePreviews = buildCorrectedEvidencePreviews({
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
    refreshPlan: reference.refreshPlan,
  });

  ensureDirectory(paths.artifactsDir);
  writeJson(path.join(paths.artifactsDir, "completed-fixture-refresh-plan.json"), reference.refreshPlan);
  writeJson(path.join(paths.artifactsDir, "official-schedule-link-classification.json"), classification);
  writeJson(path.join(paths.artifactsDir, "live-source-refresh-validation.json"), reference.liveValidation);
  writeJson(path.join(paths.artifactsDir, "replay-coverage-manifest.json"), replayCoverageManifest);
  writeJson(path.join(paths.artifactsDir, "corrected-evidence-previews.json"), correctedEvidencePreviews);
  writeText(
    path.join(paths.artifactsDir, "README.txt"),
    [
      "Prediction Intelligence v2 Task 1.1 artifacts",
      `artifact_date=${paths.artifactDate}`,
      `completed_fixtures_discovered=${reference.refreshPlan.completed_fixtures_discovered}`,
      `group_stage_links=${classification.group_stage.linked}/${classification.group_stage.total}`,
      `live_adapter_supported=${reference.liveValidation.filter((entry) => entry.live_extraction_status === "supported").length}`,
      "mode=local_reference_validation",
    ].join("\n"),
  );

  return {
    datasets,
    reference,
    classification,
    replayCoverageManifest,
    correctedEvidencePreviews,
    scheduleLinks,
  };
}
