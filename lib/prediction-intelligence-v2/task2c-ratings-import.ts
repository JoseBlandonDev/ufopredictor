import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { DatabaseInsert, Json } from "../../types/database";
import {
  type Task2CCoverage,
  type Task2CRatingDataset,
  type Task2CRatingRow,
} from "./task2c-source-package";
import { WORLD_CUP_2026_TEAMS } from "../world-cup-2026/canonical-teams";

export const TASK2C2_RATINGS_MANIFEST_FILE = "task2c2-ratings-manifest.json";
export const TASK2C2_RATINGS_MANIFEST_SCHEMA_NAME = "prediction-intelligence-v2-task2c2-ratings-package";
export const TASK2C2_RATINGS_MANIFEST_SCHEMA_VERSION = "1.0.0";
export const TASK2C2_RATINGS_DATASET_SCHEMA_NAME = "prediction-intelligence-v2-rating-snapshot";
export const TASK2C2_RATINGS_DATASET_SCHEMA_VERSION = "1.0.0";
export const TASK2C2_PLAN_SCHEMA_NAME = "prediction-intelligence-v2-task2c2-ratings-import-plan";
export const TASK2C2_PLAN_SCHEMA_VERSION = "1.0.0";
export const TASK2C2_TASK_SLICE = "task2c.2";
export const TASK2C2_PACKAGE_VERSION = "2026-06-29-v3";
export const TASK2C2_BASELINE_PACKAGE_VERSION = "2026-06-19-v2";
export const TASK2C2_COMPETITION_KEY = "world-cup-2026";
export const TASK2C2_SEASON_KEY = "2026";

type Task2C2SupportedSourceSchema =
  | "ufo-national-team-ratings-source-refresh-v3"
  | "ufo-national-team-source-refresh-v2";
type RatingSourceKey = "elo" | "fifa";
type DatasetRole = "ratings_elo" | "ratings_fifa";
type DatasetKind = "team_ratings_elo" | "team_ratings_fifa";
type Task2C2PlanAction = "insert" | "skip_identical" | "conflict" | "invalid";

type JsonRecord = Record<string, Json>;

type SourceManifestFile = {
  path?: string;
  filename?: string;
  sha256: string;
  bytes?: number;
  role?: string;
};

type V3SourceManifest = {
  schemaVersion: string;
  generatedAt: string;
  snapshotDate: string;
  baselineCutoffDate: string;
  files: SourceManifestFile[];
};

type V2SourceManifest = {
  schemaVersion: string;
  generatedAt: string;
  sources: Array<SourceManifestFile & { originalUploadedName?: string }>;
};

type V3CanonicalMapEntry = {
  team_key: string;
  database_name_en: string;
  display_name_en: string;
  display_name_es: string;
  aliases_json: string;
};

type V2DisplayMapEntry = {
  teamKey: string;
  databaseNameEn: string;
  displayNameEs: string;
  aliases: string[];
};

type V2DisplayMap = {
  schemaVersion: string;
  generatedAt: string;
  teams: V2DisplayMapEntry[];
};

type V3QualityReport = {
  schemaVersion: string;
  generatedAt: string;
  verdict: string;
  checks: {
    canonicalTeamCount: number;
    missingEloTeams: string[];
    missingFifaTeams: string[];
  };
  sourceDisagreement?: {
    explanation: string;
    status: string;
  };
};

type V2QualityReport = {
  schemaVersion: string;
  generatedAt: string;
  verdict: string;
  checks: {
    canonicalTeamCount: number;
    missingEloTeams: string[];
    missingFifaCsvTeams: string[];
  };
};

type V3TeamRow = {
  team_key: string;
  database_name_en: string;
  display_name_en: string;
  display_name_es: string;
  group: string;
  fifa_rank: number;
  fifa_points: number;
  fifa_live_points_change: number | null;
  fifa_source_name_es: string;
  elo_rank: number;
  elo_rating: number;
  elo_average_rank: number;
  elo_average_rating: number;
  elo_one_year_rank_change: number;
  elo_one_year_rating_change: number;
  elo_source_name_en: string;
};

type V3NormalizedSource = {
  schemaVersion: "ufo-national-team-ratings-source-refresh-v3";
  generatedAt: string;
  snapshotDate: string;
  baselineCutoffDate: string;
  coverage: {
    canonicalTeamCount: number;
    eloTeamCount: number;
    fifaTeamCount: number;
    missingTeams: string[];
    state: string;
  };
  canonicalIdentity: {
    authority: string;
    candidateKeysConfirmedExact: boolean;
    teamCount: number;
  };
  sources: {
    elo: {
      effectiveDate: string;
      effectivePrecision: string;
      rankTiePolicy: "allow_ties";
      state: string;
      url: string;
    };
    fifa: {
      effectiveDate: string;
      effectivePrecision: string;
      state: string;
      url: string;
      warning: string;
    };
  };
  teams: V3TeamRow[];
};

type V2TeamRow = {
  teamKey: string;
  databaseNameEn: string;
  displayNameEn: string;
  displayNameEs: string;
  group: string;
  fifa: {
    rank: number;
    points: number;
    pointsChange?: number | null;
    teamNameEs: string;
  };
  elo: {
    rank: number;
    rating: number;
    averageRank: number;
    averageRating: number;
    oneYearChangeRank: number;
    oneYearChangeRating: number;
    teamNameEn: string;
  };
};

type V2NormalizedSource = {
  schemaVersion: "ufo-national-team-source-refresh-v2";
  generatedAt: string;
  snapshotDate: string;
  latestIncludedResultDate: string;
  coverage: {
    canonicalTeamCount: number;
  };
  languagePolicy: {
    canonicalIdentity: string;
  };
  teams: V2TeamRow[];
};

type AdaptedSourceInput =
  | {
      sourceSchemaVersion: "ufo-national-team-ratings-source-refresh-v3";
      sourceDir: string;
      normalizedPath: string;
      manifestPath: string;
      qualityReportPath: string;
      snapshotDate: string;
      sourceGeneratedAtUtc: string;
      baselineCutoffDate: string;
      canonicalAuthority: string;
      sourceManifestSha256: string;
      qualityReportSha256: string;
      sourceManifest: V3SourceManifest;
      qualityReport: V3QualityReport;
      canonicalMapPath: string;
      canonicalMap: V3CanonicalMapEntry[];
      normalized: V3NormalizedSource;
    }
  | {
      sourceSchemaVersion: "ufo-national-team-source-refresh-v2";
      sourceDir: string;
      normalizedPath: string;
      manifestPath: string;
      qualityReportPath: string;
      snapshotDate: string;
      sourceGeneratedAtUtc: string;
      baselineCutoffDate: string;
      canonicalAuthority: string;
      sourceManifestSha256: string;
      qualityReportSha256: string;
      sourceManifest: V2SourceManifest;
      qualityReport: V2QualityReport;
      canonicalMapPath: string;
      canonicalMap: V2DisplayMap;
      normalized: V2NormalizedSource;
    };

type Task2C2ComparableSourceSnapshot = {
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
  metadata_json: Json;
};

type Task2C2ComparableRatingSnapshot = {
  source_key: RatingSourceKey;
  effective_at: string;
  captured_at: string | null;
  canonical_team_key: string;
  rank: number;
  rating_or_points: number;
  source_snapshot_id: string;
  raw_values: Json;
};

export type Task2C2LocalState = {
  sourceSnapshots: Task2C2ComparableSourceSnapshot[];
  teamRatingSnapshots: Task2C2ComparableRatingSnapshot[];
};

type Task2C2DatasetFileEntry = {
  role: DatasetRole;
  file_name: string;
  dataset_kind: DatasetKind;
  sha256: string;
  size_bytes: number;
};

type Task2C2DatasetManifestEntry = {
  role: DatasetRole;
  file_name: string;
  dataset_kind: DatasetKind;
  source_key: RatingSourceKey;
  snapshot_id: string;
  effective_at_utc: string;
  captured_at_utc: string;
  cutoff_at_utc: string;
  payload_hash: string;
};

export type Task2C2RatingsPackageManifest = {
  schema_name: typeof TASK2C2_RATINGS_MANIFEST_SCHEMA_NAME;
  schema_version: typeof TASK2C2_RATINGS_MANIFEST_SCHEMA_VERSION;
  package_version: string;
  package_id: string;
  generated_at_utc: string | null;
  source_input_schema_version: Task2C2SupportedSourceSchema;
  source_input_snapshot_date: string;
  baseline_cutoff_date: string;
  competition_key: string;
  season_key: string;
  target_canonical_team_keys: string[];
  semantic_package_sha256: string;
  source_input_files: Array<{
    file_name: string;
    relative_path: string;
    sha256: string;
  }>;
  package_files: Task2C2DatasetFileEntry[];
  datasets: Task2C2DatasetManifestEntry[];
};

export type Task2C2RatingsPackage = {
  manifest: Task2C2RatingsPackageManifest;
  datasets: {
    ratings_elo: Task2CRatingDataset;
    ratings_fifa: Task2CRatingDataset;
  };
  sourceSnapshots: {
    elo: DatabaseInsert<"source_snapshots">;
    fifa: DatabaseInsert<"source_snapshots">;
  };
  teamRatingSnapshots: Array<DatabaseInsert<"team_rating_snapshots">>;
};

export type Task2C2SourceSnapshotPlanRow = {
  action: Task2C2PlanAction;
  sourceKey: RatingSourceKey;
  snapshotId: string;
  reasons: string[];
  expected: DatabaseInsert<"source_snapshots">;
  existing: Task2C2ComparableSourceSnapshot | null;
};

export type Task2C2RatingSnapshotPlanRow = {
  action: Task2C2PlanAction;
  sourceKey: RatingSourceKey;
  canonicalTeamKey: string;
  effectiveAt: string;
  reasons: string[];
  expected: DatabaseInsert<"team_rating_snapshots">;
  existing: Task2C2ComparableRatingSnapshot | null;
};

export type Task2C2RatingsImportPlan = {
  schemaName: typeof TASK2C2_PLAN_SCHEMA_NAME;
  schemaVersion: typeof TASK2C2_PLAN_SCHEMA_VERSION;
  generatedAt: string;
  taskSlice: typeof TASK2C2_TASK_SLICE;
  mode: "dry_run";
  sourceDir: string;
  baselineDir: string | null;
  ratingsPackageManifestPath: string;
  ratingsPackageManifestSha256: string;
  sourceInputSchemaVersion: Task2C2SupportedSourceSchema;
  sourceInputSnapshotDate: string;
  baselineCutoffDate: string;
  summary: {
    sourceSnapshots: Record<Task2C2PlanAction, number>;
    teamRatingSnapshots: Record<Task2C2PlanAction, number>;
    totals: Record<Task2C2PlanAction, number>;
  };
  currentStateSummary: {
    sourceSnapshotCount: number;
    teamRatingSnapshotCount: number;
  };
  sourceSnapshots: Task2C2SourceSnapshotPlanRow[];
  teamRatingSnapshots: Task2C2RatingSnapshotPlanRow[];
  stablePlanSha256: string;
};

export type Task2C2DryRunArtifact = {
  ratingsPackageManifestPath: string;
  ratingsPackageManifestSha256: string;
  planPath: string;
  rerunPlanPath: string;
  rerunPlanSha256: string;
};

const CANONICAL_TEAM_KEYS = WORLD_CUP_2026_TEAMS.map((team) => team.teamKey).sort((left, right) =>
  left.localeCompare(right),
);
const CANONICAL_TEAM_KEY_SET: ReadonlySet<string> = new Set(CANONICAL_TEAM_KEYS);

function stableValue(value: unknown): Json {
  if (Array.isArray(value)) {
    return value.map((entry) => stableValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort((left, right) => left.localeCompare(right))
      .reduce<JsonRecord>((accumulator, key) => {
        accumulator[key] = stableValue((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }

  if (typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }
  if (typeof value === "string" || typeof value === "boolean" || value === null) {
    return value;
  }
  if (value === undefined) {
    return null;
  }
  return String(value);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function sha256Bytes(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function sha256Json(value: unknown): string {
  return sha256Bytes(stableStringify(value));
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function normalizeInstant(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp: ${value}`);
  }
  return parsed.toISOString();
}

function normalizeDateUtcStart(dateValue: string): string {
  return normalizeInstant(`${dateValue}T00:00:00Z`);
}

function normalizeDateUtcEnd(dateValue: string): string {
  return normalizeInstant(`${dateValue}T23:59:59.000Z`);
}

function ensureCanonicalTeamCoverage(teamKeys: string[], contextLabel: string): void {
  const duplicates = teamKeys.filter((teamKey, index) => teamKeys.indexOf(teamKey) !== index);
  if (duplicates.length > 0) {
    throw new Error(`${contextLabel} contained duplicate canonical_team_key values: ${Array.from(new Set(duplicates)).join(", ")}`);
  }

  const unexpected = teamKeys.filter((teamKey) => !CANONICAL_TEAM_KEY_SET.has(teamKey));
  if (unexpected.length > 0) {
    throw new Error(`${contextLabel} contained unknown canonical_team_key values: ${unexpected.join(", ")}`);
  }

  const missing = CANONICAL_TEAM_KEYS.filter((teamKey) => !teamKeys.includes(teamKey));
  if (missing.length > 0) {
    throw new Error(`${contextLabel} was missing canonical teams: ${missing.join(", ")}`);
  }
}

function normalizeCoverageComplete(): Task2CCoverage {
  return {
    status: "complete",
    target_team_count: CANONICAL_TEAM_KEYS.length,
    missing_team_keys: [],
  };
}

function compactTimestamp(instant: string): string {
  return normalizeInstant(instant).replace(/[-:.]/g, "").replace("T", "t").replace("Z", "z");
}

function relativeToRepo(repoRoot: string, targetPath: string): string {
  const relative = path.relative(repoRoot, targetPath);
  return relative === "" ? "." : relative.replace(/\\/g, "/");
}

function buildDatasetRole(sourceKey: RatingSourceKey): DatasetRole {
  return sourceKey === "elo" ? "ratings_elo" : "ratings_fifa";
}

function buildDatasetKind(sourceKey: RatingSourceKey): DatasetKind {
  return sourceKey === "elo" ? "team_ratings_elo" : "team_ratings_fifa";
}

function normalizeManifestFiles(sourceManifest: V3SourceManifest | V2SourceManifest): SourceManifestFile[] {
  if ("files" in sourceManifest) {
    return [...sourceManifest.files];
  }
  return [...sourceManifest.sources];
}

function resolveRequiredInputFiles(sourceDir: string) {
  const v3NormalizedPath = path.join(
    sourceDir,
    "normalized",
    "ufo-national-team-ratings-source-refresh-2026-06-29-v3.json",
  );
  if (fs.existsSync(v3NormalizedPath)) {
    return {
      schemaVersion: "ufo-national-team-ratings-source-refresh-v3" as const,
      normalizedPath: v3NormalizedPath,
      manifestPath: path.join(sourceDir, "reports", "ufo-signal-source-manifest-2026-06-29-v3.json"),
      qualityReportPath: path.join(sourceDir, "reports", "ufo-signal-source-quality-report-2026-06-29-v3.json"),
      canonicalMapPath: path.join(sourceDir, "normalized", "ufo-team-canonical-map-2026-v1.json"),
    };
  }

  const v2NormalizedPath = path.join(sourceDir, "normalized", "ufo-national-team-source-refresh-2026-06-19-v2.json");
  if (fs.existsSync(v2NormalizedPath)) {
    return {
      schemaVersion: "ufo-national-team-source-refresh-v2" as const,
      normalizedPath: v2NormalizedPath,
      manifestPath: path.join(sourceDir, "reports", "ufo-signal-source-manifest-2026-06-19-v2.json"),
      qualityReportPath: path.join(sourceDir, "reports", "ufo-signal-source-quality-report-2026-06-19-v2.json"),
      canonicalMapPath: path.join(sourceDir, "normalized", "ufo-team-display-name-map-es-en-v1.json"),
    };
  }

  throw new Error(`Unsupported Task 2C.2 source package in ${sourceDir}.`);
}

export function loadTask2C2AdaptedSourceInput(sourceDir: string): AdaptedSourceInput {
  const resolvedSourceDir = path.resolve(sourceDir);
  const required = resolveRequiredInputFiles(resolvedSourceDir);

  if (
    !fs.existsSync(required.manifestPath) ||
    !fs.existsSync(required.qualityReportPath) ||
    !fs.existsSync(required.canonicalMapPath)
  ) {
    throw new Error(`Task 2C.2 source package is missing required report files in ${resolvedSourceDir}.`);
  }

  if (required.schemaVersion === "ufo-national-team-ratings-source-refresh-v3") {
    const normalized = readJsonFile<V3NormalizedSource>(required.normalizedPath);
    const sourceManifest = readJsonFile<V3SourceManifest>(required.manifestPath);
    const qualityReport = readJsonFile<V3QualityReport>(required.qualityReportPath);
    const canonicalMap = readJsonFile<V3CanonicalMapEntry[]>(required.canonicalMapPath);
    return {
      sourceSchemaVersion: required.schemaVersion,
      sourceDir: resolvedSourceDir,
      normalizedPath: required.normalizedPath,
      manifestPath: required.manifestPath,
      qualityReportPath: required.qualityReportPath,
      snapshotDate: normalized.snapshotDate,
      sourceGeneratedAtUtc: normalizeInstant(normalized.generatedAt),
      baselineCutoffDate: normalized.baselineCutoffDate,
      canonicalAuthority: normalized.canonicalIdentity.authority,
      sourceManifestSha256: sha256Bytes(fs.readFileSync(required.manifestPath)),
      qualityReportSha256: sha256Bytes(fs.readFileSync(required.qualityReportPath)),
      sourceManifest,
      qualityReport,
      canonicalMapPath: required.canonicalMapPath,
      canonicalMap,
      normalized,
    };
  }

  const normalized = readJsonFile<V2NormalizedSource>(required.normalizedPath);
  const sourceManifest = readJsonFile<V2SourceManifest>(required.manifestPath);
  const qualityReport = readJsonFile<V2QualityReport>(required.qualityReportPath);
  const canonicalMap = readJsonFile<V2DisplayMap>(required.canonicalMapPath);
  return {
    sourceSchemaVersion: required.schemaVersion,
    sourceDir: resolvedSourceDir,
    normalizedPath: required.normalizedPath,
    manifestPath: required.manifestPath,
    qualityReportPath: required.qualityReportPath,
    snapshotDate: normalized.snapshotDate,
    sourceGeneratedAtUtc: normalizeInstant(normalized.generatedAt),
    baselineCutoffDate: normalized.latestIncludedResultDate,
    canonicalAuthority: "teamKey",
    sourceManifestSha256: sha256Bytes(fs.readFileSync(required.manifestPath)),
    qualityReportSha256: sha256Bytes(fs.readFileSync(required.qualityReportPath)),
    sourceManifest,
    qualityReport,
    canonicalMapPath: required.canonicalMapPath,
    canonicalMap,
    normalized,
  };
}

function normalizeIdentityToken(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function buildRuntimeCanonicalLookup(): Map<string, string[]> {
  const lookup = new Map<string, Set<string>>();
  for (const team of WORLD_CUP_2026_TEAMS) {
    const tokens = new Set(
      [
        team.teamKey,
        team.displayName,
        team.fifaOfficialName,
        team.slug,
        team.country,
        ...team.aliases,
      ]
        .map((value) => normalizeIdentityToken(value))
        .filter((value) => value.length > 0),
    );
    for (const token of tokens) {
      if (!lookup.has(token)) {
        lookup.set(token, new Set());
      }
      lookup.get(token)?.add(team.teamKey);
    }
  }

  return new Map(
    Array.from(lookup.entries()).map(([token, teamKeys]) => [token, Array.from(teamKeys).sort((left, right) => left.localeCompare(right))]),
  );
}

function sourceCanonicalCandidates(input: AdaptedSourceInput, sourceTeamKey: string, fallbackNames: string[]): string[] {
  if (input.sourceSchemaVersion === "ufo-national-team-ratings-source-refresh-v3") {
    const mapEntry = input.canonicalMap.find((entry) => entry.team_key === sourceTeamKey);
    const aliases = mapEntry ? (JSON.parse(mapEntry.aliases_json) as string[]) : [];
    return [
      sourceTeamKey,
      mapEntry?.database_name_en ?? "",
      mapEntry?.display_name_en ?? "",
      mapEntry?.display_name_es ?? "",
      ...aliases,
      ...fallbackNames,
    ];
  }

  const mapEntry = input.canonicalMap.teams.find((entry) => entry.teamKey === sourceTeamKey);
  return [
    sourceTeamKey,
    mapEntry?.databaseNameEn ?? "",
    mapEntry?.displayNameEs ?? "",
    ...(mapEntry?.aliases ?? []),
    ...fallbackNames,
  ];
}

function resolveRuntimeCanonicalTeamKey(
  input: AdaptedSourceInput,
  sourceTeamKey: string,
  fallbackNames: string[],
  runtimeLookup: Map<string, string[]>,
): string {
  const candidates = sourceCanonicalCandidates(input, sourceTeamKey, fallbackNames)
    .map((value) => normalizeIdentityToken(value))
    .filter((value) => value.length > 0);
  const matches = new Set<string>();
  for (const candidate of candidates) {
    const runtimeMatches = runtimeLookup.get(candidate) ?? [];
    if (runtimeMatches.length === 1) {
      matches.add(runtimeMatches[0]!);
    }
  }
  if (matches.size === 1) {
    return Array.from(matches)[0]!;
  }
  if (matches.size === 0) {
    throw new Error(`Unable to resolve source canonical team ${sourceTeamKey} to a runtime canonical team key.`);
  }
  throw new Error(`Ambiguous runtime canonical mapping for source team ${sourceTeamKey}: ${Array.from(matches).join(", ")}`);
}

function sourceFileShaByRelativePath(sourceManifest: V3SourceManifest | V2SourceManifest): Map<string, string> {
  const files = normalizeManifestFiles(sourceManifest);
  return new Map(
    files
      .map((entry) => {
        const relativePath = entry.path ?? (entry.filename ? `raw/${entry.filename}` : null);
        return relativePath == null ? null : [relativePath.replace(/\\/g, "/"), entry.sha256] as const;
      })
      .filter((entry): entry is readonly [string, string] => entry != null),
  );
}

function buildSourceSpecificTimes(input: AdaptedSourceInput, sourceKey: RatingSourceKey) {
  if (input.sourceSchemaVersion === "ufo-national-team-ratings-source-refresh-v3") {
    const effectiveAtUtc = normalizeDateUtcStart(
      sourceKey === "elo" ? input.normalized.sources.elo.effectiveDate : input.normalized.sources.fifa.effectiveDate,
    );
    if (sourceKey === "elo") {
      const capturedAtUtc = normalizeDateUtcEnd(input.normalized.sources.elo.effectiveDate);
      return {
        effectiveAtUtc,
        capturedAtUtc,
        cutoffAtUtc: capturedAtUtc,
      };
    }
    const capturedAtUtc = input.sourceGeneratedAtUtc;
    return {
      effectiveAtUtc,
      capturedAtUtc,
      cutoffAtUtc: capturedAtUtc,
    };
  }

  const effectiveAtUtc = normalizeDateUtcStart(input.normalized.snapshotDate);
  const capturedAtUtc = input.sourceGeneratedAtUtc;
  return {
    effectiveAtUtc,
    capturedAtUtc,
    cutoffAtUtc: capturedAtUtc,
  };
}

function buildSourceSnapshotId(sourceKey: RatingSourceKey, times: { effectiveAtUtc: string; capturedAtUtc: string }) {
  return `${sourceKey}-ratings-${compactTimestamp(times.effectiveAtUtc)}-${compactTimestamp(times.capturedAtUtc)}`;
}

function normalizeRatingRows(input: AdaptedSourceInput, sourceKey: RatingSourceKey): Task2CRatingRow[] {
  const runtimeLookup = buildRuntimeCanonicalLookup();
  if (input.sourceSchemaVersion === "ufo-national-team-ratings-source-refresh-v3") {
    const rows = input.normalized.teams.map((team) => {
      const runtimeCanonicalTeamKey = resolveRuntimeCanonicalTeamKey(
        input,
        team.team_key,
        [team.database_name_en, team.display_name_en, team.display_name_es],
        runtimeLookup,
      );
      if (sourceKey === "elo") {
        return {
          canonical_team_key: runtimeCanonicalTeamKey,
          rank: team.elo_rank,
          rating_or_points: team.elo_rating,
          reliability: stableValue({
            source_team_key: team.team_key,
            source_name_en: team.elo_source_name_en,
            average_rank: team.elo_average_rank,
            average_rating: team.elo_average_rating,
            one_year_rank_change: team.elo_one_year_rank_change,
            one_year_rating_change: team.elo_one_year_rating_change,
          }),
          missing_data: stableValue({ fields: [] }),
          disagreement: stableValue({ flags: [] }),
        } satisfies Task2CRatingRow;
      }
      return {
        canonical_team_key: runtimeCanonicalTeamKey,
        rank: team.fifa_rank,
        rating_or_points: team.fifa_points,
        reliability: stableValue({
          source_team_key: team.team_key,
          source_name_es: team.fifa_source_name_es,
          live_points_change: team.fifa_live_points_change,
        }),
        missing_data: stableValue({
          fields: team.fifa_live_points_change == null ? ["live_points_change"] : [],
        }),
        disagreement: stableValue({ flags: [] }),
      } satisfies Task2CRatingRow;
    });
    rows.sort((left, right) => left.canonical_team_key.localeCompare(right.canonical_team_key));
    ensureCanonicalTeamCoverage(
      rows.map((row) => row.canonical_team_key),
      `${input.sourceSchemaVersion} ${sourceKey} rows`,
    );
    return rows;
  }

  const rows = input.normalized.teams.map((team) => {
    const runtimeCanonicalTeamKey = resolveRuntimeCanonicalTeamKey(
      input,
      team.teamKey,
      [team.databaseNameEn, team.displayNameEn, team.displayNameEs],
      runtimeLookup,
    );
    if (sourceKey === "elo") {
      return {
        canonical_team_key: runtimeCanonicalTeamKey,
        rank: team.elo.rank,
        rating_or_points: team.elo.rating,
        reliability: stableValue({
          source_team_key: team.teamKey,
          source_name_en: team.elo.teamNameEn,
          average_rank: team.elo.averageRank,
          average_rating: team.elo.averageRating,
          one_year_rank_change: team.elo.oneYearChangeRank,
          one_year_rating_change: team.elo.oneYearChangeRating,
        }),
        missing_data: stableValue({ fields: [] }),
        disagreement: stableValue({ flags: [] }),
      } satisfies Task2CRatingRow;
    }
    return {
      canonical_team_key: runtimeCanonicalTeamKey,
      rank: team.fifa.rank,
      rating_or_points: team.fifa.points,
      reliability: stableValue({
        source_team_key: team.teamKey,
        source_name_es: team.fifa.teamNameEs,
        live_points_change: team.fifa.pointsChange ?? null,
      }),
      missing_data: stableValue({
        fields: team.fifa.pointsChange == null ? ["live_points_change"] : [],
      }),
      disagreement: stableValue({ flags: [] }),
    } satisfies Task2CRatingRow;
  });
  rows.sort((left, right) => left.canonical_team_key.localeCompare(right.canonical_team_key));
  ensureCanonicalTeamCoverage(rows.map((row) => row.canonical_team_key), `${input.sourceSchemaVersion} ${sourceKey} rows`);
  return rows;
}

function buildDatasetReliability(input: AdaptedSourceInput, sourceKey: RatingSourceKey, manifestFileSha: string | null): Json {
  if (input.sourceSchemaVersion === "ufo-national-team-ratings-source-refresh-v3") {
    return stableValue({
      source_input_schema_version: input.sourceSchemaVersion,
      source_snapshot_date: input.snapshotDate,
      source_generated_at_utc: input.sourceGeneratedAtUtc,
      canonical_authority: input.canonicalAuthority,
      quality_verdict: input.qualityReport.verdict,
      quality_report_sha256: input.qualityReportSha256,
      source_manifest_sha256: input.sourceManifestSha256,
      source_file_sha256: manifestFileSha,
      source_state: sourceKey === "elo" ? input.normalized.sources.elo.state : input.normalized.sources.fifa.state,
      effective_precision:
        sourceKey === "elo"
          ? input.normalized.sources.elo.effectivePrecision
          : input.normalized.sources.fifa.effectivePrecision,
      rank_tie_policy: sourceKey === "elo" ? input.normalized.sources.elo.rankTiePolicy : "forbid_ties",
    });
  }

  return stableValue({
    source_input_schema_version: input.sourceSchemaVersion,
    source_snapshot_date: input.snapshotDate,
    source_generated_at_utc: input.sourceGeneratedAtUtc,
    canonical_authority: input.canonicalAuthority,
    quality_verdict: input.qualityReport.verdict,
    quality_report_sha256: input.qualityReportSha256,
    source_manifest_sha256: input.sourceManifestSha256,
    source_file_sha256: manifestFileSha,
    latest_included_result_date: input.normalized.latestIncludedResultDate,
    rank_tie_policy: sourceKey === "elo" ? "allow_ties" : "forbid_ties",
  });
}

function buildDatasetDisagreement(input: AdaptedSourceInput, sourceKey: RatingSourceKey): Json {
  if (input.sourceSchemaVersion === "ufo-national-team-ratings-source-refresh-v3") {
    return stableValue({
      source_cutoff_not_shared_across_fifa_and_elo: true,
      intraday_status: input.qualityReport.sourceDisagreement?.status ?? "separate_source_cutoffs_required",
      explanation:
        input.qualityReport.sourceDisagreement?.explanation ??
        "FIFA live and Elo daily source captures must remain separate.",
      source_key: sourceKey,
    });
  }

  return stableValue({
    source_cutoff_not_shared_across_fifa_and_elo: false,
    explanation: "Baseline comparison package retained as the prior local state for Task 2C.2.",
    source_key: sourceKey,
  });
}

function buildDatasetMissingData(): Json {
  return stableValue({ missing_team_keys: [] });
}

function buildTask2C2RatingDataset(input: AdaptedSourceInput, sourceKey: RatingSourceKey): Task2CRatingDataset {
  const rows = normalizeRatingRows(input, sourceKey);
  const fileShaLookup = sourceFileShaByRelativePath(input.sourceManifest);
  const sourceFileRelativePath =
    input.sourceSchemaVersion === "ufo-national-team-ratings-source-refresh-v3"
      ? sourceKey === "elo"
        ? "normalized/ufo-ratings-elo-source-2026-06-29-v1.csv"
        : "normalized/ufo-ratings-fifa-source-2026-06-29-v1.csv"
      : input.normalizedPath.replace(`${input.sourceDir}${path.sep}`, "").replace(/\\/g, "/");
  const sourceFileSha = fileShaLookup.get(sourceFileRelativePath) ?? null;
  const times = buildSourceSpecificTimes(input, sourceKey);
  return {
    schema_name: TASK2C2_RATINGS_DATASET_SCHEMA_NAME,
    schema_version: TASK2C2_RATINGS_DATASET_SCHEMA_VERSION,
    dataset_role: buildDatasetRole(sourceKey),
    dataset_kind: buildDatasetKind(sourceKey),
    source_key: sourceKey,
    snapshot_id: buildSourceSnapshotId(sourceKey, times),
    competition_key: TASK2C2_COMPETITION_KEY,
    season_key: TASK2C2_SEASON_KEY,
    effective_at_utc: times.effectiveAtUtc,
    captured_at_utc: times.capturedAtUtc,
    cutoff_at_utc: times.cutoffAtUtc,
    rank_tie_policy: sourceKey === "elo" ? "allow_ties" : "forbid_ties",
    coverage: normalizeCoverageComplete(),
    reliability: buildDatasetReliability(input, sourceKey, sourceFileSha),
    missing_data: buildDatasetMissingData(),
    disagreement: buildDatasetDisagreement(input, sourceKey),
    teams: rows,
  };
}

function buildDatasetSemanticProjection(dataset: Task2CRatingDataset) {
  return {
    schema_name: dataset.schema_name,
    schema_version: dataset.schema_version,
    dataset_role: dataset.dataset_role,
    dataset_kind: dataset.dataset_kind,
    source_key: dataset.source_key,
    snapshot_id: dataset.snapshot_id,
    competition_key: dataset.competition_key,
    season_key: dataset.season_key,
    effective_at_utc: normalizeInstant(dataset.effective_at_utc),
    captured_at_utc: normalizeInstant(dataset.captured_at_utc),
    cutoff_at_utc: normalizeInstant(dataset.cutoff_at_utc),
    rank_tie_policy: dataset.rank_tie_policy,
    coverage: stableValue(dataset.coverage),
    reliability: stableValue(dataset.reliability),
    missing_data: stableValue(dataset.missing_data),
    disagreement: stableValue(dataset.disagreement),
    teams: [...dataset.teams]
      .map((row) => ({
        canonical_team_key: row.canonical_team_key,
        rank: row.rank,
        rating_or_points: row.rating_or_points,
        reliability: stableValue(row.reliability ?? {}),
        missing_data: stableValue(row.missing_data ?? {}),
        disagreement: stableValue(row.disagreement ?? {}),
      }))
      .sort((left, right) => left.canonical_team_key.localeCompare(right.canonical_team_key)),
  };
}

function buildSourceSnapshotMetadata(input: AdaptedSourceInput, dataset: Task2CRatingDataset): Json {
  const normalizedRelativePath = relativeToRepo(process.cwd(), input.normalizedPath);
  return stableValue({
    task_slice: TASK2C2_TASK_SLICE,
    competition_key: dataset.competition_key,
    season_key: dataset.season_key,
    source_input_schema_version: input.sourceSchemaVersion,
    source_input_snapshot_date: input.snapshotDate,
    source_generated_at_utc: input.sourceGeneratedAtUtc,
    baseline_cutoff_date: input.baselineCutoffDate,
    source_manifest_sha256: input.sourceManifestSha256,
    quality_report_sha256: input.qualityReportSha256,
    normalized_input_path: normalizedRelativePath,
    dataset_role: dataset.dataset_role,
    dataset_kind: dataset.dataset_kind,
    rank_tie_policy: dataset.rank_tie_policy,
    coverage: dataset.coverage,
    disagreement: dataset.disagreement,
    reliability: dataset.reliability,
  });
}

function buildSourceSnapshotInsert(input: AdaptedSourceInput, dataset: Task2CRatingDataset): DatabaseInsert<"source_snapshots"> {
  const payloadHash = sha256Json(buildDatasetSemanticProjection(dataset));
  return {
    source_key: dataset.source_key,
    snapshot_id: dataset.snapshot_id,
    data_kind: dataset.dataset_kind,
    source_url:
      input.sourceSchemaVersion === "ufo-national-team-ratings-source-refresh-v3"
        ? dataset.source_key === "elo"
          ? input.normalized.sources.elo.url
          : input.normalized.sources.fifa.url
        : null,
    local_fallback_path: relativeToRepo(process.cwd(), input.sourceDir),
    normalized_snapshot_path: relativeToRepo(process.cwd(), input.normalizedPath),
    effective_at: dataset.effective_at_utc,
    captured_at: dataset.captured_at_utc,
    payload_hash: payloadHash,
    row_count: dataset.teams.length,
    metadata_json: buildSourceSnapshotMetadata(input, dataset),
  };
}

function buildRatingSnapshotInsert(
  sourceSnapshot: DatabaseInsert<"source_snapshots">,
  dataset: Task2CRatingDataset,
  row: Task2CRatingRow,
): DatabaseInsert<"team_rating_snapshots"> {
  return {
    source_key: dataset.source_key,
    effective_at: dataset.effective_at_utc,
    captured_at: dataset.captured_at_utc,
    canonical_team_key: row.canonical_team_key,
    rank: row.rank,
    rating_or_points: row.rating_or_points,
    source_snapshot_id: sourceSnapshot.snapshot_id,
    raw_values: stableValue({
      dataset_role: dataset.dataset_role,
      dataset_kind: dataset.dataset_kind,
      source_snapshot_payload_hash: sourceSnapshot.payload_hash,
      cutoff_at_utc: dataset.cutoff_at_utc,
      row_reliability: row.reliability ?? {},
      row_missing_data: row.missing_data ?? {},
      row_disagreement: row.disagreement ?? {},
      dataset_reliability: dataset.reliability,
      dataset_missing_data: dataset.missing_data,
      dataset_disagreement: dataset.disagreement,
    }),
  };
}

function buildPackageId(datasets: Task2C2RatingsPackage["datasets"], packageVersion: string): string {
  return sha256Json({
    package_version: packageVersion,
    competition_key: datasets.ratings_elo.competition_key,
    season_key: datasets.ratings_elo.season_key,
    ratings_elo_snapshot_id: datasets.ratings_elo.snapshot_id,
    ratings_fifa_snapshot_id: datasets.ratings_fifa.snapshot_id,
  });
}

function buildManifestSemanticProjection(
  manifestBase: Omit<Task2C2RatingsPackageManifest, "semantic_package_sha256">,
  datasets: Task2C2RatingsPackage["datasets"],
) {
  const normalizedManifestBase = stableValue(manifestBase) as JsonRecord;
  return {
    ...normalizedManifestBase,
    datasets: {
      ratings_elo: buildDatasetSemanticProjection(datasets.ratings_elo),
      ratings_fifa: buildDatasetSemanticProjection(datasets.ratings_fifa),
    },
  };
}

export function buildTask2C2RatingsPackage(args: {
  sourceDir: string;
  packageVersion?: string;
  packageCreatedAtUtc?: string | null;
}): Task2C2RatingsPackage {
  const input = loadTask2C2AdaptedSourceInput(args.sourceDir);
  const ratingsElo = buildTask2C2RatingDataset(input, "elo");
  const ratingsFifa = buildTask2C2RatingDataset(input, "fifa");
  const sourceSnapshots = {
    elo: buildSourceSnapshotInsert(input, ratingsElo),
    fifa: buildSourceSnapshotInsert(input, ratingsFifa),
  };
  const teamRatingSnapshots = [...ratingsElo.teams.map((row) => buildRatingSnapshotInsert(sourceSnapshots.elo, ratingsElo, row))]
    .concat(ratingsFifa.teams.map((row) => buildRatingSnapshotInsert(sourceSnapshots.fifa, ratingsFifa, row)))
    .sort(
      (left, right) =>
        left.source_key.localeCompare(right.source_key) ||
        left.canonical_team_key.localeCompare(right.canonical_team_key),
    );

  const datasetFiles: Array<{ role: DatasetRole; file_name: string; dataset: Task2CRatingDataset }> = [
    { role: "ratings_elo", file_name: "ratings-elo.json", dataset: ratingsElo },
    { role: "ratings_fifa", file_name: "ratings-fifa.json", dataset: ratingsFifa },
  ];
  const packageFiles: Task2C2DatasetFileEntry[] = datasetFiles
    .map((entry) => {
      const encoded = stableStringify(entry.dataset);
      return {
        role: entry.role,
        file_name: entry.file_name,
        dataset_kind: entry.dataset.dataset_kind,
        sha256: sha256Bytes(encoded),
        size_bytes: Buffer.byteLength(encoded, "utf8"),
      };
    })
    .sort((left, right) => left.role.localeCompare(right.role));
  const manifestBase: Omit<Task2C2RatingsPackageManifest, "semantic_package_sha256"> = {
    schema_name: TASK2C2_RATINGS_MANIFEST_SCHEMA_NAME,
    schema_version: TASK2C2_RATINGS_MANIFEST_SCHEMA_VERSION,
    package_version: args.packageVersion ?? (input.sourceSchemaVersion === "ufo-national-team-ratings-source-refresh-v3"
      ? TASK2C2_PACKAGE_VERSION
      : TASK2C2_BASELINE_PACKAGE_VERSION),
    package_id: buildPackageId({ ratings_elo: ratingsElo, ratings_fifa: ratingsFifa }, args.packageVersion ?? TASK2C2_PACKAGE_VERSION),
    generated_at_utc: args.packageCreatedAtUtc ?? input.sourceGeneratedAtUtc,
    source_input_schema_version: input.sourceSchemaVersion,
    source_input_snapshot_date: input.snapshotDate,
    baseline_cutoff_date: input.baselineCutoffDate,
    competition_key: TASK2C2_COMPETITION_KEY,
    season_key: TASK2C2_SEASON_KEY,
    target_canonical_team_keys: [...CANONICAL_TEAM_KEYS],
    source_input_files: [
      {
        file_name: path.basename(input.normalizedPath),
        relative_path: relativeToRepo(process.cwd(), input.normalizedPath),
        sha256: sha256Bytes(fs.readFileSync(input.normalizedPath)),
      },
      {
        file_name: path.basename(input.manifestPath),
        relative_path: relativeToRepo(process.cwd(), input.manifestPath),
        sha256: input.sourceManifestSha256,
      },
      {
        file_name: path.basename(input.canonicalMapPath),
        relative_path: relativeToRepo(process.cwd(), input.canonicalMapPath),
        sha256: sha256Bytes(fs.readFileSync(input.canonicalMapPath)),
      },
      {
        file_name: path.basename(input.qualityReportPath),
        relative_path: relativeToRepo(process.cwd(), input.qualityReportPath),
        sha256: input.qualityReportSha256,
      },
    ],
    package_files: packageFiles,
    datasets: [
      {
        role: "ratings_elo" as const,
        file_name: "ratings-elo.json",
        dataset_kind: ratingsElo.dataset_kind,
        source_key: "elo" as const,
        snapshot_id: ratingsElo.snapshot_id,
        effective_at_utc: ratingsElo.effective_at_utc,
        captured_at_utc: ratingsElo.captured_at_utc,
        cutoff_at_utc: ratingsElo.cutoff_at_utc,
        payload_hash: sourceSnapshots.elo.payload_hash,
      },
      {
        role: "ratings_fifa" as const,
        file_name: "ratings-fifa.json",
        dataset_kind: ratingsFifa.dataset_kind,
        source_key: "fifa" as const,
        snapshot_id: ratingsFifa.snapshot_id,
        effective_at_utc: ratingsFifa.effective_at_utc,
        captured_at_utc: ratingsFifa.captured_at_utc,
        cutoff_at_utc: ratingsFifa.cutoff_at_utc,
        payload_hash: sourceSnapshots.fifa.payload_hash,
      },
    ].sort((left, right) => left.role.localeCompare(right.role)),
  };
  const manifest: Task2C2RatingsPackageManifest = {
    ...manifestBase,
    semantic_package_sha256: sha256Json(
      buildManifestSemanticProjection(manifestBase, {
        ratings_elo: ratingsElo,
        ratings_fifa: ratingsFifa,
      }),
    ),
  };
  return {
    manifest,
    datasets: {
      ratings_elo: ratingsElo,
      ratings_fifa: ratingsFifa,
    },
    sourceSnapshots,
    teamRatingSnapshots,
  };
}

export function writeTask2C2RatingsPackage(outputDir: string, ratingsPackage: Task2C2RatingsPackage): {
  manifestPath: string;
  manifestSha256: string;
} {
  fs.mkdirSync(outputDir, { recursive: true });
  const ratingsEloPath = path.join(outputDir, "ratings-elo.json");
  const ratingsFifaPath = path.join(outputDir, "ratings-fifa.json");
  const manifestPath = path.join(outputDir, TASK2C2_RATINGS_MANIFEST_FILE);
  writeJson(ratingsEloPath, ratingsPackage.datasets.ratings_elo);
  writeJson(ratingsFifaPath, ratingsPackage.datasets.ratings_fifa);
  writeJson(manifestPath, ratingsPackage.manifest);
  return {
    manifestPath,
    manifestSha256: sha256Bytes(fs.readFileSync(manifestPath)),
  };
}

function normalizeComparableSourceSnapshot(row: Task2C2ComparableSourceSnapshot): Task2C2ComparableSourceSnapshot {
  return {
    ...row,
    source_url: row.source_url ?? null,
    local_fallback_path: row.local_fallback_path ?? null,
    normalized_snapshot_path: row.normalized_snapshot_path ?? null,
    effective_at: row.effective_at ?? null,
    captured_at: row.captured_at ?? null,
    metadata_json: stableValue(row.metadata_json),
  };
}

function normalizeComparableRatingSnapshot(row: Task2C2ComparableRatingSnapshot): Task2C2ComparableRatingSnapshot {
  return {
    ...row,
    captured_at: row.captured_at ?? null,
    raw_values: stableValue(row.raw_values),
  };
}

function toComparableSourceSnapshot(row: DatabaseInsert<"source_snapshots">): Task2C2ComparableSourceSnapshot {
  return normalizeComparableSourceSnapshot({
    source_key: row.source_key,
    snapshot_id: row.snapshot_id,
    data_kind: row.data_kind,
    source_url: row.source_url ?? null,
    local_fallback_path: row.local_fallback_path ?? null,
    normalized_snapshot_path: row.normalized_snapshot_path ?? null,
    effective_at: row.effective_at ?? null,
    captured_at: row.captured_at ?? null,
    payload_hash: row.payload_hash,
    row_count: row.row_count ?? 0,
    metadata_json: row.metadata_json ?? {},
  });
}

function toComparableRatingSnapshot(row: DatabaseInsert<"team_rating_snapshots">): Task2C2ComparableRatingSnapshot {
  if (row.source_key !== "elo" && row.source_key !== "fifa") {
    throw new Error(`Unsupported Task 2C.2 rating source_key: ${row.source_key}`);
  }
  return normalizeComparableRatingSnapshot({
    source_key: row.source_key,
    effective_at: row.effective_at,
    captured_at: row.captured_at ?? null,
    canonical_team_key: row.canonical_team_key,
    rank: row.rank ?? 0,
    rating_or_points: Number(row.rating_or_points ?? 0),
    source_snapshot_id: row.source_snapshot_id,
    raw_values: row.raw_values ?? {},
  });
}

export function buildTask2C2LocalStateFromRatingsPackage(ratingsPackage: Task2C2RatingsPackage): Task2C2LocalState {
  return {
    sourceSnapshots: [ratingsPackage.sourceSnapshots.elo, ratingsPackage.sourceSnapshots.fifa]
      .map((row) => toComparableSourceSnapshot(row))
      .sort((left, right) => left.snapshot_id.localeCompare(right.snapshot_id)),
    teamRatingSnapshots: ratingsPackage.teamRatingSnapshots
      .map((row) => toComparableRatingSnapshot(row))
      .sort(
        (left, right) =>
          left.source_key.localeCompare(right.source_key) ||
          left.canonical_team_key.localeCompare(right.canonical_team_key),
      ),
  };
}

function sourceSnapshotEqual(
  left: Task2C2ComparableSourceSnapshot | DatabaseInsert<"source_snapshots">,
  right: Task2C2ComparableSourceSnapshot | DatabaseInsert<"source_snapshots">,
): boolean {
  const normalizedLeft =
    "snapshot_id" in left && "row_count" in left
      ? normalizeComparableSourceSnapshot(left as Task2C2ComparableSourceSnapshot)
      : toComparableSourceSnapshot(left as DatabaseInsert<"source_snapshots">);
  const normalizedRight =
    "snapshot_id" in right && "row_count" in right
      ? normalizeComparableSourceSnapshot(right as Task2C2ComparableSourceSnapshot)
      : toComparableSourceSnapshot(right as DatabaseInsert<"source_snapshots">);
  return stableStringify(normalizedLeft) === stableStringify(normalizedRight);
}

function ratingSnapshotEqual(
  left: Task2C2ComparableRatingSnapshot | DatabaseInsert<"team_rating_snapshots">,
  right: Task2C2ComparableRatingSnapshot | DatabaseInsert<"team_rating_snapshots">,
): boolean {
  const normalizedLeft =
    "effective_at" in left && "source_snapshot_id" in left
      ? normalizeComparableRatingSnapshot(left as Task2C2ComparableRatingSnapshot)
      : toComparableRatingSnapshot(left as DatabaseInsert<"team_rating_snapshots">);
  const normalizedRight =
    "effective_at" in right && "source_snapshot_id" in right
      ? normalizeComparableRatingSnapshot(right as Task2C2ComparableRatingSnapshot)
      : toComparableRatingSnapshot(right as DatabaseInsert<"team_rating_snapshots">);
  return stableStringify(normalizedLeft) === stableStringify(normalizedRight);
}

function emptyActionCounts(): Record<Task2C2PlanAction, number> {
  return {
    insert: 0,
    skip_identical: 0,
    conflict: 0,
    invalid: 0,
  };
}

function buildPlanStableProjection(plan: Omit<Task2C2RatingsImportPlan, "generatedAt" | "stablePlanSha256">) {
  const normalizedPlan = stableValue(plan) as JsonRecord;
  return {
    ...normalizedPlan,
  };
}

function comparePlanRows(
  left: Pick<Task2C2SourceSnapshotPlanRow, "sourceKey" | "snapshotId"> | Pick<Task2C2RatingSnapshotPlanRow, "sourceKey" | "canonicalTeamKey" | "effectiveAt">,
  right: Pick<Task2C2SourceSnapshotPlanRow, "sourceKey" | "snapshotId"> | Pick<Task2C2RatingSnapshotPlanRow, "sourceKey" | "canonicalTeamKey" | "effectiveAt">,
) {
  if ("snapshotId" in left && "snapshotId" in right) {
    return left.sourceKey.localeCompare(right.sourceKey) || left.snapshotId.localeCompare(right.snapshotId);
  }
  if ("canonicalTeamKey" in left && "canonicalTeamKey" in right) {
    return (
      left.sourceKey.localeCompare(right.sourceKey) ||
      left.effectiveAt.localeCompare(right.effectiveAt) ||
      left.canonicalTeamKey.localeCompare(right.canonicalTeamKey)
    );
  }
  return 0;
}

export function planTask2C2RatingsImport(args: {
  ratingsPackage: Task2C2RatingsPackage;
  currentState: Task2C2LocalState;
  ratingsPackageManifestPath: string;
  ratingsPackageManifestSha256: string;
  sourceDir: string;
  baselineDir: string | null;
}): Task2C2RatingsImportPlan {
  const sourceSnapshotCounts = emptyActionCounts();
  const ratingSnapshotCounts = emptyActionCounts();
  const sourceSnapshotsBySnapshotId = new Map(
    args.currentState.sourceSnapshots.map((row) => [row.snapshot_id, normalizeComparableSourceSnapshot(row)]),
  );
  const sourceSnapshotsBySourceKeyAndPayloadHash = new Map(
    args.currentState.sourceSnapshots.map((row) => [`${row.source_key}::${row.payload_hash}`, normalizeComparableSourceSnapshot(row)]),
  );
  const sourceSnapshotRows = [args.ratingsPackage.sourceSnapshots.elo, args.ratingsPackage.sourceSnapshots.fifa]
    .map((expected) => {
      const existingById = sourceSnapshotsBySnapshotId.get(expected.snapshot_id) ?? null;
      const existingByPayload = sourceSnapshotsBySourceKeyAndPayloadHash.get(`${expected.source_key}::${expected.payload_hash}`) ?? null;
      let action: Task2C2PlanAction = "insert";
      const reasons: string[] = [];
      if (existingById) {
        if (sourceSnapshotEqual(existingById, expected)) {
          action = "skip_identical";
          reasons.push("snapshot_id already stored with identical payload.");
        } else {
          action = "conflict";
          reasons.push("snapshot_id already exists with different immutable source snapshot metadata.");
        }
      } else if (existingByPayload) {
        action = "conflict";
        reasons.push(`payload_hash already stored under snapshot_id=${existingByPayload.snapshot_id}.`);
      }
      sourceSnapshotCounts[action] += 1;
      return {
        action,
        sourceKey: expected.source_key as RatingSourceKey,
        snapshotId: expected.snapshot_id,
        reasons,
        expected,
        existing: existingById ?? existingByPayload,
      } satisfies Task2C2SourceSnapshotPlanRow;
    })
    .sort(comparePlanRows);

  const sourceActionBySnapshotId = new Map(sourceSnapshotRows.map((row) => [row.snapshotId, row.action]));
  const ratingRowsByIdentity = new Map(
    args.currentState.teamRatingSnapshots.map((row) => [
      `${row.source_key}::${row.effective_at}::${row.canonical_team_key}`,
      normalizeComparableRatingSnapshot(row),
    ]),
  );
  const ratingSnapshotRows = args.ratingsPackage.teamRatingSnapshots
    .map((expected) => {
      const sourceAction = sourceActionBySnapshotId.get(expected.source_snapshot_id);
      const identity = `${expected.source_key}::${expected.effective_at}::${expected.canonical_team_key}`;
      const existing = ratingRowsByIdentity.get(identity) ?? null;
      let action: Task2C2PlanAction = "insert";
      const reasons: string[] = [];
      if (sourceAction === "conflict") {
        action = "invalid";
        reasons.push(`referenced source snapshot action=${sourceAction}.`);
      } else if (expected.rank == null || expected.rank <= 0 || expected.rating_or_points == null || Number(expected.rating_or_points) < 0) {
        action = "invalid";
        reasons.push("rating snapshot failed basic numeric validation.");
      } else if (existing) {
        if (ratingSnapshotEqual(existing, expected)) {
          action = "skip_identical";
          reasons.push("rating snapshot already stored with identical payload.");
        } else {
          action = "conflict";
          reasons.push("rating snapshot identity already exists with different immutable payload.");
        }
      }
      ratingSnapshotCounts[action] += 1;
      return {
        action,
        sourceKey: expected.source_key as RatingSourceKey,
        canonicalTeamKey: expected.canonical_team_key,
        effectiveAt: expected.effective_at,
        reasons,
        expected,
        existing,
      } satisfies Task2C2RatingSnapshotPlanRow;
    })
    .sort(comparePlanRows);

  const summary = {
    sourceSnapshots: sourceSnapshotCounts,
    teamRatingSnapshots: ratingSnapshotCounts,
    totals: {
      insert: sourceSnapshotCounts.insert + ratingSnapshotCounts.insert,
      skip_identical: sourceSnapshotCounts.skip_identical + ratingSnapshotCounts.skip_identical,
      conflict: sourceSnapshotCounts.conflict + ratingSnapshotCounts.conflict,
      invalid: sourceSnapshotCounts.invalid + ratingSnapshotCounts.invalid,
    },
  };

  const planBase: Omit<Task2C2RatingsImportPlan, "generatedAt" | "stablePlanSha256"> = {
    schemaName: TASK2C2_PLAN_SCHEMA_NAME,
    schemaVersion: TASK2C2_PLAN_SCHEMA_VERSION,
    taskSlice: TASK2C2_TASK_SLICE,
    mode: "dry_run",
    sourceDir: path.resolve(args.sourceDir),
    baselineDir: args.baselineDir == null ? null : path.resolve(args.baselineDir),
    ratingsPackageManifestPath: path.resolve(args.ratingsPackageManifestPath),
    ratingsPackageManifestSha256: args.ratingsPackageManifestSha256,
    sourceInputSchemaVersion: args.ratingsPackage.manifest.source_input_schema_version,
    sourceInputSnapshotDate: args.ratingsPackage.manifest.source_input_snapshot_date,
    baselineCutoffDate: args.ratingsPackage.manifest.baseline_cutoff_date,
    summary,
    currentStateSummary: {
      sourceSnapshotCount: args.currentState.sourceSnapshots.length,
      teamRatingSnapshotCount: args.currentState.teamRatingSnapshots.length,
    },
    sourceSnapshots: sourceSnapshotRows,
    teamRatingSnapshots: ratingSnapshotRows,
  };
  return {
    ...planBase,
    generatedAt: new Date().toISOString(),
    stablePlanSha256: sha256Json(buildPlanStableProjection(planBase)),
  };
}

export function applyTask2C2RatingsPlanToLocalState(
  currentState: Task2C2LocalState,
  plan: Task2C2RatingsImportPlan,
): Task2C2LocalState {
  const nextSourceSnapshots = [...currentState.sourceSnapshots];
  const nextTeamRatingSnapshots = [...currentState.teamRatingSnapshots];
  for (const row of plan.sourceSnapshots) {
    if (row.action === "insert") {
      nextSourceSnapshots.push(toComparableSourceSnapshot(row.expected));
    }
  }
  for (const row of plan.teamRatingSnapshots) {
    if (row.action === "insert") {
      nextTeamRatingSnapshots.push(toComparableRatingSnapshot(row.expected));
    }
  }
  return {
    sourceSnapshots: nextSourceSnapshots.sort((left, right) => left.snapshot_id.localeCompare(right.snapshot_id)),
    teamRatingSnapshots: nextTeamRatingSnapshots.sort(
      (left, right) =>
        left.source_key.localeCompare(right.source_key) ||
        left.effective_at.localeCompare(right.effective_at) ||
        left.canonical_team_key.localeCompare(right.canonical_team_key),
    ),
  };
}

export function buildDefaultTask2C2ArtifactsDir(repoRoot: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(repoRoot, "artifacts", "prediction-intelligence-v2", "task2c-2", "local-run", day, stamp);
}

export function assertTask2C2LocalRunPreflight(repoRoot: string, artifactsDir: string): void {
  const resolvedArtifactsDir = path.resolve(artifactsDir);
  const allowedRoot = path.resolve(repoRoot, "artifacts", "prediction-intelligence-v2", "task2c-2", "local-run");
  const relative = path.relative(allowedRoot, resolvedArtifactsDir);
  if (relative === "" || relative === "." || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Task 2C.2 local run refused because artifactsDir must resolve inside ${allowedRoot}${path.sep}.`);
  }
}

export function writeTask2C2DryRunArtifacts(args: {
  artifactsDir: string;
  ratingsPackage: Task2C2RatingsPackage;
  plan: Task2C2RatingsImportPlan;
  rerunPlan: Task2C2RatingsImportPlan;
}): Task2C2DryRunArtifact {
  const packageDir = path.join(args.artifactsDir, "ratings-package");
  const { manifestPath, manifestSha256 } = writeTask2C2RatingsPackage(packageDir, args.ratingsPackage);
  const planPath = path.join(args.artifactsDir, "task2c2-ratings-import-dry-run.json");
  const rerunPlanPath = path.join(args.artifactsDir, "task2c2-ratings-import-rerun.json");
  writeJson(planPath, args.plan);
  writeJson(rerunPlanPath, args.rerunPlan);
  return {
    ratingsPackageManifestPath: manifestPath,
    ratingsPackageManifestSha256: manifestSha256,
    planPath,
    rerunPlanPath,
    rerunPlanSha256: sha256Bytes(fs.readFileSync(rerunPlanPath)),
  };
}

export function buildTask2C2BaselineLocalStateFromSourceDir(sourceDir: string): Task2C2LocalState {
  return buildTask2C2LocalStateFromRatingsPackage(
    buildTask2C2RatingsPackage({
      sourceDir,
      packageVersion: TASK2C2_BASELINE_PACKAGE_VERSION,
    }),
  );
}
