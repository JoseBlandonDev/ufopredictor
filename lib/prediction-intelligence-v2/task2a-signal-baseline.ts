import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { WORLD_CUP_2026_TEAMS } from "../world-cup-2026/canonical-teams";
import { createSupabaseScriptAdminClient } from "../supabase/script-admin";
import {
  buildSignalSnapshots,
  loadTask1Datasets,
  resolveDefaultPreparedPaths,
  type PreparedPaths,
  type TeamSignalSnapshot,
} from "./task1";

const TASK2A_SCHEMA_NAME = "prediction-intelligence-v2-task2a-signal-baseline";
const TASK2A_SCHEMA_VERSION = "1.0.0";
const EXPECTED_PREPARED_CUTOFF = "2026-06-20";
const CANONICAL_SIGNAL_CUTOFF_AT = "2026-06-21T00:00:00Z";
const STAGE_PROJECT_REF: string = "yfmklapgjrupctgxaako";
const PRODUCTION_DENY_PROJECT_REF: string = "gcpdffkgsdomzyoenalg";

type ManifestStatus = "verified" | "blocked";
type Mode = "dry_run" | "apply" | "verification";
export type Task2APlanState = "fresh" | "exact_complete" | "partial_or_conflicting";

type JsonRecord = Record<string, unknown>;

type PackageManifest = {
  package_name: string;
  package_version: string;
  generated_at_utc: string;
  snapshot_date: string;
  package_files: Array<{
    path: string;
    sha256: string;
    size_bytes: number;
  }>;
};

type SourceRegistry = {
  snapshot_date: string;
  sources: Array<{
    source_key: string;
    local_fallback_file: string | null;
    normalized_snapshot_file: string | null;
  }>;
};

type VerifiedSourceFile = {
  absolutePath: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
  manifestSha256: string | null;
  manifestStatus: "verified" | "missing_from_manifest" | "hash_mismatch";
};

type VerifiedPreparedSources = {
  status: ManifestStatus;
  packageManifest: PackageManifest;
  registry: SourceRegistry;
  files: VerifiedSourceFile[];
};

type ExpectedRootFileHashes = {
  packageManifestSha256: string;
  sourceRegistrySha256: string;
};

type Task2ASignalBaselineAuthorization = {
  mode: Mode;
  projectRef: string;
  denyProjectRef: string;
  supabaseUrlHost: string;
  targetEnvironment: string;
  productionDenied: true;
  allowRemoteDevWrite: boolean;
};

type RemoteCanonicalTeamLinkRow = {
  id: string;
  canonical_team_key: string;
  team_id: string | null;
  api_football_team_id: number | null;
  runtime_team_slug: string | null;
  link_status: "linked" | "candidate" | "unresolved";
  metadata_json: unknown;
  created_at: string;
  updated_at: string;
};

type RemoteTeamRow = {
  id: string;
  slug: string;
  name: string;
};

type RemoteSourceSnapshotRow = {
  snapshot_id: string;
  source_key: string;
  payload_hash: string;
};

type RemoteSignalSnapshotRow = {
  id: string;
  signal_version: string;
  cutoff_at: string;
  canonical_team_key: string;
  sample_sizes: unknown;
  structural_strength: unknown;
  recent_form: unknown;
  opponent_adjusted_form: unknown;
  tournament_form: unknown;
  attack: unknown;
  defense: unknown;
  performance_vs_expectation: unknown;
  reliability: unknown;
  source_snapshot_ids: unknown;
  created_at: string;
};

type RemoteMatchRow = {
  id: string;
  slug: string;
  kickoff_at: string;
  stage: string | null;
  status: string | null;
};

type RemoteOfficialScheduleMatchRow = {
  id: string;
  official_match_number: number;
  home_team_key: string | null;
  away_team_key: string | null;
  scheduled_at_utc: string;
};

type RemoteOfficialScheduleMatchLinkRow = {
  official_schedule_match_id: string;
  match_id: string | null;
  api_football_fixture_id: number | null;
  link_status: "linked" | "candidate" | "unresolved";
};

export type Task2ARemoteState = {
  sourceSnapshots: RemoteSourceSnapshotRow[];
  canonicalTeamLinks: RemoteCanonicalTeamLinkRow[];
  teams: RemoteTeamRow[];
  matches: RemoteMatchRow[];
  officialScheduleMatches: RemoteOfficialScheduleMatchRow[];
  officialScheduleMatchLinks: RemoteOfficialScheduleMatchLinkRow[];
  signalSnapshots: RemoteSignalSnapshotRow[];
};

export type PersistedSignalSnapshotRow = {
  signal_version: string;
  cutoff_at: string;
  canonical_team_key: string;
  sample_sizes: JsonRecord;
  structural_strength: JsonRecord;
  recent_form: JsonRecord;
  opponent_adjusted_form: JsonRecord;
  tournament_form: JsonRecord;
  attack: JsonRecord;
  defense: JsonRecord;
  performance_vs_expectation: JsonRecord;
  reliability: JsonRecord;
  source_snapshot_ids: string[];
};

export type Task2ASignalRowEvidence = {
  canonicalTeamKey: string;
  runtimeTeamSlug: string;
  signalVersion: string;
  cutoffAt: string;
  payload: PersistedSignalSnapshotRow;
  reportOnly: {
    missingRequiredSignals: string[];
    missingOptionalSignals: string[];
    contradictionFlags: string[];
    displayNameEn: string;
    displayNameEs: string;
    eloAtCutoff: number | null;
    eloResolutionMethod: TeamSignalSnapshot["eloResolutionMethod"];
    eloReliability: number;
    fifaAtCutoff: number | null;
    diagnosticEffectiveStrength: TeamSignalSnapshot["diagnostic_effective_strength"];
  };
};

export type Task2APlanRow = {
  canonicalTeamKey: string;
  runtimeTeamSlug: string;
  action: "insert" | "already_identical" | "conflict" | "unexpected_existing";
  idempotencyKey: string;
  payload: PersistedSignalSnapshotRow;
  existingPayload: PersistedSignalSnapshotRow | null;
  reportOnly: Task2ASignalRowEvidence["reportOnly"];
  sourceSnapshotIds: string[];
  reasons: string[];
};

export type Task2AFixtureCoverageRow = {
  fixture_id: string;
  official_match_number: number;
  scheduled_at_utc: string;
  home_team_key: string;
  away_team_key: string;
  signal_version_required: string;
  home_signal_cutoff: string | null;
  away_signal_cutoff: string | null;
  home_source_snapshot_ids: string[];
  away_source_snapshot_ids: string[];
  home_reliability: number | null;
  away_reliability: number | null;
  home_missing_required: string[];
  away_missing_required: string[];
  home_missing_optional: string[];
  away_missing_optional: string[];
  baseline_signal_ready: boolean;
  candidate_ready: false;
  candidate_ready_reason: "requires_incremental_current_refresh";
};

type Task2ACoverageSummary = {
  runtimeFixtureCount: number;
  baselineReadyCount: number;
  candidateReadyCount: number;
};

export type Task2ASignalBaselinePlan = {
  schemaName: string;
  schemaVersion: string;
  generatedAt: string;
  mode: Mode;
  targetProjectRef: string;
  deniedProjectRef: string;
  preparedCutoff: string;
  signalVersion: string;
  cutoffAt: string;
  sourceManifest: {
    packageName: string;
    packageVersion: string;
    packageSnapshotDate: string;
    packageManifestSha256: string;
    sourceRegistrySha256: string;
  };
  manifestStatus: ManifestStatus;
  sourceFiles: VerifiedSourceFile[];
  expectedSourceSnapshotIds: string[];
  expectedTeamKeys: string[];
  expectedRuntimeTeamSlugs: string[];
  expectedPriorState: Task2APlanState;
  stageFoundation: {
    canonicalLinkCount: number;
    linkedWorldCupTeamCount: number;
    runtimeMatchCount: number;
    officialScheduleLinkCount: number;
  };
  summary: {
    state: Task2APlanState;
    expectedSignalRowCount: number;
    insertCount: number;
    identicalCount: number;
    conflictCount: number;
    unexpectedExistingCount: number;
    zeroWriteConfirmation: boolean;
  };
  rows: Task2APlanRow[];
  coverageSummary: Task2ACoverageSummary;
  blockers: string[];
  conflicts: string[];
  stablePlanSha256: string;
};

type Task2AStablePlanPayload = {
  schemaName: string;
  schemaVersion: string;
  targetProjectRef: string;
  deniedProjectRef: string;
  preparedCutoff: string;
  signalVersion: string;
  cutoffAt: string;
  sourceManifest: Task2ASignalBaselinePlan["sourceManifest"];
  manifestStatus: ManifestStatus;
  sourceFiles: Array<Pick<VerifiedSourceFile, "relativePath" | "sha256" | "sizeBytes" | "manifestSha256" | "manifestStatus">>;
  expectedSourceSnapshotIds: string[];
  expectedTeamKeys: string[];
  expectedRuntimeTeamSlugs: string[];
  expectedPriorState: Task2APlanState;
  stageFoundation: Task2ASignalBaselinePlan["stageFoundation"];
  summary: Omit<Task2ASignalBaselinePlan["summary"], "zeroWriteConfirmation">;
  rows: Array<{
    canonicalTeamKey: string;
    runtimeTeamSlug: string;
    action: Task2APlanRow["action"];
    idempotencyKey: string;
    payload: PersistedSignalSnapshotRow;
    existingPayload: PersistedSignalSnapshotRow | null;
    reasons: string[];
  }>;
  blockers: string[];
  conflicts: string[];
};

export type Task2AApplyResult = {
  requestedState: Task2APlanState;
  insertedCount: number;
  identicalCount: number;
  conflictCount: number;
};

type Task2ADatabaseAdapter = {
  readFoundationState(): Promise<Omit<Task2ARemoteState, "signalSnapshots">>;
  readSignalSnapshots(signalVersion: string, cutoffAt: string): Promise<RemoteSignalSnapshotRow[]>;
  insertSignalSnapshots(rows: PersistedSignalSnapshotRow[]): Promise<void>;
};

type RunTask2AInput = {
  repoRoot: string;
  preparedDir: string;
  artifactsDir: string;
  projectRef: string;
  denyProjectRef: string;
  dryRun: boolean;
  apply: boolean;
  verify: boolean;
  reviewedPlanPath?: string | null;
  reviewedStablePlanSha256?: string | null;
};

type RunTask2AResult = {
  plan: Task2ASignalBaselinePlan;
  artifactPath: string;
  coverageArtifactPath: string;
  applyResult: Task2AApplyResult | null;
};

export type Task2APlanEligibility = {
  eligible: boolean;
  reasons: string[];
};

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableValue(entry));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
    return Object.fromEntries(entries.map(([key, entry]) => [key, stableValue(entry)]));
  }

  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function normalizeStringArray(values: Iterable<string>): string[] {
  return Array.from(
    new Set(
      Array.from(values)
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function normalizeRelativePath(value: string | null): string | null {
  return value == null ? null : path.normalize(value);
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function sha256File(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function collectSemanticDiffPaths(left: unknown, right: unknown, basePath = "", limit = 12): string[] {
  if (limit <= 0) {
    return [];
  }

  if (stableStringify(left) === stableStringify(right)) {
    return [];
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const paths: string[] = [];
    const maxLength = Math.max(left.length, right.length);
    for (let index = 0; index < maxLength && paths.length < limit; index += 1) {
      const childPath = `${basePath}[${index}]`;
      if (index >= left.length || index >= right.length) {
        paths.push(childPath);
        continue;
      }
      paths.push(...collectSemanticDiffPaths(left[index], right[index], childPath, limit - paths.length));
    }
    return paths.length > 0 ? paths : [basePath || "$"];
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort((a, b) => a.localeCompare(b));
    const paths: string[] = [];
    for (const key of keys) {
      if (paths.length >= limit) {
        break;
      }
      const childPath = basePath ? `${basePath}.${key}` : key;
      if (!(key in left) || !(key in right)) {
        paths.push(childPath);
        continue;
      }
      paths.push(...collectSemanticDiffPaths(left[key], right[key], childPath, limit - paths.length));
    }
    return paths.length > 0 ? paths : [basePath || "$"];
  }

  return [basePath || "$"];
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function ensureDirectory(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath: string, payload: unknown): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function buildDefaultArtifactsDir(repoRoot: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(repoRoot, "artifacts", "prediction-intelligence-v2", "task2a", "local-run", day, stamp);
}

export function resolveTask2ASignalBaselineDefaults(repoRoot: string) {
  const task1Defaults = resolveDefaultPreparedPaths(repoRoot);
  return {
    preparedDir: task1Defaults.preparedDir,
    artifactsDir: buildDefaultArtifactsDir(repoRoot),
  };
}

function buildPreparedSourceFiles(preparedDir: string): string[] {
  return [
    "package-manifest.json",
    "source-registry.json",
    path.join("contracts", "canonical-source-contracts.json"),
    path.join("reference", "team-aliases.csv"),
    path.join("reference", "team-localizations-es-en.csv"),
    path.join("reference", "world-cup-2026-venues.csv"),
    path.join("reference", "world-cup-2026-schedule.json"),
    path.join("normalized-snapshot", "elo-ranking-2026-06-20.csv"),
    path.join("normalized-snapshot", "elo-ranking-start-2026.csv"),
    path.join("normalized-snapshot", "fifa-ranking-2026-06-11-captured-2026-06-20.csv"),
    path.join("normalized-snapshot", "elo-results-2025.csv"),
    path.join("normalized-snapshot", "elo-results-2026-window.csv"),
  ].map((relativePath) => path.resolve(preparedDir, relativePath));
}

function canonicalizeSemanticTimestamp(value: string, fieldPath: string): string {
  const epochMs = Date.parse(value);
  if (Number.isNaN(epochMs)) {
    throw new Error(`Invalid semantic timestamp at ${fieldPath}: ${value}`);
  }

  return new Date(epochMs).toISOString();
}

function normalizeComparablePayload(row: PersistedSignalSnapshotRow): PersistedSignalSnapshotRow {
  return {
    signal_version: row.signal_version,
    cutoff_at: canonicalizeSemanticTimestamp(row.cutoff_at, `signal_snapshot.${row.canonical_team_key}.cutoff_at`),
    canonical_team_key: row.canonical_team_key,
    sample_sizes: stableValue(row.sample_sizes) as JsonRecord,
    structural_strength: stableValue(row.structural_strength) as JsonRecord,
    recent_form: stableValue(row.recent_form) as JsonRecord,
    opponent_adjusted_form: stableValue(row.opponent_adjusted_form) as JsonRecord,
    tournament_form: stableValue(row.tournament_form) as JsonRecord,
    attack: stableValue(row.attack) as JsonRecord,
    defense: stableValue(row.defense) as JsonRecord,
    performance_vs_expectation: stableValue(row.performance_vs_expectation) as JsonRecord,
    reliability: stableValue(row.reliability) as JsonRecord,
    source_snapshot_ids: [...row.source_snapshot_ids].sort(),
  };
}

function buildCanonicalPersistedReliability(snapshot: TeamSignalSnapshot): JsonRecord {
  return stableValue({
    ...snapshot.reliability,
    contradiction_flags: [],
    elo_reliability: snapshot.eloReliability,
    elo_resolution_method: snapshot.eloResolutionMethod,
    elo_source_snapshot_ids: normalizeStringArray(snapshot.eloSourceSnapshotIds),
    missing_optional_signals: normalizeStringArray(snapshot.missingOptionalSignals),
    missing_required_signals: [],
  }) as JsonRecord;
}

function toPersistedSignalSnapshotRow(snapshot: TeamSignalSnapshot): PersistedSignalSnapshotRow {
  return normalizeComparablePayload({
    signal_version: snapshot.signal_version,
    cutoff_at: snapshot.cutoff_at,
    canonical_team_key: snapshot.canonical_team_key,
    sample_sizes: snapshot.sample_sizes,
    structural_strength: snapshot.structural_strength,
    recent_form: snapshot.recent_form,
    opponent_adjusted_form: {
      recent_opponent_adjusted_form: snapshot.diagnostic_effective_strength.recent_opponent_adjusted_form,
    },
    tournament_form: snapshot.tournament_form,
    attack: snapshot.attack,
    defense: snapshot.defense,
    performance_vs_expectation: snapshot.performance_vs_expectation,
    reliability: buildCanonicalPersistedReliability(snapshot),
    source_snapshot_ids: snapshot.source_snapshot_ids,
  });
}

function fromRemoteSignalSnapshotRow(row: RemoteSignalSnapshotRow): PersistedSignalSnapshotRow {
  return normalizeComparablePayload({
    signal_version: row.signal_version,
    cutoff_at: row.cutoff_at,
    canonical_team_key: row.canonical_team_key,
    sample_sizes: (row.sample_sizes ?? {}) as JsonRecord,
    structural_strength: (row.structural_strength ?? {}) as JsonRecord,
    recent_form: (row.recent_form ?? {}) as JsonRecord,
    opponent_adjusted_form: (row.opponent_adjusted_form ?? {}) as JsonRecord,
    tournament_form: (row.tournament_form ?? {}) as JsonRecord,
    attack: (row.attack ?? {}) as JsonRecord,
    defense: (row.defense ?? {}) as JsonRecord,
    performance_vs_expectation: (row.performance_vs_expectation ?? {}) as JsonRecord,
    reliability: (row.reliability ?? {}) as JsonRecord,
    source_snapshot_ids: Array.isArray(row.source_snapshot_ids) ? row.source_snapshot_ids.map(String) : [],
  });
}

export function compareSignalRowsExact(left: PersistedSignalSnapshotRow, right: PersistedSignalSnapshotRow): boolean {
  return stableStringify(normalizeComparablePayload(left)) === stableStringify(normalizeComparablePayload(right));
}

function buildStablePlanPayload(
  plan: Omit<Task2ASignalBaselinePlan, "generatedAt" | "mode" | "stablePlanSha256">,
): Task2AStablePlanPayload {
  return {
    schemaName: plan.schemaName,
    schemaVersion: plan.schemaVersion,
    targetProjectRef: plan.targetProjectRef,
    deniedProjectRef: plan.deniedProjectRef,
    preparedCutoff: plan.preparedCutoff,
    signalVersion: plan.signalVersion,
    cutoffAt: plan.cutoffAt,
    sourceManifest: plan.sourceManifest,
    manifestStatus: plan.manifestStatus,
    sourceFiles: plan.sourceFiles.map((file) => ({
      relativePath: file.relativePath,
      sha256: file.sha256,
      sizeBytes: file.sizeBytes,
      manifestSha256: file.manifestSha256,
      manifestStatus: file.manifestStatus,
    })),
    expectedSourceSnapshotIds: [...plan.expectedSourceSnapshotIds],
    expectedTeamKeys: [...plan.expectedTeamKeys],
    expectedRuntimeTeamSlugs: [...plan.expectedRuntimeTeamSlugs],
    expectedPriorState: plan.expectedPriorState,
    stageFoundation: plan.stageFoundation,
    summary: {
      state: plan.summary.state,
      expectedSignalRowCount: plan.summary.expectedSignalRowCount,
      insertCount: plan.summary.insertCount,
      identicalCount: plan.summary.identicalCount,
      conflictCount: plan.summary.conflictCount,
      unexpectedExistingCount: plan.summary.unexpectedExistingCount,
    },
    rows: plan.rows.map((row) => ({
      canonicalTeamKey: row.canonicalTeamKey,
      runtimeTeamSlug: row.runtimeTeamSlug,
      action: row.action,
      idempotencyKey: row.idempotencyKey,
      payload: row.payload,
      existingPayload: row.existingPayload,
      reasons: [...row.reasons],
    })),
    blockers: [...plan.blockers],
    conflicts: [...plan.conflicts],
  };
}

function buildExpectedSourceRegistryShape(registry: SourceRegistry): void {
  const expectedPairs = new Map<string, string | null>([
    ["elo_current", path.join("normalized-snapshot", "elo-ranking-2026-06-20.csv")],
    ["elo_start_2026", path.join("normalized-snapshot", "elo-ranking-start-2026.csv")],
    ["elo_latest_results", path.join("normalized-snapshot", "elo-results-2026-window.csv")],
    ["elo_results_2025", path.join("normalized-snapshot", "elo-results-2025.csv")],
    ["elo_fixtures", path.join("normalized-snapshot", "elo-fixtures-2026-06-20.csv")],
    ["fifa_men_ranking", path.join("normalized-snapshot", "fifa-ranking-2026-06-11-captured-2026-06-20.csv")],
    ["fifa_world_cup_schedule_v17", path.join("reference", "world-cup-2026-schedule.json")],
    ["world_cup_venues", path.join("reference", "world-cup-2026-venues.csv")],
    ["api_football", null],
  ]);

  for (const [sourceKey, normalizedFile] of expectedPairs.entries()) {
    const found = registry.sources.find((entry) => entry.source_key === sourceKey);
    if (!found) {
      throw new Error(`Prepared source registry was missing ${sourceKey}.`);
    }
    if (normalizeRelativePath(found.normalized_snapshot_file ?? null) !== normalizeRelativePath(normalizedFile)) {
      throw new Error(`Prepared source registry drifted for ${sourceKey}.`);
    }
  }
}

function buildExpectedRootFileHashes(preparedDir: string): ExpectedRootFileHashes {
  return {
    packageManifestSha256: sha256File(path.join(preparedDir, "package-manifest.json")),
    sourceRegistrySha256: sha256File(path.join(preparedDir, "source-registry.json")),
  };
}

export function verifyPreparedSources(preparedDir: string, expectedRootFileHashes?: ExpectedRootFileHashes): VerifiedPreparedSources {
  const packageManifestPath = path.join(preparedDir, "package-manifest.json");
  const registryPath = path.join(preparedDir, "source-registry.json");
  const packageManifest = readJsonFile<PackageManifest>(packageManifestPath);
  const registry = readJsonFile<SourceRegistry>(registryPath);
  const rootFileHashes = expectedRootFileHashes ?? buildExpectedRootFileHashes(preparedDir);
  const manifestEntries = new Map(packageManifest.package_files.map((entry) => [path.normalize(entry.path), entry] as const));
  const files: VerifiedSourceFile[] = buildPreparedSourceFiles(preparedDir).map((absolutePath) => {
    const relativePath = path.relative(preparedDir, absolutePath);
    if (!fs.existsSync(absolutePath)) {
      return {
        absolutePath,
        relativePath,
        sha256: "",
        sizeBytes: 0,
        manifestSha256: null,
        manifestStatus: "missing_from_manifest" as const,
      };
    }

    const manifestEntry = manifestEntries.get(path.normalize(relativePath));
    const sha256 = sha256File(absolutePath);
    const rootManifestSha256 =
      relativePath === "package-manifest.json"
        ? rootFileHashes.packageManifestSha256
        : relativePath === "source-registry.json"
          ? rootFileHashes.sourceRegistrySha256
          : null;
    const manifestStatus: VerifiedSourceFile["manifestStatus"] =
      rootManifestSha256 != null
        ? rootManifestSha256 === sha256
          ? "verified"
          : "hash_mismatch"
        : manifestEntry == null
          ? "missing_from_manifest"
          : manifestEntry.sha256 === sha256
            ? "verified"
            : "hash_mismatch";
    return {
      absolutePath,
      relativePath,
      sha256,
      sizeBytes: fs.statSync(absolutePath).size,
      manifestSha256: rootManifestSha256 ?? manifestEntry?.sha256 ?? null,
      manifestStatus,
    };
  });

  let status: ManifestStatus = "verified";
  if (packageManifest.snapshot_date !== EXPECTED_PREPARED_CUTOFF || registry.snapshot_date !== EXPECTED_PREPARED_CUTOFF) {
    status = "blocked";
  }

  try {
    buildExpectedSourceRegistryShape(registry);
  } catch {
    status = "blocked";
  }

  if (files.some((file) => file.manifestStatus !== "verified")) {
    status = "blocked";
  }

  return { status, packageManifest, registry, files };
}

export function evaluateTask2APlanEligibility(plan: Task2ASignalBaselinePlan): Task2APlanEligibility {
  const reasons = Array.from(
    new Set([
      ...(plan.manifestStatus !== "verified" ? [`manifest_status:${plan.manifestStatus}`] : []),
      ...plan.blockers.map((blocker) => `blocker:${blocker}`),
      ...plan.conflicts.map((conflict) => `conflict:${conflict}`),
      ...(plan.expectedPriorState === "partial_or_conflicting" ? ["state:partial_or_conflicting"] : []),
    ]),
  );

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

function requiredSourceSnapshotIdsForSignals(rows: Task2ASignalRowEvidence[]): string[] {
  return Array.from(new Set(rows.flatMap((row) => row.payload.source_snapshot_ids))).sort();
}

function buildExpectedCanonicalTeamScope(args: {
  remoteState: Omit<Task2ARemoteState, "signalSnapshots">;
  datasets: ReturnType<typeof loadTask1Datasets>;
}): Array<{ canonicalTeamKey: string; runtimeTeamSlug: string }> {
  const runtimeTeamSlugSet = new Set<string>(WORLD_CUP_2026_TEAMS.map((team) => team.teamKey));
  const localizationKeys = new Set(args.datasets.localizations.map((row) => row.canonical_team_key));
  const aliasKeys = new Set(args.datasets.aliases.map((row) => row.canonical_team_key));
  const candidates = args.remoteState.canonicalTeamLinks
    .filter((row) => row.link_status === "linked" && row.runtime_team_slug && runtimeTeamSlugSet.has(row.runtime_team_slug))
    .map((row) => ({
      canonicalTeamKey: row.canonical_team_key,
      runtimeTeamSlug: row.runtime_team_slug as string,
    }))
    .filter((row) => localizationKeys.has(row.canonicalTeamKey) && aliasKeys.has(row.canonicalTeamKey))
    .sort((left, right) => left.canonicalTeamKey.localeCompare(right.canonicalTeamKey));

  const duplicateCanonical = candidates.filter(
    (row, index, collection) => collection.findIndex((entry) => entry.canonicalTeamKey === row.canonicalTeamKey) !== index,
  );
  if (duplicateCanonical.length > 0) {
    throw new Error(`Duplicate canonical team mappings found: ${duplicateCanonical.map((row) => row.canonicalTeamKey).join(", ")}`);
  }

  const duplicateRuntime = candidates.filter(
    (row, index, collection) => collection.findIndex((entry) => entry.runtimeTeamSlug === row.runtimeTeamSlug) !== index,
  );
  if (duplicateRuntime.length > 0) {
    throw new Error(`Duplicate runtime team mappings found: ${duplicateRuntime.map((row) => row.runtimeTeamSlug).join(", ")}`);
  }

  if (candidates.length !== 48) {
    throw new Error(`Expected exactly 48 canonical World Cup team links but found ${candidates.length}.`);
  }

  return candidates;
}

function assertRequiredSourceSnapshotsPresent(remoteState: Omit<Task2ARemoteState, "signalSnapshots">, requiredSnapshotIds: string[]): void {
  const present = new Set(remoteState.sourceSnapshots.map((row) => row.snapshot_id));
  const missing = requiredSnapshotIds.filter((snapshotId) => !present.has(snapshotId));
  if (missing.length > 0) {
    throw new Error(`Required source snapshots were missing from stage: ${missing.join(", ")}`);
  }
}

function buildSignalRows(args: {
  datasets: ReturnType<typeof loadTask1Datasets>;
  canonicalScope: Array<{ canonicalTeamKey: string; runtimeTeamSlug: string }>;
}): Task2ASignalRowEvidence[] {
  const signalSnapshots = buildSignalSnapshots(
    CANONICAL_SIGNAL_CUTOFF_AT,
    args.canonicalScope.map((entry) => entry.canonicalTeamKey),
    args.datasets.historicalFacts,
    args.datasets.localizations,
    args.datasets.aliases,
    args.datasets.eloCurrent,
    args.datasets.eloStart2026,
    args.datasets.fifaRanking,
    args.datasets.schedule,
  );
  const scopeByKey = new Map(args.canonicalScope.map((entry) => [entry.canonicalTeamKey, entry] as const));
  const missingSignalInputs = signalSnapshots.filter((row) => !scopeByKey.has(row.canonical_team_key));
  if (missingSignalInputs.length > 0) {
    throw new Error(`Signal derivation returned out-of-scope teams: ${missingSignalInputs.map((row) => row.canonical_team_key).join(", ")}`);
  }

  const signalVersionSet = new Set(signalSnapshots.map((row) => row.signal_version));
  const cutoffSet = new Set(signalSnapshots.map((row) => row.cutoff_at));
  if (signalVersionSet.size !== 1) {
    throw new Error("Signal derivation returned multiple signal versions.");
  }
  if (cutoffSet.size !== 1 || !cutoffSet.has(CANONICAL_SIGNAL_CUTOFF_AT)) {
    throw new Error("Signal derivation drifted from the canonical Task 1 cutoff.");
  }
  if (signalSnapshots.length !== args.canonicalScope.length) {
    throw new Error(`Expected ${args.canonicalScope.length} derived signal rows but found ${signalSnapshots.length}.`);
  }

  return signalSnapshots
    .map((snapshot) => {
      const scope = scopeByKey.get(snapshot.canonical_team_key);
      if (!scope) {
        throw new Error(`Signal derivation produced unresolved canonical team ${snapshot.canonical_team_key}.`);
      }
      return {
        canonicalTeamKey: snapshot.canonical_team_key,
        runtimeTeamSlug: scope.runtimeTeamSlug,
        signalVersion: snapshot.signal_version,
        cutoffAt: snapshot.cutoff_at,
        payload: toPersistedSignalSnapshotRow(snapshot),
        reportOnly: {
          missingRequiredSignals: [],
          missingOptionalSignals: normalizeStringArray(snapshot.missingOptionalSignals),
          contradictionFlags: [],
          displayNameEn: snapshot.display_name_en,
          displayNameEs: snapshot.display_name_es,
          eloAtCutoff: snapshot.eloAtCutoff,
          eloResolutionMethod: snapshot.eloResolutionMethod,
          eloReliability: snapshot.eloReliability,
          fifaAtCutoff: snapshot.fifaAtCutoff,
          diagnosticEffectiveStrength: snapshot.diagnostic_effective_strength,
        },
      };
    })
    .sort((left, right) => left.canonicalTeamKey.localeCompare(right.canonicalTeamKey));
}

function classifyPlanState(args: {
  signalRows: Task2ASignalRowEvidence[];
  remoteRows: RemoteSignalSnapshotRow[];
}): {
  state: Task2APlanState;
  planRows: Task2APlanRow[];
  blockers: string[];
  conflicts: string[];
} {
  const remoteByKey = new Map(args.remoteRows.map((row) => [row.canonical_team_key, row] as const));
  const expectedKeys = new Set(args.signalRows.map((row) => row.canonicalTeamKey));
  const blockers: string[] = [];
  const conflicts: string[] = [];

  const unexpectedRemoteRows = args.remoteRows.filter((row) => !expectedKeys.has(row.canonical_team_key));
  if (unexpectedRemoteRows.length > 0) {
    conflicts.push(
      `Unexpected baseline signal rows already exist for ${unexpectedRemoteRows.map((row) => row.canonical_team_key).sort().join(", ")}.`,
    );
  }

  const planRows: Task2APlanRow[] = args.signalRows.map((row) => {
    const existing = remoteByKey.get(row.canonicalTeamKey);
    if (!existing) {
      return {
        canonicalTeamKey: row.canonicalTeamKey,
        runtimeTeamSlug: row.runtimeTeamSlug,
        action: "insert" as const,
        idempotencyKey: `${row.signalVersion}:${row.cutoffAt}:${row.canonicalTeamKey}`,
        payload: row.payload,
        existingPayload: null,
        reportOnly: row.reportOnly,
        sourceSnapshotIds: [...row.payload.source_snapshot_ids],
        reasons: [],
      };
    }

    const existingPayload = fromRemoteSignalSnapshotRow(existing);
    if (compareSignalRowsExact(row.payload, existingPayload)) {
      return {
        canonicalTeamKey: row.canonicalTeamKey,
        runtimeTeamSlug: row.runtimeTeamSlug,
        action: "already_identical" as const,
        idempotencyKey: `${row.signalVersion}:${row.cutoffAt}:${row.canonicalTeamKey}`,
        payload: row.payload,
        existingPayload,
        reportOnly: row.reportOnly,
        sourceSnapshotIds: [...row.payload.source_snapshot_ids],
        reasons: [],
      };
    }

    conflicts.push(`Existing signal row for ${row.canonicalTeamKey} differed semantically from the reviewed baseline payload.`);
    return {
      canonicalTeamKey: row.canonicalTeamKey,
      runtimeTeamSlug: row.runtimeTeamSlug,
      action: "conflict" as const,
      idempotencyKey: `${row.signalVersion}:${row.cutoffAt}:${row.canonicalTeamKey}`,
      payload: row.payload,
      existingPayload,
      reportOnly: row.reportOnly,
      sourceSnapshotIds: [...row.payload.source_snapshot_ids],
      reasons: ["existing_row_differs"],
    };
  });

  for (const remoteRow of unexpectedRemoteRows) {
    planRows.push({
      canonicalTeamKey: remoteRow.canonical_team_key,
      runtimeTeamSlug: "",
      action: "unexpected_existing",
      idempotencyKey: `${remoteRow.signal_version}:${remoteRow.cutoff_at}:${remoteRow.canonical_team_key}`,
      payload: fromRemoteSignalSnapshotRow(remoteRow),
      existingPayload: fromRemoteSignalSnapshotRow(remoteRow),
      reportOnly: {
        missingRequiredSignals: [],
        missingOptionalSignals: [],
        contradictionFlags: [],
        displayNameEn: remoteRow.canonical_team_key,
        displayNameEs: remoteRow.canonical_team_key,
        eloAtCutoff: null,
        eloResolutionMethod: "unavailable",
        eloReliability: 0,
        fifaAtCutoff: null,
        diagnosticEffectiveStrength: {
          score: 0,
          baseline_structural_strength: 0,
          recent_opponent_adjusted_form: 0,
          tournament_current_form: 0,
          attack: 0,
          defense: 0,
          conversion_and_failed_to_score_risk: 0,
          performance_vs_expectation: 0,
          reliability: 0,
        },
      },
      sourceSnapshotIds: [],
      reasons: ["unexpected_existing_team_key"],
    });
  }

  const insertCount = planRows.filter((row) => row.action === "insert").length;
  const identicalCount = planRows.filter((row) => row.action === "already_identical").length;
  const conflictCount = planRows.filter((row) => row.action === "conflict").length;
  const unexpectedExistingCount = planRows.filter((row) => row.action === "unexpected_existing").length;

  let state: Task2APlanState = "partial_or_conflicting";
  if (insertCount === args.signalRows.length && identicalCount === 0 && conflictCount === 0 && unexpectedExistingCount === 0) {
    state = "fresh";
  } else if (identicalCount === args.signalRows.length && insertCount === 0 && conflictCount === 0 && unexpectedExistingCount === 0) {
    state = "exact_complete";
  } else {
    blockers.push("Stage signal baseline state was partial or conflicting.");
  }

  return {
    state,
    planRows: planRows.sort((left, right) => left.canonicalTeamKey.localeCompare(right.canonicalTeamKey)),
    blockers: Array.from(new Set(blockers)),
    conflicts: Array.from(new Set(conflicts)),
  };
}

function buildFixtureCoverage(args: {
  remoteState: Omit<Task2ARemoteState, "signalSnapshots">;
  signalRows: Task2ASignalRowEvidence[];
}): { rows: Task2AFixtureCoverageRow[]; summary: Task2ACoverageSummary } {
  const signalByKey = new Map(args.signalRows.map((row) => [row.canonicalTeamKey, row] as const));
  const scheduleById = new Map(args.remoteState.officialScheduleMatches.map((row) => [row.id, row] as const));
  const matchById = new Map(args.remoteState.matches.map((row) => [row.id, row] as const));

  const rows = args.remoteState.officialScheduleMatchLinks
    .filter((row) => row.match_id != null)
    .map((row) => {
      const schedule = scheduleById.get(row.official_schedule_match_id);
      const match = row.match_id ? matchById.get(row.match_id) : null;
      if (!schedule || !match || !schedule.home_team_key || !schedule.away_team_key) {
        return null;
      }
      const homeSignal = signalByKey.get(schedule.home_team_key) ?? null;
      const awaySignal = signalByKey.get(schedule.away_team_key) ?? null;
      const baselineReady = homeSignal != null && awaySignal != null;
      return {
        fixture_id: match.id,
        official_match_number: schedule.official_match_number,
        scheduled_at_utc: schedule.scheduled_at_utc,
        home_team_key: schedule.home_team_key,
        away_team_key: schedule.away_team_key,
        signal_version_required: homeSignal?.signalVersion ?? awaySignal?.signalVersion ?? "prediction-intelligence-v2-task1",
        home_signal_cutoff: homeSignal?.cutoffAt ?? null,
        away_signal_cutoff: awaySignal?.cutoffAt ?? null,
        home_source_snapshot_ids: homeSignal?.payload.source_snapshot_ids ?? [],
        away_source_snapshot_ids: awaySignal?.payload.source_snapshot_ids ?? [],
        home_reliability: homeSignal?.reportOnly.eloReliability ?? null,
        away_reliability: awaySignal?.reportOnly.eloReliability ?? null,
        home_missing_required: homeSignal?.reportOnly.missingRequiredSignals ?? ["signal_snapshot"],
        away_missing_required: awaySignal?.reportOnly.missingRequiredSignals ?? ["signal_snapshot"],
        home_missing_optional: homeSignal?.reportOnly.missingOptionalSignals ?? [],
        away_missing_optional: awaySignal?.reportOnly.missingOptionalSignals ?? [],
        baseline_signal_ready: baselineReady,
        candidate_ready: false,
        candidate_ready_reason: "requires_incremental_current_refresh",
      } satisfies Task2AFixtureCoverageRow;
    })
    .filter((row): row is Task2AFixtureCoverageRow => row != null)
    .sort((left, right) => left.official_match_number - right.official_match_number);

  return {
    rows,
    summary: {
      runtimeFixtureCount: rows.length,
      baselineReadyCount: rows.filter((row) => row.baseline_signal_ready).length,
      candidateReadyCount: 0,
    },
  };
}

export function assertTask2ALocalRunPreflight(repoRoot: string, artifactsDir: string): void {
  const resolvedArtifactsDir = path.resolve(artifactsDir);
  const allowedRoot = path.resolve(repoRoot, "artifacts", "prediction-intelligence-v2", "task2a", "local-run");
  const relative = path.relative(allowedRoot, resolvedArtifactsDir);
  if (relative === "" || relative === "." || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Task 2A local run refused because artifactsDir must resolve inside ${allowedRoot}${path.sep}.`);
  }
}

export function assertTask2AAuthorization(input: {
  projectRef: string;
  denyProjectRef: string;
  dryRun: boolean;
  apply: boolean;
  verify: boolean;
  supabaseUrl: string | undefined;
}): Task2ASignalBaselineAuthorization {
  if (input.projectRef !== STAGE_PROJECT_REF) {
    throw new Error(`Unexpected stage project ref: ${input.projectRef}.`);
  }
  if (input.denyProjectRef !== PRODUCTION_DENY_PROJECT_REF) {
    throw new Error(`Unexpected deny project ref: ${input.denyProjectRef}.`);
  }
  if (input.projectRef === input.denyProjectRef) {
    throw new Error("Production project ref is denied.");
  }

  const selectedModeCount = [input.dryRun, input.apply, input.verify].filter(Boolean).length;
  if (selectedModeCount !== 1) {
    throw new Error("Specify exactly one of --dry-run, --apply, or --verify.");
  }

  const targetEnvironment = process.env.PREDICTION_INTELLIGENCE_TARGET;
  if (targetEnvironment !== "development") {
    throw new Error("PREDICTION_INTELLIGENCE_TARGET must be exactly development.");
  }

  const allowRemoteDevWrite = process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE === "true";
  if (input.apply && !allowRemoteDevWrite) {
    throw new Error("Apply mode requires PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE=true.");
  }

  if (!input.supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  let parsedHost: string;
  try {
    parsedHost = new URL(input.supabaseUrl).host;
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  }

  if (parsedHost !== `${input.projectRef}.supabase.co`) {
    throw new Error(`Supabase URL host mismatch. Expected ${input.projectRef}.supabase.co.`);
  }

  const envProjectRef = process.env.DEV_SUPABASE_PROJECT_REF;
  if (envProjectRef && envProjectRef !== input.projectRef) {
    throw new Error("DEV_SUPABASE_PROJECT_REF does not match the explicit --project-ref.");
  }

  return {
    mode: input.dryRun ? "dry_run" : input.apply ? "apply" : "verification",
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    supabaseUrlHost: parsedHost,
    targetEnvironment,
    productionDenied: true,
    allowRemoteDevWrite,
  };
}

function buildPreparedPaths(repoRoot: string, preparedDir: string, artifactsDir: string): PreparedPaths {
  return {
    repoRoot,
    preparedDir,
    artifactsDir,
    rawSnapshotDir: path.resolve(preparedDir, ".."),
  };
}

export function planTask2ASignalBaseline(args: {
  repoRoot: string;
  preparedDir: string;
  remoteState: Task2ARemoteState;
  authorization: Task2ASignalBaselineAuthorization;
  verifiedSources: VerifiedPreparedSources;
}): {
  plan: Task2ASignalBaselinePlan;
  coverageRows: Task2AFixtureCoverageRow[];
} {
  const preparedPaths = buildPreparedPaths(args.repoRoot, args.preparedDir, path.join(args.repoRoot, "artifacts"));
  const datasets = loadTask1Datasets(preparedPaths);
  const canonicalScope = buildExpectedCanonicalTeamScope({
    remoteState: args.remoteState,
    datasets,
  });
  const signalRows = buildSignalRows({ datasets, canonicalScope });
  const requiredSnapshotIds = requiredSourceSnapshotIdsForSignals(signalRows);
  assertRequiredSourceSnapshotsPresent(args.remoteState, requiredSnapshotIds);
  const classification = classifyPlanState({
    signalRows,
    remoteRows: args.remoteState.signalSnapshots,
  });
  const coverage = buildFixtureCoverage({
    remoteState: args.remoteState,
    signalRows,
  });

  const summary = {
    state: classification.state,
    expectedSignalRowCount: signalRows.length,
    insertCount: classification.planRows.filter((row) => row.action === "insert").length,
    identicalCount: classification.planRows.filter((row) => row.action === "already_identical").length,
    conflictCount: classification.planRows.filter((row) => row.action === "conflict").length,
    unexpectedExistingCount: classification.planRows.filter((row) => row.action === "unexpected_existing").length,
    zeroWriteConfirmation: args.authorization.mode !== "apply",
  };

  const generatedAt = new Date().toISOString();
  const basePlan: Omit<Task2ASignalBaselinePlan, "stablePlanSha256"> = {
    schemaName: TASK2A_SCHEMA_NAME,
    schemaVersion: TASK2A_SCHEMA_VERSION,
    generatedAt,
    mode: args.authorization.mode,
    targetProjectRef: args.authorization.projectRef,
    deniedProjectRef: args.authorization.denyProjectRef,
    preparedCutoff: EXPECTED_PREPARED_CUTOFF,
    signalVersion: signalRows[0]?.signalVersion ?? "prediction-intelligence-v2-task1",
    cutoffAt: CANONICAL_SIGNAL_CUTOFF_AT,
    sourceManifest: {
      packageName: args.verifiedSources.packageManifest.package_name,
      packageVersion: args.verifiedSources.packageManifest.package_version,
      packageSnapshotDate: args.verifiedSources.packageManifest.snapshot_date,
      packageManifestSha256: sha256File(path.join(args.preparedDir, "package-manifest.json")),
      sourceRegistrySha256: sha256File(path.join(args.preparedDir, "source-registry.json")),
    },
    manifestStatus: args.verifiedSources.status,
    sourceFiles: args.verifiedSources.files,
    expectedSourceSnapshotIds: requiredSnapshotIds,
    expectedTeamKeys: canonicalScope.map((entry) => entry.canonicalTeamKey),
    expectedRuntimeTeamSlugs: canonicalScope.map((entry) => entry.runtimeTeamSlug),
    expectedPriorState: classification.state,
    stageFoundation: {
      canonicalLinkCount: args.remoteState.canonicalTeamLinks.length,
      linkedWorldCupTeamCount: canonicalScope.length,
      runtimeMatchCount: args.remoteState.matches.length,
      officialScheduleLinkCount: args.remoteState.officialScheduleMatchLinks.length,
    },
    summary,
    rows: classification.planRows,
    coverageSummary: coverage.summary,
    blockers: Array.from(
      new Set([
        ...(args.verifiedSources.status === "blocked" ? ["Prepared source manifest or source registry verification failed."] : []),
        ...classification.blockers,
      ]),
    ),
    conflicts: classification.conflicts,
  };

  const plan: Task2ASignalBaselinePlan = {
    ...basePlan,
    stablePlanSha256: sha256Json(buildStablePlanPayload(basePlan)),
  };

  return { plan, coverageRows: coverage.rows };
}

function normalizePlanForApply(plan: Task2ASignalBaselinePlan): Task2ASignalBaselinePlan {
  return {
    ...plan,
    rows: plan.rows.map((row) => ({
      ...row,
      payload: normalizeComparablePayload(row.payload),
      existingPayload: row.existingPayload ? normalizeComparablePayload(row.existingPayload) : null,
      sourceSnapshotIds: [...row.sourceSnapshotIds].sort(),
      reasons: [...row.reasons],
    })),
  };
}

function assertReviewedPlanBinding(input: {
  reviewedPlan: Task2ASignalBaselinePlan;
  currentPlan: Task2ASignalBaselinePlan;
  reviewedStablePlanSha256: string;
  authorization: Task2ASignalBaselineAuthorization;
}): void {
  if (input.reviewedPlan.mode !== "dry_run") {
    throw new Error("Task 2A apply requires a reviewed dry-run artifact.");
  }
  if (input.reviewedPlan.targetProjectRef !== input.authorization.projectRef || input.reviewedPlan.deniedProjectRef !== input.authorization.denyProjectRef) {
    throw new Error("Task 2A apply refused because reviewed artifact target binding differed.");
  }
  if (input.reviewedStablePlanSha256 !== input.reviewedPlan.stablePlanSha256) {
    throw new Error("Task 2A apply refused because the provided reviewed stable plan SHA did not match the artifact.");
  }

  const reviewedStablePayload = buildStablePlanPayload(input.reviewedPlan);
  const currentStablePayload = buildStablePlanPayload(input.currentPlan);
  const reviewedSemanticSha = sha256Json(reviewedStablePayload);
  const currentSemanticSha = sha256Json(currentStablePayload);
  if (reviewedSemanticSha !== input.reviewedPlan.stablePlanSha256) {
    throw new Error("Task 2A apply refused because the reviewed artifact checksum did not match its contents.");
  }
  if (reviewedSemanticSha !== currentSemanticSha) {
    const diffPaths = collectSemanticDiffPaths(reviewedStablePayload, currentStablePayload);
    throw new Error(
      `Task 2A apply refused because the current semantic plan differed from the reviewed artifact. differing_paths=${diffPaths.join(", ")}`,
    );
  }
  if (currentSemanticSha !== input.currentPlan.stablePlanSha256) {
    throw new Error("Task 2A apply refused because the current plan checksum did not match its contents.");
  }
}

export async function applyTask2ASignalBaselinePlan(input: {
  currentPlan: Task2ASignalBaselinePlan;
  reviewedPlan: Task2ASignalBaselinePlan;
  reviewedStablePlanSha256: string;
  authorization: Task2ASignalBaselineAuthorization;
  databaseAdapter: Task2ADatabaseAdapter;
}): Promise<Task2AApplyResult> {
  const reviewedEligibility = evaluateTask2APlanEligibility(input.reviewedPlan);
  if (!reviewedEligibility.eligible) {
    throw new Error(`Task 2A apply refused because the reviewed plan is ineligible: ${reviewedEligibility.reasons.join(" | ")}`);
  }
  const currentEligibility = evaluateTask2APlanEligibility(input.currentPlan);
  if (!currentEligibility.eligible) {
    throw new Error(`Task 2A apply refused because the current plan is ineligible: ${currentEligibility.reasons.join(" | ")}`);
  }
  assertReviewedPlanBinding(input);
  const reviewedPlan = normalizePlanForApply(input.reviewedPlan);

  if (input.currentPlan.expectedPriorState === "partial_or_conflicting") {
    throw new Error("Task 2A apply refused because the current stage state is partial or conflicting.");
  }

  if (reviewedPlan.expectedPriorState === "exact_complete") {
    return {
      requestedState: "exact_complete",
      insertedCount: 0,
      identicalCount: reviewedPlan.summary.identicalCount,
      conflictCount: 0,
    };
  }

  const payloads = reviewedPlan.rows
    .filter((row) => row.action === "insert")
    .map((row) => row.payload);
  try {
    await input.databaseAdapter.insertSignalSnapshots(payloads);
    return {
      requestedState: "fresh",
      insertedCount: payloads.length,
      identicalCount: 0,
      conflictCount: 0,
    };
  } catch (error) {
    const rereadRows = await input.databaseAdapter.readSignalSnapshots(reviewedPlan.signalVersion, reviewedPlan.cutoffAt);
    const rereadState = classifyPlanState({
      signalRows: reviewedPlan.rows
        .filter((row) => row.action !== "unexpected_existing")
        .map((row) => ({
          canonicalTeamKey: row.canonicalTeamKey,
          runtimeTeamSlug: row.runtimeTeamSlug,
          signalVersion: reviewedPlan.signalVersion,
          cutoffAt: reviewedPlan.cutoffAt,
          payload: row.payload,
          reportOnly: row.reportOnly,
        })),
      remoteRows: rereadRows,
    }).state;

    if (rereadState === "exact_complete") {
      return {
        requestedState: "fresh",
        insertedCount: payloads.length,
        identicalCount: 0,
        conflictCount: 0,
      };
    }
    if (rereadState === "fresh") {
      throw new Error(
        `Task 2A apply failed before any stage rows changed. Safe to retry the same reviewed artifact. Cause: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    throw new Error(
      `Task 2A apply entered a partial or conflicting state after batch insert failure. Manual reconciliation required before retry. Cause: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function createLiveDatabaseAdapter(): Task2ADatabaseAdapter {
  const supabase = createSupabaseScriptAdminClient();
  return {
    async readFoundationState() {
      const [
        sourceSnapshotsResult,
        canonicalLinksResult,
        teamsResult,
        matchesResult,
        officialScheduleMatchesResult,
        officialScheduleMatchLinksResult,
      ] = await Promise.all([
        supabase.from("source_snapshots").select("snapshot_id, source_key, payload_hash"),
        supabase
          .from("canonical_team_links")
          .select("id, canonical_team_key, team_id, api_football_team_id, runtime_team_slug, link_status, metadata_json, created_at, updated_at"),
        supabase.from("teams").select("id, slug, name"),
        supabase.from("matches").select("id, slug, kickoff_at, stage, status").eq("stage", "group_stage"),
        supabase.from("official_schedule_matches").select("id, official_match_number, home_team_key, away_team_key, scheduled_at_utc"),
        supabase
          .from("official_schedule_match_links")
          .select("official_schedule_match_id, match_id, api_football_fixture_id, link_status"),
      ]);

      const errors = [
        sourceSnapshotsResult.error,
        canonicalLinksResult.error,
        teamsResult.error,
        matchesResult.error,
        officialScheduleMatchesResult.error,
        officialScheduleMatchLinksResult.error,
      ].filter(Boolean);
      if (errors.length > 0) {
        throw new Error(`Failed to read Task 2A stage foundation: ${errors.map((error) => error?.message).join(" | ")}`);
      }

      return {
        sourceSnapshots: (sourceSnapshotsResult.data ?? []) as RemoteSourceSnapshotRow[],
        canonicalTeamLinks: (canonicalLinksResult.data ?? []) as RemoteCanonicalTeamLinkRow[],
        teams: (teamsResult.data ?? []) as RemoteTeamRow[],
        matches: (matchesResult.data ?? []) as RemoteMatchRow[],
        officialScheduleMatches: (officialScheduleMatchesResult.data ?? []) as RemoteOfficialScheduleMatchRow[],
        officialScheduleMatchLinks: (officialScheduleMatchLinksResult.data ?? []) as RemoteOfficialScheduleMatchLinkRow[],
      };
    },
    async readSignalSnapshots(signalVersion, cutoffAt) {
      const { data, error } = await supabase
        .from("signal_snapshots")
        .select(
          "id, signal_version, cutoff_at, canonical_team_key, sample_sizes, structural_strength, recent_form, opponent_adjusted_form, tournament_form, attack, defense, performance_vs_expectation, reliability, source_snapshot_ids, created_at",
        )
        .eq("signal_version", signalVersion)
        .eq("cutoff_at", cutoffAt);
      if (error) {
        throw new Error(`Failed to read Task 2A signal snapshots: ${error.message}`);
      }
      return (data ?? []) as RemoteSignalSnapshotRow[];
    },
    async insertSignalSnapshots(rows) {
      const { error } = await supabase.from("signal_snapshots").insert(rows);
      if (error) {
        throw new Error(`Failed to insert Task 2A signal baseline rows: ${error.message}`);
      }
    },
  };
}

function artifactBaseName(mode: Mode, timestamp: string): string {
  if (mode === "apply") {
    return `task2a-signal-baseline-apply-${timestamp}.json`;
  }
  if (mode === "verification") {
    return `task2a-signal-baseline-verification-${timestamp}.json`;
  }
  return `task2a-signal-baseline-dry-run-${timestamp}.json`;
}

function loadReviewedPlan(filePath: string): Task2ASignalBaselinePlan {
  return readJsonFile<Task2ASignalBaselinePlan>(path.resolve(filePath));
}

export async function runTask2ASignalBaseline(input: RunTask2AInput): Promise<RunTask2AResult> {
  if (!fs.existsSync(input.preparedDir)) {
    throw new Error(`Prepared V2 workspace not found: ${input.preparedDir}`);
  }

  assertTask2ALocalRunPreflight(input.repoRoot, input.artifactsDir);
  const authorization = assertTask2AAuthorization({
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    dryRun: input.dryRun,
    apply: input.apply,
    verify: input.verify,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
  const verifiedSources = verifyPreparedSources(input.preparedDir);
  const databaseAdapter = createLiveDatabaseAdapter();
  const foundationState = await databaseAdapter.readFoundationState();
  const preparedPaths = buildPreparedPaths(input.repoRoot, input.preparedDir, input.artifactsDir);
  const datasets = loadTask1Datasets(preparedPaths);
  const canonicalScope = buildExpectedCanonicalTeamScope({ remoteState: foundationState, datasets });
  const signalRows = buildSignalRows({ datasets, canonicalScope });
  const signalVersion = signalRows[0]?.signalVersion ?? "prediction-intelligence-v2-task1";
  const remoteState: Task2ARemoteState = {
    ...foundationState,
    signalSnapshots: await databaseAdapter.readSignalSnapshots(signalVersion, CANONICAL_SIGNAL_CUTOFF_AT),
  };
  const { plan, coverageRows } = planTask2ASignalBaseline({
    repoRoot: input.repoRoot,
    preparedDir: input.preparedDir,
    remoteState,
    authorization,
    verifiedSources,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  ensureDirectory(input.artifactsDir);
  const artifactPath = path.join(input.artifactsDir, artifactBaseName(authorization.mode, timestamp));
  const coverageArtifactPath = path.join(input.artifactsDir, `task2a-fixture-signal-coverage-${timestamp}.json`);
  writeJson(artifactPath, plan);
  writeJson(coverageArtifactPath, coverageRows);

  let applyResult: Task2AApplyResult | null = null;
  if (authorization.mode === "apply") {
    if (!input.reviewedPlanPath || !input.reviewedStablePlanSha256) {
      throw new Error("Task 2A apply requires --reviewed-plan and --reviewed-stable-plan-sha256.");
    }
    const reviewedPlan = loadReviewedPlan(input.reviewedPlanPath);
    applyResult = await applyTask2ASignalBaselinePlan({
      currentPlan: plan,
      reviewedPlan,
      reviewedStablePlanSha256: input.reviewedStablePlanSha256,
      authorization,
      databaseAdapter,
    });
  }

  return {
    plan,
    artifactPath,
    coverageArtifactPath,
    applyResult,
  };
}
