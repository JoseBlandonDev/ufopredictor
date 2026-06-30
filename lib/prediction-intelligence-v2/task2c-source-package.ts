import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { DatabaseInsert, Json } from "../../types/database";
import { WORLD_CUP_2026_GROUPS } from "../world-cup-2026/canonical-groups";
import { WORLD_CUP_2026_TEAMS } from "../world-cup-2026/canonical-teams";

export const TASK2C_SCHEMA_NAME = "prediction-intelligence-v2-task2c-source-package";
export const TASK2C_SCHEMA_VERSION = "1.0.0";
export const TASK2C_MANIFEST_FILE = "task2c-manifest.json";
export const TASK2C_ALLOWED_QUALIFICATION_STATUSES = ["qualified", "eliminated"] as const;
export const TASK2C_ALLOWED_RANK_TIE_POLICIES = ["allow_ties", "forbid_ties"] as const;
export const TASK2C_DATASET_FILE_BY_ROLE = {
  ratings_elo: "ratings-elo.json",
  ratings_fifa: "ratings-fifa.json",
  world_cup_standings: "world-cup-standings.json",
} as const;
export const TASK2C_DATASET_KIND_BY_ROLE = {
  ratings_elo: "team_ratings_elo",
  ratings_fifa: "team_ratings_fifa",
  world_cup_standings: "team_tournament_standings",
} as const;

export type Task2CDatasetRole = keyof typeof TASK2C_DATASET_FILE_BY_ROLE;
export type Task2CDatasetKind = (typeof TASK2C_DATASET_KIND_BY_ROLE)[Task2CDatasetRole];
export type Task2CCoverageStatus = "complete" | "partial";
export type Task2CRankTiePolicy = (typeof TASK2C_ALLOWED_RANK_TIE_POLICIES)[number];
export type Task2CQualificationStatus = (typeof TASK2C_ALLOWED_QUALIFICATION_STATUSES)[number];
export type Task2CValidationSeverity = "error" | "warning";
export type Task2CValidationStatus = "verified" | "blocked";
export type Task2CFindingCode =
  | "package_directory_missing"
  | "manifest_missing"
  | "manifest_invalid_json"
  | "manifest_invalid_shape"
  | "manifest_generated_at_invalid"
  | "manifest_generated_at_future_skew"
  | "manifest_missing_file_entry"
  | "manifest_unexpected_file_entry"
  | "manifest_duplicate_role"
  | "manifest_duplicate_filename"
  | "manifest_missing_dataset_role"
  | "manifest_dataset_filename_mismatch"
  | "manifest_dataset_kind_mismatch"
  | "manifest_dataset_checksum_mismatch"
  | "manifest_dataset_size_mismatch"
  | "manifest_semantic_checksum_mismatch"
  | "manifest_duplicate_target_team"
  | "manifest_unknown_target_team"
  | "manifest_unsafe_filename"
  | "manifest_path_escape"
  | "dataset_missing"
  | "dataset_invalid_json"
  | "dataset_invalid_shape"
  | "dataset_disallowed_role"
  | "dataset_role_mismatch"
  | "dataset_kind_mismatch"
  | "dataset_source_key_mismatch"
  | "dataset_snapshot_missing"
  | "dataset_timestamp_invalid"
  | "dataset_timestamp_future_skew"
  | "dataset_timestamp_order_invalid"
  | "dataset_duplicate_team"
  | "dataset_unknown_team"
  | "dataset_coverage_mismatch"
  | "dataset_unexpected_team"
  | "dataset_missing_team"
  | "dataset_rank_invalid"
  | "dataset_rank_tie_forbidden"
  | "dataset_value_invalid"
  | "dataset_group_mismatch"
  | "dataset_duplicate_group_position"
  | "dataset_played_mismatch"
  | "dataset_goal_difference_mismatch"
  | "dataset_points_mismatch"
  | "dataset_qualification_status_invalid";

export type Task2CValidationFinding = {
  severity: Task2CValidationSeverity;
  code: Task2CFindingCode;
  fileRole: Task2CDatasetRole | "manifest" | "package";
  filename: string;
  path: string;
  message: string;
  rowIdentity?: string;
  expected?: string | number | boolean | null;
  actual?: string | number | boolean | null;
};

export type Task2CCoverage = {
  status: Task2CCoverageStatus;
  target_team_count: number;
  missing_team_keys: string[];
};

export type Task2CPackageFileEntry = {
  role: Task2CDatasetRole;
  file_name: string;
  dataset_kind: Task2CDatasetKind;
  sha256: string;
  size_bytes: number;
};

export type Task2CPackageDatasetEntry = {
  role: Task2CDatasetRole;
  file_name: string;
  dataset_kind: Task2CDatasetKind;
  source_key: string;
  snapshot_id: string;
  effective_at_utc: string;
  captured_at_utc: string;
  coverage: Task2CCoverage;
};

export type Task2CSourcePackageManifest = {
  schema_name: typeof TASK2C_SCHEMA_NAME;
  schema_version: typeof TASK2C_SCHEMA_VERSION;
  package_version: string;
  package_id: string;
  package_created_at_utc: string | null;
  cutoff_at_utc: string;
  competition_key: string;
  season_key: string;
  target_canonical_team_keys: string[];
  coverage: Task2CCoverage;
  semantic_package_sha256: string;
  package_files: Task2CPackageFileEntry[];
  datasets: Task2CPackageDatasetEntry[];
};

export type Task2CRatingRow = {
  canonical_team_key: string;
  rank: number;
  rating_or_points: number;
  reliability?: Json;
  missing_data?: Json;
  disagreement?: Json;
};

export type Task2CRatingDataset = {
  schema_name: string;
  schema_version: string;
  dataset_role: Extract<Task2CDatasetRole, "ratings_elo" | "ratings_fifa">;
  dataset_kind: Extract<Task2CDatasetKind, "team_ratings_elo" | "team_ratings_fifa">;
  source_key: "elo" | "fifa";
  snapshot_id: string;
  competition_key: string;
  season_key: string;
  effective_at_utc: string;
  captured_at_utc: string;
  cutoff_at_utc: string;
  rank_tie_policy: Task2CRankTiePolicy;
  coverage: Task2CCoverage;
  reliability: Json;
  missing_data: Json;
  disagreement: Json;
  teams: Task2CRatingRow[];
};

export type Task2CTournamentStandingRow = {
  canonical_team_key: string;
  group_key: string;
  position: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  source_reported_qualification_status: Task2CQualificationStatus | null;
  reliability?: Json;
  missing_data?: Json;
  disagreement?: Json;
};

export type Task2CWorldCupStandingsDataset = {
  schema_name: string;
  schema_version: string;
  dataset_role: "world_cup_standings";
  dataset_kind: "team_tournament_standings";
  source_key: string;
  snapshot_id: string;
  competition_key: string;
  season_key: string;
  stage_key: string;
  effective_at_utc: string;
  captured_at_utc: string;
  cutoff_at_utc: string;
  coverage: Task2CCoverage;
  reliability: Json;
  missing_data: Json;
  disagreement: Json;
  rows: Task2CTournamentStandingRow[];
};

export type Task2CValidationContext = {
  canonicalTeamKeys: readonly string[];
  canonicalGroupKeys: readonly string[];
  teamGroupByKey: Readonly<Record<string, string>>;
  teamKeysByGroup: Readonly<Record<string, readonly string[]>>;
  allowedDatasetRoles: readonly Task2CDatasetRole[];
  referenceTimeUtc: string;
  allowedClockSkewMs: number;
};

export type Task2CValidatedPackage = {
  manifest: Task2CSourcePackageManifest;
  datasets: {
    ratings_elo: Task2CRatingDataset;
    ratings_fifa: Task2CRatingDataset;
    world_cup_standings: Task2CWorldCupStandingsDataset;
  };
};

export type Task2CSourcePackageValidationResult = {
  status: Task2CValidationStatus;
  findings: Task2CValidationFinding[];
  validatedPackage: Task2CValidatedPackage | null;
};

export type Task2CTeamTournamentStandingSnapshotBuildArgs = {
  competitionId: string;
  seasonId: string;
};

type JsonRecord = Record<string, Json>;
type StrictRecord = Record<string, unknown>;

const MANIFEST_REQUIRED_KEYS = [
  "schema_name",
  "schema_version",
  "package_version",
  "package_id",
  "package_created_at_utc",
  "cutoff_at_utc",
  "competition_key",
  "season_key",
  "target_canonical_team_keys",
  "coverage",
  "semantic_package_sha256",
  "package_files",
  "datasets",
] as const;
const COVERAGE_REQUIRED_KEYS = ["status", "target_team_count", "missing_team_keys"] as const;
const PACKAGE_FILE_REQUIRED_KEYS = ["role", "file_name", "dataset_kind", "sha256", "size_bytes"] as const;
const PACKAGE_DATASET_REQUIRED_KEYS = [
  "role",
  "file_name",
  "dataset_kind",
  "source_key",
  "snapshot_id",
  "effective_at_utc",
  "captured_at_utc",
  "coverage",
] as const;
const RATING_DATASET_REQUIRED_KEYS = [
  "schema_name",
  "schema_version",
  "dataset_role",
  "dataset_kind",
  "source_key",
  "snapshot_id",
  "competition_key",
  "season_key",
  "effective_at_utc",
  "captured_at_utc",
  "cutoff_at_utc",
  "rank_tie_policy",
  "coverage",
  "reliability",
  "missing_data",
  "disagreement",
  "teams",
] as const;
const RATING_ROW_REQUIRED_KEYS = ["canonical_team_key", "rank", "rating_or_points"] as const;
const STANDINGS_DATASET_REQUIRED_KEYS = [
  "schema_name",
  "schema_version",
  "dataset_role",
  "dataset_kind",
  "source_key",
  "snapshot_id",
  "competition_key",
  "season_key",
  "stage_key",
  "effective_at_utc",
  "captured_at_utc",
  "cutoff_at_utc",
  "coverage",
  "reliability",
  "missing_data",
  "disagreement",
  "rows",
] as const;
const STANDINGS_ROW_REQUIRED_KEYS = [
  "canonical_team_key",
  "group_key",
  "position",
  "matches_played",
  "wins",
  "draws",
  "losses",
  "goals_for",
  "goals_against",
  "goal_difference",
  "points",
  "source_reported_qualification_status",
] as const;
const STANDINGS_DERIVED_FIELD_NAMES = new Set([
  "pressure_state",
  "recent_form",
  "opponent_quality",
  "remaining_matches",
  "candidate_ready",
  "signal_payload",
  "scenario_data",
]);

function stableValue(value: unknown): Json {
  if (Array.isArray(value)) {
    return value.map((entry) => stableValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<JsonRecord>((accumulator, key) => {
        const normalizedValue = stableValue((value as Record<string, unknown>)[key]);
        if (normalizedValue !== undefined) {
          accumulator[key] = normalizedValue;
        }
        return accumulator;
      }, {});
  }

  if (typeof value === "bigint") {
    return String(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return String(value);
    }
    return value;
  }

  if (typeof value === "string" || typeof value === "boolean" || value === null) {
    return value;
  }

  if (value === undefined) {
    return null;
  }

  return String(value);
}

function stableStringify(value: unknown) {
  return JSON.stringify(stableValue(value));
}

function sha256Json(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function sha256Bytes(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function isRecord(value: unknown): value is StrictRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function compareFinding(a: Task2CValidationFinding, b: Task2CValidationFinding) {
  const severityOrder: Record<Task2CValidationSeverity, number> = { error: 0, warning: 1 };
  return (
    severityOrder[a.severity] - severityOrder[b.severity] ||
    a.code.localeCompare(b.code) ||
    a.fileRole.localeCompare(b.fileRole) ||
    a.filename.localeCompare(b.filename) ||
    a.path.localeCompare(b.path) ||
    (a.rowIdentity ?? "").localeCompare(b.rowIdentity ?? "") ||
    a.message.localeCompare(b.message)
  );
}

function pushFinding(
  findings: Task2CValidationFinding[],
  finding: Omit<Task2CValidationFinding, "severity"> & { severity?: Task2CValidationSeverity },
) {
  findings.push({
    severity: finding.severity ?? "error",
    ...finding,
  });
}

function hasExplicitUtcOffset(value: string) {
  return /(Z|[+-]\d{2}:\d{2})$/.test(value);
}

function normalizeInstant(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0 || !hasExplicitUtcOffset(value)) {
    return null;
  }
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    return null;
  }
  return instant.toISOString();
}

function relativeJsonPath(fileName: string, suffix?: string) {
  return suffix ? `${fileName}#/${suffix}` : fileName;
}

function directoryExists(directoryPath: string) {
  try {
    return fs.statSync(directoryPath).isDirectory();
  } catch {
    return false;
  }
}

function readJsonFile(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
}

function validateExactKeys(
  value: StrictRecord,
  requiredKeys: readonly string[],
  allowedOptionalKeys: readonly string[],
) {
  const expectedKeys = new Set([...requiredKeys, ...allowedOptionalKeys]);
  const missingKeys = requiredKeys.filter((key) => !(key in value));
  const unexpectedKeys = Object.keys(value).filter((key) => !expectedKeys.has(key));
  return { missingKeys, unexpectedKeys };
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }
  const normalized = value.map((entry) => (typeof entry === "string" ? entry : null));
  if (normalized.some((entry) => entry === null)) {
    return null;
  }
  return normalized as string[];
}

function normalizeCoverage(
  coverageUnknown: unknown,
  fileRole: Task2CValidationFinding["fileRole"],
  filename: string,
  pathLabel: string,
  findings: Task2CValidationFinding[],
): Task2CCoverage | null {
  if (!isRecord(coverageUnknown)) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole,
      filename,
      path: pathLabel,
      message: "Coverage must be a JSON object.",
    });
    return null;
  }

  const { missingKeys, unexpectedKeys } = validateExactKeys(coverageUnknown, COVERAGE_REQUIRED_KEYS, []);
  for (const key of missingKeys) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole,
      filename,
      path: `${pathLabel}/${key}`,
      message: `Coverage is missing required field ${key}.`,
    });
  }
  for (const key of unexpectedKeys) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole,
      filename,
      path: `${pathLabel}/${key}`,
      message: `Coverage contains unexpected field ${key}.`,
    });
  }

  const missingTeamKeys = normalizeStringArray(coverageUnknown.missing_team_keys);
  if (
    (coverageUnknown.status !== "complete" && coverageUnknown.status !== "partial") ||
    typeof coverageUnknown.target_team_count !== "number" ||
    !Number.isInteger(coverageUnknown.target_team_count) ||
    coverageUnknown.target_team_count < 0 ||
    missingTeamKeys === null
  ) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole,
      filename,
      path: pathLabel,
      message: "Coverage must include a valid status, non-negative target_team_count, and string missing_team_keys array.",
    });
    return null;
  }

  return {
    status: coverageUnknown.status,
    target_team_count: coverageUnknown.target_team_count,
    missing_team_keys: [...missingTeamKeys].sort(),
  };
}

function validatePackageRootBasename(
  fileName: string,
  fileRole: Task2CValidationFinding["fileRole"],
  findings: Task2CValidationFinding[],
  pathLabel: string,
) {
  const unsafe =
    fileName !== path.basename(fileName) ||
    path.posix.isAbsolute(fileName) ||
    path.win32.isAbsolute(fileName) ||
    fileName.includes("/") ||
    fileName.includes("\\") ||
    fileName === "." ||
    fileName === ".." ||
    fileName.includes("..") ||
    fileName.trim().length === 0;

  if (unsafe) {
    pushFinding(findings, {
      code: "manifest_unsafe_filename",
      fileRole,
      filename: fileName,
      path: pathLabel,
      message: `Filename ${fileName} must be a package-root basename without separators or traversal segments.`,
    });
    return false;
  }

  return true;
}

function resolvePackageFilePath(
  packageDir: string,
  fileName: string,
  fileRole: Task2CValidationFinding["fileRole"],
  findings: Task2CValidationFinding[],
  pathLabel: string,
) {
  const packageRoot = fs.realpathSync(packageDir);
  const candidatePath = path.join(packageRoot, fileName);
  const resolvedCandidatePath = path.resolve(candidatePath);
  const packageRootPrefix = `${packageRoot}${path.sep}`;
  if (!(resolvedCandidatePath === packageRoot || resolvedCandidatePath.startsWith(packageRootPrefix))) {
    pushFinding(findings, {
      code: "manifest_path_escape",
      fileRole,
      filename: fileName,
      path: pathLabel,
      message: `Filename ${fileName} resolves outside the package root.`,
    });
    return null;
  }

  if (!fs.existsSync(candidatePath)) {
    return candidatePath;
  }

  const realPath = fs.realpathSync(candidatePath);
  if (!(realPath === packageRoot || realPath.startsWith(packageRootPrefix))) {
    pushFinding(findings, {
      code: "manifest_path_escape",
      fileRole,
      filename: fileName,
      path: pathLabel,
      message: `Filename ${fileName} resolves outside the package root after symlink resolution.`,
    });
    return null;
  }

  return realPath;
}

function canonicalizeCoverage(coverage: Task2CCoverage) {
  return {
    status: coverage.status,
    target_team_count: coverage.target_team_count,
    missing_team_keys: [...coverage.missing_team_keys].sort(),
  };
}

function canonicalizeRatingRows(rows: Task2CRatingRow[]) {
  return [...rows]
    .map((row) => ({
      canonical_team_key: row.canonical_team_key,
      rank: row.rank,
      rating_or_points: row.rating_or_points,
      reliability: stableValue(row.reliability ?? {}),
      missing_data: stableValue(row.missing_data ?? {}),
      disagreement: stableValue(row.disagreement ?? {}),
    }))
    .sort((a, b) => a.canonical_team_key.localeCompare(b.canonical_team_key));
}

function canonicalizeStandingsRows(rows: Task2CTournamentStandingRow[]) {
  return [...rows]
    .map((row) => ({
      canonical_team_key: row.canonical_team_key,
      group_key: row.group_key,
      position: row.position,
      matches_played: row.matches_played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goals_for: row.goals_for,
      goals_against: row.goals_against,
      goal_difference: row.goal_difference,
      points: row.points,
      source_reported_qualification_status: row.source_reported_qualification_status,
      reliability: stableValue(row.reliability ?? {}),
      missing_data: stableValue(row.missing_data ?? {}),
      disagreement: stableValue(row.disagreement ?? {}),
    }))
    .sort(
      (a, b) =>
        a.group_key.localeCompare(b.group_key) ||
        a.position - b.position ||
        a.canonical_team_key.localeCompare(b.canonical_team_key),
    );
}

function buildDatasetSemanticProjection(dataset: Task2CRatingDataset | Task2CWorldCupStandingsDataset) {
  if (dataset.dataset_role === "world_cup_standings") {
    return {
      schema_name: dataset.schema_name,
      schema_version: dataset.schema_version,
      dataset_role: dataset.dataset_role,
      dataset_kind: dataset.dataset_kind,
      source_key: dataset.source_key,
      snapshot_id: dataset.snapshot_id,
      competition_key: dataset.competition_key,
      season_key: dataset.season_key,
      stage_key: dataset.stage_key,
      effective_at_utc: normalizeInstant(dataset.effective_at_utc),
      captured_at_utc: normalizeInstant(dataset.captured_at_utc),
      cutoff_at_utc: normalizeInstant(dataset.cutoff_at_utc),
      coverage: canonicalizeCoverage(dataset.coverage),
      reliability: stableValue(dataset.reliability),
      missing_data: stableValue(dataset.missing_data),
      disagreement: stableValue(dataset.disagreement),
      rows: canonicalizeStandingsRows(dataset.rows),
    };
  }

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
    coverage: canonicalizeCoverage(dataset.coverage),
    reliability: stableValue(dataset.reliability),
    missing_data: stableValue(dataset.missing_data),
    disagreement: stableValue(dataset.disagreement),
    teams: canonicalizeRatingRows(dataset.teams),
  };
}

type SemanticChecksumProjection = {
  schema_version: string;
  package_id: string;
  cutoff_at_utc: string | null;
  package_created_at_utc: string | null;
  competition_key: string;
  season_key: string;
  target_canonical_team_keys: string[];
  coverage: ReturnType<typeof canonicalizeCoverage>;
  datasets: Array<{
    role: Task2CDatasetRole;
    dataset_kind: Task2CDatasetKind;
    file_name: string;
    file_sha256: string;
    source_key: string;
    effective_at_utc: string | null;
    captured_at_utc: string | null;
    semantic_dataset_sha256: string;
    coverage: ReturnType<typeof canonicalizeCoverage>;
  }>;
};

// This projection intentionally binds only the semantically meaningful Task 2C package
// contract. It excludes the stored checksum field itself and recomputes dataset semantics
// from normalized parsed JSON so unordered rows and object-key ordering do not affect it.
function buildSemanticChecksumProjection(args: {
  manifest: Task2CSourcePackageManifest;
  validatedDatasets: Partial<Record<Task2CDatasetRole, Task2CRatingDataset | Task2CWorldCupStandingsDataset>>;
  fileShaByRole: ReadonlyMap<Task2CDatasetRole, string>;
}): SemanticChecksumProjection {
  return {
    schema_version: args.manifest.schema_version,
    package_id: args.manifest.package_id,
    cutoff_at_utc: normalizeInstant(args.manifest.cutoff_at_utc),
    package_created_at_utc:
      args.manifest.package_created_at_utc == null ? null : normalizeInstant(args.manifest.package_created_at_utc),
    competition_key: args.manifest.competition_key,
    season_key: args.manifest.season_key,
    target_canonical_team_keys: [...args.manifest.target_canonical_team_keys].sort(),
    coverage: canonicalizeCoverage(args.manifest.coverage),
    datasets: [...args.manifest.datasets]
      .map((entry) => {
        const validatedDataset = args.validatedDatasets[entry.role];
        return {
          role: entry.role,
          dataset_kind: entry.dataset_kind,
          file_name: entry.file_name,
          file_sha256: args.fileShaByRole.get(entry.role) ?? entry.role,
          source_key: entry.source_key,
          effective_at_utc: normalizeInstant(entry.effective_at_utc),
          captured_at_utc: normalizeInstant(entry.captured_at_utc),
          semantic_dataset_sha256:
            validatedDataset == null ? "missing" : sha256Json(buildDatasetSemanticProjection(validatedDataset)),
          coverage: canonicalizeCoverage(entry.coverage),
        };
      })
      .sort((a, b) => a.role.localeCompare(b.role) || a.file_name.localeCompare(b.file_name)),
  };
}

function normalizeManifest(
  manifestUnknown: unknown,
  findings: Task2CValidationFinding[],
): Task2CSourcePackageManifest | null {
  if (!isRecord(manifestUnknown)) {
    pushFinding(findings, {
      code: "manifest_invalid_shape",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: TASK2C_MANIFEST_FILE,
      message: "Manifest root must be a JSON object.",
    });
    return null;
  }

  const { missingKeys, unexpectedKeys } = validateExactKeys(manifestUnknown, MANIFEST_REQUIRED_KEYS, []);
  for (const key of missingKeys) {
    pushFinding(findings, {
      code: "manifest_invalid_shape",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/${key}`,
      message: `Manifest is missing required field ${key}.`,
    });
  }
  for (const key of unexpectedKeys) {
    pushFinding(findings, {
      code: "manifest_invalid_shape",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/${key}`,
      message: `Manifest contains unexpected field ${key}.`,
    });
  }

  if (
    manifestUnknown.schema_name !== TASK2C_SCHEMA_NAME ||
    manifestUnknown.schema_version !== TASK2C_SCHEMA_VERSION ||
    typeof manifestUnknown.package_version !== "string" ||
    typeof manifestUnknown.package_id !== "string" ||
    (manifestUnknown.package_created_at_utc !== null && typeof manifestUnknown.package_created_at_utc !== "string") ||
    typeof manifestUnknown.cutoff_at_utc !== "string" ||
    typeof manifestUnknown.competition_key !== "string" ||
    typeof manifestUnknown.season_key !== "string" ||
    !Array.isArray(manifestUnknown.target_canonical_team_keys) ||
    typeof manifestUnknown.semantic_package_sha256 !== "string" ||
    !Array.isArray(manifestUnknown.package_files) ||
    !Array.isArray(manifestUnknown.datasets)
  ) {
    pushFinding(findings, {
      code: "manifest_invalid_shape",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: TASK2C_MANIFEST_FILE,
      message: "Manifest contains invalid Task 2C package field types.",
    });
    return null;
  }

  const coverage = normalizeCoverage(manifestUnknown.coverage, "manifest", TASK2C_MANIFEST_FILE, `${TASK2C_MANIFEST_FILE}#/coverage`, findings);
  if (coverage === null) {
    return null;
  }

  const targetCanonicalTeamKeys = normalizeStringArray(manifestUnknown.target_canonical_team_keys);
  if (targetCanonicalTeamKeys === null) {
    pushFinding(findings, {
      code: "manifest_invalid_shape",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/target_canonical_team_keys`,
      message: "Manifest target_canonical_team_keys must be a string array.",
    });
    return null;
  }

  const packageFiles: Task2CPackageFileEntry[] = [];
  for (const [index, entryUnknown] of manifestUnknown.package_files.entries()) {
    const entryPath = `${TASK2C_MANIFEST_FILE}#/package_files/${index}`;
    if (!isRecord(entryUnknown)) {
      pushFinding(findings, {
        code: "manifest_invalid_shape",
        fileRole: "manifest",
        filename: TASK2C_MANIFEST_FILE,
        path: entryPath,
        message: "Manifest package_files entries must be objects.",
      });
      continue;
    }
    const { missingKeys: missingFileKeys, unexpectedKeys: unexpectedFileKeys } = validateExactKeys(
      entryUnknown,
      PACKAGE_FILE_REQUIRED_KEYS,
      [],
    );
    for (const key of missingFileKeys) {
      pushFinding(findings, {
        code: "manifest_invalid_shape",
        fileRole: "manifest",
        filename: TASK2C_MANIFEST_FILE,
        path: `${entryPath}/${key}`,
        message: `Manifest package_files entry is missing required field ${key}.`,
      });
    }
    for (const key of unexpectedFileKeys) {
      pushFinding(findings, {
        code: "manifest_invalid_shape",
        fileRole: "manifest",
        filename: TASK2C_MANIFEST_FILE,
        path: `${entryPath}/${key}`,
        message: `Manifest package_files entry contains unexpected field ${key}.`,
      });
    }
    if (
      typeof entryUnknown.role !== "string" ||
      typeof entryUnknown.file_name !== "string" ||
      typeof entryUnknown.dataset_kind !== "string" ||
      typeof entryUnknown.sha256 !== "string" ||
      typeof entryUnknown.size_bytes !== "number"
    ) {
      continue;
    }
    packageFiles.push({
      role: entryUnknown.role as Task2CDatasetRole,
      file_name: entryUnknown.file_name,
      dataset_kind: entryUnknown.dataset_kind as Task2CDatasetKind,
      sha256: entryUnknown.sha256,
      size_bytes: entryUnknown.size_bytes,
    });
  }

  const datasets: Task2CPackageDatasetEntry[] = [];
  for (const [index, entryUnknown] of manifestUnknown.datasets.entries()) {
    const entryPath = `${TASK2C_MANIFEST_FILE}#/datasets/${index}`;
    if (!isRecord(entryUnknown)) {
      pushFinding(findings, {
        code: "manifest_invalid_shape",
        fileRole: "manifest",
        filename: TASK2C_MANIFEST_FILE,
        path: entryPath,
        message: "Manifest datasets entries must be objects.",
      });
      continue;
    }
    const { missingKeys: missingDatasetKeys, unexpectedKeys: unexpectedDatasetKeys } = validateExactKeys(
      entryUnknown,
      PACKAGE_DATASET_REQUIRED_KEYS,
      [],
    );
    for (const key of missingDatasetKeys) {
      pushFinding(findings, {
        code: "manifest_invalid_shape",
        fileRole: "manifest",
        filename: TASK2C_MANIFEST_FILE,
        path: `${entryPath}/${key}`,
        message: `Manifest datasets entry is missing required field ${key}.`,
      });
    }
    for (const key of unexpectedDatasetKeys) {
      pushFinding(findings, {
        code: "manifest_invalid_shape",
        fileRole: "manifest",
        filename: TASK2C_MANIFEST_FILE,
        path: `${entryPath}/${key}`,
        message: `Manifest datasets entry contains unexpected field ${key}.`,
      });
    }
    if (
      typeof entryUnknown.role !== "string" ||
      typeof entryUnknown.file_name !== "string" ||
      typeof entryUnknown.dataset_kind !== "string" ||
      typeof entryUnknown.source_key !== "string" ||
      typeof entryUnknown.snapshot_id !== "string" ||
      typeof entryUnknown.effective_at_utc !== "string" ||
      typeof entryUnknown.captured_at_utc !== "string"
    ) {
      continue;
    }
    const entryCoverage = normalizeCoverage(
      entryUnknown.coverage,
      entryUnknown.role as Task2CDatasetRole,
      entryUnknown.file_name,
      `${entryPath}/coverage`,
      findings,
    );
    if (entryCoverage === null) {
      continue;
    }
    datasets.push({
      role: entryUnknown.role as Task2CDatasetRole,
      file_name: entryUnknown.file_name,
      dataset_kind: entryUnknown.dataset_kind as Task2CDatasetKind,
      source_key: entryUnknown.source_key,
      snapshot_id: entryUnknown.snapshot_id,
      effective_at_utc: entryUnknown.effective_at_utc,
      captured_at_utc: entryUnknown.captured_at_utc,
      coverage: entryCoverage,
    });
  }

  return {
    schema_name: TASK2C_SCHEMA_NAME,
    schema_version: TASK2C_SCHEMA_VERSION,
    package_version: manifestUnknown.package_version,
    package_id: manifestUnknown.package_id,
    package_created_at_utc: manifestUnknown.package_created_at_utc,
    cutoff_at_utc: manifestUnknown.cutoff_at_utc,
    competition_key: manifestUnknown.competition_key,
    season_key: manifestUnknown.season_key,
    target_canonical_team_keys: [...targetCanonicalTeamKeys],
    coverage,
    semantic_package_sha256: manifestUnknown.semantic_package_sha256,
    package_files: packageFiles,
    datasets,
  };
}

function validateManifest(
  manifest: Task2CSourcePackageManifest,
  packageDir: string,
  context: Task2CValidationContext,
  findings: Task2CValidationFinding[],
) {
  const referenceInstant = normalizeInstant(context.referenceTimeUtc);
  const packageCreatedAt = manifest.package_created_at_utc == null ? null : normalizeInstant(manifest.package_created_at_utc);
  const cutoffAt = normalizeInstant(manifest.cutoff_at_utc);

  if (referenceInstant === null) {
    pushFinding(findings, {
      code: "dataset_timestamp_invalid",
      fileRole: "package",
      filename: TASK2C_MANIFEST_FILE,
      path: "validation_context/referenceTimeUtc",
      message: "Validation context referenceTimeUtc must be a valid RFC3339 instant with an explicit UTC offset.",
    });
  }
  if (manifest.package_created_at_utc !== null && packageCreatedAt === null) {
    pushFinding(findings, {
      code: "manifest_generated_at_invalid",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/package_created_at_utc`,
      message: "Manifest package_created_at_utc must be a valid RFC3339 instant with an explicit UTC offset when present.",
    });
  }
  if (cutoffAt === null) {
    pushFinding(findings, {
      code: "dataset_timestamp_invalid",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/cutoff_at_utc`,
      message: "Manifest cutoff_at_utc must be a valid RFC3339 instant with an explicit UTC offset.",
    });
  }
  if (referenceInstant !== null && packageCreatedAt !== null && new Date(packageCreatedAt).getTime() - new Date(referenceInstant).getTime() > context.allowedClockSkewMs) {
    pushFinding(findings, {
      code: "manifest_generated_at_future_skew",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/package_created_at_utc`,
      message: `Manifest package_created_at_utc exceeds the allowed future skew of ${context.allowedClockSkewMs}ms.`,
    });
  }
  if (packageCreatedAt !== null && cutoffAt !== null && new Date(cutoffAt).getTime() > new Date(packageCreatedAt).getTime()) {
    pushFinding(findings, {
      code: "dataset_timestamp_order_invalid",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/cutoff_at_utc`,
      message: "Manifest cutoff_at_utc must not be later than package_created_at_utc.",
    });
  }

  const duplicateTargetTeams = manifest.target_canonical_team_keys.filter(
    (teamKey, index, all) => all.indexOf(teamKey) !== index,
  );
  for (const teamKey of [...new Set(duplicateTargetTeams)].sort()) {
    pushFinding(findings, {
      code: "manifest_duplicate_target_team",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/target_canonical_team_keys`,
      message: `Manifest target team scope contains duplicate ${teamKey}.`,
      actual: teamKey,
    });
  }
  for (const teamKey of [...manifest.target_canonical_team_keys].sort()) {
    if (!context.canonicalTeamKeys.includes(teamKey)) {
      pushFinding(findings, {
        code: "manifest_unknown_target_team",
        fileRole: "manifest",
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/target_canonical_team_keys`,
        message: `Manifest target team scope contains unknown canonical team ${teamKey}.`,
        actual: teamKey,
      });
    }
  }

  if (manifest.coverage.target_team_count !== manifest.target_canonical_team_keys.length) {
    pushFinding(findings, {
      code: "dataset_coverage_mismatch",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/coverage/target_team_count`,
      message: "Manifest coverage target_team_count must equal target_canonical_team_keys length.",
      expected: manifest.target_canonical_team_keys.length,
      actual: manifest.coverage.target_team_count,
    });
  }
  if (manifest.coverage.status === "complete" && manifest.coverage.missing_team_keys.length > 0) {
    pushFinding(findings, {
      code: "dataset_coverage_mismatch",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/coverage/missing_team_keys`,
      message: "Manifest coverage cannot be complete when missing_team_keys is non-empty.",
    });
  }

  const expectedRoles = [...context.allowedDatasetRoles].sort();
  const datasetRoles = manifest.datasets.map((entry) => entry.role);
  for (const role of expectedRoles) {
    if (!datasetRoles.includes(role)) {
      pushFinding(findings, {
        code: "manifest_missing_dataset_role",
        fileRole: "manifest",
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/datasets`,
        message: `Manifest is missing required dataset role ${role}.`,
      });
    }
    if (!manifest.package_files.some((entry) => entry.role === role)) {
      pushFinding(findings, {
        code: "manifest_missing_file_entry",
        fileRole: "manifest",
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/package_files`,
        message: `Manifest is missing required package_files entry for role ${role}.`,
      });
    }
  }

  const duplicateRoles = datasetRoles.filter((role, index) => datasetRoles.indexOf(role) !== index);
  for (const role of [...new Set(duplicateRoles)].sort()) {
    pushFinding(findings, {
      code: "manifest_duplicate_role",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/datasets`,
      message: `Manifest contains duplicate dataset role ${role}.`,
    });
  }

  const duplicateFileNames = manifest.package_files
    .map((entry) => entry.file_name)
    .filter((fileName, index, all) => all.indexOf(fileName) !== index);
  for (const fileName of [...new Set(duplicateFileNames)].sort()) {
    pushFinding(findings, {
      code: "manifest_duplicate_filename",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: `${TASK2C_MANIFEST_FILE}#/package_files`,
      message: `Manifest contains duplicate filename ${fileName}.`,
    });
  }

  const fileEntryByRole = new Map<Task2CDatasetRole, Task2CPackageFileEntry>();
  for (const entry of manifest.package_files) {
    validatePackageRootBasename(entry.file_name, "manifest", findings, `${TASK2C_MANIFEST_FILE}#/package_files/${entry.role}`);
    if (!context.allowedDatasetRoles.includes(entry.role)) {
      pushFinding(findings, {
        code: "manifest_unexpected_file_entry",
        fileRole: "manifest",
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/package_files/${entry.role}`,
        message: `Manifest package_files includes disallowed role ${entry.role}.`,
      });
      continue;
    }
    const expectedFileName = TASK2C_DATASET_FILE_BY_ROLE[entry.role];
    const expectedDatasetKind = TASK2C_DATASET_KIND_BY_ROLE[entry.role];
    if (entry.file_name !== expectedFileName) {
      pushFinding(findings, {
        code: "manifest_dataset_filename_mismatch",
        fileRole: entry.role,
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/package_files/${entry.role}/file_name`,
        message: `Role ${entry.role} must use filename ${expectedFileName}.`,
        expected: expectedFileName,
        actual: entry.file_name,
      });
    }
    if (entry.dataset_kind !== expectedDatasetKind) {
      pushFinding(findings, {
        code: "manifest_dataset_kind_mismatch",
        fileRole: entry.role,
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/package_files/${entry.role}/dataset_kind`,
        message: `Role ${entry.role} must use dataset kind ${expectedDatasetKind}.`,
        expected: expectedDatasetKind,
        actual: entry.dataset_kind,
      });
    }
    fileEntryByRole.set(entry.role, entry);
  }

  for (const datasetEntry of manifest.datasets) {
    validatePackageRootBasename(datasetEntry.file_name, datasetEntry.role, findings, `${TASK2C_MANIFEST_FILE}#/datasets/${datasetEntry.role}`);
    const expectedDatasetKind = TASK2C_DATASET_KIND_BY_ROLE[datasetEntry.role];
    const expectedFileName = TASK2C_DATASET_FILE_BY_ROLE[datasetEntry.role];
    if (!context.allowedDatasetRoles.includes(datasetEntry.role)) {
      pushFinding(findings, {
        code: "dataset_disallowed_role",
        fileRole: datasetEntry.role,
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/datasets/${datasetEntry.role}/role`,
        message: `Manifest dataset entry includes disallowed role ${datasetEntry.role}.`,
      });
    }
    if (datasetEntry.dataset_kind !== expectedDatasetKind) {
      pushFinding(findings, {
        code: "manifest_dataset_kind_mismatch",
        fileRole: datasetEntry.role,
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/datasets/${datasetEntry.role}/dataset_kind`,
        message: `Manifest dataset role ${datasetEntry.role} must use dataset kind ${expectedDatasetKind}.`,
        expected: expectedDatasetKind,
        actual: datasetEntry.dataset_kind,
      });
    }
    if (datasetEntry.file_name !== expectedFileName) {
      pushFinding(findings, {
        code: "manifest_dataset_filename_mismatch",
        fileRole: datasetEntry.role,
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/datasets/${datasetEntry.role}/file_name`,
        message: `Manifest dataset role ${datasetEntry.role} must use filename ${expectedFileName}.`,
        expected: expectedFileName,
        actual: datasetEntry.file_name,
      });
    }
    const matchingFileEntry = fileEntryByRole.get(datasetEntry.role);
    if (matchingFileEntry && matchingFileEntry.file_name !== datasetEntry.file_name) {
      pushFinding(findings, {
        code: "manifest_dataset_filename_mismatch",
        fileRole: datasetEntry.role,
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/datasets/${datasetEntry.role}/file_name`,
        message: `Manifest datasets and package_files must agree on the filename for role ${datasetEntry.role}.`,
        expected: matchingFileEntry.file_name,
        actual: datasetEntry.file_name,
      });
    }
    if (matchingFileEntry && matchingFileEntry.dataset_kind !== datasetEntry.dataset_kind) {
      pushFinding(findings, {
        code: "manifest_dataset_kind_mismatch",
        fileRole: datasetEntry.role,
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/datasets/${datasetEntry.role}/dataset_kind`,
        message: `Manifest datasets and package_files must agree on the dataset kind for role ${datasetEntry.role}.`,
        expected: matchingFileEntry.dataset_kind,
        actual: datasetEntry.dataset_kind,
      });
    }

    const effectiveAt = normalizeInstant(datasetEntry.effective_at_utc);
    const capturedAt = normalizeInstant(datasetEntry.captured_at_utc);
    if (effectiveAt === null) {
      pushFinding(findings, {
        code: "dataset_timestamp_invalid",
        fileRole: datasetEntry.role,
        filename: datasetEntry.file_name,
        path: relativeJsonPath(datasetEntry.file_name, "effective_at_utc"),
        message: "Manifest dataset effective_at_utc must be valid RFC3339 with explicit UTC offset.",
      });
    }
    if (capturedAt === null) {
      pushFinding(findings, {
        code: "dataset_timestamp_invalid",
        fileRole: datasetEntry.role,
        filename: datasetEntry.file_name,
        path: relativeJsonPath(datasetEntry.file_name, "captured_at_utc"),
        message: "Manifest dataset captured_at_utc must be valid RFC3339 with explicit UTC offset.",
      });
    }
    if (effectiveAt !== null && capturedAt !== null && new Date(effectiveAt).getTime() > new Date(capturedAt).getTime()) {
      pushFinding(findings, {
        code: "dataset_timestamp_order_invalid",
        fileRole: datasetEntry.role,
        filename: datasetEntry.file_name,
        path: relativeJsonPath(datasetEntry.file_name),
        message: "Manifest dataset effective_at_utc must not be later than captured_at_utc.",
      });
    }
    if (capturedAt !== null && cutoffAt !== null && new Date(capturedAt).getTime() > new Date(cutoffAt).getTime()) {
      pushFinding(findings, {
        code: "dataset_timestamp_order_invalid",
        fileRole: datasetEntry.role,
        filename: datasetEntry.file_name,
        path: relativeJsonPath(datasetEntry.file_name),
        message: "Manifest dataset captured_at_utc must not be later than manifest cutoff_at_utc.",
      });
    }
    if (referenceInstant !== null && capturedAt !== null && new Date(capturedAt).getTime() - new Date(referenceInstant).getTime() > context.allowedClockSkewMs) {
      pushFinding(findings, {
        code: "dataset_timestamp_future_skew",
        fileRole: datasetEntry.role,
        filename: datasetEntry.file_name,
        path: relativeJsonPath(datasetEntry.file_name, "captured_at_utc"),
        message: `Manifest dataset captured_at_utc exceeds the allowed future skew of ${context.allowedClockSkewMs}ms.`,
      });
    }
  }

  for (const entry of manifest.package_files) {
    const candidatePath = resolvePackageFilePath(packageDir, entry.file_name, entry.role, findings, `${TASK2C_MANIFEST_FILE}#/package_files/${entry.role}/file_name`);
    if (candidatePath === null) {
      continue;
    }
    if (!fs.existsSync(candidatePath) || !fs.statSync(candidatePath).isFile()) {
      pushFinding(findings, {
        code: "dataset_missing",
        fileRole: entry.role,
        filename: entry.file_name,
        path: entry.file_name,
        message: `Expected dataset file ${entry.file_name} is missing.`,
      });
    }
  }
}

function validateDatasetTimestamps(args: {
  fileRole: Task2CDatasetRole;
  fileName: string;
  effectiveAtUtc: string;
  capturedAtUtc: string;
  cutoffAtUtc: string;
  packageCreatedAtUtc: string | null;
  context: Task2CValidationContext;
  findings: Task2CValidationFinding[];
}) {
  const effectiveAt = normalizeInstant(args.effectiveAtUtc);
  const capturedAt = normalizeInstant(args.capturedAtUtc);
  const cutoffAt = normalizeInstant(args.cutoffAtUtc);
  const packageCreatedAt = args.packageCreatedAtUtc == null ? null : normalizeInstant(args.packageCreatedAtUtc);
  const referenceInstant = normalizeInstant(args.context.referenceTimeUtc);

  if (effectiveAt === null) {
    pushFinding(args.findings, {
      code: "dataset_timestamp_invalid",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "effective_at_utc"),
      message: "effective_at_utc must be valid RFC3339 with explicit UTC offset.",
    });
  }
  if (capturedAt === null) {
    pushFinding(args.findings, {
      code: "dataset_timestamp_invalid",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "captured_at_utc"),
      message: "captured_at_utc must be valid RFC3339 with explicit UTC offset.",
    });
  }
  if (cutoffAt === null) {
    pushFinding(args.findings, {
      code: "dataset_timestamp_invalid",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "cutoff_at_utc"),
      message: "cutoff_at_utc must be valid RFC3339 with explicit UTC offset.",
    });
  }
  if (referenceInstant === null || effectiveAt === null || capturedAt === null || cutoffAt === null) {
    return;
  }

  const referenceMs = new Date(referenceInstant).getTime();
  const effectiveMs = new Date(effectiveAt).getTime();
  const capturedMs = new Date(capturedAt).getTime();
  const cutoffMs = new Date(cutoffAt).getTime();

  if (effectiveMs > capturedMs) {
    pushFinding(args.findings, {
      code: "dataset_timestamp_order_invalid",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName),
      message: "effective_at_utc must not be later than captured_at_utc.",
    });
  }
  if (capturedMs > cutoffMs) {
    pushFinding(args.findings, {
      code: "dataset_timestamp_order_invalid",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName),
      message: "captured_at_utc must not be later than cutoff_at_utc.",
    });
  }
  if (packageCreatedAt !== null && cutoffMs > new Date(packageCreatedAt).getTime()) {
    pushFinding(args.findings, {
      code: "dataset_timestamp_order_invalid",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName),
      message: "cutoff_at_utc must not be later than package_created_at_utc.",
    });
  }
  if (effectiveMs - referenceMs > args.context.allowedClockSkewMs) {
    pushFinding(args.findings, {
      code: "dataset_timestamp_future_skew",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "effective_at_utc"),
      message: `effective_at_utc exceeds the allowed future skew of ${args.context.allowedClockSkewMs}ms.`,
    });
  }
  if (capturedMs - referenceMs > args.context.allowedClockSkewMs) {
    pushFinding(args.findings, {
      code: "dataset_timestamp_future_skew",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "captured_at_utc"),
      message: `captured_at_utc exceeds the allowed future skew of ${args.context.allowedClockSkewMs}ms.`,
    });
  }
  if (cutoffMs - referenceMs > args.context.allowedClockSkewMs) {
    pushFinding(args.findings, {
      code: "dataset_timestamp_future_skew",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "cutoff_at_utc"),
      message: `cutoff_at_utc exceeds the allowed future skew of ${args.context.allowedClockSkewMs}ms.`,
    });
  }
}

function reconcileCoverage(args: {
  fileRole: Task2CDatasetRole;
  fileName: string;
  coverage: Task2CCoverage;
  targetTeamKeys: string[];
  actualTeamKeys: string[];
  findings: Task2CValidationFinding[];
}) {
  const sortedTargetTeamKeys = [...args.targetTeamKeys].sort();
  const sortedActualTeamKeys = [...args.actualTeamKeys].sort();
  const missingTeamKeys = sortedTargetTeamKeys.filter((teamKey) => !sortedActualTeamKeys.includes(teamKey));
  const unexpectedTeamKeys = sortedActualTeamKeys.filter((teamKey) => !sortedTargetTeamKeys.includes(teamKey));
  const declaredMissingTeamKeys = [...args.coverage.missing_team_keys].sort();
  const undeclaredMissingTeamKeys = missingTeamKeys.filter((teamKey) => !declaredMissingTeamKeys.includes(teamKey));
  const declaredButPresentTeamKeys = declaredMissingTeamKeys.filter((teamKey) => sortedActualTeamKeys.includes(teamKey));

  if (args.coverage.target_team_count !== sortedTargetTeamKeys.length) {
    pushFinding(args.findings, {
      code: "dataset_coverage_mismatch",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "coverage/target_team_count"),
      message: "coverage.target_team_count must equal the target team scope size.",
      expected: sortedTargetTeamKeys.length,
      actual: args.coverage.target_team_count,
    });
  }
  if (args.coverage.status === "complete" && declaredMissingTeamKeys.length > 0) {
    pushFinding(args.findings, {
      code: "dataset_coverage_mismatch",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "coverage/missing_team_keys"),
      message: "coverage.status complete requires zero missing_team_keys.",
    });
  }
  if (args.coverage.status === "complete" && missingTeamKeys.length > 0) {
    pushFinding(args.findings, {
      code: "dataset_coverage_mismatch",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "coverage/status"),
      message: "coverage.status complete is invalid when target teams are missing from the dataset rows.",
    });
  }
  if (stableStringify(declaredMissingTeamKeys) !== stableStringify(missingTeamKeys)) {
    pushFinding(args.findings, {
      code: "dataset_coverage_mismatch",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "coverage/missing_team_keys"),
      message: "coverage.missing_team_keys must exactly match the target teams absent from the dataset rows.",
      expected: stableStringify(missingTeamKeys),
      actual: stableStringify(declaredMissingTeamKeys),
    });
  }
  for (const teamKey of unexpectedTeamKeys) {
    pushFinding(args.findings, {
      code: "dataset_unexpected_team",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "coverage"),
      rowIdentity: teamKey,
      message: `Dataset includes unexpected team ${teamKey} outside the manifest target scope.`,
      actual: teamKey,
    });
  }
  for (const teamKey of undeclaredMissingTeamKeys) {
    pushFinding(args.findings, {
      code: "dataset_missing_team",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "coverage"),
      rowIdentity: teamKey,
      message: `Dataset is missing required target team ${teamKey}.`,
      actual: teamKey,
    });
  }
  for (const teamKey of declaredButPresentTeamKeys) {
    pushFinding(args.findings, {
      code: "dataset_coverage_mismatch",
      fileRole: args.fileRole,
      filename: args.fileName,
      path: relativeJsonPath(args.fileName, "coverage/missing_team_keys"),
      rowIdentity: teamKey,
      message: `coverage.missing_team_keys declares ${teamKey} as missing even though the dataset includes a row for it.`,
      actual: teamKey,
    });
  }
}

function validateRatingDataset(
  fileName: string,
  datasetUnknown: unknown,
  manifestEntry: Task2CPackageDatasetEntry,
  manifest: Task2CSourcePackageManifest,
  context: Task2CValidationContext,
  findings: Task2CValidationFinding[],
): Task2CRatingDataset | null {
  if (!isRecord(datasetUnknown)) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: fileName,
      message: "Ratings dataset must be a JSON object.",
    });
    return null;
  }

  const { missingKeys, unexpectedKeys } = validateExactKeys(datasetUnknown, RATING_DATASET_REQUIRED_KEYS, []);
  for (const key of missingKeys) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, key),
      message: `Ratings dataset is missing required field ${key}.`,
    });
  }
  for (const key of unexpectedKeys) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, key),
      message: `Ratings dataset contains unexpected field ${key}.`,
    });
  }
  if (!Array.isArray(datasetUnknown.teams)) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, "teams"),
      message: "Ratings dataset must include a teams array.",
    });
    return null;
  }

  const datasetCoverage = normalizeCoverage(datasetUnknown.coverage, manifestEntry.role, fileName, relativeJsonPath(fileName, "coverage"), findings);
  if (datasetCoverage === null) {
    return null;
  }

  const dataset = datasetUnknown as Task2CRatingDataset;
  const expectedSourceKey = manifestEntry.role === "ratings_elo" ? "elo" : "fifa";
  const expectedDatasetKind = TASK2C_DATASET_KIND_BY_ROLE[manifestEntry.role];
  if (dataset.dataset_role !== manifestEntry.role) {
    pushFinding(findings, {
      code: "dataset_role_mismatch",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, "dataset_role"),
      message: `Dataset role must be ${manifestEntry.role}.`,
      expected: manifestEntry.role,
      actual: String(dataset.dataset_role),
    });
  }
  if (dataset.dataset_kind !== expectedDatasetKind) {
    pushFinding(findings, {
      code: "dataset_kind_mismatch",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, "dataset_kind"),
      message: `Dataset kind must be ${expectedDatasetKind}.`,
      expected: expectedDatasetKind,
      actual: String(dataset.dataset_kind),
    });
  }
  if (dataset.source_key !== expectedSourceKey) {
    pushFinding(findings, {
      code: "dataset_source_key_mismatch",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, "source_key"),
      message: `Dataset source_key must be ${expectedSourceKey}.`,
      expected: expectedSourceKey,
      actual: String(dataset.source_key),
    });
  }
  if (dataset.competition_key !== manifest.competition_key || dataset.season_key !== manifest.season_key) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName),
      message: "Dataset competition_key and season_key must match the manifest scope.",
    });
  }
  if (!TASK2C_ALLOWED_RANK_TIE_POLICIES.includes(dataset.rank_tie_policy)) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, "rank_tie_policy"),
      message: `rank_tie_policy must be one of ${TASK2C_ALLOWED_RANK_TIE_POLICIES.join(", ")}.`,
    });
  }
  if (typeof dataset.snapshot_id !== "string" || dataset.snapshot_id.trim().length === 0) {
    pushFinding(findings, {
      code: "dataset_snapshot_missing",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, "snapshot_id"),
      message: "Dataset snapshot_id must be a non-empty string.",
    });
  }

  validateDatasetTimestamps({
    fileRole: manifestEntry.role,
    fileName,
    effectiveAtUtc: dataset.effective_at_utc,
    capturedAtUtc: dataset.captured_at_utc,
    cutoffAtUtc: dataset.cutoff_at_utc,
    packageCreatedAtUtc: manifest.package_created_at_utc,
    context,
    findings,
  });

  const seenTeamKeys = new Set<string>();
  const seenRanks = new Set<number>();
  const actualTeamKeys: string[] = [];
  dataset.teams.forEach((rowUnknown, index) => {
    const rowPath = `${fileName}#/teams/${index}`;
    if (!isRecord(rowUnknown)) {
      pushFinding(findings, {
        code: "dataset_invalid_shape",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: rowPath,
        message: "Each ratings row must be an object.",
      });
      return;
    }
    const { missingKeys: missingRowKeys, unexpectedKeys: unexpectedRowKeys } = validateExactKeys(
      rowUnknown,
      RATING_ROW_REQUIRED_KEYS,
      ["reliability", "missing_data", "disagreement"],
    );
    for (const key of missingRowKeys) {
      pushFinding(findings, {
        code: "dataset_invalid_shape",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/${key}`,
        message: `Ratings row is missing required field ${key}.`,
      });
    }
    for (const key of unexpectedRowKeys) {
      pushFinding(findings, {
        code: "dataset_invalid_shape",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/${key}`,
        message: `Ratings row contains unexpected field ${key}.`,
      });
    }
    if (
      typeof rowUnknown.canonical_team_key !== "string" ||
      typeof rowUnknown.rank !== "number" ||
      typeof rowUnknown.rating_or_points !== "number"
    ) {
      return;
    }
    actualTeamKeys.push(rowUnknown.canonical_team_key);
    if (!context.canonicalTeamKeys.includes(rowUnknown.canonical_team_key)) {
      pushFinding(findings, {
        code: "dataset_unknown_team",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/canonical_team_key`,
        rowIdentity: rowUnknown.canonical_team_key,
        message: `Unknown canonical_team_key ${rowUnknown.canonical_team_key}.`,
      });
    }
    if (seenTeamKeys.has(rowUnknown.canonical_team_key)) {
      pushFinding(findings, {
        code: "dataset_duplicate_team",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/canonical_team_key`,
        rowIdentity: rowUnknown.canonical_team_key,
        message: `Duplicate canonical_team_key ${rowUnknown.canonical_team_key} found in ${fileName}.`,
      });
    }
    seenTeamKeys.add(rowUnknown.canonical_team_key);
    if (!Number.isInteger(rowUnknown.rank) || rowUnknown.rank <= 0) {
      pushFinding(findings, {
        code: "dataset_rank_invalid",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/rank`,
        rowIdentity: rowUnknown.canonical_team_key,
        message: "Ratings rank must be a positive integer.",
        actual: rowUnknown.rank,
      });
    }
    if (!Number.isFinite(rowUnknown.rating_or_points) || (manifestEntry.role === "ratings_fifa" && rowUnknown.rating_or_points < 0)) {
      pushFinding(findings, {
        code: "dataset_value_invalid",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/rating_or_points`,
        rowIdentity: rowUnknown.canonical_team_key,
        message:
          manifestEntry.role === "ratings_fifa"
            ? "FIFA points must be finite and greater than or equal to zero."
            : "Elo rating must be finite.",
        actual: Number.isFinite(rowUnknown.rating_or_points) ? rowUnknown.rating_or_points : String(rowUnknown.rating_or_points),
      });
    }
    if (dataset.rank_tie_policy === "forbid_ties") {
      if (seenRanks.has(rowUnknown.rank)) {
        pushFinding(findings, {
          code: "dataset_rank_tie_forbidden",
          fileRole: manifestEntry.role,
          filename: fileName,
          path: `${rowPath}/rank`,
          rowIdentity: rowUnknown.canonical_team_key,
          message: `Rank ${rowUnknown.rank} is duplicated while rank_tie_policy is forbid_ties.`,
          actual: rowUnknown.rank,
        });
      }
      seenRanks.add(rowUnknown.rank);
    }
  });

  reconcileCoverage({
    fileRole: manifestEntry.role,
    fileName,
    coverage: datasetCoverage,
    targetTeamKeys: manifest.target_canonical_team_keys,
    actualTeamKeys,
    findings,
  });

  return {
    ...dataset,
    coverage: datasetCoverage,
    teams: dataset.teams,
  };
}

function validateStandingsDataset(
  fileName: string,
  datasetUnknown: unknown,
  manifestEntry: Task2CPackageDatasetEntry,
  manifest: Task2CSourcePackageManifest,
  context: Task2CValidationContext,
  findings: Task2CValidationFinding[],
): Task2CWorldCupStandingsDataset | null {
  if (!isRecord(datasetUnknown)) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: fileName,
      message: "Standings dataset must be a JSON object.",
    });
    return null;
  }

  const { missingKeys, unexpectedKeys } = validateExactKeys(datasetUnknown, STANDINGS_DATASET_REQUIRED_KEYS, []);
  for (const key of missingKeys) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, key),
      message: `Standings dataset is missing required field ${key}.`,
    });
  }
  for (const key of unexpectedKeys) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, key),
      message: `Standings dataset contains unexpected field ${key}.`,
    });
  }
  if (!Array.isArray(datasetUnknown.rows)) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, "rows"),
      message: "Standings dataset must include a rows array.",
    });
    return null;
  }

  const datasetCoverage = normalizeCoverage(datasetUnknown.coverage, manifestEntry.role, fileName, relativeJsonPath(fileName, "coverage"), findings);
  if (datasetCoverage === null) {
    return null;
  }

  const dataset = datasetUnknown as Task2CWorldCupStandingsDataset;
  if (dataset.dataset_role !== manifestEntry.role) {
    pushFinding(findings, {
      code: "dataset_role_mismatch",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, "dataset_role"),
      message: `Dataset role must be ${manifestEntry.role}.`,
      expected: manifestEntry.role,
      actual: String(dataset.dataset_role),
    });
  }
  if (dataset.dataset_kind !== TASK2C_DATASET_KIND_BY_ROLE.world_cup_standings) {
    pushFinding(findings, {
      code: "dataset_kind_mismatch",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, "dataset_kind"),
      message: `Dataset kind must be ${TASK2C_DATASET_KIND_BY_ROLE.world_cup_standings}.`,
    });
  }
  if (
    dataset.competition_key !== manifest.competition_key ||
    dataset.season_key !== manifest.season_key
  ) {
    pushFinding(findings, {
      code: "dataset_invalid_shape",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName),
      message: "Standings dataset competition_key and season_key must match the manifest scope.",
    });
  }
  if (typeof dataset.snapshot_id !== "string" || dataset.snapshot_id.trim().length === 0) {
    pushFinding(findings, {
      code: "dataset_snapshot_missing",
      fileRole: manifestEntry.role,
      filename: fileName,
      path: relativeJsonPath(fileName, "snapshot_id"),
      message: "Dataset snapshot_id must be a non-empty string.",
    });
  }

  validateDatasetTimestamps({
    fileRole: manifestEntry.role,
    fileName,
    effectiveAtUtc: dataset.effective_at_utc,
    capturedAtUtc: dataset.captured_at_utc,
    cutoffAtUtc: dataset.cutoff_at_utc,
    packageCreatedAtUtc: manifest.package_created_at_utc,
    context,
    findings,
  });

  const seenTeamKeys = new Set<string>();
  const seenNaturalKeys = new Set<string>();
  const seenGroupPositions = new Set<string>();
  const actualTeamKeys: string[] = [];
  dataset.rows.forEach((rowUnknown, index) => {
    const rowPath = `${fileName}#/rows/${index}`;
    if (!isRecord(rowUnknown)) {
      pushFinding(findings, {
        code: "dataset_invalid_shape",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: rowPath,
        message: "Each standings row must be an object.",
      });
      return;
    }
    const { missingKeys: missingRowKeys, unexpectedKeys: unexpectedRowKeys } = validateExactKeys(
      rowUnknown,
      STANDINGS_ROW_REQUIRED_KEYS,
      ["reliability", "missing_data", "disagreement"],
    );
    for (const key of missingRowKeys) {
      pushFinding(findings, {
        code: "dataset_invalid_shape",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/${key}`,
        message: `Standings row is missing required field ${key}.`,
      });
    }
    for (const key of unexpectedRowKeys) {
      const code = STANDINGS_DERIVED_FIELD_NAMES.has(key) ? "dataset_invalid_shape" : "dataset_invalid_shape";
      pushFinding(findings, {
        code,
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/${key}`,
        message: STANDINGS_DERIVED_FIELD_NAMES.has(key)
          ? `Derived field ${key} is not allowed in the raw standings contract.`
          : `Standings row contains unexpected field ${key}.`,
      });
    }
    const requiredNumberKeys = [
      "position",
      "matches_played",
      "wins",
      "draws",
      "losses",
      "goals_for",
      "goals_against",
      "goal_difference",
      "points",
    ] as const;
    if (
      typeof rowUnknown.canonical_team_key !== "string" ||
      typeof rowUnknown.group_key !== "string" ||
      requiredNumberKeys.some((key) => typeof rowUnknown[key] !== "number")
    ) {
      return;
    }

    const canonicalTeamKey = rowUnknown.canonical_team_key;
    actualTeamKeys.push(canonicalTeamKey);
    const rowIdentity = `${rowUnknown.group_key}:${rowUnknown.position}:${canonicalTeamKey}`;
    if (!context.canonicalTeamKeys.includes(canonicalTeamKey)) {
      pushFinding(findings, {
        code: "dataset_unknown_team",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/canonical_team_key`,
        rowIdentity,
        message: `Unknown canonical_team_key ${canonicalTeamKey}.`,
      });
    }
    if (seenTeamKeys.has(canonicalTeamKey)) {
      pushFinding(findings, {
        code: "dataset_duplicate_team",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/canonical_team_key`,
        rowIdentity,
        message: `Duplicate canonical_team_key ${canonicalTeamKey} found in standings.`,
      });
    }
    seenTeamKeys.add(canonicalTeamKey);

    if (seenNaturalKeys.has(rowIdentity)) {
      pushFinding(findings, {
        code: "dataset_invalid_shape",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: rowPath,
        rowIdentity,
        message: `Duplicate standings natural identity ${rowIdentity} found.`,
      });
    }
    seenNaturalKeys.add(rowIdentity);

    const groupPositionKey = `${rowUnknown.group_key}:${rowUnknown.position}`;
    if (seenGroupPositions.has(groupPositionKey)) {
      pushFinding(findings, {
        code: "dataset_duplicate_group_position",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/position`,
        rowIdentity,
        message: `Duplicate position ${rowUnknown.position} found for ${rowUnknown.group_key}.`,
      });
    }
    seenGroupPositions.add(groupPositionKey);

    const expectedGroupKey = context.teamGroupByKey[canonicalTeamKey];
    if (expectedGroupKey != null && expectedGroupKey !== rowUnknown.group_key) {
      pushFinding(findings, {
        code: "dataset_group_mismatch",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/group_key`,
        rowIdentity,
        message: `Team ${canonicalTeamKey} must belong to ${expectedGroupKey}, not ${rowUnknown.group_key}.`,
      });
    }

    for (const key of requiredNumberKeys) {
      const value = rowUnknown[key];
      if (!Number.isInteger(value) || (key !== "goal_difference" && value < 0)) {
        pushFinding(findings, {
          code: key === "position" ? "dataset_invalid_shape" : "dataset_value_invalid",
          fileRole: manifestEntry.role,
          filename: fileName,
          path: `${rowPath}/${key}`,
          rowIdentity,
          message:
            key === "position"
              ? "position must be a positive integer."
              : `${key} must be an integer${key === "goal_difference" ? "" : " greater than or equal to zero"}.`,
          actual: value,
        });
      }
    }
    if (rowUnknown.position <= 0) {
      pushFinding(findings, {
        code: "dataset_invalid_shape",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/position`,
        rowIdentity,
        message: "position must be greater than zero.",
        actual: rowUnknown.position,
      });
    }
    if (rowUnknown.matches_played !== rowUnknown.wins + rowUnknown.draws + rowUnknown.losses) {
      pushFinding(findings, {
        code: "dataset_played_mismatch",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/matches_played`,
        rowIdentity,
        message: "matches_played must equal wins + draws + losses.",
      });
    }
    if (rowUnknown.goal_difference !== rowUnknown.goals_for - rowUnknown.goals_against) {
      pushFinding(findings, {
        code: "dataset_goal_difference_mismatch",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/goal_difference`,
        rowIdentity,
        message: "goal_difference must equal goals_for - goals_against.",
      });
    }
    if (rowUnknown.points !== rowUnknown.wins * 3 + rowUnknown.draws) {
      pushFinding(findings, {
        code: "dataset_points_mismatch",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/points`,
        rowIdentity,
        message: "points must equal wins * 3 + draws.",
      });
    }

    if (
      rowUnknown.source_reported_qualification_status !== null &&
      !TASK2C_ALLOWED_QUALIFICATION_STATUSES.includes(
        rowUnknown.source_reported_qualification_status as Task2CQualificationStatus,
      )
    ) {
      pushFinding(findings, {
        code: "dataset_qualification_status_invalid",
        fileRole: manifestEntry.role,
        filename: fileName,
        path: `${rowPath}/source_reported_qualification_status`,
        rowIdentity,
        message: `source_reported_qualification_status must be null or one of ${TASK2C_ALLOWED_QUALIFICATION_STATUSES.join(", ")}.`,
        actual: rowUnknown.source_reported_qualification_status as string,
      });
    }
  });

  reconcileCoverage({
    fileRole: manifestEntry.role,
    fileName,
    coverage: datasetCoverage,
    targetTeamKeys: manifest.target_canonical_team_keys,
    actualTeamKeys,
    findings,
  });

  return {
    ...dataset,
    coverage: datasetCoverage,
    rows: dataset.rows,
  };
}

export function buildTask2CValidationContext(args: Task2CValidationContext): Task2CValidationContext {
  return {
    canonicalTeamKeys: [...args.canonicalTeamKeys],
    canonicalGroupKeys: [...args.canonicalGroupKeys],
    teamGroupByKey: { ...args.teamGroupByKey },
    teamKeysByGroup: Object.fromEntries(Object.entries(args.teamKeysByGroup).map(([groupKey, teamKeys]) => [groupKey, [...teamKeys]])),
    allowedDatasetRoles: [...args.allowedDatasetRoles],
    referenceTimeUtc: args.referenceTimeUtc,
    allowedClockSkewMs: args.allowedClockSkewMs,
  };
}

export function buildTask2CValidationContextFromCanonicalWorldCup2026(args: {
  referenceTimeUtc: string;
  allowedClockSkewMs: number;
  allowedDatasetRoles?: readonly Task2CDatasetRole[];
}): Task2CValidationContext {
  return buildTask2CValidationContext({
    canonicalTeamKeys: WORLD_CUP_2026_TEAMS.map((team) => team.teamKey),
    canonicalGroupKeys: WORLD_CUP_2026_GROUPS.map((group) => group.groupKey),
    teamGroupByKey: Object.fromEntries(WORLD_CUP_2026_TEAMS.map((team) => [team.teamKey, team.groupKey])),
    teamKeysByGroup: Object.fromEntries(WORLD_CUP_2026_GROUPS.map((group) => [group.groupKey, [...group.teamKeys]])),
    allowedDatasetRoles: args.allowedDatasetRoles ?? (Object.keys(TASK2C_DATASET_FILE_BY_ROLE) as Task2CDatasetRole[]),
    referenceTimeUtc: args.referenceTimeUtc,
    allowedClockSkewMs: args.allowedClockSkewMs,
  });
}

export function recomputeTask2CSemanticPackageSha256(args: {
  manifest: Task2CSourcePackageManifest;
  datasets: Task2CValidatedPackage["datasets"];
  fileShaByRole: ReadonlyMap<Task2CDatasetRole, string>;
}) {
  return sha256Json(
    buildSemanticChecksumProjection({
      manifest: args.manifest,
      validatedDatasets: args.datasets,
      fileShaByRole: args.fileShaByRole,
    }),
  );
}

export function validateTask2CSourcePackage(
  packageDir: string,
  context: Task2CValidationContext,
): Task2CSourcePackageValidationResult {
  const findings: Task2CValidationFinding[] = [];

  if (!directoryExists(packageDir)) {
    pushFinding(findings, {
      code: "package_directory_missing",
      fileRole: "package",
      filename: packageDir,
      path: packageDir,
      message: `Package directory ${packageDir} does not exist.`,
    });
    return { status: "blocked", findings, validatedPackage: null };
  }

  const manifestPath = path.join(packageDir, TASK2C_MANIFEST_FILE);
  if (!fs.existsSync(manifestPath) || !fs.statSync(manifestPath).isFile()) {
    pushFinding(findings, {
      code: "manifest_missing",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: TASK2C_MANIFEST_FILE,
      message: "Task 2C manifest file is missing.",
    });
    return { status: "blocked", findings, validatedPackage: null };
  }

  let manifestUnknown: unknown;
  try {
    manifestUnknown = readJsonFile(manifestPath);
  } catch {
    pushFinding(findings, {
      code: "manifest_invalid_json",
      fileRole: "manifest",
      filename: TASK2C_MANIFEST_FILE,
      path: TASK2C_MANIFEST_FILE,
      message: "Task 2C manifest file is not valid JSON.",
    });
    return { status: "blocked", findings, validatedPackage: null };
  }

  const manifest = normalizeManifest(manifestUnknown, findings);
  if (manifest === null) {
    return { status: "blocked", findings: findings.sort(compareFinding), validatedPackage: null };
  }

  validateManifest(manifest, packageDir, context, findings);

  const fileShaByRole = new Map<Task2CDatasetRole, string>();
  const datasetMap = new Map<Task2CDatasetRole, Task2CRatingDataset | Task2CWorldCupStandingsDataset>();
  const packageFileEntryByRole = new Map<Task2CDatasetRole, Task2CPackageFileEntry>(
    manifest.package_files.map((entry) => [entry.role, entry]),
  );

  for (const datasetEntry of [...manifest.datasets].sort((a, b) => a.role.localeCompare(b.role))) {
    const fileName = datasetEntry.file_name;
    const packageFileEntry = packageFileEntryByRole.get(datasetEntry.role);
    const resolvedPath = validatePackageRootBasename(fileName, datasetEntry.role, findings, `${TASK2C_MANIFEST_FILE}#/datasets/${datasetEntry.role}/file_name`)
      ? resolvePackageFilePath(packageDir, fileName, datasetEntry.role, findings, `${TASK2C_MANIFEST_FILE}#/datasets/${datasetEntry.role}/file_name`)
      : null;
    if (resolvedPath === null) {
      continue;
    }
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
      pushFinding(findings, {
        code: "dataset_missing",
        fileRole: datasetEntry.role,
        filename: fileName,
        path: fileName,
        message: `Expected dataset file ${fileName} is missing.`,
      });
      continue;
    }

    const fileBuffer = fs.readFileSync(resolvedPath);
    const actualSha = sha256Bytes(fileBuffer);
    const actualSize = fileBuffer.byteLength;
    fileShaByRole.set(datasetEntry.role, actualSha);

    if (packageFileEntry != null) {
      if (actualSha !== packageFileEntry.sha256) {
        pushFinding(findings, {
          code: "manifest_dataset_checksum_mismatch",
          fileRole: datasetEntry.role,
          filename: fileName,
          path: fileName,
          message: `Dataset file ${fileName} does not match the manifest SHA-256.`,
          expected: packageFileEntry.sha256,
          actual: actualSha,
        });
      }
      if (actualSize !== packageFileEntry.size_bytes) {
        pushFinding(findings, {
          code: "manifest_dataset_size_mismatch",
          fileRole: datasetEntry.role,
          filename: fileName,
          path: fileName,
          message: `Dataset file ${fileName} does not match the manifest byte size.`,
          expected: packageFileEntry.size_bytes,
          actual: actualSize,
        });
      }
    }

    let datasetUnknown: unknown;
    try {
      datasetUnknown = JSON.parse(fileBuffer.toString("utf8")) as unknown;
    } catch {
      pushFinding(findings, {
        code: "dataset_invalid_json",
        fileRole: datasetEntry.role,
        filename: fileName,
        path: fileName,
        message: `Dataset file ${fileName} is not valid JSON.`,
      });
      continue;
    }

    if (datasetEntry.role === "world_cup_standings") {
      const standingsDataset = validateStandingsDataset(fileName, datasetUnknown, datasetEntry, manifest, context, findings);
      if (standingsDataset != null) {
        datasetMap.set(datasetEntry.role, standingsDataset);
      }
      continue;
    }

    const ratingDataset = validateRatingDataset(fileName, datasetUnknown, datasetEntry, manifest, context, findings);
    if (ratingDataset != null) {
      datasetMap.set(datasetEntry.role, ratingDataset);
    }
  }

  const validatedPackage =
    datasetMap.has("ratings_elo") && datasetMap.has("ratings_fifa") && datasetMap.has("world_cup_standings")
      ? {
          manifest,
          datasets: {
            ratings_elo: datasetMap.get("ratings_elo") as Task2CRatingDataset,
            ratings_fifa: datasetMap.get("ratings_fifa") as Task2CRatingDataset,
            world_cup_standings: datasetMap.get("world_cup_standings") as Task2CWorldCupStandingsDataset,
          },
        }
      : null;

  if (validatedPackage != null) {
    const semanticPackageSha256 = recomputeTask2CSemanticPackageSha256({
      manifest,
      datasets: validatedPackage.datasets,
      fileShaByRole,
    });
    if (manifest.semantic_package_sha256 !== semanticPackageSha256) {
      pushFinding(findings, {
        code: "manifest_semantic_checksum_mismatch",
        fileRole: "manifest",
        filename: TASK2C_MANIFEST_FILE,
        path: `${TASK2C_MANIFEST_FILE}#/semantic_package_sha256`,
        message: "Manifest semantic_package_sha256 does not match the recomputed semantic package checksum.",
        expected: semanticPackageSha256,
        actual: manifest.semantic_package_sha256,
      });
    }
  }

  const sortedFindings = findings.sort(compareFinding);
  if (sortedFindings.some((finding) => finding.severity === "error") || validatedPackage == null) {
    return {
      status: "blocked",
      findings: sortedFindings,
      validatedPackage: null,
    };
  }

  return {
    status: "verified",
    findings: sortedFindings,
    validatedPackage,
  };
}

export function buildTeamTournamentStandingSnapshotInserts(
  validatedPackage: Task2CValidatedPackage,
  args: Task2CTeamTournamentStandingSnapshotBuildArgs,
): Array<DatabaseInsert<"team_tournament_standing_snapshots">> {
  const standings = validatedPackage.datasets.world_cup_standings;
  return canonicalizeStandingsRows(standings.rows).map((row) => ({
    source_snapshot_id: standings.snapshot_id,
    competition_id: args.competitionId,
    season_id: args.seasonId,
    stage_key: standings.stage_key,
    group_key: row.group_key,
    canonical_team_key: row.canonical_team_key,
    position: row.position,
    matches_played: row.matches_played,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goals_for: row.goals_for,
    goals_against: row.goals_against,
    goal_difference: row.goal_difference,
    points: row.points,
    source_reported_qualification_status: row.source_reported_qualification_status,
    effective_at: normalizeInstant(standings.effective_at_utc) ?? standings.effective_at_utc,
    captured_at: normalizeInstant(standings.captured_at_utc) ?? standings.captured_at_utc,
    cutoff_at: normalizeInstant(standings.cutoff_at_utc) ?? standings.cutoff_at_utc,
    reliability_json: row.reliability,
    missing_data_json: row.missing_data,
    disagreement_json: row.disagreement,
  }));
}

function buildDeterministicPackageId(args: {
  packageVersion: string;
  competitionKey: string;
  seasonKey: string;
  cutoffAtUtc: string;
  targetCanonicalTeamKeys: string[];
}) {
  return sha256Json({
    package_version: args.packageVersion,
    competition_key: args.competitionKey,
    season_key: args.seasonKey,
    cutoff_at_utc: normalizeInstant(args.cutoffAtUtc),
    target_canonical_team_keys: [...args.targetCanonicalTeamKeys].sort(),
  });
}

function canonicalizePackageFileEntry(entry: Task2CPackageFileEntry) {
  return {
    role: entry.role,
    file_name: entry.file_name,
    dataset_kind: entry.dataset_kind,
    sha256: entry.sha256,
    size_bytes: entry.size_bytes,
  };
}

function canonicalizePackageDatasetEntry(entry: Task2CPackageDatasetEntry) {
  return {
    role: entry.role,
    file_name: entry.file_name,
    dataset_kind: entry.dataset_kind,
    source_key: entry.source_key,
    snapshot_id: entry.snapshot_id,
    effective_at_utc: normalizeInstant(entry.effective_at_utc) ?? entry.effective_at_utc,
    captured_at_utc: normalizeInstant(entry.captured_at_utc) ?? entry.captured_at_utc,
    coverage: canonicalizeCoverage(entry.coverage),
  };
}

function canonicalizeRatingDataset(dataset: Task2CRatingDataset): Task2CRatingDataset {
  return {
    ...dataset,
    coverage: canonicalizeCoverage(dataset.coverage),
    teams: canonicalizeRatingRows(dataset.teams),
  };
}

function canonicalizeStandingsDataset(dataset: Task2CWorldCupStandingsDataset): Task2CWorldCupStandingsDataset {
  return {
    ...dataset,
    coverage: canonicalizeCoverage(dataset.coverage),
    rows: canonicalizeStandingsRows(dataset.rows),
  };
}

export function createTask2CManifest(args: {
  packageVersion: string;
  packageCreatedAtUtc: string | null;
  ratingsElo: Task2CRatingDataset;
  ratingsFifa: Task2CRatingDataset;
  worldCupStandings: Task2CWorldCupStandingsDataset;
  targetCanonicalTeamKeys: string[];
}): Task2CSourcePackageManifest {
  const ratingsElo = canonicalizeRatingDataset(args.ratingsElo);
  const ratingsFifa = canonicalizeRatingDataset(args.ratingsFifa);
  const worldCupStandings = canonicalizeStandingsDataset(args.worldCupStandings);
  const datasets = [
    { role: "ratings_elo" as const, fileName: TASK2C_DATASET_FILE_BY_ROLE.ratings_elo, value: ratingsElo },
    { role: "ratings_fifa" as const, fileName: TASK2C_DATASET_FILE_BY_ROLE.ratings_fifa, value: ratingsFifa },
    { role: "world_cup_standings" as const, fileName: TASK2C_DATASET_FILE_BY_ROLE.world_cup_standings, value: worldCupStandings },
  ];
  const packageFiles: Task2CPackageFileEntry[] = datasets
    .map((entry) => {
      const encoded = stableStringify(entry.value);
      return {
        role: entry.role,
        file_name: entry.fileName,
        dataset_kind: TASK2C_DATASET_KIND_BY_ROLE[entry.role],
        sha256: sha256Bytes(encoded),
        size_bytes: Buffer.byteLength(encoded, "utf8"),
      };
    })
    .sort((a, b) => a.role.localeCompare(b.role));
  const packageDatasets: Task2CPackageDatasetEntry[] = datasets
    .map((entry) => ({
      role: entry.role,
      file_name: entry.fileName,
      dataset_kind: TASK2C_DATASET_KIND_BY_ROLE[entry.role],
      source_key: entry.value.source_key,
      snapshot_id: entry.value.snapshot_id,
      effective_at_utc: entry.value.effective_at_utc,
      captured_at_utc: entry.value.captured_at_utc,
      coverage: canonicalizeCoverage(entry.value.coverage),
    }))
    .sort((a, b) => a.role.localeCompare(b.role));

  const manifestBase: Task2CSourcePackageManifest = {
    schema_name: TASK2C_SCHEMA_NAME,
    schema_version: TASK2C_SCHEMA_VERSION,
    package_version: args.packageVersion,
    package_id: buildDeterministicPackageId({
      packageVersion: args.packageVersion,
      competitionKey: worldCupStandings.competition_key,
      seasonKey: worldCupStandings.season_key,
      cutoffAtUtc: worldCupStandings.cutoff_at_utc,
      targetCanonicalTeamKeys: args.targetCanonicalTeamKeys,
    }),
    package_created_at_utc: args.packageCreatedAtUtc,
    cutoff_at_utc: worldCupStandings.cutoff_at_utc,
    competition_key: worldCupStandings.competition_key,
    season_key: worldCupStandings.season_key,
    target_canonical_team_keys: [...args.targetCanonicalTeamKeys].sort(),
    coverage: canonicalizeCoverage(worldCupStandings.coverage),
    semantic_package_sha256: "",
    package_files: packageFiles.map(canonicalizePackageFileEntry),
    datasets: packageDatasets.map(canonicalizePackageDatasetEntry),
  };
  const semanticPackageSha256 = sha256Json(
    buildSemanticChecksumProjection({
      manifest: manifestBase,
      validatedDatasets: {
        ratings_elo: ratingsElo,
        ratings_fifa: ratingsFifa,
        world_cup_standings: worldCupStandings,
      },
      fileShaByRole: new Map(packageFiles.map((entry) => [entry.role, entry.sha256])),
    }),
  );
  return {
    ...manifestBase,
    semantic_package_sha256: semanticPackageSha256,
  };
}

export function writeTask2CSourcePackage(packageDir: string, args: {
  packageVersion: string;
  packageCreatedAtUtc: string | null;
  ratingsElo: Task2CRatingDataset;
  ratingsFifa: Task2CRatingDataset;
  worldCupStandings: Task2CWorldCupStandingsDataset;
  targetCanonicalTeamKeys: string[];
}) {
  fs.mkdirSync(packageDir, { recursive: true });
  const ratingsElo = canonicalizeRatingDataset(args.ratingsElo);
  const ratingsFifa = canonicalizeRatingDataset(args.ratingsFifa);
  const worldCupStandings = canonicalizeStandingsDataset(args.worldCupStandings);
  const manifest = createTask2CManifest({
    packageVersion: args.packageVersion,
    packageCreatedAtUtc: args.packageCreatedAtUtc,
    ratingsElo,
    ratingsFifa,
    worldCupStandings,
    targetCanonicalTeamKeys: args.targetCanonicalTeamKeys,
  });

  fs.writeFileSync(path.join(packageDir, TASK2C_DATASET_FILE_BY_ROLE.ratings_elo), stableStringify(ratingsElo), "utf8");
  fs.writeFileSync(path.join(packageDir, TASK2C_DATASET_FILE_BY_ROLE.ratings_fifa), stableStringify(ratingsFifa), "utf8");
  fs.writeFileSync(path.join(packageDir, TASK2C_DATASET_FILE_BY_ROLE.world_cup_standings), stableStringify(worldCupStandings), "utf8");
  fs.writeFileSync(path.join(packageDir, TASK2C_MANIFEST_FILE), stableStringify(manifest), "utf8");

  return manifest;
}
