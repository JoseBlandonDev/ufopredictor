import fs from "node:fs";
import path from "node:path";

import type { DatabaseInsert, Json } from "../../types/database";
import { fetchApiFootballStandings } from "../football-api/api-football-client";
import type {
  ProviderStandingsResult,
  ProviderStandingsRow,
} from "../football-api/api-football-types";
import { getTargetCompetitionByKey } from "../football-api/target-competitions";
import {
  buildTask2CValidationContextFromCanonicalWorldCup2026,
  TASK2C_DATASET_FILE_BY_ROLE,
  TASK2C_DATASET_KIND_BY_ROLE,
  TASK2C_ALLOWED_QUALIFICATION_STATUSES,
  type Task2CCoverage,
  type Task2CValidationFinding,
  type Task2CValidationStatus,
  type Task2CTournamentStandingRow,
  type Task2CWorldCupStandingsDataset,
} from "./task2c-source-package";
import {
  ensureDirectory,
  normalizeUtcInstant,
  readJsonFile,
  sha256File,
  sha256Json,
  stableStringify,
  stableValue,
  writeJsonFile,
} from "./task2b-shared";
import { createSupabaseScriptAdminClient } from "../supabase/script-admin";
import { resolveWorldCup2026TeamKey } from "../world-cup-2026/canonical-team-resolver";
import { WORLD_CUP_2026_FIXTURES } from "../world-cup-2026/canonical-fixtures";

export const TASK2C3_TASK_SLICE = "task2c.3";
export const TASK2C3_PACKAGE_VERSION = "2026-06-30-v1";
export const TASK2C3_MANIFEST_FILE = "task2c3-standings-manifest.json";
export const TASK2C3_MANIFEST_SCHEMA_NAME = "prediction-intelligence-v2-task2c3-standings-package";
export const TASK2C3_MANIFEST_SCHEMA_VERSION = "1.0.0";
export const TASK2C3_PLAN_SCHEMA_NAME = "prediction-intelligence-v2-task2c3-standings-import-plan";
export const TASK2C3_PLAN_SCHEMA_VERSION = "1.0.0";
export const TASK2C3_COMPETITION_KEY = "world-cup-2026";
export const TASK2C3_SEASON_KEY = "2026";
export const TASK2C3_STAGE_KEY = "group_stage";
export const TASK2C3_SOURCE_KEY = "api_football";
export const TASK2C3_SOURCE_SNAPSHOT_KEY = "api_football_world_cup_standings";
export const TASK2C3_SCHEMA_NAME = "prediction-intelligence-v2-standing-snapshot";
export const TASK2C3_SCHEMA_VERSION = "1.0.0";
export const TASK2C3_PROVIDER_EVIDENCE_FILE = "api-football-standings-raw.json";
export const TASK2C3_KNOCKOUT_EVIDENCE_FILE = "task2c3-knockout-evidence.json";

type Task2C3PlanAction = "insert" | "skip_identical" | "conflict" | "invalid";

type Task2C3ComparableSourceSnapshot = {
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

type Task2C3ComparableStandingSnapshot = {
  source_snapshot_id: string;
  competition_id: string;
  season_id: string;
  stage_key: string;
  group_key: string;
  canonical_team_key: string;
  position: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  source_reported_qualification_status: "qualified" | "eliminated" | null;
  effective_at: string;
  captured_at: string;
  cutoff_at: string;
  reliability_json: Json;
  missing_data_json: Json;
  disagreement_json: Json;
};

export type Task2C3LocalState = {
  competitionId: string | null;
  seasonId: string | null;
  standingsTablePresent: boolean;
  standingsTablePresenceError: string | null;
  sourceSnapshots: Task2C3ComparableSourceSnapshot[];
  teamTournamentStandingSnapshots: Task2C3ComparableStandingSnapshot[];
};

type Task2C3PackageFileEntry = {
  role: "world_cup_standings";
  file_name: string;
  dataset_kind: "team_tournament_standings";
  sha256: string;
  size_bytes: number;
};

type Task2C3PackageDatasetEntry = {
  role: "world_cup_standings";
  file_name: string;
  dataset_kind: "team_tournament_standings";
  source_key: string;
  snapshot_id: string;
  effective_at_utc: string;
  captured_at_utc: string;
  cutoff_at_utc: string;
  payload_hash: string;
};

export type Task2C3StandingsPackageManifest = {
  schema_name: typeof TASK2C3_MANIFEST_SCHEMA_NAME;
  schema_version: typeof TASK2C3_MANIFEST_SCHEMA_VERSION;
  package_version: string;
  package_id: string;
  generated_at_utc: string | null;
  competition_key: typeof TASK2C3_COMPETITION_KEY;
  season_key: typeof TASK2C3_SEASON_KEY;
  stage_key: typeof TASK2C3_STAGE_KEY;
  source_key: typeof TASK2C3_SOURCE_KEY;
  target_canonical_team_keys: string[];
  coverage: Task2CCoverage;
  semantic_package_sha256: string;
  provider_scope: {
    league_id: number;
    league_name: string;
    country: string | null;
    season: number | null;
  };
  package_files: Task2C3PackageFileEntry[];
  datasets: Task2C3PackageDatasetEntry[];
};

export type Task2C3StandingsPackage = {
  manifest: Task2C3StandingsPackageManifest;
  dataset: Task2CWorldCupStandingsDataset;
  sourceSnapshot: DatabaseInsert<"source_snapshots">;
  standingSnapshots: Array<DatabaseInsert<"team_tournament_standing_snapshots">>;
};

export type Task2C3AcquisitionMetadata = {
  capturedAtUtc: string;
  cutoffAtUtc: string;
  capturedAtSource: "runner_clock" | "artifact_run_dir_timestamp" | "raw_capture_metadata";
  cutoffAtSource: "provider" | "acquisition_based";
  effectivePrecision: "date";
};

type Task2C3SourceSnapshotPlanRow = {
  action: Task2C3PlanAction;
  naturalKey: string;
  reason: string;
  expected: DatabaseInsert<"source_snapshots">;
  existing: Task2C3ComparableSourceSnapshot | null;
};

type Task2C3StandingSnapshotPlanRow = {
  action: Task2C3PlanAction;
  naturalKey: string;
  reason: string;
  expected: DatabaseInsert<"team_tournament_standing_snapshots">;
  existing: Task2C3ComparableStandingSnapshot | null;
};

export type Task2C3KnockoutEvidence = {
  mode: "stage_probe";
  inspected_at_utc: string;
  matches_found: number;
  result_rows_found: number;
  known_fixture_targets: string[];
  preservation: {
    winner_flag_preserved_in_stage: boolean;
    extra_time_or_penalties_detail_preserved_in_stage: boolean;
  };
  notes: string[];
  classification_gap: boolean;
  known_fixtures: Array<{
    canonical_fixture_id: string;
    official_match_number: number;
    canonical_stage: string;
    canonical_round_label: string;
    stage_match_id: string | null;
    external_id: string | null;
    api_football_fixture_id: number | null;
    slug: string;
    stage_value: string | null;
    status: string | null;
    kickoff_at: string;
    result_exists: boolean;
    classification_finding:
      | "fixture_missing"
      | "fixture_exists_but_lacks_knockout_classification"
      | "fixture_exists_with_non_knockout_classification"
      | "fixture_exists_with_knockout_classification";
    provider_snapshot_evidence: {
      found: boolean;
      provider_status_short: string | null;
      provider_round: string | null;
      regular_time_score_available: boolean;
      winner_identity_available: boolean;
      extra_time_score_available: boolean;
      penalty_score_available: boolean;
    };
  }>;
  sample_matches: Array<{
    id: string;
    external_id: string | null;
    slug: string;
    stage: string;
    status: string;
    kickoff_at: string;
  }>;
  sample_results: Array<{
    match_id: string;
    home_goals: number;
    away_goals: number;
    intake_source: string;
    source_note: string | null;
    recorded_at: string;
  }>;
};

type Task2C3KnownStageMatch = {
  id: string;
  external_id: string | null;
  slug: string;
  stage: string | null;
  status: string | null;
  kickoff_at: string;
  source_note?: string | null;
};

type Task2C3KnownResultRow = {
  match_id: string;
  home_goals: number;
  away_goals: number;
  intake_source: string;
  source_note: string | null;
  recorded_at: string;
};

type Task2C3KnownOfficialScheduleMatch = {
  id: string;
  official_match_number: number;
  stage_key: string | null;
  group_key: string | null;
  home_team_key: string | null;
  away_team_key: string | null;
  scheduled_at_utc: string;
};

type Task2C3KnownOfficialScheduleLink = {
  official_schedule_match_id: string;
  match_id: string | null;
  api_football_fixture_id: number | null;
  link_status: string;
  metadata_json: Json;
};

type Task2C3KnownProviderSnapshotFixture = {
  providerStatusShort: string;
  competition: {
    round: string | null;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

export type Task2C3ValidationResult = {
  status: Task2CValidationStatus;
  findings: Task2CValidationFinding[];
  validatedPackage: Task2C3StandingsPackage | null;
};

export type Task2C3StandingsImportPlan = {
  schema_name: typeof TASK2C3_PLAN_SCHEMA_NAME;
  schema_version: typeof TASK2C3_PLAN_SCHEMA_VERSION;
  task_slice: typeof TASK2C3_TASK_SLICE;
  generated_at_utc: string;
  stablePlanSha256: string;
  package_manifest_path: string;
  package_manifest_sha256: string;
  standingsTablePresent: boolean;
  globalBlockers: string[];
  summary: {
    sourceSnapshots: Record<Task2C3PlanAction, number>;
    teamTournamentStandingSnapshots: Record<Task2C3PlanAction, number>;
    totals: Record<Task2C3PlanAction, number>;
  };
  sourceSnapshots: Task2C3SourceSnapshotPlanRow[];
  teamTournamentStandingSnapshots: Task2C3StandingSnapshotPlanRow[];
};

export type Task2C3DryRunArtifact = {
  rawProviderPath: string;
  rawProviderSha256: string;
  knockoutEvidencePath: string;
  standingsPackageManifestPath: string;
  standingsPackageManifestSha256: string;
  planPath: string;
  rerunPlanPath: string;
};

type Task2C3RawProviderCapture = {
  schema_name: "prediction-intelligence-v2-task2c3-raw-provider-capture";
  schema_version: "1.0.0";
  provider: "api-football";
  logical_endpoint: string;
  request_parameters: Record<string, string>;
  competition_identity: {
    league_id: number;
    league_name: string;
    country: string | null;
  };
  season_identity: {
    season: number | null;
  };
  effective_precision?: "date";
  captured_at_source?: Task2C3AcquisitionMetadata["capturedAtSource"];
  cutoff_at_source?: Task2C3AcquisitionMetadata["cutoffAtSource"];
  effective_at_utc: string;
  captured_at_utc: string;
  cutoff_at_utc: string;
  http_status: number;
  raw_response_sha256: string;
  normalized_payload_sha256: string;
  coverage: Task2CCoverage;
  missing_data: Json;
  disagreement: Json;
  payload: unknown;
};

const targetCompetition = getTargetCompetitionByKey("world-cup");
if (!targetCompetition) {
  throw new Error("World Cup target competition is not configured for Task 2C.3.");
}
const TARGET_COMPETITION = targetCompetition;
const KNOWN_KNOCKOUT_FIXTURE_KEYS = ["wc2026-match-069", "wc2026-match-070"] as const;
const KNOWN_KNOCKOUT_FIXTURES = WORLD_CUP_2026_FIXTURES.filter((fixture) =>
  (KNOWN_KNOCKOUT_FIXTURE_KEYS as readonly string[]).includes(fixture.fixtureKey),
);
const VALIDATION_CONTEXT = buildTask2CValidationContextFromCanonicalWorldCup2026({
  referenceTimeUtc: "2026-06-30T00:00:00.000Z",
  allowedClockSkewMs: 0,
  allowedDatasetRoles: ["world_cup_standings"],
});

function relativeToRepo(repoRoot: string, targetPath: string): string {
  return path.relative(repoRoot, path.resolve(targetPath)).replace(/\\/g, "/");
}

function buildCoverage(rows: Task2CTournamentStandingRow[]): Task2CCoverage {
  const present = new Set(rows.map((row) => row.canonical_team_key));
  const missing = [...VALIDATION_CONTEXT.canonicalTeamKeys].filter((teamKey) => !present.has(teamKey));
  return {
    status: missing.length === 0 ? "complete" : "partial",
    target_team_count: VALIDATION_CONTEXT.canonicalTeamKeys.length,
    missing_team_keys: missing,
  };
}

function normalizeGroupLabel(groupLabel: string): string | null {
  const match = /^group\s+([a-l])$/i.exec(groupLabel.trim());
  return match ? `group-${match[1].toLowerCase()}` : null;
}

function mapQualificationStatus(row: ProviderStandingsRow): "qualified" | "eliminated" | null {
  if (typeof row.description === "string" && row.description.trim()) {
    return "qualified";
  }
  return row.rank <= 2 ? "qualified" : "eliminated";
}

function buildDatasetIdentity(args: { effectiveAtUtc: string; rows: Task2CTournamentStandingRow[] }) {
  return sha256Json({
    competition_key: TASK2C3_COMPETITION_KEY,
    season_key: TASK2C3_SEASON_KEY,
    stage_key: TASK2C3_STAGE_KEY,
    effective_at_utc: args.effectiveAtUtc,
    rows: args.rows.map((row) => ({
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
    })),
  }).slice(0, 12);
}

function canonicalizeRows(rows: Task2CTournamentStandingRow[]): Task2CTournamentStandingRow[] {
  return [...rows]
    .map((row) => ({
      ...row,
      reliability: stableValue(row.reliability ?? {}) as Json,
      missing_data: stableValue(row.missing_data ?? {}) as Json,
      disagreement: stableValue(row.disagreement ?? {}) as Json,
    }))
    .sort(
      (left, right) =>
        left.group_key.localeCompare(right.group_key) ||
        left.position - right.position ||
        left.canonical_team_key.localeCompare(right.canonical_team_key),
    );
}

function buildStandingsRows(provider: ProviderStandingsResult): Task2CTournamentStandingRow[] {
  const rows: Task2CTournamentStandingRow[] = [];

  for (const group of provider.groups) {
    const groupKey = normalizeGroupLabel(group.groupLabel);
    if (!groupKey) {
      continue;
    }

    for (const row of group.rows) {
      const canonicalTeamKey = resolveTeamKey(row.team.name, groupKey);
      if (!canonicalTeamKey) {
        throw new Error(`Unable to resolve provider team "${row.team.name}" for ${group.groupLabel}.`);
      }

      rows.push({
        canonical_team_key: canonicalTeamKey,
        group_key: groupKey,
        position: row.rank,
        matches_played: row.all.played,
        wins: row.all.win,
        draws: row.all.draw,
        losses: row.all.lose,
        goals_for: row.all.goals.for,
        goals_against: row.all.goals.against,
        goal_difference: row.goalsDiff,
        points: row.points,
        source_reported_qualification_status: mapQualificationStatus(row),
        reliability: {
          provider_team_id: row.team.providerTeamId,
          provider_group_label: row.group,
          provider_form: row.form,
          provider_status: row.status,
          provider_description: row.description,
          provider_update: row.update,
        },
        missing_data: {},
        disagreement: {},
      });
    }
  }

  return canonicalizeRows(rows);
}

function resolveTeamKey(name: string, expectedGroupKey: string): string | null {
  const teamKey = resolveWorldCup2026TeamKey(name);
  if (!teamKey) {
    return null;
  }
  return VALIDATION_CONTEXT.teamGroupByKey[teamKey] === expectedGroupKey ? teamKey : null;
}

function deriveEffectiveAtUtc(provider: ProviderStandingsResult): string {
  const updates = provider.groups
    .flatMap((group) => group.rows.map((row) => row.update))
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => normalizeUtcInstant(value))
    .sort((left, right) => left.localeCompare(right));

  if (updates.length === 0) {
    throw new Error("Provider standings response did not include any row update timestamps.");
  }

  return updates[updates.length - 1];
}

function parseArtifactTimestampSegment(value: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/.exec(value);
  if (!match) {
    return null;
  }
  return `${match[1]}T${match[2]}:${match[3]}:${match[4]}.${match[5]}Z`;
}

function inferCapturedAtUtcFromArtifactPath(filePath: string): string | null {
  const segments = path.resolve(filePath).split(path.sep);
  for (const segment of segments.reverse()) {
    const parsed = parseArtifactTimestampSegment(segment);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

function buildSourceUrl(provider: ProviderStandingsResult): string {
  const query = new URLSearchParams(provider.diagnostics.query);
  return `https://v3.football.api-sports.io${provider.diagnostics.endpoint}?${query.toString()}`;
}

function buildDataset(
  provider: ProviderStandingsResult,
  rows: Task2CTournamentStandingRow[],
  effectiveAtUtc: string,
  acquisition: Task2C3AcquisitionMetadata,
): Task2CWorldCupStandingsDataset {
  const coverage = buildCoverage(rows);
  const datasetIdentity = buildDatasetIdentity({ effectiveAtUtc, rows });
  return {
    schema_name: TASK2C3_SCHEMA_NAME,
    schema_version: TASK2C3_SCHEMA_VERSION,
    dataset_role: "world_cup_standings",
    dataset_kind: TASK2C_DATASET_KIND_BY_ROLE.world_cup_standings,
    source_key: TASK2C3_SOURCE_KEY,
    snapshot_id: `${TASK2C3_SOURCE_SNAPSHOT_KEY}-${effectiveAtUtc.slice(0, 10)}-${datasetIdentity}`,
    competition_key: TASK2C3_COMPETITION_KEY,
    season_key: TASK2C3_SEASON_KEY,
    stage_key: TASK2C3_STAGE_KEY,
    effective_at_utc: effectiveAtUtc,
    captured_at_utc: acquisition.capturedAtUtc,
    cutoff_at_utc: acquisition.cutoffAtUtc,
    coverage,
    reliability: {
      provider: "api-football",
      request_diagnostics: provider.diagnostics,
      provider_scope: provider.league,
      timestamp_semantics: {
        effective_precision: acquisition.effectivePrecision,
        captured_at_source: acquisition.capturedAtSource,
        cutoff_at_source: acquisition.cutoffAtSource,
        provider_effective_at_utc: effectiveAtUtc,
      },
    },
    missing_data: {
      ignored_non_group_collections: provider.groups
        .map((group) => group.groupLabel)
        .filter((groupLabel) => normalizeGroupLabel(groupLabel) == null),
      cutoff_at_semantics:
        acquisition.cutoffAtSource === "acquisition_based"
          ? "API-Football standings response did not expose a separate cutoff instant; cutoff_at_utc equals the acquisition instant."
          : null,
    },
    disagreement: {},
    rows,
  };
}

function buildSourceSnapshotMetadata(args: {
  repoRoot: string;
  dataset: Task2CWorldCupStandingsDataset;
  provider: ProviderStandingsResult;
  rawProviderPath: string;
}): Json {
  return stableValue({
    task_slice: TASK2C3_TASK_SLICE,
    provider: "api-football",
    provider_scope: args.provider.league,
    provider_diagnostics: args.provider.diagnostics,
    raw_provider_artifact_path: relativeToRepo(args.repoRoot, args.rawProviderPath),
    competition_key: args.dataset.competition_key,
    season_key: args.dataset.season_key,
    stage_key: args.dataset.stage_key,
    coverage: args.dataset.coverage,
  }) as Json;
}

function buildSourceSnapshotInsert(args: {
  repoRoot: string;
  dataset: Task2CWorldCupStandingsDataset;
  provider: ProviderStandingsResult;
  rawProviderPath: string;
}): DatabaseInsert<"source_snapshots"> {
  const payloadHash = sha256Json({
    dataset: args.dataset,
  });
  return {
    source_key: TASK2C3_SOURCE_KEY,
    snapshot_id: args.dataset.snapshot_id,
    data_kind: TASK2C_DATASET_KIND_BY_ROLE.world_cup_standings,
    source_url: buildSourceUrl(args.provider),
    local_fallback_path: relativeToRepo(args.repoRoot, path.dirname(args.rawProviderPath)),
    normalized_snapshot_path: relativeToRepo(
      args.repoRoot,
      path.join(path.dirname(args.rawProviderPath), "standings-package", TASK2C_DATASET_FILE_BY_ROLE.world_cup_standings),
    ),
    effective_at: args.dataset.effective_at_utc,
    captured_at: args.dataset.captured_at_utc,
    payload_hash: payloadHash,
    row_count: args.dataset.rows.length,
    metadata_json: buildSourceSnapshotMetadata(args),
  };
}

function buildManifest(args: {
  provider: ProviderStandingsResult;
  dataset: Task2CWorldCupStandingsDataset;
  sourceSnapshot: DatabaseInsert<"source_snapshots">;
  packageVersion: string;
  packageCreatedAtUtc: string | null;
}): Task2C3StandingsPackageManifest {
  const encodedDataset = stableStringify(args.dataset);
  const packageFiles: Task2C3PackageFileEntry[] = [
    {
      role: "world_cup_standings",
      file_name: TASK2C_DATASET_FILE_BY_ROLE.world_cup_standings,
      dataset_kind: TASK2C_DATASET_KIND_BY_ROLE.world_cup_standings,
      sha256: sha256Json(args.dataset),
      size_bytes: Buffer.byteLength(encodedDataset, "utf8"),
    },
  ];
  const manifestBase: Omit<Task2C3StandingsPackageManifest, "semantic_package_sha256"> = {
    schema_name: TASK2C3_MANIFEST_SCHEMA_NAME,
    schema_version: TASK2C3_MANIFEST_SCHEMA_VERSION,
    package_version: args.packageVersion,
    package_id: sha256Json({
      package_version: args.packageVersion,
      snapshot_id: args.dataset.snapshot_id,
      coverage: args.dataset.coverage,
    }),
    generated_at_utc: args.packageCreatedAtUtc,
    competition_key: TASK2C3_COMPETITION_KEY,
    season_key: TASK2C3_SEASON_KEY,
    stage_key: TASK2C3_STAGE_KEY,
    source_key: TASK2C3_SOURCE_KEY,
    target_canonical_team_keys: [...VALIDATION_CONTEXT.canonicalTeamKeys],
    coverage: args.dataset.coverage,
    provider_scope: {
      league_id: args.provider.league.providerLeagueId,
      league_name: args.provider.league.name,
      country: args.provider.league.country,
      season: args.provider.league.season,
    },
    package_files: packageFiles,
    datasets: [
      {
        role: "world_cup_standings" as const,
        file_name: TASK2C_DATASET_FILE_BY_ROLE.world_cup_standings,
        dataset_kind: TASK2C_DATASET_KIND_BY_ROLE.world_cup_standings,
        source_key: args.dataset.source_key,
        snapshot_id: args.dataset.snapshot_id,
        effective_at_utc: args.dataset.effective_at_utc,
        captured_at_utc: args.dataset.captured_at_utc,
        cutoff_at_utc: args.dataset.cutoff_at_utc,
        payload_hash: args.sourceSnapshot.payload_hash,
      },
    ],
  };

  return {
    ...manifestBase,
    semantic_package_sha256: sha256Json({
      manifest: manifestBase,
      dataset: args.dataset,
    }),
  };
}

function toComparableSourceSnapshot(row: DatabaseInsert<"source_snapshots">): Task2C3ComparableSourceSnapshot {
  return {
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
    metadata_json: stableValue(row.metadata_json) as Json,
  };
}

function toComparableStandingSnapshot(
  row: DatabaseInsert<"team_tournament_standing_snapshots">,
): Task2C3ComparableStandingSnapshot {
  return {
    source_snapshot_id: row.source_snapshot_id,
    competition_id: row.competition_id,
    season_id: row.season_id,
    stage_key: row.stage_key,
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
    source_reported_qualification_status: row.source_reported_qualification_status ?? null,
    effective_at: row.effective_at,
    captured_at: row.captured_at,
    cutoff_at: row.cutoff_at,
    reliability_json: stableValue(row.reliability_json) as Json,
    missing_data_json: stableValue(row.missing_data_json) as Json,
    disagreement_json: stableValue(row.disagreement_json) as Json,
  };
}

function sameSourceSnapshot(
  left: Task2C3ComparableSourceSnapshot,
  right: Task2C3ComparableSourceSnapshot,
): boolean {
  return stableStringify(left) === stableStringify(right);
}

function sameStandingSnapshot(
  left: Task2C3ComparableStandingSnapshot,
  right: Task2C3ComparableStandingSnapshot,
): boolean {
  return stableStringify(left) === stableStringify(right);
}

function buildPlanSummary(actions: Task2C3PlanAction[]): Record<Task2C3PlanAction, number> {
  return actions.reduce<Record<Task2C3PlanAction, number>>(
    (counts, action) => {
      counts[action] += 1;
      return counts;
    },
    { insert: 0, skip_identical: 0, conflict: 0, invalid: 0 },
  );
}

function buildPlanStableProjection(plan: Omit<Task2C3StandingsImportPlan, "generated_at_utc" | "stablePlanSha256">) {
  return stableValue(plan);
}

function validateStandingsPackage(pkg: Task2C3StandingsPackage): Task2C3ValidationResult {
  const findings: Task2CValidationFinding[] = [];
  const dataset = pkg.dataset;

  const pushFinding = (
    code: Task2CValidationFinding["code"],
    message: string,
    rowIdentity?: string,
    expected?: string | number | boolean | null,
    actual?: string | number | boolean | null,
  ) => {
    findings.push({
      severity: "error",
      code,
      fileRole: "world_cup_standings",
      filename: TASK2C_DATASET_FILE_BY_ROLE.world_cup_standings,
      path: TASK2C_DATASET_FILE_BY_ROLE.world_cup_standings,
      message,
      rowIdentity,
      expected,
      actual,
    });
  };

  if (dataset.competition_key !== TASK2C3_COMPETITION_KEY) {
    pushFinding("dataset_invalid_shape", "Standings competition_key is incorrect.", undefined, TASK2C3_COMPETITION_KEY, dataset.competition_key);
  }
  if (dataset.season_key !== TASK2C3_SEASON_KEY) {
    pushFinding("dataset_invalid_shape", "Standings season_key is incorrect.", undefined, TASK2C3_SEASON_KEY, dataset.season_key);
  }
  if (dataset.stage_key !== TASK2C3_STAGE_KEY) {
    pushFinding("dataset_invalid_shape", "Standings stage_key is incorrect.", undefined, TASK2C3_STAGE_KEY, dataset.stage_key);
  }
  if (Date.parse(dataset.effective_at_utc) > Date.parse(dataset.captured_at_utc)) {
    pushFinding("dataset_timestamp_order_invalid", "effective_at_utc must not be later than captured_at_utc.");
  }
  if (Date.parse(dataset.captured_at_utc) > Date.parse(dataset.cutoff_at_utc)) {
    pushFinding("dataset_timestamp_order_invalid", "captured_at_utc must not be later than cutoff_at_utc.");
  }
  const timestampSemantics = (dataset.reliability as Record<string, unknown> | null)?.timestamp_semantics as
    | Record<string, unknown>
    | undefined;
  if (timestampSemantics?.effective_precision !== "date") {
    pushFinding("dataset_invalid_shape", "Standings reliability.timestamp_semantics.effective_precision must be 'date'.");
  }
  if (timestampSemantics?.cutoff_at_source !== "acquisition_based") {
    pushFinding("dataset_invalid_shape", "Standings reliability.timestamp_semantics.cutoff_at_source must be 'acquisition_based' when no provider cutoff exists.");
  }
  if (dataset.coverage.status !== "complete" || dataset.coverage.missing_team_keys.length > 0) {
    pushFinding("dataset_coverage_mismatch", "Standings dataset must cover all 48 canonical teams.");
  }
  if (dataset.rows.length !== VALIDATION_CONTEXT.canonicalTeamKeys.length) {
    pushFinding(
      "dataset_value_invalid",
      "Standings dataset row count must equal the canonical team count.",
      undefined,
      VALIDATION_CONTEXT.canonicalTeamKeys.length,
      dataset.rows.length,
    );
  }

  const teamSeen = new Set<string>();
  const groupPositions = new Set<string>();
  for (const row of dataset.rows) {
    const rowIdentity = `${row.group_key}:${row.position}:${row.canonical_team_key}`;
    if (!VALIDATION_CONTEXT.canonicalTeamKeys.includes(row.canonical_team_key)) {
      pushFinding("dataset_unknown_team", "Unknown canonical team key in standings row.", rowIdentity, null, row.canonical_team_key);
    }
    if (!VALIDATION_CONTEXT.canonicalGroupKeys.includes(row.group_key)) {
      pushFinding("dataset_group_mismatch", "Unknown group key in standings row.", rowIdentity, null, row.group_key);
    }
    if (teamSeen.has(row.canonical_team_key)) {
      pushFinding("dataset_duplicate_team", "Canonical team appears more than once in standings rows.", rowIdentity);
    }
    teamSeen.add(row.canonical_team_key);

    const expectedGroup = VALIDATION_CONTEXT.teamGroupByKey[row.canonical_team_key];
    if (expectedGroup && expectedGroup !== row.group_key) {
      pushFinding("dataset_group_mismatch", "Standings row group does not match the canonical team group.", rowIdentity, expectedGroup, row.group_key);
    }

    const groupPositionKey = `${row.group_key}:${row.position}`;
    if (groupPositions.has(groupPositionKey)) {
      pushFinding("dataset_duplicate_group_position", "Group position is duplicated.", rowIdentity);
    }
    groupPositions.add(groupPositionKey);

    if (row.matches_played !== row.wins + row.draws + row.losses) {
      pushFinding("dataset_played_mismatch", "matches_played must equal wins + draws + losses.", rowIdentity);
    }
    if (row.goal_difference !== row.goals_for - row.goals_against) {
      pushFinding("dataset_goal_difference_mismatch", "goal_difference must equal goals_for - goals_against.", rowIdentity);
    }
    if (row.points !== row.wins * 3 + row.draws) {
      pushFinding("dataset_points_mismatch", "points must equal wins * 3 + draws.", rowIdentity);
    }
    if (row.position < 1 || row.position > 4) {
      pushFinding("dataset_rank_invalid", "Group-stage standings positions must be between 1 and 4.", rowIdentity);
    }
    if (
      row.source_reported_qualification_status !== null &&
      !TASK2C_ALLOWED_QUALIFICATION_STATUSES.includes(row.source_reported_qualification_status)
    ) {
      pushFinding(
        "dataset_qualification_status_invalid",
        "Invalid qualification status in standings row.",
        rowIdentity,
        TASK2C_ALLOWED_QUALIFICATION_STATUSES.join(","),
        String(row.source_reported_qualification_status),
      );
    }
    const expectedStatus = row.position <= 2 ? "qualified" : row.position >= 4 ? "eliminated" : null;
    if (expectedStatus && row.source_reported_qualification_status !== expectedStatus) {
      pushFinding(
        "dataset_qualification_status_invalid",
        "Qualification status must match final group placement.",
        rowIdentity,
        expectedStatus,
        row.source_reported_qualification_status,
      );
    }
  }

  const sortedFindings = findings.sort((left, right) => left.message.localeCompare(right.message));
  return {
    status: sortedFindings.length === 0 ? "verified" : "blocked",
    findings: sortedFindings,
    validatedPackage: sortedFindings.length === 0 ? pkg : null,
  };
}

export async function acquireTask2C3ProviderStandings(): Promise<ProviderStandingsResult> {
  return fetchApiFootballStandings({
    leagueId: TARGET_COMPETITION.leagueId,
    season: TARGET_COMPETITION.season,
  });
}

export function buildTask2C3StandingsPackage(args: {
  repoRoot: string;
  provider: ProviderStandingsResult;
  rawProviderPath: string;
  acquisition: Task2C3AcquisitionMetadata;
  packageVersion?: string;
  packageCreatedAtUtc?: string | null;
  competitionId: string;
  seasonId: string;
}): Task2C3StandingsPackage {
  const effectiveAtUtc = deriveEffectiveAtUtc(args.provider);
  const rows = buildStandingsRows(args.provider);
  const dataset = buildDataset(args.provider, rows, effectiveAtUtc, args.acquisition);
  const sourceSnapshot = buildSourceSnapshotInsert({
    repoRoot: args.repoRoot,
    dataset,
    provider: args.provider,
    rawProviderPath: args.rawProviderPath,
  });
  const standingSnapshots = dataset.rows.map((row) => ({
    source_snapshot_id: dataset.snapshot_id,
    competition_id: args.competitionId,
    season_id: args.seasonId,
    stage_key: dataset.stage_key,
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
    effective_at: dataset.effective_at_utc,
    captured_at: dataset.captured_at_utc,
    cutoff_at: dataset.cutoff_at_utc,
    reliability_json: row.reliability ?? {},
    missing_data_json: row.missing_data ?? {},
    disagreement_json: row.disagreement ?? {},
  }));
  const manifest = buildManifest({
    provider: args.provider,
    dataset,
    sourceSnapshot,
    packageVersion: args.packageVersion ?? TASK2C3_PACKAGE_VERSION,
    packageCreatedAtUtc: args.packageCreatedAtUtc ?? args.acquisition.capturedAtUtc,
  });

  const pkg: Task2C3StandingsPackage = {
    manifest,
    dataset,
    sourceSnapshot,
    standingSnapshots,
  };
  const validation = validateStandingsPackage(pkg);
  if (validation.status !== "verified") {
    throw new Error(`Task 2C.3 standings package validation failed: ${validation.findings.map((finding) => finding.message).join(" | ")}`);
  }
  return pkg;
}

export function writeTask2C3StandingsPackage(outputDir: string, pkg: Task2C3StandingsPackage): {
  manifestPath: string;
  manifestSha256: string;
} {
  ensureDirectory(outputDir);
  const datasetPath = path.join(outputDir, TASK2C_DATASET_FILE_BY_ROLE.world_cup_standings);
  const manifestPath = path.join(outputDir, TASK2C3_MANIFEST_FILE);
  writeJsonFile(datasetPath, pkg.dataset);
  writeJsonFile(manifestPath, pkg.manifest);
  return {
    manifestPath,
    manifestSha256: sha256File(manifestPath),
  };
}

export async function inspectTask2C3StageState(): Promise<Task2C3LocalState> {
  const supabase = createSupabaseScriptAdminClient();
  const competitionResult = await supabase
    .from("competitions")
    .select("id, slug")
    .eq("slug", TASK2C3_COMPETITION_KEY)
    .limit(1);
  if (competitionResult.error) {
    throw new Error(`Failed to resolve Task 2C.3 competition in stage: ${competitionResult.error.message}`);
  }

  const competitionId = competitionResult.data?.[0]?.id ?? null;
  const seasonResult = competitionId == null
    ? { data: [] as Array<{ id: string; competition_id: string; year: number }>, error: null }
    : await supabase
        .from("seasons")
        .select("id, competition_id, year")
        .eq("competition_id", competitionId)
        .eq("year", Number(TASK2C3_SEASON_KEY))
        .limit(1);
  if (seasonResult.error) {
    throw new Error(`Failed to resolve Task 2C.3 season in stage: ${seasonResult.error.message}`);
  }
  const seasonId = seasonResult.data?.[0]?.id ?? null;

  const sourceSnapshotsResult = await supabase
    .from("source_snapshots")
    .select(
      "source_key, snapshot_id, data_kind, source_url, local_fallback_path, normalized_snapshot_path, effective_at, captured_at, payload_hash, row_count, metadata_json",
    )
    .eq("data_kind", TASK2C_DATASET_KIND_BY_ROLE.world_cup_standings)
    .order("created_at", { ascending: false });
  if (sourceSnapshotsResult.error) {
    throw new Error(`Failed to inspect Task 2C.3 source snapshots in stage: ${sourceSnapshotsResult.error.message}`);
  }

  const standingsResult = await supabase
    .from("team_tournament_standing_snapshots")
    .select(
      "source_snapshot_id, competition_id, season_id, stage_key, group_key, canonical_team_key, position, matches_played, wins, draws, losses, goals_for, goals_against, goal_difference, points, source_reported_qualification_status, effective_at, captured_at, cutoff_at, reliability_json, missing_data_json, disagreement_json",
    )
    .eq("competition_id", competitionId ?? "00000000-0000-0000-0000-000000000000")
    .eq("season_id", seasonId ?? "00000000-0000-0000-0000-000000000000")
    .eq("stage_key", TASK2C3_STAGE_KEY);

  if (standingsResult.error) {
    const message = standingsResult.error.message;
    if (message.includes("schema cache")) {
      return {
        competitionId,
        seasonId,
        standingsTablePresent: false,
        standingsTablePresenceError: message,
        sourceSnapshots: (sourceSnapshotsResult.data ?? []).map((row) => ({
          source_key: row.source_key,
          snapshot_id: row.snapshot_id,
          data_kind: row.data_kind,
          source_url: row.source_url,
          local_fallback_path: row.local_fallback_path,
          normalized_snapshot_path: row.normalized_snapshot_path,
          effective_at: row.effective_at,
          captured_at: row.captured_at,
          payload_hash: row.payload_hash,
          row_count: row.row_count,
          metadata_json: stableValue(row.metadata_json) as Json,
        })),
        teamTournamentStandingSnapshots: [],
      };
    }
    throw new Error(`Failed to inspect Task 2C.3 standings rows in stage: ${message}`);
  }

  return {
    competitionId,
    seasonId,
    standingsTablePresent: true,
    standingsTablePresenceError: null,
    sourceSnapshots: (sourceSnapshotsResult.data ?? []).map((row) => ({
      source_key: row.source_key,
      snapshot_id: row.snapshot_id,
      data_kind: row.data_kind,
      source_url: row.source_url,
      local_fallback_path: row.local_fallback_path,
      normalized_snapshot_path: row.normalized_snapshot_path,
      effective_at: row.effective_at,
      captured_at: row.captured_at,
      payload_hash: row.payload_hash,
      row_count: row.row_count,
      metadata_json: stableValue(row.metadata_json) as Json,
    })),
    teamTournamentStandingSnapshots: (standingsResult.data ?? []).map((row) => ({
      source_snapshot_id: row.source_snapshot_id,
      competition_id: row.competition_id,
      season_id: row.season_id,
      stage_key: row.stage_key,
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
      effective_at: row.effective_at,
      captured_at: row.captured_at,
      cutoff_at: row.cutoff_at,
      reliability_json: stableValue(row.reliability_json) as Json,
      missing_data_json: stableValue(row.missing_data_json) as Json,
      disagreement_json: stableValue(row.disagreement_json) as Json,
    })),
  };
}

export async function inspectTask2C3KnockoutEvidence(args: {
  repoRoot: string;
  competitionId: string | null;
  seasonId: string | null;
}): Promise<Task2C3KnockoutEvidence> {
  const supabase = createSupabaseScriptAdminClient();
  if (!args.seasonId) {
    return {
      mode: "stage_probe",
      inspected_at_utc: new Date().toISOString(),
      matches_found: 0,
      result_rows_found: 0,
      known_fixture_targets: [...KNOWN_KNOCKOUT_FIXTURE_KEYS],
      preservation: {
        winner_flag_preserved_in_stage: false,
        extra_time_or_penalties_detail_preserved_in_stage: false,
      },
      notes: ["No season_id was available in stage, so no knockout evidence rows could be inspected."],
      classification_gap: false,
      known_fixtures: [],
      sample_matches: [],
      sample_results: [],
    };
  }

  const knownSlugs = KNOWN_KNOCKOUT_FIXTURES.map((fixture) => fixture.matchSlug);
  const knownMatchNumbers = KNOWN_KNOCKOUT_FIXTURES.map((fixture) => fixture.matchNumber);
  const matchesResult = await supabase
    .from("matches")
    .select("id, external_id, slug, stage, status, kickoff_at, source_note")
    .eq("season_id", args.seasonId)
    .in("slug", knownSlugs);
  if (matchesResult.error) {
    throw new Error(`Failed to inspect knockout matches in stage: ${matchesResult.error.message}`);
  }

  const officialMatchesResult = await supabase
    .from("official_schedule_matches")
    .select("id, official_match_number, stage_key, group_key, home_team_key, away_team_key, scheduled_at_utc")
    .in("official_match_number", knownMatchNumbers)
    .order("official_match_number", { ascending: true });
  if (officialMatchesResult.error) {
    throw new Error(`Failed to inspect known official schedule matches in stage: ${officialMatchesResult.error.message}`);
  }

  const officialMatchIds = (officialMatchesResult.data ?? []).map((row) => row.id);
  const officialLinksResult =
    officialMatchIds.length === 0
      ? { data: [] as Array<{ official_schedule_match_id: string; match_id: string | null; api_football_fixture_id: number | null; link_status: string; metadata_json: Json }>, error: null }
      : await supabase
          .from("official_schedule_match_links")
          .select("official_schedule_match_id, match_id, api_football_fixture_id, link_status, metadata_json")
          .in("official_schedule_match_id", officialMatchIds);
  if (officialLinksResult.error) {
    throw new Error(`Failed to inspect known official schedule match links in stage: ${officialLinksResult.error.message}`);
  }

  const linkedMatchIds = (officialLinksResult.data ?? [])
    .map((row) => row.match_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const stageMatchIds = [...new Set([...(matchesResult.data ?? []).map((row) => row.id), ...linkedMatchIds])];
  const resultsResult = stageMatchIds.length === 0
    ? { data: [] as Array<{ match_id: string; home_goals: number; away_goals: number; intake_source: string; source_note: string | null; recorded_at: string }>, error: null }
    : await supabase
        .from("match_results")
        .select("match_id, home_goals, away_goals, intake_source, source_note, recorded_at")
        .in("match_id", stageMatchIds);
  if (resultsResult.error) {
    throw new Error(`Failed to inspect knockout match results in stage: ${resultsResult.error.message}`);
  }

  return buildTask2C3KnockoutEvidenceReport({
    inspectedAtUtc: new Date().toISOString(),
    stageMatches: (matchesResult.data ?? []).map((row) => ({
      id: row.id,
      external_id: row.external_id,
      slug: row.slug,
      stage: row.stage,
      status: row.status,
      kickoff_at: row.kickoff_at,
      source_note: row.source_note,
    })),
    resultRows: (resultsResult.data ?? []).map((row) => ({
      match_id: row.match_id,
      home_goals: row.home_goals,
      away_goals: row.away_goals,
      intake_source: row.intake_source,
      source_note: row.source_note,
      recorded_at: row.recorded_at,
    })),
    officialScheduleMatches: (officialMatchesResult.data ?? []).map((row) => ({
      id: row.id,
      official_match_number: row.official_match_number,
      stage_key: row.stage_key,
      group_key: row.group_key,
      home_team_key: row.home_team_key,
      away_team_key: row.away_team_key,
      scheduled_at_utc: row.scheduled_at_utc,
    })),
    officialScheduleLinks: (officialLinksResult.data ?? []).map((row) => ({
      official_schedule_match_id: row.official_schedule_match_id,
      match_id: row.match_id,
      api_football_fixture_id: row.api_football_fixture_id,
      link_status: row.link_status,
      metadata_json: stableValue(row.metadata_json) as Json,
    })),
    providerSnapshotEvidence: loadTask2C3KnownProviderSnapshotEvidence(args.repoRoot),
  });
}

export function buildTask2C3KnockoutEvidenceReport(args: {
  inspectedAtUtc: string;
  stageMatches: Task2C3KnownStageMatch[];
  resultRows: Task2C3KnownResultRow[];
  officialScheduleMatches: Task2C3KnownOfficialScheduleMatch[];
  officialScheduleLinks: Task2C3KnownOfficialScheduleLink[];
  providerSnapshotEvidence: Map<number, Task2C3KnownProviderSnapshotFixture>;
}): Task2C3KnockoutEvidence {
  const stageMatchBySlug = new Map(args.stageMatches.map((row) => [row.slug, row] as const));
  const resultByMatchId = new Map(args.resultRows.map((row) => [row.match_id, row] as const));
  const officialByNumber = new Map(args.officialScheduleMatches.map((row) => [row.official_match_number, row] as const));
  const officialLinkByOfficialId = new Map(args.officialScheduleLinks.map((row) => [row.official_schedule_match_id, row] as const));

  const knownFixtures: Task2C3KnockoutEvidence["known_fixtures"] = KNOWN_KNOCKOUT_FIXTURES.map((fixture) => {
    const stageMatch = stageMatchBySlug.get(fixture.matchSlug) ?? null;
    const officialMatch = officialByNumber.get(fixture.matchNumber) ?? null;
    const officialLink = officialMatch ? officialLinkByOfficialId.get(officialMatch.id) ?? null : null;
    const matchId = stageMatch?.id ?? officialLink?.match_id ?? null;
    const result = matchId ? resultByMatchId.get(matchId) ?? null : null;
    const providerFixtureId =
      officialLink?.api_football_fixture_id ??
      (stageMatch?.external_id?.startsWith("api-football:fixture:") ? Number(stageMatch.external_id.split(":").at(-1)) : null) ??
      null;
    const providerEvidence = providerFixtureId != null ? args.providerSnapshotEvidence.get(providerFixtureId) ?? null : null;
    const hasKnockoutClassification =
      (stageMatch?.stage != null && stageMatch.stage !== TASK2C3_STAGE_KEY) ||
      (officialMatch?.stage_key != null && officialMatch.stage_key !== TASK2C3_STAGE_KEY);
    const classificationFinding =
      stageMatch == null
        ? "fixture_missing"
        : hasKnockoutClassification
          ? "fixture_exists_with_knockout_classification"
          : stageMatch.stage == null
            ? "fixture_exists_but_lacks_knockout_classification"
            : "fixture_exists_with_non_knockout_classification";

    return {
      canonical_fixture_id: String(fixture.fixtureKey),
      official_match_number: fixture.matchNumber,
      canonical_stage: String(fixture.stage),
      canonical_round_label: String(fixture.roundLabel),
      stage_match_id: matchId,
      external_id: stageMatch?.external_id ?? null,
      api_football_fixture_id: providerFixtureId,
      slug: fixture.matchSlug,
      stage_value: stageMatch?.stage ?? officialMatch?.stage_key ?? null,
      status: stageMatch?.status ?? null,
      kickoff_at: stageMatch?.kickoff_at ?? fixture.kickoffAt,
      result_exists: result != null,
      classification_finding: classificationFinding,
      provider_snapshot_evidence: {
        found: providerEvidence != null,
        provider_status_short: providerEvidence?.providerStatusShort ?? null,
        provider_round: providerEvidence?.competition?.round ?? null,
        regular_time_score_available: providerEvidence?.goals?.home != null && providerEvidence?.goals?.away != null,
        winner_identity_available: false,
        extra_time_score_available: false,
        penalty_score_available: false,
      },
    };
  });

  const notes: string[] = [];
  if (knownFixtures.some((fixture) => fixture.classification_finding !== "fixture_exists_with_knockout_classification")) {
    notes.push("Known fixtures were located, but their persisted stage/official classification remains group-stage rather than knockout.");
  }
  notes.push("match_results persists regular scorelines and source_note only; extra-time, penalties, provider winner identity, and advancing-team identity are not modeled explicitly.");
  notes.push("The preserved Task 2B provider snapshot retains round and statusShort plus regular goals, but not winner flags or extra-time/penalty score components.");

  return {
    mode: "stage_probe",
    inspected_at_utc: args.inspectedAtUtc,
    matches_found: args.stageMatches.length,
    result_rows_found: args.resultRows.length,
    known_fixture_targets: [...KNOWN_KNOCKOUT_FIXTURE_KEYS],
    preservation: {
      winner_flag_preserved_in_stage: false,
      extra_time_or_penalties_detail_preserved_in_stage: false,
    },
    notes,
    classification_gap: knownFixtures.some((fixture) => fixture.classification_finding !== "fixture_exists_with_knockout_classification"),
    known_fixtures: knownFixtures,
    sample_matches: args.stageMatches.map((row) => ({
      id: row.id,
      external_id: row.external_id,
      slug: row.slug,
      stage: row.stage ?? "",
      status: row.status ?? "",
      kickoff_at: row.kickoff_at,
    })),
    sample_results: args.resultRows.map((row) => ({
      match_id: row.match_id,
      home_goals: row.home_goals,
      away_goals: row.away_goals,
      intake_source: row.intake_source,
      source_note: row.source_note,
      recorded_at: row.recorded_at,
    })),
  };
}

function loadTask2C3KnownProviderSnapshotEvidence(repoRoot: string) {
  const snapshots: string[] = [];
  const root = path.resolve(repoRoot, "artifacts", "prediction-intelligence-v2", "task2b-2", "local-run");
  if (!pathExists(root)) {
    return new Map<number, Task2C3KnownProviderSnapshotFixture>();
  }

  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of pathExists(current) ? fs.readdirSync(current, { withFileTypes: true }) : []) {
      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(nextPath);
      } else if (/^task2b-2-provider-snapshot-.*\.json$/i.test(entry.name)) {
        snapshots.push(nextPath);
      }
    }
  }

  if (snapshots.length === 0) {
    return new Map<number, Task2C3KnownProviderSnapshotFixture>();
  }

  const evidence = new Map<number, Task2C3KnownProviderSnapshotFixture>();
  for (const snapshotPath of snapshots.sort()) {
    const parsed = readJsonFile<{ fixtures?: Array<{ providerFixtureId: number; providerStatusShort: string; competition: { round: string | null }; goals: { home: number | null; away: number | null } }> }>(snapshotPath);
    for (const fixture of parsed.fixtures ?? []) {
      evidence.set(fixture.providerFixtureId, fixture);
    }
  }

  return evidence;
}

function pathExists(targetPath: string): boolean {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

export function loadTask2C3ProviderStandingsFromRawCapture(filePath: string): {
  provider: ProviderStandingsResult;
  acquisition: Task2C3AcquisitionMetadata;
} {
  const capture = readJsonFile<Task2C3RawProviderCapture>(path.resolve(filePath));
  const response = (capture.payload as { response?: Array<{ league?: { id?: number; name?: string; country?: string | null; season?: number | null; standings?: Array<Array<Record<string, unknown>>> } }> }).response;
  const league = response?.[0]?.league;
  if (!league || !Array.isArray(league.standings) || typeof league.id !== "number" || typeof league.name !== "string") {
    throw new Error(`Task 2C.3 raw provider capture is not a usable API-Football standings payload: ${filePath}`);
  }

  const provider: ProviderStandingsResult = {
    league: {
      providerLeagueId: league.id,
      name: league.name,
      country: league.country ?? null,
      season: league.season ?? null,
    },
    groups: league.standings.map((groupRows) => {
      const first = groupRows[0] as { group?: string } | undefined;
      return {
        groupLabel: typeof first?.group === "string" ? first.group : "Unknown",
        rows: groupRows.map((row) => {
          const typed = row as {
            rank?: number;
            team?: { id?: number; name?: string; logo?: string | null };
            points?: number;
            goalsDiff?: number;
            group?: string;
            form?: string | null;
            status?: string | null;
            description?: string | null;
            all?: { played?: number; win?: number; draw?: number; lose?: number; goals?: { for?: number; against?: number } };
            home?: { played?: number; win?: number; draw?: number; lose?: number; goals?: { for?: number; against?: number } };
            away?: { played?: number; win?: number; draw?: number; lose?: number; goals?: { for?: number; against?: number } };
            update?: string | null;
          };
          if (
            typeof typed.rank !== "number" ||
            typeof typed.team?.id !== "number" ||
            typeof typed.team?.name !== "string" ||
            typeof typed.points !== "number" ||
            typeof typed.goalsDiff !== "number" ||
            typeof typed.group !== "string"
          ) {
            throw new Error(`Task 2C.3 raw provider capture contains a malformed standings row: ${filePath}`);
          }
          return {
            rank: typed.rank,
            team: {
              providerTeamId: typed.team.id,
              name: typed.team.name,
              logo: typed.team.logo ?? null,
            },
            points: typed.points,
            goalsDiff: typed.goalsDiff,
            group: typed.group,
            form: typed.form ?? null,
            status: typed.status ?? null,
            description: typed.description ?? null,
            all: {
              played: typed.all?.played ?? 0,
              win: typed.all?.win ?? 0,
              draw: typed.all?.draw ?? 0,
              lose: typed.all?.lose ?? 0,
              goals: {
                for: typed.all?.goals?.for ?? 0,
                against: typed.all?.goals?.against ?? 0,
              },
            },
            home: {
              played: typed.home?.played ?? 0,
              win: typed.home?.win ?? 0,
              draw: typed.home?.draw ?? 0,
              lose: typed.home?.lose ?? 0,
              goals: {
                for: typed.home?.goals?.for ?? 0,
                against: typed.home?.goals?.against ?? 0,
              },
            },
            away: {
              played: typed.away?.played ?? 0,
              win: typed.away?.win ?? 0,
              draw: typed.away?.draw ?? 0,
              lose: typed.away?.lose ?? 0,
              goals: {
                for: typed.away?.goals?.for ?? 0,
                against: typed.away?.goals?.against ?? 0,
              },
            },
            update: typed.update ?? null,
          };
        }),
      };
    }),
    diagnostics: {
      endpoint: capture.logical_endpoint,
      query: capture.request_parameters,
      results: (capture.payload as { results?: number }).results ?? null,
      errors: Array.isArray((capture.payload as { errors?: unknown }).errors)
        ? ((capture.payload as { errors?: string[] }).errors ?? [])
        : [],
      paging: (capture.payload as { paging?: { current?: number; total?: number } }).paging
        ? {
            current: (capture.payload as { paging?: { current?: number; total?: number } }).paging?.current ?? null,
            total: (capture.payload as { paging?: { current?: number; total?: number } }).paging?.total ?? null,
          }
        : null,
    },
    httpStatus: capture.http_status,
    rawPayload: capture.payload,
  };

  const artifactTimestamp = inferCapturedAtUtcFromArtifactPath(filePath);
  const capturedAtUtc = artifactTimestamp ?? capture.captured_at_utc;
  return {
    provider,
    acquisition: {
      capturedAtUtc,
      cutoffAtUtc: capturedAtUtc,
      capturedAtSource: artifactTimestamp ? "artifact_run_dir_timestamp" : (capture.captured_at_source ?? "raw_capture_metadata"),
      cutoffAtSource: "acquisition_based",
      effectivePrecision: "date",
    },
  };
}

export function planTask2C3StandingsImport(args: {
  standingsPackage: Task2C3StandingsPackage;
  currentState: Task2C3LocalState;
  standingsPackageManifestPath: string;
  standingsPackageManifestSha256: string;
}): Task2C3StandingsImportPlan {
  const globalBlockers: string[] = [];
  if (!args.currentState.competitionId) {
    globalBlockers.push("stage_competition_missing");
  }
  if (!args.currentState.seasonId) {
    globalBlockers.push("stage_season_missing");
  }
  if (!args.currentState.standingsTablePresent) {
    globalBlockers.push("stage_team_tournament_standing_snapshots_missing");
  }

  const sourceSnapshotExpected = args.standingsPackage.sourceSnapshot;
  const sourceSnapshotNaturalKey = sourceSnapshotExpected.snapshot_id;
  const existingSourceSnapshot =
    args.currentState.sourceSnapshots.find((row) => row.snapshot_id === sourceSnapshotNaturalKey) ?? null;
  const sourceSnapshotComparable = toComparableSourceSnapshot(sourceSnapshotExpected);
  const sourceSnapshotAction: Task2C3PlanAction =
    existingSourceSnapshot == null
      ? "insert"
      : sameSourceSnapshot(existingSourceSnapshot, sourceSnapshotComparable)
        ? "skip_identical"
        : "conflict";
  const sourceSnapshots: Task2C3SourceSnapshotPlanRow[] = [
    {
      action: sourceSnapshotAction,
      naturalKey: sourceSnapshotNaturalKey,
      reason:
        sourceSnapshotAction === "insert"
          ? "Source snapshot natural key is not present in stage."
          : sourceSnapshotAction === "skip_identical"
            ? "Stage already contains an identical standings source snapshot."
            : "Stage contains a source snapshot with the same natural key but different payload.",
      expected: sourceSnapshotExpected,
      existing: existingSourceSnapshot,
    },
  ];

  const standingSnapshots = args.standingsPackage.standingSnapshots.map((expected) => {
    const naturalKey = [
      expected.source_snapshot_id,
      expected.competition_id,
      expected.season_id,
      expected.stage_key,
      expected.group_key,
      expected.canonical_team_key,
    ].join("|");
    const existing =
      args.currentState.teamTournamentStandingSnapshots.find(
        (row) =>
          row.source_snapshot_id === expected.source_snapshot_id &&
          row.competition_id === expected.competition_id &&
          row.season_id === expected.season_id &&
          row.stage_key === expected.stage_key &&
          row.group_key === expected.group_key &&
          row.canonical_team_key === expected.canonical_team_key,
      ) ?? null;
    const comparable = toComparableStandingSnapshot(expected);
    const action: Task2C3PlanAction =
      existing == null
        ? "insert"
        : sameStandingSnapshot(existing, comparable)
          ? "skip_identical"
          : "conflict";

    return {
      action,
      naturalKey,
      reason:
        !args.currentState.standingsTablePresent && action === "insert"
          ? "Stage standings table is absent, so this row is planned locally only."
          : !args.currentState.standingsTablePresent && action === "skip_identical"
            ? "Stage standings table is absent, but the local rerun simulation already contains an identical row."
            : action === "insert"
              ? "Standing snapshot natural key is not present in stage."
              : action === "skip_identical"
                ? "Stage already contains an identical standing snapshot row."
                : "Stage contains a standing snapshot row with the same natural key but different values.",
      expected,
      existing,
    } satisfies Task2C3StandingSnapshotPlanRow;
  });

  const sourceSummary = buildPlanSummary(sourceSnapshots.map((row) => row.action));
  const standingsSummary = buildPlanSummary(standingSnapshots.map((row) => row.action));
  const planBase = {
    schema_name: TASK2C3_PLAN_SCHEMA_NAME,
    schema_version: TASK2C3_PLAN_SCHEMA_VERSION,
    task_slice: TASK2C3_TASK_SLICE,
    package_manifest_path: args.standingsPackageManifestPath,
    package_manifest_sha256: args.standingsPackageManifestSha256,
    standingsTablePresent: args.currentState.standingsTablePresent,
    globalBlockers,
    summary: {
      sourceSnapshots: sourceSummary,
      teamTournamentStandingSnapshots: standingsSummary,
      totals: {
        insert: sourceSummary.insert + standingsSummary.insert,
        skip_identical: sourceSummary.skip_identical + standingsSummary.skip_identical,
        conflict: sourceSummary.conflict + standingsSummary.conflict,
        invalid: sourceSummary.invalid + standingsSummary.invalid,
      },
    },
    sourceSnapshots,
    teamTournamentStandingSnapshots: standingSnapshots,
  } satisfies Omit<Task2C3StandingsImportPlan, "generated_at_utc" | "stablePlanSha256">;

  return {
    ...planBase,
    generated_at_utc: new Date().toISOString(),
    stablePlanSha256: sha256Json(buildPlanStableProjection(planBase)),
  };
}

export function applyTask2C3StandingsPlanToLocalState(
  currentState: Task2C3LocalState,
  plan: Task2C3StandingsImportPlan,
): Task2C3LocalState {
  const sourceSnapshots = [...currentState.sourceSnapshots];
  const teamTournamentStandingSnapshots = [...currentState.teamTournamentStandingSnapshots];

  for (const row of plan.sourceSnapshots) {
    if (row.action === "insert") {
      sourceSnapshots.push(toComparableSourceSnapshot(row.expected));
    }
  }
  for (const row of plan.teamTournamentStandingSnapshots) {
    if (row.action === "insert") {
      teamTournamentStandingSnapshots.push(toComparableStandingSnapshot(row.expected));
    }
  }

  return {
    ...currentState,
    sourceSnapshots: sourceSnapshots.sort((left, right) => left.snapshot_id.localeCompare(right.snapshot_id)),
    teamTournamentStandingSnapshots: teamTournamentStandingSnapshots.sort(
      (left, right) =>
        left.group_key.localeCompare(right.group_key) ||
        left.position - right.position ||
        left.canonical_team_key.localeCompare(right.canonical_team_key),
    ),
  };
}

export function buildDefaultTask2C3ArtifactsDir(repoRoot: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(repoRoot, "artifacts", "prediction-intelligence-v2", "task2c-3", "local-run", day, stamp);
}

export function assertTask2C3LocalRunPreflight(repoRoot: string, artifactsDir: string): void {
  const resolvedArtifactsDir = path.resolve(artifactsDir);
  const allowedRoot = path.resolve(repoRoot, "artifacts", "prediction-intelligence-v2", "task2c-3", "local-run");
  const relative = path.relative(allowedRoot, resolvedArtifactsDir);
  if (relative === "" || relative === "." || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Task 2C.3 local run refused because artifactsDir must resolve inside ${allowedRoot}${path.sep}.`);
  }
}

export function writeTask2C3DryRunArtifacts(args: {
  repoRoot: string;
  artifactsDir: string;
  provider: ProviderStandingsResult;
  knockoutEvidence: Task2C3KnockoutEvidence;
  standingsPackage: Task2C3StandingsPackage;
  plan: Task2C3StandingsImportPlan;
  rerunPlan: Task2C3StandingsImportPlan;
}): Task2C3DryRunArtifact {
  ensureDirectory(args.artifactsDir);
  const rawProviderPath = path.join(args.artifactsDir, TASK2C3_PROVIDER_EVIDENCE_FILE);
  const knockoutEvidencePath = path.join(args.artifactsDir, TASK2C3_KNOCKOUT_EVIDENCE_FILE);
  const packageDir = path.join(args.artifactsDir, "standings-package");
  const planPath = path.join(args.artifactsDir, "task2c3-standings-import-dry-run.json");
  const rerunPlanPath = path.join(args.artifactsDir, "task2c3-standings-import-rerun.json");

  const rawPayloadSha256 = sha256Json(args.provider.rawPayload);
  const normalizedPayloadSha256 = sha256Json(args.standingsPackage.dataset);
  const rawProviderCapture: Task2C3RawProviderCapture = {
    schema_name: "prediction-intelligence-v2-task2c3-raw-provider-capture",
    schema_version: "1.0.0",
    provider: "api-football",
    logical_endpoint: args.provider.diagnostics.endpoint,
    request_parameters: args.provider.diagnostics.query,
    competition_identity: {
      league_id: args.provider.league.providerLeagueId,
      league_name: args.provider.league.name,
      country: args.provider.league.country,
    },
    season_identity: {
      season: args.provider.league.season,
    },
    effective_precision: "date",
    captured_at_source:
      ((args.standingsPackage.dataset.reliability as Record<string, unknown>)?.timestamp_semantics as Record<string, unknown> | undefined)
        ?.captured_at_source as Task2C3AcquisitionMetadata["capturedAtSource"] | undefined,
    cutoff_at_source:
      ((args.standingsPackage.dataset.reliability as Record<string, unknown>)?.timestamp_semantics as Record<string, unknown> | undefined)
        ?.cutoff_at_source as Task2C3AcquisitionMetadata["cutoffAtSource"] | undefined,
    effective_at_utc: args.standingsPackage.dataset.effective_at_utc,
    captured_at_utc: args.standingsPackage.dataset.captured_at_utc,
    cutoff_at_utc: args.standingsPackage.dataset.cutoff_at_utc,
    http_status: args.provider.httpStatus,
    raw_response_sha256: rawPayloadSha256,
    normalized_payload_sha256: normalizedPayloadSha256,
    coverage: args.standingsPackage.dataset.coverage,
    missing_data: args.standingsPackage.dataset.missing_data,
    disagreement: args.standingsPackage.dataset.disagreement,
    payload: args.provider.rawPayload,
  };
  writeJsonFile(rawProviderPath, rawProviderCapture);
  writeJsonFile(knockoutEvidencePath, args.knockoutEvidence);
  const { manifestPath, manifestSha256 } = writeTask2C3StandingsPackage(packageDir, args.standingsPackage);
  writeJsonFile(planPath, args.plan);
  writeJsonFile(rerunPlanPath, args.rerunPlan);

  return {
    rawProviderPath,
    rawProviderSha256: sha256File(rawProviderPath),
    knockoutEvidencePath,
    standingsPackageManifestPath: manifestPath,
    standingsPackageManifestSha256: manifestSha256,
    planPath,
    rerunPlanPath,
  };
}

export function loadTask2C3Plan(filePath: string): Task2C3StandingsImportPlan {
  return readJsonFile<Task2C3StandingsImportPlan>(path.resolve(filePath));
}
