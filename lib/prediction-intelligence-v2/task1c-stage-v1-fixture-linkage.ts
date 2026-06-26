import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  fetchApiFootballFixtureByIdDetailed,
  type ApiFootballFixtureLookupDetailedResult,
} from "../football-api/api-football-client";
import type { ProviderFixture } from "../football-api/api-football-types";
import { buildApiFootballFixtureExternalId } from "../football-api/ingest/external-ids";
import { createSupabaseScriptAdminClient } from "../supabase/script-admin";
import type { MatchRow } from "../../types/database";
import {
  assertApprovedFixtureIdentity,
  assertExactFixtureAllowlist,
  normalizeUrlHost,
  resolveProjectRefFromUrl,
  sameInstant,
  type FrozenSourceManifest,
} from "./task1c-frozen-v1-source-package";
import { verifyWorldCupProviderFixtureIdentity } from "../world-cup-2026/fixture-registry";

const TASK1C_LINKAGE_SCHEMA_NAME = "ufo-task1c-stage-v1-fixture-linkage-v1";
const TASK1C_LINKAGE_SCHEMA_VERSION = 1;
const TASK1C_LINKAGE_ARTIFACT_ROOT = path.join(
  "artifacts",
  "prediction-intelligence-v2",
  "task1c-stage-v1-fixture-linkage",
  "local-run",
);
const WORLD_CUP_COMPETITION_SLUG = "world-cup-2026";
const WORLD_CUP_SEASON_YEAR = 2026;
const APPROVED_PRODUCTION_SOURCE_REF: string = "gcpdffkgsdomzyoenalg";
const APPROVED_STAGE_PROJECT_REF: string = "yfmklapgjrupctgxaako";
const APPROVED_DENY_PROJECT_REF: string = "gcpdffkgsdomzyoenalg";
const ALLOWED_PATCH_KEYS = ["external_id", "intake_source"] as const;
const TASK1C_PROVIDER_MAX_ATTEMPTS = 3;
const TASK1C_PROVIDER_REQUEST_CONCURRENCY = 1;
const TASK1C_PROVIDER_RETRYABLE_HTTP_STATUSES = [429, 500, 502, 503, 504] as const;
const TASK1C_PROVIDER_NON_RETRYABLE_HTTP_STATUSES = [200, 400, 401, 403, 404] as const;
const TASK1C_PROVIDER_RETRYABLE_FAILURE_STATUSES = [
  "provider_rate_limited",
  "provider_transport_failed",
  "provider_server_failed",
] as const satisfies ProviderVerificationStatus[];

type LinkageMode = "dry_run" | "apply";
type LinkageAction =
  | "update_linkage"
  | "already_linked"
  | "blocked_conflict"
  | "blocked_missing"
  | "blocked_duplicate";

type LinkageConflictCode =
  | "provider_identity_mismatch"
  | "stage_row_missing"
  | "stage_row_duplicate"
  | "stage_row_identity_mismatch"
  | "stage_external_id_conflict"
  | "stage_intake_source_conflict"
  | "stage_competition_conflict"
  | "stage_season_conflict"
  | "apply_state_drift"
  | "artifact_tamper";

type FixtureIdentity = FrozenSourceManifest["fixtures"][number];

type StageCompetitionRow = {
  id: string;
  slug: string;
};

type StageSeasonRow = {
  id: string;
  competition_id: string;
  year: number;
};

type StageTeamRow = {
  id: string;
  slug: string;
  name: string;
};

export type Task1cStageMatchRow = {
  id: string;
  external_id: string | null;
  slug: string;
  competition_id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  kickoff_at: string;
  stage: string | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  access_scope: "public" | "premium" | "admin_only" | "lab_only";
  lab_status: MatchRow["lab_status"];
  intake_source: "mock" | "manual" | "csv_import" | "api_football";
  data_quality: MatchRow["data_quality"];
  source_note: string | null;
};

export type Task1cStageDatabaseSnapshot = {
  competitions: StageCompetitionRow[];
  seasons: StageSeasonRow[];
  teams: StageTeamRow[];
  matches: Task1cStageMatchRow[];
};

type ObservedNonMutatedFields = {
  slug: string;
  kickoffAt: string;
  stage: string | null;
  status: Task1cStageMatchRow["status"];
  accessScope: Task1cStageMatchRow["access_scope"];
  labStatus: MatchRow["lab_status"];
  competitionId: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  dataQuality: MatchRow["data_quality"];
  sourceNote: string | null;
};

type ProviderVerificationStatus =
  | "provider_verified"
  | "provider_not_found"
  | "provider_rate_limited"
  | "provider_quota_exhausted"
  | "provider_auth_failed"
  | "provider_transport_failed"
  | "provider_server_failed"
  | "provider_response_invalid"
  | "provider_identity_mismatch";

type ProviderRetryClassification =
  | "not_needed"
  | "retry_transient_http"
  | "retry_transport"
  | "retry_exhausted"
  | "not_retryable";

type ProviderIdentityCheckEvidence = {
  fixtureReturned: boolean;
  homeIdentity: "match" | "mismatch" | "not_checked";
  awayIdentity: "match" | "mismatch" | "not_checked";
  kickoffIdentity: "match" | "mismatch" | "not_checked";
  groupStageIdentity: "match" | "mismatch" | "not_checked";
};

type ProviderIdentityEvidence = {
  providerFixtureId: number;
  verificationStatus: ProviderVerificationStatus;
  attemptCount: number;
  finalHttpStatus: number | null;
  retryClassification: ProviderRetryClassification;
  sanitizedErrorCode: string | null;
  sanitizedErrorMessage: string | null;
  retryAfterSeconds: number | null;
  fixtureIdentityReturned: boolean;
  kickoffAt: string | null;
  round: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  status: ProviderFixture["status"] | null;
  identityChecks: ProviderIdentityCheckEvidence;
};

type StageIdentityEvidence = {
  stageMatchId: string | null;
  existingExternalId: string | null;
  existingIntakeSource: Task1cStageMatchRow["intake_source"] | null;
  observedFields: ObservedNonMutatedFields | null;
};

type LinkagePatch = {
  external_id: string;
  intake_source: "api_football";
};

export type Task1cStageFixtureLinkageRow = {
  matchNumber: number;
  slug: string;
  providerFixtureId: number;
  sourceManifestIdentity: {
    kickoffAt: string;
    canonicalHomeTeamKey: string;
    canonicalAwayTeamKey: string;
    sourceMatchRef: string;
    sourcePredictionRef: string;
  };
  providerIdentityEvidence: ProviderIdentityEvidence | null;
  resolvedStageMatchUuid: string | null;
  stageIdentityEvidence: StageIdentityEvidence;
  action: LinkageAction;
  exactProposedPatch: LinkagePatch | null;
  blocker: {
    code: LinkageConflictCode;
    detail: string;
  } | null;
};

export type Task1cStageFixtureLinkageSummary = {
  selected: number;
  updateLinkage: number;
  alreadyLinked: number;
  blockedConflict: number;
  blockedMissing: number;
  blockedDuplicate: number;
  creates: 0;
  deletes: 0;
  stageDatabaseWrites: number;
  productionDatabaseWrites: 0;
  outOfScopeRows: number;
};

export type Task1cStageOutOfScopeEvidence = {
  slug: string;
  providerFixtureId: number;
  reason: "matchday_2_outside_task1c_scope";
  selected: false;
  actionEligible: false;
  applyEligible: false;
  patchPresent: false;
};

export type Task1cStageFixtureLinkagePlan = {
  schemaName: typeof TASK1C_LINKAGE_SCHEMA_NAME;
  schemaVersion: typeof TASK1C_LINKAGE_SCHEMA_VERSION;
  generatedAt: string;
  mode: LinkageMode;
  targetProjectRef: string;
  deniedProjectRef: string;
  sourceManifestPath: string;
  sourceManifestChecksum: string;
  canonicalPackageSha256: string;
  selectedFixtureCount: number;
  selectedMatchNumbers: number[];
  selectedSlugs: string[];
  selectedProviderFixtureIds: number[];
  providerRetrieval: {
    executionMode: "sequential_by_match_number";
    requestConcurrency: 1;
    retryPolicy: {
      maxAttempts: number;
      retryableHttpStatuses: number[];
      retryableFailureStatuses: ProviderVerificationStatus[];
      nonRetryableHttpStatuses: number[];
      retryOnProviderNotFound: false;
    };
  };
  summary: Task1cStageFixtureLinkageSummary;
  outOfScopeEvidence: Task1cStageOutOfScopeEvidence[];
  rows: Task1cStageFixtureLinkageRow[];
  stablePlanSha256: string;
  zeroWriteConfirmation: boolean;
};

export type Task1cStageFixtureApplyReviewArtifact = Task1cStageFixtureLinkagePlan;

type ManifestValidationResult = {
  manifest: FrozenSourceManifest;
  manifestPath: string;
  manifestSha256: string;
  packageSha256: string;
};

type LinkageAuthorization = {
  mode: LinkageMode;
  projectRef: string;
  denyProjectRef: string;
  supabaseUrlHost: string;
  targetProof: "explicit_project_ref_and_url_match";
  productionDenied: true;
};

type Task1cStageDatabaseAdapter = {
  readSnapshot(slugs: string[], externalIds: string[]): Promise<Task1cStageDatabaseSnapshot>;
  rereadMatchesByIds(matchIds: string[]): Promise<Task1cStageMatchRow[]>;
  updateMatchLinkage(matchId: string, patch: LinkagePatch): Promise<void>;
};

type Task1cStageProviderReader = {
  readFixtureById(fixtureId: number): Promise<ApiFootballFixtureLookupDetailedResult>;
};

export type RunTask1cStageV1FixtureLinkageInput = {
  repoRoot: string;
  artifactsDir: string;
  projectRef: string;
  denyProjectRef: string;
  supabaseUrl: string | null | undefined;
  sourceManifestPath: string;
  packageSha256: string;
  apply?: boolean;
  allowlistManifestPath?: string | null;
};

export type RunTask1cStageV1FixtureLinkageResult = {
  artifactPath: string;
  plan: Task1cStageFixtureLinkagePlan;
};

type ProviderLookupResolution = {
  fixtureId: number;
  providerFixture: ProviderFixture | null;
  evidence: ProviderIdentityEvidence;
};

const TASK1C_OUT_OF_SCOPE_FIXTURE = {
  slug: "world-cup-2026-colombia-vs-congo-dr-2026-06-24",
  providerFixtureId: 1539008,
  reason: "matchday_2_outside_task1c_scope",
  selected: false,
  actionEligible: false,
  applyEligible: false,
  patchPresent: false,
} as const satisfies Task1cStageOutOfScopeEvidence;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableValue(entry));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    return Object.fromEntries(entries.map(([key, entry]) => [key, stableValue(entry)]));
  }

  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function sha256File(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJsonFile(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeProviderMessage(message: string | null | undefined): string | null {
  if (!message) {
    return null;
  }

  return message
    .replace(/x-apisports-key/gi, "[redacted-header]")
    .replace(/[A-Za-z0-9_-]{24,}/g, "[redacted-token]")
    .trim()
    .slice(0, 240);
}

function classifyProviderFailure(input: {
  httpStatus: number | null;
  failureKind: ApiFootballFixtureLookupDetailedResult["failureKind"];
  diagnostics: ApiFootballFixtureLookupDetailedResult["diagnostics"];
  errorMessage: string | null;
  fixture: ProviderFixture | null;
}): ProviderVerificationStatus {
  const errorText = `${input.errorMessage ?? ""} ${input.diagnostics?.errors.join(" ") ?? ""}`.toLowerCase();

  if (input.fixture) {
    return "provider_verified";
  }

  if (input.failureKind === "transport_error") {
    return "provider_transport_failed";
  }

  if (input.failureKind === "response_invalid") {
    return "provider_response_invalid";
  }

  if (input.httpStatus === 401 || input.httpStatus === 403) {
    if (errorText.includes("quota") || errorText.includes("limit") || errorText.includes("exceeded")) {
      return "provider_quota_exhausted";
    }
    return "provider_auth_failed";
  }

  if (input.httpStatus === 429) {
    return errorText.includes("quota") || errorText.includes("exceeded")
      ? "provider_quota_exhausted"
      : "provider_rate_limited";
  }

  if (
    input.httpStatus === 500 ||
    input.httpStatus === 502 ||
    input.httpStatus === 503 ||
    input.httpStatus === 504
  ) {
    return "provider_server_failed";
  }

  if (input.httpStatus === 404 || (input.httpStatus === 200 && input.diagnostics?.results === 0)) {
    return "provider_not_found";
  }

  if (input.httpStatus === 200 && input.fixture === null) {
    return "provider_not_found";
  }

  return "provider_response_invalid";
}

function shouldRetryProviderStatus(status: ProviderVerificationStatus): boolean {
  return (
    status === "provider_rate_limited" ||
    status === "provider_transport_failed" ||
    status === "provider_server_failed"
  );
}

function buildRetryDelayMs(args: {
  attemptNumber: number;
  retryAfterSeconds: number | null;
  status: ProviderVerificationStatus;
}): number {
  if (args.status === "provider_rate_limited" && args.retryAfterSeconds !== null) {
    return Math.min(Math.max(args.retryAfterSeconds, 0), 3) * 1000;
  }

  return Math.min(args.attemptNumber * 200, 600);
}

async function fetchTask1cProviderLookupsSequential(
  fixtures: FixtureIdentity[],
  providerReader: Task1cStageProviderReader,
): Promise<ProviderLookupResolution[]> {
  const results: ProviderLookupResolution[] = [];

  for (const fixture of fixtures) {
    let attemptCount = 0;
    let lastResult: ApiFootballFixtureLookupDetailedResult | null = null;
    let finalStatus: ProviderVerificationStatus = "provider_response_invalid";
    let retryClassification: ProviderRetryClassification = "not_needed";

    while (attemptCount < TASK1C_PROVIDER_MAX_ATTEMPTS) {
      attemptCount += 1;
      const current = await providerReader.readFixtureById(fixture.apiFootballFixtureId);
      lastResult = current;
      finalStatus = classifyProviderFailure({
        httpStatus: current.httpStatus,
        failureKind: current.failureKind,
        diagnostics: current.diagnostics,
        errorMessage: current.errorMessage,
        fixture: current.fixture,
      });

      if (!shouldRetryProviderStatus(finalStatus) || attemptCount >= TASK1C_PROVIDER_MAX_ATTEMPTS) {
        retryClassification =
          finalStatus === "provider_verified"
            ? "not_needed"
            : shouldRetryProviderStatus(finalStatus) && attemptCount >= TASK1C_PROVIDER_MAX_ATTEMPTS
              ? "retry_exhausted"
              : finalStatus === "provider_transport_failed"
                ? "retry_transport"
                : shouldRetryProviderStatus(finalStatus)
                  ? "retry_transient_http"
                  : "not_retryable";
        break;
      }

      retryClassification = finalStatus === "provider_transport_failed" ? "retry_transport" : "retry_transient_http";
      await delay(
        buildRetryDelayMs({
          attemptNumber: attemptCount,
          retryAfterSeconds: current.retryAfterSeconds,
          status: finalStatus,
        }),
      );
    }

    const providerFixture = lastResult?.fixture ?? null;
    results.push({
      fixtureId: fixture.apiFootballFixtureId,
      providerFixture,
      evidence: {
        providerFixtureId: fixture.apiFootballFixtureId,
        verificationStatus: providerFixture ? "provider_verified" : finalStatus,
        attemptCount,
        finalHttpStatus: lastResult?.httpStatus ?? null,
        retryClassification,
        sanitizedErrorCode: providerFixture ? null : lastResult?.errorCode ?? finalStatus,
        sanitizedErrorMessage: providerFixture ? null : sanitizeProviderMessage(lastResult?.errorMessage),
        retryAfterSeconds: lastResult?.retryAfterSeconds ?? null,
        fixtureIdentityReturned: providerFixture !== null,
        kickoffAt: providerFixture?.kickoffAt ?? null,
        round: providerFixture?.competition.round ?? null,
        homeTeamName: providerFixture?.homeTeam.name ?? null,
        awayTeamName: providerFixture?.awayTeam.name ?? null,
        status: providerFixture?.status ?? null,
        identityChecks: {
          fixtureReturned: providerFixture !== null,
          homeIdentity: providerFixture ? "match" : "not_checked",
          awayIdentity: providerFixture ? "match" : "not_checked",
          kickoffIdentity: providerFixture ? "match" : "not_checked",
          groupStageIdentity: providerFixture ? "match" : "not_checked",
        },
      },
    });
  }

  return results;
}

function assertAllowedPatchShape(patch: Record<string, unknown>): asserts patch is LinkagePatch {
  const keys = Object.keys(patch).sort();
  const expected = [...ALLOWED_PATCH_KEYS].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw new Error("Task 1C linkage patch may only contain external_id and intake_source.");
  }

  if (!/^api-football:fixture:\d+$/.test(String(patch.external_id ?? ""))) {
    throw new Error("Task 1C linkage patch external_id must be an api-football fixture identifier.");
  }

  if (patch.intake_source !== "api_football") {
    throw new Error("Task 1C linkage patch intake_source must be api_football.");
  }
}

export function resolveTask1cStageV1FixtureLinkageDefaults(repoRoot: string): {
  artifactsDir: string;
  sourceManifestPath: string;
  packageSha256: string;
  supabaseUrl: string | null | undefined;
} {
  return {
    artifactsDir: path.join(repoRoot, TASK1C_LINKAGE_ARTIFACT_ROOT),
    sourceManifestPath: path.join(
      repoRoot,
      "artifacts",
      "prediction-intelligence-v2",
      "task1c",
      "2026-06-26",
      "2026-06-26T10-59-46-686Z",
      "frozen-source-manifest.json",
    ),
    packageSha256: "bdb8a3bc57734f97f826a6988c009c646a62e3a0036f6f10fb214e113dbc8416",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
}

export function assertTask1cStageV1LinkageAuthorization(input: {
  projectRef: string | null;
  denyProjectRef: string | null;
  supabaseUrl: string | null | undefined;
  apply: boolean;
}): LinkageAuthorization {
  if (!input.projectRef) {
    throw new Error("Task 1C linkage requires --project-ref.");
  }

  if (!input.denyProjectRef) {
    throw new Error("Task 1C linkage requires --deny-project-ref.");
  }

  if (input.projectRef !== APPROVED_STAGE_PROJECT_REF) {
    throw new Error(`Task 1C linkage refused unauthorized project ref ${input.projectRef}.`);
  }

  if (input.denyProjectRef !== APPROVED_DENY_PROJECT_REF) {
    throw new Error(`Task 1C linkage refused unexpected deny project ref ${input.denyProjectRef}.`);
  }

  if (input.projectRef === input.denyProjectRef) {
    throw new Error("Task 1C linkage refused because project and deny refs must differ.");
  }

  if (!input.supabaseUrl) {
    throw new Error("Task 1C linkage requires NEXT_PUBLIC_SUPABASE_URL.");
  }

  const actualProjectRef = resolveProjectRefFromUrl(input.supabaseUrl);
  if (actualProjectRef !== input.projectRef) {
    throw new Error("Task 1C linkage refused because the resolved Supabase project ref mismatched --project-ref.");
  }

  if (actualProjectRef === input.denyProjectRef) {
    throw new Error("Task 1C linkage refused because the resolved target matches the denied production project.");
  }

  const normalizedHost = normalizeUrlHost(input.supabaseUrl);
  if (normalizedHost !== `${input.projectRef}.supabase.co`) {
    throw new Error(`Task 1C linkage refused because the Supabase URL host must be ${input.projectRef}.supabase.co.`);
  }

  if (normalizedHost.includes(input.denyProjectRef) || input.supabaseUrl.includes(input.denyProjectRef)) {
    throw new Error("Task 1C linkage refused because a production identifier appeared in the resolved target.");
  }

  return {
    mode: input.apply ? "apply" : "dry_run",
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    supabaseUrlHost: normalizedHost,
    targetProof: "explicit_project_ref_and_url_match",
    productionDenied: true,
  };
}

function validateManifestStructure(manifest: FrozenSourceManifest): void {
  if (manifest.schemaName !== "ufo-frozen-v1-source-manifest-v1" || manifest.schemaVersion !== 1) {
    throw new Error("Task 1C linkage refused an unexpected frozen manifest schema.");
  }

  if (manifest.sourceProjectRef !== APPROVED_PRODUCTION_SOURCE_REF) {
    throw new Error("Task 1C linkage refused a manifest from an unexpected source project.");
  }

  if (manifest.fixtures.length !== 24) {
    throw new Error(`Task 1C linkage expected exactly 24 fixtures but found ${manifest.fixtures.length}.`);
  }

  const expectedMatchNumbers = Array.from({ length: 24 }, (_, index) => index + 49);
  const actualMatchNumbers = [...new Set(manifest.fixtures.map((fixture) => fixture.matchNumber))].sort(
    (left, right) => left - right,
  );
  if (stableStringify(actualMatchNumbers) !== stableStringify(expectedMatchNumbers)) {
    throw new Error("Task 1C linkage refused because manifest match numbers were not exactly 49 through 72.");
  }

  const uniqueSlugs = new Set<string>();
  const uniqueProviderIds = new Set<number>();
  const uniqueSourceMatchRefs = new Set<string>();
  const uniqueSourcePredictionRefs = new Set<string>();

  for (const fixture of manifest.fixtures) {
    if (uniqueSlugs.has(fixture.canonicalSlug)) {
      throw new Error(`Task 1C linkage refused duplicate canonical slug ${fixture.canonicalSlug}.`);
    }
    if (uniqueProviderIds.has(fixture.apiFootballFixtureId)) {
      throw new Error(`Task 1C linkage refused duplicate provider fixture id ${fixture.apiFootballFixtureId}.`);
    }
    if (uniqueSourceMatchRefs.has(fixture.sourceMatchRef)) {
      throw new Error(`Task 1C linkage refused duplicate source match ref ${fixture.sourceMatchRef}.`);
    }
    if (uniqueSourcePredictionRefs.has(fixture.sourcePredictionRef)) {
      throw new Error(`Task 1C linkage refused duplicate source prediction ref ${fixture.sourcePredictionRef}.`);
    }

    uniqueSlugs.add(fixture.canonicalSlug);
    uniqueProviderIds.add(fixture.apiFootballFixtureId);
    uniqueSourceMatchRefs.add(fixture.sourceMatchRef);
    uniqueSourcePredictionRefs.add(fixture.sourcePredictionRef);

    assertApprovedFixtureIdentity({
      matchNumber: fixture.matchNumber,
      canonicalSlug: fixture.canonicalSlug,
      apiFootballFixtureId: fixture.apiFootballFixtureId,
      canonicalHomeTeamKey: fixture.canonicalHomeTeamKey,
      canonicalAwayTeamKey: fixture.canonicalAwayTeamKey,
      kickoffAt: fixture.kickoffAt,
    });
  }

  assertExactFixtureAllowlist(
    manifest.fixtures.map((fixture) => ({
      matchNumber: fixture.matchNumber,
      matchSlug: fixture.canonicalSlug,
    })),
  );
}

export function validateTask1cStageV1FixtureLinkageManifest(input: {
  sourceManifestPath: string;
  packageSha256: string;
}): ManifestValidationResult {
  const manifestPath = path.resolve(input.sourceManifestPath);
  const manifest = readJsonFile<FrozenSourceManifest>(manifestPath);
  validateManifestStructure(manifest);

  const manifestDir = path.dirname(manifestPath);
  const packagePath = path.join(manifestDir, "ufo-frozen-v1-source-package-v1.json");
  const checksumsPath = path.join(manifestDir, "checksums.json");
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Task 1C linkage could not find the frozen package at ${packagePath}.`);
  }

  const packageSha256 = sha256File(packagePath);
  if (packageSha256 !== input.packageSha256) {
    throw new Error("Task 1C linkage refused because the frozen package SHA-256 did not match the approved checksum.");
  }

  const manifestSha256 = sha256File(manifestPath);
  if (fs.existsSync(checksumsPath)) {
    const checksums = readJsonFile<{
      files: Array<{ filename: string; firstReadSha256: string }>;
    }>(checksumsPath);
    const manifestEntry = checksums.files.find((entry) => entry.filename === "frozen-source-manifest.json");
    if (manifestEntry && manifestEntry.firstReadSha256 !== manifestSha256) {
      throw new Error("Task 1C linkage refused because the manifest checksum differed from checksums.json.");
    }
  }

  return {
    manifest,
    manifestPath,
    manifestSha256,
    packageSha256,
  };
}

function findCompetitionId(snapshot: Task1cStageDatabaseSnapshot): string {
  const competitions = snapshot.competitions.filter((competition) => competition.slug === WORLD_CUP_COMPETITION_SLUG);
  if (competitions.length !== 1) {
    throw new Error("Task 1C linkage requires exactly one World Cup 2026 competition row in stage.");
  }

  return competitions[0]!.id;
}

function findSeasonId(snapshot: Task1cStageDatabaseSnapshot, competitionId: string): string {
  const seasons = snapshot.seasons.filter(
    (season) => season.competition_id === competitionId && season.year === WORLD_CUP_SEASON_YEAR,
  );
  if (seasons.length !== 1) {
    throw new Error("Task 1C linkage requires exactly one World Cup 2026 season row in stage.");
  }

  return seasons[0]!.id;
}

function buildTeamIdToSlug(snapshot: Task1cStageDatabaseSnapshot): Map<string, string> {
  return new Map(snapshot.teams.map((team) => [team.id, team.slug]));
}

function findStageCandidates(
  fixture: FixtureIdentity,
  snapshot: Task1cStageDatabaseSnapshot,
  expectedCompetitionId: string,
  expectedSeasonId: string,
  teamIdToSlug: Map<string, string>,
): Task1cStageMatchRow[] {
  const expectedExternalId = buildApiFootballFixtureExternalId(fixture.apiFootballFixtureId);
  return snapshot.matches.filter((match) => {
    const homeTeamSlug = teamIdToSlug.get(match.home_team_id) ?? null;
    const awayTeamSlug = teamIdToSlug.get(match.away_team_id) ?? null;
    const identityMatch =
      match.slug === fixture.canonicalSlug &&
      homeTeamSlug === fixture.canonicalHomeTeamKey &&
      awayTeamSlug === fixture.canonicalAwayTeamKey &&
      sameInstant(match.kickoff_at, fixture.kickoffAt) &&
      match.competition_id === expectedCompetitionId &&
      match.season_id === expectedSeasonId;

    return identityMatch || match.external_id === expectedExternalId;
  });
}

function buildObservedFields(match: Task1cStageMatchRow): ObservedNonMutatedFields {
  return {
    slug: match.slug,
    kickoffAt: match.kickoff_at,
    stage: match.stage,
    status: match.status,
    accessScope: match.access_scope,
    labStatus: match.lab_status,
    competitionId: match.competition_id,
    seasonId: match.season_id,
    homeTeamId: match.home_team_id,
    awayTeamId: match.away_team_id,
    dataQuality: match.data_quality,
    sourceNote: match.source_note,
  };
}

function classifyFixturePlan(args: {
  fixture: FixtureIdentity;
  providerLookup: ProviderLookupResolution;
  snapshot: Task1cStageDatabaseSnapshot;
  expectedCompetitionId: string;
  expectedSeasonId: string;
}): Task1cStageFixtureLinkageRow {
  const expectedExternalId = buildApiFootballFixtureExternalId(args.fixture.apiFootballFixtureId);
  const providerFixture = args.providerLookup.providerFixture;
  if (!providerFixture) {
    return {
      matchNumber: args.fixture.matchNumber,
      slug: args.fixture.canonicalSlug,
      providerFixtureId: args.fixture.apiFootballFixtureId,
      sourceManifestIdentity: {
        kickoffAt: args.fixture.kickoffAt,
        canonicalHomeTeamKey: args.fixture.canonicalHomeTeamKey,
        canonicalAwayTeamKey: args.fixture.canonicalAwayTeamKey,
        sourceMatchRef: args.fixture.sourceMatchRef,
        sourcePredictionRef: args.fixture.sourcePredictionRef,
      },
      providerIdentityEvidence: args.providerLookup.evidence,
      resolvedStageMatchUuid: null,
      stageIdentityEvidence: {
        stageMatchId: null,
        existingExternalId: null,
        existingIntakeSource: null,
        observedFields: null,
      },
      action: "blocked_conflict",
      exactProposedPatch: null,
      blocker: {
        code: "provider_identity_mismatch",
        detail:
          args.providerLookup.evidence.sanitizedErrorMessage ??
          `Provider fixture ${args.fixture.apiFootballFixtureId} failed verification with status ${args.providerLookup.evidence.verificationStatus}.`,
      },
    };
  }

  const providerIdentity = verifyWorldCupProviderFixtureIdentity({
    canonicalFixture: {
      fixtureKey: `task1c-match-${args.fixture.matchNumber}`,
      homeTeamKey: args.fixture.canonicalHomeTeamKey,
      awayTeamKey: args.fixture.canonicalAwayTeamKey,
      kickoffAt: args.fixture.kickoffAt,
    },
    providerFixture,
  });

  if (!providerIdentity.ok) {
    const providerEvidence: ProviderIdentityEvidence = {
      ...args.providerLookup.evidence,
      verificationStatus: "provider_identity_mismatch" as const,
      sanitizedErrorCode: providerIdentity.conflictCode,
      sanitizedErrorMessage: providerIdentity.conflictReason,
      identityChecks: {
        fixtureReturned: true,
        homeIdentity: providerIdentity.conflictCode === "provider_team_mismatch" || providerIdentity.conflictCode === "provider_reversed_teams" ? "mismatch" : "match",
        awayIdentity: providerIdentity.conflictCode === "provider_team_mismatch" || providerIdentity.conflictCode === "provider_reversed_teams" ? "mismatch" : "match",
        kickoffIdentity: providerIdentity.conflictCode === "provider_kickoff_mismatch" ? "mismatch" : "match",
        groupStageIdentity: providerIdentity.conflictCode === "provider_group_stage_mismatch" ? "mismatch" : "match",
      },
    };
    return {
      matchNumber: args.fixture.matchNumber,
      slug: args.fixture.canonicalSlug,
      providerFixtureId: args.fixture.apiFootballFixtureId,
      sourceManifestIdentity: {
        kickoffAt: args.fixture.kickoffAt,
        canonicalHomeTeamKey: args.fixture.canonicalHomeTeamKey,
        canonicalAwayTeamKey: args.fixture.canonicalAwayTeamKey,
        sourceMatchRef: args.fixture.sourceMatchRef,
        sourcePredictionRef: args.fixture.sourcePredictionRef,
      },
      providerIdentityEvidence: providerEvidence,
      resolvedStageMatchUuid: null,
      stageIdentityEvidence: {
        stageMatchId: null,
        existingExternalId: null,
        existingIntakeSource: null,
        observedFields: null,
      },
      action: "blocked_conflict",
      exactProposedPatch: null,
      blocker: {
        code: "provider_identity_mismatch",
        detail: providerIdentity.conflictReason,
      },
    };
  }

  const teamIdToSlug = buildTeamIdToSlug(args.snapshot);
  const candidates = findStageCandidates(
    args.fixture,
    args.snapshot,
    args.expectedCompetitionId,
    args.expectedSeasonId,
    teamIdToSlug,
  );

  if (candidates.length === 0) {
    return {
      matchNumber: args.fixture.matchNumber,
      slug: args.fixture.canonicalSlug,
      providerFixtureId: args.fixture.apiFootballFixtureId,
      sourceManifestIdentity: {
        kickoffAt: args.fixture.kickoffAt,
        canonicalHomeTeamKey: args.fixture.canonicalHomeTeamKey,
        canonicalAwayTeamKey: args.fixture.canonicalAwayTeamKey,
        sourceMatchRef: args.fixture.sourceMatchRef,
        sourcePredictionRef: args.fixture.sourcePredictionRef,
      },
      providerIdentityEvidence: args.providerLookup.evidence,
      resolvedStageMatchUuid: null,
      stageIdentityEvidence: {
        stageMatchId: null,
        existingExternalId: null,
        existingIntakeSource: null,
        observedFields: null,
      },
      action: "blocked_missing",
      exactProposedPatch: null,
      blocker: {
        code: "stage_row_missing",
        detail: `No existing stage match row resolved for ${args.fixture.canonicalSlug}.`,
      },
    };
  }

  const exactIdentityCandidates = candidates.filter((match) => {
    const homeTeamSlug = teamIdToSlug.get(match.home_team_id) ?? null;
    const awayTeamSlug = teamIdToSlug.get(match.away_team_id) ?? null;
    return (
      match.slug === args.fixture.canonicalSlug &&
      homeTeamSlug === args.fixture.canonicalHomeTeamKey &&
      awayTeamSlug === args.fixture.canonicalAwayTeamKey &&
      sameInstant(match.kickoff_at, args.fixture.kickoffAt) &&
      match.competition_id === args.expectedCompetitionId &&
      match.season_id === args.expectedSeasonId
    );
  });

  if (exactIdentityCandidates.length === 0) {
    const conflictingCandidate = candidates[0] ?? null;
    return {
      matchNumber: args.fixture.matchNumber,
      slug: args.fixture.canonicalSlug,
      providerFixtureId: args.fixture.apiFootballFixtureId,
      sourceManifestIdentity: {
        kickoffAt: args.fixture.kickoffAt,
        canonicalHomeTeamKey: args.fixture.canonicalHomeTeamKey,
        canonicalAwayTeamKey: args.fixture.canonicalAwayTeamKey,
        sourceMatchRef: args.fixture.sourceMatchRef,
        sourcePredictionRef: args.fixture.sourcePredictionRef,
      },
      providerIdentityEvidence: args.providerLookup.evidence,
      resolvedStageMatchUuid: conflictingCandidate?.id ?? null,
      stageIdentityEvidence: {
        stageMatchId: conflictingCandidate?.id ?? null,
        existingExternalId: conflictingCandidate?.external_id ?? null,
        existingIntakeSource: conflictingCandidate?.intake_source ?? null,
        observedFields: conflictingCandidate ? buildObservedFields(conflictingCandidate) : null,
      },
      action: "blocked_conflict",
      exactProposedPatch: null,
      blocker: {
        code: "stage_row_identity_mismatch",
        detail: `Resolved stage rows for ${args.fixture.canonicalSlug} did not preserve the exact canonical slug, teams, kickoff, competition, and season identity.`,
      },
    };
  }

  if (exactIdentityCandidates.length > 1) {
    return {
      matchNumber: args.fixture.matchNumber,
      slug: args.fixture.canonicalSlug,
      providerFixtureId: args.fixture.apiFootballFixtureId,
      sourceManifestIdentity: {
        kickoffAt: args.fixture.kickoffAt,
        canonicalHomeTeamKey: args.fixture.canonicalHomeTeamKey,
        canonicalAwayTeamKey: args.fixture.canonicalAwayTeamKey,
        sourceMatchRef: args.fixture.sourceMatchRef,
        sourcePredictionRef: args.fixture.sourcePredictionRef,
      },
      providerIdentityEvidence: args.providerLookup.evidence,
      resolvedStageMatchUuid: null,
      stageIdentityEvidence: {
        stageMatchId: null,
        existingExternalId: null,
        existingIntakeSource: null,
        observedFields: null,
      },
      action: "blocked_duplicate",
      exactProposedPatch: null,
      blocker: {
        code: "stage_row_duplicate",
        detail: `Expected exactly one stage row for ${args.fixture.canonicalSlug} but resolved ${exactIdentityCandidates.length}.`,
      },
    };
  }

  const match = exactIdentityCandidates[0]!;
  const stageIdentityEvidence: StageIdentityEvidence = {
    stageMatchId: match.id,
    existingExternalId: match.external_id,
    existingIntakeSource: match.intake_source,
    observedFields: buildObservedFields(match),
  };

  const homeTeamSlug = teamIdToSlug.get(match.home_team_id) ?? null;
  const awayTeamSlug = teamIdToSlug.get(match.away_team_id) ?? null;
  if (
    match.slug !== args.fixture.canonicalSlug ||
    homeTeamSlug !== args.fixture.canonicalHomeTeamKey ||
    awayTeamSlug !== args.fixture.canonicalAwayTeamKey ||
    !sameInstant(match.kickoff_at, args.fixture.kickoffAt)
  ) {
    return {
      matchNumber: args.fixture.matchNumber,
      slug: args.fixture.canonicalSlug,
      providerFixtureId: args.fixture.apiFootballFixtureId,
      sourceManifestIdentity: {
        kickoffAt: args.fixture.kickoffAt,
        canonicalHomeTeamKey: args.fixture.canonicalHomeTeamKey,
        canonicalAwayTeamKey: args.fixture.canonicalAwayTeamKey,
        sourceMatchRef: args.fixture.sourceMatchRef,
        sourcePredictionRef: args.fixture.sourcePredictionRef,
      },
      providerIdentityEvidence: args.providerLookup.evidence,
      resolvedStageMatchUuid: match.id,
      stageIdentityEvidence,
      action: "blocked_conflict",
      exactProposedPatch: null,
      blocker: {
        code: "stage_row_identity_mismatch",
        detail: `Resolved stage row ${match.id} did not preserve exact canonical identity for ${args.fixture.canonicalSlug}.`,
      },
    };
  }

  if (match.competition_id !== args.expectedCompetitionId || match.season_id !== args.expectedSeasonId) {
    return {
      matchNumber: args.fixture.matchNumber,
      slug: args.fixture.canonicalSlug,
      providerFixtureId: args.fixture.apiFootballFixtureId,
      sourceManifestIdentity: {
        kickoffAt: args.fixture.kickoffAt,
        canonicalHomeTeamKey: args.fixture.canonicalHomeTeamKey,
        canonicalAwayTeamKey: args.fixture.canonicalAwayTeamKey,
        sourceMatchRef: args.fixture.sourceMatchRef,
        sourcePredictionRef: args.fixture.sourcePredictionRef,
      },
      providerIdentityEvidence: args.providerLookup.evidence,
      resolvedStageMatchUuid: match.id,
      stageIdentityEvidence,
      action: "blocked_conflict",
      exactProposedPatch: null,
      blocker: {
        code: "stage_competition_conflict",
        detail: `Resolved stage row ${match.id} is outside the expected World Cup 2026 competition or season.`,
      },
    };
  }

  if (match.external_id && match.external_id !== expectedExternalId) {
    return {
      matchNumber: args.fixture.matchNumber,
      slug: args.fixture.canonicalSlug,
      providerFixtureId: args.fixture.apiFootballFixtureId,
      sourceManifestIdentity: {
        kickoffAt: args.fixture.kickoffAt,
        canonicalHomeTeamKey: args.fixture.canonicalHomeTeamKey,
        canonicalAwayTeamKey: args.fixture.canonicalAwayTeamKey,
        sourceMatchRef: args.fixture.sourceMatchRef,
        sourcePredictionRef: args.fixture.sourcePredictionRef,
      },
      providerIdentityEvidence: args.providerLookup.evidence,
      resolvedStageMatchUuid: match.id,
      stageIdentityEvidence,
      action: "blocked_conflict",
      exactProposedPatch: null,
      blocker: {
        code: "stage_external_id_conflict",
        detail: `Resolved stage row ${match.id} already has conflicting external_id ${match.external_id}.`,
      },
    };
  }

  if (match.external_id === expectedExternalId && match.intake_source === "api_football") {
    return {
      matchNumber: args.fixture.matchNumber,
      slug: args.fixture.canonicalSlug,
      providerFixtureId: args.fixture.apiFootballFixtureId,
      sourceManifestIdentity: {
        kickoffAt: args.fixture.kickoffAt,
        canonicalHomeTeamKey: args.fixture.canonicalHomeTeamKey,
        canonicalAwayTeamKey: args.fixture.canonicalAwayTeamKey,
        sourceMatchRef: args.fixture.sourceMatchRef,
        sourcePredictionRef: args.fixture.sourcePredictionRef,
      },
      providerIdentityEvidence: args.providerLookup.evidence,
      resolvedStageMatchUuid: match.id,
      stageIdentityEvidence,
      action: "already_linked",
      exactProposedPatch: null,
      blocker: null,
    };
  }

  if (match.external_id === null && match.intake_source === "manual") {
    const patch: LinkagePatch = {
      external_id: expectedExternalId,
      intake_source: "api_football",
    };
    assertAllowedPatchShape(patch);
    return {
      matchNumber: args.fixture.matchNumber,
      slug: args.fixture.canonicalSlug,
      providerFixtureId: args.fixture.apiFootballFixtureId,
      sourceManifestIdentity: {
        kickoffAt: args.fixture.kickoffAt,
        canonicalHomeTeamKey: args.fixture.canonicalHomeTeamKey,
        canonicalAwayTeamKey: args.fixture.canonicalAwayTeamKey,
        sourceMatchRef: args.fixture.sourceMatchRef,
        sourcePredictionRef: args.fixture.sourcePredictionRef,
      },
      providerIdentityEvidence: args.providerLookup.evidence,
      resolvedStageMatchUuid: match.id,
      stageIdentityEvidence,
      action: "update_linkage",
      exactProposedPatch: patch,
      blocker: null,
    };
  }

  return {
    matchNumber: args.fixture.matchNumber,
    slug: args.fixture.canonicalSlug,
    providerFixtureId: args.fixture.apiFootballFixtureId,
    sourceManifestIdentity: {
      kickoffAt: args.fixture.kickoffAt,
      canonicalHomeTeamKey: args.fixture.canonicalHomeTeamKey,
      canonicalAwayTeamKey: args.fixture.canonicalAwayTeamKey,
      sourceMatchRef: args.fixture.sourceMatchRef,
      sourcePredictionRef: args.fixture.sourcePredictionRef,
    },
    providerIdentityEvidence: args.providerLookup.evidence,
    resolvedStageMatchUuid: match.id,
    stageIdentityEvidence,
    action: "blocked_conflict",
    exactProposedPatch: null,
    blocker: {
      code: "stage_intake_source_conflict",
      detail: `Resolved stage row ${match.id} had unsupported pre-apply linkage state external_id=${match.external_id ?? "null"} intake_source=${match.intake_source}.`,
    },
  };
}

function buildSummary(
  rows: Task1cStageFixtureLinkageRow[],
  outOfScopeEvidence: Task1cStageOutOfScopeEvidence[],
): Task1cStageFixtureLinkageSummary {
  return {
    selected: rows.length,
    updateLinkage: rows.filter((row) => row.action === "update_linkage").length,
    alreadyLinked: rows.filter((row) => row.action === "already_linked").length,
    blockedConflict: rows.filter((row) => row.action === "blocked_conflict").length,
    blockedMissing: rows.filter((row) => row.action === "blocked_missing").length,
    blockedDuplicate: rows.filter((row) => row.action === "blocked_duplicate").length,
    creates: 0,
    deletes: 0,
    stageDatabaseWrites: 0,
    productionDatabaseWrites: 0,
    outOfScopeRows: outOfScopeEvidence.length,
  };
}

function buildOutOfScopeEvidence(): Task1cStageOutOfScopeEvidence[] {
  return [{ ...TASK1C_OUT_OF_SCOPE_FIXTURE }];
}

function assertTask1cOutOfScopeBoundary(plan: {
  selectedMatchNumbers: number[];
  selectedSlugs: string[];
  selectedProviderFixtureIds: number[];
  rows: Task1cStageFixtureLinkageRow[];
  outOfScopeEvidence: Task1cStageOutOfScopeEvidence[];
}): void {
  const boundaryEvidence = plan.outOfScopeEvidence;
  if (boundaryEvidence.length !== 1) {
    throw new Error("Task 1C linkage refused because out-of-scope evidence did not contain exactly one boundary record.");
  }

  const [record] = boundaryEvidence;
  if (
    record.slug !== TASK1C_OUT_OF_SCOPE_FIXTURE.slug ||
    record.providerFixtureId !== TASK1C_OUT_OF_SCOPE_FIXTURE.providerFixtureId ||
    record.reason !== TASK1C_OUT_OF_SCOPE_FIXTURE.reason ||
    record.selected !== false ||
    record.actionEligible !== false ||
    record.applyEligible !== false ||
    record.patchPresent !== false
  ) {
    throw new Error("Task 1C linkage refused because the out-of-scope boundary evidence record was tampered or incomplete.");
  }

  if (plan.selectedSlugs.includes(TASK1C_OUT_OF_SCOPE_FIXTURE.slug)) {
    throw new Error("Task 1C linkage refused because the excluded Matchday 2 slug appeared in selected slugs.");
  }

  if (plan.selectedProviderFixtureIds.includes(TASK1C_OUT_OF_SCOPE_FIXTURE.providerFixtureId)) {
    throw new Error("Task 1C linkage refused because the excluded Matchday 2 provider fixture appeared in the Matchday 3 provider allowlist.");
  }

  if (
    plan.selectedMatchNumbers.length !== 24 ||
    plan.selectedMatchNumbers.some((matchNumber) => matchNumber < 49 || matchNumber > 72)
  ) {
    throw new Error("Task 1C linkage refused because selected match numbers drifted outside the Matchday 3 boundary.");
  }

  if (plan.rows.some((row) => row.slug === TASK1C_OUT_OF_SCOPE_FIXTURE.slug)) {
    throw new Error("Task 1C linkage refused because the excluded Matchday 2 slug appeared in action rows.");
  }

  if (plan.rows.some((row) => row.providerFixtureId === TASK1C_OUT_OF_SCOPE_FIXTURE.providerFixtureId)) {
    throw new Error("Task 1C linkage refused because the excluded Matchday 2 provider fixture appeared in action rows.");
  }

  if (plan.rows.some((row) => row.matchNumber < 49 || row.matchNumber > 72)) {
    throw new Error("Task 1C linkage refused because action rows drifted outside the Matchday 3 range.");
  }

  if (
    plan.rows.some(
      (row) =>
        row.exactProposedPatch !== null &&
        (row.slug === TASK1C_OUT_OF_SCOPE_FIXTURE.slug ||
          row.providerFixtureId === TASK1C_OUT_OF_SCOPE_FIXTURE.providerFixtureId),
    )
  ) {
    throw new Error("Task 1C linkage refused because the excluded Matchday 2 boundary became apply-eligible.");
  }
}

function buildStablePlanPayload(plan: Omit<Task1cStageFixtureLinkagePlan, "generatedAt" | "stablePlanSha256">): unknown {
  return {
    schemaName: plan.schemaName,
    schemaVersion: plan.schemaVersion,
    targetProjectRef: plan.targetProjectRef,
    deniedProjectRef: plan.deniedProjectRef,
    sourceManifestPath: plan.sourceManifestPath,
    sourceManifestChecksum: plan.sourceManifestChecksum,
    canonicalPackageSha256: plan.canonicalPackageSha256,
    selectedFixtureCount: plan.selectedFixtureCount,
    selectedMatchNumbers: plan.selectedMatchNumbers,
    selectedSlugs: plan.selectedSlugs,
    selectedProviderFixtureIds: plan.selectedProviderFixtureIds,
    providerRetrieval: plan.providerRetrieval,
    summary: plan.summary,
    outOfScopeEvidence: plan.outOfScopeEvidence,
    rows: plan.rows,
  };
}

export function planTask1cStageV1FixtureLinkage(input: {
  authorization: LinkageAuthorization;
  manifestValidation: ManifestValidationResult;
  providerLookups: ProviderLookupResolution[];
  snapshot: Task1cStageDatabaseSnapshot;
}): Task1cStageFixtureLinkagePlan {
  const expectedCompetitionId = findCompetitionId(input.snapshot);
  const expectedSeasonId = findSeasonId(input.snapshot, expectedCompetitionId);
  const providerById = new Map(input.providerLookups.map((lookup) => [lookup.fixtureId, lookup]));

  const rows = [...input.manifestValidation.manifest.fixtures]
    .sort((left, right) => left.matchNumber - right.matchNumber)
    .map((fixture) =>
      classifyFixturePlan({
        fixture,
        providerLookup:
          providerById.get(fixture.apiFootballFixtureId) ?? {
            fixtureId: fixture.apiFootballFixtureId,
            providerFixture: null,
            evidence: {
              providerFixtureId: fixture.apiFootballFixtureId,
              verificationStatus: "provider_transport_failed",
              attemptCount: 0,
              finalHttpStatus: null,
              retryClassification: "retry_exhausted",
              sanitizedErrorCode: "lookup_missing",
              sanitizedErrorMessage: "Provider lookup evidence was missing for this fixture.",
              retryAfterSeconds: null,
              fixtureIdentityReturned: false,
              kickoffAt: null,
              round: null,
              homeTeamName: null,
              awayTeamName: null,
              status: null,
              identityChecks: {
                fixtureReturned: false,
                homeIdentity: "not_checked",
                awayIdentity: "not_checked",
                kickoffIdentity: "not_checked",
                groupStageIdentity: "not_checked",
              },
            },
          },
        snapshot: input.snapshot,
        expectedCompetitionId,
        expectedSeasonId,
      }),
    );

  const outOfScopeEvidence = buildOutOfScopeEvidence();
  const summary = buildSummary(rows, outOfScopeEvidence);
  const generatedAt = new Date().toISOString();
  const basePlan: Omit<Task1cStageFixtureLinkagePlan, "stablePlanSha256"> = {
    schemaName: TASK1C_LINKAGE_SCHEMA_NAME,
    schemaVersion: TASK1C_LINKAGE_SCHEMA_VERSION,
    generatedAt,
    mode: input.authorization.mode,
    targetProjectRef: input.authorization.projectRef,
    deniedProjectRef: input.authorization.denyProjectRef,
    sourceManifestPath: input.manifestValidation.manifestPath,
    sourceManifestChecksum: input.manifestValidation.manifestSha256,
    canonicalPackageSha256: input.manifestValidation.packageSha256,
    selectedFixtureCount: rows.length,
    selectedMatchNumbers: rows.map((row) => row.matchNumber),
    selectedSlugs: rows.map((row) => row.slug),
    selectedProviderFixtureIds: rows.map((row) => row.providerFixtureId),
    providerRetrieval: {
      executionMode: "sequential_by_match_number",
      requestConcurrency: TASK1C_PROVIDER_REQUEST_CONCURRENCY,
      retryPolicy: {
        maxAttempts: TASK1C_PROVIDER_MAX_ATTEMPTS,
        retryableHttpStatuses: [...TASK1C_PROVIDER_RETRYABLE_HTTP_STATUSES],
        retryableFailureStatuses: [...TASK1C_PROVIDER_RETRYABLE_FAILURE_STATUSES],
        nonRetryableHttpStatuses: [...TASK1C_PROVIDER_NON_RETRYABLE_HTTP_STATUSES],
        retryOnProviderNotFound: false,
      },
    },
    summary,
    outOfScopeEvidence,
    rows,
    zeroWriteConfirmation: input.authorization.mode === "dry_run",
  };
  assertTask1cOutOfScopeBoundary(basePlan);

  return {
    ...basePlan,
    stablePlanSha256: sha256Json(buildStablePlanPayload(basePlan)),
  };
}

function assertReviewedApplyArtifact(input: {
  reviewArtifact: Task1cStageFixtureApplyReviewArtifact;
  currentPlan: Task1cStageFixtureLinkagePlan;
  authorization: LinkageAuthorization;
}): void {
  const { reviewArtifact, currentPlan, authorization } = input;
  if (reviewArtifact.mode !== "dry_run") {
    throw new Error("Task 1C linkage apply requires a reviewed dry-run artifact.");
  }

  if (reviewArtifact.targetProjectRef !== authorization.projectRef) {
    throw new Error("Task 1C linkage apply refused because artifact target project ref differed.");
  }

  if (reviewArtifact.deniedProjectRef !== authorization.denyProjectRef) {
    throw new Error("Task 1C linkage apply refused because artifact denied project ref differed.");
  }

  if (reviewArtifact.sourceManifestChecksum !== currentPlan.sourceManifestChecksum) {
    throw new Error("Task 1C linkage apply refused because artifact manifest checksum differed.");
  }

  if (reviewArtifact.canonicalPackageSha256 !== currentPlan.canonicalPackageSha256) {
    throw new Error("Task 1C linkage apply refused because artifact package checksum differed.");
  }

  if (reviewArtifact.selectedFixtureCount !== 24) {
    throw new Error("Task 1C linkage apply refused because reviewed fixture count was not exactly 24.");
  }

  for (const row of reviewArtifact.rows) {
    if (row.action !== "update_linkage" && row.action !== "already_linked") {
      throw new Error("Task 1C linkage apply refused because the reviewed artifact contained blocked actions.");
    }

    if (row.exactProposedPatch) {
      assertAllowedPatchShape(row.exactProposedPatch);
    }
  }

  if (reviewArtifact.summary.creates !== 0 || reviewArtifact.summary.deletes !== 0) {
    throw new Error("Task 1C linkage apply refused because create/delete actions were present.");
  }

  if (reviewArtifact.stablePlanSha256 !== sha256Json(buildStablePlanPayload(reviewArtifact))) {
    throw new Error("Task 1C linkage apply refused because the reviewed stable plan checksum did not match its contents.");
  }

  assertTask1cOutOfScopeBoundary(reviewArtifact);

  if (reviewArtifact.stablePlanSha256 !== currentPlan.stablePlanSha256) {
    throw new Error("Task 1C linkage apply refused because the reviewed stable plan checksum differed from the current plan.");
  }
}

export async function applyTask1cStageV1FixtureLinkagePlan(input: {
  authorization: LinkageAuthorization;
  currentPlan: Task1cStageFixtureLinkagePlan;
  reviewArtifact: Task1cStageFixtureApplyReviewArtifact;
  databaseAdapter: Task1cStageDatabaseAdapter;
}): Promise<void> {
  assertReviewedApplyArtifact(input);

  const updateRows = input.reviewArtifact.rows.filter((row) => row.action === "update_linkage");
  const matchIds = updateRows.map((row) => row.resolvedStageMatchUuid).filter((value): value is string => value !== null);
  const currentRows = await input.databaseAdapter.rereadMatchesByIds(matchIds);
  const rowsById = new Map(currentRows.map((row) => [row.id, row]));

  for (const row of updateRows) {
    if (!row.resolvedStageMatchUuid || !row.exactProposedPatch) {
      throw new Error("Task 1C linkage apply refused because a reviewed update row was incomplete.");
    }

    const current = rowsById.get(row.resolvedStageMatchUuid);
    if (!current) {
      throw new Error(`Task 1C linkage apply refused because stage row ${row.resolvedStageMatchUuid} disappeared.`);
    }

    if (
      current.external_id !== row.stageIdentityEvidence.existingExternalId ||
      current.intake_source !== row.stageIdentityEvidence.existingIntakeSource
    ) {
      throw new Error(`Task 1C linkage apply refused because stage row ${current.id} drifted before apply.`);
    }

    await input.databaseAdapter.updateMatchLinkage(current.id, row.exactProposedPatch);
  }
}

function buildArtifactPath(artifactsDir: string, mode: LinkageMode): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(artifactsDir, `task1c-stage-v1-fixture-linkage-${mode}-${timestamp}.json`);
}

function createLiveDatabaseAdapter(): Task1cStageDatabaseAdapter {
  const supabase = createSupabaseScriptAdminClient();

  return {
    async readSnapshot(slugs, externalIds) {
      const { data: competitionData, error: competitionError } = await supabase
        .from("competitions")
        .select("id, slug")
        .eq("slug", WORLD_CUP_COMPETITION_SLUG);
      if (competitionError) {
        throw new Error(`Failed to read competitions: ${competitionError.message}`);
      }

      const competitionIds = ((competitionData ?? []) as StageCompetitionRow[]).map((row) => row.id);
      const { data: seasonData, error: seasonError } = await supabase
        .from("seasons")
        .select("id, competition_id, year")
        .in("competition_id", competitionIds.length > 0 ? competitionIds : ["00000000-0000-0000-0000-000000000000"])
        .eq("year", WORLD_CUP_SEASON_YEAR);
      if (seasonError) {
        throw new Error(`Failed to read seasons: ${seasonError.message}`);
      }

      const seasonIds = ((seasonData ?? []) as StageSeasonRow[]).map((row) => row.id);
      const matchColumns =
        "id, external_id, slug, competition_id, season_id, home_team_id, away_team_id, kickoff_at, stage, status, access_scope, lab_status, intake_source, data_quality, source_note";
      const { data: slugMatches, error: slugMatchError } = await supabase
        .from("matches")
        .select(matchColumns)
        .in("slug", slugs.length > 0 ? slugs : ["__never__"])
        .in("season_id", seasonIds.length > 0 ? seasonIds : ["00000000-0000-0000-0000-000000000000"]);
      if (slugMatchError) {
        throw new Error(`Failed to read matches by slug: ${slugMatchError.message}`);
      }

      const { data: externalMatches, error: externalMatchError } = await supabase
        .from("matches")
        .select(matchColumns)
        .in("external_id", externalIds.length > 0 ? externalIds : ["__never__"]);
      if (externalMatchError) {
        throw new Error(`Failed to read matches by external_id: ${externalMatchError.message}`);
      }

      const mergedMatches = new Map<string, Task1cStageMatchRow>();
      for (const row of [...((slugMatches ?? []) as Task1cStageMatchRow[]), ...((externalMatches ?? []) as Task1cStageMatchRow[])]) {
        mergedMatches.set(row.id, row);
      }

      const teamIds = [...new Set([...mergedMatches.values()].flatMap((match) => [match.home_team_id, match.away_team_id]))];
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, slug, name")
        .in("id", teamIds.length > 0 ? teamIds : ["00000000-0000-0000-0000-000000000000"]);
      if (teamError) {
        throw new Error(`Failed to read teams: ${teamError.message}`);
      }

      return {
        competitions: (competitionData ?? []) as StageCompetitionRow[],
        seasons: (seasonData ?? []) as StageSeasonRow[],
        teams: (teamData ?? []) as StageTeamRow[],
        matches: [...mergedMatches.values()],
      };
    },
    async rereadMatchesByIds(matchIds) {
      const { data, error } = await supabase
        .from("matches")
        .select("id, external_id, slug, competition_id, season_id, home_team_id, away_team_id, kickoff_at, stage, status, access_scope, lab_status, intake_source, data_quality, source_note")
        .in("id", matchIds.length > 0 ? matchIds : ["00000000-0000-0000-0000-000000000000"]);
      if (error) {
        throw new Error(`Failed to re-read stage rows before apply: ${error.message}`);
      }
      return (data ?? []) as Task1cStageMatchRow[];
    },
    async updateMatchLinkage(matchId, patch) {
      assertAllowedPatchShape(patch);
      const { error } = await supabase.from("matches").update(patch).eq("id", matchId);
      if (error) {
        throw new Error(`Failed to update stage linkage for ${matchId}: ${error.message}`);
      }
    },
  };
}

function createLiveProviderReader(): Task1cStageProviderReader {
  return {
    async readFixtureById(fixtureId) {
      return fetchApiFootballFixtureByIdDetailed(fixtureId);
    },
  };
}

export async function runTask1cStageV1FixtureLinkage(
  input: RunTask1cStageV1FixtureLinkageInput,
  dependencies?: {
    databaseAdapter?: Task1cStageDatabaseAdapter;
    providerReader?: Task1cStageProviderReader;
  },
): Promise<RunTask1cStageV1FixtureLinkageResult> {
  const authorization = assertTask1cStageV1LinkageAuthorization({
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    supabaseUrl: input.supabaseUrl,
    apply: input.apply === true,
  });
  const manifestValidation = validateTask1cStageV1FixtureLinkageManifest({
    sourceManifestPath: input.sourceManifestPath,
    packageSha256: input.packageSha256,
  });

  const providerReader = dependencies?.providerReader ?? createLiveProviderReader();
  const databaseAdapter = dependencies?.databaseAdapter ?? createLiveDatabaseAdapter();
  const slugs = manifestValidation.manifest.fixtures.map((fixture) => fixture.canonicalSlug);
  const externalIds = manifestValidation.manifest.fixtures.map((fixture) =>
    buildApiFootballFixtureExternalId(fixture.apiFootballFixtureId),
  );

  const [snapshot, providerLookups] = await Promise.all([
    databaseAdapter.readSnapshot(slugs, externalIds),
    fetchTask1cProviderLookupsSequential(
      manifestValidation.manifest.fixtures
        .slice()
        .sort((left, right) => left.matchNumber - right.matchNumber),
      providerReader,
    ),
  ]);

  const plan = planTask1cStageV1FixtureLinkage({
    authorization,
    manifestValidation,
    providerLookups,
    snapshot,
  });

  if (authorization.mode === "apply") {
    if (!input.allowlistManifestPath) {
      throw new Error("Task 1C linkage apply requires --allowlist-manifest.");
    }
    const reviewArtifact = readJsonFile<Task1cStageFixtureApplyReviewArtifact>(path.resolve(input.allowlistManifestPath));
    await applyTask1cStageV1FixtureLinkagePlan({
      authorization,
      currentPlan: plan,
      reviewArtifact,
      databaseAdapter,
    });
  }

  const artifactPath = buildArtifactPath(input.artifactsDir, authorization.mode);
  writeJsonFile(artifactPath, plan);
  return { artifactPath, plan };
}
