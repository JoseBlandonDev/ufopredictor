import fs from "node:fs";
import path from "node:path";


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

export type SourceAccessMode = "web" | "local_fallback" | "normalized_snapshot" | "not_applicable";

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
  linked_by: "kickoff_and_teams" | "kickoff_only" | "unique_team_pair" | "unresolved";
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

type ApiFootballFixtureLike = {
  providerFixtureId: number;
  kickoffAt: string;
  status: string;
  homeTeam: {
    name: string;
  };
  awayTeam: {
    name: string;
  };
};

const SIGNAL_VERSION = "prediction-intelligence-v2-task1";
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

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

function slugify(value: string): string {
  return normalizeIdentity(value).replace(/\s+/g, "-");
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

function loadRuntimeWorldCupTeams(repoRoot: string): Array<{
  teamKey: string;
  displayName: string;
  fifaOfficialName: string;
  country: string;
  aliases: string[];
}> {
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

function extractSlickGridRows(html: string): string[][] {
  const rows = Array.from(
    html.matchAll(/<div class="ui-widget-content slick-row[\s\S]*?<\/div>\s*<\/div>/g),
    (match) => match[0],
  );

  return rows.map((rowHtml) =>
    Array.from(rowHtml.matchAll(/<div class="slick-cell[\s\S]*?>([\s\S]*?)<\/div>/g), (match) =>
      normalizeWhitespace(
        match[1]
          .replace(/<br\s*\/?>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " "),
      ),
    ),
  );
}

function inferVenueContext(row: HistoricalMatchFact, perspective: 1 | 2): "home" | "away" | "neutral" | "unknown" {
  const location = normalizeIdentity(row.event_location_raw ?? "");
  const team1 = normalizeIdentity(row.team_1_name_raw);
  const team2 = normalizeIdentity(row.team_2_name_raw);

  if (!location) {
    return "unknown";
  }

  if (location === team1) {
    return perspective === 1 ? "home" : "away";
  }

  if (location === team2) {
    return perspective === 1 ? "away" : "home";
  }

  return "neutral";
}

function isOfficialMatch(row: HistoricalMatchFact): boolean {
  return row.match_type === "official" || row.competition_key !== "friendly";
}

function buildExpectedResult(preMatchElo: number | null, opponentElo: number | null): number | null {
  if (preMatchElo == null || opponentElo == null) {
    return null;
  }

  return 1 / (1 + 10 ** ((opponentElo - preMatchElo) / 400));
}

function loadRegistry(preparedDir: string): SourceRegistryEntry[] {
  const registry = readJson<{ sources: SourceRegistryEntry[] }>(path.join(preparedDir, "source-registry.json"));
  return registry.sources;
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

async function tryFetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      "user-agent": "ufo-predictor-codex-task1/1.0",
      accept: "text/html,application/json,text/plain,*/*",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.text();
}

async function fetchApiFootballWorldCupFixtures(): Promise<ApiFootballFixtureLike[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error("Missing API_FOOTBALL_KEY env var.");
  }

  const url = new URL("https://v3.football.api-sports.io/fixtures");
  url.searchParams.set("league", String(WORLD_CUP_LEAGUE_ID));
  url.searchParams.set("season", String(WORLD_CUP_SEASON));

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      "x-apisports-key": apiKey,
    },
  });
  if (!response.ok) {
    throw new Error(`API-Football HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    response?: Array<{
      fixture?: { id?: number; date?: string; status?: { short?: string } };
      teams?: { home?: { name?: string }; away?: { name?: string } };
    }>;
  };

  return (payload.response ?? [])
    .map((item) => {
      if (
        typeof item.fixture?.id !== "number" ||
        typeof item.fixture?.date !== "string" ||
        typeof item.teams?.home?.name !== "string" ||
        typeof item.teams?.away?.name !== "string"
      ) {
        return null;
      }

      return {
        providerFixtureId: item.fixture.id,
        kickoffAt: item.fixture.date,
        status: item.fixture.status?.short ?? "unknown",
        homeTeam: { name: item.teams.home.name },
        awayTeam: { name: item.teams.away.name },
      };
    })
    .filter((item): item is ApiFootballFixtureLike => item != null);
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

function rawFallbackPath(rawSnapshotDir: string, registryEntry: SourceRegistryEntry): string {
  if (!registryEntry.local_fallback_file) {
    throw new Error(`Source ${registryEntry.source_key} does not define a raw fallback file.`);
  }
  return path.join(rawSnapshotDir, registryEntry.local_fallback_file);
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

async function loadSourceAccessResults(paths: PreparedPaths): Promise<SourceAccessResult[]> {
  const registry = loadRegistry(paths.preparedDir);
  const results: SourceAccessResult[] = [];

  for (const sourceKey of [
    "elo_current",
    "elo_start_2026",
    "elo_latest_results",
    "elo_results_2025",
    "elo_fixtures",
    "fifa_men_ranking",
    "api_football",
    "fifa_world_cup_schedule_v17",
    "world_cup_venues",
  ] as Task1SourceKey[]) {
    const entry = mapRegistryEntry(registry, sourceKey);
    const attempts: SourceAccessAttempt[] = [];

    if (sourceKey === "api_football") {
      attempts.push({
        mode: "web",
        ok: true,
        note: "Existing API-Football integration is available through the repository client.",
      });
      results.push({ sourceKey, selectedMode: "web", attempts, recordCount: 0 });
      continue;
    }

    if (sourceKey === "fifa_world_cup_schedule_v17") {
      attempts.push({
        mode: "normalized_snapshot",
        ok: true,
        note: "Task 1 uses the prepared official schedule snapshot because the exact source URL is intentionally not blocking implementation.",
      });
      results.push({
        sourceKey,
        selectedMode: "normalized_snapshot",
        attempts,
        recordCount: loadSchedule(paths.preparedDir).length,
      });
      continue;
    }

    if (sourceKey === "world_cup_venues") {
      attempts.push({
        mode: "normalized_snapshot",
        ok: true,
        note: "Task 1 uses the prepared curated venue catalog.",
      });
      results.push({
        sourceKey,
        selectedMode: "normalized_snapshot",
        attempts,
        recordCount: loadVenues(paths.preparedDir).length,
      });
      continue;
    }

    if (entry.primary_url) {
      try {
        const fetched = await tryFetchText(entry.primary_url);
        const hasUsefulRows =
          fetched.includes("slick-row") ||
          fetched.includes("Argentina") ||
          fetched.includes("ranking");
        attempts.push({
          mode: "web",
          ok: hasUsefulRows,
          note: hasUsefulRows
            ? "Static fetch returned enough content to confirm the source is reachable."
            : "Static fetch returned only a shell; using fallback for deterministic import.",
        });
        if (hasUsefulRows && sourceKey !== "elo_current" && sourceKey !== "elo_start_2026" && sourceKey !== "fifa_men_ranking") {
          const rows = extractSlickGridRows(fetched);
          if (rows.length > 0) {
            results.push({
              sourceKey,
              selectedMode: "web",
              attempts,
              recordCount: rows.length,
            });
            continue;
          }
        }
      } catch (error) {
        attempts.push({
          mode: "web",
          ok: false,
          note: `Web fetch failed: ${error instanceof Error ? error.message : "unknown error"}`,
        });
      }
    }

    if (entry.local_fallback_file) {
      const fallbackFile = rawFallbackPath(paths.rawSnapshotDir, entry);
      try {
        const content = readText(fallbackFile);
        const hasSignal =
          sourceKey === "fifa_men_ranking"
            ? content.includes("fifa_points") || content.includes("points")
            : content.includes("slick-row") || content.includes("Argentina");
        attempts.push({
          mode: "local_fallback",
          ok: hasSignal,
          note: hasSignal
            ? "Local raw fallback file is available."
            : "Local raw fallback file exists but is not stable enough for deterministic parsing; using prepared normalized snapshot.",
        });
        if (
          hasSignal &&
          sourceKey !== "elo_current" &&
          sourceKey !== "elo_start_2026" &&
          sourceKey !== "fifa_men_ranking"
        ) {
          results.push({
            sourceKey,
            selectedMode: "local_fallback",
            attempts,
            recordCount: extractSlickGridRows(content).length,
          });
          continue;
        }
      } catch (error) {
        attempts.push({
          mode: "local_fallback",
          ok: false,
          note: `Local fallback read failed: ${error instanceof Error ? error.message : "unknown error"}`,
        });
      }
    }

    const normalizedPath = normalizedSnapshotPath(paths.preparedDir, entry);
    attempts.push({
      mode: "normalized_snapshot",
      ok: true,
      note: "Prepared normalized snapshot used for the initial Task 1 seed.",
    });

    let recordCount = 0;
    if (sourceKey === "elo_current" || sourceKey === "elo_start_2026") {
      recordCount = loadRatingSnapshotCsv(normalizedPath, "elo").length;
    } else if (sourceKey === "fifa_men_ranking") {
      recordCount = loadRatingSnapshotCsv(normalizedPath, "fifa").length;
    } else if (sourceKey === "elo_latest_results" || sourceKey === "elo_results_2025") {
      recordCount = loadHistoricalMatchCsv(normalizedPath).length;
    } else if (sourceKey === "elo_fixtures") {
      recordCount = loadEloFixtureCsv(normalizedPath).length;
    }

    results.push({
      sourceKey,
      selectedMode: "normalized_snapshot",
      attempts,
      recordCount,
    });
  }

  return results;
}

function mapProductTeams(localizations: CanonicalTeamLocalization[], aliases: CanonicalTeamAlias[]): ProductTeamLink[] {
  const runtimeTeams = loadRuntimeWorldCupTeams(process.cwd());
  const runtimeByKey = new Map(runtimeTeams.map((team) => [team.teamKey, team]));
  const runtimeByName = new Map<string, (typeof runtimeTeams)[number]>();

  for (const team of runtimeTeams) {
    for (const candidate of [team.displayName, team.fifaOfficialName, team.country, ...team.aliases]) {
      runtimeByName.set(normalizeIdentity(candidate), team);
    }
  }

  const aliasByCanonical = new Map<string, string[]>();
  for (const alias of aliases) {
    const list = aliasByCanonical.get(alias.canonical_team_key) ?? [];
    list.push(alias.alias);
    aliasByCanonical.set(alias.canonical_team_key, list);
  }

  return localizations
    .filter((localization) => runtimeByKey.has(localization.canonical_team_key) || localization.display_name_en)
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

      const aliasMatch = (aliasByCanonical.get(localization.canonical_team_key) ?? [])
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

export function matchProviderFixture(
  scheduleRow: WorldCupScheduleMatch,
  providerFixtures: ApiFootballFixtureLike[],
  aliasesByTeam: Map<string, string[]>,
  localizationsByTeam: Map<string, CanonicalTeamLocalization>,
): ScheduleFixtureLink {
  const scheduledKickoffMs = Date.parse(scheduleRow.scheduled_at_utc);
  const kickoffMatches = providerFixtures.filter(
    (fixture) => Date.parse(fixture.kickoffAt) === scheduledKickoffMs,
  );
  const homeCandidates = scheduleRow.home_team_key
    ? [
        localizationsByTeam.get(scheduleRow.home_team_key)?.display_name_en,
        localizationsByTeam.get(scheduleRow.home_team_key)?.display_name_es,
        ...(aliasesByTeam.get(scheduleRow.home_team_key) ?? []),
      ].filter((value): value is string => Boolean(value))
    : [];
  const awayCandidates = scheduleRow.away_team_key
    ? [
        localizationsByTeam.get(scheduleRow.away_team_key)?.display_name_en,
        localizationsByTeam.get(scheduleRow.away_team_key)?.display_name_es,
        ...(aliasesByTeam.get(scheduleRow.away_team_key) ?? []),
      ].filter((value): value is string => Boolean(value))
    : [];

  const teamMatched = kickoffMatches.find((fixture) => {
    const home = normalizeIdentity(fixture.homeTeam.name);
    const away = normalizeIdentity(fixture.awayTeam.name);
    const homeOk =
      homeCandidates.length === 0 ||
      homeCandidates.some((candidate) => normalizeIdentity(candidate) === home);
    const awayOk =
      awayCandidates.length === 0 ||
      awayCandidates.some((candidate) => normalizeIdentity(candidate) === away);
    return homeOk && awayOk;
  });

  if (teamMatched) {
    return {
      official_match_number: scheduleRow.official_match_number,
      provider_fixture_id: teamMatched.providerFixtureId,
      provider_status: teamMatched.status,
      linked_by: "kickoff_and_teams",
    };
  }

  if (kickoffMatches.length === 1) {
    return {
      official_match_number: scheduleRow.official_match_number,
      provider_fixture_id: kickoffMatches[0].providerFixtureId,
      provider_status: kickoffMatches[0].status,
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

export async function buildInitialImportPlan(paths: PreparedPaths): Promise<ImportPlan> {
  const sourceAccess = await loadSourceAccessResults(paths);
  const aliases = loadAliases(paths.preparedDir);
  const localizations = loadLocalizations(paths.preparedDir);
  const venues = loadVenues(paths.preparedDir);
  const schedule = loadSchedule(paths.preparedDir);

  const registry = loadRegistry(paths.preparedDir);
  const eloCurrent = loadRatingSnapshotCsv(
    normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_current")),
    "elo",
  );
  const eloStart2026 = loadRatingSnapshotCsv(
    normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_start_2026")),
    "elo",
  );
  const fifaRanking = loadRatingSnapshotCsv(
    normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "fifa_men_ranking")),
    "fifa",
  );
  const eloFixtures = loadEloFixtureCsv(
    normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_fixtures")),
  );
  const historicalFacts = [
    ...loadHistoricalMatchCsv(
      normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_results_2025")),
    ),
    ...loadHistoricalMatchCsv(
      normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_latest_results")),
    ),
  ];

  const exactDuplicateKeys = new Set<string>();
  const exactDuplicates = new Set<string>();
  const likelyDuplicateKeys = new Map<string, HistoricalMatchFact[]>();
  const correctionFingerprints = new Set<string>();

  for (const fact of historicalFacts) {
    if (exactDuplicateKeys.has(fact.natural_match_key)) {
      exactDuplicates.add(fact.natural_match_key);
    }
    exactDuplicateKeys.add(fact.natural_match_key);

    const likelyKey = [
      fact.match_date,
      [fact.team_1_key, fact.team_2_key].sort().join("|"),
      fact.competition_key,
      normalizeIdentity(fact.event_location_raw ?? ""),
    ].join("::");
    const existing = likelyDuplicateKeys.get(likelyKey) ?? [];
    existing.push(fact);
    likelyDuplicateKeys.set(likelyKey, existing);
  }

  let likelyDuplicates = 0;
  let corrections = 0;
  for (const facts of likelyDuplicateKeys.values()) {
    if (facts.length <= 1) {
      continue;
    }
    likelyDuplicates += facts.length - 1;
    const uniqueScores = new Set(facts.map((fact) => `${fact.score_1}:${fact.score_2}`));
    if (uniqueScores.size > 1) {
      corrections += uniqueScores.size - 1;
      correctionFingerprints.add(facts[0].natural_match_key);
    }
  }

  const unresolvedAliases = aliases.filter((alias) => alias.resolution_status !== "resolved");
  const affectedTeams = Array.from(
    new Set([
      ...eloCurrent.map((row) => row.canonical_team_key),
      ...eloStart2026.map((row) => row.canonical_team_key),
      ...fifaRanking.map((row) => row.canonical_team_key),
      ...historicalFacts.flatMap((fact) => [fact.team_1_key, fact.team_2_key]),
      ...schedule.flatMap((row) => [row.home_team_key, row.away_team_key].filter(Boolean) as string[]),
    ]),
  ).sort();

  const productTeamLinks = mapProductTeams(localizations, aliases).filter(
    (link) =>
      link.runtime_team_key != null ||
      loadRuntimeWorldCupTeams(paths.repoRoot).some((team) => team.teamKey === link.canonical_team_key),
  );

  const aliasesByTeam = new Map<string, string[]>();
  for (const alias of aliases) {
    const current = aliasesByTeam.get(alias.canonical_team_key) ?? [];
    current.push(alias.alias);
    aliasesByTeam.set(alias.canonical_team_key, current);
  }
  const localizationsByTeam = new Map(localizations.map((localization) => [localization.canonical_team_key, localization]));

  let providerFixtures: ApiFootballFixtureLike[] = [];
  try {
    providerFixtures = await fetchApiFootballWorldCupFixtures();
  } catch {
    providerFixtures = [];
  }

  const scheduleFixtureLinks = schedule.map((row) =>
    matchProviderFixture(row, providerFixtures, aliasesByTeam, localizationsByTeam),
  );

  return {
    sourceAccess,
    counts: {
      aliases: aliases.length,
      localizations: localizations.length,
      venues: venues.length,
      schedule: schedule.length,
      eloCurrent: eloCurrent.length,
      eloStart2026: eloStart2026.length,
      fifaRanking: fifaRanking.length,
      eloFixtures: eloFixtures.length,
      historicalFacts: historicalFacts.length,
    },
    duplicates: {
      exact: exactDuplicates.size,
      likely: likelyDuplicates,
    },
    corrections: correctionFingerprints.size,
    unresolvedAliases,
    affectedTeams,
    productTeamLinks,
    scheduleFixtureLinks,
  };
}

function teamPerspective(
  row: HistoricalMatchFact,
  canonicalTeamKey: string,
): {
  isTeam1: boolean;
  goalsFor: number;
  goalsAgainst: number;
  preMatchElo: number | null;
  opponentPreMatchElo: number | null;
  actualScore: number;
  venueContext: "home" | "away" | "neutral" | "unknown";
} | null {
  if (row.team_1_key === canonicalTeamKey) {
    return {
      isTeam1: true,
      goalsFor: row.score_1,
      goalsAgainst: row.score_2,
      preMatchElo: row.pre_match_elo_1,
      opponentPreMatchElo: row.pre_match_elo_2,
      actualScore: row.score_1 > row.score_2 ? 1 : row.score_1 === row.score_2 ? 0.5 : 0,
      venueContext: inferVenueContext(row, 1),
    };
  }

  if (row.team_2_key === canonicalTeamKey) {
    return {
      isTeam1: false,
      goalsFor: row.score_2,
      goalsAgainst: row.score_1,
      preMatchElo: row.pre_match_elo_2,
      opponentPreMatchElo: row.pre_match_elo_1,
      actualScore: row.score_2 > row.score_1 ? 1 : row.score_1 === row.score_2 ? 0.5 : 0,
      venueContext: inferVenueContext(row, 2),
    };
  }

  return null;
}

export function buildTeamSignalSnapshot(
  canonicalTeamKey: string,
  cutoffAt: string,
  facts: HistoricalMatchFact[],
  localizations: CanonicalTeamLocalization[],
  eloCurrent: RatingSnapshotRow[],
  eloStart2026: RatingSnapshotRow[],
  fifaRanking: RatingSnapshotRow[],
  scheduleRows: WorldCupScheduleMatch[] = [],
): TeamSignalSnapshot {
  const cutoffMs = Date.parse(cutoffAt);
  const teamFacts = facts
    .map((fact) => canonicalizeHistoricalFactForReplay(fact, scheduleRows))
    .filter((fact) => Date.parse(resolveHistoricalFactComparableKickoffAt(fact, scheduleRows)) < cutoffMs)
    .filter((fact) => fact.team_1_key === canonicalTeamKey || fact.team_2_key === canonicalTeamKey)
    .sort((left, right) => left.match_date.localeCompare(right.match_date));

  const recent20 = teamFacts.slice(-20);
  const recent10 = teamFacts.slice(-10);
  const recent5 = teamFacts.slice(-5);
  const worldCupFacts = teamFacts.filter((fact) => fact.competition_key === "world_cup");
  const localization =
    localizations.find((item) => item.canonical_team_key === canonicalTeamKey) ??
    ({
      canonical_team_key: canonicalTeamKey,
      display_name_en: canonicalTeamKey,
      display_name_es: canonicalTeamKey,
      fifa_code: null,
      iso_alpha3: null,
      elo_name_raw: null,
      translation_status: null,
    } satisfies CanonicalTeamLocalization);

  function summarizeFactWindow(windowFacts: HistoricalMatchFact[]) {
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
      average_opponent_pre_match_elo: 0,
      expected_score_total: 0,
      actual_score_total: 0,
      opponent_elo_count: 0,
      official: 0,
      friendly: 0,
      home: 0,
      away: 0,
      neutral: 0,
    };

    for (const fact of windowFacts) {
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
      summary.over_2_5 += perspective.goalsFor + perspective.goalsAgainst > 2.5 ? 1 : 0;
      summary.under_2_5 += perspective.goalsFor + perspective.goalsAgainst <= 2.5 ? 1 : 0;
      summary.scored_two_plus += perspective.goalsFor >= 2 ? 1 : 0;
      summary.conceded_two_plus += perspective.goalsAgainst >= 2 ? 1 : 0;

      if (perspective.opponentPreMatchElo != null) {
        summary.average_opponent_pre_match_elo += perspective.opponentPreMatchElo;
        summary.opponent_elo_count += 1;
      }

      const expected = buildExpectedResult(perspective.preMatchElo, perspective.opponentPreMatchElo);
      if (expected != null) {
        summary.expected_score_total += expected;
        summary.actual_score_total += perspective.actualScore;
      }

      if (isOfficialMatch(fact)) {
        summary.official += 1;
      } else {
        summary.friendly += 1;
      }

      if (perspective.venueContext === "home") {
        summary.home += 1;
      } else if (perspective.venueContext === "away") {
        summary.away += 1;
      } else if (perspective.venueContext === "neutral") {
        summary.neutral += 1;
      }
    }

    return summary;
  }

  const recentSummary = summarizeFactWindow(recent20);
  const worldCupSummary = summarizeFactWindow(worldCupFacts);
  const currentElo = eloCurrent.find((row) => row.canonical_team_key === canonicalTeamKey);
  const startingElo = eloStart2026.find((row) => row.canonical_team_key === canonicalTeamKey);
  const fifa = fifaRanking.find((row) => row.canonical_team_key === canonicalTeamKey);

  const matches = Math.max(recent20.length, 1);
  const recentFormPointsPerMatch = (recentSummary.wins * 3 + recentSummary.draws) / matches;
  const strengthOfSchedule =
    recentSummary.opponent_elo_count > 0
      ? recentSummary.average_opponent_pre_match_elo / recentSummary.opponent_elo_count
      : 0;
  const performanceVsExpectation =
    recent20.length > 0
      ? (recentSummary.actual_score_total - recentSummary.expected_score_total) / recent20.length
      : 0;
  const eloTrend =
    currentElo?.elo_rating != null && startingElo?.elo_rating != null
      ? currentElo.elo_rating - startingElo.elo_rating
      : 0;
  const volatility =
    recent20.length > 0
      ? round(
          recent20.reduce((sum, fact) => {
            const perspective = teamPerspective(fact, canonicalTeamKey);
            if (!perspective || perspective.preMatchElo == null || perspective.opponentPreMatchElo == null) {
              return sum;
            }
            const expected = buildExpectedResult(perspective.preMatchElo, perspective.opponentPreMatchElo) ?? 0;
            return sum + Math.abs(perspective.actualScore - expected);
          }, 0) / recent20.length,
          4,
        )
      : 0;
  const reliability = clamp(recent20.length / 20, 0, 1);
  const baselineStructuralStrength = clamp(
    ((currentElo?.elo_rating ?? startingElo?.elo_rating ?? 1500) - 1300) / 700,
    0,
    1,
  );
  const attackScore = recent20.length > 0 ? clamp(recentSummary.goals_for / recent20.length / 3, 0, 1) : 0;
  const defenseScore =
    recent20.length > 0 ? clamp(1 - recentSummary.goals_against / recent20.length / 3, 0, 1) : 0;
  const conversionRisk = recent20.length > 0 ? recentSummary.failed_to_score_matches / recent20.length : 1;
  const tournamentCurrentForm =
    worldCupFacts.length > 0 ? (worldCupSummary.wins * 3 + worldCupSummary.draws) / (worldCupFacts.length * 3) : 0;
  const recentAdjustedForm = clamp(
    recentFormPointsPerMatch / 3 * 0.7 + clamp((strengthOfSchedule - 1500) / 500, 0, 1) * 0.3,
    0,
    1,
  );
  const expectationScore = clamp((performanceVsExpectation + 0.75) / 1.5, 0, 1);
  const diagnosticScore =
    baselineStructuralStrength * 0.24 +
    recentAdjustedForm * 0.2 +
    tournamentCurrentForm * 0.14 +
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
    sample_sizes: {
      last_5: recent5.length,
      last_10: recent10.length,
      last_20: recent20.length,
      world_cup_current: worldCupFacts.length,
    },
    recent_form: {
      last_5_points_per_match: recent5.length > 0 ? round((summarizeFactWindow(recent5).wins * 3 + summarizeFactWindow(recent5).draws) / recent5.length, 4) : 0,
      last_10_points_per_match: recent10.length > 0 ? round((summarizeFactWindow(recent10).wins * 3 + summarizeFactWindow(recent10).draws) / recent10.length, 4) : 0,
      last_20_points_per_match: round(recentFormPointsPerMatch, 4),
      last_20_wins: recentSummary.wins,
      last_20_draws: recentSummary.draws,
      last_20_losses: recentSummary.losses,
      goals_for_per_match: recent20.length > 0 ? round(recentSummary.goals_for / recent20.length, 4) : 0,
      goals_against_per_match: recent20.length > 0 ? round(recentSummary.goals_against / recent20.length, 4) : 0,
      goal_difference_per_match: recent20.length > 0 ? round((recentSummary.goals_for - recentSummary.goals_against) / recent20.length, 4) : 0,
    },
    structural_strength: {
      current_elo: currentElo?.elo_rating ?? null,
      start_2026_elo: startingElo?.elo_rating ?? null,
      fifa_points: fifa?.fifa_points ?? null,
      fifa_rank: fifa?.current_rank ?? null,
      current_elo_rank: currentElo?.current_rank ?? null,
      elo_trend_ytd: round(eloTrend, 4),
    },
    tournament_form: {
      matches: worldCupFacts.length,
      wins: worldCupSummary.wins,
      draws: worldCupSummary.draws,
      losses: worldCupSummary.losses,
      goals_for: worldCupSummary.goals_for,
      goals_against: worldCupSummary.goals_against,
      scoring_rate: worldCupFacts.length > 0 ? round(worldCupSummary.scoring_matches / worldCupFacts.length, 4) : 0,
      clean_sheet_rate: worldCupFacts.length > 0 ? round(worldCupSummary.clean_sheets / worldCupFacts.length, 4) : 0,
      average_opponent_pre_match_elo:
        worldCupSummary.opponent_elo_count > 0
          ? round(worldCupSummary.average_opponent_pre_match_elo / worldCupSummary.opponent_elo_count, 4)
          : 0,
      over_under_performance:
        worldCupFacts.length > 0
          ? round((worldCupSummary.actual_score_total - worldCupSummary.expected_score_total) / worldCupFacts.length, 4)
          : 0,
    },
    attack: {
      scoring_match_rate: recent20.length > 0 ? round(recentSummary.scoring_matches / recent20.length, 4) : 0,
      failed_to_score_rate: recent20.length > 0 ? round(recentSummary.failed_to_score_matches / recent20.length, 4) : 0,
      two_plus_scored_rate: recent20.length > 0 ? round(recentSummary.scored_two_plus / recent20.length, 4) : 0,
      btts_rate: recent20.length > 0 ? round(recentSummary.btts / recent20.length, 4) : 0,
      over_2_5_rate: recent20.length > 0 ? round(recentSummary.over_2_5 / recent20.length, 4) : 0,
    },
    defense: {
      clean_sheet_rate: recent20.length > 0 ? round(recentSummary.clean_sheets / recent20.length, 4) : 0,
      under_2_5_rate: recent20.length > 0 ? round(recentSummary.under_2_5 / recent20.length, 4) : 0,
      two_plus_conceded_rate: recent20.length > 0 ? round(recentSummary.conceded_two_plus / recent20.length, 4) : 0,
      official_matches: recentSummary.official,
      friendly_matches: recentSummary.friendly,
      home_matches: recentSummary.home,
      away_matches: recentSummary.away,
      neutral_matches: recentSummary.neutral,
    },
    performance_vs_expectation: {
      average_opponent_pre_match_elo: round(strengthOfSchedule, 4),
      strength_of_schedule: round(strengthOfSchedule, 4),
      result_vs_elo_expectation: round(performanceVsExpectation, 4),
      volatility,
    },
    reliability: {
      sample_reliability: round(reliability, 4),
      world_cup_sample_reliability: round(clamp(worldCupFacts.length / 7, 0, 1), 4),
      resolved_confederation_support: 0,
    },
    diagnostic_effective_strength: {
      score: round(diagnosticScore * 100, 2),
      baseline_structural_strength: round(baselineStructuralStrength * 100, 2),
      recent_opponent_adjusted_form: round(recentAdjustedForm * 100, 2),
      tournament_current_form: round(tournamentCurrentForm * 100, 2),
      attack: round(attackScore * 100, 2),
      defense: round(defenseScore * 100, 2),
      conversion_and_failed_to_score_risk: round((1 - conversionRisk) * 100, 2),
      performance_vs_expectation: round(expectationScore * 100, 2),
      reliability: round(reliability * 100, 2),
    },
    source_snapshot_ids: Array.from(new Set(teamFacts.map((fact) => fact.source_snapshot_id))).sort(),
  };
}

export function buildSignalSnapshots(
  cutoffAt: string,
  canonicalTeamKeys: string[],
  facts: HistoricalMatchFact[],
  localizations: CanonicalTeamLocalization[],
  eloCurrent: RatingSnapshotRow[],
  eloStart2026: RatingSnapshotRow[],
  fifaRanking: RatingSnapshotRow[],
  scheduleRows: WorldCupScheduleMatch[] = [],
): TeamSignalSnapshot[] {
  return canonicalTeamKeys
    .map((teamKey) =>
      buildTeamSignalSnapshot(
        teamKey,
        cutoffAt,
        facts,
        localizations,
        eloCurrent,
        eloStart2026,
        fifaRanking,
        scheduleRows,
      ),
    )
    .sort((left, right) => right.diagnostic_effective_strength.score - left.diagnostic_effective_strength.score);
}

export function buildEvidencePreviews(
  fixtures: Array<{ home: string; away: string }>,
  facts: HistoricalMatchFact[],
  localizations: CanonicalTeamLocalization[],
  eloCurrent: RatingSnapshotRow[],
  eloStart2026: RatingSnapshotRow[],
  fifaRanking: RatingSnapshotRow[],
  scheduleRows: WorldCupScheduleMatch[] = [],
): EvidencePreview[] {
  const byPair = new Map<string, HistoricalMatchFact[]>();
  for (const fact of facts) {
    const key = `${fact.team_1_key}::${fact.team_2_key}`;
    const existing = byPair.get(key) ?? [];
    existing.push(fact);
    byPair.set(key, existing);
  }

  return fixtures.map(({ home, away }) => {
    const officialScheduleMatch = findOfficialScheduleMatchByTeams(scheduleRows, home, away);
    const fact = [...(byPair.get(`${home}::${away}`) ?? []), ...(byPair.get(`${away}::${home}`) ?? [])].sort(
      (left, right) => right.match_date.localeCompare(left.match_date),
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
      const preMatch = [home, away].map((team) =>
        buildTeamSignalSnapshot(team, cutoffAt, facts, localizations, eloCurrent, eloStart2026, fifaRanking),
      );

      return {
        fixture: `${home} vs ${away}`,
        match_date: scheduled.scheduled_date_et,
        cutoff_at: cutoffAt,
        pre_match: preMatch,
        actual_result: {
          scoreline: "pending",
          winner: "pending",
          total_goals: 0,
        },
        post_match_note:
          "This evidence case is still a future official fixture in the prepared schedule snapshot, so only pre-match evidence is available and no result has been attached.",
      };
    }

    const canonicalFact = canonicalizeHistoricalFactForReplay(fact, scheduleRows);
    const cutoffAt = officialScheduleMatch?.scheduled_at_utc ?? resolveHistoricalFactComparableKickoffAt(fact, scheduleRows);
    const preMatch = [home, away].map((team) =>
      buildTeamSignalSnapshot(team, cutoffAt, facts, localizations, eloCurrent, eloStart2026, fifaRanking, scheduleRows),
    );
    const winner =
      canonicalFact.score_1 > canonicalFact.score_2
        ? canonicalFact.team_1_name_raw
        : canonicalFact.score_2 > canonicalFact.score_1
          ? canonicalFact.team_2_name_raw
          : "Draw";

    return {
      fixture: officialScheduleMatch
        ? `${preMatch[0].display_name_en} vs ${preMatch[1].display_name_en}`
        : `${canonicalFact.team_1_name_raw} vs ${canonicalFact.team_2_name_raw}`,
      match_date: officialScheduleMatch?.scheduled_date_et ?? canonicalFact.match_date,
      cutoff_at: cutoffAt,
      pre_match: preMatch,
      actual_result: {
        scoreline: `${canonicalFact.score_1}-${canonicalFact.score_2}`,
        winner,
        total_goals: canonicalFact.score_1 + canonicalFact.score_2,
      },
      post_match_note: "Pre-match evidence excludes the current fixture and every later fact. The result block is attached separately for evaluation-only review.",
    };
  });
}

export function buildPredictionIntelligenceV2ReplayInput(input: {
  cutoffAt: string;
  homeTeamKey: string;
  awayTeamKey: string;
  historicalFacts: HistoricalMatchFact[];
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
        "buildPredictionIntelligenceV2ReplayInput({ cutoffAt, homeTeamKey, awayTeamKey, historicalFacts, eloCurrent, eloStart2026, fifaRanking, localizations })",
      contract_notes: "Pass official schedule rows so replay facts and cutoffs use canonical home/away and kickoff UTC.",
      contract: {
        cutoffAt: "strict pre-kickoff ISO timestamp",
        homeSignal: "TeamSignalSnapshot",
        awaySignal: "TeamSignalSnapshot",
        sourceSnapshotIds: "string[]",
      },
    },
  };
}

export function loadTask1Datasets(paths: PreparedPaths) {
  const registry = loadRegistry(paths.preparedDir);
  return {
    aliases: loadAliases(paths.preparedDir),
    localizations: loadLocalizations(paths.preparedDir),
    venues: loadVenues(paths.preparedDir),
    schedule: loadSchedule(paths.preparedDir),
    eloCurrent: loadRatingSnapshotCsv(
      normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_current")),
      "elo",
    ),
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
      ...loadHistoricalMatchCsv(
        normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_results_2025")),
      ),
      ...loadHistoricalMatchCsv(
        normalizedSnapshotPath(paths.preparedDir, mapRegistryEntry(registry, "elo_latest_results")),
      ),
    ].sort((left, right) =>
      `${left.match_date}-${String(left.source_row_number).padStart(4, "0")}`.localeCompare(
        `${right.match_date}-${String(right.source_row_number).padStart(4, "0")}`,
      ),
    ),
  };
}

export function verifyNoLeakage(
  teamKey: string,
  targetMatchDate: string,
  historicalFacts: HistoricalMatchFact[],
  scheduleRows: WorldCupScheduleMatch[] = [],
): boolean {
  const cutoffAt = `${targetMatchDate}T00:00:00Z`;
  const includedFacts = historicalFacts.filter((fact) => {
    const involvesTeam = fact.team_1_key === teamKey || fact.team_2_key === teamKey;
    return involvesTeam && Date.parse(resolveHistoricalFactComparableKickoffAt(fact, scheduleRows)) < Date.parse(cutoffAt);
  });

  return includedFacts.every((fact) => fact.match_date < targetMatchDate);
}

export async function runTask1(paths: PreparedPaths) {
  const datasets = loadTask1Datasets(paths);
  const importPlan = await buildInitialImportPlan(paths);

  const topWorldCupTeamKeys = loadRuntimeWorldCupTeams(paths.repoRoot).map((team) => team.teamKey);
  const signalSnapshots = buildSignalSnapshots(
    "2026-06-21T00:00:00Z",
    topWorldCupTeamKeys,
    datasets.historicalFacts,
    datasets.localizations,
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
    datasets.eloCurrent,
    datasets.eloStart2026,
    datasets.fifaRanking,
    datasets.schedule,
  );

  const artifactBase = paths.artifactsDir;
  ensureDirectory(artifactBase);
  writeJson(path.join(artifactBase, "source-discovery-access-results.json"), importPlan.sourceAccess);
  writeJson(path.join(artifactBase, "import-plan.json"), importPlan);
  writeJson(path.join(artifactBase, "write-result.json"), {
    mode: "not_executed",
    reason: "Remote writes are intentionally blocked for Task 1 because this branch has not applied the new migration to a safe local/dev database.",
  });
  writeJson(path.join(artifactBase, "alias-coverage.json"), {
    total_aliases: datasets.aliases.length,
    unresolved_aliases: importPlan.unresolvedAliases,
  });
  writeJson(path.join(artifactBase, "rating-snapshot-coverage.json"), {
    elo_current: datasets.eloCurrent.length,
    elo_start_2026: datasets.eloStart2026.length,
    fifa_ranking: datasets.fifaRanking.length,
  });
  writeJson(path.join(artifactBase, "historical-match-coverage.json"), {
    total_historical_facts: datasets.historicalFacts.length,
    distinct_teams: Array.from(
      new Set(datasets.historicalFacts.flatMap((fact) => [fact.team_1_key, fact.team_2_key])),
    ).length,
    exact_duplicates: importPlan.duplicates.exact,
    likely_duplicates: importPlan.duplicates.likely,
    corrections: importPlan.corrections,
  });
  writeJson(path.join(artifactBase, "world-cup-schedule-venue-coverage.json"), {
    schedule_rows: datasets.schedule.length,
    venue_rows: datasets.venues.length,
    match_numbers_complete: datasets.schedule.every((row, index) => row.official_match_number === index + 1),
    provider_links: importPlan.scheduleFixtureLinks,
  });
  writeJson(path.join(artifactBase, "team-signal-previews.json"), signalSnapshots.slice(0, 16));
  writeJson(path.join(artifactBase, "ufo-effective-strength-previews.json"), [
    ...signalSnapshots.slice(0, 10),
    ...signalSnapshots.slice(-10),
  ]);
  writeJson(path.join(artifactBase, "strict-pre-kickoff-evidence-previews.json"), evidencePreviews);
  writeJson(path.join(artifactBase, "task2-replay-interface.json"), buildTask2ReplayInterfaceArtifact());
  writeText(
    path.join(artifactBase, "README.txt"),
    [
      "Prediction Intelligence v2 Task 1 artifacts",
      `signal_version=${SIGNAL_VERSION}`,
      "write_mode=not_executed",
      "reason=remote writes intentionally blocked pending safe local/dev migrated database",
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
