import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { WORLD_CUP_2026_FIXTURES } from "../world-cup-2026/canonical-fixtures";
import { WORLD_CUP_2026_TEAMS } from "../world-cup-2026/canonical-teams";
import { createSupabaseScriptAdminClient } from "../supabase/script-admin";
import { buildApiFootballLeagueExternalId } from "../football-api/ingest/external-ids";
import {
  loadTask1Datasets,
  resolveDefaultPreparedPaths,
  type CanonicalTeamAlias,
  type CanonicalTeamLocalization,
  type HistoricalMatchFact,
  type PreparedPaths,
  type RatingSnapshotRow,
  type Task1SourceKey,
  type WorldCupScheduleMatch,
  type WorldCupVenue,
} from "./task1";

const STAGE_BOOTSTRAP_ARTIFACT_ROOT = path.join(
  "artifacts",
  "prediction-intelligence-v2",
  "task3b",
  "local-run",
);
const WORLD_CUP_COMPETITION_SLUG = "world-cup-2026";
const WORLD_CUP_COMPETITION_NAME = "World Cup 2026";
const WORLD_CUP_PROVIDER_LEAGUE_ID = 1;
const WORLD_CUP_SEASON_YEAR = 2026;

type BootstrapMode = "dry_run" | "apply";
type TableName =
  | "competitions"
  | "seasons"
  | "teams"
  | "venues"
  | "matches"
  | "source_snapshots"
  | "canonical_team_aliases"
  | "canonical_team_localizations"
  | "canonical_team_links"
  | "team_rating_snapshots"
  | "historical_match_facts"
  | "schedule_snapshots"
  | "world_cup_venue_catalog"
  | "official_schedule_matches"
  | "official_schedule_match_links";

type ManifestFileEntry = {
  path: string;
  sha256: string;
  size_bytes: number;
};

type PackageManifest = {
  generated_at_utc: string;
  snapshot_date: string;
  package_files: ManifestFileEntry[];
};

type SourceRegistryEntry = {
  source_key: Task1SourceKey;
  data_kind: string;
  local_fallback_file: string | null;
  normalized_snapshot_file: string | null;
  official_effective_date_for_snapshot?: string | null;
  effective_date_rule?: string | null;
  refresh_policy?: string | null;
};

type SourceRegistry = {
  snapshot_date: string;
  generated_at_utc: string;
  sources: SourceRegistryEntry[];
};

type SourceFileEvidence = {
  absolutePath: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
  manifestSha256: string | null;
  manifestStatus: "verified" | "missing_from_manifest" | "hash_mismatch";
};

type SourceRowEvidence = {
  sourceFile: string;
  sourceLine: number | null;
  sourceRowIndex: number;
  payload: Record<string, unknown>;
};

type SourceSnapshotSeed = {
  source_key: Task1SourceKey;
  snapshot_id: string;
  data_kind: string;
  local_fallback_path: string | null;
  normalized_snapshot_path: string | null;
  effective_at: string | null;
  captured_at: string | null;
  payload_hash: string;
  row_count: number;
  metadata_json: Record<string, unknown>;
};

type RuntimeCompetitionSeed = {
  external_id: string;
  slug: string;
  name: string;
  country: string | null;
  type: "international";
  usage_scope: "public_product";
};

type RuntimeSeasonSeed = {
  competition_slug: string;
  year: number;
  name: string;
  starts_at: string;
  ends_at: string;
};

type RuntimeTeamSeed = {
  canonical_team_key: string;
  slug: string;
  name: string;
  country: string;
  fifa_code: string;
};

type RuntimeVenueSeed = {
  venue_key: string;
  name: string;
  city: string;
  country: string;
};

type RuntimeMatchSeed = {
  official_match_number: number;
  competition_slug: string;
  season_year: number;
  slug: string;
  external_id: string | null;
  home_team_slug: string;
  away_team_slug: string;
  venue_key: string;
  kickoff_at: string;
  stage: string;
  status: "scheduled";
  access_scope: "admin_only";
  intake_source: "api_football" | "manual";
  source_note: string;
};

type SourceSnapshotRow = {
  id: string;
  source_key: string;
  snapshot_id: string;
  data_kind: string;
  source_url: string | null;
  local_fallback_path: string | null;
  normalized_snapshot_path: string | null;
  effective_at: string | null;
  captured_at: string | null;
  payload_hash: string;
  row_count: number;
  metadata_json: Record<string, unknown> | null;
};

type CompetitionRow = {
  id: string;
  external_id: string | null;
  slug: string;
  name: string;
  country: string | null;
  type: "international" | "league" | "cup";
  usage_scope: "public_product" | "internal_lab";
};

type SeasonRow = {
  id: string;
  competition_id: string;
  year: number;
  name: string;
  starts_at: string;
  ends_at: string;
};

type TeamRow = {
  id: string;
  slug: string;
  external_id: string | null;
  name: string;
  country: string | null;
};

type VenueRow = {
  id: string;
  external_id: string | null;
  name: string;
  city: string | null;
  country: string | null;
};

type MatchRow = {
  id: string;
  external_id: string | null;
  slug: string;
  competition_id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  venue_id: string | null;
  kickoff_at: string;
  stage: string | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  access_scope: "public" | "premium" | "admin_only" | "lab_only";
  intake_source: "mock" | "manual" | "csv_import" | "api_football";
  source_note: string | null;
};

type CanonicalTeamAliasRow = {
  id: string;
  canonical_team_key: string;
  alias_raw: string;
  alias_normalized: string;
  source_scope: string;
  resolution_status: string;
  source_snapshot_id: string | null;
  metadata_json: Record<string, unknown> | null;
};

type CanonicalTeamLocalizationRow = {
  id: string;
  canonical_team_key: string;
  locale: string;
  display_name: string;
  fifa_code: string | null;
  iso_alpha3: string | null;
  source_snapshot_id: string | null;
  metadata_json: Record<string, unknown> | null;
};

type CanonicalTeamLinkRow = {
  id: string;
  canonical_team_key: string;
  team_id: string | null;
  api_football_team_id: number | null;
  runtime_team_slug: string | null;
  link_status: "linked" | "candidate" | "unresolved";
  metadata_json: Record<string, unknown> | null;
};

type TeamRatingSnapshotDbRow = {
  id: string;
  source_key: "elo" | "fifa" | "ufo";
  effective_at: string;
  captured_at: string | null;
  canonical_team_key: string;
  rank: number | null;
  rating_or_points: number | null;
  source_snapshot_id: string;
  raw_values: Record<string, unknown> | null;
};

type HistoricalMatchFactDbRow = {
  id: string;
  natural_match_key: string;
  match_date: string;
  team_1_key: string;
  team_2_key: string;
  competition_key: string;
  venue_context_key: string | null;
  neutral: boolean | null;
  score_1: number;
  score_2: number;
  pre_match_elo_1: number | null;
  pre_match_elo_2: number | null;
  post_match_elo_1: number | null;
  post_match_elo_2: number | null;
  source_snapshot_id: string;
  correction_of_id: string | null;
  raw_values: Record<string, unknown> | null;
};

type ScheduleSnapshotRow = {
  id: string;
  tournament_key: string;
  snapshot_id: string;
  source_snapshot_id: string | null;
  version_label: string | null;
  published_timezone: string | null;
};

type WorldCupVenueCatalogRow = {
  id: string;
  venue_key: string;
  venue_id: string | null;
  host_city_key: string;
  host_city_name_es: string;
  host_city_name_en: string;
  common_name: string;
  fifa_tournament_name: string;
  actual_city: string;
  country_code: string;
  timezone: string;
  metadata_json: Record<string, unknown> | null;
};

type OfficialScheduleMatchRow = {
  id: string;
  schedule_snapshot_id: string;
  tournament_key: string;
  official_match_number: number;
  stage_key: string;
  group_key: string | null;
  home_slot: string;
  away_slot: string;
  home_team_key: string | null;
  away_team_key: string | null;
  scheduled_at_utc: string;
  published_time: string;
  published_timezone: string;
  venue_key: string;
  source_snapshot_id: string;
  metadata_json: Record<string, unknown> | null;
};

type OfficialScheduleMatchLinkRow = {
  id: string;
  official_schedule_match_id: string;
  match_id: string | null;
  api_football_fixture_id: number | null;
  link_status: "linked" | "candidate" | "unresolved";
  metadata_json: Record<string, unknown> | null;
};

type AuthUserRow = {
  id: string;
  email: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  role: string;
};

export type RemoteState = {
  tableCounts: Record<string, number>;
  competitions: CompetitionRow[];
  seasons: SeasonRow[];
  teams: TeamRow[];
  venues: VenueRow[];
  matches: MatchRow[];
  sourceSnapshots: SourceSnapshotRow[];
  canonicalTeamAliases: CanonicalTeamAliasRow[];
  canonicalTeamLocalizations: CanonicalTeamLocalizationRow[];
  canonicalTeamLinks: CanonicalTeamLinkRow[];
  teamRatingSnapshots: TeamRatingSnapshotDbRow[];
  historicalMatchFacts: HistoricalMatchFactDbRow[];
  scheduleSnapshots: ScheduleSnapshotRow[];
  worldCupVenueCatalog: WorldCupVenueCatalogRow[];
  officialScheduleMatches: OfficialScheduleMatchRow[];
  officialScheduleMatchLinks: OfficialScheduleMatchLinkRow[];
  authUsers: AuthUserRow[];
  profiles: ProfileRow[];
  migrationHistory: MigrationHistoryReadState;
};

type TablePlanRow = {
  key: string;
  action: "insert" | "update" | "skip" | "reject" | "conflict";
  reason: string;
  sourceEvidence: SourceRowEvidence[];
};

type TablePlan = {
  table: TableName;
  currentRemoteCount: number;
  sourceRowCount: number;
  plannedInserts: number;
  plannedUpdates: number;
  deterministicSkips: number;
  rejectedOrUnmapped: number;
  conflictKeyCount: number;
  conflictRowCount: number;
  naturalKey: string;
  sourceFiles: string[];
  sourceCutoff: string;
  manifestStatus: "verified" | "blocked";
  balancedAccounting: {
    isBalanced: boolean;
    accountedRowCount: number;
    formula: string;
  };
  rows: TablePlanRow[];
};

type MigrationHistoryReadState =
  | {
      status: "verified_count";
      count: number;
      externallyVerifiedExpectedCount: number | null;
      detail: string;
    }
  | {
      status: "unavailable_read_denied";
      count: null;
      externallyVerifiedExpectedCount: number | null;
      detail: string;
    }
  | {
      status: "query_error";
      count: null;
      externallyVerifiedExpectedCount: number | null;
      detail: string;
    }
  | {
      status: "actual_zero";
      count: 0;
      externallyVerifiedExpectedCount: number | null;
      detail: string;
    };

type PreservationSnapshot = {
  authUserCount: number;
  existingAuthUsers: Array<{ id: string; email: string | null }>;
  profileCount: number;
  existingAdminProfiles: Array<{ id: string; email: string | null; role: string }>;
  migrationHistory: MigrationHistoryReadState & {
    importerIndependentlyVerified?: boolean;
    externalOperatorAttestationAccepted?: boolean;
    verificationMode?: "importer_read_path" | "external_operator_attestation" | "unverified";
  };
};

type SourceSnapshotMappingEntry = {
  snapshotId: string;
  sourceKey: Task1SourceKey;
  dataKind: string;
  normalizedSnapshotPath: string | null;
  localFallbackPath: string | null;
  sourceFiles: string[];
  effectiveAt: string | null;
  capturedAt: string | null;
};

type SourceSnapshotSentinelEntry = {
  sourceKey: string;
  snapshotId: string;
  treatment: "omitted_non_file_backed_sentinel";
  reason: string;
};

type RequiredTableCheck = {
  table: string;
  readable: boolean;
  existsByRead: boolean;
  currentRemoteCount: number | null;
  note: string;
};

type FreshnessClassification = {
  stableReferenceData: string[];
  historicalFacts: string[];
  retainedSnapshots: string[];
  scheduleNeedsLaterRefresh: string[];
  rankingsNeedLaterRefresh: string[];
};

export type StageBootstrapAuthorization = {
  mode: BootstrapMode;
  projectRef: string;
  denyProjectRef: string;
  supabaseUrlHost: string;
  targetEnvironment: string;
  productionDenied: true;
  allowRemoteDevWrite: boolean;
  expectedMigrationCount: number | null;
  acceptExternalMigrationVerification: boolean;
};

export type StageBootstrapPlan = {
  authorization: StageBootstrapAuthorization;
  resolvedSourceFiles: SourceFileEvidence[];
  manifestStatus: "verified" | "blocked";
  freshness: FreshnessClassification;
  preservation: PreservationSnapshot;
  sourceSnapshotMapping: SourceSnapshotMappingEntry[];
  sourceSnapshotSentinels: SourceSnapshotSentinelEntry[];
  requiredTableChecks: RequiredTableCheck[];
  tables: TablePlan[];
  deferredOfficialToRuntimeLinkageCount: number;
  deferredOfficialToRuntimeLinkageMatchNumbers: number[];
  applyEligible: boolean;
  applyEligibilityReasons: string[];
  blockers: string[];
  worldCupResolution: {
    competitionWillResolve: boolean;
    seasonWillResolve: boolean;
    publishQueueCompetitionResolvable: boolean;
    note: string;
  };
};

export type RunTask3BStageBootstrapInput = {
  repoRoot: string;
  preparedDir: string;
  artifactsDir: string;
  projectRef: string;
  denyProjectRef: string;
  expectedMigrationCount: number | null;
  acceptExternalMigrationVerification: boolean;
  dryRun: boolean;
  apply: boolean;
};

function readText(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readText(filePath)) as T;
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

function ensureDirectory(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath: string, payload: unknown): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function normalizeIdentity(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function sha256File(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sha256Json(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function makeSourceEvidence(
  sourceFile: string,
  sourceRowIndex: number,
  payload: Record<string, unknown>,
  sourceLine: number | null = null,
): SourceRowEvidence {
  return {
    sourceFile,
    sourceLine,
    sourceRowIndex,
    payload,
  };
}

function formatEffectiveAt(dateValue: string | null | undefined): string | null {
  if (!dateValue) {
    return null;
  }

  if (dateValue.includes("T")) {
    return dateValue;
  }

  return `${dateValue}T00:00:00Z`;
}

function normalizeComparableTimestamp(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString().replace(".000Z", "Z");
}

function normalizeComparableNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeComparableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeComparableValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, normalizeComparableValue(nestedValue)]),
    );
  }

  return value;
}

function serializeComparable(value: unknown): string {
  return JSON.stringify(normalizeComparableValue(value));
}

function buildDefaultArtifactsDir(repoRoot: string): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10);
  const runPart = now.toISOString().replace(/[:.]/g, "-");
  return path.join(repoRoot, STAGE_BOOTSTRAP_ARTIFACT_ROOT, datePart, runPart);
}

function isPathWithinResolvedRoot(args: { candidatePath: string; rootPath: string; allowSamePath?: boolean }): boolean {
  const relativePath = path.relative(args.rootPath, args.candidatePath);
  if (relativePath === "") {
    return args.allowSamePath ?? false;
  }

  return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

export function assertTask3BStageBootstrapLocalRunPreflight(repoRoot: string, artifactsDir: string): void {
  const resolvedArtifactsDir = path.resolve(artifactsDir);
  const allowedRoot = path.resolve(repoRoot, STAGE_BOOTSTRAP_ARTIFACT_ROOT);

  if (
    !isPathWithinResolvedRoot({
      candidatePath: resolvedArtifactsDir,
      rootPath: allowedRoot,
      allowSamePath: false,
    })
  ) {
    throw new Error(
      `Task 3B stage bootstrap refused because artifactsDir must resolve inside ${allowedRoot}${path.sep}.`,
    );
  }
}

export function assertStageBootstrapAuthorization(input: {
  projectRef: string | null;
  denyProjectRef: string | null;
  expectedMigrationCount: number | null;
  acceptExternalMigrationVerification: boolean;
  dryRun: boolean;
  apply: boolean;
  supabaseUrl: string | null | undefined;
}): StageBootstrapAuthorization {
  if (!input.projectRef) {
    throw new Error("Missing required --project-ref.");
  }

  if (!input.denyProjectRef) {
    throw new Error("Missing required --deny-project-ref.");
  }

  if (input.projectRef !== "yfmklapgjrupctgxaako") {
    throw new Error(`Unknown or unauthorized project ref: ${input.projectRef}.`);
  }

  if (input.projectRef === input.denyProjectRef) {
    throw new Error("Production project ref is denied.");
  }

  if (input.denyProjectRef !== "gcpdffkgsdomzyoenalg") {
    throw new Error(`Unexpected deny project ref: ${input.denyProjectRef}.`);
  }

  if (input.dryRun === input.apply) {
    throw new Error("Specify exactly one of --dry-run or --apply.");
  }

  const targetEnvironment = process.env.PREDICTION_INTELLIGENCE_TARGET;
  if (targetEnvironment !== "development") {
    throw new Error("PREDICTION_INTELLIGENCE_TARGET must be exactly development.");
  }

  const allowRemoteDevWrite = process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE === "true";
  if (input.apply && !allowRemoteDevWrite) {
    throw new Error("Apply mode requires PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE=true.");
  }

  if (input.apply && input.expectedMigrationCount !== 46) {
    throw new Error("Apply mode requires --expected-migration-count 46.");
  }

  const supabaseUrl = input.supabaseUrl;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  let parsedHost: string;
  try {
    parsedHost = new URL(supabaseUrl).host;
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  }

  if (parsedHost !== `${input.projectRef}.supabase.co`) {
    throw new Error(`Supabase URL host mismatch. Expected ${input.projectRef}.supabase.co.`);
  }

  const envProjectRef = process.env.DEV_SUPABASE_PROJECT_REF;
  if (envProjectRef && envProjectRef !== input.projectRef) {
    throw new Error(`DEV_SUPABASE_PROJECT_REF does not match the explicit --project-ref.`);
  }

  const denyProjectRef = input.denyProjectRef;
  const targetStrings = [input.projectRef, supabaseUrl, parsedHost];
  if (targetStrings.some((value) => value.includes(denyProjectRef))) {
    throw new Error("Production project ref appeared in a resolved target string.");
  }

  if (targetStrings.some((value) => /prod|production/i.test(value) && value !== parsedHost)) {
    throw new Error("A production-looking target string was detected.");
  }

  return {
    mode: input.dryRun ? "dry_run" : "apply",
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    supabaseUrlHost: parsedHost,
    targetEnvironment,
    productionDenied: true,
    allowRemoteDevWrite,
    expectedMigrationCount: input.expectedMigrationCount,
    acceptExternalMigrationVerification: input.acceptExternalMigrationVerification,
  };
}

function buildPreparedSourceFiles(preparedDir: string): string[] {
  return [
    "source-registry.json",
    path.join("contracts", "canonical-source-contracts.json"),
    path.join("reference", "team-aliases.csv"),
    path.join("reference", "team-localizations-es-en.csv"),
    path.join("reference", "world-cup-2026-venues.csv"),
    path.join("reference", "world-cup-2026-schedule.json"),
    path.join("normalized-snapshot", "elo-ranking-2026-06-20.csv"),
    path.join("normalized-snapshot", "elo-ranking-start-2026.csv"),
    path.join("normalized-snapshot", "fifa-ranking-2026-06-11-captured-2026-06-20.csv"),
    path.join("normalized-snapshot", "elo-fixtures-2026-06-20.csv"),
    path.join("normalized-snapshot", "elo-results-2025.csv"),
    path.join("normalized-snapshot", "elo-results-2026-window.csv"),
  ].map((relativePath) => path.resolve(preparedDir, relativePath));
}

function loadAliasSourceEvidence(preparedDir: string): Array<CanonicalTeamAlias & SourceRowEvidence> {
  const relativePath = path.join("reference", "team-aliases.csv");
  const absolutePath = path.join(preparedDir, relativePath);
  return parseCsv(readText(absolutePath)).map((row, index) => ({
    alias: row.alias,
    canonical_team_key: row.canonical_team_key,
    canonical_name_en: row.canonical_name_en,
    source_scope: row.source_scope,
    resolution_status: row.resolution_status,
    sourceFile: relativePath,
    sourceLine: index + 2,
    sourceRowIndex: index + 1,
    payload: row,
  }));
}

function buildSourceSnapshotMappingEntries(
  sourceSnapshots: SourceSnapshotSeed[],
  preparedDir: string,
): SourceSnapshotMappingEntry[] {
  const sourceFilesBySnapshotId = new Map<string, string[]>();
  const addFile = (snapshotId: string, relativePath: string) => {
    const collection = sourceFilesBySnapshotId.get(snapshotId) ?? [];
    if (!collection.includes(relativePath)) {
      collection.push(relativePath);
      sourceFilesBySnapshotId.set(snapshotId, collection);
    }
  };

  addFile("world-cup-venues-2026-06-20", path.join("reference", "team-aliases.csv"));
  addFile("world-cup-venues-2026-06-20", path.join("reference", "team-localizations-es-en.csv"));
  addFile("world-cup-venues-2026-06-20", path.join("reference", "world-cup-2026-venues.csv"));
  addFile("fifa-fwc26-schedule-v17-2026-04-10", path.join("reference", "world-cup-2026-schedule.json"));
  addFile("elo-results-2025", path.join("normalized-snapshot", "elo-results-2025.csv"));
  addFile("elo-results-recent-2026-06-20", path.join("normalized-snapshot", "elo-results-2026-window.csv"));

  return sourceSnapshots.map((snapshot) => ({
    snapshotId: snapshot.snapshot_id,
    sourceKey: snapshot.source_key,
    dataKind: snapshot.data_kind,
    normalizedSnapshotPath:
      snapshot.normalized_snapshot_path == null ? null : path.relative(preparedDir, snapshot.normalized_snapshot_path),
    localFallbackPath: snapshot.local_fallback_path,
    sourceFiles: sourceFilesBySnapshotId.get(snapshot.snapshot_id) ?? [],
    effectiveAt: snapshot.effective_at,
    capturedAt: snapshot.captured_at,
  }));
}

function buildSourceSnapshotSentinelEntries(): SourceSnapshotSentinelEntry[] {
  return [
    {
      sourceKey: "api_football",
      snapshotId: "api-football-provider-linkage-reference-none",
      treatment: "omitted_non_file_backed_sentinel",
      reason:
        "No normalized file-backed API-Football linkage snapshot exists in this slice, so the sentinel is tracked outside source_snapshots without a checksum claim.",
    },
  ];
}

export function verifyPreparedSources(preparedDir: string): {
  manifest: PackageManifest;
  registry: SourceRegistry;
  files: SourceFileEvidence[];
  status: "verified" | "blocked";
  blockers: string[];
} {
  const manifestPath = path.join(preparedDir, "package-manifest.json");
  const registryPath = path.join(preparedDir, "source-registry.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing source manifest: ${manifestPath}`);
  }
  if (!fs.existsSync(registryPath)) {
    throw new Error(`Missing source registry: ${registryPath}`);
  }

  const manifest = readJson<PackageManifest>(manifestPath);
  const registry = readJson<SourceRegistry>(registryPath);
  const manifestByPath = new Map(manifest.package_files.map((entry) => [path.normalize(entry.path), entry]));
  const blockers: string[] = [];

  const files = buildPreparedSourceFiles(preparedDir).map((absolutePath) => {
    if (!fs.existsSync(absolutePath)) {
      blockers.push(`Missing required source file: ${absolutePath}`);
      return {
        absolutePath,
        relativePath: path.relative(preparedDir, absolutePath),
        sha256: "",
        sizeBytes: 0,
        manifestSha256: null,
        manifestStatus: "missing_from_manifest" as const,
      };
    }

    const relativePath = path.normalize(path.relative(preparedDir, absolutePath));
    const manifestEntry = manifestByPath.get(relativePath) ?? null;
    const sha256 = sha256File(absolutePath);
    const sizeBytes = fs.statSync(absolutePath).size;
    const manifestStatus: SourceFileEvidence["manifestStatus"] =
      manifestEntry == null ? "missing_from_manifest" : manifestEntry.sha256 === sha256 ? "verified" : "hash_mismatch";

    if (manifestStatus !== "verified") {
      blockers.push(`Manifest verification failed for ${relativePath}: ${manifestStatus}.`);
    }

    return {
      absolutePath,
      relativePath,
      sha256,
      sizeBytes,
      manifestSha256: manifestEntry?.sha256 ?? null,
      manifestStatus,
    };
  });

  return {
    manifest,
    registry,
    files,
    status: blockers.length === 0 ? "verified" : "blocked",
    blockers,
  };
}

function findRegistryEntry(registry: SourceRegistry, sourceKey: Task1SourceKey): SourceRegistryEntry {
  const found = registry.sources.find((entry) => entry.source_key === sourceKey);
  if (!found) {
    throw new Error(`Missing source registry entry for ${sourceKey}.`);
  }
  return found;
}

function buildSourceSnapshotSeeds(input: {
  preparedDir: string;
  registry: SourceRegistry;
  datasets: ReturnType<typeof loadTask1Datasets>;
}): SourceSnapshotSeed[] {
  const uniqueSnapshots = new Map<string, SourceSnapshotSeed>();
  const addSnapshot = (seed: SourceSnapshotSeed) => {
    if (!uniqueSnapshots.has(seed.snapshot_id)) {
      uniqueSnapshots.set(seed.snapshot_id, seed);
    }
  };

  const registrySeeds: Array<{ sourceKey: Task1SourceKey; rowCount: number; snapshotId: string; effectiveAt: string | null; capturedAt: string | null }> = [
    {
      sourceKey: "elo_current",
      rowCount: input.datasets.eloCurrent.length,
      snapshotId: input.datasets.eloCurrent[0]?.source_snapshot_id ?? "elo-current-unknown",
      effectiveAt: formatEffectiveAt(input.datasets.eloCurrent[0]?.effective_date),
      capturedAt: formatEffectiveAt(input.datasets.eloCurrent[0]?.captured_date),
    },
    {
      sourceKey: "elo_start_2026",
      rowCount: input.datasets.eloStart2026.length,
      snapshotId: input.datasets.eloStart2026[0]?.source_snapshot_id ?? "elo-start-2026-unknown",
      effectiveAt: formatEffectiveAt(input.datasets.eloStart2026[0]?.effective_date),
      capturedAt: formatEffectiveAt(input.datasets.eloStart2026[0]?.captured_date),
    },
    {
      sourceKey: "fifa_men_ranking",
      rowCount: input.datasets.fifaRanking.length,
      snapshotId: input.datasets.fifaRanking[0]?.source_snapshot_id ?? "fifa-men-ranking-unknown",
      effectiveAt:
        formatEffectiveAt(findRegistryEntry(input.registry, "fifa_men_ranking").official_effective_date_for_snapshot ?? null) ??
        formatEffectiveAt(input.datasets.fifaRanking[0]?.effective_date),
      capturedAt: formatEffectiveAt(input.datasets.fifaRanking[0]?.captured_date),
    },
    {
      sourceKey: "elo_fixtures",
      rowCount: input.datasets.eloFixtures.length,
      snapshotId: input.datasets.eloFixtures[0]?.source_snapshot_id ?? "elo-fixtures-unknown",
      effectiveAt: formatEffectiveAt(input.datasets.eloFixtures[0]?.fixture_date),
      capturedAt: null,
    },
    {
      sourceKey: "fifa_world_cup_schedule_v17",
      rowCount: input.datasets.schedule.length,
      snapshotId: input.datasets.schedule[0]?.source_snapshot_id ?? "fifa-world-cup-schedule-v17-unknown",
      effectiveAt: "2026-04-10T00:00:00Z",
      capturedAt: formatEffectiveAt(input.registry.generated_at_utc),
    },
    {
      sourceKey: "world_cup_venues",
      rowCount: input.datasets.venues.length,
      snapshotId: "world-cup-venues-2026-06-20",
      effectiveAt: "2026-06-20T00:00:00Z",
      capturedAt: formatEffectiveAt(input.registry.generated_at_utc),
    },
    {
      sourceKey: "elo_results_2025",
      rowCount: input.datasets.historicalFacts.filter((row) => row.source_snapshot_id.includes("2025")).length,
      snapshotId: "elo-results-2025",
      effectiveAt: "2025-12-31T00:00:00Z",
      capturedAt: formatEffectiveAt(input.registry.generated_at_utc),
    },
    {
      sourceKey: "elo_latest_results",
      rowCount: input.datasets.historicalFacts.filter((row) => row.source_snapshot_id.includes("2026")).length,
      snapshotId: "elo-results-recent-2026-06-20",
      effectiveAt: "2026-06-20T00:00:00Z",
      capturedAt: formatEffectiveAt(input.registry.generated_at_utc),
    },
  ];

  for (const seed of registrySeeds) {
    const entry = findRegistryEntry(input.registry, seed.sourceKey);
    const payloadPath =
      entry.normalized_snapshot_file == null ? null : path.join(input.preparedDir, entry.normalized_snapshot_file);
    const fallbackPath =
      entry.local_fallback_file == null ? null : path.join(path.dirname(input.preparedDir), entry.local_fallback_file);
    const payloadHash =
      payloadPath && fs.existsSync(payloadPath)
        ? sha256File(payloadPath)
        : sha256Json({
            sourceKey: seed.sourceKey,
            snapshotId: seed.snapshotId,
            rowCount: seed.rowCount,
          });

    addSnapshot({
      source_key: seed.sourceKey,
      snapshot_id: seed.snapshotId,
      data_kind: entry.data_kind,
      local_fallback_path: fallbackPath,
      normalized_snapshot_path: payloadPath,
      effective_at: seed.effectiveAt,
      captured_at: seed.capturedAt,
      payload_hash: payloadHash,
      row_count: seed.rowCount,
      metadata_json: {
        snapshot_date: input.registry.snapshot_date,
        refresh_policy: entry.refresh_policy ?? null,
      },
    });
  }

  return [...uniqueSnapshots.values()];
}

function buildFreshnessClassification(preparedDir: string): FreshnessClassification {
  const snapshotCutoff = "2026-06-20";
  return {
    stableReferenceData: [
      path.join(preparedDir, "reference", "team-aliases.csv"),
      path.join(preparedDir, "reference", "team-localizations-es-en.csv"),
      path.join(preparedDir, "reference", "world-cup-2026-venues.csv"),
    ],
    historicalFacts: [
      path.join(preparedDir, "normalized-snapshot", "elo-results-2025.csv"),
      path.join(preparedDir, "normalized-snapshot", "elo-results-2026-window.csv"),
    ],
    retainedSnapshots: [
      `Prepared workspace snapshot cutoff retained at ${snapshotCutoff}.`,
      path.join(preparedDir, "normalized-snapshot", "elo-ranking-2026-06-20.csv"),
      path.join(preparedDir, "normalized-snapshot", "elo-ranking-start-2026.csv"),
      path.join(preparedDir, "normalized-snapshot", "fifa-ranking-2026-06-11-captured-2026-06-20.csv"),
    ],
    scheduleNeedsLaterRefresh: [
      "Official schedule rows are bootstrapped from the historical/reference schedule snapshot and may require a later current refresh.",
    ],
    rankingsNeedLaterRefresh: [
      "Elo and FIFA snapshots are imported with their original cutoff and are not treated as current truth as of 2026-06-26.",
    ],
  };
}

function buildCanonicalKeyToRuntimeTeamMap(
  localizations: CanonicalTeamLocalization[],
  aliases: CanonicalTeamAlias[],
): Map<string, (typeof WORLD_CUP_2026_TEAMS)[number]> {
  const runtimeByNormalized = new Map<string, (typeof WORLD_CUP_2026_TEAMS)[number]>();

  for (const team of WORLD_CUP_2026_TEAMS) {
    const values = [team.teamKey, team.displayName, team.fifaOfficialName, team.slug, team.fifaCode, ...team.aliases];
    for (const value of values) {
      runtimeByNormalized.set(normalizeIdentity(value), team);
    }
  }

  const aliasesByCanonical = new Map<string, string[]>();
  for (const alias of aliases) {
    const collection = aliasesByCanonical.get(alias.canonical_team_key) ?? [];
    collection.push(alias.alias);
    aliasesByCanonical.set(alias.canonical_team_key, collection);
  }

  const result = new Map<string, (typeof WORLD_CUP_2026_TEAMS)[number]>();
  for (const localization of localizations) {
    const candidateValues = [
      localization.canonical_team_key,
      localization.display_name_en,
      localization.display_name_es,
      localization.elo_name_raw ?? "",
      localization.fifa_code ?? "",
      ...(aliasesByCanonical.get(localization.canonical_team_key) ?? []),
    ];
    const runtime = candidateValues
      .map((value) => runtimeByNormalized.get(normalizeIdentity(value)))
      .find((value) => value != null);

    if (runtime) {
      result.set(localization.canonical_team_key, runtime);
    }
  }

  return result;
}

function toRuntimeVenueCountry(code: string): string {
  switch (code) {
    case "US":
      return "USA";
    case "MX":
      return "Mexico";
    case "CA":
      return "Canada";
    default:
      return code;
  }
}

function normalizeScheduleTeamKey(value: string | null): string | null {
  if (value == null) {
    return null;
  }

  return normalizeIdentity(value);
}

function normalizeFixtureTeamKey(value: string): string {
  return normalizeIdentity(value);
}

function buildRuntimeSeeds(input: {
  localizations: CanonicalTeamLocalization[];
  aliases: CanonicalTeamAlias[];
  schedule: WorldCupScheduleMatch[];
  venues: WorldCupVenue[];
}): {
  competition: RuntimeCompetitionSeed;
  season: RuntimeSeasonSeed;
  teams: RuntimeTeamSeed[];
  venues: RuntimeVenueSeed[];
  matches: RuntimeMatchSeed[];
  blockers: string[];
  deferredOfficialMatchNumbers: number[];
} {
  const blockers: string[] = [];
  const deferredOfficialMatchNumbers: number[] = [];
  const canonicalToRuntime = buildCanonicalKeyToRuntimeTeamMap(input.localizations, input.aliases);
  const localizationsByCanonical = new Map(input.localizations.map((row) => [row.canonical_team_key, row]));
  const venueByKey = new Map(input.venues.map((row) => [row.venue_key, row]));
  const fixtureByMatchNumber = new Map<number, (typeof WORLD_CUP_2026_FIXTURES)[number]>(
    WORLD_CUP_2026_FIXTURES.map((fixture) => [fixture.matchNumber, fixture]),
  );

  const scheduleTeams = Array.from(
    new Set(
      input.schedule.flatMap((row) =>
        [row.home_team_key, row.away_team_key].filter(
          (value): value is string => value != null && value.trim().length > 0,
        ),
      ),
    ),
  ).sort();

  const teams: RuntimeTeamSeed[] = [];
  for (const canonicalTeamKey of scheduleTeams) {
    const runtimeTeam = canonicalToRuntime.get(canonicalTeamKey);
    const localization = localizationsByCanonical.get(canonicalTeamKey);
    if (!runtimeTeam || !localization) {
      blockers.push(`Unmapped runtime team for canonical key ${canonicalTeamKey}.`);
      continue;
    }

    teams.push({
      canonical_team_key: canonicalTeamKey,
      slug: runtimeTeam.slug,
      name: runtimeTeam.displayName,
      country: runtimeTeam.country,
      fifa_code: runtimeTeam.fifaCode,
    });
  }

  const venues = input.venues.map((row) => ({
    venue_key: row.venue_key,
    name: row.common_name,
    city: row.actual_city,
    country: toRuntimeVenueCountry(row.country_code),
  }));

  const matches: RuntimeMatchSeed[] = [];
  for (const scheduleRow of input.schedule) {
    const fixture = fixtureByMatchNumber.get(scheduleRow.official_match_number);
    if (!fixture) {
      deferredOfficialMatchNumbers.push(scheduleRow.official_match_number);
      continue;
    }

    const venue = venueByKey.get(scheduleRow.venue_key);
    if (!venue) {
      blockers.push(`Missing prepared venue mapping for official match ${scheduleRow.official_match_number}.`);
      continue;
    }

    const homeRuntime = scheduleRow.home_team_key ? canonicalToRuntime.get(scheduleRow.home_team_key) ?? null : null;
    const awayRuntime = scheduleRow.away_team_key ? canonicalToRuntime.get(scheduleRow.away_team_key) ?? null : null;
    if (!homeRuntime || !awayRuntime) {
      blockers.push(`Unmapped runtime teams for official match ${scheduleRow.official_match_number}.`);
      continue;
    }

    const identityMismatch =
      normalizeFixtureTeamKey(fixture.homeTeamKey) !== normalizeScheduleTeamKey(homeRuntime.slug) ||
      normalizeFixtureTeamKey(fixture.awayTeamKey) !== normalizeScheduleTeamKey(awayRuntime.slug) ||
      fixture.kickoffAt !== scheduleRow.scheduled_at_utc ||
      normalizeIdentity(fixture.venueKey) !== normalizeIdentity(scheduleRow.venue_key);

    if (identityMismatch) {
      blockers.push(`Canonical runtime fixture mismatch for official match ${scheduleRow.official_match_number}.`);
      continue;
    }

    matches.push({
      official_match_number: scheduleRow.official_match_number,
      competition_slug: WORLD_CUP_COMPETITION_SLUG,
      season_year: WORLD_CUP_SEASON_YEAR,
      slug: fixture.matchSlug,
      external_id: fixture.apiFootballExternalId,
      home_team_slug: homeRuntime.slug,
      away_team_slug: awayRuntime.slug,
      venue_key: scheduleRow.venue_key,
      kickoff_at: scheduleRow.scheduled_at_utc,
      stage: fixture.stage,
      status: "scheduled",
      access_scope: "admin_only",
      intake_source: fixture.apiFootballExternalId ? "api_football" : "manual",
      source_note: fixture.sourceNotes,
    });
  }

  const competition: RuntimeCompetitionSeed = {
    external_id: buildApiFootballLeagueExternalId(WORLD_CUP_PROVIDER_LEAGUE_ID),
    slug: WORLD_CUP_COMPETITION_SLUG,
    name: WORLD_CUP_COMPETITION_NAME,
    country: null,
    type: "international",
    usage_scope: "public_product",
  };

  const kickoffDates = input.schedule.map((row) => row.scheduled_date_et).sort();
  const season: RuntimeSeasonSeed = {
    competition_slug: WORLD_CUP_COMPETITION_SLUG,
    year: WORLD_CUP_SEASON_YEAR,
    name: String(WORLD_CUP_SEASON_YEAR),
    starts_at: kickoffDates[0] ?? "2026-06-11",
    ends_at: kickoffDates.at(-1) ?? "2026-07-19",
  };

  return { competition, season, teams, venues, matches, blockers, deferredOfficialMatchNumbers };
}

function buildTablePlan(args: {
  table: TableName;
  currentRemoteCount: number | null;
  sourceRows: Array<{ key: string; comparable: Record<string, unknown>; sourceEvidence: SourceRowEvidence }>;
  existingRows: Array<{ key: string; comparable: Record<string, unknown> }>;
  naturalKey: string;
  sourceFiles: string[];
  sourceCutoff: string;
  manifestStatus: "verified" | "blocked";
  semanticComparable?: (comparable: Record<string, unknown>) => Record<string, unknown>;
}): TablePlan {
  const rows: TablePlanRow[] = [];
  const sourceMap = new Map<string, Array<{ comparable: Record<string, unknown>; sourceEvidence: SourceRowEvidence }>>();
  for (const row of args.sourceRows) {
    const collection = sourceMap.get(row.key) ?? [];
    collection.push({ comparable: row.comparable, sourceEvidence: row.sourceEvidence });
    sourceMap.set(row.key, collection);
  }

  const existingMap = new Map<string, Record<string, unknown>[]>();
  for (const row of args.existingRows) {
    const collection = existingMap.get(row.key) ?? [];
    collection.push(row.comparable);
    existingMap.set(row.key, collection);
  }

  let plannedInserts = 0;
  let plannedUpdates = 0;
  let deterministicSkips = 0;
  let rejectedOrUnmapped = 0;
  let conflictKeyCount = 0;
  let conflictRowCount = 0;

  for (const [key, sourceEntries] of sourceMap.entries()) {
    const sortedSourceEntries = [...sourceEntries].sort((left, right) => {
      if (left.sourceEvidence.sourceFile !== right.sourceEvidence.sourceFile) {
        return left.sourceEvidence.sourceFile.localeCompare(right.sourceEvidence.sourceFile);
      }
      const leftLine = left.sourceEvidence.sourceLine ?? Number.MAX_SAFE_INTEGER;
      const rightLine = right.sourceEvidence.sourceLine ?? Number.MAX_SAFE_INTEGER;
      if (leftLine !== rightLine) {
        return leftLine - rightLine;
      }
      return left.sourceEvidence.sourceRowIndex - right.sourceEvidence.sourceRowIndex;
    });
    const normalizeComparable = args.semanticComparable ?? ((comparable: Record<string, unknown>) => comparable);
    const canonicalComparable = serializeComparable(normalizeComparable(sortedSourceEntries[0].comparable));
    const hasIncompatibleSourcePayload = sourceEntries.some(
      (entry) => serializeComparable(normalizeComparable(entry.comparable)) !== canonicalComparable,
    );

    if (hasIncompatibleSourcePayload) {
      conflictKeyCount += 1;
      conflictRowCount += sortedSourceEntries.length;
      rows.push({
        key,
        action: "conflict",
        reason: "duplicate_source_natural_key",
        sourceEvidence: sortedSourceEntries.map((entry) => entry.sourceEvidence),
      });
      continue;
    }

    const comparable = sortedSourceEntries[0].comparable;

    const existing = existingMap.get(key) ?? [];
    if (existing.length > 1) {
      conflictKeyCount += 1;
      conflictRowCount += sortedSourceEntries.length;
      rows.push({
        key,
        action: "conflict",
        reason: "duplicate_remote_natural_key",
        sourceEvidence: sortedSourceEntries.map((entry) => entry.sourceEvidence),
      });
      continue;
    }

    if (existing.length === 0) {
      plannedInserts += 1;
      rows.push({
        key,
        action: "insert",
        reason: "missing_remote_row",
        sourceEvidence: [sortedSourceEntries[0].sourceEvidence],
      });
      for (const duplicateEntry of sortedSourceEntries.slice(1)) {
        deterministicSkips += 1;
        rows.push({
          key,
          action: "skip",
          reason: "duplicate_source_identical_payload",
          sourceEvidence: [duplicateEntry.sourceEvidence],
        });
      }
      continue;
    }

    const existingComparable = serializeComparable(existing[0]);
    const nextComparable = serializeComparable(comparable);
    if (existingComparable === nextComparable) {
      deterministicSkips += sortedSourceEntries.length;
      rows.push({
        key,
        action: "skip",
        reason: "already_identical",
        sourceEvidence: sortedSourceEntries.map((entry) => entry.sourceEvidence),
      });
      continue;
    }

    plannedUpdates += 1;
      rows.push({
        key,
        action: "update",
        reason: "existing_row_differs",
        sourceEvidence: [sortedSourceEntries[0].sourceEvidence],
      });
    for (const duplicateEntry of sortedSourceEntries.slice(1)) {
      deterministicSkips += 1;
      rows.push({
        key,
        action: "skip",
        reason: "duplicate_source_identical_payload",
        sourceEvidence: [duplicateEntry.sourceEvidence],
      });
    }
  }

  rejectedOrUnmapped += rows.filter((row) => row.action === "reject").length;
  const accountedRowCount =
    plannedInserts + plannedUpdates + deterministicSkips + rejectedOrUnmapped + conflictRowCount;

  return {
    table: args.table,
    currentRemoteCount: args.currentRemoteCount ?? 0,
    sourceRowCount: args.sourceRows.length,
    plannedInserts,
    plannedUpdates,
    deterministicSkips,
    rejectedOrUnmapped,
    conflictKeyCount,
    conflictRowCount,
    naturalKey: args.naturalKey,
    sourceFiles: args.sourceFiles,
    sourceCutoff: args.sourceCutoff,
    manifestStatus: args.manifestStatus,
    balancedAccounting: {
      isBalanced: args.sourceRows.length === accountedRowCount,
      accountedRowCount,
      formula: "source rows = inserts + updates + skips + rejects + conflict row count",
    },
    rows,
  };
}

function buildRatingsSourceRows(rows: RatingSnapshotRow[], sourceKey: "elo" | "fifa") {
  return rows.map((row) => ({
    key: `${sourceKey}|${normalizeComparableTimestamp(formatEffectiveAt(row.effective_date))}|${row.canonical_team_key}`,
    comparable: {
      source_key: sourceKey,
      effective_at: normalizeComparableTimestamp(formatEffectiveAt(row.effective_date)),
      captured_at: normalizeComparableTimestamp(formatEffectiveAt(row.captured_date)),
      canonical_team_key: row.canonical_team_key,
      rank: row.current_rank,
      rating_or_points: normalizeComparableNumber(sourceKey === "elo" ? row.elo_rating ?? null : row.fifa_points ?? null),
      source_snapshot_id: row.source_snapshot_id,
      raw_values: row.raw_values,
    },
    sourceEvidence: makeSourceEvidence(row.source_file ?? `${sourceKey}.csv`, row.source_row_number ?? 0, row.raw_values),
  }));
}

function buildHistoricalFactSourceRows(rows: HistoricalMatchFact[]) {
  return rows.map((row) => ({
    key: `${row.source_snapshot_id}|${row.natural_match_key}`,
    comparable: {
      natural_match_key: row.natural_match_key,
      match_date: row.match_date,
      team_1_key: row.team_1_key,
      team_2_key: row.team_2_key,
      competition_key: row.competition_key,
      venue_context_key: row.event_location_raw,
      neutral: null,
      score_1: row.score_1,
      score_2: row.score_2,
      pre_match_elo_1: normalizeComparableNumber(row.pre_match_elo_1),
      pre_match_elo_2: normalizeComparableNumber(row.pre_match_elo_2),
      post_match_elo_1: normalizeComparableNumber(row.post_match_elo_1),
      post_match_elo_2: normalizeComparableNumber(row.post_match_elo_2),
      source_snapshot_id: row.source_snapshot_id,
      correction_of_id: null,
      raw_values: row,
    },
    sourceEvidence: makeSourceEvidence(row.source_file, row.source_row_number, row as unknown as Record<string, unknown>),
  }));
}

function buildRemoteComparableRows(state: RemoteState, runtimeSeeds: ReturnType<typeof buildRuntimeSeeds>, sourceSnapshots: SourceSnapshotSeed[]) {
  const competitionSeed = runtimeSeeds.competition;
  const seasonSeed = runtimeSeeds.season;
  const competitionRow = state.competitions.find((row) => row.slug === competitionSeed.slug) ?? null;
  const seasonRow =
    competitionRow == null
      ? null
      : state.seasons.find((row) => row.competition_id === competitionRow.id && row.year === seasonSeed.year) ?? null;

  const teamBySlug = new Map(state.teams.map((row) => [row.slug, row]));
  const venueByTriple = new Map(state.venues.map((row) => [`${row.name}|${row.city ?? ""}|${row.country ?? ""}`, row]));
  const matchBySlug = new Map(state.matches.map((row) => [row.slug, row]));
  const sourceSnapshotById = new Map(state.sourceSnapshots.map((row) => [row.snapshot_id, row]));
  const scheduleSnapshotById = new Map(state.scheduleSnapshots.map((row) => [row.snapshot_id, row]));
  const officialScheduleByNumber = new Map(
    state.officialScheduleMatches.map((row) => [`${row.tournament_key}|${row.official_match_number}`, row]),
  );
  const officialScheduleLinkByScheduleId = new Map(
    state.officialScheduleMatchLinks.map((row) => [row.official_schedule_match_id, row]),
  );

  return {
    competitions: state.competitions
      .filter((row) => row.slug === competitionSeed.slug)
      .map((row) => ({
        key: row.slug,
        comparable: {
          external_id: row.external_id,
          slug: row.slug,
          name: row.name,
          country: row.country,
          type: row.type,
          usage_scope: row.usage_scope,
        },
      })),
    seasons:
      competitionRow == null
        ? []
        : state.seasons
            .filter((row) => row.competition_id === competitionRow.id && row.year === seasonSeed.year)
            .map((row) => ({
              key: `${competitionSeed.slug}|${row.year}`,
              comparable: {
                year: row.year,
                name: row.name,
                starts_at: row.starts_at,
                ends_at: row.ends_at,
              },
            })),
    teams: runtimeSeeds.teams
      .flatMap((seed) => {
        const row = teamBySlug.get(seed.slug);
        return row == null
          ? []
          : [
              {
                key: row.slug,
                comparable: {
                  external_id: row.external_id,
                  slug: row.slug,
                  name: row.name,
                  country: row.country,
                },
              },
            ];
      }),
    venues: runtimeSeeds.venues
      .flatMap((seed) => {
        const row = venueByTriple.get(`${seed.name}|${seed.city}|${seed.country}`);
        return row == null
          ? []
          : [
              {
                key: `${seed.name}|${seed.city}|${seed.country}`,
                comparable: {
                  name: row.name,
                  city: row.city,
                  country: row.country,
                },
              },
            ];
      }),
    matches: runtimeSeeds.matches
      .flatMap((seed) => {
        const row = matchBySlug.get(seed.slug);
        return row == null
          ? []
          : [
              {
                key: row.slug,
                comparable: {
                  external_id: row.external_id,
                  slug: row.slug,
                  kickoff_at: normalizeComparableTimestamp(row.kickoff_at),
                  stage: row.stage,
                  status: row.status,
                  access_scope: row.access_scope,
                  intake_source: row.intake_source,
                },
              },
            ];
      }),
    source_snapshots: sourceSnapshots.flatMap((seed) => {
      const row = sourceSnapshotById.get(seed.snapshot_id);
      return row == null
        ? []
        : [
            {
              key: row.snapshot_id,
              comparable: {
                source_key: row.source_key,
                snapshot_id: row.snapshot_id,
                data_kind: row.data_kind,
                local_fallback_path: row.local_fallback_path,
                normalized_snapshot_path: row.normalized_snapshot_path,
                effective_at: normalizeComparableTimestamp(row.effective_at),
                captured_at: normalizeComparableTimestamp(row.captured_at),
                payload_hash: row.payload_hash,
                row_count: row.row_count,
              },
            },
          ];
    }),
    canonical_team_aliases: state.canonicalTeamAliases.map((row) => ({
      key: `${row.alias_normalized}|${row.source_scope}`,
      comparable: {
        canonical_team_key: row.canonical_team_key,
        alias_raw: row.alias_raw,
        alias_normalized: row.alias_normalized,
        source_scope: row.source_scope,
        resolution_status: row.resolution_status,
        source_snapshot_id: row.source_snapshot_id,
      },
    })),
    canonical_team_localizations: state.canonicalTeamLocalizations.map((row) => ({
      key: `${row.canonical_team_key}|${row.locale}`,
      comparable: {
        canonical_team_key: row.canonical_team_key,
        locale: row.locale,
        display_name: row.display_name,
        fifa_code: row.fifa_code,
        iso_alpha3: row.iso_alpha3,
        source_snapshot_id: row.source_snapshot_id,
      },
    })),
    canonical_team_links: state.canonicalTeamLinks.map((row) => ({
      key: row.canonical_team_key,
      comparable: {
        canonical_team_key: row.canonical_team_key,
        team_id: row.team_id,
        api_football_team_id: row.api_football_team_id,
        runtime_team_slug: row.runtime_team_slug,
        link_status: row.link_status,
      },
    })),
    team_rating_snapshots: state.teamRatingSnapshots.map((row) => ({
      key: `${row.source_key}|${normalizeComparableTimestamp(row.effective_at)}|${row.canonical_team_key}`,
      comparable: {
        source_key: row.source_key,
        effective_at: normalizeComparableTimestamp(row.effective_at),
        captured_at: normalizeComparableTimestamp(row.captured_at),
        canonical_team_key: row.canonical_team_key,
        rank: row.rank,
        rating_or_points: normalizeComparableNumber(row.rating_or_points),
        source_snapshot_id: row.source_snapshot_id,
        raw_values: row.raw_values,
      },
    })),
    historical_match_facts: state.historicalMatchFacts.map((row) => ({
      key: `${row.source_snapshot_id}|${row.natural_match_key}`,
      comparable: {
        natural_match_key: row.natural_match_key,
        match_date: row.match_date,
        team_1_key: row.team_1_key,
        team_2_key: row.team_2_key,
        competition_key: row.competition_key,
        venue_context_key: row.venue_context_key,
        neutral: row.neutral,
        score_1: row.score_1,
        score_2: row.score_2,
        pre_match_elo_1: normalizeComparableNumber(row.pre_match_elo_1),
        pre_match_elo_2: normalizeComparableNumber(row.pre_match_elo_2),
        post_match_elo_1: normalizeComparableNumber(row.post_match_elo_1),
        post_match_elo_2: normalizeComparableNumber(row.post_match_elo_2),
        source_snapshot_id: row.source_snapshot_id,
        correction_of_id: row.correction_of_id,
        raw_values: row.raw_values,
      },
    })),
    schedule_snapshots: state.scheduleSnapshots.map((row) => ({
      key: row.snapshot_id,
        comparable: {
          tournament_key: row.tournament_key,
          snapshot_id: row.snapshot_id,
          source_snapshot_id: row.source_snapshot_id,
        version_label: row.version_label,
        published_timezone: row.published_timezone,
      },
    })),
    world_cup_venue_catalog: state.worldCupVenueCatalog.map((row) => ({
      key: row.venue_key,
        comparable: {
          venue_key: row.venue_key,
          venue_id: row.venue_id,
        host_city_key: row.host_city_key,
        common_name: row.common_name,
        fifa_tournament_name: row.fifa_tournament_name,
        actual_city: row.actual_city,
        country_code: row.country_code,
        timezone: row.timezone,
      },
    })),
    official_schedule_matches: state.officialScheduleMatches.map((row) => ({
      key: `${row.tournament_key}|${row.official_match_number}`,
        comparable: {
          schedule_snapshot_id: row.schedule_snapshot_id,
          tournament_key: row.tournament_key,
          official_match_number: row.official_match_number,
        stage_key: row.stage_key,
        group_key: row.group_key,
        home_slot: row.home_slot,
        away_slot: row.away_slot,
        home_team_key: row.home_team_key,
        away_team_key: row.away_team_key,
          scheduled_at_utc: normalizeComparableTimestamp(row.scheduled_at_utc),
          published_time: row.published_time,
          published_timezone: row.published_timezone,
          venue_key: row.venue_key,
        source_snapshot_id: row.source_snapshot_id,
      },
    })),
    official_schedule_match_links: state.officialScheduleMatchLinks.map((row) => ({
      key: row.official_schedule_match_id,
      comparable: {
        official_schedule_match_id: row.official_schedule_match_id,
        match_id: row.match_id,
        api_football_fixture_id: row.api_football_fixture_id,
        link_status: row.link_status,
      },
    })),
    lookup: {
      competitionRow,
      seasonRow,
      teamBySlug,
      venueByTriple,
      matchBySlug,
      sourceSnapshotById,
      scheduleSnapshotById,
      officialScheduleByNumber,
      officialScheduleLinkByScheduleId,
    },
  };
}

function buildStageBootstrapWorkingSet(preparedDir: string, registry: SourceRegistry) {
  const datasets = loadTask1Datasets({
    repoRoot: process.cwd(),
    rawSnapshotDir: path.dirname(preparedDir),
    preparedDir,
    artifactsDir: buildDefaultArtifactsDir(process.cwd()),
  } satisfies PreparedPaths);
  const sourceSnapshots = buildSourceSnapshotSeeds({
    preparedDir,
    registry,
    datasets,
  });
  const runtimeSeeds = buildRuntimeSeeds({
    localizations: datasets.localizations,
    aliases: datasets.aliases,
    schedule: datasets.schedule,
    venues: datasets.venues,
  });

  return {
    datasets,
    sourceSnapshots,
    runtimeSeeds,
    aliasSnapshotId: sourceSnapshots.find((row) => row.source_key === "world_cup_venues")?.snapshot_id ?? null,
    scheduleSnapshotSeed: sourceSnapshots.find((row) => row.source_key === "fifa_world_cup_schedule_v17") ?? null,
    canonicalToRuntime: buildCanonicalKeyToRuntimeTeamMap(datasets.localizations, datasets.aliases),
  };
}

function getPlannedInsertKeys(plan: StageBootstrapPlan, table: TableName): Set<string> {
  return new Set(
    (plan.tables.find((candidate) => candidate.table === table)?.rows ?? [])
      .filter((row) => row.action === "insert")
      .map((row) => row.key),
  );
}

function getPlannedInsertMatchNumbers(plan: StageBootstrapPlan, table: TableName): Set<number> {
  return new Set(
    (plan.tables.find((candidate) => candidate.table === table)?.rows ?? [])
      .filter((row) => row.action === "insert")
      .map((row) => Number(row.sourceEvidence[0]?.payload.official_match_number))
      .filter((value) => Number.isFinite(value)),
  );
}

function assertInsertOnlyPlan(plan: StageBootstrapPlan): void {
  const tablesWithUpdates = plan.tables.filter((table) => table.plannedUpdates > 0).map((table) => table.table);
  if (tablesWithUpdates.length > 0) {
    throw new Error(`Approved Task 3B apply is insert-only for this slice; unexpected updates were planned for: ${tablesWithUpdates.join(", ")}.`);
  }
}

function chunkArray<T>(rows: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }
  return chunks;
}

async function insertRows(table: string, rows: Array<Record<string, unknown>>): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const client = createSupabaseScriptAdminClient();
  for (const chunk of chunkArray(rows, 200)) {
    const { error } = await client.from(table).insert(chunk);
    if (error) {
      throw new Error(`Failed to insert ${chunk.length} row(s) into ${table}: ${error.message}`);
    }
  }
}

async function fetchCompetitionBySlug(slug: string): Promise<CompetitionRow | null> {
  const { data, error } = await createSupabaseScriptAdminClient()
    .from("competitions")
    .select("id, external_id, slug, name, country, type, usage_scope")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to resolve competition ${slug}: ${error.message}`);
  }
  return (data as CompetitionRow | null) ?? null;
}

async function fetchSeasonByCompetitionAndYear(competitionId: string, year: number): Promise<SeasonRow | null> {
  const { data, error } = await createSupabaseScriptAdminClient()
    .from("seasons")
    .select("id, competition_id, year, name, starts_at, ends_at")
    .eq("competition_id", competitionId)
    .eq("year", year)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to resolve season ${competitionId}|${year}: ${error.message}`);
  }
  return (data as SeasonRow | null) ?? null;
}

async function fetchTeamsBySlug(slugs: string[]): Promise<Map<string, TeamRow>> {
  if (slugs.length === 0) {
    return new Map();
  }
  const { data, error } = await createSupabaseScriptAdminClient()
    .from("teams")
    .select("id, slug, external_id, name, country")
    .in("slug", slugs);
  if (error) {
    throw new Error(`Failed to resolve teams: ${error.message}`);
  }
  return new Map(((data ?? []) as TeamRow[]).map((row) => [row.slug, row]));
}

async function fetchMatchesBySlug(slugs: string[]): Promise<Map<string, MatchRow>> {
  if (slugs.length === 0) {
    return new Map();
  }
  const { data, error } = await createSupabaseScriptAdminClient()
    .from("matches")
    .select("id, external_id, slug, competition_id, season_id, home_team_id, away_team_id, venue_id, kickoff_at, stage, status, access_scope, intake_source, source_note")
    .in("slug", slugs);
  if (error) {
    throw new Error(`Failed to resolve matches: ${error.message}`);
  }
  return new Map(((data ?? []) as MatchRow[]).map((row) => [row.slug, row]));
}

async function fetchVenuesByTriples(): Promise<Map<string, VenueRow>> {
  const { data, error } = await createSupabaseScriptAdminClient()
    .from("venues")
    .select("id, external_id, name, city, country");
  if (error) {
    throw new Error(`Failed to resolve venues: ${error.message}`);
  }
  return new Map(
    ((data ?? []) as VenueRow[]).map((row) => [`${row.name}|${row.city ?? ""}|${row.country ?? ""}`, row]),
  );
}

async function fetchScheduleSnapshotBySnapshotId(snapshotId: string): Promise<ScheduleSnapshotRow | null> {
  const { data, error } = await createSupabaseScriptAdminClient()
    .from("schedule_snapshots")
    .select("id, tournament_key, snapshot_id, source_snapshot_id, version_label, published_timezone")
    .eq("snapshot_id", snapshotId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to resolve schedule snapshot ${snapshotId}: ${error.message}`);
  }
  return (data as ScheduleSnapshotRow | null) ?? null;
}

async function fetchOfficialScheduleMatchesByTournament(): Promise<Map<string, OfficialScheduleMatchRow>> {
  const { data, error } = await createSupabaseScriptAdminClient()
    .from("official_schedule_matches")
    .select("id, schedule_snapshot_id, tournament_key, official_match_number, stage_key, group_key, home_slot, away_slot, home_team_key, away_team_key, scheduled_at_utc, published_time, published_timezone, venue_key, source_snapshot_id, metadata_json")
    .eq("tournament_key", "fifa_world_cup_2026");
  if (error) {
    throw new Error(`Failed to resolve official schedule matches: ${error.message}`);
  }
  return new Map(
    ((data ?? []) as OfficialScheduleMatchRow[]).map((row) => [`${row.tournament_key}|${row.official_match_number}`, row]),
  );
}

function buildRepresentativeAliasRows(preparedDir: string, sourceSnapshotId: string | null) {
  const grouped = new Map<string, Array<CanonicalTeamAlias & SourceRowEvidence>>();
  for (const row of loadAliasSourceEvidence(preparedDir)) {
    const key = `${normalizeIdentity(row.alias)}|${row.source_scope}`;
    const collection = grouped.get(key) ?? [];
    collection.push(row);
    grouped.set(key, collection);
  }

  return Array.from(grouped.entries()).map(([key, rows]) => {
    const representative = [...rows].sort((left, right) => {
      if (left.sourceFile !== right.sourceFile) {
        return left.sourceFile.localeCompare(right.sourceFile);
      }
      if ((left.sourceLine ?? Number.MAX_SAFE_INTEGER) !== (right.sourceLine ?? Number.MAX_SAFE_INTEGER)) {
        return (left.sourceLine ?? Number.MAX_SAFE_INTEGER) - (right.sourceLine ?? Number.MAX_SAFE_INTEGER);
      }
      return left.sourceRowIndex - right.sourceRowIndex;
    })[0];

    return {
      key,
      payload: {
        canonical_team_key: representative.canonical_team_key,
        alias_raw: representative.alias,
        alias_normalized: normalizeIdentity(representative.alias),
        source_scope: representative.source_scope,
        resolution_status: representative.resolution_status,
        source_snapshot_id: sourceSnapshotId,
        metadata_json: {},
      },
    };
  });
}

async function applyStageBootstrap(plan: StageBootstrapPlan, preparedDir: string, registry: SourceRegistry): Promise<void> {
  assertInsertOnlyPlan(plan);
  const workingSet = buildStageBootstrapWorkingSet(preparedDir, registry);
  const competitionInsertKeys = getPlannedInsertKeys(plan, "competitions");
  const seasonInsertKeys = getPlannedInsertKeys(plan, "seasons");
  const teamInsertKeys = getPlannedInsertKeys(plan, "teams");
  const venueInsertKeys = getPlannedInsertKeys(plan, "venues");
  const matchInsertKeys = getPlannedInsertKeys(plan, "matches");
  const sourceSnapshotInsertKeys = getPlannedInsertKeys(plan, "source_snapshots");
  const aliasInsertKeys = getPlannedInsertKeys(plan, "canonical_team_aliases");
  const localizationInsertKeys = getPlannedInsertKeys(plan, "canonical_team_localizations");
  const teamLinkInsertKeys = getPlannedInsertKeys(plan, "canonical_team_links");
  const ratingInsertKeys = getPlannedInsertKeys(plan, "team_rating_snapshots");
  const historicalFactInsertKeys = getPlannedInsertKeys(plan, "historical_match_facts");
  const scheduleSnapshotInsertKeys = getPlannedInsertKeys(plan, "schedule_snapshots");
  const venueCatalogInsertKeys = getPlannedInsertKeys(plan, "world_cup_venue_catalog");
  const officialScheduleInsertKeys = getPlannedInsertKeys(plan, "official_schedule_matches");
  const officialScheduleLinkInsertMatchNumbers = getPlannedInsertMatchNumbers(plan, "official_schedule_match_links");

  await insertRows(
    "source_snapshots",
    workingSet.sourceSnapshots
      .filter((row) => sourceSnapshotInsertKeys.has(row.snapshot_id))
      .map((row) => ({
        source_key: row.source_key,
        snapshot_id: row.snapshot_id,
        data_kind: row.data_kind,
        source_url: null,
        local_fallback_path: row.local_fallback_path,
        normalized_snapshot_path: row.normalized_snapshot_path,
        effective_at: row.effective_at,
        captured_at: row.captured_at,
        payload_hash: row.payload_hash,
        row_count: row.row_count,
        metadata_json: row.metadata_json,
      })),
  );

  await insertRows(
    "competitions",
    competitionInsertKeys.has(workingSet.runtimeSeeds.competition.slug)
      ? [
          {
            external_id: workingSet.runtimeSeeds.competition.external_id,
            slug: workingSet.runtimeSeeds.competition.slug,
            name: workingSet.runtimeSeeds.competition.name,
            country: workingSet.runtimeSeeds.competition.country,
            type: workingSet.runtimeSeeds.competition.type,
            usage_scope: workingSet.runtimeSeeds.competition.usage_scope,
          },
        ]
      : [],
  );

  await insertRows(
    "teams",
    workingSet.runtimeSeeds.teams
      .filter((row) => teamInsertKeys.has(row.slug))
      .map((row) => ({
        external_id: null,
        slug: row.slug,
        name: row.name,
        country: row.country,
      })),
  );

  await insertRows(
    "venues",
    workingSet.runtimeSeeds.venues
      .filter((row) => venueInsertKeys.has(`${row.name}|${row.city}|${row.country}`))
      .map((row) => ({
        external_id: null,
        name: row.name,
        city: row.city,
        country: row.country,
      })),
  );

  const competitionRow = await fetchCompetitionBySlug(workingSet.runtimeSeeds.competition.slug);
  if (!competitionRow) {
    throw new Error("Competition insert verification failed: world-cup-2026 not found after insert.");
  }

  const teamBySlug = await fetchTeamsBySlug(workingSet.runtimeSeeds.teams.map((row) => row.slug));
  const venueByTriple = await fetchVenuesByTriples();

  await insertRows(
    "seasons",
    seasonInsertKeys.has(`${workingSet.runtimeSeeds.season.competition_slug}|${workingSet.runtimeSeeds.season.year}`)
      ? [
          {
            competition_id: competitionRow.id,
            year: workingSet.runtimeSeeds.season.year,
            name: workingSet.runtimeSeeds.season.name,
            starts_at: workingSet.runtimeSeeds.season.starts_at,
            ends_at: workingSet.runtimeSeeds.season.ends_at,
          },
        ]
      : [],
  );

  const seasonRow = await fetchSeasonByCompetitionAndYear(competitionRow.id, workingSet.runtimeSeeds.season.year);
  if (!seasonRow) {
    throw new Error("Season insert verification failed: world-cup-2026 2026 season not found after insert.");
  }

  await insertRows(
    "matches",
    workingSet.runtimeSeeds.matches
      .filter((row) => matchInsertKeys.has(row.slug))
      .map((row) => {
        const homeTeam = teamBySlug.get(row.home_team_slug);
        const awayTeam = teamBySlug.get(row.away_team_slug);
        const venue = venueByTriple.get(`${workingSet.runtimeSeeds.venues.find((candidate) => candidate.venue_key === row.venue_key)?.name ?? ""}|${workingSet.runtimeSeeds.venues.find((candidate) => candidate.venue_key === row.venue_key)?.city ?? ""}|${workingSet.runtimeSeeds.venues.find((candidate) => candidate.venue_key === row.venue_key)?.country ?? ""}`);
        if (!homeTeam || !awayTeam) {
          throw new Error(`Match dependency resolution failed for ${row.slug}.`);
        }
        return {
          external_id: row.external_id,
          slug: row.slug,
          competition_id: competitionRow.id,
          season_id: seasonRow.id,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          venue_id: venue?.id ?? null,
          kickoff_at: row.kickoff_at,
          stage: row.stage,
          status: row.status,
          access_scope: row.access_scope,
          intake_source: row.intake_source,
          source_note: row.source_note,
        };
      }),
  );

  const matchBySlug = await fetchMatchesBySlug(workingSet.runtimeSeeds.matches.map((row) => row.slug));

  await insertRows(
    "canonical_team_aliases",
    buildRepresentativeAliasRows(preparedDir, workingSet.aliasSnapshotId)
      .filter((row) => aliasInsertKeys.has(row.key))
      .map((row) => row.payload),
  );

  await insertRows(
    "canonical_team_localizations",
    workingSet.datasets.localizations
      .flatMap((row) => [
        {
          key: `${row.canonical_team_key}|en`,
          payload: {
            canonical_team_key: row.canonical_team_key,
            locale: "en",
            display_name: row.display_name_en,
            fifa_code: row.fifa_code,
            iso_alpha3: row.iso_alpha3,
            source_snapshot_id: workingSet.aliasSnapshotId,
            metadata_json: {},
          },
        },
        {
          key: `${row.canonical_team_key}|es`,
          payload: {
            canonical_team_key: row.canonical_team_key,
            locale: "es",
            display_name: row.display_name_es,
            fifa_code: row.fifa_code,
            iso_alpha3: row.iso_alpha3,
            source_snapshot_id: workingSet.aliasSnapshotId,
            metadata_json: {},
          },
        },
      ])
      .filter((row) => localizationInsertKeys.has(row.key))
      .map((row) => row.payload),
  );

  await insertRows(
    "canonical_team_links",
    workingSet.runtimeSeeds.teams
      .filter((row) => teamLinkInsertKeys.has(row.canonical_team_key))
      .map((row) => {
        const team = teamBySlug.get(row.slug);
        const runtimeTeam = workingSet.canonicalToRuntime.get(row.canonical_team_key);
        return {
          canonical_team_key: row.canonical_team_key,
          team_id: team?.id ?? null,
          api_football_team_id: runtimeTeam?.apiFootballTeamId ?? null,
          runtime_team_slug: row.slug,
          link_status: team ? "linked" : "candidate",
          metadata_json: {},
        };
      }),
  );

  await insertRows(
    "team_rating_snapshots",
    [
      ...buildRatingsSourceRows(workingSet.datasets.eloCurrent, "elo"),
      ...buildRatingsSourceRows(workingSet.datasets.eloStart2026, "elo"),
      ...buildRatingsSourceRows(workingSet.datasets.fifaRanking, "fifa"),
    ]
      .filter((row) => ratingInsertKeys.has(row.key))
      .map((row) => ({
        source_key: row.comparable.source_key,
        effective_at: row.comparable.effective_at,
        captured_at: row.comparable.captured_at,
        canonical_team_key: row.comparable.canonical_team_key,
        rank: row.comparable.rank,
        rating_or_points: row.comparable.rating_or_points,
        source_snapshot_id: row.comparable.source_snapshot_id,
        raw_values: row.comparable.raw_values ?? {},
      })),
  );

  await insertRows(
    "historical_match_facts",
    buildHistoricalFactSourceRows(workingSet.datasets.historicalFacts)
      .filter((row) => historicalFactInsertKeys.has(row.key))
      .map((row) => ({
        natural_match_key: row.comparable.natural_match_key,
        match_date: row.comparable.match_date,
        team_1_key: row.comparable.team_1_key,
        team_2_key: row.comparable.team_2_key,
        competition_key: row.comparable.competition_key,
        venue_context_key: row.comparable.venue_context_key,
        neutral: row.comparable.neutral,
        score_1: row.comparable.score_1,
        score_2: row.comparable.score_2,
        pre_match_elo_1: row.comparable.pre_match_elo_1,
        pre_match_elo_2: row.comparable.pre_match_elo_2,
        post_match_elo_1: row.comparable.post_match_elo_1,
        post_match_elo_2: row.comparable.post_match_elo_2,
        source_snapshot_id: row.comparable.source_snapshot_id,
        correction_of_id: null,
        raw_values: row.comparable.raw_values ?? {},
      })),
  );

  if (workingSet.scheduleSnapshotSeed == null) {
    throw new Error("Schedule snapshot seed is missing and apply cannot continue.");
  }

  await insertRows(
    "schedule_snapshots",
    scheduleSnapshotInsertKeys.has(workingSet.scheduleSnapshotSeed.snapshot_id)
      ? [
          {
            tournament_key: "fifa_world_cup_2026",
            snapshot_id: workingSet.scheduleSnapshotSeed.snapshot_id,
            source_snapshot_id: workingSet.scheduleSnapshotSeed.snapshot_id,
            version_label: "v17",
            published_timezone: "America/New_York",
          },
        ]
      : [],
  );

  const scheduleSnapshotRow = await fetchScheduleSnapshotBySnapshotId(workingSet.scheduleSnapshotSeed.snapshot_id);
  if (!scheduleSnapshotRow) {
    throw new Error("Schedule snapshot insert verification failed.");
  }

  await insertRows(
    "world_cup_venue_catalog",
    workingSet.datasets.venues
      .filter((row) => venueCatalogInsertKeys.has(row.venue_key))
      .map((row) => {
        const runtimeVenue = workingSet.runtimeSeeds.venues.find((candidate) => candidate.venue_key === row.venue_key);
        const venue = runtimeVenue
          ? venueByTriple.get(`${runtimeVenue.name}|${runtimeVenue.city}|${runtimeVenue.country}`)
          : null;
        return {
          venue_key: row.venue_key,
          venue_id: venue?.id ?? null,
          host_city_key: row.host_city_key,
          host_city_name_es: row.host_city_es,
          host_city_name_en: row.host_city_en,
          common_name: row.common_name,
          fifa_tournament_name: row.fifa_tournament_name,
          actual_city: row.actual_city,
          country_code: row.country_code,
          timezone: row.timezone,
          metadata_json: {},
        };
      }),
  );

  await insertRows(
    "official_schedule_matches",
    workingSet.datasets.schedule
      .filter((row) => officialScheduleInsertKeys.has(`fifa_world_cup_2026|${row.official_match_number}`))
      .map((row) => ({
        schedule_snapshot_id: scheduleSnapshotRow.id,
        tournament_key: "fifa_world_cup_2026",
        official_match_number: row.official_match_number,
        stage_key: row.stage_key,
        group_key: row.group_key,
        home_slot: row.home_slot,
        away_slot: row.away_slot,
        home_team_key: row.home_team_key,
        away_team_key: row.away_team_key,
        scheduled_at_utc: row.scheduled_at_utc,
        published_time: row.published_time_et,
        published_timezone: row.published_timezone,
        venue_key: row.venue_key,
        source_snapshot_id: row.source_snapshot_id,
        metadata_json: {},
      })),
  );

  const officialScheduleByKey = await fetchOfficialScheduleMatchesByTournament();

  await insertRows(
    "official_schedule_match_links",
    workingSet.runtimeSeeds.matches
      .filter((row) => officialScheduleLinkInsertMatchNumbers.has(row.official_match_number))
      .map((row) => {
        const officialSchedule = officialScheduleByKey.get(`fifa_world_cup_2026|${row.official_match_number}`);
        const match = matchBySlug.get(row.slug);
        if (!officialSchedule) {
          throw new Error(`Official schedule match resolution failed for match number ${row.official_match_number}.`);
        }
        return {
          official_schedule_match_id: officialSchedule.id,
          match_id: match?.id ?? null,
          api_football_fixture_id: row.external_id ? Number(row.external_id.split(":").at(-1)) : null,
          link_status: match ? "linked" : row.external_id ? "candidate" : "unresolved",
          metadata_json: {},
        };
      }),
  );
}

export function planStageBootstrap(input: {
  preparedDir: string;
  remoteState: RemoteState;
  authorization?: Pick<StageBootstrapAuthorization, "acceptExternalMigrationVerification" | "expectedMigrationCount">;
  manifestStatus: "verified" | "blocked";
  registry: SourceRegistry;
  files: SourceFileEvidence[];
}): StageBootstrapPlan {
  const datasets = loadTask1Datasets({
    repoRoot: process.cwd(),
    rawSnapshotDir: path.dirname(input.preparedDir),
    preparedDir: input.preparedDir,
    artifactsDir: buildDefaultArtifactsDir(process.cwd()),
  } satisfies PreparedPaths);
  const sourceSnapshots = buildSourceSnapshotSeeds({
    preparedDir: input.preparedDir,
    registry: input.registry,
    datasets,
  });
  const sourceSnapshotSentinels = buildSourceSnapshotSentinelEntries();
  const runtimeSeeds = buildRuntimeSeeds({
    localizations: datasets.localizations,
    aliases: datasets.aliases,
    schedule: datasets.schedule,
    venues: datasets.venues,
  });
  const remoteComparable = buildRemoteComparableRows(input.remoteState, runtimeSeeds, sourceSnapshots);
  const blockers = [...runtimeSeeds.blockers];

  const runtimeCompetitionSourceRows = [
    {
      key: runtimeSeeds.competition.slug,
      comparable: runtimeSeeds.competition,
      sourceEvidence: makeSourceEvidence(
        path.join("reference", "world-cup-2026-schedule.json"),
        1,
        runtimeSeeds.competition as unknown as Record<string, unknown>,
      ),
    },
  ];
  const runtimeSeasonSourceRows = [
    {
      key: `${runtimeSeeds.season.competition_slug}|${runtimeSeeds.season.year}`,
      comparable: {
        year: runtimeSeeds.season.year,
        name: runtimeSeeds.season.name,
        starts_at: runtimeSeeds.season.starts_at,
        ends_at: runtimeSeeds.season.ends_at,
      },
      sourceEvidence: makeSourceEvidence(
        path.join("reference", "world-cup-2026-schedule.json"),
        1,
        runtimeSeeds.season as unknown as Record<string, unknown>,
      ),
    },
  ];
  const runtimeTeamSourceRows = runtimeSeeds.teams.map((row) => ({
    key: row.slug,
    comparable: {
      external_id: null,
      slug: row.slug,
      name: row.name,
      country: row.country,
    },
    sourceEvidence: makeSourceEvidence(path.join("reference", "team-localizations-es-en.csv"), 0, row as unknown as Record<string, unknown>),
  }));
  const runtimeVenueSourceRows = runtimeSeeds.venues.map((row) => ({
    key: `${row.name}|${row.city}|${row.country}`,
    comparable: {
      name: row.name,
      city: row.city,
      country: row.country,
    },
    sourceEvidence: makeSourceEvidence(path.join("reference", "world-cup-2026-venues.csv"), 0, row as unknown as Record<string, unknown>),
  }));
  const runtimeMatchSourceRows = runtimeSeeds.matches.map((row) => ({
    key: row.slug,
    comparable: {
      external_id: row.external_id,
      slug: row.slug,
      kickoff_at: normalizeComparableTimestamp(row.kickoff_at),
      stage: row.stage,
      status: row.status,
      access_scope: row.access_scope,
      intake_source: row.intake_source,
    },
    sourceEvidence: makeSourceEvidence(path.join("reference", "world-cup-2026-schedule.json"), row.official_match_number, row as unknown as Record<string, unknown>),
  }));
  const sourceSnapshotSourceRows = sourceSnapshots.map((row) => ({
    key: row.snapshot_id,
    comparable: {
      source_key: row.source_key,
      snapshot_id: row.snapshot_id,
      data_kind: row.data_kind,
      local_fallback_path: row.local_fallback_path,
      normalized_snapshot_path: row.normalized_snapshot_path,
      effective_at: normalizeComparableTimestamp(row.effective_at),
      captured_at: normalizeComparableTimestamp(row.captured_at),
      payload_hash: row.payload_hash,
      row_count: row.row_count,
    },
    sourceEvidence: makeSourceEvidence("source-registry.json", 0, row as unknown as Record<string, unknown>),
  }));

  const aliasSnapshotId = sourceSnapshots.find((row) => row.source_key === "world_cup_venues")?.snapshot_id ?? null;
  const aliasSourceRows = loadAliasSourceEvidence(input.preparedDir).map((row) => ({
    key: `${normalizeIdentity(row.alias)}|${row.source_scope}`,
    comparable: {
      canonical_team_key: row.canonical_team_key,
      alias_raw: row.alias,
      alias_normalized: normalizeIdentity(row.alias),
      source_scope: row.source_scope,
      resolution_status: row.resolution_status,
      source_snapshot_id: aliasSnapshotId,
    },
    sourceEvidence: makeSourceEvidence(row.sourceFile, row.sourceRowIndex, {
      alias: row.alias,
      canonical_team_key: row.canonical_team_key,
      canonical_name_en: row.canonical_name_en,
      source_scope: row.source_scope,
      resolution_status: row.resolution_status,
      source_snapshot_id: aliasSnapshotId,
    }, row.sourceLine),
  }));
  const localizationSourceRows = datasets.localizations.flatMap((row) => [
    {
      key: `${row.canonical_team_key}|en`,
      comparable: {
        canonical_team_key: row.canonical_team_key,
        locale: "en",
        display_name: row.display_name_en,
        fifa_code: row.fifa_code,
        iso_alpha3: row.iso_alpha3,
        source_snapshot_id: aliasSnapshotId,
      },
      sourceEvidence: makeSourceEvidence(path.join("reference", "team-localizations-es-en.csv"), 0, row as unknown as Record<string, unknown>),
    },
    {
      key: `${row.canonical_team_key}|es`,
      comparable: {
        canonical_team_key: row.canonical_team_key,
        locale: "es",
        display_name: row.display_name_es,
        fifa_code: row.fifa_code,
        iso_alpha3: row.iso_alpha3,
        source_snapshot_id: aliasSnapshotId,
      },
      sourceEvidence: makeSourceEvidence(path.join("reference", "team-localizations-es-en.csv"), 0, row as unknown as Record<string, unknown>),
    },
  ]);

  const canonicalToRuntime = buildCanonicalKeyToRuntimeTeamMap(datasets.localizations, datasets.aliases);
  const teamBySlug = remoteComparable.lookup.teamBySlug;
  const teamLinkSourceRows = runtimeSeeds.teams.map((row) => {
    const runtimeTeam = canonicalToRuntime.get(row.canonical_team_key);
    const existingTeam = runtimeTeam ? teamBySlug.get(runtimeTeam.slug) ?? null : null;
    return {
      key: row.canonical_team_key,
      comparable: {
        canonical_team_key: row.canonical_team_key,
        team_id: existingTeam?.id ?? null,
        api_football_team_id: runtimeTeam?.apiFootballTeamId ?? null,
        runtime_team_slug: row.slug,
        link_status: existingTeam ? "linked" : "candidate",
      },
      sourceEvidence: makeSourceEvidence(path.join("reference", "team-localizations-es-en.csv"), 0, row as unknown as Record<string, unknown>),
    };
  });

  const ratingSourceRows = [
    ...buildRatingsSourceRows(datasets.eloCurrent, "elo"),
    ...buildRatingsSourceRows(datasets.eloStart2026, "elo"),
    ...buildRatingsSourceRows(datasets.fifaRanking, "fifa"),
  ];
  const historicalFactSourceRows = buildHistoricalFactSourceRows(datasets.historicalFacts);

  const scheduleSnapshotSeed = sourceSnapshots.find((row) => row.source_key === "fifa_world_cup_schedule_v17");
  const scheduleSnapshotSourceRows = [
    {
      key: scheduleSnapshotSeed?.snapshot_id ?? "world-cup-2026-schedule-snapshot-missing",
      comparable: {
        tournament_key: "fifa_world_cup_2026",
        snapshot_id: scheduleSnapshotSeed?.snapshot_id ?? "world-cup-2026-schedule-snapshot-missing",
        source_snapshot_id: scheduleSnapshotSeed?.snapshot_id ?? null,
        version_label: "v17",
        published_timezone: "America/New_York",
      },
      sourceEvidence: makeSourceEvidence(path.join("reference", "world-cup-2026-schedule.json"), 1, {
        snapshot_id: scheduleSnapshotSeed?.snapshot_id ?? null,
      }),
    },
  ];
  const venueCatalogSourceRows = datasets.venues.map((row) => {
    const venueSeed = runtimeSeeds.venues.find((candidate) => candidate.venue_key === row.venue_key) ?? null;
    const existingVenue =
      venueSeed == null ? null : remoteComparable.lookup.venueByTriple.get(`${venueSeed.name}|${venueSeed.city}|${venueSeed.country}`) ?? null;
    return {
      key: row.venue_key,
      comparable: {
        venue_key: row.venue_key,
        venue_id: existingVenue?.id ?? null,
        host_city_key: row.host_city_key,
        common_name: row.common_name,
        fifa_tournament_name: row.fifa_tournament_name,
        actual_city: row.actual_city,
        country_code: row.country_code,
        timezone: row.timezone,
      },
      sourceEvidence: makeSourceEvidence(path.join("reference", "world-cup-2026-venues.csv"), 0, row as unknown as Record<string, unknown>),
    };
  });
  const scheduleSnapshotExisting = remoteComparable.lookup.scheduleSnapshotById.get(
    scheduleSnapshotSeed?.snapshot_id ?? "world-cup-2026-schedule-snapshot-missing",
  );
  const officialScheduleSourceRows = datasets.schedule.map((row) => ({
    key: `fifa_world_cup_2026|${row.official_match_number}`,
    comparable: {
      schedule_snapshot_id: scheduleSnapshotExisting?.id ?? "__schedule_snapshot_pending__",
      tournament_key: "fifa_world_cup_2026",
      official_match_number: row.official_match_number,
      stage_key: row.stage_key,
      group_key: row.group_key,
      home_slot: row.home_slot,
      away_slot: row.away_slot,
      home_team_key: row.home_team_key,
      away_team_key: row.away_team_key,
      scheduled_at_utc: normalizeComparableTimestamp(row.scheduled_at_utc),
      published_time: row.published_time_et,
      published_timezone: row.published_timezone,
      venue_key: row.venue_key,
      source_snapshot_id: row.source_snapshot_id,
    },
    sourceEvidence: makeSourceEvidence(path.join("reference", "world-cup-2026-schedule.json"), row.official_match_number, row as unknown as Record<string, unknown>),
  }));
  const matchBySlug = remoteComparable.lookup.matchBySlug;
  const officialScheduleLinkSourceRows = runtimeSeeds.matches.map((row) => {
    const existingMatch = matchBySlug.get(row.slug) ?? null;
    const scheduleRow = remoteComparable.lookup.officialScheduleByNumber.get(`fifa_world_cup_2026|${row.official_match_number}`) ?? null;
    return {
      key: scheduleRow?.id ?? `pending|${row.official_match_number}`,
      comparable: {
        official_schedule_match_id: scheduleRow?.id ?? `pending|${row.official_match_number}`,
        match_id: existingMatch?.id ?? null,
        api_football_fixture_id: row.external_id ? Number(row.external_id.split(":").at(-1)) : null,
        link_status: existingMatch ? "linked" : row.external_id ? "candidate" : "unresolved",
      },
      sourceEvidence: makeSourceEvidence("lib/world-cup-2026/canonical-fixtures.ts", row.official_match_number, row as unknown as Record<string, unknown>),
    };
  });

  const manifestStatus = input.manifestStatus;
  const sourceCutoff = input.registry.snapshot_date;
  const preparedFiles = input.files.map((row) => row.relativePath);

  const tables: TablePlan[] = [
    buildTablePlan({
      table: "competitions",
      currentRemoteCount: input.remoteState.tableCounts.competitions ?? 0,
      sourceRows: runtimeCompetitionSourceRows,
      existingRows: remoteComparable.competitions,
      naturalKey: "slug",
      sourceFiles: [path.join("reference", "world-cup-2026-schedule.json"), "lib/world-cup-2026/canonical-fixtures.ts"],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "seasons",
      currentRemoteCount: input.remoteState.tableCounts.seasons ?? 0,
      sourceRows: runtimeSeasonSourceRows,
      existingRows: remoteComparable.seasons,
      naturalKey: "(competition_slug, year)",
      sourceFiles: [path.join("reference", "world-cup-2026-schedule.json")],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "teams",
      currentRemoteCount: input.remoteState.tableCounts.teams ?? 0,
      sourceRows: runtimeTeamSourceRows,
      existingRows: remoteComparable.teams,
      naturalKey: "slug",
      sourceFiles: [path.join("reference", "team-localizations-es-en.csv"), path.join("reference", "team-aliases.csv")],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "venues",
      currentRemoteCount: input.remoteState.tableCounts.venues ?? 0,
      sourceRows: runtimeVenueSourceRows,
      existingRows: remoteComparable.venues,
      naturalKey: "(name, city, country)",
      sourceFiles: [path.join("reference", "world-cup-2026-venues.csv")],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "matches",
      currentRemoteCount: input.remoteState.tableCounts.matches ?? 0,
      sourceRows: runtimeMatchSourceRows,
      existingRows: remoteComparable.matches,
      naturalKey: "slug",
      sourceFiles: [path.join("reference", "world-cup-2026-schedule.json"), "lib/world-cup-2026/canonical-fixtures.ts"],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "source_snapshots",
      currentRemoteCount: input.remoteState.tableCounts.source_snapshots ?? 0,
      sourceRows: sourceSnapshotSourceRows,
      existingRows: remoteComparable.source_snapshots,
      naturalKey: "snapshot_id",
      sourceFiles: preparedFiles,
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "canonical_team_aliases",
      currentRemoteCount: input.remoteState.tableCounts.canonical_team_aliases ?? 0,
      sourceRows: aliasSourceRows,
      existingRows: remoteComparable.canonical_team_aliases,
      naturalKey: "(alias_normalized, source_scope)",
      sourceFiles: [path.join("reference", "team-aliases.csv")],
      sourceCutoff,
      manifestStatus,
      semanticComparable: (comparable) => ({
        canonical_team_key: comparable.canonical_team_key,
        alias_normalized: comparable.alias_normalized,
        source_scope: comparable.source_scope,
        resolution_status: comparable.resolution_status,
        source_snapshot_id: comparable.source_snapshot_id,
      }),
    }),
    buildTablePlan({
      table: "canonical_team_localizations",
      currentRemoteCount: input.remoteState.tableCounts.canonical_team_localizations ?? 0,
      sourceRows: localizationSourceRows,
      existingRows: remoteComparable.canonical_team_localizations,
      naturalKey: "(canonical_team_key, locale)",
      sourceFiles: [path.join("reference", "team-localizations-es-en.csv")],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "canonical_team_links",
      currentRemoteCount: input.remoteState.tableCounts.canonical_team_links ?? 0,
      sourceRows: teamLinkSourceRows,
      existingRows: remoteComparable.canonical_team_links,
      naturalKey: "canonical_team_key",
      sourceFiles: [path.join("reference", "team-localizations-es-en.csv"), path.join("reference", "team-aliases.csv")],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "team_rating_snapshots",
      currentRemoteCount: input.remoteState.tableCounts.team_rating_snapshots ?? 0,
      sourceRows: ratingSourceRows,
      existingRows: remoteComparable.team_rating_snapshots,
      naturalKey: "(source_key, effective_at, canonical_team_key)",
      sourceFiles: [
        path.join("normalized-snapshot", "elo-ranking-2026-06-20.csv"),
        path.join("normalized-snapshot", "elo-ranking-start-2026.csv"),
        path.join("normalized-snapshot", "fifa-ranking-2026-06-11-captured-2026-06-20.csv"),
      ],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "historical_match_facts",
      currentRemoteCount: input.remoteState.tableCounts.historical_match_facts ?? 0,
      sourceRows: historicalFactSourceRows,
      existingRows: remoteComparable.historical_match_facts,
      naturalKey: "(source_snapshot_id, natural_match_key)",
      sourceFiles: [
        path.join("normalized-snapshot", "elo-results-2025.csv"),
        path.join("normalized-snapshot", "elo-results-2026-window.csv"),
      ],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "schedule_snapshots",
      currentRemoteCount: input.remoteState.tableCounts.schedule_snapshots ?? 0,
      sourceRows: scheduleSnapshotSourceRows,
      existingRows: remoteComparable.schedule_snapshots,
      naturalKey: "snapshot_id",
      sourceFiles: [path.join("reference", "world-cup-2026-schedule.json")],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "world_cup_venue_catalog",
      currentRemoteCount: input.remoteState.tableCounts.world_cup_venue_catalog ?? 0,
      sourceRows: venueCatalogSourceRows,
      existingRows: remoteComparable.world_cup_venue_catalog,
      naturalKey: "venue_key",
      sourceFiles: [path.join("reference", "world-cup-2026-venues.csv")],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "official_schedule_matches",
      currentRemoteCount: input.remoteState.tableCounts.official_schedule_matches ?? 0,
      sourceRows: officialScheduleSourceRows,
      existingRows: remoteComparable.official_schedule_matches,
      naturalKey: "(tournament_key, official_match_number)",
      sourceFiles: [path.join("reference", "world-cup-2026-schedule.json")],
      sourceCutoff,
      manifestStatus,
    }),
    buildTablePlan({
      table: "official_schedule_match_links",
      currentRemoteCount: input.remoteState.tableCounts.official_schedule_match_links ?? 0,
      sourceRows: officialScheduleLinkSourceRows,
      existingRows: remoteComparable.official_schedule_match_links,
      naturalKey: "official_schedule_match_id",
      sourceFiles: [path.join("reference", "world-cup-2026-schedule.json"), "lib/world-cup-2026/canonical-fixtures.ts"],
      sourceCutoff,
      manifestStatus,
    }),
  ];

  const sourceSnapshotMapping = buildSourceSnapshotMappingEntries(sourceSnapshots, input.preparedDir);
  const preservation: PreservationSnapshot = {
    authUserCount: input.remoteState.authUsers.length,
    existingAuthUsers: input.remoteState.authUsers.map((row) => ({ id: row.id, email: row.email })),
    profileCount: input.remoteState.profiles.length,
    existingAdminProfiles: input.remoteState.profiles
      .filter((row) => row.role === "admin")
      .map((row) => ({ id: row.id, email: row.email, role: row.role })),
    migrationHistory: input.remoteState.migrationHistory,
  };
  const migrationHistoryIndependentlyVerified = preservation.migrationHistory.status === "verified_count";
  let externalMigrationVerificationAccepted =
    !migrationHistoryIndependentlyVerified &&
    input.authorization?.acceptExternalMigrationVerification === true &&
    input.authorization.expectedMigrationCount === 46 &&
    input.remoteState.migrationHistory.externallyVerifiedExpectedCount === 46 &&
    (preservation.migrationHistory.status === "query_error" ||
      preservation.migrationHistory.status === "unavailable_read_denied");
  preservation.migrationHistory.importerIndependentlyVerified = migrationHistoryIndependentlyVerified;
  preservation.migrationHistory.externalOperatorAttestationAccepted = externalMigrationVerificationAccepted;
  preservation.migrationHistory.verificationMode = migrationHistoryIndependentlyVerified
    ? "importer_read_path"
    : externalMigrationVerificationAccepted
      ? "external_operator_attestation"
      : "unverified";

  if (manifestStatus === "blocked") {
    blockers.push("Prepared source manifest or checksum verification failed.");
  }

  if (preservation.authUserCount === 0) {
    blockers.push("Stage Auth user inventory could not be confirmed from the current read path.");
  }

  if (!migrationHistoryIndependentlyVerified && !externalMigrationVerificationAccepted) {
    blockers.push("Stage migration-history inventory could not be confirmed from the current read path.");
  }

  const competitionPlan = tables.find((row) => row.table === "competitions");
  const seasonPlan = tables.find((row) => row.table === "seasons");
  const requiredTableChecks: RequiredTableCheck[] = Object.entries(input.remoteState.tableCounts).map(([table, count]) => ({
    table,
    readable: true,
    existsByRead: count >= 0,
    currentRemoteCount: count,
    note: "Readable through the current service-role/PostgREST path.",
  }));
  externalMigrationVerificationAccepted =
    externalMigrationVerificationAccepted &&
    requiredTableChecks.every((table) => table.readable && table.existsByRead) &&
    preservation.authUserCount > 0 &&
    preservation.existingAdminProfiles.length > 0;
  preservation.migrationHistory.externalOperatorAttestationAccepted = externalMigrationVerificationAccepted;
  preservation.migrationHistory.verificationMode = migrationHistoryIndependentlyVerified
    ? "importer_read_path"
    : externalMigrationVerificationAccepted
      ? "external_operator_attestation"
      : "unverified";
  const applyEligibilityReasons: string[] = [];
  for (const table of tables) {
    if (!table.balancedAccounting.isBalanced) {
      applyEligibilityReasons.push(`Unbalanced accounting for ${table.table}.`);
    }
    if (table.conflictKeyCount > 0) {
      applyEligibilityReasons.push(`Unresolved natural-key conflict(s) remain in ${table.table}.`);
    }
  }
  if (manifestStatus !== "verified") {
    applyEligibilityReasons.push("Prepared source manifest/checksum verification did not pass.");
  }
  if (preservation.authUserCount === 0 || preservation.existingAdminProfiles.length === 0) {
    applyEligibilityReasons.push("Auth/admin preservation could not be fully observed.");
  }
  if (input.remoteState.migrationHistory.externallyVerifiedExpectedCount !== 46) {
    applyEligibilityReasons.push("Expected migration count was not explicitly provided as 46.");
  }
  if (!migrationHistoryIndependentlyVerified && input.authorization?.acceptExternalMigrationVerification !== true) {
    applyEligibilityReasons.push("Migration history was not independently verified and no explicit external attestation was accepted.");
  }
  if (
    !migrationHistoryIndependentlyVerified &&
    input.authorization?.acceptExternalMigrationVerification === true &&
    !externalMigrationVerificationAccepted
  ) {
    applyEligibilityReasons.push("External migration attestation was requested but eligibility preconditions were not met.");
  }
  if (!migrationHistoryIndependentlyVerified && !externalMigrationVerificationAccepted) {
    applyEligibilityReasons.push("Migration history was not independently verified through the importer read path.");
  }
  const publishQueueCompetitionResolvable = Boolean(
    competitionPlan && competitionPlan.conflictKeyCount === 0 && competitionPlan.rejectedOrUnmapped === 0,
  );
  const applyEligible = applyEligibilityReasons.length === 0;

  return {
    authorization: {
      mode: "dry_run",
      projectRef: "yfmklapgjrupctgxaako",
      denyProjectRef: "gcpdffkgsdomzyoenalg",
      supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
      targetEnvironment: "development",
      productionDenied: true,
      allowRemoteDevWrite: false,
      expectedMigrationCount: input.remoteState.migrationHistory.externallyVerifiedExpectedCount,
      acceptExternalMigrationVerification: input.authorization?.acceptExternalMigrationVerification ?? false,
    },
    resolvedSourceFiles: input.files,
    manifestStatus,
    freshness: buildFreshnessClassification(input.preparedDir),
    preservation,
    sourceSnapshotMapping,
    sourceSnapshotSentinels,
    requiredTableChecks,
    tables,
    deferredOfficialToRuntimeLinkageCount: runtimeSeeds.deferredOfficialMatchNumbers.length,
    deferredOfficialToRuntimeLinkageMatchNumbers: runtimeSeeds.deferredOfficialMatchNumbers,
    applyEligible,
    applyEligibilityReasons,
    blockers: Array.from(new Set(blockers)).sort(),
    worldCupResolution: {
      competitionWillResolve: Boolean(competitionPlan && competitionPlan.conflictKeyCount === 0),
      seasonWillResolve: Boolean(seasonPlan && seasonPlan.conflictKeyCount === 0),
      publishQueueCompetitionResolvable,
      note: publishQueueCompetitionResolvable
        ? "The public World Cup competition slug can resolve after bootstrap; publish-queue rows still depend on later provider-linked admin_only matches."
        : "The public World Cup competition slug would remain unresolved because the runtime bootstrap plan is blocked.",
    },
  };
}

async function readTableCount(table: string, schema?: string): Promise<number> {
  const client = schema ? createSupabaseScriptAdminClient().schema(schema) : createSupabaseScriptAdminClient();
  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
  if (error) {
    throw new Error(`Failed to read count for ${schema ? `${schema}.` : ""}${table}: ${error.message}`);
  }

  return count ?? 0;
}

async function readPagedRows<T>(builder: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await builder(from, to);
    if (error) {
      throw new Error(error.message);
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

async function loadRemoteState(preparedDir: string, expectedMigrationCount: number | null): Promise<RemoteState> {
  const datasets = loadTask1Datasets({
    repoRoot: process.cwd(),
    rawSnapshotDir: path.dirname(preparedDir),
    preparedDir,
    artifactsDir: buildDefaultArtifactsDir(process.cwd()),
  } satisfies PreparedPaths);
  const runtimeSeeds = buildRuntimeSeeds({
    localizations: datasets.localizations,
    aliases: datasets.aliases,
    schedule: datasets.schedule,
    venues: datasets.venues,
  });

  const client = createSupabaseScriptAdminClient();
  const tableCountsEntries = await Promise.all(
    [
      "competitions",
      "seasons",
      "teams",
      "venues",
      "matches",
      "source_snapshots",
      "canonical_team_aliases",
      "canonical_team_localizations",
      "canonical_team_links",
      "team_rating_snapshots",
      "historical_match_facts",
      "schedule_snapshots",
      "world_cup_venue_catalog",
      "official_schedule_matches",
      "official_schedule_match_links",
    ].map(async (table) => [table, await readTableCount(table)] as const),
  );
  const tableCounts = Object.fromEntries(tableCountsEntries);

  const teamSlugs = runtimeSeeds.teams.map((row) => row.slug);
  const matchSlugs = runtimeSeeds.matches.map((row) => row.slug);
  const sourceRegistry = readJson<SourceRegistry>(path.join(preparedDir, "source-registry.json"));
  const sourceSnapshotIds = buildSourceSnapshotSeeds({
    preparedDir,
    registry: sourceRegistry,
    datasets,
  }).map((row) => row.snapshot_id);

  const [{ data: competitions }, { data: teams }, { data: venues }, { data: sourceSnapshots }, { data: scheduleSnapshots }] =
    await Promise.all([
      client
        .from("competitions")
        .select("id, external_id, slug, name, country, type, usage_scope")
        .eq("slug", WORLD_CUP_COMPETITION_SLUG),
      client.from("teams").select("id, slug, external_id, name, country").in("slug", teamSlugs),
      client.from("venues").select("id, external_id, name, city, country").in(
        "name",
        Array.from(new Set(runtimeSeeds.venues.map((row) => row.name))),
      ),
      client
        .from("source_snapshots")
        .select("id, source_key, snapshot_id, data_kind, source_url, local_fallback_path, normalized_snapshot_path, effective_at, captured_at, payload_hash, row_count, metadata_json")
        .in("snapshot_id", sourceSnapshotIds),
      client
        .from("schedule_snapshots")
        .select("id, tournament_key, snapshot_id, source_snapshot_id, version_label, published_timezone")
        .in("snapshot_id", sourceSnapshotIds),
    ]);

  const competitionRows = (competitions ?? []) as CompetitionRow[];
  const competitionIds = competitionRows.map((row) => row.id);
  const historicalSourceSnapshotIds = Array.from(new Set(datasets.historicalFacts.map((row) => row.source_snapshot_id)));

  const [{ data: seasons }, { data: matches }, { data: aliases }, { data: localizations }, { data: links }, { data: ratings }, { data: facts }, { data: venueCatalog }, { data: officialSchedule }, authUserResponse, { data: profiles }] =
    await Promise.all([
      competitionIds.length === 0
        ? Promise.resolve({ data: [] })
        : client
            .from("seasons")
            .select("id, competition_id, year, name, starts_at, ends_at")
            .in("competition_id", competitionIds)
            .eq("year", WORLD_CUP_SEASON_YEAR),
      client
        .from("matches")
        .select("id, external_id, slug, competition_id, season_id, home_team_id, away_team_id, venue_id, kickoff_at, stage, status, access_scope, intake_source, source_note")
        .in("slug", matchSlugs),
      client
        .from("canonical_team_aliases")
        .select("id, canonical_team_key, alias_raw, alias_normalized, source_scope, resolution_status, source_snapshot_id, metadata_json"),
      client
        .from("canonical_team_localizations")
        .select("id, canonical_team_key, locale, display_name, fifa_code, iso_alpha3, source_snapshot_id, metadata_json"),
      client
        .from("canonical_team_links")
        .select("id, canonical_team_key, team_id, api_football_team_id, runtime_team_slug, link_status, metadata_json"),
      client
        .from("team_rating_snapshots")
        .select("id, source_key, effective_at, captured_at, canonical_team_key, rank, rating_or_points, source_snapshot_id, raw_values"),
      client
        .from("historical_match_facts")
        .select("id, natural_match_key, match_date, team_1_key, team_2_key, competition_key, venue_context_key, neutral, score_1, score_2, pre_match_elo_1, pre_match_elo_2, post_match_elo_1, post_match_elo_2, source_snapshot_id, correction_of_id, raw_values")
        .in("source_snapshot_id", historicalSourceSnapshotIds)
        .range(0, 999),
      client
        .from("world_cup_venue_catalog")
        .select("id, venue_key, venue_id, host_city_key, host_city_name_es, host_city_name_en, common_name, fifa_tournament_name, actual_city, country_code, timezone, metadata_json"),
      client
        .from("official_schedule_matches")
        .select("id, schedule_snapshot_id, tournament_key, official_match_number, stage_key, group_key, home_slot, away_slot, home_team_key, away_team_key, scheduled_at_utc, published_time, published_timezone, venue_key, source_snapshot_id, metadata_json")
        .eq("tournament_key", "fifa_world_cup_2026"),
      client.auth.admin.listUsers(),
      client.from("profiles").select("id, email, role"),
    ]);

  const allFacts =
    historicalSourceSnapshotIds.length === 0
      ? []
      : await readPagedRows<HistoricalMatchFactDbRow>(async (from, to) =>
          await client
            .from("historical_match_facts")
            .select("id, natural_match_key, match_date, team_1_key, team_2_key, competition_key, venue_context_key, neutral, score_1, score_2, pre_match_elo_1, pre_match_elo_2, post_match_elo_1, post_match_elo_2, source_snapshot_id, correction_of_id, raw_values")
            .in("source_snapshot_id", historicalSourceSnapshotIds)
            .range(from, to),
        );

  let migrationHistory: MigrationHistoryReadState;
  try {
    const { data: migrations, error } = await client
      .schema("supabase_migrations")
      .from("schema_migrations")
      .select("version");

    if (error) {
      migrationHistory = {
        status: "query_error",
        count: null,
        externallyVerifiedExpectedCount: expectedMigrationCount,
        detail: error.message,
      };
    } else if ((migrations ?? []).length === 0) {
      migrationHistory = {
        status: "unavailable_read_denied",
        count: null,
        externallyVerifiedExpectedCount: expectedMigrationCount,
        detail: "The current service-role/PostgREST path could not independently verify supabase_migrations.schema_migrations.",
      };
    } else {
      migrationHistory = {
        status: "verified_count",
        count: (migrations ?? []).length,
        externallyVerifiedExpectedCount: expectedMigrationCount,
        detail: "Migration history was independently readable through the importer read path.",
      };
    }
  } catch (error) {
    migrationHistory = {
      status: "query_error",
      count: null,
      externallyVerifiedExpectedCount: expectedMigrationCount,
      detail: error instanceof Error ? error.message : "Unknown migration-history read error.",
    };
  }

  const officialScheduleRows = (officialSchedule ?? []) as OfficialScheduleMatchRow[];
  const officialScheduleIds = officialScheduleRows.map((row) => row.id);
  const { data: officialScheduleLinks } =
    officialScheduleIds.length === 0
      ? { data: [] }
      : await client
          .from("official_schedule_match_links")
          .select("id, official_schedule_match_id, match_id, api_football_fixture_id, link_status, metadata_json")
          .in("official_schedule_match_id", officialScheduleIds);

  return {
    tableCounts,
    competitions: competitionRows,
    seasons: (seasons ?? []) as SeasonRow[],
    teams: (teams ?? []) as TeamRow[],
    venues: (venues ?? []) as VenueRow[],
    matches: (matches ?? []) as MatchRow[],
    sourceSnapshots: (sourceSnapshots ?? []) as SourceSnapshotRow[],
    canonicalTeamAliases: (aliases ?? []) as CanonicalTeamAliasRow[],
    canonicalTeamLocalizations: (localizations ?? []) as CanonicalTeamLocalizationRow[],
    canonicalTeamLinks: (links ?? []) as CanonicalTeamLinkRow[],
    teamRatingSnapshots: (ratings ?? []) as TeamRatingSnapshotDbRow[],
    historicalMatchFacts: allFacts.length > 0 ? allFacts : ((facts ?? []) as HistoricalMatchFactDbRow[]),
    scheduleSnapshots: (scheduleSnapshots ?? []) as ScheduleSnapshotRow[],
    worldCupVenueCatalog: (venueCatalog ?? []) as WorldCupVenueCatalogRow[],
    officialScheduleMatches: officialScheduleRows,
    officialScheduleMatchLinks: (officialScheduleLinks ?? []) as OfficialScheduleMatchLinkRow[],
    authUsers: (authUserResponse.data?.users ?? []).map((row) => ({ id: row.id, email: row.email ?? null })),
    profiles: (profiles ?? []) as ProfileRow[],
    migrationHistory,
  };
}

export async function runTask3BStageBootstrap(input: RunTask3BStageBootstrapInput): Promise<{
  plan: StageBootstrapPlan;
  artifactPath: string;
}> {
  if (!fs.existsSync(input.preparedDir)) {
    throw new Error(`Prepared V2 workspace not found: ${input.preparedDir}`);
  }

  assertTask3BStageBootstrapLocalRunPreflight(input.repoRoot, input.artifactsDir);

  const authorization = assertStageBootstrapAuthorization({
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    expectedMigrationCount: input.expectedMigrationCount,
    acceptExternalMigrationVerification: input.acceptExternalMigrationVerification,
    dryRun: input.dryRun,
    apply: input.apply,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
  const verifiedSources = verifyPreparedSources(input.preparedDir);
  const remoteState = await loadRemoteState(input.preparedDir, input.expectedMigrationCount);
  const plan = planStageBootstrap({
    preparedDir: input.preparedDir,
    remoteState,
    authorization,
    manifestStatus: verifiedSources.status,
    registry: verifiedSources.registry,
    files: verifiedSources.files,
  });
  plan.authorization = authorization;

  ensureDirectory(input.artifactsDir);
  const artifactPath = path.join(
    input.artifactsDir,
    authorization.mode === "apply" ? "stage-bootstrap-apply-plan.json" : "stage-bootstrap-dry-run.json",
  );
  writeJson(artifactPath, plan);

  if (authorization.mode === "apply") {
    if (!plan.applyEligible) {
      throw new Error(`Apply mode refused because plan.applyEligible=false: ${plan.applyEligibilityReasons.join(" | ")}`);
    }
    await applyStageBootstrap(plan, input.preparedDir, verifiedSources.registry);
  }

  return { plan, artifactPath };
}

export function resolveTask3BStageBootstrapDefaults(repoRoot: string) {
  const defaults = resolveDefaultPreparedPaths(repoRoot, path.join("local-run", new Date().toISOString().slice(0, 10)));
  return {
    preparedDir: defaults.preparedDir,
    artifactsDir: buildDefaultArtifactsDir(repoRoot),
  };
}
