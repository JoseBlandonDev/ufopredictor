import fs from "node:fs";
import path from "node:path";

import { fetchApiFootballFixturesByLeague } from "../football-api/api-football-client.ts";
import type { ProviderFixture } from "../football-api/api-football-types.ts";
import { createSupabaseScriptAdminClient } from "../supabase/script-admin.ts";
import type { MatchResultRow, MatchRow, PredictionVersionRow, TeamRow } from "../../types/database";
import {
  buildPredictionIntelligenceV2ReplayInput,
  canonicalizeHistoricalFactForReplay,
  findOfficialScheduleMatchByTeams,
  loadTask1Datasets,
  matchProviderFixture,
  type CanonicalTeamAlias,
  type CanonicalTeamLocalization,
  type HistoricalMatchFact,
  type PreparedPaths,
  type RatingSnapshotRow,
  type ScheduleFixtureLink,
  type WorldCupScheduleMatch,
} from "./task1.ts";

type ProductMatchInventoryRow = Pick<
  MatchRow,
  "id" | "external_id" | "slug" | "kickoff_at" | "stage" | "status" | "competition_id" | "home_team_id" | "away_team_id" | "intake_source"
>;

type ProductPredictionInventoryRow = Pick<
  PredictionVersionRow,
  "id" | "match_id" | "prediction_type" | "created_at" | "run_scope"
>;

type ProductResultInventoryRow = Pick<
  MatchResultRow,
  "match_id" | "home_goals" | "away_goals" | "verification_status" | "intake_source"
>;

type ProductCompetitionRow = {
  id: string;
  slug: string;
  usage_scope: "public_product" | "internal_lab";
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

type ProductReplayInventory = {
  competition: ProductCompetitionRow;
  matches: ProductMatchInventoryRow[];
  teamsById: Map<string, Pick<TeamRow, "id" | "name" | "slug" | "external_id">>;
  resultsByMatchId: Map<string, ProductResultInventoryRow>;
  originalPredictionByMatchId: Map<string, ProductPredictionInventoryRow>;
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

function buildFixtureExternalId(fixtureId: number): string {
  return `api-football:fixture:${fixtureId}`;
}

function isFinishedStatus(status: ProviderFixture["status"] | string): boolean {
  return status === "finished" || status === "FT" || status === "AET" || status === "PEN";
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

function findScheduleMatchForProviderFixture(
  fixture: ProviderFixture,
  scheduleRows: WorldCupScheduleMatch[],
  aliasesByTeam: Map<string, string[]>,
  localizationsByTeam: Map<string, CanonicalTeamLocalization>,
): WorldCupScheduleMatch | null {
  const matched = scheduleRows.find((row) => {
    const link = matchProviderFixture(row, [fixture], aliasesByTeam, localizationsByTeam);
    return link.provider_fixture_id === fixture.providerFixtureId;
  });
  return matched ?? null;
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

export function classifyOfficialScheduleLinks(input: {
  scheduleRows: WorldCupScheduleMatch[];
  scheduleLinks: ScheduleFixtureLink[];
  providerFixtures: ProviderFixture[];
  aliases?: CanonicalTeamAlias[];
  localizations?: CanonicalTeamLocalization[];
}): OfficialScheduleLinkClassification {
  const aliasesByTeam = input.aliases ? buildAliasIndex(input.aliases) : new Map<string, string[]>();
  const localizationsByTeam = input.localizations ? buildLocalizationIndex(input.localizations) : new Map<string, CanonicalTeamLocalization>();

  const entries = input.scheduleRows.map((row) => {
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

    const providerTeamPair = input.providerFixtures.filter((fixture) => {
      const matched = matchProviderFixture(
        row,
        [fixture],
        aliasesByTeam,
        localizationsByTeam,
      );

      return matched.provider_fixture_id === fixture.providerFixtureId;
    });

    if (providerTeamPair.length === 0) {
      return {
        official_match_number: row.official_match_number,
        stage_key: row.stage_key,
        group_key: row.group_key || null,
        home_team_key: row.home_team_key || null,
        away_team_key: row.away_team_key || null,
        scheduled_at_utc: row.scheduled_at_utc,
        provider_fixture_id: null,
        classification: row.stage_key === "group_stage" ? "group_stage_provider_gap" : "future_not_yet_present_in_api",
        note: row.stage_key === "group_stage" ? "provider_missing_known_group_stage_fixture" : "provider_has_not_published_fixture_yet",
      };
    }

    return {
      official_match_number: row.official_match_number,
      stage_key: row.stage_key,
      group_key: row.group_key || null,
      home_team_key: row.home_team_key || null,
      away_team_key: row.away_team_key || null,
      scheduled_at_utc: row.scheduled_at_utc,
      provider_fixture_id: providerTeamPair[0]?.providerFixtureId ?? null,
      classification: "identity_linking_defect" as const,
      note: "provider_fixture_exists_but_required_fallback_linking_did_not_resolve",
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
  aliases: CanonicalTeamAlias[];
  localizations: CanonicalTeamLocalization[];
  productInventory: ProductReplayInventory;
}): CompletedFixtureRefreshPlan {
  const finishedFixtures = input.providerFixtures.filter((fixture) => isFinishedStatus(fixture.status));
  const aliasesByTeam = buildAliasIndex(input.aliases);
  const localizationsByTeam = buildLocalizationIndex(input.localizations);

  const reconciliations = finishedFixtures.map((fixture) => {
    const externalId = buildFixtureExternalId(fixture.providerFixtureId);
    const scheduleMatch = findScheduleMatchForProviderFixture(
      fixture,
      input.scheduleRows,
      aliasesByTeam,
      localizationsByTeam,
    );
    const historicalFact = scheduleMatch
      ? findCanonicalHistoricalFactForScheduleMatch(input.historicalFacts, scheduleMatch, input.scheduleRows)
      : null;
    const productMatch = input.productInventory.matches.find((match) => match.external_id === externalId) ?? null;
    const productResult = productMatch ? input.productInventory.resultsByMatchId.get(productMatch.id) ?? null : null;

    const providerScoreline = `${fixture.goals.home ?? "?"}-${fixture.goals.away ?? "?"}`;
    const historicalScoreline = historicalFact ? `${historicalFact.score_1}-${historicalFact.score_2}` : null;
    const productScoreline = productResult ? `${productResult.home_goals}-${productResult.away_goals}` : null;

    let classification: FinishedFixtureReconciliation["classification"] = "already_known_result";
    let note = "historical fact already covers the completed provider fixture.";

    if (!scheduleMatch) {
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
      official_match_number: scheduleMatch?.official_match_number ?? null,
      kickoff_at_utc: fixture.kickoffAt,
      canonical_home_team_key: scheduleMatch?.home_team_key ?? null,
      canonical_away_team_key: scheduleMatch?.away_team_key ?? null,
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

function parseSimpleCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentField += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (!insideQuotes && character === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (!insideQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentField = "";
      currentRow = [];
      continue;
    }

    currentField += character;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  const [header = [], ...dataRows] = rows;
  return dataRows
    .filter((row) => row.some((value) => value.trim().length > 0))
    .map((row) =>
      Object.fromEntries(
        header.map((key, index) => [key, row[index] ?? ""]),
      ),
    );
}

async function tryFetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      "user-agent": "ufo-predictor-codex-task1-1/1.0",
      accept: "text/html,application/json,text/plain,*/*",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.text();
}

function countChangedRowsByCanonicalKey(
  liveRows: Array<Record<string, string>>,
  seedRows: Array<Record<string, string>>,
  keyField: string,
  compareField: string,
): number {
  const seedByKey = new Map(seedRows.map((row) => [row[keyField], row[compareField]]));
  let changed = 0;
  for (const row of liveRows) {
    if (seedByKey.get(row[keyField]) !== row[compareField]) {
      changed += 1;
    }
  }
  return changed;
}

export async function validateLiveSources(paths: PreparedPaths): Promise<LiveSourceRefreshValidationEntry[]> {
  const preparedDir = paths.preparedDir;
  const rawDir = paths.rawSnapshotDir;

  const validations: LiveSourceRefreshValidationEntry[] = [];

  for (const source of [
    {
      key: "elo_current" as const,
      url: "https://eloratings.net/",
      fallbackMode: "prepared_seed" as const,
      fallbackPath: path.join(preparedDir, "normalized-snapshot", "elo-ranking-2026-06-20.csv"),
      latestEffectiveDate: "2026-06-20",
      failureReason: "Static fetch returned only the public shell and did not expose ranking rows or a stable payload.",
    },
    {
      key: "elo_latest_results" as const,
      url: "https://eloratings.net/latest",
      fallbackMode: "local_fallback" as const,
      fallbackPath: path.join(rawDir, "results.html"),
      latestEffectiveDate: "2026-06-20",
      failureReason: "Static fetch returned only the public shell and did not expose rendered result rows.",
    },
    {
      key: "elo_fixtures" as const,
      url: "https://eloratings.net/fixtures",
      fallbackMode: "local_fallback" as const,
      fallbackPath: path.join(rawDir, "Fix.html"),
      latestEffectiveDate: "2026-06-20",
      failureReason: "Static fetch returned only the public shell and did not expose rendered fixture expectancy rows.",
    },
    {
      key: "fifa_men_ranking" as const,
      url: "https://inside.fifa.com/es/fifa-world-ranking/men",
      fallbackMode: "prepared_seed" as const,
      fallbackPath: path.join(preparedDir, "normalized-snapshot", "fifa-ranking-2026-06-11-captured-2026-06-20.csv"),
      latestEffectiveDate: "2026-06-11",
      failureReason: "The live page exposes metadata and top cards via __NEXT_DATA__, but not the full ranking rows without a deeper client-only fetch path.",
    },
  ]) {
    let rowCount = 0;
    let liveRows: Array<Record<string, string>> = [];
    let chosenMode: RefreshSourceMode = "web";
    let fallbackUsed: RefreshSourceMode | null = null;
    let status: "supported" | "unsupported" = "unsupported";
    let failureReason: string | null = source.failureReason;

    try {
      const text = await tryFetchText(source.url);
      if (source.key === "fifa_men_ranking") {
        const nextData = text.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (nextData) {
          const parsed = JSON.parse(nextData[1]) as {
            props?: { pageProps?: { pageData?: { ranking?: { boldCards?: Array<Record<string, unknown>>; lastUpdateDate?: string } } } };
          };
          const cards = parsed.props?.pageProps?.pageData?.ranking?.boldCards ?? [];
          rowCount = cards.length;
          liveRows = cards.map((card) => ({
            canonical_team_key: String(card.countryName ?? ""),
            rating_or_points: String(card.cardValue ?? ""),
          }));
        }
      } else if (text.includes("slick-row")) {
        rowCount = (text.match(/slick-row/g) ?? []).length;
      }

      if (rowCount > 0 && source.key === "fifa_men_ranking") {
        status = "unsupported";
        chosenMode = source.fallbackMode;
        fallbackUsed = source.fallbackMode;
      } else if (rowCount > 0) {
        status = "supported";
        chosenMode = "web";
        failureReason = null;
      } else {
        chosenMode = source.fallbackMode;
        fallbackUsed = source.fallbackMode;
      }
    } catch (error) {
      chosenMode = source.fallbackMode;
      fallbackUsed = source.fallbackMode;
      failureReason = error instanceof Error ? error.message : source.failureReason;
    }

    const fallbackRows = fs.existsSync(source.fallbackPath)
      ? parseSimpleCsv(fs.readFileSync(source.fallbackPath, "utf8"))
      : [];
    const changedRows =
      status === "supported" && liveRows.length > 0 && fallbackRows.length > 0
        ? countChangedRowsByCanonicalKey(liveRows, fallbackRows, "canonical_team_key", "rating_or_points")
        : null;

    validations.push({
      source: source.key,
      live_extraction_status: status,
      row_count: rowCount,
      latest_effective_date: source.latestEffectiveDate,
      changed_rows: changedRows,
      fallback_used: fallbackUsed,
      chosen_mode: chosenMode,
      failure_reason: failureReason,
    });
  }

  return validations;
}

async function loadProductReplayInventory(): Promise<ProductReplayInventory> {
  const supabase = createSupabaseScriptAdminClient();

  const { data: competitionData, error: competitionError } = await supabase
    .from("competitions")
    .select("id, slug, usage_scope")
    .eq("slug", "world-cup-2026")
    .eq("usage_scope", "public_product")
    .maybeSingle();

  if (competitionError || !competitionData) {
    throw new Error("World Cup public product competition is unavailable.");
  }

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("id, external_id, slug, kickoff_at, stage, status, competition_id, home_team_id, away_team_id, intake_source")
    .eq("competition_id", competitionData.id)
    .eq("intake_source", "api_football");

  if (matchError) {
    throw new Error(`Failed to load product match inventory: ${matchError.message}`);
  }

  const matches = (matchData ?? []) as ProductMatchInventoryRow[];
  const matchIds = matches.map((match) => match.id);
  const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];

  const [{ data: teamData, error: teamError }, { data: resultData, error: resultError }, { data: predictionData, error: predictionError }] =
    await Promise.all([
      teamIds.length > 0
        ? supabase.from("teams").select("id, name, slug, external_id").in("id", teamIds)
        : Promise.resolve({ data: [], error: null }),
      matchIds.length > 0
        ? supabase.from("match_results").select("match_id, home_goals, away_goals, verification_status, intake_source").in("match_id", matchIds)
        : Promise.resolve({ data: [], error: null }),
      matchIds.length > 0
        ? supabase
            .from("prediction_versions")
            .select("id, match_id, prediction_type, created_at, run_scope")
            .in("match_id", matchIds)
            .order("created_at", { ascending: true })
            .order("id", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (teamError) {
    throw new Error(`Failed to load product teams: ${teamError.message}`);
  }
  if (resultError) {
    throw new Error(`Failed to load product results: ${resultError.message}`);
  }
  if (predictionError) {
    throw new Error(`Failed to load product prediction versions: ${predictionError.message}`);
  }

  const resultsByMatchId = new Map(
    ((resultData ?? []) as ProductResultInventoryRow[]).map((result) => [result.match_id, result]),
  );
  const originalPredictionByMatchId = new Map<string, ProductPredictionInventoryRow>();
  for (const prediction of (predictionData ?? []) as ProductPredictionInventoryRow[]) {
    if (!originalPredictionByMatchId.has(prediction.match_id)) {
      originalPredictionByMatchId.set(prediction.match_id, prediction);
    }
  }

  return {
    competition: competitionData as ProductCompetitionRow,
    matches,
    teamsById: new Map(
      (((teamData ?? []) as Array<Pick<TeamRow, "id" | "name" | "slug" | "external_id">>)).map((team) => [
        team.id,
        team,
      ]),
    ),
    resultsByMatchId,
    originalPredictionByMatchId,
  };
}

export function buildReplayCoverageManifest(input: {
  productInventory: ProductReplayInventory;
  scheduleRows: WorldCupScheduleMatch[];
  scheduleLinks: ScheduleFixtureLink[];
  refreshPlan: CompletedFixtureRefreshPlan;
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
              eloCurrent: input.eloCurrent,
              eloStart2026: input.eloStart2026,
              fifaRanking: input.fifaRanking,
              localizations: input.localizations,
              schedule: input.scheduleRows,
            })
          : null;

      const resultAvailability = refreshedResult ? "available" : "missing";
      const evidenceCoverage = replayInput ? "ready" : "missing";
      const eloCoverage =
        replayInput &&
        replayInput.homeSignal.structural_strength.current_elo != null &&
        replayInput.awaySignal.structural_strength.current_elo != null
          ? "ready"
          : "missing";
      const fifaCoverage =
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
        replay_readiness: blockers.length === 0 ? "ready" : "blocked",
        blocker: blockers[0] ?? null,
      };
    })
    .sort((left, right) => left.kickoff_utc.localeCompare(right.kickoff_utc));
}

export function buildCorrectedEvidencePreviews(input: {
  fixtures: Array<{ home: string; away: string }>;
  scheduleRows: WorldCupScheduleMatch[];
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
      cutoffAt: scheduleMatch?.scheduled_at_utc ?? `${new Date().toISOString()}`,
      homeTeamKey: home,
      awayTeamKey: away,
      historicalFacts: input.historicalFacts,
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

export async function runTask1_1(paths: PreparedPaths & { artifactDate: string }) {
  const datasets = loadTask1Datasets(paths);
  const providerFixtures = await fetchApiFootballFixturesByLeague({
    leagueId: 1,
    season: 2026,
  });
  const aliasesByTeam = buildAliasIndex(datasets.aliases);
  const localizationsByTeam = buildLocalizationIndex(datasets.localizations);
  const scheduleLinks = datasets.schedule.map((row) =>
    matchProviderFixture(row, providerFixtures, aliasesByTeam, localizationsByTeam),
  );
  const classification = classifyOfficialScheduleLinks({
    scheduleRows: datasets.schedule,
    scheduleLinks,
    providerFixtures,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
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
  const liveValidation = await validateLiveSources(paths);
  const replayCoverageManifest = buildReplayCoverageManifest({
    productInventory,
    scheduleRows: datasets.schedule,
    scheduleLinks,
    refreshPlan,
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
    localizations: datasets.localizations,
    historicalFacts: datasets.historicalFacts,
    eloCurrent: datasets.eloCurrent,
    eloStart2026: datasets.eloStart2026,
    fifaRanking: datasets.fifaRanking,
    refreshPlan,
  });

  const artifactDir = paths.artifactsDir;
  ensureDirectory(artifactDir);
  writeJson(path.join(artifactDir, "completed-fixture-refresh-plan.json"), refreshPlan);
  writeJson(path.join(artifactDir, "official-schedule-link-classification.json"), classification);
  writeJson(path.join(artifactDir, "live-source-refresh-validation.json"), liveValidation);
  writeJson(path.join(artifactDir, "replay-coverage-manifest.json"), replayCoverageManifest);
  writeJson(path.join(artifactDir, "corrected-evidence-previews.json"), correctedEvidencePreviews);
  writeText(
    path.join(artifactDir, "README.txt"),
    [
      "Prediction Intelligence v2 Task 1.1 artifacts",
      `artifact_date=${paths.artifactDate}`,
      `completed_fixtures_discovered=${refreshPlan.completed_fixtures_discovered}`,
      `group_stage_links=${classification.group_stage.linked}/${classification.group_stage.total}`,
      `live_adapter_supported=${liveValidation.filter((entry) => entry.live_extraction_status === "supported").length}`,
    ].join("\n"),
  );

  return {
    datasets,
    providerFixtures,
    scheduleLinks,
    classification,
    refreshPlan,
    liveValidation,
    replayCoverageManifest,
    correctedEvidencePreviews,
  };
}
