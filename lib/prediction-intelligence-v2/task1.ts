import fs from "node:fs";
import path from "node:path";

const HISTORICAL_SNAPSHOT_DATE = "2026-06-20";
const HISTORICAL_ARTIFACT_LABEL = "historical_preserved_snapshot";
const SIGNAL_VERSION = "prediction-intelligence-v2-task1";

export type Task1SourceKey =
  | "elo_current"
  | "elo_start_2026"
  | "elo_latest_results"
  | "elo_results_2025"
  | "elo_fixtures"
  | "fifa_men_ranking"
  | "api_football"
  | "fifa_world_cup_schedule_v17"
  | "world_cup_venues";

export type SourceAccessMode = "normalized_snapshot" | "local_fallback" | "not_applicable";

export type SourceAccessAttempt = {
  mode: SourceAccessMode;
  ok: boolean;
  note: string;
};

export type SourceAccessResult = {
  sourceKey: Task1SourceKey;
  selectedMode: SourceAccessMode;
  attempts: SourceAccessAttempt[];
  recordCount: number;
};

export type SourceRegistryEntry = {
  source_key: Task1SourceKey;
  primary_url: string | null;
  local_fallback_file: string | null;
  normalized_snapshot_file: string | null;
  effective_date_rule?: string | null;
  official_effective_date_for_snapshot?: string | null;
  refresh_policy?: string | null;
};

export type PreparedPaths = {
  repoRoot: string;
  rawSnapshotDir: string;
  preparedDir: string;
  artifactsDir: string;
};

export type CanonicalTeamLocalization = {
  canonical_team_key: string;
  fifa_code: string | null;
  iso_alpha3: string | null;
  display_name_en: string;
  display_name_es: string;
  elo_name_raw: string | null;
  translation_status: string | null;
};

export type CanonicalTeamAlias = {
  alias: string;
  canonical_team_key: string;
  canonical_name_en: string;
  source_scope: string;
  resolution_status: string;
};

export type WorldCupVenue = {
  venue_key: string;
  host_city_key: string;
  common_name: string;
  fifa_tournament_name: string;
  host_city_es: string;
  host_city_en: string;
  actual_city: string;
  country_code: string;
  timezone: string;
};

export type WorldCupScheduleMatch = {
  official_match_number: number;
  stage_key: string;
  group_key: string | null;
  home_slot: string;
  away_slot: string;
  home_team_key: string | null;
  away_team_key: string | null;
  scheduled_date_et: string;
  published_time_et: string;
  published_timezone: string;
  scheduled_at_utc: string;
  host_city_key: string;
  venue_key: string;
  venue_common_name: string;
  venue_fifa_name: string;
  country_code: string;
  source_snapshot_id: string;
};

export type RatingSnapshotRow = {
  source_snapshot_id: string;
  source_file?: string;
  source_row_number?: number;
  effective_date: string;
  captured_date?: string;
  canonical_team_key: string;
  resolved_name_en?: string;
  current_rank: number | null;
  elo_rating?: number | null;
  fifa_points?: number | null;
  raw_values: Record<string, unknown>;
};

export type HistoricalMatchFact = {
  source_snapshot_id: string;
  source_file: string;
  source_row_number: number;
  match_date: string;
  date_raw: string;
  date_inference_note: string | null;
  team_1_name_raw: string;
  team_2_name_raw: string;
  team_1_key: string;
  team_2_key: string;
  score_1: number;
  score_2: number;
  competition_raw: string;
  competition_key: string;
  event_location_raw: string | null;
  match_type: string | null;
  elo_change_1: number | null;
  elo_change_2: number | null;
  post_match_elo_1: number | null;
  post_match_elo_2: number | null;
  pre_match_elo_1: number | null;
  pre_match_elo_2: number | null;
  rank_change_1: number | null;
  rank_change_2: number | null;
  post_match_rank_1: number | null;
  post_match_rank_2: number | null;
  pre_match_rank_1: number | null;
  pre_match_rank_2: number | null;
  natural_match_key: string;
};

export type EloFixtureExpectancy = {
  source_snapshot_id: string;
  source_file?: string;
  source_row_number?: number;
  fixture_date: string;
  match_label: string;
  tournament_raw: string;
  current_rank: number | null;
  current_rating: number | null;
  winning_expectancy: number | null;
  points_exchanged_draw: number | null;
  points_exchanged_win_x1: number | null;
  points_exchanged_win_x2: number | null;
  points_exchanged_win_x3: number | null;
  points_exchanged_win_x4: number | null;
  points_exchanged_win_x5: number | null;
  raw_values: Record<string, unknown>;
};

export type ProductTeamLink = {
  canonical_team_key: string;
  display_name_en: string;
  runtime_team_key: string | null;
  runtime_display_name: string | null;
  resolution_method: "direct_key" | "display_name" | "alias" | "unresolved";
};

export type ScheduleFixtureLink = {
  official_match_number: number;
  provider_fixture_id: number | null;
  provider_status: string | null;
  linked_by:
    | "preserved_historical_reference"
    | "kickoff_and_teams"
    | "kickoff_only"
    | "unique_team_pair"
    | "unresolved";
};

export type ImportPlan = {
  sourceAccess: SourceAccessResult[];
  counts: {
    aliases: number;
    localizations: number;
    venues: number;
    schedule: number;
    eloCurrent: number;
    eloStart2026: number;
    fifaRanking: number;
    eloFixtures: number;
    historicalFacts: number;
  };
  duplicates: {
    exact: number;
    likely: number;
  };
  corrections: number;
  unresolvedAliases: CanonicalTeamAlias[];
  affectedTeams: string[];
  productTeamLinks: ProductTeamLink[];
  scheduleFixtureLinks: ScheduleFixtureLink[];
};

export type TeamSignalSnapshot = {
  signal_version: string;
  cutoff_at: string;
  canonical_team_key: string;
  display_name_en: string;
  display_name_es: string;
  eloAtCutoff: number | null;
  eloResolutionMethod: "exact_fixture_pre_match" | "latest_prior_post_match" | "start_2026_baseline" | "unavailable";
  eloSourceSnapshotIds: string[];
  eloReliability: number;
  fifaAtCutoff: number | null;
  missingOptionalSignals: string[];
  sample_sizes: Record<string, number>;
  recent_form: Record<string, number>;
  structural_strength: Record<string, number | null>;
  tournament_form: Record<string, number>;
  attack: Record<string, number>;
  defense: Record<string, number>;
  performance_vs_expectation: Record<string, number>;
  reliability: Record<string, number>;
  diagnostic_effective_strength: {
    score: number;
    baseline_structural_strength: number;
    recent_opponent_adjusted_form: number;
    tournament_current_form: number;
    attack: number;
    defense: number;
    conversion_and_failed_to_score_risk: number;
    performance_vs_expectation: number;
    reliability: number;
  };
  source_snapshot_ids: string[];
};

export type HistoricalEloTimelineEntry = {
  canonical_team_key: string;
  opponent_team_key: string | null;
  natural_match_key: string | null;
  source_snapshot_ids: string[];
  effective_at: string;
  effective_date: string;
  timePrecision: "exact" | "date";
  pre_match_elo: number | null;
  post_match_elo: number | null;
  elo_change: number | null;
  reconstruction_method: "start_2026_baseline" | "recorded_pre_match" | "post_minus_change";
  reliability: number;
};

export type TeamEloResolution = {
  canonical_team_key: string;
  cutoff_at: string;
  fixture_date: string;
  eloAtCutoff: number | null;
  eloResolutionMethod: "exact_fixture_pre_match" | "latest_prior_post_match" | "start_2026_baseline" | "unavailable";
  eloSourceSnapshotIds: string[];
  eloReliability: number;
  timePrecision: "exact" | "date";
  source_match_natural_key: string | null;
  note: string;
};

export type EvidencePreview = {
  fixture: string;
  match_date: string;
  cutoff_at: string;
  pre_match: TeamSignalSnapshot[];
  actual_result: {
    scoreline: string;
    winner: string;
    total_goals: number;
  };
  post_match_note: string;
};

type RuntimeWorldCupTeam = {
  teamKey: string;
  displayName: string;
  fifaOfficialName: string;
  country: string;
  aliases: string[];
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeIdentity(value: string): string {
  return normalizeWhitespace(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function parseNumber(value: string | undefined): number | null {
  if (value == null) {
    return null;
  }

  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string | undefined): number | null {
  const parsed = parseNumber(value);
  return parsed == null ? null : Math.trunc(parsed);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function readText(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readText(filePath)) as T;
}

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

export function resolveDefaultPreparedPaths(repoRoot: string, artifactLabel = "local-run"): PreparedPaths {
  const rawSnapshotDir = path.resolve(repoRoot, "..", "ufo-predictor-source-snapshots", HISTORICAL_SNAPSHOT_DATE);
  return {
    repoRoot,
    rawSnapshotDir,
    preparedDir: path.join(rawSnapshotDir, "prepared-v2"),
    artifactsDir: path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task1", artifactLabel),
  };
}

function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        currentField += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (!insideQuotes && char === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (!insideQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentField = "";
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  const [headerRow, ...dataRows] = rows.filter((row) => row.some((cell) => cell.length > 0));
  if (!headerRow) {
    return [];
  }

  const normalizedHeaders = headerRow.map((header) => header.replace(/^\uFEFF/, ""));
  return dataRows.map((row) => {
    const record: Record<string, string> = {};
    normalizedHeaders.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });
}

function loadRuntimeWorldCupTeams(repoRoot: string): RuntimeWorldCupTeam[] {
  const source = readText(path.join(repoRoot, "lib", "world-cup-2026", "canonical-teams.ts"));
  return Array.from(
    source.matchAll(
      /\{[\s\S]*?teamKey:\s*"([^"]+)"[\s\S]*?displayName:\s*"([^"]+)"[\s\S]*?fifaOfficialName:\s*"([^"]+)"[\s\S]*?country:\s*"([^"]+)"[\s\S]*?aliases:\s*\[([^\]]*)\]/g,
    ),
    (match) => ({
      teamKey: match[1],
      displayName: match[2],
      fifaOfficialName: match[3],
      country: match[4],
      aliases: Array.from(match[5].matchAll(/"([^"]+)"/g), (aliasMatch) => aliasMatch[1]),
    }),
  );
}

function loadRegistry(preparedDir: string): SourceRegistryEntry[] {
  const registry = readJson<{ sources: SourceRegistryEntry[] }>(path.join(preparedDir, "source-registry.json"));
  return registry.sources;
}

function mapRegistryEntry(registry: SourceRegistryEntry[], sourceKey: Task1SourceKey): SourceRegistryEntry {
  const found = registry.find((entry) => entry.source_key === sourceKey);
  if (!found) {
    throw new Error(`Missing source registry entry for ${sourceKey}.`);
  }
  return found;
}

function normalizedSnapshotPath(preparedDir: string, registryEntry: SourceRegistryEntry): string {
  if (!registryEntry.normalized_snapshot_file) {
    throw new Error(`Source ${registryEntry.source_key} does not define a normalized snapshot file.`);
  }
  return path.join(preparedDir, registryEntry.normalized_snapshot_file);
}

function rawFallbackPath(rawSnapshotDir: string, registryEntry: SourceRegistryEntry): string | null {
  return registryEntry.local_fallback_file ? path.join(rawSnapshotDir, registryEntry.local_fallback_file) : null;
}

function areTeamPairsEqual(
  leftHome: string | null | undefined,
  leftAway: string | null | undefined,
  rightHome: string | null | undefined,
  rightAway: string | null | undefined,
): boolean {
  return leftHome === rightHome && leftAway === rightAway;
}

export function findOfficialScheduleMatchByTeams(
  scheduleRows: WorldCupScheduleMatch[],
  homeTeamKey: string,
  awayTeamKey: string,
): WorldCupScheduleMatch | null {
  return (
    scheduleRows.find((row) => areTeamPairsEqual(row.home_team_key, row.away_team_key, homeTeamKey, awayTeamKey)) ??
    null
  );
}

export function findOfficialScheduleMatchForFact(
  fact: HistoricalMatchFact,
  scheduleRows: WorldCupScheduleMatch[],
): { scheduleMatch: WorldCupScheduleMatch; orientation: "as_is" | "reversed" } | null {
  const direct = scheduleRows.find(
    (row) =>
      row.scheduled_date_et === fact.match_date &&
      areTeamPairsEqual(row.home_team_key, row.away_team_key, fact.team_1_key, fact.team_2_key),
  );
  if (direct) {
    return { scheduleMatch: direct, orientation: "as_is" };
  }

  const reversed = scheduleRows.find(
    (row) =>
      row.scheduled_date_et === fact.match_date &&
      areTeamPairsEqual(row.home_team_key, row.away_team_key, fact.team_2_key, fact.team_1_key),
  );
  if (reversed) {
    return { scheduleMatch: reversed, orientation: "reversed" };
  }

  const uniqueDirect = scheduleRows.filter((row) =>
    areTeamPairsEqual(row.home_team_key, row.away_team_key, fact.team_1_key, fact.team_2_key),
  );
  if (uniqueDirect.length === 1) {
    return { scheduleMatch: uniqueDirect[0], orientation: "as_is" };
  }

  const uniqueReversed = scheduleRows.filter((row) =>
    areTeamPairsEqual(row.home_team_key, row.away_team_key, fact.team_2_key, fact.team_1_key),
  );
  if (uniqueReversed.length === 1) {
    return { scheduleMatch: uniqueReversed[0], orientation: "reversed" };
  }

  return null;
}

export function resolveHistoricalFactComparableKickoffAt(
  fact: HistoricalMatchFact,
  scheduleRows: WorldCupScheduleMatch[] = [],
): string {
  const matched = findOfficialScheduleMatchForFact(fact, scheduleRows);
  if (matched) {
    return matched.scheduleMatch.scheduled_at_utc;
  }

  return `${fact.match_date}T23:59:59Z`;
}

export function canonicalizeHistoricalFactForReplay(
  fact: HistoricalMatchFact,
  scheduleRows: WorldCupScheduleMatch[] = [],
): HistoricalMatchFact {
  const matched = findOfficialScheduleMatchForFact(fact, scheduleRows);
  if (!matched || matched.orientation === "as_is") {
    return fact;
  }

  return {
    ...fact,
    team_1_name_raw: fact.team_2_name_raw,
    team_2_name_raw: fact.team_1_name_raw,
    team_1_key: fact.team_2_key,
    team_2_key: fact.team_1_key,
    score_1: fact.score_2,
    score_2: fact.score_1,
    elo_change_1: fact.elo_change_2,
    elo_change_2: fact.elo_change_1,
    post_match_elo_1: fact.post_match_elo_2,
    post_match_elo_2: fact.post_match_elo_1,
    pre_match_elo_1: fact.pre_match_elo_2,
    pre_match_elo_2: fact.pre_match_elo_1,
    rank_change_1: fact.rank_change_2,
    rank_change_2: fact.rank_change_1,
    post_match_rank_1: fact.post_match_rank_2,
    post_match_rank_2: fact.post_match_rank_1,
    pre_match_rank_1: fact.pre_match_rank_2,
    pre_match_rank_2: fact.pre_match_rank_1,
  };
}

function resolveRecordedPreMatchElo(
  fact: HistoricalMatchFact,
  perspective: "team_1" | "team_2",
): { value: number | null; reconstructionMethod: "recorded_pre_match" | "post_minus_change" | "unavailable"; reliability: number } {
  const recorded = perspective === "team_1" ? fact.pre_match_elo_1 : fact.pre_match_elo_2;
  if (recorded != null) {
    return {
      value: recorded,
      reconstructionMethod: "recorded_pre_match",
      reliability: 1,
    };
  }

  const postMatch = perspective === "team_1" ? fact.post_match_elo_1 : fact.post_match_elo_2;
  const eloChange = perspective === "team_1" ? fact.elo_change_1 : fact.elo_change_2;
  if (postMatch != null && eloChange != null) {
    return {
      value: postMatch - eloChange,
      reconstructionMethod: "post_minus_change",
      reliability: 0.95,
    };
  }

  return {
    value: null,
    reconstructionMethod: "unavailable",
    reliability: 0,
  };
}

function resolveRecordedPostMatchElo(
  fact: HistoricalMatchFact,
  perspective: "team_1" | "team_2",
): { value: number | null; reliability: number } {
  const postMatch = perspective === "team_1" ? fact.post_match_elo_1 : fact.post_match_elo_2;
  return {
    value: postMatch,
    reliability: postMatch != null ? 1 : 0,
  };
}

function resolveHistoricalFactTimePrecision(
  fact: HistoricalMatchFact,
  scheduleRows: WorldCupScheduleMatch[] = [],
): { effectiveAt: string; effectiveDate: string; timePrecision: "exact" | "date" } {
  const matched = findOfficialScheduleMatchForFact(fact, scheduleRows);
  if (matched) {
    return {
      effectiveAt: matched.scheduleMatch.scheduled_at_utc,
      effectiveDate: matched.scheduleMatch.scheduled_date_et,
      timePrecision: "exact",
    };
  }

  return {
    effectiveAt: `${fact.match_date}T00:00:00Z`,
    effectiveDate: fact.match_date,
    timePrecision: "date",
  };
}

export function buildHistoricalEloTimeline(input: {
  historicalFacts: HistoricalMatchFact[];
  eloStart2026: RatingSnapshotRow[];
  scheduleRows?: WorldCupScheduleMatch[];
}): HistoricalEloTimelineEntry[] {
  const scheduleRows = input.scheduleRows ?? [];
  const entries: HistoricalEloTimelineEntry[] = [];

  for (const row of input.eloStart2026) {
    entries.push({
      canonical_team_key: row.canonical_team_key,
      opponent_team_key: null,
      natural_match_key: null,
      source_snapshot_ids: [row.source_snapshot_id],
      effective_at: `${row.effective_date}T00:00:00Z`,
      effective_date: row.effective_date,
      timePrecision: "exact",
      pre_match_elo: row.elo_rating ?? null,
      post_match_elo: row.elo_rating ?? null,
      elo_change: 0,
      reconstruction_method: "start_2026_baseline",
      reliability: row.elo_rating != null ? 1 : 0,
    });
  }

  for (const rawFact of input.historicalFacts) {
    const fact = canonicalizeHistoricalFactForReplay(rawFact, scheduleRows);
    const timing = resolveHistoricalFactTimePrecision(fact, scheduleRows);
    const team1Pre = resolveRecordedPreMatchElo(fact, "team_1");
    const team2Pre = resolveRecordedPreMatchElo(fact, "team_2");
    const team1Post = resolveRecordedPostMatchElo(fact, "team_1");
    const team2Post = resolveRecordedPostMatchElo(fact, "team_2");

    entries.push({
      canonical_team_key: fact.team_1_key,
      opponent_team_key: fact.team_2_key,
      natural_match_key: fact.natural_match_key,
      source_snapshot_ids: [fact.source_snapshot_id],
      effective_at: timing.effectiveAt,
      effective_date: timing.effectiveDate,
      timePrecision: timing.timePrecision,
      pre_match_elo: team1Pre.value,
      post_match_elo: team1Post.value,
      elo_change: fact.elo_change_1,
      reconstruction_method: team1Pre.reconstructionMethod === "unavailable" ? "post_minus_change" : team1Pre.reconstructionMethod,
      reliability: Math.min(team1Pre.reliability, team1Post.reliability || 1),
    });

    entries.push({
      canonical_team_key: fact.team_2_key,
      opponent_team_key: fact.team_1_key,
      natural_match_key: fact.natural_match_key,
      source_snapshot_ids: [fact.source_snapshot_id],
      effective_at: timing.effectiveAt,
      effective_date: timing.effectiveDate,
      timePrecision: timing.timePrecision,
      pre_match_elo: team2Pre.value,
      post_match_elo: team2Post.value,
      elo_change: fact.elo_change_2,
      reconstruction_method: team2Pre.reconstructionMethod === "unavailable" ? "post_minus_change" : team2Pre.reconstructionMethod,
      reliability: Math.min(team2Pre.reliability, team2Post.reliability || 1),
    });
  }

  return entries.sort((left, right) => {
    const dateCompare = left.effective_at.localeCompare(right.effective_at);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return left.canonical_team_key.localeCompare(right.canonical_team_key);
  });
}

export function resolveTeamEloAtCutoff(input: {
  canonicalTeamKey: string;
  cutoffAt: string;
  fixtureDate: string;
  historicalFacts: HistoricalMatchFact[];
  eloStart2026: RatingSnapshotRow[];
  scheduleRows?: WorldCupScheduleMatch[];
  exactFixtureTeamPair?: { homeTeamKey: string; awayTeamKey: string } | null;
}): TeamEloResolution {
  const scheduleRows = input.scheduleRows ?? [];
  const canonicalFacts = input.historicalFacts.map((fact) => canonicalizeHistoricalFactForReplay(fact, scheduleRows));
  const cutoffMs = Date.parse(input.cutoffAt);

  const exactFixtureFact =
    input.exactFixtureTeamPair == null
      ? null
      : canonicalFacts.find((fact) => {
          const timing = resolveHistoricalFactTimePrecision(fact, scheduleRows);
          return (
            timing.effectiveAt === input.cutoffAt &&
            fact.team_1_key === input.exactFixtureTeamPair?.homeTeamKey &&
            fact.team_2_key === input.exactFixtureTeamPair?.awayTeamKey
          );
        }) ?? null;

  if (exactFixtureFact) {
    const perspective =
      exactFixtureFact.team_1_key === input.canonicalTeamKey
        ? "team_1"
        : exactFixtureFact.team_2_key === input.canonicalTeamKey
          ? "team_2"
          : null;
    if (perspective) {
      const preMatch = resolveRecordedPreMatchElo(exactFixtureFact, perspective);
      if (preMatch.value != null) {
        return {
          canonical_team_key: input.canonicalTeamKey,
          cutoff_at: input.cutoffAt,
          fixture_date: input.fixtureDate,
          eloAtCutoff: preMatch.value,
          eloResolutionMethod: "exact_fixture_pre_match",
          eloSourceSnapshotIds: [exactFixtureFact.source_snapshot_id],
          eloReliability: preMatch.reliability,
          timePrecision: "exact",
          source_match_natural_key: exactFixtureFact.natural_match_key,
          note: "Resolved from the replay fixture's reconstructed pre-match Elo.",
        };
      }
    }
  }

  const priorCandidates = canonicalFacts
    .filter((fact) => fact.team_1_key === input.canonicalTeamKey || fact.team_2_key === input.canonicalTeamKey)
    .filter((fact) => fact.natural_match_key !== exactFixtureFact?.natural_match_key)
    .map((fact) => {
      const perspective = fact.team_1_key === input.canonicalTeamKey ? "team_1" : "team_2";
      const timing = resolveHistoricalFactTimePrecision(fact, scheduleRows);
      const postMatch = resolveRecordedPostMatchElo(fact, perspective);
      return { fact, timing, postMatch };
    })
    .filter((candidate) => candidate.postMatch.value != null)
    .filter((candidate) =>
      candidate.timing.timePrecision === "exact"
        ? Date.parse(candidate.timing.effectiveAt) < cutoffMs
        : candidate.timing.effectiveDate < input.fixtureDate,
    )
    .sort((left, right) => {
      if (left.timing.timePrecision === "exact" && right.timing.timePrecision === "exact") {
        return left.timing.effectiveAt.localeCompare(right.timing.effectiveAt);
      }

      const dateCompare = left.timing.effectiveDate.localeCompare(right.timing.effectiveDate);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      if (left.timing.timePrecision === right.timing.timePrecision) {
        return left.fact.natural_match_key.localeCompare(right.fact.natural_match_key);
      }

      return left.timing.timePrecision === "date" ? -1 : 1;
    });

  const latestPrior = priorCandidates[priorCandidates.length - 1];
  if (latestPrior?.postMatch.value != null) {
    return {
      canonical_team_key: input.canonicalTeamKey,
      cutoff_at: input.cutoffAt,
      fixture_date: input.fixtureDate,
      eloAtCutoff: latestPrior.postMatch.value,
      eloResolutionMethod: "latest_prior_post_match",
      eloSourceSnapshotIds: [latestPrior.fact.source_snapshot_id],
      eloReliability: latestPrior.postMatch.reliability,
      timePrecision: latestPrior.timing.timePrecision,
      source_match_natural_key: latestPrior.fact.natural_match_key,
      note:
        latestPrior.timing.timePrecision === "exact"
          ? "Resolved from the latest strictly earlier exact-timestamp fixture."
          : "Resolved from the latest strictly earlier date-only post-match Elo.",
    };
  }

  const baseline = input.eloStart2026.find((row) => row.canonical_team_key === input.canonicalTeamKey && row.elo_rating != null);
  if (baseline?.elo_rating != null) {
    return {
      canonical_team_key: input.canonicalTeamKey,
      cutoff_at: input.cutoffAt,
      fixture_date: input.fixtureDate,
      eloAtCutoff: baseline.elo_rating,
      eloResolutionMethod: "start_2026_baseline",
      eloSourceSnapshotIds: [baseline.source_snapshot_id],
      eloReliability: 0.8,
      timePrecision: "exact",
      source_match_natural_key: null,
      note: "Resolved from the start-of-2026 Elo baseline.",
    };
  }

  return {
    canonical_team_key: input.canonicalTeamKey,
    cutoff_at: input.cutoffAt,
    fixture_date: input.fixtureDate,
    eloAtCutoff: null,
    eloResolutionMethod: "unavailable",
    eloSourceSnapshotIds: [],
    eloReliability: 0,
    timePrecision: "date",
    source_match_natural_key: null,
    note: "No reconstructable Elo source was available before kickoff.",
  };
}

export function resolveFixturePreMatchElo(input: {
  cutoffAt: string;
  fixtureDate: string;
  homeTeamKey: string;
  awayTeamKey: string;
  historicalFacts: HistoricalMatchFact[];
  eloStart2026: RatingSnapshotRow[];
  scheduleRows?: WorldCupScheduleMatch[];
}) {
  const exactFixtureTeamPair = {
    homeTeamKey: input.homeTeamKey,
    awayTeamKey: input.awayTeamKey,
  };

  return {
    home: resolveTeamEloAtCutoff({
      canonicalTeamKey: input.homeTeamKey,
      cutoffAt: input.cutoffAt,
      fixtureDate: input.fixtureDate,
      historicalFacts: input.historicalFacts,
      eloStart2026: input.eloStart2026,
      scheduleRows: input.scheduleRows,
      exactFixtureTeamPair,
    }),
    away: resolveTeamEloAtCutoff({
      canonicalTeamKey: input.awayTeamKey,
      cutoffAt: input.cutoffAt,
      fixtureDate: input.fixtureDate,
      historicalFacts: input.historicalFacts,
      eloStart2026: input.eloStart2026,
      scheduleRows: input.scheduleRows,
      exactFixtureTeamPair,
    }),
  };
}

function loadAliases(preparedDir: string): CanonicalTeamAlias[] {
  return parseCsv(readText(path.join(preparedDir, "reference", "team-aliases.csv"))).map((row) => ({
    alias: row.alias,
    canonical_team_key: row.canonical_team_key,
    canonical_name_en: row.canonical_name_en,
    source_scope: row.source_scope,
    resolution_status: row.resolution_status,
  }));
}

function loadLocalizations(preparedDir: string): CanonicalTeamLocalization[] {
  return parseCsv(readText(path.join(preparedDir, "reference", "team-localizations-es-en.csv"))).map((row) => ({
    canonical_team_key: row.canonical_team_key,
    fifa_code: row.fifa_code || null,
    iso_alpha3: row.iso_alpha3 || null,
    display_name_en: row.display_name_en,
    display_name_es: row.display_name_es,
    elo_name_raw: row.elo_name_raw || null,
    translation_status: row.translation_status || null,
  }));
}

function loadVenues(preparedDir: string): WorldCupVenue[] {
  return parseCsv(readText(path.join(preparedDir, "reference", "world-cup-2026-venues.csv"))).map((row) => ({
    venue_key: row.venue_key,
    host_city_key: row.host_city_key,
    common_name: row.common_name,
    fifa_tournament_name: row.fifa_tournament_name,
    host_city_es: row.host_city_es,
    host_city_en: row.host_city_en,
    actual_city: row.actual_city,
    country_code: row.country_code,
    timezone: row.timezone,
  }));
}

function loadSchedule(preparedDir: string): WorldCupScheduleMatch[] {
  return readJson<WorldCupScheduleMatch[]>(path.join(preparedDir, "reference", "world-cup-2026-schedule.json"));
}

function loadRatingSnapshotCsv(filePath: string, sourceKind: "elo" | "fifa"): RatingSnapshotRow[] {
  return parseCsv(readText(filePath)).map((row) => ({
    source_snapshot_id: row.source_snapshot_id,
    source_file: row.source_file,
    source_row_number: parseInteger(row.source_row_number) ?? 0,
    effective_date: row.effective_date,
    captured_date: row.captured_date || undefined,
    canonical_team_key: row.canonical_team_key,
    resolved_name_en: row.resolved_name_en || row.team_name_raw || row.team_name_es_raw || undefined,
    current_rank: parseInteger(row.rank ?? row.current_rank),
    elo_rating: sourceKind === "elo" ? parseNumber(row.elo_rating) : null,
    fifa_points: sourceKind === "fifa" ? parseNumber(row.fifa_points) : null,
    raw_values: row,
  }));
}

function loadHistoricalMatchCsv(filePath: string): HistoricalMatchFact[] {
  return parseCsv(readText(filePath)).map((row) => ({
    source_snapshot_id: row.source_snapshot_id,
    source_file: row.source_file,
    source_row_number: parseInteger(row.source_row_number) ?? 0,
    match_date: row.match_date,
    date_raw: row.date_raw,
    date_inference_note: row.date_inference_note || null,
    team_1_name_raw: row.team_1_name_raw,
    team_2_name_raw: row.team_2_name_raw,
    team_1_key: row.team_1_key,
    team_2_key: row.team_2_key,
    score_1: parseInteger(row.score_1) ?? 0,
    score_2: parseInteger(row.score_2) ?? 0,
    competition_raw: row.competition_raw,
    competition_key: row.competition_key,
    event_location_raw: row.event_location_raw || null,
    match_type: row.match_type || null,
    elo_change_1: parseNumber(row.elo_change_1),
    elo_change_2: parseNumber(row.elo_change_2),
    post_match_elo_1: parseNumber(row.post_match_elo_1),
    post_match_elo_2: parseNumber(row.post_match_elo_2),
    pre_match_elo_1: parseNumber(row.pre_match_elo_1),
    pre_match_elo_2: parseNumber(row.pre_match_elo_2),
    rank_change_1: parseNumber(row.rank_change_1),
    rank_change_2: parseNumber(row.rank_change_2),
    post_match_rank_1: parseInteger(row.post_match_rank_1),
    post_match_rank_2: parseInteger(row.post_match_rank_2),
    pre_match_rank_1: parseInteger(row.pre_match_rank_1),
    pre_match_rank_2: parseInteger(row.pre_match_rank_2),
    natural_match_key: row.natural_match_key,
  }));
}

function loadEloFixtureCsv(filePath: string): EloFixtureExpectancy[] {
  return parseCsv(readText(filePath)).map((row) => ({
    source_snapshot_id: row.source_snapshot_id,
    source_file: row.source_file,
    source_row_number: parseInteger(row.source_row_number) ?? 0,
    fixture_date: row.fixture_date ?? row.date,
    match_label: row.match_label ?? row.match,
    tournament_raw: row.tournament_raw ?? row.tournament,
    current_rank: parseInteger(row.current_rank),
    current_rating: parseNumber(row.current_rating),
    winning_expectancy: parseNumber(row.winning_expectancy),
    points_exchanged_draw: parseNumber(row.points_exchanged_draw),
    points_exchanged_win_x1: parseNumber(row.points_exchanged_win_x1),
    points_exchanged_win_x2: parseNumber(row.points_exchanged_win_x2),
    points_exchanged_win_x3: parseNumber(row.points_exchanged_win_x3),
    points_exchanged_win_x4: parseNumber(row.points_exchanged_win_x4),
    points_exchanged_win_x5: parseNumber(row.points_exchanged_win_x5),
    raw_values: row,
  }));
}

type SourceQualityReport = {
  counts: Record<string, number>;
};

function buildSourceAccessResults(paths: PreparedPaths): SourceAccessResult[] {
  const registry = loadRegistry(paths.preparedDir);
  const qualityReport = readJson<SourceQualityReport>(path.join(paths.preparedDir, "reports", "source-quality-report.json"));
  const results: SourceAccessResult[] = [];

  for (const entry of registry) {
    const normalizedPath = entry.normalized_snapshot_file
      ? path.join(paths.preparedDir, entry.normalized_snapshot_file)
      : null;
    const fallbackPath = rawFallbackPath(paths.rawSnapshotDir, entry);
    const normalizedExists = normalizedPath ? fs.existsSync(normalizedPath) : false;
    const fallbackExists = fallbackPath ? fs.existsSync(fallbackPath) : false;
    const selectedMode: SourceAccessMode = normalizedExists
      ? "normalized_snapshot"
      : fallbackExists
        ? "local_fallback"
        : "not_applicable";
    const attempts: SourceAccessAttempt[] = [];

    if (normalizedPath) {
      attempts.push({
        mode: "normalized_snapshot",
        ok: normalizedExists,
        note: normalizedExists
          ? "Local normalized snapshot preserved for Slice 1A historical analysis."
          : "Normalized snapshot is missing from the prepared workspace.",
      });
    }

    if (fallbackPath) {
      attempts.push({
        mode: "local_fallback",
        ok: fallbackExists,
        note: fallbackExists
          ? "Local raw fallback file is present in the preserved external workspace."
          : "Local raw fallback file is not present in the preserved external workspace.",
      });
    }

    if (entry.source_key === "api_football") {
      attempts.push({
        mode: "not_applicable",
        ok: true,
        note: "Live API-Football access is intentionally disabled in Slice 1A; preserved metadata only.",
      });
    }

    const recordCount =
      (entry.normalized_snapshot_file && qualityReport.counts[entry.normalized_snapshot_file]) ||
      (entry.local_fallback_file && qualityReport.counts[entry.local_fallback_file]) ||
      0;

    results.push({
      sourceKey: entry.source_key,
      selectedMode,
      attempts,
      recordCount,
    });
  }

  return results;
}

function mapProductTeams(
  repoRoot: string,
  localizations: CanonicalTeamLocalization[],
  aliases: CanonicalTeamAlias[],
): ProductTeamLink[] {
  const runtimeTeams = loadRuntimeWorldCupTeams(repoRoot);
  const runtimeByKey = new Map(runtimeTeams.map((team) => [team.teamKey, team]));
  const runtimeByName = new Map<string, RuntimeWorldCupTeam>();

  for (const team of runtimeTeams) {
    for (const candidate of [team.displayName, team.fifaOfficialName, team.country, ...team.aliases]) {
      runtimeByName.set(normalizeIdentity(candidate), team);
    }
  }

  const aliasesByCanonical = new Map<string, string[]>();
  for (const alias of aliases) {
    const collection = aliasesByCanonical.get(alias.canonical_team_key) ?? [];
    collection.push(alias.alias);
    aliasesByCanonical.set(alias.canonical_team_key, collection);
  }

  return localizations
    .filter((localization) => runtimeByKey.has(localization.canonical_team_key) || localization.display_name_en.length > 0)
    .map((localization) => {
      const direct = runtimeByKey.get(localization.canonical_team_key);
      if (direct) {
        return {
          canonical_team_key: localization.canonical_team_key,
          display_name_en: localization.display_name_en,
          runtime_team_key: direct.teamKey,
          runtime_display_name: direct.displayName,
          resolution_method: "direct_key" as const,
        };
      }

      const byDisplayName =
        runtimeByName.get(normalizeIdentity(localization.display_name_en)) ??
        runtimeByName.get(normalizeIdentity(localization.display_name_es));
      if (byDisplayName) {
        return {
          canonical_team_key: localization.canonical_team_key,
          display_name_en: localization.display_name_en,
          runtime_team_key: byDisplayName.teamKey,
          runtime_display_name: byDisplayName.displayName,
          resolution_method: "display_name" as const,
        };
      }

      const aliasMatch = (aliasesByCanonical.get(localization.canonical_team_key) ?? [])
        .map((alias) => runtimeByName.get(normalizeIdentity(alias)))
        .find(Boolean);
      if (aliasMatch) {
        return {
          canonical_team_key: localization.canonical_team_key,
          display_name_en: localization.display_name_en,
          runtime_team_key: aliasMatch.teamKey,
          runtime_display_name: aliasMatch.displayName,
          resolution_method: "alias" as const,
        };
      }

      return {
        canonical_team_key: localization.canonical_team_key,
        display_name_en: localization.display_name_en,
        runtime_team_key: null,
        runtime_display_name: null,
        resolution_method: "unresolved" as const,
      };
    });
}

export function loadTask1Datasets(paths: PreparedPaths) {
  const registry = loadRegistry(paths.preparedDir);
  return {
    aliases: loadAliases(paths.preparedDir),
    localizations: loadLocalizations(paths.preparedDir),
    venues: loadVenues(paths.preparedDir),
    schedule: loadSchedule(paths.preparedDir),
    eloCurrent: loadRatingSnapshotCsv(normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_current")), "elo"),
    eloStart2026: loadRatingSnapshotCsv(
      normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_start_2026")),
      "elo",
    ),
    fifaRanking: loadRatingSnapshotCsv(
      normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "fifa_men_ranking")),
      "fifa",
    ),
    eloFixtures: loadEloFixtureCsv(
      normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_fixtures")),
    ),
    historicalFacts: [
      ...loadHistoricalMatchCsv(normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_results_2025"))),
      ...loadHistoricalMatchCsv(normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_latest_results"))),
    ].sort((left, right) =>
      `${left.match_date}-${String(left.source_row_number).padStart(4, "0")}`.localeCompare(
        `${right.match_date}-${String(right.source_row_number).padStart(4, "0")}`,
      ),
    ),
  };
}

type ApiFootballFixtureLike = {
  providerFixtureId: number;
  status: string;
  kickoffAt: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
};

export function matchProviderFixture(
  scheduleRow: WorldCupScheduleMatch,
  providerFixtures: ApiFootballFixtureLike[],
  aliasesByTeam: Map<string, string[]>,
  localizationsByTeam: Map<string, CanonicalTeamLocalization>,
): ScheduleFixtureLink {
  const homeLocalization = scheduleRow.home_team_key ? localizationsByTeam.get(scheduleRow.home_team_key) ?? null : null;
  const awayLocalization = scheduleRow.away_team_key ? localizationsByTeam.get(scheduleRow.away_team_key) ?? null : null;
  const homeCandidates = scheduleRow.home_team_key
    ? Array.from(
        new Set(
          [
            scheduleRow.home_team_key,
            homeLocalization?.display_name_en ?? null,
            homeLocalization?.display_name_es ?? null,
            homeLocalization?.elo_name_raw ?? null,
            ...(aliasesByTeam.get(scheduleRow.home_team_key) ?? []),
          ].filter((value): value is string => Boolean(value)),
        ),
      )
    : [];
  const awayCandidates = scheduleRow.away_team_key
    ? Array.from(
        new Set(
          [
            scheduleRow.away_team_key,
            awayLocalization?.display_name_en ?? null,
            awayLocalization?.display_name_es ?? null,
            awayLocalization?.elo_name_raw ?? null,
            ...(aliasesByTeam.get(scheduleRow.away_team_key) ?? []),
          ].filter((value): value is string => Boolean(value)),
        ),
      )
    : [];

  const kickoffAndTeamsMatch = providerFixtures.find((fixture) => {
    if (fixture.kickoffAt !== scheduleRow.scheduled_at_utc) {
      return false;
    }

    const home = normalizeIdentity(fixture.homeTeam.name);
    const away = normalizeIdentity(fixture.awayTeam.name);
    const homeOk = homeCandidates.some((candidate) => normalizeIdentity(candidate) === home);
    const awayOk = awayCandidates.some((candidate) => normalizeIdentity(candidate) === away);
    return homeOk && awayOk;
  });

  if (kickoffAndTeamsMatch) {
    return {
      official_match_number: scheduleRow.official_match_number,
      provider_fixture_id: kickoffAndTeamsMatch.providerFixtureId,
      provider_status: kickoffAndTeamsMatch.status,
      linked_by: "kickoff_and_teams",
    };
  }

  const kickoffOnlyMatch = providerFixtures.find((fixture) => fixture.kickoffAt === scheduleRow.scheduled_at_utc);
  if (kickoffOnlyMatch) {
    return {
      official_match_number: scheduleRow.official_match_number,
      provider_fixture_id: kickoffOnlyMatch.providerFixtureId,
      provider_status: kickoffOnlyMatch.status,
      linked_by: "kickoff_only",
    };
  }

  const uniquePairMatch =
    scheduleRow.home_team_key && scheduleRow.away_team_key
      ? providerFixtures.filter((fixture) => {
          const home = normalizeIdentity(fixture.homeTeam.name);
          const away = normalizeIdentity(fixture.awayTeam.name);
          const homeOk = homeCandidates.some((candidate) => normalizeIdentity(candidate) === home);
          const awayOk = awayCandidates.some((candidate) => normalizeIdentity(candidate) === away);
          return homeOk && awayOk;
        })
      : [];

  if (uniquePairMatch.length === 1) {
    return {
      official_match_number: scheduleRow.official_match_number,
      provider_fixture_id: uniquePairMatch[0].providerFixtureId,
      provider_status: uniquePairMatch[0].status,
      linked_by: "unique_team_pair",
    };
  }

  return {
    official_match_number: scheduleRow.official_match_number,
    provider_fixture_id: null,
    provider_status: null,
    linked_by: "unresolved",
  };
}

function buildPreservedScheduleLinks(schedule: WorldCupScheduleMatch[]): ScheduleFixtureLink[] {
  return schedule.map((row) => ({
    official_match_number: row.official_match_number,
    provider_fixture_id: null,
    provider_status: null,
    linked_by: "unresolved",
  }));
}

export function buildInitialImportPlan(paths: PreparedPaths): ImportPlan {
  const datasets = loadTask1Datasets(paths);
  const sourceAccess = buildSourceAccessResults(paths);
  const unresolvedAliases = datasets.aliases.filter((alias) => alias.resolution_status !== "resolved");
  const affectedTeams = Array.from(
    new Set([
      ...datasets.eloCurrent.map((row) => row.canonical_team_key),
      ...datasets.eloStart2026.map((row) => row.canonical_team_key),
      ...datasets.fifaRanking.map((row) => row.canonical_team_key),
      ...datasets.historicalFacts.flatMap((fact) => [fact.team_1_key, fact.team_2_key]),
      ...datasets.schedule.flatMap((row) => [row.home_team_key, row.away_team_key].filter(Boolean) as string[]),
    ]),
  ).sort();

  return {
    sourceAccess,
    counts: {
      aliases: datasets.aliases.length,
      localizations: datasets.localizations.length,
      venues: datasets.venues.length,
      schedule: datasets.schedule.length,
      eloCurrent: datasets.eloCurrent.length,
      eloStart2026: datasets.eloStart2026.length,
      fifaRanking: datasets.fifaRanking.length,
      eloFixtures: datasets.eloFixtures.length,
      historicalFacts: datasets.historicalFacts.length,
    },
    duplicates: {
      exact: 0,
      likely: 0,
    },
    corrections: 0,
    unresolvedAliases: unresolvedAliases,
    affectedTeams,
    productTeamLinks: mapProductTeams(paths.repoRoot, datasets.localizations, datasets.aliases),
    scheduleFixtureLinks: buildPreservedScheduleLinks(datasets.schedule),
  };
}

function teamPerspective(
  fact: HistoricalMatchFact,
  canonicalTeamKey: string,
): {
  goalsFor: number;
  goalsAgainst: number;
  actualScore: number;
  preMatchElo: number | null;
  opponentPreMatchElo: number | null;
} | null {
  if (fact.team_1_key === canonicalTeamKey) {
    return {
      goalsFor: fact.score_1,
      goalsAgainst: fact.score_2,
      actualScore: fact.score_1 > fact.score_2 ? 1 : fact.score_1 === fact.score_2 ? 0.5 : 0,
      preMatchElo: fact.pre_match_elo_1,
      opponentPreMatchElo: fact.pre_match_elo_2,
    };
  }

  if (fact.team_2_key === canonicalTeamKey) {
    return {
      goalsFor: fact.score_2,
      goalsAgainst: fact.score_1,
      actualScore: fact.score_2 > fact.score_1 ? 1 : fact.score_2 === fact.score_1 ? 0.5 : 0,
      preMatchElo: fact.pre_match_elo_2,
      opponentPreMatchElo: fact.pre_match_elo_1,
    };
  }

  return null;
}

function buildExpectedResult(preMatchElo: number | null, opponentElo: number | null): number | null {
  if (preMatchElo == null || opponentElo == null) {
    return null;
  }
  return 1 / (1 + 10 ** ((opponentElo - preMatchElo) / 400));
}

export function buildTeamSignalSnapshot(
  canonicalTeamKey: string,
  cutoffAt: string,
  facts: HistoricalMatchFact[],
  localizations: CanonicalTeamLocalization[],
  aliases: CanonicalTeamAlias[],
  eloCurrent: RatingSnapshotRow[],
  eloStart2026: RatingSnapshotRow[],
  fifaRanking: RatingSnapshotRow[],
  scheduleRows: WorldCupScheduleMatch[] = [],
): TeamSignalSnapshot {
  const cutoffMs = Date.parse(cutoffAt);
  const teamFacts = facts
    .map((fact) => canonicalizeHistoricalFactForReplay(fact, scheduleRows))
    .filter(
      (fact) =>
        (fact.team_1_key === canonicalTeamKey || fact.team_2_key === canonicalTeamKey) &&
        Date.parse(resolveHistoricalFactComparableKickoffAt(fact, scheduleRows)) < cutoffMs,
    );
  const recent20 = teamFacts.slice(-20);
  const recent10 = recent20.slice(-10);
  const recent5 = recent20.slice(-5);
  const worldCupFacts = teamFacts.filter((fact) => fact.competition_key === "world_cup");
  const officialScheduleMatch = scheduleRows.find(
    (row) =>
      row.scheduled_at_utc === cutoffAt &&
      (row.home_team_key === canonicalTeamKey || row.away_team_key === canonicalTeamKey),
  );
  const startingElo = eloStart2026.find((row) => row.canonical_team_key === canonicalTeamKey);
  const localization =
    localizations.find((item) => item.canonical_team_key === canonicalTeamKey) ?? {
      canonical_team_key: canonicalTeamKey,
      display_name_en: canonicalTeamKey,
      display_name_es: canonicalTeamKey,
      fifa_code: null,
      iso_alpha3: null,
      elo_name_raw: null,
      translation_status: null,
    };
  const normalizedFifaKeys = new Set(
    [
      canonicalTeamKey,
      localization.display_name_en,
      localization.display_name_es,
      localization.elo_name_raw,
      localization.fifa_code,
      ...aliases.filter((alias) => alias.canonical_team_key === canonicalTeamKey).map((alias) => alias.alias),
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => normalizeIdentity(value.replace(/_/g, " "))),
  );
  const fifa =
    fifaRanking.find((row) => row.canonical_team_key === canonicalTeamKey) ??
    fifaRanking.find((row) => {
      const candidates = [
        row.canonical_team_key,
        typeof row.raw_values.team_name_es_raw === "string" ? row.raw_values.team_name_es_raw : null,
        typeof row.resolved_name_en === "string" ? row.resolved_name_en : null,
      ]
        .filter((value): value is string => Boolean(value))
        .map((value) => normalizeIdentity(value.replace(/_/g, " ")));
      return candidates.some((candidate) =>
        Array.from(normalizedFifaKeys).some((expected) => candidate === expected || candidate.includes(expected) || expected.includes(candidate)),
      );
    });
  const eloResolution = resolveTeamEloAtCutoff({
    canonicalTeamKey,
    cutoffAt,
    fixtureDate: cutoffAt.slice(0, 10),
    historicalFacts: facts,
    eloStart2026,
    scheduleRows,
    exactFixtureTeamPair:
      officialScheduleMatch?.home_team_key && officialScheduleMatch?.away_team_key
        ? {
            homeTeamKey: officialScheduleMatch.home_team_key,
            awayTeamKey: officialScheduleMatch.away_team_key,
          }
        : null,
  });

  const summary = {
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    scoring_matches: 0,
    failed_to_score_matches: 0,
    clean_sheets: 0,
    btts: 0,
    over_2_5: 0,
    under_2_5: 0,
    scored_two_plus: 0,
    conceded_two_plus: 0,
    opponent_elo_total: 0,
    opponent_elo_count: 0,
    expected_score_total: 0,
    actual_score_total: 0,
  };

  for (const fact of recent20) {
    const perspective = teamPerspective(fact, canonicalTeamKey);
    if (!perspective) {
      continue;
    }

    if (perspective.goalsFor > perspective.goalsAgainst) {
      summary.wins += 1;
    } else if (perspective.goalsFor === perspective.goalsAgainst) {
      summary.draws += 1;
    } else {
      summary.losses += 1;
    }

    summary.goals_for += perspective.goalsFor;
    summary.goals_against += perspective.goalsAgainst;
    summary.scoring_matches += perspective.goalsFor > 0 ? 1 : 0;
    summary.failed_to_score_matches += perspective.goalsFor === 0 ? 1 : 0;
    summary.clean_sheets += perspective.goalsAgainst === 0 ? 1 : 0;
    summary.btts += perspective.goalsFor > 0 && perspective.goalsAgainst > 0 ? 1 : 0;
    summary.over_2_5 += perspective.goalsFor + perspective.goalsAgainst > 2 ? 1 : 0;
    summary.under_2_5 += perspective.goalsFor + perspective.goalsAgainst <= 2 ? 1 : 0;
    summary.scored_two_plus += perspective.goalsFor >= 2 ? 1 : 0;
    summary.conceded_two_plus += perspective.goalsAgainst >= 2 ? 1 : 0;

    if (perspective.opponentPreMatchElo != null) {
      summary.opponent_elo_total += perspective.opponentPreMatchElo;
      summary.opponent_elo_count += 1;
    }

    const expected = buildExpectedResult(perspective.preMatchElo, perspective.opponentPreMatchElo);
    if (expected != null) {
      summary.expected_score_total += expected;
      summary.actual_score_total += perspective.actualScore;
    }
  }

  const matches = Math.max(recent20.length, 1);
  const recentFormPointsPerMatch = (summary.wins * 3 + summary.draws) / matches;
  const strengthOfSchedule = summary.opponent_elo_count > 0 ? summary.opponent_elo_total / summary.opponent_elo_count : 0;
  const performanceVsExpectation =
    recent20.length > 0 ? (summary.actual_score_total - summary.expected_score_total) / recent20.length : 0;
  const eloTrend = eloResolution.eloAtCutoff != null && startingElo?.elo_rating != null ? eloResolution.eloAtCutoff - startingElo.elo_rating : 0;
  const reliability = clamp(recent20.length / 20, 0, 1);
  const baselineStructuralStrength = clamp(((eloResolution.eloAtCutoff ?? startingElo?.elo_rating ?? 1500) - 1300) / 700, 0, 1);
  const missingOptionalSignals = fifa?.fifa_points == null ? ["fifa_points"] : [];
  const attackScore = recent20.length > 0 ? clamp(summary.goals_for / recent20.length / 3, 0, 1) : 0;
  const defenseScore = recent20.length > 0 ? clamp(1 - summary.goals_against / recent20.length / 3, 0, 1) : 0;
  const conversionRisk = recent20.length > 0 ? summary.failed_to_score_matches / recent20.length : 1;
  const recentAdjustedForm = clamp(recentFormPointsPerMatch / 3 * 0.7 + clamp((strengthOfSchedule - 1500) / 500, 0, 1) * 0.3, 0, 1);
  const expectationScore = clamp((performanceVsExpectation + 0.75) / 1.5, 0, 1);
  const diagnosticScore =
    baselineStructuralStrength * 0.24 +
    recentAdjustedForm * 0.2 +
    attackScore * 0.12 +
    defenseScore * 0.12 +
    (1 - conversionRisk) * 0.08 +
    expectationScore * 0.05 +
    reliability * 0.05;

  return {
    signal_version: SIGNAL_VERSION,
    cutoff_at: cutoffAt,
    canonical_team_key: canonicalTeamKey,
    display_name_en: localization.display_name_en,
    display_name_es: localization.display_name_es,
    eloAtCutoff: eloResolution.eloAtCutoff,
    eloResolutionMethod: eloResolution.eloResolutionMethod,
    eloSourceSnapshotIds: eloResolution.eloSourceSnapshotIds,
    eloReliability: round(eloResolution.eloReliability, 4),
    fifaAtCutoff: fifa?.fifa_points ?? null,
    missingOptionalSignals,
    sample_sizes: {
      last_5: recent5.length,
      last_10: recent10.length,
      last_20: recent20.length,
      world_cup_current: worldCupFacts.length,
    },
    recent_form: {
      last_5_points_per_match: recent5.length > 0 ? round((recent5.filter((fact) => teamPerspective(fact, canonicalTeamKey)?.actualScore === 1).length * 3 + recent5.filter((fact) => teamPerspective(fact, canonicalTeamKey)?.actualScore === 0.5).length) / recent5.length, 4) : 0,
      last_10_points_per_match: recent10.length > 0 ? round((recent10.filter((fact) => teamPerspective(fact, canonicalTeamKey)?.actualScore === 1).length * 3 + recent10.filter((fact) => teamPerspective(fact, canonicalTeamKey)?.actualScore === 0.5).length) / recent10.length, 4) : 0,
      last_20_points_per_match: round(recentFormPointsPerMatch, 4),
      last_20_wins: summary.wins,
      last_20_draws: summary.draws,
      last_20_losses: summary.losses,
      goals_for_per_match: recent20.length > 0 ? round(summary.goals_for / recent20.length, 4) : 0,
      goals_against_per_match: recent20.length > 0 ? round(summary.goals_against / recent20.length, 4) : 0,
      goal_difference_per_match: recent20.length > 0 ? round((summary.goals_for - summary.goals_against) / recent20.length, 4) : 0,
    },
    structural_strength: {
      current_elo: eloResolution.eloAtCutoff,
      start_2026_elo: startingElo?.elo_rating ?? null,
      fifa_points: fifa?.fifa_points ?? null,
      fifa_rank: fifa?.current_rank ?? null,
      current_elo_rank: null,
      elo_trend_ytd: round(eloTrend, 4),
    },
    tournament_form: {
      matches: worldCupFacts.length,
      wins: worldCupFacts.filter((fact) => teamPerspective(fact, canonicalTeamKey)?.actualScore === 1).length,
      draws: worldCupFacts.filter((fact) => teamPerspective(fact, canonicalTeamKey)?.actualScore === 0.5).length,
      losses: worldCupFacts.filter((fact) => teamPerspective(fact, canonicalTeamKey)?.actualScore === 0).length,
      goals_for: worldCupFacts.reduce((total, fact) => total + (teamPerspective(fact, canonicalTeamKey)?.goalsFor ?? 0), 0),
      goals_against: worldCupFacts.reduce((total, fact) => total + (teamPerspective(fact, canonicalTeamKey)?.goalsAgainst ?? 0), 0),
      scoring_rate: worldCupFacts.length > 0 ? round(worldCupFacts.filter((fact) => (teamPerspective(fact, canonicalTeamKey)?.goalsFor ?? 0) > 0).length / worldCupFacts.length, 4) : 0,
      clean_sheet_rate: worldCupFacts.length > 0 ? round(worldCupFacts.filter((fact) => (teamPerspective(fact, canonicalTeamKey)?.goalsAgainst ?? 0) === 0).length / worldCupFacts.length, 4) : 0,
      average_opponent_pre_match_elo:
        worldCupFacts.length > 0
          ? round(
              worldCupFacts.reduce((total, fact) => total + (teamPerspective(fact, canonicalTeamKey)?.opponentPreMatchElo ?? 0), 0) /
                worldCupFacts.length,
              4,
            )
          : 0,
      over_under_performance:
        worldCupFacts.length > 0
          ? round(
              worldCupFacts.reduce((total, fact) => {
                const perspective = teamPerspective(fact, canonicalTeamKey);
                const expected = perspective ? buildExpectedResult(perspective.preMatchElo, perspective.opponentPreMatchElo) : null;
                return total + ((perspective?.actualScore ?? 0) - (expected ?? 0));
              }, 0) / worldCupFacts.length,
              4,
            )
          : 0,
    },
    attack: {
      scoring_match_rate: recent20.length > 0 ? round(summary.scoring_matches / recent20.length, 4) : 0,
      failed_to_score_rate: recent20.length > 0 ? round(summary.failed_to_score_matches / recent20.length, 4) : 0,
      two_plus_scored_rate: recent20.length > 0 ? round(summary.scored_two_plus / recent20.length, 4) : 0,
      btts_rate: recent20.length > 0 ? round(summary.btts / recent20.length, 4) : 0,
      over_2_5_rate: recent20.length > 0 ? round(summary.over_2_5 / recent20.length, 4) : 0,
    },
    defense: {
      clean_sheet_rate: recent20.length > 0 ? round(summary.clean_sheets / recent20.length, 4) : 0,
      under_2_5_rate: recent20.length > 0 ? round(summary.under_2_5 / recent20.length, 4) : 0,
      two_plus_conceded_rate: recent20.length > 0 ? round(summary.conceded_two_plus / recent20.length, 4) : 0,
      official_matches: recent20.filter((fact) => fact.match_type === "official").length,
      friendly_matches: recent20.filter((fact) => fact.match_type !== "official").length,
      home_matches: 0,
      away_matches: 0,
      neutral_matches: 0,
    },
    performance_vs_expectation: {
      average_opponent_pre_match_elo: round(strengthOfSchedule, 4),
      strength_of_schedule: round(strengthOfSchedule, 4),
      result_vs_elo_expectation: round(performanceVsExpectation, 4),
      volatility: 0,
    },
    reliability: {
      sample_reliability: round(reliability, 4),
      world_cup_sample_reliability: round(clamp(worldCupFacts.length / 7, 0, 1), 4),
      resolved_confederation_support: fifa?.fifa_points != null ? 1 : 0,
    },
    diagnostic_effective_strength: {
      score: round(diagnosticScore * 100, 2),
      baseline_structural_strength: round(baselineStructuralStrength * 100, 2),
      recent_opponent_adjusted_form: round(recentAdjustedForm * 100, 2),
      tournament_current_form: 0,
      attack: round(attackScore * 100, 2),
      defense: round(defenseScore * 100, 2),
      conversion_and_failed_to_score_risk: round((1 - conversionRisk) * 100, 2),
      performance_vs_expectation: round(expectationScore * 100, 2),
      reliability: round(reliability * 100, 2),
    },
    source_snapshot_ids: Array.from(
      new Set([...teamFacts.map((fact) => fact.source_snapshot_id), ...eloResolution.eloSourceSnapshotIds, ...(fifa ? [fifa.source_snapshot_id] : [])]),
    ).sort(),
  };
}

export function buildSignalSnapshots(
  cutoffAt: string,
  canonicalTeamKeys: string[],
  facts: HistoricalMatchFact[],
  localizations: CanonicalTeamLocalization[],
  aliases: CanonicalTeamAlias[],
  eloCurrent: RatingSnapshotRow[],
  eloStart2026: RatingSnapshotRow[],
  fifaRanking: RatingSnapshotRow[],
  scheduleRows: WorldCupScheduleMatch[] = [],
): TeamSignalSnapshot[] {
  return canonicalTeamKeys
    .map((teamKey) =>
      buildTeamSignalSnapshot(teamKey, cutoffAt, facts, localizations, aliases, eloCurrent, eloStart2026, fifaRanking, scheduleRows),
    )
    .sort((left, right) => right.diagnostic_effective_strength.score - left.diagnostic_effective_strength.score);
}

export function buildEvidencePreviews(
  fixtures: Array<{ home: string; away: string }>,
  facts: HistoricalMatchFact[],
  localizations: CanonicalTeamLocalization[],
  aliases: CanonicalTeamAlias[],
  eloCurrent: RatingSnapshotRow[],
  eloStart2026: RatingSnapshotRow[],
  fifaRanking: RatingSnapshotRow[],
  scheduleRows: WorldCupScheduleMatch[] = [],
): EvidencePreview[] {
  const byPair = new Map<string, HistoricalMatchFact[]>();
  for (const fact of facts) {
    const key = `${fact.team_1_key}::${fact.team_2_key}`;
    const collection = byPair.get(key) ?? [];
    collection.push(fact);
    byPair.set(key, collection);
  }

  return fixtures.map(({ home, away }) => {
    const officialScheduleMatch = findOfficialScheduleMatchByTeams(scheduleRows, home, away);
    const fact = [...(byPair.get(`${home}::${away}`) ?? []), ...(byPair.get(`${away}::${home}`) ?? [])].sort((left, right) =>
      right.match_date.localeCompare(left.match_date),
    )[0];

    if (!fact) {
      const scheduled = scheduleRows.find(
        (row) =>
          (row.home_team_key === home && row.away_team_key === away) ||
          (row.home_team_key === away && row.away_team_key === home),
      );
      if (!scheduled) {
        throw new Error(`Missing evidence fixture ${home} vs ${away}.`);
      }

      const cutoffAt = scheduled.scheduled_at_utc;
      return {
        fixture: `${home} vs ${away}`,
        match_date: scheduled.scheduled_date_et,
        cutoff_at: cutoffAt,
        pre_match: [home, away].map((team) =>
          buildTeamSignalSnapshot(team, cutoffAt, facts, localizations, aliases, eloCurrent, eloStart2026, fifaRanking, scheduleRows),
        ),
        actual_result: {
          scoreline: "pending",
          winner: "pending",
          total_goals: 0,
        },
        post_match_note:
          "This evidence case remains a preserved future fixture inside the 2026-06-20 historical schedule snapshot, so only pre-match evidence is attached here.",
      };
    }

    const canonicalFact = canonicalizeHistoricalFactForReplay(fact, scheduleRows);
    const cutoffAt = officialScheduleMatch?.scheduled_at_utc ?? resolveHistoricalFactComparableKickoffAt(fact, scheduleRows);
    return {
      fixture: officialScheduleMatch
        ? `${home} vs ${away}`
        : `${canonicalFact.team_1_name_raw} vs ${canonicalFact.team_2_name_raw}`,
      match_date: officialScheduleMatch?.scheduled_date_et ?? canonicalFact.match_date,
      cutoff_at: cutoffAt,
      pre_match: [home, away].map((team) =>
        buildTeamSignalSnapshot(team, cutoffAt, facts, localizations, aliases, eloCurrent, eloStart2026, fifaRanking, scheduleRows),
      ),
      actual_result: {
        scoreline: `${canonicalFact.score_1}-${canonicalFact.score_2}`,
        winner:
          canonicalFact.score_1 > canonicalFact.score_2
            ? canonicalFact.team_1_name_raw
            : canonicalFact.score_2 > canonicalFact.score_1
              ? canonicalFact.team_2_name_raw
              : "Draw",
        total_goals: canonicalFact.score_1 + canonicalFact.score_2,
      },
      post_match_note:
        "Pre-match evidence excludes the target fixture and later facts. The attached result remains historical evaluation evidence from the preserved 2026-06-20 snapshot set.",
    };
  });
}

export function buildPredictionIntelligenceV2ReplayInput(input: {
  cutoffAt: string;
  homeTeamKey: string;
  awayTeamKey: string;
  historicalFacts: HistoricalMatchFact[];
  aliases: CanonicalTeamAlias[];
  eloCurrent: RatingSnapshotRow[];
  eloStart2026: RatingSnapshotRow[];
  fifaRanking: RatingSnapshotRow[];
  localizations: CanonicalTeamLocalization[];
  schedule?: WorldCupScheduleMatch[];
}) {
  const scheduleRows = input.schedule ?? [];
  const cutoffMs = Date.parse(input.cutoffAt);
  const filterEloSnapshots = (rows: RatingSnapshotRow[]) =>
    rows.filter((row) => Date.parse(`${row.effective_date}T23:59:59Z`) < cutoffMs);
  const filterFifaSnapshots = (rows: RatingSnapshotRow[]) =>
    rows.filter((row) => Date.parse(`${row.effective_date}T00:00:00Z`) < cutoffMs);

  return {
    cutoffAt: input.cutoffAt,
    homeSignal: buildTeamSignalSnapshot(
      input.homeTeamKey,
      input.cutoffAt,
      input.historicalFacts,
      input.localizations,
      input.aliases,
      filterEloSnapshots(input.eloCurrent),
      filterEloSnapshots(input.eloStart2026),
      filterFifaSnapshots(input.fifaRanking),
      scheduleRows,
    ),
    awaySignal: buildTeamSignalSnapshot(
      input.awayTeamKey,
      input.cutoffAt,
      input.historicalFacts,
      input.localizations,
      input.aliases,
      filterEloSnapshots(input.eloCurrent),
      filterEloSnapshots(input.eloStart2026),
      filterFifaSnapshots(input.fifaRanking),
      scheduleRows,
    ),
    officialScheduleMatch:
      findOfficialScheduleMatchByTeams(scheduleRows, input.homeTeamKey, input.awayTeamKey) ??
      null,
    sourceSnapshotIds: Array.from(
      new Set([
        ...input.historicalFacts.map((fact) => fact.source_snapshot_id),
        ...filterEloSnapshots(input.eloCurrent).map((row) => row.source_snapshot_id),
        ...filterEloSnapshots(input.eloStart2026).map((row) => row.source_snapshot_id),
        ...filterFifaSnapshots(input.fifaRanking).map((row) => row.source_snapshot_id),
      ]),
    ).sort(),
  };
}

export function buildTask2ReplayInterfaceArtifact() {
  return {
    module: "lib/prediction-intelligence-v2/task1.ts",
    exported_function: "buildPredictionIntelligenceV2ReplayInput",
    recommended_entrypoint: {
      function_name: "buildPredictionIntelligenceV2ReplayInput",
      proposed_signature:
        "buildPredictionIntelligenceV2ReplayInput({ cutoffAt, homeTeamKey, awayTeamKey, historicalFacts, aliases, eloCurrent, eloStart2026, fifaRanking, localizations, schedule })",
      contract_notes: "Pass official schedule rows so replay facts and cutoffs use canonical home/away and kickoff UTC.",
      contract: {
        cutoffAt: "strict pre-kickoff ISO timestamp",
        homeSignal: "TeamSignalSnapshot",
        awaySignal: "TeamSignalSnapshot",
        aliases: "CanonicalTeamAlias[]",
        sourceSnapshotIds: "string[]",
      },
    },
  };
}

export function verifyNoLeakage(
  teamKey: string,
  targetMatchDate: string,
  historicalFacts: HistoricalMatchFact[],
  scheduleRows: WorldCupScheduleMatch[] = [],
): boolean {
  const cutoffAt = `${targetMatchDate}T00:00:00Z`;
  return historicalFacts
    .filter(
      (fact) =>
        (fact.team_1_key === teamKey || fact.team_2_key === teamKey) &&
        Date.parse(resolveHistoricalFactComparableKickoffAt(fact, scheduleRows)) < Date.parse(cutoffAt),
    )
    .every((fact) => fact.match_date < targetMatchDate);
}

export function assertTask1LocalOnlyPreflight(paths: PreparedPaths) {
  if (!fs.existsSync(paths.preparedDir)) {
    throw new Error(`Prepared V2 workspace not found: ${paths.preparedDir}`);
  }

  if (path.normalize(paths.artifactsDir).includes(path.join("task1", HISTORICAL_SNAPSHOT_DATE))) {
    throw new Error(
      `Task 1 local run refused because artifactsDir points at the preserved historical evidence path (${HISTORICAL_SNAPSHOT_DATE}).`,
    );
  }
}

export async function runTask1(paths: PreparedPaths) {
  assertTask1LocalOnlyPreflight(paths);

  const datasets = loadTask1Datasets(paths);
  const importPlan = buildInitialImportPlan(paths);
  const topWorldCupTeamKeys = loadRuntimeWorldCupTeams(paths.repoRoot).map((team) => team.teamKey);
  const signalSnapshots = buildSignalSnapshots(
    "2026-06-21T00:00:00Z",
    topWorldCupTeamKeys,
    datasets.historicalFacts,
    datasets.localizations,
    datasets.aliases,
    datasets.eloCurrent,
    datasets.eloStart2026,
    datasets.fifaRanking,
    datasets.schedule,
  );
  const evidencePreviews = buildEvidencePreviews(
    [
      { home: "germany", away: "curacao" },
      { home: "spain", away: "cape_verde" },
      { home: "brazil", away: "morocco" },
      { home: "germany", away: "ivory_coast" },
      { home: "ecuador", away: "curacao" },
    ],
    datasets.historicalFacts,
    datasets.localizations,
    datasets.aliases,
    datasets.eloCurrent,
    datasets.eloStart2026,
    datasets.fifaRanking,
    datasets.schedule,
  );

  ensureDirectory(paths.artifactsDir);
  writeJson(path.join(paths.artifactsDir, "source-discovery-access-results.json"), importPlan.sourceAccess);
  writeJson(path.join(paths.artifactsDir, "import-plan.json"), importPlan);
  writeJson(path.join(paths.artifactsDir, "write-result.json"), {
    mode: "not_executed",
    reason: "Remote writes remain intentionally blocked for Slice 1A local Task 1 runs.",
  });
  writeJson(path.join(paths.artifactsDir, "alias-coverage.json"), {
    total_aliases: datasets.aliases.length,
    unresolved_aliases: importPlan.unresolvedAliases,
  });
  writeJson(path.join(paths.artifactsDir, "rating-snapshot-coverage.json"), {
    elo_current: datasets.eloCurrent.length,
    elo_start_2026: datasets.eloStart2026.length,
    fifa_ranking: datasets.fifaRanking.length,
  });
  writeJson(path.join(paths.artifactsDir, "historical-match-coverage.json"), {
    total_historical_facts: datasets.historicalFacts.length,
    distinct_teams: Array.from(new Set(datasets.historicalFacts.flatMap((fact) => [fact.team_1_key, fact.team_2_key]))).length,
    exact_duplicates: importPlan.duplicates.exact,
    likely_duplicates: importPlan.duplicates.likely,
    corrections: importPlan.corrections,
  });
  writeJson(path.join(paths.artifactsDir, "world-cup-schedule-venue-coverage.json"), {
    schedule_rows: datasets.schedule.length,
    venue_rows: datasets.venues.length,
    match_numbers_complete: datasets.schedule.every((row, index) => row.official_match_number === index + 1),
    provider_links: importPlan.scheduleFixtureLinks,
  });
  writeJson(path.join(paths.artifactsDir, "team-signal-previews.json"), signalSnapshots.slice(0, 16));
  writeJson(path.join(paths.artifactsDir, "ufo-effective-strength-previews.json"), [
    ...signalSnapshots.slice(0, 10),
    ...signalSnapshots.slice(-10),
  ]);
  writeJson(path.join(paths.artifactsDir, "strict-pre-kickoff-evidence-previews.json"), evidencePreviews);
  writeJson(path.join(paths.artifactsDir, "task2-replay-interface.json"), buildTask2ReplayInterfaceArtifact());
  writeText(
    path.join(paths.artifactsDir, "README.txt"),
    [
      "Prediction Intelligence v2 Task 1 artifacts",
      `signal_version=${SIGNAL_VERSION}`,
      "write_mode=not_executed",
      "reason=remote writes intentionally blocked for local Slice 1A execution",
      `classification=${HISTORICAL_ARTIFACT_LABEL}`,
    ].join("\n"),
  );

  return {
    datasets,
    importPlan,
    signalSnapshots,
    evidencePreviews,
    task2Interface: buildTask2ReplayInterfaceArtifact(),
  };
}
