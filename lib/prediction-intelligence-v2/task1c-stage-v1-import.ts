import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { buildApiFootballFixtureExternalId } from "../football-api/ingest/external-ids";
import { createSupabaseScriptAdminClient } from "../supabase/script-admin";
import type {
  DatabaseInsert,
  Json,
  MatchRow,
  ModelVersionRow,
  PredictionMarketRow,
  PredictionNarrativeRow,
  PredictionVersionRow,
  ProfileRow,
} from "../../types/database";
import {
  assertApprovedFixtureIdentity,
  assertExactFixtureAllowlist,
  assertFrozenArtifactChecksums,
  normalizeComparableText,
  normalizeUrlHost,
  resolveProjectRefFromUrl,
  sameInstant,
  type FrozenArtifactChecksums,
  type FrozenRunReport,
  type FrozenSourceManifest,
  type FrozenValidationReport,
  type FrozenV1SourcePackage,
  type PublicPredictionSummaryRow,
  type SourceMarketRecord,
  type SourcePredictionRecord,
} from "./task1c-frozen-v1-source-package";

const TASK1C_IMPORT_SCHEMA_NAME = "ufo-task1c-stage-v1-import-v1";
const TASK1C_IMPORT_SCHEMA_VERSION = 1;
const TASK1C_IMPORT_ARTIFACT_ROOT = path.join(
  "artifacts",
  "prediction-intelligence-v2",
  "task1c-stage-v1-import",
  "local-run",
);
const APPROVED_STAGE_PROJECT_REF = "yfmklapgjrupctgxaako";
const APPROVED_DENY_PROJECT_REF = "gcpdffkgsdomzyoenalg";
const APPROVED_PACKAGE_SHA256 = "bdb8a3bc57734f97f826a6988c009c646a62e3a0036f6f10fb214e113dbc8416";
const APPROVED_SOURCE_ARTIFACT_DIR = path.join(
  "artifacts",
  "prediction-intelligence-v2",
  "task1c",
  "2026-06-26",
  "2026-06-26T10-59-46-686Z",
);
const WORLD_CUP_COMPETITION_SLUG = "world-cup-2026";
const SOURCE_MODEL_VERSION = "v0.2-prelaunch";
const SOURCE_PREDICTION_TYPE = "pre_match_24h";
const SOURCE_RUN_SCOPE = "public_product";

type ImportMode = "dry_run" | "apply";
type PlanState = "fresh" | "exact_complete" | "partial_or_conflicting";
type ModelAction = "insert" | "already_present" | "blocked";
type PredictionAction = "insert" | "already_present" | "blocked";
type MarketAction = "insert" | "already_present" | "blocked";
type AccessScopeAction = "already_public" | "publish_from_admin_only" | "blocked";

type StageCompetitionRow = {
  id: string;
  slug: string;
  usage_scope: "public_product" | "internal_lab";
};

type StageTeamRow = {
  id: string;
  slug: string;
  name: string;
};

export type Task1cStageImportMatchRow = {
  id: string;
  external_id: string | null;
  slug: string;
  competition_id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  kickoff_at: string;
  stage: string | null;
  status: MatchRow["status"];
  access_scope: MatchRow["access_scope"];
  lab_status: MatchRow["lab_status"];
  intake_source: MatchRow["intake_source"];
  data_quality: MatchRow["data_quality"];
  source_note: string | null;
};

type AuthUserInventoryRow = {
  id: string;
  email: string | null;
};

type PredictionWithModel = PredictionVersionRow & {
  model_version: ModelVersionRow | null;
};

export type Task1cStageImportSnapshot = {
  competitions: StageCompetitionRow[];
  teams: StageTeamRow[];
  matches: Task1cStageImportMatchRow[];
  modelVersions: ModelVersionRow[];
  predictionVersions: PredictionWithModel[];
  predictionMarkets: PredictionMarketRow[];
  predictionNarratives: PredictionNarrativeRow[];
  publicPredictionSummaries: PublicPredictionSummaryRow[];
  authUsers: AuthUserInventoryRow[];
  profiles: Array<Pick<ProfileRow, "id" | "email" | "role">>;
};

type CompatibleChecksumResult = {
  sha256: string;
  lineEndingCompatibility: "raw_lf" | "normalized_crlf";
};

export type Task1cStageImportSourceBundle = {
  artifactDirectory: string;
  packagePath: string;
  manifestPath: string;
  validationPath: string;
  checksumsPath: string;
  runReportPath: string;
  packageSha256: string;
  manifestSha256: string;
  validationSha256: string;
  checksums: FrozenArtifactChecksums;
  packageData: FrozenV1SourcePackage;
  manifestData: FrozenSourceManifest;
  validationData: FrozenValidationReport;
  runReportData: FrozenRunReport;
  lineEndingCompatibility: {
    package: CompatibleChecksumResult["lineEndingCompatibility"];
    manifest: CompatibleChecksumResult["lineEndingCompatibility"];
    validation: CompatibleChecksumResult["lineEndingCompatibility"];
  };
};

export type Task1cStageImportAuthorization = {
  mode: ImportMode;
  projectRef: string;
  denyProjectRef: string;
  supabaseUrlHost: string;
  targetProof: "explicit_project_ref_and_url_match";
  productionDenied: true;
};

export type Task1cImportedModelPayload = Pick<
  DatabaseInsert<"model_versions">,
  "version" | "description" | "weights_json" | "is_active" | "created_at" | "updated_at"
>;

export type Task1cImportedPredictionPayload = Pick<
  DatabaseInsert<"prediction_versions">,
  | "match_id"
  | "prediction_type"
  | "home_win_prob"
  | "draw_prob"
  | "away_win_prob"
  | "expected_home_goals"
  | "expected_away_goals"
  | "most_likely_score"
  | "top_scores_json"
  | "confidence_score"
  | "risk_level"
  | "run_scope"
  | "created_at"
> & {
  model_version: string;
  canonical_slug: string;
  source_prediction_ref: string;
};

export type Task1cImportedMarketPayload = Pick<
  DatabaseInsert<"prediction_markets">,
  "market" | "selection" | "probability" | "confidence" | "is_premium" | "created_at"
> & {
  match_id: string;
  model_version: string;
  prediction_type: PredictionVersionRow["prediction_type"];
  run_scope: PredictionVersionRow["run_scope"];
  prediction_created_at: string;
  canonical_slug: string;
  source_market_ref: string;
};

export type Task1cStageImportMatchPlanRow = {
  matchNumber: number;
  canonicalSlug: string;
  apiFootballFixtureId: number;
  expectedExternalId: string;
  stageMatchId: string | null;
  teamIdentity: {
    homeMatches: boolean;
    awayMatches: boolean;
  };
  kickoffMatches: boolean;
  competitionMatches: boolean;
  intakeSourceMatches: boolean;
  accessScopeAction: AccessScopeAction;
  predictionAction: PredictionAction;
  marketAction: MarketAction;
  exactPredictionIdentity: {
    createdAt: string;
    sourcePredictionRef: string;
  };
  existingPredictionId: string | null;
  blockerCodes: string[];
};

export type Task1cStageImportSummary = {
  state: PlanState;
  modelAction: ModelAction;
  selectedFixtureCount: number;
  resolvedStageMatchCount: number;
  exactPredictionCount: number;
  exactMarketCount: number;
  narrativeCount: number;
  alreadyPublicCount: number;
  publishFromAdminOnlyCount: number;
  blockedMatchCount: number;
  expectedFirstApplyCounts: {
    modelInserts: number;
    predictionInserts: number;
    marketInserts: number;
    narrativeInserts: 0;
    modelActivations: number;
    matchPublications: number;
    deletes: 0;
    predictionUpdates: 0;
    marketUpdates: 0;
  };
  expectedRerunCounts: {
    modelInserts: 0;
    predictionInserts: 0;
    marketInserts: 0;
    narrativeInserts: 0;
    modelActivations: 0;
    matchPublications: 0;
    deletes: 0;
    predictionUpdates: 0;
    marketUpdates: 0;
  };
};

export type Task1cStageImportPlan = {
  schemaName: typeof TASK1C_IMPORT_SCHEMA_NAME;
  schemaVersion: typeof TASK1C_IMPORT_SCHEMA_VERSION;
  generatedAt: string;
  mode: ImportMode;
  targetProjectRef: string;
  deniedProjectRef: string;
  sourceArtifacts: {
    artifactDirectory: string;
    packagePath: string;
    manifestPath: string;
    validationPath: string;
    checksumsPath: string;
    runReportPath: string;
    packageSha256: string;
    manifestSha256: string;
    validationSha256: string;
  };
  stagePreservation: {
    authUserCount: number;
    adminProfileCount: number;
  };
  expectedPriorState: PlanState;
  sourceCounts: {
    models: number;
    fixtures: number;
    predictions: number;
    markets: number;
    exactScoreMarkets: number;
    narratives: number;
    publicSourceSummaries: number;
  };
  summary: Task1cStageImportSummary;
  modelPayload: Task1cImportedModelPayload;
  predictionPayloads: Task1cImportedPredictionPayload[];
  marketPayloads: Task1cImportedMarketPayload[];
  accessScopePublications: Array<{
    match_id: string;
    slug: string;
    current_access_scope: "admin_only";
    next_access_scope: "public";
  }>;
  rows: Task1cStageImportMatchPlanRow[];
  blockers: string[];
  conflicts: string[];
  stablePlanSha256: string;
  zeroWriteConfirmation: boolean;
};

export type Task1cStageImportApplyResult = {
  requestedState: PlanState;
  modelInsertedCount: number;
  predictionInsertedCount: number;
  marketInsertedCount: number;
  narrativeInsertedCount: number;
  modelActivatedCount: number;
  matchPublishedCount: number;
  alreadyPresentModelCount: number;
  alreadyPresentPredictionCount: number;
  alreadyPresentMarketCount: number;
  alreadyPublicMatchCount: number;
};

type Task1cStageImportPublicationPayload = Task1cStageImportPlan["accessScopePublications"][number];

type VerificationSummary = {
  matchingModelCount: number;
  activeImportedModelCount: number;
  matchingPredictionCount: number;
  matchingMarketCount: number;
  importedNarrativeCount: number;
  publicMatchCount: number;
  publicPredictionSummaryCount: number;
};

export type Task1cStageImportVerification = {
  summary: VerificationSummary;
  blockers: string[];
  exact: boolean;
};

type Task1cStageImportDatabaseAdapter = {
  readSnapshot(slugs: string[], externalIds: string[]): Promise<Task1cStageImportSnapshot>;
  applyImportPlan(reviewArtifact: Task1cStageImportPlan): Promise<Task1cStageImportApplyResult>;
};

export type RunTask1cStageV1ImportInput = {
  repoRoot: string;
  artifactsDir: string;
  projectRef: string;
  denyProjectRef: string;
  supabaseUrl: string | null | undefined;
  sourceArtifactDir?: string;
  apply?: boolean;
  reviewedPlanPath?: string | null;
};

export type RunTask1cStageV1ImportResult = {
  artifactPath: string;
  plan: Task1cStageImportPlan;
};

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }

  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function sha256Buffer(buffer: Buffer | string): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function sha256Json(value: unknown): string {
  return sha256Buffer(stableStringify(value));
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJsonFile(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function asUtf8WithoutBom(buffer: Buffer, filePath: string): string {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    throw new Error(`Task 1C import refused ${filePath} because UTF-8 BOM is not supported by the canonical checksum contract.`);
  }

  const decoded = buffer.toString("utf8");
  if (Buffer.compare(Buffer.from(decoded, "utf8"), buffer) !== 0) {
    throw new Error(`Task 1C import refused ${filePath} because it is not strict UTF-8.`);
  }

  return decoded;
}

function verifyCompatibleChecksum(filePath: string, expectedSha256: string): CompatibleChecksumResult {
  const raw = fs.readFileSync(filePath);
  const rawSha256 = sha256Buffer(raw);
  if (rawSha256 === expectedSha256) {
    return {
      sha256: rawSha256,
      lineEndingCompatibility: "raw_lf",
    };
  }

  const decoded = asUtf8WithoutBom(raw, filePath);
  const normalized = decoded.replace(/\r\n/g, "\n");
  const normalizedSha256 = sha256Buffer(Buffer.from(normalized, "utf8"));
  if (normalizedSha256 === expectedSha256) {
    return {
      sha256: normalizedSha256,
      lineEndingCompatibility: "normalized_crlf",
    };
  }

  throw new Error(
    `Task 1C import refused ${filePath} because its checksum did not match the approved canonical contract.`,
  );
}

function assertSourceCardinalityAndComposition(source: FrozenV1SourcePackage): void {
  const expected = source.expectedCounts;
  const observed = source.observedCounts;

  if (
    expected.models !== 1 ||
    expected.fixtures !== 24 ||
    expected.predictions !== 24 ||
    expected.markets !== 240 ||
    expected.exactScoreMarkets !== 72 ||
    expected.narratives !== 0 ||
    expected.publicSourceSummaries !== 24
  ) {
    throw new Error("Task 1C import refused because the frozen source expected counts drifted.");
  }

  if (
    observed.models !== 1 ||
    observed.fixtures !== 24 ||
    observed.predictions !== 24 ||
    observed.markets !== 240 ||
    observed.exactScoreMarkets !== 72 ||
    observed.narratives !== 0 ||
    observed.publicSourceSummaries !== 24
  ) {
    throw new Error("Task 1C import refused because the frozen source observed counts drifted.");
  }

  const fixtures = source.fixtureManifest.map((fixture) => ({
    matchNumber: fixture.matchNumber,
    matchSlug: fixture.canonicalSlug,
  }));
  assertExactFixtureAllowlist(fixtures);

  for (const fixture of source.fixtureManifest) {
    assertApprovedFixtureIdentity({
      matchNumber: fixture.matchNumber,
      canonicalSlug: fixture.canonicalSlug,
      apiFootballFixtureId: fixture.apiFootballFixtureId,
      canonicalHomeTeamKey: fixture.canonicalHomeTeamKey,
      canonicalAwayTeamKey: fixture.canonicalAwayTeamKey,
      kickoffAt: fixture.kickoffAt,
    });
  }

  const predictionBySlug = new Map<string, SourcePredictionRecord>();
  for (const prediction of source.predictions) {
    if (predictionBySlug.has(prediction.canonicalSlug)) {
      throw new Error(`Task 1C import refused because duplicate prediction payloads existed for ${prediction.canonicalSlug}.`);
    }
    predictionBySlug.set(prediction.canonicalSlug, prediction);
  }

  const marketsBySlug = new Map<string, SourceMarketRecord[]>();
  for (const market of source.predictionMarkets) {
    const rows = marketsBySlug.get(market.canonicalSlug) ?? [];
    rows.push(market);
    marketsBySlug.set(market.canonicalSlug, rows);
  }

  for (const fixture of source.fixtureManifest) {
    const prediction = predictionBySlug.get(fixture.canonicalSlug);
    if (!prediction) {
      throw new Error(`Task 1C import refused because prediction payload was missing for ${fixture.canonicalSlug}.`);
    }

    const markets = marketsBySlug.get(fixture.canonicalSlug) ?? [];
    if (markets.length !== 10) {
      throw new Error(`Task 1C import refused because ${fixture.canonicalSlug} did not have exactly 10 frozen markets.`);
    }

    const counts = {
      match_winner: markets.filter((market) => market.market === "match_winner").length,
      btts: markets.filter((market) => market.market === "btts").length,
      over_2_5: markets.filter((market) => market.market === "over_2_5").length,
      exact_score: markets.filter((market) => market.market === "exact_score").length,
    };

    if (counts.match_winner !== 3 || counts.btts !== 2 || counts.over_2_5 !== 2 || counts.exact_score !== 3) {
      throw new Error(`Task 1C import refused because frozen market composition drifted for ${fixture.canonicalSlug}.`);
    }

    for (const market of markets) {
      if (market.isPremium !== false) {
        throw new Error(`Task 1C import refused because ${fixture.canonicalSlug} had a premium market in the immutable V1 baseline.`);
      }
    }

    if (!sameInstant(prediction.originalTimestamps.createdAt, prediction.sourcePublicationEvidence.publicSummaryPredictionCreatedAt)) {
      throw new Error(
        `Task 1C import refused because publication evidence timestamp drifted for ${fixture.canonicalSlug}.`,
      );
    }
  }

  if (source.predictionNarratives.length !== 0) {
    throw new Error("Task 1C import refused because frozen V1 source included narratives.");
  }
}

function findChecksumEntry(report: FrozenArtifactChecksums, filename: string) {
  const entry = report.files.find((file) => file.filename === filename);
  if (!entry) {
    throw new Error(`Task 1C import refused because ${filename} was missing from frozen checksums.`);
  }
  return entry;
}

export function loadTask1cStageV1ImportSourceBundle(args: {
  repoRoot: string;
  artifactDirectory?: string;
}): Task1cStageImportSourceBundle {
  const artifactDirectory = path.resolve(args.repoRoot, args.artifactDirectory ?? APPROVED_SOURCE_ARTIFACT_DIR);
  const packagePath = path.join(artifactDirectory, "ufo-frozen-v1-source-package-v1.json");
  const manifestPath = path.join(artifactDirectory, "frozen-source-manifest.json");
  const validationPath = path.join(artifactDirectory, "validation-report.json");
  const checksumsPath = path.join(artifactDirectory, "checksums.json");
  const runReportPath = path.join(artifactDirectory, "run-report.json");

  const checksums = readJsonFile<FrozenArtifactChecksums>(checksumsPath);
  assertFrozenArtifactChecksums(checksums);

  const packageEntry = findChecksumEntry(checksums, "ufo-frozen-v1-source-package-v1.json");
  const manifestEntry = findChecksumEntry(checksums, "frozen-source-manifest.json");
  const validationEntry = findChecksumEntry(checksums, "validation-report.json");
  if (packageEntry.firstReadSha256 !== APPROVED_PACKAGE_SHA256) {
    throw new Error("Task 1C import refused because the approved package checksum drifted.");
  }

  const packageChecksum = verifyCompatibleChecksum(packagePath, packageEntry.firstReadSha256);
  const manifestChecksum = verifyCompatibleChecksum(manifestPath, manifestEntry.firstReadSha256);
  const validationChecksum = verifyCompatibleChecksum(validationPath, validationEntry.firstReadSha256);

  const packageData = readJsonFile<FrozenV1SourcePackage>(packagePath);
  const manifestData = readJsonFile<FrozenSourceManifest>(manifestPath);
  const validationData = readJsonFile<FrozenValidationReport>(validationPath);
  const runReportData = readJsonFile<FrozenRunReport>(runReportPath);

  if (validationData.verdict !== "valid") {
    throw new Error(`Task 1C import refused because the frozen validation report verdict was ${validationData.verdict}.`);
  }

  if (
    runReportData.productionDatabaseWrites !== 0 ||
    runReportData.stageDatabaseWrites !== 0 ||
    runReportData.artifacts.packageSha256 !== APPROVED_PACKAGE_SHA256
  ) {
    throw new Error("Task 1C import refused because the frozen source run report drifted.");
  }

  if (packageData.sourceScope.sourceProjectRef !== APPROVED_DENY_PROJECT_REF || manifestData.sourceProjectRef !== APPROVED_DENY_PROJECT_REF) {
    throw new Error("Task 1C import refused because the frozen source project ref was not the approved denied production ref.");
  }

  if (manifestData.sourceScope.modelVersion !== SOURCE_MODEL_VERSION || packageData.model.version !== SOURCE_MODEL_VERSION) {
    throw new Error("Task 1C import refused because the frozen source model version drifted.");
  }

  assertSourceCardinalityAndComposition(packageData);

  return {
    artifactDirectory,
    packagePath,
    manifestPath,
    validationPath,
    checksumsPath,
    runReportPath,
    packageSha256: packageChecksum.sha256,
    manifestSha256: manifestChecksum.sha256,
    validationSha256: validationChecksum.sha256,
    checksums,
    packageData,
    manifestData,
    validationData,
    runReportData,
    lineEndingCompatibility: {
      package: packageChecksum.lineEndingCompatibility,
      manifest: manifestChecksum.lineEndingCompatibility,
      validation: validationChecksum.lineEndingCompatibility,
    },
  };
}

export function resolveTask1cStageV1ImportDefaults(repoRoot: string) {
  return {
    artifactsDir: path.join(repoRoot, TASK1C_IMPORT_ARTIFACT_ROOT),
    sourceArtifactDir: path.join(repoRoot, APPROVED_SOURCE_ARTIFACT_DIR),
  };
}

export function assertTask1cStageV1ImportAuthorization(input: {
  projectRef: string | null | undefined;
  denyProjectRef: string | null | undefined;
  supabaseUrl: string | null | undefined;
  apply: boolean;
  reviewedPlanPath?: string | null;
}): Task1cStageImportAuthorization {
  if (!input.projectRef) {
    throw new Error("Task 1C import requires --project-ref.");
  }

  if (!input.denyProjectRef) {
    throw new Error("Task 1C import requires --deny-project-ref.");
  }

  if (input.projectRef !== APPROVED_STAGE_PROJECT_REF) {
    throw new Error(`Task 1C import refused unauthorized project ref ${input.projectRef}.`);
  }

  if (input.denyProjectRef !== APPROVED_DENY_PROJECT_REF) {
    throw new Error("Task 1C import refused because the denied production ref was invalid.");
  }

  if (!input.supabaseUrl) {
    throw new Error("Task 1C import requires NEXT_PUBLIC_SUPABASE_URL.");
  }

  const supabaseUrlHost = normalizeUrlHost(input.supabaseUrl);
  const resolvedProjectRef = resolveProjectRefFromUrl(input.supabaseUrl);
  if (resolvedProjectRef !== input.projectRef) {
    throw new Error("Task 1C import refused because NEXT_PUBLIC_SUPABASE_URL mismatched --project-ref.");
  }

  if (input.apply && !input.reviewedPlanPath) {
    throw new Error("Task 1C import apply requires --reviewed-plan and may not be enabled by a boolean alone.");
  }

  return {
    mode: input.apply ? "apply" : "dry_run",
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    supabaseUrlHost,
    targetProof: "explicit_project_ref_and_url_match",
    productionDenied: true,
  };
}

function compareJsonExact(left: Json, right: Json): boolean {
  return stableStringify(left) === stableStringify(right);
}

function compareModelExact(model: ModelVersionRow, source: Task1cStageImportSourceBundle["packageData"]["model"]): boolean {
  return (
    model.version === source.version &&
    normalizeComparableText(model.description ?? "") === normalizeComparableText(source.description ?? "") &&
    compareJsonExact(model.weights_json, source.weightsJson) &&
    model.is_active === source.sourceState.isActive &&
    sameInstant(model.created_at, source.originalTimestamps.createdAt) &&
    sameInstant(model.updated_at, source.originalTimestamps.updatedAt)
  );
}

function comparePredictionExact(stage: PredictionWithModel, source: SourcePredictionRecord): boolean {
  return (
    stage.model_version?.version === SOURCE_MODEL_VERSION &&
    stage.prediction_type === source.predictionType &&
    stage.run_scope === source.runScope &&
    stage.home_win_prob === source.probabilities.homeWin &&
    stage.draw_prob === source.probabilities.draw &&
    stage.away_win_prob === source.probabilities.awayWin &&
    stage.expected_home_goals === source.expectedGoals.home &&
    stage.expected_away_goals === source.expectedGoals.away &&
    stage.most_likely_score === source.mostLikelyScore &&
    compareJsonExact(stage.top_scores_json, source.topScoresJson) &&
    stage.confidence_score === source.confidenceScore &&
    stage.risk_level === source.riskLevel &&
    sameInstant(stage.created_at, source.originalTimestamps.createdAt)
  );
}

function compareMarketExact(stage: PredictionMarketRow, source: SourceMarketRecord): boolean {
  return (
    stage.market === source.market &&
    stage.selection === source.selection &&
    stage.probability === source.probability &&
    stage.confidence === source.confidence &&
    stage.is_premium === source.isPremium &&
    sameInstant(stage.created_at, source.originalTimestamps.createdAt)
  );
}

function indexBy<T>(rows: T[], keyFn: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyFn(row);
    const bucket = map.get(key) ?? [];
    bucket.push(row);
    map.set(key, bucket);
  }
  return map;
}

type Task1cStageImportPlanSemanticProjection = {
  schemaName: Task1cStageImportPlan["schemaName"];
  schemaVersion: Task1cStageImportPlan["schemaVersion"];
  targetProjectRef: Task1cStageImportPlan["targetProjectRef"];
  deniedProjectRef: Task1cStageImportPlan["deniedProjectRef"];
  sourceArtifacts: Pick<
    Task1cStageImportPlan["sourceArtifacts"],
    "packageSha256" | "manifestSha256" | "validationSha256"
  >;
  stagePreservation: Task1cStageImportPlan["stagePreservation"];
  expectedPriorState: Task1cStageImportPlan["expectedPriorState"];
  sourceCounts: Task1cStageImportPlan["sourceCounts"];
  summary: Task1cStageImportPlan["summary"];
  modelPayload: Task1cStageImportPlan["modelPayload"];
  predictionPayloads: Task1cStageImportPlan["predictionPayloads"];
  marketPayloads: Task1cStageImportPlan["marketPayloads"];
  accessScopePublications: Task1cStageImportPlan["accessScopePublications"];
  rows: Task1cStageImportPlan["rows"];
  blockers: Task1cStageImportPlan["blockers"];
  conflicts: Task1cStageImportPlan["conflicts"];
};

function buildStablePlanPayload(
  plan: Omit<Task1cStageImportPlan, "generatedAt" | "stablePlanSha256">,
): Task1cStageImportPlanSemanticProjection {
  return {
    schemaName: plan.schemaName,
    schemaVersion: plan.schemaVersion,
    targetProjectRef: plan.targetProjectRef,
    deniedProjectRef: plan.deniedProjectRef,
    sourceArtifacts: {
      packageSha256: plan.sourceArtifacts.packageSha256,
      manifestSha256: plan.sourceArtifacts.manifestSha256,
      validationSha256: plan.sourceArtifacts.validationSha256,
    },
    stagePreservation: plan.stagePreservation,
    expectedPriorState: plan.expectedPriorState,
    sourceCounts: plan.sourceCounts,
    summary: plan.summary,
    modelPayload: plan.modelPayload,
    predictionPayloads: plan.predictionPayloads,
    marketPayloads: plan.marketPayloads,
    accessScopePublications: plan.accessScopePublications.map((publication) => {
      const normalizedPublication = normalizePublicationPayloadRow(publication);
      return {
        match_id: normalizedPublication.match_id,
        slug: normalizedPublication.slug,
        current_access_scope: normalizedPublication.current_access_scope,
        next_access_scope: normalizedPublication.next_access_scope,
      };
    }),
    rows: plan.rows,
    blockers: plan.blockers,
    conflicts: plan.conflicts,
  };
}

function normalizePublicationPayloadRow(publication: Record<string, unknown>): Task1cStageImportPublicationPayload {
  return {
    match_id: String(publication.match_id ?? publication.matchId ?? ""),
    slug: String(publication.slug ?? ""),
    current_access_scope: String(publication.current_access_scope ?? publication.currentAccessScope ?? ""),
    next_access_scope: String(publication.next_access_scope ?? publication.nextAccessScope ?? ""),
  } as Task1cStageImportPublicationPayload;
}

function normalizePublicationPayloadRows(
  publications: Task1cStageImportPlan["accessScopePublications"],
): Task1cStageImportPlan["accessScopePublications"] {
  return publications.map((publication) =>
    normalizePublicationPayloadRow(publication as Record<string, unknown>),
  );
}

function normalizeTask1cStageImportPlanForApply(plan: Task1cStageImportPlan): Task1cStageImportPlan {
  return {
    ...plan,
    accessScopePublications: normalizePublicationPayloadRows(plan.accessScopePublications),
  };
}

function modelPayloadFromSource(source: Task1cStageImportSourceBundle["packageData"]): Task1cImportedModelPayload {
  return {
    version: source.model.version,
    description: source.model.description,
    weights_json: source.model.weightsJson,
    is_active: source.model.sourceState.isActive,
    created_at: source.model.originalTimestamps.createdAt,
    updated_at: source.model.originalTimestamps.updatedAt,
  };
}

function predictionPayloadsFromSource(args: {
  source: Task1cStageImportSourceBundle["packageData"];
  resolvedMatchIds: Map<string, string>;
}): Task1cImportedPredictionPayload[] {
  return args.source.predictions
    .slice()
    .sort((left, right) => left.canonicalSlug.localeCompare(right.canonicalSlug))
    .map((prediction) => {
      const matchId = args.resolvedMatchIds.get(prediction.canonicalSlug);
      if (!matchId) {
        throw new Error(`Task 1C import planning could not resolve stage match for ${prediction.canonicalSlug}.`);
      }
      return {
        match_id: matchId,
        model_version: args.source.model.version,
        canonical_slug: prediction.canonicalSlug,
        source_prediction_ref: prediction.sourceLineage.sourcePredictionRef,
        prediction_type: prediction.predictionType,
        home_win_prob: prediction.probabilities.homeWin,
        draw_prob: prediction.probabilities.draw,
        away_win_prob: prediction.probabilities.awayWin,
        expected_home_goals: prediction.expectedGoals.home,
        expected_away_goals: prediction.expectedGoals.away,
        most_likely_score: prediction.mostLikelyScore,
        top_scores_json: prediction.topScoresJson,
        confidence_score: prediction.confidenceScore,
        risk_level: prediction.riskLevel,
        run_scope: prediction.runScope,
        created_at: prediction.originalTimestamps.createdAt,
      };
    });
}

function marketPayloadsFromSource(args: {
  source: Task1cStageImportSourceBundle["packageData"];
  resolvedMatchIds: Map<string, string>;
  sourcePredictionsBySlug: Map<string, SourcePredictionRecord>;
}): Task1cImportedMarketPayload[] {
  return args.source.predictionMarkets
    .slice()
    .sort(
      (left, right) =>
        left.canonicalSlug.localeCompare(right.canonicalSlug) ||
        left.market.localeCompare(right.market) ||
        left.selection.localeCompare(right.selection),
    )
    .map((market) => {
      const prediction = args.sourcePredictionsBySlug.get(market.canonicalSlug);
      const matchId = args.resolvedMatchIds.get(market.canonicalSlug);
      if (!prediction || !matchId) {
        throw new Error(`Task 1C import planning could not resolve market parent for ${market.canonicalSlug}.`);
      }

      return {
        match_id: matchId,
        model_version: args.source.model.version,
        prediction_type: prediction.predictionType,
        run_scope: prediction.runScope,
        prediction_created_at: prediction.originalTimestamps.createdAt,
        canonical_slug: market.canonicalSlug,
        source_market_ref: market.sourceLineage.sourceMarketRef,
        market: market.market,
        selection: market.selection,
        probability: market.probability,
        confidence: market.confidence,
        is_premium: market.isPremium,
        created_at: market.originalTimestamps.createdAt,
      };
    });
}

function resolveMatches(args: {
  source: Task1cStageImportSourceBundle["packageData"];
  snapshot: Task1cStageImportSnapshot;
}): {
  rows: Task1cStageImportMatchPlanRow[];
  resolvedMatchIds: Map<string, string>;
  blockers: string[];
  publicationRows: Task1cStageImportPlan["accessScopePublications"];
} {
  const teamsById = new Map(args.snapshot.teams.map((team) => [team.id, team]));
  const matchesBySlug = indexBy(args.snapshot.matches, (match) => match.slug);
  const matchesByExternalId = indexBy(args.snapshot.matches.filter((match) => match.external_id), (match) => match.external_id ?? "");
  const predictionsByMatchId = indexBy(args.snapshot.predictionVersions, (prediction) => prediction.match_id);
  const marketsByPredictionId = indexBy(args.snapshot.predictionMarkets, (market) => market.prediction_version_id);
  const narrativesByPredictionId = indexBy(args.snapshot.predictionNarratives, (narrative) => narrative.prediction_version_id);
  const sourcePredictionsBySlug = new Map(args.source.predictions.map((prediction) => [prediction.canonicalSlug, prediction]));
  const sourceMarketsBySlug = indexBy(args.source.predictionMarkets, (market) => market.canonicalSlug);
  const publicationRows: Task1cStageImportPlan["accessScopePublications"] = [];
  const blockers: string[] = [];
  const rows: Task1cStageImportMatchPlanRow[] = [];
  const resolvedMatchIds = new Map<string, string>();

  for (const fixture of args.source.fixtureManifest.slice().sort((left, right) => left.matchNumber - right.matchNumber)) {
    const expectedExternalId = buildApiFootballFixtureExternalId(fixture.apiFootballFixtureId);
    const slugMatches = matchesBySlug.get(fixture.canonicalSlug) ?? [];
    const externalMatches = matchesByExternalId.get(expectedExternalId) ?? [];
    const exactMatches = slugMatches.filter((match) => match.external_id === expectedExternalId);
    const match =
      exactMatches.length === 1
        ? exactMatches[0]
        : externalMatches.length === 1 && slugMatches.includes(externalMatches[0]!)
          ? externalMatches[0]!
          : null;

    const sourcePrediction = sourcePredictionsBySlug.get(fixture.canonicalSlug)!;
    const sourceMarkets = sourceMarketsBySlug.get(fixture.canonicalSlug) ?? [];
    const blockerCodes: string[] = [];

    if (slugMatches.length !== 1) {
      blockerCodes.push(slugMatches.length === 0 ? "stage_match_missing_by_slug" : "stage_match_duplicate_by_slug");
    }

    if (externalMatches.length !== 1) {
      blockerCodes.push(externalMatches.length === 0 ? "stage_match_missing_by_external_id" : "stage_match_duplicate_by_external_id");
    }

    const homeTeam = match ? teamsById.get(match.home_team_id) : null;
    const awayTeam = match ? teamsById.get(match.away_team_id) : null;
    const homeMatches = homeTeam?.slug === fixture.canonicalHomeTeamKey;
    const awayMatches = awayTeam?.slug === fixture.canonicalAwayTeamKey;
    const kickoffMatches = match ? sameInstant(match.kickoff_at, fixture.kickoffAt) : false;
    const competition = match ? args.snapshot.competitions.find((row) => row.id === match.competition_id) ?? null : null;
    const competitionMatches = competition?.slug === WORLD_CUP_COMPETITION_SLUG && competition?.usage_scope === "public_product";
    const intakeSourceMatches = match?.intake_source === "api_football";

    if (!match) {
      blockerCodes.push("stage_match_unresolved");
    }
    if (!homeMatches) {
      blockerCodes.push("home_team_identity_mismatch");
    }
    if (!awayMatches) {
      blockerCodes.push("away_team_identity_mismatch");
    }
    if (!kickoffMatches) {
      blockerCodes.push("kickoff_mismatch");
    }
    if (!competitionMatches) {
      blockerCodes.push("competition_usage_scope_mismatch");
    }
    if (!intakeSourceMatches) {
      blockerCodes.push("intake_source_mismatch");
    }

    let accessScopeAction: AccessScopeAction = "blocked";
    if (match && competitionMatches && intakeSourceMatches && homeMatches && awayMatches && kickoffMatches) {
      if (match.access_scope === "public") {
        accessScopeAction = "already_public";
      } else if (match.access_scope === "admin_only" && match.status === "scheduled") {
        accessScopeAction = "publish_from_admin_only";
        publicationRows.push({
          match_id: match.id,
          slug: match.slug,
          current_access_scope: "admin_only",
          next_access_scope: "public",
        });
      } else {
        blockerCodes.push("unsafe_access_scope_transition");
      }
    }

    let existingPredictionId: string | null = null;
    let predictionAction: PredictionAction = "blocked";
    let marketAction: MarketAction = "blocked";

    if (match) {
      resolvedMatchIds.set(fixture.canonicalSlug, match.id);
      const relevantPredictions = (predictionsByMatchId.get(match.id) ?? []).filter(
        (prediction) => prediction.prediction_type === SOURCE_PREDICTION_TYPE && prediction.run_scope === SOURCE_RUN_SCOPE,
      );

      const exactPredictions = relevantPredictions.filter((prediction) => comparePredictionExact(prediction, sourcePrediction));
      if (relevantPredictions.length === 0) {
        predictionAction = "insert";
      } else if (relevantPredictions.length === 1 && exactPredictions.length === 1) {
        existingPredictionId = exactPredictions[0]!.id;
        predictionAction = "already_present";

        const stageMarkets = marketsByPredictionId.get(existingPredictionId) ?? [];
        const stageNarratives = narrativesByPredictionId.get(existingPredictionId) ?? [];
        const sourceMarketByKey = new Map<string, SourceMarketRecord>(
          sourceMarkets.map((market) => [`${market.market}|${market.selection}`, market]),
        );
        const stageMarketKeys = new Set<string>();
        let marketMismatch = false;

        for (const market of stageMarkets) {
          const key = `${market.market}|${market.selection}`;
          stageMarketKeys.add(key);
          const sourceMarket = sourceMarketByKey.get(key);
          if (!sourceMarket || !compareMarketExact(market, sourceMarket)) {
            marketMismatch = true;
          }
        }

        if (
          stageMarkets.length === sourceMarkets.length &&
          !marketMismatch &&
          stageMarketKeys.size === sourceMarketByKey.size &&
          stageNarratives.length === 0
        ) {
          marketAction = "already_present";
        } else {
          blockerCodes.push(
            stageNarratives.length > 0 ? "prediction_narratives_present" : "prediction_market_mismatch_or_partial",
          );
        }
      } else {
        blockerCodes.push("prediction_partial_or_duplicate");
      }
    }

    if (predictionAction === "insert" && accessScopeAction !== "blocked") {
      marketAction = "insert";
    }

    rows.push({
      matchNumber: fixture.matchNumber,
      canonicalSlug: fixture.canonicalSlug,
      apiFootballFixtureId: fixture.apiFootballFixtureId,
      expectedExternalId,
      stageMatchId: match?.id ?? null,
      teamIdentity: {
        homeMatches: homeMatches === true,
        awayMatches: awayMatches === true,
      },
      kickoffMatches,
      competitionMatches: competitionMatches === true,
      intakeSourceMatches: intakeSourceMatches === true,
      accessScopeAction,
      predictionAction,
      marketAction,
      exactPredictionIdentity: {
        createdAt: sourcePrediction.originalTimestamps.createdAt,
        sourcePredictionRef: sourcePrediction.sourceLineage.sourcePredictionRef,
      },
      existingPredictionId,
      blockerCodes,
    });
  }

  for (const row of rows) {
    for (const blocker of row.blockerCodes) {
      blockers.push(`${row.canonicalSlug}: ${blocker}`);
    }
  }

  return { rows, resolvedMatchIds, blockers, publicationRows };
}

function verifyPublicSummariesExact(args: {
  source: Task1cStageImportSourceBundle["packageData"];
  snapshot: Task1cStageImportSnapshot;
}): boolean {
  if (args.snapshot.publicPredictionSummaries.length !== 24) {
    return false;
  }

  const sourcePredictions = new Map(args.source.predictions.map((prediction) => [prediction.canonicalSlug, prediction]));
  const summariesBySlug = new Map(args.snapshot.publicPredictionSummaries.map((summary) => [summary.match_slug, summary]));
  for (const fixture of args.source.fixtureManifest) {
    const sourcePrediction = sourcePredictions.get(fixture.canonicalSlug);
    const summary = summariesBySlug.get(fixture.canonicalSlug);
    if (!sourcePrediction || !summary) {
      return false;
    }

    if (
      !sameInstant(summary.kickoff_at, fixture.kickoffAt) ||
      !sameInstant(summary.prediction_created_at, sourcePrediction.originalTimestamps.createdAt) ||
      summary.home_win_prob !== sourcePrediction.probabilities.homeWin ||
      summary.draw_prob !== sourcePrediction.probabilities.draw ||
      summary.away_win_prob !== sourcePrediction.probabilities.awayWin ||
      summary.confidence_score !== sourcePrediction.confidenceScore ||
      summary.risk_level !== sourcePrediction.riskLevel
    ) {
      return false;
    }
  }

  return true;
}

function summarizeVerification(args: {
  source: Task1cStageImportSourceBundle["packageData"];
  snapshot: Task1cStageImportSnapshot;
  rows: Task1cStageImportMatchPlanRow[];
}): VerificationSummary {
  const exactPredictionCount = args.rows.filter((row) => row.predictionAction === "already_present").length;
  const exactMarketCount = args.rows.filter((row) => row.marketAction === "already_present").length * 10;
  const importedModelMatches = args.snapshot.modelVersions.filter((model) => compareModelExact(model, args.source.model));
  const importedPredictionIds = args.rows
    .map((row) => row.existingPredictionId)
    .filter((value): value is string => Boolean(value));
  const publicMatchCount = args.rows.filter((row) => row.accessScopeAction === "already_public").length;

  return {
    matchingModelCount: importedModelMatches.length,
    activeImportedModelCount: importedModelMatches.filter((model) => model.is_active).length,
    matchingPredictionCount: exactPredictionCount,
    matchingMarketCount: exactMarketCount,
    importedNarrativeCount: args.snapshot.predictionNarratives.filter((narrative) =>
      importedPredictionIds.includes(narrative.prediction_version_id),
    ).length,
    publicMatchCount,
    publicPredictionSummaryCount: verifyPublicSummariesExact(args) ? 24 : 0,
  };
}

export function verifyTask1cStageV1ImportState(args: {
  sourceBundle: Task1cStageImportSourceBundle;
  snapshot: Task1cStageImportSnapshot;
}): Task1cStageImportVerification {
  const resolution = resolveMatches({
    source: args.sourceBundle.packageData,
    snapshot: args.snapshot,
  });

  const summary = summarizeVerification({
    source: args.sourceBundle.packageData,
    snapshot: args.snapshot,
    rows: resolution.rows,
  });
  const blockers = [...resolution.blockers];

  if (summary.matchingModelCount !== 1) {
    blockers.push(`Expected exactly one imported V1 model row but found ${summary.matchingModelCount}.`);
  }
  if (summary.activeImportedModelCount !== 1) {
    blockers.push(`Expected exactly one active imported V1 model but found ${summary.activeImportedModelCount}.`);
  }
  if (summary.matchingPredictionCount !== 24) {
    blockers.push(`Expected exactly 24 matching imported predictions but found ${summary.matchingPredictionCount}.`);
  }
  if (summary.matchingMarketCount !== 240) {
    blockers.push(`Expected exactly 240 matching imported markets but found ${summary.matchingMarketCount}.`);
  }
  if (summary.importedNarrativeCount !== 0) {
    blockers.push(`Expected zero imported narratives but found ${summary.importedNarrativeCount}.`);
  }
  if (summary.publicMatchCount !== 24) {
    blockers.push(`Expected 24 public matches in scope but found ${summary.publicMatchCount}.`);
  }
  if (summary.publicPredictionSummaryCount !== 24) {
    blockers.push("Expected 24 public prediction summaries with preserved timestamps.");
  }

  return {
    summary,
    blockers,
    exact: blockers.length === 0,
  };
}

export function planTask1cStageV1Import(args: {
  authorization: Task1cStageImportAuthorization;
  sourceBundle: Task1cStageImportSourceBundle;
  snapshot: Task1cStageImportSnapshot;
}): Task1cStageImportPlan {
  const source = args.sourceBundle.packageData;
  const modelPayload = modelPayloadFromSource(source);
  const sourcePredictionsBySlug = new Map(source.predictions.map((prediction) => [prediction.canonicalSlug, prediction]));
  const resolution = resolveMatches({
    source,
    snapshot: args.snapshot,
  });
  const verification = verifyTask1cStageV1ImportState({
    sourceBundle: args.sourceBundle,
    snapshot: args.snapshot,
  });
  const sourceModelRows = args.snapshot.modelVersions.filter((model) => model.version === SOURCE_MODEL_VERSION);
  const activeModels = args.snapshot.modelVersions.filter((model) => model.is_active);
  const relevantPredictions = args.snapshot.predictionVersions.filter(
    (prediction) =>
      resolution.rows.some((row) => row.stageMatchId === prediction.match_id) &&
      prediction.prediction_type === SOURCE_PREDICTION_TYPE &&
      prediction.run_scope === SOURCE_RUN_SCOPE,
  );
  const relevantPredictionIds = relevantPredictions.map((prediction) => prediction.id);
  const relevantMarkets = args.snapshot.predictionMarkets.filter((market) =>
    relevantPredictionIds.includes(market.prediction_version_id),
  );
  const relevantNarratives = args.snapshot.predictionNarratives.filter((narrative) =>
    relevantPredictionIds.includes(narrative.prediction_version_id),
  );

  const conflicts: string[] = [];
  const blockers = [...new Set(resolution.blockers)];

  const allRowsReadyForFresh = resolution.rows.every(
    (row) =>
      row.stageMatchId !== null &&
      row.blockerCodes.length === 0 &&
      row.predictionAction === "insert" &&
      row.marketAction === "insert" &&
      (row.accessScopeAction === "already_public" || row.accessScopeAction === "publish_from_admin_only"),
  );
  const isFresh =
    allRowsReadyForFresh &&
    sourceModelRows.length === 0 &&
    activeModels.length === 0 &&
    relevantPredictions.length === 0 &&
    relevantMarkets.length === 0 &&
    relevantNarratives.length === 0;

  let state: PlanState = "partial_or_conflicting";
  let modelAction: ModelAction = "blocked";
  if (isFresh) {
    state = "fresh";
    modelAction = "insert";
  } else if (verification.exact) {
    state = "exact_complete";
    modelAction = "already_present";
  } else {
    if (sourceModelRows.length > 1) {
      conflicts.push(`Expected at most one ${SOURCE_MODEL_VERSION} model row but found ${sourceModelRows.length}.`);
    }
    if (activeModels.some((model) => model.version !== SOURCE_MODEL_VERSION)) {
      conflicts.push("Another active model exists outside the immutable V1 import scope.");
    }
    if (sourceModelRows.length === 1 && !compareModelExact(sourceModelRows[0]!, source.model)) {
      conflicts.push("Existing V1 model row differs from the frozen source.");
    }
    if (sourceModelRows.length === 1 && sourceModelRows[0]!.is_active !== true) {
      conflicts.push("Existing V1 model row is inactive.");
    }
    if (relevantNarratives.length > 0) {
      conflicts.push("Prediction narratives already exist for the import scope.");
    }
    if (relevantPredictions.length > 0 && relevantPredictions.length !== 24) {
      conflicts.push(`Relevant predictions were partially present (${relevantPredictions.length}/24).`);
    }
    if (relevantMarkets.length > 0 && relevantMarkets.length !== 240) {
      conflicts.push(`Relevant markets were partially present (${relevantMarkets.length}/240).`);
    }
    blockers.push(...verification.blockers);
  }

  const predictionPayloads = predictionPayloadsFromSource({
    source,
    resolvedMatchIds: resolution.resolvedMatchIds,
  });
  const marketPayloads = marketPayloadsFromSource({
    source,
    resolvedMatchIds: resolution.resolvedMatchIds,
    sourcePredictionsBySlug,
  });

  const summary: Task1cStageImportSummary = {
    state,
    modelAction,
    selectedFixtureCount: 24,
    resolvedStageMatchCount: resolution.rows.filter((row) => row.stageMatchId !== null).length,
    exactPredictionCount: verification.summary.matchingPredictionCount,
    exactMarketCount: verification.summary.matchingMarketCount,
    narrativeCount: verification.summary.importedNarrativeCount,
    alreadyPublicCount: resolution.rows.filter((row) => row.accessScopeAction === "already_public").length,
    publishFromAdminOnlyCount: resolution.rows.filter((row) => row.accessScopeAction === "publish_from_admin_only").length,
    blockedMatchCount: resolution.rows.filter((row) => row.blockerCodes.length > 0 || row.accessScopeAction === "blocked").length,
    expectedFirstApplyCounts: {
      modelInserts: state === "fresh" ? 1 : 0,
      predictionInserts: state === "fresh" ? 24 : 0,
      marketInserts: state === "fresh" ? 240 : 0,
      narrativeInserts: 0,
      modelActivations: state === "fresh" ? 1 : 0,
      matchPublications: state === "fresh" ? resolution.rows.filter((row) => row.accessScopeAction === "publish_from_admin_only").length : 0,
      deletes: 0,
      predictionUpdates: 0,
      marketUpdates: 0,
    },
    expectedRerunCounts: {
      modelInserts: 0,
      predictionInserts: 0,
      marketInserts: 0,
      narrativeInserts: 0,
      modelActivations: 0,
      matchPublications: 0,
      deletes: 0,
      predictionUpdates: 0,
      marketUpdates: 0,
    },
  };

  const generatedAt = new Date().toISOString();
  const basePlan: Omit<Task1cStageImportPlan, "stablePlanSha256"> = {
    schemaName: TASK1C_IMPORT_SCHEMA_NAME,
    schemaVersion: TASK1C_IMPORT_SCHEMA_VERSION,
    generatedAt,
    mode: args.authorization.mode,
    targetProjectRef: args.authorization.projectRef,
    deniedProjectRef: args.authorization.denyProjectRef,
    sourceArtifacts: {
      artifactDirectory: args.sourceBundle.artifactDirectory,
      packagePath: args.sourceBundle.packagePath,
      manifestPath: args.sourceBundle.manifestPath,
      validationPath: args.sourceBundle.validationPath,
      checksumsPath: args.sourceBundle.checksumsPath,
      runReportPath: args.sourceBundle.runReportPath,
      packageSha256: args.sourceBundle.packageSha256,
      manifestSha256: args.sourceBundle.manifestSha256,
      validationSha256: args.sourceBundle.validationSha256,
    },
    stagePreservation: {
      authUserCount: args.snapshot.authUsers.length,
      adminProfileCount: args.snapshot.profiles.filter((profile) => profile.role === "admin").length,
    },
    expectedPriorState: state,
    sourceCounts: {
      models: source.expectedCounts.models,
      fixtures: source.expectedCounts.fixtures,
      predictions: source.expectedCounts.predictions,
      markets: source.expectedCounts.markets,
      exactScoreMarkets: source.expectedCounts.exactScoreMarkets,
      narratives: source.expectedCounts.narratives,
      publicSourceSummaries: source.expectedCounts.publicSourceSummaries,
    },
    summary,
    modelPayload,
    predictionPayloads,
    marketPayloads,
    accessScopePublications:
      state === "fresh"
        ? resolution.publicationRows
        : [],
    rows: resolution.rows,
    blockers: Array.from(new Set(state === "partial_or_conflicting" ? blockers : [])),
    conflicts: Array.from(new Set(state === "partial_or_conflicting" ? conflicts : [])),
    zeroWriteConfirmation: args.authorization.mode === "dry_run",
  };

  return {
    ...basePlan,
    stablePlanSha256: sha256Json(buildStablePlanPayload(basePlan)),
  };
}

function assertReviewedPlanBinding(input: {
  reviewArtifact: Task1cStageImportPlan;
  currentPlan: Task1cStageImportPlan;
  authorization: Task1cStageImportAuthorization;
}): void {
  const { reviewArtifact, currentPlan, authorization } = input;
  if (reviewArtifact.mode !== "dry_run") {
    throw new Error("Task 1C import apply requires a reviewed dry-run artifact.");
  }

  if (reviewArtifact.targetProjectRef !== authorization.projectRef || reviewArtifact.deniedProjectRef !== authorization.denyProjectRef) {
    throw new Error("Task 1C import apply refused because reviewed artifact target binding differed.");
  }

  if (reviewArtifact.sourceArtifacts.packageSha256 !== APPROVED_PACKAGE_SHA256) {
    throw new Error("Task 1C import apply refused because reviewed artifact package checksum drifted.");
  }

  const reviewedSemanticPlanSha256 = sha256Json(buildStablePlanPayload(reviewArtifact));
  const currentSemanticPlanSha256 = sha256Json(buildStablePlanPayload(currentPlan));

  if (reviewArtifact.stablePlanSha256 !== reviewedSemanticPlanSha256) {
    throw new Error("Task 1C import apply refused because reviewed stable plan checksum did not match its contents.");
  }

  if (currentPlan.stablePlanSha256 !== currentSemanticPlanSha256) {
    throw new Error("Task 1C import apply refused because current stable plan checksum did not match its contents.");
  }

  if (reviewArtifact.stablePlanSha256 !== currentSemanticPlanSha256) {
    throw new Error("Task 1C import apply refused because reviewed stable plan checksum differed from the current plan.");
  }

  if (reviewArtifact.predictionPayloads.length !== 24 || reviewArtifact.marketPayloads.length !== 240) {
    throw new Error("Task 1C import apply refused because reviewed payload cardinality drifted.");
  }

  if (reviewArtifact.modelPayload.version !== SOURCE_MODEL_VERSION) {
    throw new Error("Task 1C import apply refused because the reviewed model payload drifted.");
  }
}

function buildPlanRecoveryState(plan: Task1cStageImportPlan): "all_pre" | "all_post" | "mixed" {
  if (plan.expectedPriorState === "fresh") {
    if (plan.summary.state === "fresh") {
      return "all_pre";
    }
    if (plan.summary.state === "exact_complete") {
      return "all_post";
    }
    return "mixed";
  }

  return plan.summary.state === "exact_complete" ? "all_post" : "mixed";
}

export async function applyTask1cStageV1ImportPlan(input: {
  authorization: Task1cStageImportAuthorization;
  sourceBundle: Task1cStageImportSourceBundle;
  currentPlan: Task1cStageImportPlan;
  reviewArtifact: Task1cStageImportPlan;
  databaseAdapter: Task1cStageImportDatabaseAdapter;
}): Promise<Task1cStageImportApplyResult | null> {
  assertReviewedPlanBinding(input);
  const reviewArtifactForApply = normalizeTask1cStageImportPlanForApply(input.reviewArtifact);

  if (input.currentPlan.expectedPriorState === "partial_or_conflicting") {
    throw new Error("Task 1C import apply refused because the current stage state is partial or conflicting.");
  }

  if (reviewArtifactForApply.expectedPriorState === "exact_complete") {
    return {
      requestedState: "exact_complete",
      modelInsertedCount: 0,
      predictionInsertedCount: 0,
      marketInsertedCount: 0,
      narrativeInsertedCount: 0,
      modelActivatedCount: 0,
      matchPublishedCount: 0,
      alreadyPresentModelCount: 1,
      alreadyPresentPredictionCount: 24,
      alreadyPresentMarketCount: 240,
      alreadyPublicMatchCount: 24,
    };
  }

  try {
    return await input.databaseAdapter.applyImportPlan(reviewArtifactForApply);
  } catch (error) {
    const slugs = input.sourceBundle.manifestData.fixtures.map((fixture) => fixture.canonicalSlug);
    const externalIds = input.sourceBundle.manifestData.fixtures.map((fixture) =>
      buildApiFootballFixtureExternalId(fixture.apiFootballFixtureId),
    );
    const rereadSnapshot = await input.databaseAdapter.readSnapshot(slugs, externalIds);
    const rereadPlan = planTask1cStageV1Import({
      authorization: {
        ...input.authorization,
        mode: "dry_run",
      },
      sourceBundle: input.sourceBundle,
      snapshot: rereadSnapshot,
    });
    const recoveryState = buildPlanRecoveryState(rereadPlan);

    if (recoveryState === "all_post") {
      return {
        requestedState: "fresh",
        modelInsertedCount: 1,
        predictionInsertedCount: 24,
        marketInsertedCount: 240,
        narrativeInsertedCount: 0,
        modelActivatedCount: 1,
        matchPublishedCount: reviewArtifactForApply.accessScopePublications.length,
        alreadyPresentModelCount: 0,
        alreadyPresentPredictionCount: 0,
        alreadyPresentMarketCount: 0,
        alreadyPublicMatchCount: 24,
      };
    }

    if (recoveryState === "all_pre") {
      throw new Error(
        `Task 1C import apply failed before any stage rows changed. Safe to retry the same reviewed artifact. Cause: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    throw new Error(
      `Task 1C import apply entered an unrecoverable mixed state after atomic apply failure. Manual reconciliation required before retry. Cause: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function createLiveDatabaseAdapter(): Task1cStageImportDatabaseAdapter {
  const supabase = createSupabaseScriptAdminClient();

  return {
    async readSnapshot(slugs, externalIds) {
      const { data: competitions, error: competitionError } = await supabase
        .from("competitions")
        .select("id, slug, usage_scope")
        .eq("slug", WORLD_CUP_COMPETITION_SLUG);
      if (competitionError) {
        throw new Error(`Failed to read Task 1C competitions: ${competitionError.message}`);
      }

      const matchSelect =
        "id, external_id, slug, competition_id, season_id, home_team_id, away_team_id, kickoff_at, stage, status, access_scope, lab_status, intake_source, data_quality, source_note";
      const [{ data: slugMatches, error: slugError }, { data: externalMatches, error: externalError }] = await Promise.all([
        supabase.from("matches").select(matchSelect).in("slug", slugs.length > 0 ? slugs : ["__never__"]),
        supabase.from("matches").select(matchSelect).in("external_id", externalIds.length > 0 ? externalIds : ["__never__"]),
      ]);
      if (slugError || externalError) {
        throw new Error(`Failed to read Task 1C matches: ${slugError?.message ?? externalError?.message}`);
      }

      const matches = new Map<string, Task1cStageImportMatchRow>();
      for (const row of [...((slugMatches ?? []) as Task1cStageImportMatchRow[]), ...((externalMatches ?? []) as Task1cStageImportMatchRow[])]) {
        matches.set(row.id, row);
      }
      const matchRows = [...matches.values()];
      const teamIds = [...new Set(matchRows.flatMap((match) => [match.home_team_id, match.away_team_id]))];
      const { data: teams, error: teamError } = await supabase
        .from("teams")
        .select("id, slug, name")
        .in("id", teamIds.length > 0 ? teamIds : ["00000000-0000-0000-0000-000000000000"]);
      if (teamError) {
        throw new Error(`Failed to read Task 1C teams: ${teamError.message}`);
      }

      const { data: models, error: modelError } = await supabase
        .from("model_versions")
        .select("id, version, description, weights_json, is_active, created_at, updated_at");
      if (modelError) {
        throw new Error(`Failed to read Task 1C model versions: ${modelError.message}`);
      }

      const matchIds = matchRows.map((match) => match.id);
      const { data: predictions, error: predictionError } = await supabase
        .from("prediction_versions")
        .select("id, match_id, model_version_id, prediction_type, home_win_prob, draw_prob, away_win_prob, expected_home_goals, expected_away_goals, most_likely_score, top_scores_json, confidence_score, risk_level, run_scope, created_at")
        .in("match_id", matchIds.length > 0 ? matchIds : ["00000000-0000-0000-0000-000000000000"])
        .eq("prediction_type", SOURCE_PREDICTION_TYPE)
        .eq("run_scope", SOURCE_RUN_SCOPE);
      if (predictionError) {
        throw new Error(`Failed to read Task 1C predictions: ${predictionError.message}`);
      }

      const modelById = new Map(((models ?? []) as ModelVersionRow[]).map((row) => [row.id, row]));
      const predictionRows = ((predictions ?? []) as PredictionVersionRow[]).map((prediction) => ({
        ...prediction,
        model_version: modelById.get(prediction.model_version_id) ?? null,
      }));
      const predictionIds = predictionRows.map((prediction) => prediction.id);
      const [{ data: markets, error: marketError }, { data: narratives, error: narrativeError }] = await Promise.all([
        supabase
          .from("prediction_markets")
          .select("id, prediction_version_id, market, selection, probability, confidence, is_premium, created_at")
          .in("prediction_version_id", predictionIds.length > 0 ? predictionIds : ["00000000-0000-0000-0000-000000000000"]),
        supabase
          .from("prediction_narratives")
          .select("id, prediction_version_id, locale, free_summary, premium_analysis, why_it_changed, risk_notes, created_at")
          .in("prediction_version_id", predictionIds.length > 0 ? predictionIds : ["00000000-0000-0000-0000-000000000000"]),
      ]);
      if (marketError || narrativeError) {
        throw new Error(`Failed to read Task 1C child rows: ${marketError?.message ?? narrativeError?.message}`);
      }

      const { data: publicSummaries, error: summaryError } = await supabase
        .from("public_prediction_summaries")
        .select("match_slug, kickoff_at, competition_slug, prediction_created_at, home_win_prob, draw_prob, away_win_prob, confidence_score, risk_level")
        .in("match_slug", slugs.length > 0 ? slugs : ["__never__"]);
      if (summaryError) {
        throw new Error(`Failed to read Task 1C public summaries: ${summaryError.message}`);
      }

      const [authUsersResponse, profileResponse] = await Promise.all([
        supabase.auth.admin.listUsers(),
        supabase.from("profiles").select("id, email, role"),
      ]);
      if (profileResponse.error) {
        throw new Error(`Failed to read Task 1C profiles: ${profileResponse.error.message}`);
      }

      return {
        competitions: (competitions ?? []) as StageCompetitionRow[],
        teams: (teams ?? []) as StageTeamRow[],
        matches: matchRows,
        modelVersions: (models ?? []) as ModelVersionRow[],
        predictionVersions: predictionRows,
        predictionMarkets: (markets ?? []) as PredictionMarketRow[],
        predictionNarratives: (narratives ?? []) as PredictionNarrativeRow[],
        publicPredictionSummaries: (publicSummaries ?? []) as PublicPredictionSummaryRow[],
        authUsers: (authUsersResponse.data?.users ?? []).map((user) => ({ id: user.id, email: user.email ?? null })),
        profiles: ((profileResponse.data ?? []) as Array<Pick<ProfileRow, "id" | "email" | "role">>),
      };
    },

    async applyImportPlan(reviewArtifact) {
      const { data, error } = await supabase.rpc("apply_task1c_stage_v1_import", {
        p_plan: reviewArtifact,
      });
      if (error) {
        throw new Error(`Failed to apply Task 1C import RPC: ${error.message}`);
      }
      if (!data || typeof data !== "object") {
        throw new Error("Failed to apply Task 1C import RPC: invalid result payload.");
      }

      return data as Task1cStageImportApplyResult;
    },
  };
}

function buildArtifactPath(artifactsDir: string, mode: ImportMode): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(artifactsDir, `task1c-stage-v1-import-${mode}-${timestamp}.json`);
}

export async function runTask1cStageV1Import(
  input: RunTask1cStageV1ImportInput,
  dependencies?: {
    databaseAdapter?: Task1cStageImportDatabaseAdapter;
  },
): Promise<RunTask1cStageV1ImportResult> {
  const authorization = assertTask1cStageV1ImportAuthorization({
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    supabaseUrl: input.supabaseUrl,
    apply: input.apply === true,
    reviewedPlanPath: input.reviewedPlanPath,
  });
  const sourceBundle = loadTask1cStageV1ImportSourceBundle({
    repoRoot: input.repoRoot,
    artifactDirectory: input.sourceArtifactDir,
  });
  const databaseAdapter = dependencies?.databaseAdapter ?? createLiveDatabaseAdapter();
  const slugs = sourceBundle.manifestData.fixtures.map((fixture) => fixture.canonicalSlug);
  const externalIds = sourceBundle.manifestData.fixtures.map((fixture) =>
    buildApiFootballFixtureExternalId(fixture.apiFootballFixtureId),
  );
  const snapshot = await databaseAdapter.readSnapshot(slugs, externalIds);
  const plan = planTask1cStageV1Import({
    authorization,
    sourceBundle,
    snapshot,
  });

  if (authorization.mode === "apply") {
    const reviewArtifact = readJsonFile<Task1cStageImportPlan>(path.resolve(input.reviewedPlanPath!));
    await applyTask1cStageV1ImportPlan({
      authorization,
      sourceBundle,
      currentPlan: plan,
      reviewArtifact,
      databaseAdapter,
    });
  }

  const artifactPath = buildArtifactPath(input.artifactsDir, authorization.mode);
  writeJsonFile(artifactPath, plan);
  return {
    artifactPath,
    plan,
  };
}
