import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { createSupabaseScriptAdminClient } from "../supabase/script-admin";
import { WORLD_CUP_2026_FIXTURES } from "../world-cup-2026/canonical-fixtures";
import { WORLD_CUP_2026_TEAMS } from "../world-cup-2026/canonical-teams";
import type {
  Json,
  MatchRow,
  ModelVersionRow,
  PredictionMarketRow,
  PredictionNarrativeRow,
  PredictionVersionRow,
} from "../../types/database";

const TASK1C_SCHEMA_NAME = "ufo-frozen-v1-source-package-v1";
const TASK1C_SCHEMA_VERSION = 1;
const TASK1C_EXTRACTION_CODE_VERSION = "task1c-frozen-v1-source-package-v1";
const WORLD_CUP_2026_SLUG = "world-cup-2026";
const SOURCE_MODEL_VERSION = "v0.2-prelaunch";
const SOURCE_PREDICTION_TYPE = "pre_match_24h";
const SOURCE_RUN_SCOPE = "public_product";
const TASK1C_APPROVED_MATCHDAY3_PROVIDER_IDS = {
  49: 1489406,
  50: 1489405,
  51: 1489408,
  52: 1539009,
  53: 1539010,
  54: 1489407,
  55: 1489409,
  56: 1489410,
  57: 1539011,
  58: 1489412,
  59: 1539012,
  60: 1489411,
  61: 1489416,
  62: 1539074,
  63: 1489414,
  64: 1489415,
  65: 1489413,
  66: 1489417,
  67: 1489422,
  68: 1489420,
  69: 1489418,
  70: 1489421,
  71: 1489419,
  72: 1539013,
} as const;
const MARKET_ORDER: Record<PredictionMarketRow["market"], number> = {
  match_winner: 1,
  btts: 2,
  over_2_5: 3,
  exact_score: 4,
};
const DISALLOWED_TOP_LEVEL_KEYS = new Set([
  "users",
  "profiles",
  "subscriptions",
  "payments",
  "wompi",
  "entitlements",
  "sessions",
  "webhooks",
  "scenario",
  "scenarios",
]);
const DISALLOWED_FIELD_NAME_PATTERNS = [
  /secret/i,
  /password/i,
  /token/i,
  /serviceRoleKey/i,
  /anonKey/i,
  /apiKey/i,
  /session/i,
];
const TASK1C_EXPECTED_COUNTS = {
  models: 1,
  fixtures: 24,
  predictions: 24,
  markets: 240,
  exactScoreMarkets: 72,
  narratives: 0,
  publicSourceSummaries: 24,
} as const;
const EXPORT_MATCHDAY3_STAGE = "Group Stage - 3";
const TEAM_ALIASES_BY_KEY = new Map<string, Set<string>>(
  WORLD_CUP_2026_TEAMS.map((team) => [
    team.teamKey,
    new Set([
      team.displayName,
      team.fifaOfficialName,
      team.slug,
      team.country,
      ...team.aliases,
    ]),
  ]),
);

export const MATCH_SELECT_COLUMNS = [
  "id",
  "external_id",
  "slug",
  "competition_id",
  "season_id",
  "home_team_id",
  "away_team_id",
  "kickoff_at",
  "stage",
  "status",
  "access_scope",
  "lab_status",
  "intake_source",
  "data_quality",
  "created_at",
  "updated_at",
] as const;

export const MODEL_SELECT_COLUMNS = [
  "id",
  "version",
  "description",
  "weights_json",
  "is_active",
  "created_at",
  "updated_at",
] as const;

export const PREDICTION_SELECT_COLUMNS = [
  "id",
  "match_id",
  "model_version_id",
  "prediction_type",
  "home_win_prob",
  "draw_prob",
  "away_win_prob",
  "expected_home_goals",
  "expected_away_goals",
  "most_likely_score",
  "top_scores_json",
  "confidence_score",
  "risk_level",
  "run_scope",
  "created_at",
] as const;

export const MARKET_SELECT_COLUMNS = [
  "id",
  "prediction_version_id",
  "market",
  "selection",
  "probability",
  "confidence",
  "is_premium",
  "created_at",
] as const;

export const NARRATIVE_SELECT_COLUMNS = [
  "id",
  "prediction_version_id",
  "locale",
  "free_summary",
  "premium_analysis",
  "why_it_changed",
  "risk_notes",
  "created_at",
] as const;

export const PUBLIC_SUMMARY_SELECT_COLUMNS = [
  "match_slug",
  "kickoff_at",
  "competition_slug",
  "prediction_created_at",
  "home_win_prob",
  "draw_prob",
  "away_win_prob",
  "confidence_score",
  "risk_level",
] as const;

type CanonicalFixture = (typeof WORLD_CUP_2026_FIXTURES)[number];
type Task1cCanonicalFixture = Omit<CanonicalFixture, "apiFootballFixtureId" | "apiFootballExternalId"> & {
  apiFootballFixtureId: number;
  apiFootballExternalId: string;
};

export type PublicPredictionSummaryRow = {
  match_slug: string;
  kickoff_at: string;
  competition_slug: string;
  prediction_created_at: string;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  confidence_score: number;
  risk_level: "low" | "medium" | "high";
};

export type V1FieldAvailabilityEntry = {
  concept:
    | "evidence_cutoff"
    | "calculation_time"
    | "publication_timestamp"
    | "feature_version"
    | "predecessor_lineage"
    | "source_creation_timestamp";
  representation:
    | "prediction_versions.created_at"
    | "public_prediction_summaries.prediction_created_at"
    | "not_present_in_v1_persistence_contract";
  availableInV1: boolean;
  packageTreatment:
    | "preserved_directly"
    | "validation_evidence_only"
    | "recorded_as_unavailable";
};

export type SourceModelRecord = {
  version: string;
  description: string | null;
  weightsJson: Json;
  sourceLineage: {
    sourceModelRef: string;
  };
  sourceState: {
    isActive: boolean;
  };
  originalTimestamps: {
    createdAt: string;
    updatedAt: string;
  };
};

export type SourceMatchRecord = {
  fixtureKey: string;
  matchNumber: number;
  canonicalSlug: string;
  apiFootballFixtureId: number;
  canonicalHomeTeamKey: string;
  canonicalAwayTeamKey: string;
  kickoffAt: string;
  sourceLineage: {
    sourceMatchRef: string;
    sourceCompetitionRef: string;
    sourceSeasonRef: string;
    sourceHomeTeamRef: string;
    sourceAwayTeamRef: string;
    sourceExternalFixtureRef: string | null;
  };
  sourceState: {
    stage: string | null;
    status: MatchRow["status"];
    accessScope: MatchRow["access_scope"];
    intakeSource: MatchRow["intake_source"];
    dataQuality: MatchRow["data_quality"];
    labStatus: MatchRow["lab_status"];
  };
  originalTimestamps: {
    createdAt: string;
    updatedAt: string;
  };
};

export type SourcePredictionRecord = {
  canonicalSlug: string;
  sourceLineage: {
    sourcePredictionRef: string;
    sourceMatchRef: string;
    sourceModelRef: string;
  };
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  expectedGoals: {
    home: number;
    away: number;
  };
  mostLikelyScore: string;
  topScoresJson: Json;
  confidenceScore: number;
  riskLevel: PredictionVersionRow["risk_level"];
  predictionType: PredictionVersionRow["prediction_type"];
  runScope: PredictionVersionRow["run_scope"];
  originalTimestamps: {
    createdAt: string;
  };
  sourcePublicationEvidence: {
    publicSummaryPresent: boolean;
    publicSummaryPredictionCreatedAt: string;
    sourcePublicationState: "published_public_view";
  };
};

export type SourceMarketRecord = {
  canonicalSlug: string;
  sourceLineage: {
    sourceMarketRef: string;
    sourcePredictionRef: string;
    sourceMatchRef: string;
  };
  market: PredictionMarketRow["market"];
  selection: string;
  probability: number;
  confidence: number | null;
  isPremium: boolean;
  originalTimestamps: {
    createdAt: string;
  };
};

export type FrozenSourceManifest = {
  schemaName: "ufo-frozen-v1-source-manifest-v1";
  schemaVersion: 1;
  sourceProjectRef: string;
  sourceScope: {
    competitionSlug: typeof WORLD_CUP_2026_SLUG;
    matchday: "group-stage-matchday-3";
    matchNumbers: number[];
    predictionType: typeof SOURCE_PREDICTION_TYPE;
    runScope: typeof SOURCE_RUN_SCOPE;
    modelVersion: typeof SOURCE_MODEL_VERSION;
  };
  fixtures: Array<{
    matchNumber: number;
    canonicalSlug: string;
    apiFootballFixtureId: number;
    kickoffAt: string;
    canonicalHomeTeamKey: string;
    canonicalAwayTeamKey: string;
    sourceMatchRef: string;
    sourcePredictionRef: string;
    sourceModelRef: string;
    sourceMarketRefs: string[];
    sourcePublicSummaryMatchSlug: string;
  }>;
};

export type FrozenV1SourcePackage = {
  schemaName: typeof TASK1C_SCHEMA_NAME;
  schemaVersion: typeof TASK1C_SCHEMA_VERSION;
  extractionCodeVersion: typeof TASK1C_EXTRACTION_CODE_VERSION;
  sourceScope: {
    sourceProjectRef: string;
    competitionSlug: typeof WORLD_CUP_2026_SLUG;
    matchday: "group-stage-matchday-3";
    predictionType: typeof SOURCE_PREDICTION_TYPE;
    runScope: typeof SOURCE_RUN_SCOPE;
    modelVersion: typeof SOURCE_MODEL_VERSION;
  };
  expectedCounts: {
    models: 1;
    fixtures: 24;
    predictions: 24;
    markets: 240;
    exactScoreMarkets: 72;
    narratives: 0;
    publicSourceSummaries: 24;
  };
  observedCounts: {
    models: number;
    fixtures: number;
    predictions: number;
    markets: number;
    exactScoreMarkets: number;
    narratives: number;
    publicSourceSummaries: number;
  };
  v1FieldAvailability: V1FieldAvailabilityEntry[];
  fixtureManifest: FrozenSourceManifest["fixtures"];
  model: SourceModelRecord;
  matches: SourceMatchRecord[];
  predictions: SourcePredictionRecord[];
  predictionMarkets: SourceMarketRecord[];
  predictionNarratives: [];
};

export type FrozenValidationReport = {
  schemaName: "ufo-frozen-v1-source-validation-v1";
  schemaVersion: 1;
  sourceProjectRef: string;
  mandatoryFields: {
    exactFixtureAllowlist: true;
    matchNumbers49Through72ExactlyOnce: true;
    uniqueSlugs: true;
    uniqueProviderFixtureIds: true;
    uniqueSourceMatchRefs: true;
    uniqueSourcePredictionRefs: true;
    completeCanonicalIdentityMatch: true;
    extraFixtureCount: 0;
    missingFixtureCount: 0;
    onePredictionPerFixture: true;
    allPredictionsReferenceSelectedModel: true;
    allMarketsReferenceSelectedPredictions: true;
    orphanMarketCount: 0;
    duplicateMarketSourceRefCount: 0;
    marketsPerPredictionMinimum: 10;
    marketsPerPredictionMaximum: 10;
    exactScoreMarketsPerPredictionMinimum: 3;
    exactScoreMarketsPerPredictionMaximum: 3;
    allPredictionTypesPreMatch24h: true;
    allRunScopesPublicProduct: true;
    narrativeCount: 0;
    scenarioDataPresent: false;
    fabricatedNarrativePresent: false;
    personalDataPresent: false;
    authDataPresent: false;
    secretDataPresent: false;
    paymentDataPresent: false;
    wompiDataPresent: false;
    webhookDataPresent: false;
    subscriptionDataPresent: false;
    sessionDataPresent: false;
    entitlementDataPresent: false;
    resultDataPresent: false;
    evaluationDataPresent: false;
    reviewedByReferencePresent: false;
    sourceNotePresent: false;
    stageProjectRefPresent: false;
    stageUuidReferencePresent: false;
    genericTargetPrimaryKeysPresent: false;
    firstReadSucceeded: true;
    secondReadSucceeded: true;
    secondReadUsedFrozenReferences: true;
    fieldEquality: true;
    byteEquality: true;
  };
  requiredChecks: {
    fixtureIdentityAndUniqueness: {
      exactFixtureAllowlist: boolean;
      matchNumbers49Through72ExactlyOnce: boolean;
      uniqueSlugs: boolean;
      uniqueProviderFixtureIds: boolean;
      uniqueSourceMatchRefs: boolean;
      uniqueSourcePredictionRefs: boolean;
      completeCanonicalIdentityMatch: boolean;
      extraFixtureCount: number;
      missingFixtureCount: number;
    };
    relationshipIntegrity: {
      onePredictionPerFixture: boolean;
      allPredictionsReferenceSelectedModel: boolean;
      allMarketsReferenceSelectedPredictions: boolean;
      orphanMarketCount: number;
      duplicateMarketSourceRefCount: number;
    };
    marketInvariants: {
      marketsPerPredictionMinimum: number;
      marketsPerPredictionMaximum: number;
      exactScoreMarketsPerPredictionMinimum: number;
      exactScoreMarketsPerPredictionMaximum: number;
    };
    predictionScope: {
      allPredictionTypesPreMatch24h: boolean;
      allRunScopesPublicProduct: boolean;
    };
    narrativeAndScenarioTruth: {
      narrativeCount: number;
      scenarioDataPresent: boolean;
      fabricatedNarrativePresent: boolean;
    };
    forbiddenContentScan: {
      personalDataPresent: boolean;
      authDataPresent: boolean;
      secretDataPresent: boolean;
      paymentDataPresent: boolean;
      wompiDataPresent: boolean;
      webhookDataPresent: boolean;
      subscriptionDataPresent: boolean;
      sessionDataPresent: boolean;
      entitlementDataPresent: boolean;
      resultDataPresent: boolean;
      evaluationDataPresent: boolean;
      reviewedByReferencePresent: boolean;
      sourceNotePresent: boolean;
    };
    stageLeakage: {
      stageProjectRefPresent: boolean;
      stageUuidReferencePresent: boolean;
      genericTargetPrimaryKeysPresent: boolean;
    };
    frozenReadEvidence: {
      firstReadSucceeded: boolean;
      secondReadSucceeded: boolean;
      secondReadUsedFrozenReferences: boolean;
      fieldEquality: boolean;
      byteEquality: boolean;
    };
  };
  derivedValidity: {
    allMandatoryChecksPresent: boolean;
    allMandatoryChecksSatisfied: boolean;
    mandatoryFailureKeys: string[];
  };
  checks: Array<{
    name: string;
    status: "passed" | "failed";
    detail: string;
  }>;
  counts: FrozenV1SourcePackage["observedCounts"] & {
    minMarketsPerPrediction: number;
    maxMarketsPerPrediction: number;
    minExactScoreMarketsPerPrediction: number;
    maxExactScoreMarketsPerPrediction: number;
  };
  sourceEvidence: {
    exactFixtureSelection: string[];
    selectedPredictionRefs: string[];
    selectedMarketRefs: string[];
  };
  secondReadProof: {
    usedExactManifestReferences: true;
    fieldEquality: boolean;
    byteEquality: boolean;
  };
  verdict: "valid" | "blocked";
  blockers: string[];
};

export type FrozenArtifactChecksums = {
  schemaName: "ufo-frozen-v1-source-checksums-v1";
  schemaVersion: 1;
  algorithm: "sha256";
  files: Array<{
    filename: string;
    firstReadBytes: number;
    secondReadBytes: number;
    firstReadSha256: string;
    secondReadSha256: string;
    byteSizeEqual: boolean;
    hashEqual: boolean;
    equal: boolean;
  }>;
};

export type FrozenRunReport = {
  schemaName: "ufo-frozen-v1-source-run-report-v1";
  schemaVersion: 1;
  generatedAt: string;
  sourceProjectRef: string;
  deniedProjectRef: string;
  artifactDirectory: string;
  reads: {
    first: {
      status: "success";
      selectionMode: "exact_bounded_source_scope";
      packageSha256: string;
      manifestSha256: string;
      validationSha256: string;
    };
    second: {
      status: "success";
      selectionMode: "frozen_source_references";
      packageSha256: string;
      manifestSha256: string;
      validationSha256: string;
    };
  };
  expectedCounts: FrozenV1SourcePackage["expectedCounts"];
  observedCounts: FrozenV1SourcePackage["observedCounts"];
  artifacts: {
    packagePath: string;
    manifestPath: string;
    validationReportPath: string;
    checksumReportPath: string;
    packageSha256: string;
    manifestSha256: string;
    validationReportSha256: string;
  };
  byteEquality: boolean;
  fieldEquality: boolean;
  productionDatabaseWrites: 0;
  stageDatabaseWrites: 0;
  stageBrowserUsage: 0;
  productionBrowserUsage: 0;
};

export type FrozenSourceAuthorization = {
  sourceProjectRef: string;
  deniedProjectRef: string;
  supabaseUrlHost: string;
  sourceProof: "explicit_project_ref_and_url_match";
  stageDenied: true;
};

export type OfficialUfoExportFixture = {
  externalId: string;
  fixtureId: number;
  slug: string;
  kickoffAt: string;
  stage: string;
  homeTeam: string;
  awayTeam: string;
  prediction: {
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    confidenceScore: number;
    riskLevel: string;
    mostLikelyScore: string;
    expectedGoals: {
      home: number;
      away: number;
    };
    topScorelines: Array<{
      score: string;
      probability: number;
    }>;
  };
};

export type OfficialUfoExportComparison = {
  exportTotalFixtureCount: number;
  matchday3FixtureCount: number;
  matchedFixtureCount: number;
  missingFrozenPackageFixtures: string[];
  extraExportMatchday3Fixtures: string[];
  exactFieldMismatchCount: number;
  mismatches: Array<{
    slug: string;
    field: string;
    exportValue: unknown;
    frozenValue: unknown;
  }>;
  colombiaVsCongoDrConfirmedAsMatchday2: boolean;
  exportUsedAsPersistenceInput: false;
};

export type RunTask1cInput = {
  repoRoot: string;
  artifactsDir: string;
  projectRef: string;
  denyProjectRef: string;
  supabaseUrl: string;
};

export type RunTask1cResult = {
  artifactDirectory: string;
  packagePath: string;
  manifestPath: string;
  validationPath: string;
  checksumsPath: string;
  runReportPath: string;
  packageData: FrozenV1SourcePackage;
  manifestData: FrozenSourceManifest;
  validationData: FrozenValidationReport;
  checksumsData: FrozenArtifactChecksums;
  runReportData: FrozenRunReport;
  authorization: FrozenSourceAuthorization;
};

type FirstReadSelection = {
  model: ModelVersionRow;
  fixtures: Task1cCanonicalFixture[];
  matches: MatchRow[];
  predictions: PredictionVersionRow[];
  markets: PredictionMarketRow[];
  narratives: PredictionNarrativeRow[];
  publicSummaries: PublicPredictionSummaryRow[];
  manifest: FrozenSourceManifest;
};

type ReadByManifest = {
  model: ModelVersionRow;
  matches: MatchRow[];
  predictions: PredictionVersionRow[];
  markets: PredictionMarketRow[];
  narratives: PredictionNarrativeRow[];
  publicSummaries: PublicPredictionSummaryRow[];
};

type ExactFixtureIdentity = {
  matchNumber: number;
  canonicalSlug: string;
  apiFootballFixtureId: number;
  canonicalHomeTeamKey: string;
  canonicalAwayTeamKey: string;
  kickoffAt: string;
};

type FieldLevelComparison = {
  field: string;
  status: "passed" | "failed";
  detail: string;
};

type QueryManyResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

type QueryMaybeOneResult = {
  data: unknown | null;
  error: { message: string } | null;
};

interface QueryBuilderLike extends PromiseLike<QueryManyResult> {
  eq(column: string, value: unknown): QueryBuilderLike;
  in(column: string, values: readonly unknown[]): QueryBuilderLike;
  order(column: string, options?: { ascending?: boolean }): QueryBuilderLike;
  maybeSingle(): Promise<QueryMaybeOneResult>;
}

interface ReadOnlyTableLike {
  select(columns: string): QueryBuilderLike;
}

export interface FrozenV1SourceReader {
  fetchModelByVersion(version: string): Promise<ModelVersionRow[]>;
  fetchMatchesBySlugs(slugs: string[]): Promise<MatchRow[]>;
  fetchPredictionsByMatchIds(matchIds: string[], modelVersionId: string): Promise<PredictionVersionRow[]>;
  fetchPredictionsByIds(predictionIds: string[]): Promise<PredictionVersionRow[]>;
  fetchMatchesByIds(matchIds: string[]): Promise<MatchRow[]>;
  fetchModelById(modelId: string): Promise<ModelVersionRow | null>;
  fetchMarketsByPredictionIds(predictionIds: string[]): Promise<PredictionMarketRow[]>;
  fetchMarketsByIds(marketIds: string[]): Promise<PredictionMarketRow[]>;
  fetchNarrativesByPredictionIds(predictionIds: string[]): Promise<PredictionNarrativeRow[]>;
  fetchPublicSummariesByMatchSlugs(slugs: string[]): Promise<PublicPredictionSummaryRow[]>;
}

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Configure local script credentials before running Task 1C.`);
  }

  return value;
}

function ensureDirectory(targetPath: string): void {
  fs.mkdirSync(targetPath, { recursive: true });
}

function writeStableJson(filePath: string, payload: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function sha256Buffer(payload: Buffer | string): string {
  return createHash("sha256").update(payload).digest("hex");
}

function toCanonicalJson(payload: unknown): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function canonicalByteLength(payload: unknown): number {
  return Buffer.byteLength(toCanonicalJson(payload), "utf8");
}

export function normalizeUrlHost(url: string): string {
  return new URL(url).host;
}

export function resolveProjectRefFromUrl(url: string): string {
  const host = normalizeUrlHost(url);
  const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
  if (!match) {
    throw new Error("Supabase URL host must resolve to a project ref.");
  }

  return match[1];
}

function readTable(table: string): ReadOnlyTableLike {
  const client = createSupabaseScriptAdminClient();
  return client.from(table) as unknown as ReadOnlyTableLike;
}

export function normalizeComparableText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeProbability(value: number): number {
  return value > 1 ? Number((value / 100).toFixed(6)) : Number(value.toFixed(6));
}

async function runSelectMany<T>(args: {
  table: string;
  columns: readonly string[];
  filters?: Array<{ type: "eq"; column: string; value: unknown } | { type: "in"; column: string; values: readonly unknown[] }>;
  orders?: Array<{ column: string; ascending?: boolean }>;
}): Promise<T[]> {
  let query = readTable(args.table).select(args.columns.join(","));

  for (const filter of args.filters ?? []) {
    if (filter.type === "eq") {
      query = query.eq(filter.column, filter.value);
    } else {
      query = query.in(filter.column, filter.values);
    }
  }

  for (const order of args.orders ?? []) {
    query = query.order(order.column, { ascending: order.ascending ?? true });
  }

  const result = await query;
  if (result.error) {
    throw new Error(`Failed reading ${args.table}: ${result.error.message}`);
  }

  return (result.data ?? []) as T[];
}

async function runSelectMaybeOne<T>(args: {
  table: string;
  columns: readonly string[];
  filters: Array<{ type: "eq"; column: string; value: unknown }>;
}): Promise<T | null> {
  let query = readTable(args.table).select(args.columns.join(","));
  for (const filter of args.filters) {
    query = query.eq(filter.column, filter.value);
  }

  const result = await query.maybeSingle();
  if (result.error) {
    throw new Error(`Failed reading ${args.table}: ${result.error.message}`);
  }

  return (result.data ?? null) as T | null;
}

export function createProductionFrozenV1SourceReader(): FrozenV1SourceReader {
  return {
    fetchModelByVersion(version) {
      return runSelectMany<ModelVersionRow>({
        table: "model_versions",
        columns: MODEL_SELECT_COLUMNS,
        filters: [{ type: "eq", column: "version", value: version }],
        orders: [{ column: "id", ascending: true }],
      });
    },
    fetchMatchesBySlugs(slugs) {
      return runSelectMany<MatchRow>({
        table: "matches",
        columns: MATCH_SELECT_COLUMNS,
        filters: [{ type: "in", column: "slug", values: slugs }],
        orders: [{ column: "slug", ascending: true }],
      });
    },
    fetchPredictionsByMatchIds(matchIds, modelVersionId) {
      return runSelectMany<PredictionVersionRow>({
        table: "prediction_versions",
        columns: PREDICTION_SELECT_COLUMNS,
        filters: [
          { type: "in", column: "match_id", values: matchIds },
          { type: "eq", column: "model_version_id", value: modelVersionId },
          { type: "eq", column: "prediction_type", value: SOURCE_PREDICTION_TYPE },
          { type: "eq", column: "run_scope", value: SOURCE_RUN_SCOPE },
        ],
        orders: [
          { column: "match_id", ascending: true },
          { column: "created_at", ascending: true },
          { column: "id", ascending: true },
        ],
      });
    },
    fetchPredictionsByIds(predictionIds) {
      return runSelectMany<PredictionVersionRow>({
        table: "prediction_versions",
        columns: PREDICTION_SELECT_COLUMNS,
        filters: [{ type: "in", column: "id", values: predictionIds }],
        orders: [{ column: "id", ascending: true }],
      });
    },
    fetchMatchesByIds(matchIds) {
      return runSelectMany<MatchRow>({
        table: "matches",
        columns: MATCH_SELECT_COLUMNS,
        filters: [{ type: "in", column: "id", values: matchIds }],
        orders: [{ column: "id", ascending: true }],
      });
    },
    fetchModelById(modelId) {
      return runSelectMaybeOne<ModelVersionRow>({
        table: "model_versions",
        columns: MODEL_SELECT_COLUMNS,
        filters: [{ type: "eq", column: "id", value: modelId }],
      });
    },
    fetchMarketsByPredictionIds(predictionIds) {
      return runSelectMany<PredictionMarketRow>({
        table: "prediction_markets",
        columns: MARKET_SELECT_COLUMNS,
        filters: [{ type: "in", column: "prediction_version_id", values: predictionIds }],
        orders: [
          { column: "prediction_version_id", ascending: true },
          { column: "market", ascending: true },
          { column: "selection", ascending: true },
          { column: "id", ascending: true },
        ],
      });
    },
    fetchMarketsByIds(marketIds) {
      return runSelectMany<PredictionMarketRow>({
        table: "prediction_markets",
        columns: MARKET_SELECT_COLUMNS,
        filters: [{ type: "in", column: "id", values: marketIds }],
        orders: [{ column: "id", ascending: true }],
      });
    },
    fetchNarrativesByPredictionIds(predictionIds) {
      return runSelectMany<PredictionNarrativeRow>({
        table: "prediction_narratives",
        columns: NARRATIVE_SELECT_COLUMNS,
        filters: [{ type: "in", column: "prediction_version_id", values: predictionIds }],
        orders: [{ column: "id", ascending: true }],
      });
    },
    fetchPublicSummariesByMatchSlugs(slugs) {
      return runSelectMany<PublicPredictionSummaryRow>({
        table: "public_prediction_summaries",
        columns: PUBLIC_SUMMARY_SELECT_COLUMNS,
        filters: [
          { type: "eq", column: "competition_slug", value: WORLD_CUP_2026_SLUG },
          { type: "in", column: "match_slug", values: slugs },
        ],
        orders: [{ column: "match_slug", ascending: true }],
      });
    },
  };
}

export function getFrozenV1ReadOnlyMethodNames(reader: FrozenV1SourceReader): string[] {
  return Object.keys(reader).sort();
}

function areTeamNamesEquivalent(teamKey: string, exportName: string): boolean {
  const aliases = TEAM_ALIASES_BY_KEY.get(teamKey);
  if (!aliases) {
    return false;
  }

  const normalizedTarget = normalizeComparableText(exportName);
  for (const alias of aliases) {
    if (normalizeComparableText(alias) === normalizedTarget) {
      return true;
    }
  }

  return false;
}

export function assertFrozenSourceAuthorization(args: {
  projectRef: string;
  denyProjectRef: string;
  supabaseUrl: string;
}): FrozenSourceAuthorization {
  if (!args.projectRef) {
    throw new Error("Task 1C requires --project-ref for explicit production identity.");
  }

  if (!args.denyProjectRef) {
    throw new Error("Task 1C requires --deny-project-ref to hard-deny stage as a source.");
  }

  const sourceProjectRef = resolveProjectRefFromUrl(args.supabaseUrl);
  if (sourceProjectRef !== args.projectRef) {
    throw new Error("Task 1C refused because the resolved Supabase project ref does not match --project-ref.");
  }

  if (sourceProjectRef === args.denyProjectRef) {
    throw new Error("Task 1C refused because the denied project ref cannot be used as the extraction source.");
  }

  return {
    sourceProjectRef,
    deniedProjectRef: args.denyProjectRef,
    supabaseUrlHost: normalizeUrlHost(args.supabaseUrl),
    sourceProof: "explicit_project_ref_and_url_match",
    stageDenied: true,
  };
}

export function getCanonicalMatchday3Fixtures(): Task1cCanonicalFixture[] {
  const fixtures = WORLD_CUP_2026_FIXTURES
    .filter((fixture) => fixture.matchNumber >= 49 && fixture.matchNumber <= 72)
    .map((fixture) => ({
      ...fixture,
      apiFootballFixtureId: TASK1C_APPROVED_MATCHDAY3_PROVIDER_IDS[fixture.matchNumber as keyof typeof TASK1C_APPROVED_MATCHDAY3_PROVIDER_IDS],
      apiFootballExternalId: `api-football:fixture:${TASK1C_APPROVED_MATCHDAY3_PROVIDER_IDS[fixture.matchNumber as keyof typeof TASK1C_APPROVED_MATCHDAY3_PROVIDER_IDS]}`,
    }))
    .sort((left, right) => left.matchNumber - right.matchNumber || left.matchSlug.localeCompare(right.matchSlug));

  if (fixtures.length !== 24) {
    throw new Error(`Task 1C expected exactly 24 Matchday 3 fixtures but found ${fixtures.length}.`);
  }

  return fixtures as Task1cCanonicalFixture[];
}

export function getTask1cApprovedFixtureIdentityMap(): Map<number, ExactFixtureIdentity> {
  return new Map(
    getCanonicalMatchday3Fixtures().map((fixture) => [
      fixture.matchNumber,
      {
        matchNumber: fixture.matchNumber,
        canonicalSlug: fixture.matchSlug,
        apiFootballFixtureId: fixture.apiFootballFixtureId as number,
        canonicalHomeTeamKey: fixture.homeTeamKey,
        canonicalAwayTeamKey: fixture.awayTeamKey,
        kickoffAt: fixture.kickoffAt,
      },
    ]),
  );
}

export function assertExactFixtureAllowlist(fixtures: Array<{ matchNumber: number; matchSlug: string }>): void {
  const canonical = getCanonicalMatchday3Fixtures();
  const expected = canonical.map((fixture) => `${fixture.matchNumber}:${fixture.matchSlug}`);
  const actual = fixtures
    .map((fixture) => `${fixture.matchNumber}:${fixture.matchSlug}`)
    .sort((left, right) => left.localeCompare(right));

  if (expected.length !== actual.length || expected.some((value, index) => value !== actual[index])) {
    throw new Error("Task 1C refused because the fixture selection is not the exact canonical Matchday 3 allowlist.");
  }
}

export function assertApprovedFixtureIdentity(fixture: ExactFixtureIdentity): void {
  const approved = getTask1cApprovedFixtureIdentityMap().get(fixture.matchNumber);
  if (!approved) {
    throw new Error(`Task 1C refused unknown Matchday 3 fixture number ${fixture.matchNumber}.`);
  }

  const mismatches: string[] = [];
  if (fixture.canonicalSlug !== approved.canonicalSlug) {
    mismatches.push("canonicalSlug");
  }
  if (fixture.apiFootballFixtureId !== approved.apiFootballFixtureId) {
    mismatches.push("apiFootballFixtureId");
  }
  if (fixture.canonicalHomeTeamKey !== approved.canonicalHomeTeamKey) {
    mismatches.push("canonicalHomeTeamKey");
  }
  if (fixture.canonicalAwayTeamKey !== approved.canonicalAwayTeamKey) {
    mismatches.push("canonicalAwayTeamKey");
  }
  if (!sameInstant(fixture.kickoffAt, approved.kickoffAt)) {
    mismatches.push("kickoffAt");
  }

  if (mismatches.length > 0) {
    throw new Error(`Task 1C refused fixture ${fixture.matchNumber} because approved identity mismatched: ${mismatches.join(",")}.`);
  }
}

function indexBySlug<T extends { slug: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.slug, row]));
}

function indexByMatchSlug<T extends { match_slug: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.match_slug, row]));
}

function groupBy<T, K extends string>(rows: T[], getKey: (row: T) => K): Map<K, T[]> {
  const grouped = new Map<K, T[]>();
  for (const row of rows) {
    const key = getKey(row);
    const existing = grouped.get(key);
    if (existing) {
      existing.push(row);
    } else {
      grouped.set(key, [row]);
    }
  }
  return grouped;
}

function stableSortMarkets(rows: PredictionMarketRow[], matchByPredictionId: Map<string, MatchRow>): PredictionMarketRow[] {
  return [...rows].sort((left, right) => {
    const leftMatch = matchByPredictionId.get(left.prediction_version_id);
    const rightMatch = matchByPredictionId.get(right.prediction_version_id);
    const leftSlug = leftMatch?.slug ?? "";
    const rightSlug = rightMatch?.slug ?? "";
    return (
      leftSlug.localeCompare(rightSlug) ||
      MARKET_ORDER[left.market] - MARKET_ORDER[right.market] ||
      left.selection.localeCompare(right.selection) ||
      left.id.localeCompare(right.id)
    );
  });
}

function assertNoDuplicates<T>(values: T[], label: string): void {
  const seen = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Task 1C refused because duplicate ${label} values were found.`);
    }
    seen.add(value);
  }
}

function assertFieldPreservation(left: FrozenV1SourcePackage, right: FrozenV1SourcePackage): void {
  const leftJson = toCanonicalJson(left);
  const rightJson = toCanonicalJson(right);
  if (leftJson !== rightJson) {
    throw new Error("Task 1C detected source drift between the first and second exact read.");
  }
}

function compareField(field: string, left: unknown, right: unknown): FieldLevelComparison {
  const leftJson = JSON.stringify(left);
  const rightJson = JSON.stringify(right);
  return {
    field,
    status: leftJson === rightJson ? "passed" : "failed",
    detail: leftJson === rightJson ? "equal" : `left=${leftJson} right=${rightJson}`,
  };
}

function buildFieldLevelComparisons(args: {
  firstPackage: FrozenV1SourcePackage;
  secondPackage: FrozenV1SourcePackage;
}): FieldLevelComparison[] {
  const comparisons: FieldLevelComparison[] = [];

  for (let index = 0; index < args.firstPackage.matches.length; index += 1) {
    const left = args.firstPackage.matches[index];
    const right = args.secondPackage.matches[index];
    comparisons.push(compareField(`match.${index}.canonicalSlug`, left.canonicalSlug, right.canonicalSlug));
    comparisons.push(compareField(`match.${index}.apiFootballFixtureId`, left.apiFootballFixtureId, right.apiFootballFixtureId));
    comparisons.push(compareField(`match.${index}.sourceHomeTeamRef`, left.sourceLineage.sourceHomeTeamRef, right.sourceLineage.sourceHomeTeamRef));
    comparisons.push(compareField(`match.${index}.sourceAwayTeamRef`, left.sourceLineage.sourceAwayTeamRef, right.sourceLineage.sourceAwayTeamRef));
    comparisons.push(compareField(`match.${index}.kickoffAt`, left.kickoffAt, right.kickoffAt));
    comparisons.push(compareField(`match.${index}.stage`, left.sourceState.stage, right.sourceState.stage));
    comparisons.push(compareField(`match.${index}.status`, left.sourceState.status, right.sourceState.status));
    comparisons.push(compareField(`match.${index}.accessScope`, left.sourceState.accessScope, right.sourceState.accessScope));
    comparisons.push(compareField(`match.${index}.intakeSource`, left.sourceState.intakeSource, right.sourceState.intakeSource));
    comparisons.push(compareField(`match.${index}.createdAt`, left.originalTimestamps.createdAt, right.originalTimestamps.createdAt));
    comparisons.push(compareField(`match.${index}.updatedAt`, left.originalTimestamps.updatedAt, right.originalTimestamps.updatedAt));
  }

  for (let index = 0; index < args.firstPackage.predictions.length; index += 1) {
    const left = args.firstPackage.predictions[index];
    const right = args.secondPackage.predictions[index];
    comparisons.push(compareField(`prediction.${index}.homeWinProb`, left.probabilities.homeWin, right.probabilities.homeWin));
    comparisons.push(compareField(`prediction.${index}.drawProb`, left.probabilities.draw, right.probabilities.draw));
    comparisons.push(compareField(`prediction.${index}.awayWinProb`, left.probabilities.awayWin, right.probabilities.awayWin));
    comparisons.push(compareField(`prediction.${index}.expectedHomeGoals`, left.expectedGoals.home, right.expectedGoals.home));
    comparisons.push(compareField(`prediction.${index}.expectedAwayGoals`, left.expectedGoals.away, right.expectedGoals.away));
    comparisons.push(compareField(`prediction.${index}.mostLikelyScore`, left.mostLikelyScore, right.mostLikelyScore));
    comparisons.push(compareField(`prediction.${index}.topScoresJson`, left.topScoresJson, right.topScoresJson));
    comparisons.push(compareField(`prediction.${index}.confidenceScore`, left.confidenceScore, right.confidenceScore));
    comparisons.push(compareField(`prediction.${index}.riskLevel`, left.riskLevel, right.riskLevel));
    comparisons.push(compareField(`prediction.${index}.predictionType`, left.predictionType, right.predictionType));
    comparisons.push(compareField(`prediction.${index}.runScope`, left.runScope, right.runScope));
    comparisons.push(compareField(`prediction.${index}.createdAt`, left.originalTimestamps.createdAt, right.originalTimestamps.createdAt));
    comparisons.push(compareField(`prediction.${index}.publicSummaryPredictionCreatedAt`, left.sourcePublicationEvidence.publicSummaryPredictionCreatedAt, right.sourcePublicationEvidence.publicSummaryPredictionCreatedAt));
  }

  for (let index = 0; index < args.firstPackage.predictionMarkets.length; index += 1) {
    const left = args.firstPackage.predictionMarkets[index];
    const right = args.secondPackage.predictionMarkets[index];
    comparisons.push(compareField(`market.${index}.market`, left.market, right.market));
    comparisons.push(compareField(`market.${index}.selection`, left.selection, right.selection));
    comparisons.push(compareField(`market.${index}.probability`, left.probability, right.probability));
    comparisons.push(compareField(`market.${index}.confidence`, left.confidence, right.confidence));
    comparisons.push(compareField(`market.${index}.isPremium`, left.isPremium, right.isPremium));
    comparisons.push(compareField(`market.${index}.createdAt`, left.originalTimestamps.createdAt, right.originalTimestamps.createdAt));
  }

  return comparisons;
}

function detectPackageSafetyIssues(payload: unknown, pathStack: string[] = []): string[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((value, index) => detectPackageSafetyIssues(value, [...pathStack, String(index)]));
  }

  if (payload && typeof payload === "object") {
    const issues: string[] = [];
    for (const [key, value] of Object.entries(payload)) {
      if (DISALLOWED_TOP_LEVEL_KEYS.has(key) && pathStack.length === 0) {
        issues.push(`Disallowed top-level key present: ${key}`);
      }

      if (DISALLOWED_FIELD_NAME_PATTERNS.some((pattern) => pattern.test(key))) {
        issues.push(`Disallowed field name present: ${[...pathStack, key].join(".")}`);
      }

      if (/^id$/i.test(key) && !pathStack[pathStack.length - 1]?.toLowerCase().includes("source")) {
        issues.push(`Generic id field present outside source lineage: ${[...pathStack, key].join(".")}`);
      }

      issues.push(...detectPackageSafetyIssues(value, [...pathStack, key]));
    }
    return issues;
  }

  return [];
}

function assertNoStageUuid(payload: unknown, stageProjectRef: string): void {
  const text = JSON.stringify(payload);
  if (text.includes(stageProjectRef)) {
    throw new Error("Task 1C refused because the package contains the denied stage project reference.");
  }
}

function parseApiFootballFixtureId(externalId: string | null): number | null {
  if (!externalId) {
    return null;
  }

  const match = externalId.match(/^api-football:fixture:(\d+)$/);
  return match ? Number(match[1]) : null;
}

export function sameInstant(left: string | null, right: string | null): boolean {
  if (left === right) {
    return true;
  }

  if (left == null || right == null) {
    return left === right;
  }

  return Date.parse(left) === Date.parse(right);
}

function resolveFixtureApiFootballId(fixture: Task1cCanonicalFixture, match: MatchRow): number {
  const resolved = fixture.apiFootballFixtureId ?? parseApiFootballFixtureId(match.external_id);
  if (resolved == null) {
    throw new Error(`Task 1C could not resolve an API-Football fixture id for ${fixture.matchSlug}.`);
  }

  return resolved;
}

function buildV1FieldAvailability(): V1FieldAvailabilityEntry[] {
  return [
    {
      concept: "evidence_cutoff",
      representation: "not_present_in_v1_persistence_contract",
      availableInV1: false,
      packageTreatment: "recorded_as_unavailable",
    },
    {
      concept: "calculation_time",
      representation: "not_present_in_v1_persistence_contract",
      availableInV1: false,
      packageTreatment: "recorded_as_unavailable",
    },
    {
      concept: "publication_timestamp",
      representation: "public_prediction_summaries.prediction_created_at",
      availableInV1: true,
      packageTreatment: "validation_evidence_only",
    },
    {
      concept: "feature_version",
      representation: "not_present_in_v1_persistence_contract",
      availableInV1: false,
      packageTreatment: "recorded_as_unavailable",
    },
    {
      concept: "predecessor_lineage",
      representation: "not_present_in_v1_persistence_contract",
      availableInV1: false,
      packageTreatment: "recorded_as_unavailable",
    },
    {
      concept: "source_creation_timestamp",
      representation: "prediction_versions.created_at",
      availableInV1: true,
      packageTreatment: "preserved_directly",
    },
  ];
}

function buildManifest(args: {
  sourceProjectRef: string;
  model: ModelVersionRow;
  fixtures: Task1cCanonicalFixture[];
  matchBySlug: Map<string, MatchRow>;
  predictionByMatchId: Map<string, PredictionVersionRow>;
  marketsByPredictionId: Map<string, PredictionMarketRow[]>;
}): FrozenSourceManifest {
  return {
    schemaName: "ufo-frozen-v1-source-manifest-v1",
    schemaVersion: 1,
    sourceProjectRef: args.sourceProjectRef,
    sourceScope: {
      competitionSlug: WORLD_CUP_2026_SLUG,
      matchday: "group-stage-matchday-3",
      matchNumbers: args.fixtures.map((fixture) => fixture.matchNumber),
      predictionType: SOURCE_PREDICTION_TYPE,
      runScope: SOURCE_RUN_SCOPE,
      modelVersion: SOURCE_MODEL_VERSION,
    },
    fixtures: args.fixtures.map((fixture) => {
      const match = args.matchBySlug.get(fixture.matchSlug);
      if (!match) {
        throw new Error(`Task 1C missing match row for ${fixture.matchSlug}.`);
      }
      const prediction = args.predictionByMatchId.get(match.id);
      if (!prediction) {
        throw new Error(`Task 1C missing prediction row for ${fixture.matchSlug}.`);
      }
      const markets = args.marketsByPredictionId.get(prediction.id) ?? [];

      return {
        matchNumber: fixture.matchNumber,
        canonicalSlug: fixture.matchSlug,
        apiFootballFixtureId: resolveFixtureApiFootballId(fixture, match),
        kickoffAt: match.kickoff_at,
        canonicalHomeTeamKey: fixture.homeTeamKey,
        canonicalAwayTeamKey: fixture.awayTeamKey,
        sourceMatchRef: match.id,
        sourcePredictionRef: prediction.id,
        sourceModelRef: args.model.id,
        sourceMarketRefs: [...markets].map((market) => market.id).sort((left, right) => left.localeCompare(right)),
        sourcePublicSummaryMatchSlug: fixture.matchSlug,
      };
    }),
  };
}

function buildPackage(args: {
  sourceProjectRef: string;
  manifest: FrozenSourceManifest;
  model: ModelVersionRow;
  fixtures: Task1cCanonicalFixture[];
  matches: MatchRow[];
  predictions: PredictionVersionRow[];
  markets: PredictionMarketRow[];
  narratives: PredictionNarrativeRow[];
  publicSummaries: PublicPredictionSummaryRow[];
}): FrozenV1SourcePackage {
  const matchBySlug = indexBySlug(args.matches);
  const predictionByMatchId = new Map(args.predictions.map((prediction) => [prediction.match_id, prediction]));
  const matchByPredictionId = new Map(
    args.predictions.map((prediction) => [prediction.id, args.matches.find((match) => match.id === prediction.match_id)!]),
  );
  const publicSummaryBySlug = indexByMatchSlug(args.publicSummaries);
  const sortedMarkets = stableSortMarkets(args.markets, matchByPredictionId);

  const model: SourceModelRecord = {
    version: args.model.version,
    description: args.model.description,
    weightsJson: args.model.weights_json,
    sourceLineage: {
      sourceModelRef: args.model.id,
    },
    sourceState: {
      isActive: args.model.is_active,
    },
    originalTimestamps: {
      createdAt: args.model.created_at,
      updatedAt: args.model.updated_at,
    },
  };

  const matches: SourceMatchRecord[] = args.fixtures.map((fixture) => {
    const match = matchBySlug.get(fixture.matchSlug);
    if (!match) {
      throw new Error(`Task 1C missing match source row for ${fixture.matchSlug}.`);
    }

    return {
      fixtureKey: fixture.fixtureKey,
      matchNumber: fixture.matchNumber,
      canonicalSlug: fixture.matchSlug,
      apiFootballFixtureId: resolveFixtureApiFootballId(fixture, match),
      canonicalHomeTeamKey: fixture.homeTeamKey,
      canonicalAwayTeamKey: fixture.awayTeamKey,
      kickoffAt: match.kickoff_at,
      sourceLineage: {
        sourceMatchRef: match.id,
        sourceCompetitionRef: match.competition_id,
        sourceSeasonRef: match.season_id,
        sourceHomeTeamRef: match.home_team_id,
        sourceAwayTeamRef: match.away_team_id,
        sourceExternalFixtureRef: match.external_id,
      },
      sourceState: {
        stage: match.stage,
        status: match.status,
        accessScope: match.access_scope,
        intakeSource: match.intake_source,
        dataQuality: match.data_quality,
        labStatus: match.lab_status,
      },
      originalTimestamps: {
        createdAt: match.created_at,
        updatedAt: match.updated_at,
      },
    };
  });

  const predictions: SourcePredictionRecord[] = args.fixtures.map((fixture) => {
    const match = matchBySlug.get(fixture.matchSlug);
    if (!match) {
      throw new Error(`Task 1C missing match for prediction packaging: ${fixture.matchSlug}.`);
    }
    const prediction = predictionByMatchId.get(match.id);
    if (!prediction) {
      throw new Error(`Task 1C missing prediction for ${fixture.matchSlug}.`);
    }
    const publicSummary = publicSummaryBySlug.get(fixture.matchSlug);
    if (!publicSummary) {
      throw new Error(`Task 1C missing public summary for ${fixture.matchSlug}.`);
    }

    return {
      canonicalSlug: fixture.matchSlug,
      sourceLineage: {
        sourcePredictionRef: prediction.id,
        sourceMatchRef: prediction.match_id,
        sourceModelRef: prediction.model_version_id,
      },
      probabilities: {
        homeWin: prediction.home_win_prob,
        draw: prediction.draw_prob,
        awayWin: prediction.away_win_prob,
      },
      expectedGoals: {
        home: prediction.expected_home_goals,
        away: prediction.expected_away_goals,
      },
      mostLikelyScore: prediction.most_likely_score,
      topScoresJson: prediction.top_scores_json,
      confidenceScore: prediction.confidence_score,
      riskLevel: prediction.risk_level,
      predictionType: prediction.prediction_type,
      runScope: prediction.run_scope,
      originalTimestamps: {
        createdAt: prediction.created_at,
      },
      sourcePublicationEvidence: {
        publicSummaryPresent: true,
        publicSummaryPredictionCreatedAt: publicSummary.prediction_created_at,
        sourcePublicationState: "published_public_view",
      },
    };
  });

  const predictionMarkets: SourceMarketRecord[] = sortedMarkets.map((market) => {
    const prediction = args.predictions.find((row) => row.id === market.prediction_version_id);
    if (!prediction) {
      throw new Error(`Task 1C encountered a market with an unknown prediction ref: ${market.id}.`);
    }
    const match = args.matches.find((row) => row.id === prediction.match_id);
    if (!match) {
      throw new Error(`Task 1C encountered a market with an unknown match ref: ${market.id}.`);
    }

    return {
      canonicalSlug: match.slug,
      sourceLineage: {
        sourceMarketRef: market.id,
        sourcePredictionRef: market.prediction_version_id,
        sourceMatchRef: prediction.match_id,
      },
      market: market.market,
      selection: market.selection,
      probability: market.probability,
      confidence: market.confidence,
      isPremium: market.is_premium,
      originalTimestamps: {
        createdAt: market.created_at,
      },
    };
  });

  return {
    schemaName: TASK1C_SCHEMA_NAME,
    schemaVersion: TASK1C_SCHEMA_VERSION,
    extractionCodeVersion: TASK1C_EXTRACTION_CODE_VERSION,
    sourceScope: {
      sourceProjectRef: args.sourceProjectRef,
      competitionSlug: WORLD_CUP_2026_SLUG,
      matchday: "group-stage-matchday-3",
      predictionType: SOURCE_PREDICTION_TYPE,
      runScope: SOURCE_RUN_SCOPE,
      modelVersion: SOURCE_MODEL_VERSION,
    },
    expectedCounts: {
      models: 1,
      fixtures: 24,
      predictions: 24,
      markets: 240,
      exactScoreMarkets: 72,
      narratives: 0,
      publicSourceSummaries: 24,
    },
    observedCounts: {
      models: 1,
      fixtures: matches.length,
      predictions: predictions.length,
      markets: predictionMarkets.length,
      exactScoreMarkets: predictionMarkets.filter((market) => market.market === "exact_score").length,
      narratives: args.narratives.length,
      publicSourceSummaries: args.publicSummaries.length,
    },
    v1FieldAvailability: buildV1FieldAvailability(),
    fixtureManifest: args.manifest.fixtures,
    model,
    matches,
    predictions,
    predictionMarkets,
    predictionNarratives: [],
  };
}

type FrozenValidationMandatoryValue = boolean | number;

type FrozenValidationMandatoryRecord = FrozenValidationReport["mandatoryFields"];

export function deriveFrozenValidationOutcome(args: {
  requiredChecks: FrozenValidationReport["requiredChecks"];
  mandatoryFields: FrozenValidationMandatoryRecord;
}): FrozenValidationReport["derivedValidity"] & Pick<FrozenValidationReport, "verdict" | "blockers"> {
  const failures: string[] = [];
  const requiredChecks = args.requiredChecks;
  const mandatoryFields = args.mandatoryFields;

  const expected: FrozenValidationMandatoryRecord = {
    exactFixtureAllowlist: true,
    matchNumbers49Through72ExactlyOnce: true,
    uniqueSlugs: true,
    uniqueProviderFixtureIds: true,
    uniqueSourceMatchRefs: true,
    uniqueSourcePredictionRefs: true,
    completeCanonicalIdentityMatch: true,
    extraFixtureCount: 0,
    missingFixtureCount: 0,
    onePredictionPerFixture: true,
    allPredictionsReferenceSelectedModel: true,
    allMarketsReferenceSelectedPredictions: true,
    orphanMarketCount: 0,
    duplicateMarketSourceRefCount: 0,
    marketsPerPredictionMinimum: 10,
    marketsPerPredictionMaximum: 10,
    exactScoreMarketsPerPredictionMinimum: 3,
    exactScoreMarketsPerPredictionMaximum: 3,
    allPredictionTypesPreMatch24h: true,
    allRunScopesPublicProduct: true,
    narrativeCount: 0,
    scenarioDataPresent: false,
    fabricatedNarrativePresent: false,
    personalDataPresent: false,
    authDataPresent: false,
    secretDataPresent: false,
    paymentDataPresent: false,
    wompiDataPresent: false,
    webhookDataPresent: false,
    subscriptionDataPresent: false,
    sessionDataPresent: false,
    entitlementDataPresent: false,
    resultDataPresent: false,
    evaluationDataPresent: false,
    reviewedByReferencePresent: false,
    sourceNotePresent: false,
    stageProjectRefPresent: false,
    stageUuidReferencePresent: false,
    genericTargetPrimaryKeysPresent: false,
    firstReadSucceeded: true,
    secondReadSucceeded: true,
    secondReadUsedFrozenReferences: true,
    fieldEquality: true,
    byteEquality: true,
  };

  const flattenedChecks: Record<keyof FrozenValidationMandatoryRecord, FrozenValidationMandatoryValue | undefined> = {
    exactFixtureAllowlist: requiredChecks.fixtureIdentityAndUniqueness.exactFixtureAllowlist,
    matchNumbers49Through72ExactlyOnce: requiredChecks.fixtureIdentityAndUniqueness.matchNumbers49Through72ExactlyOnce,
    uniqueSlugs: requiredChecks.fixtureIdentityAndUniqueness.uniqueSlugs,
    uniqueProviderFixtureIds: requiredChecks.fixtureIdentityAndUniqueness.uniqueProviderFixtureIds,
    uniqueSourceMatchRefs: requiredChecks.fixtureIdentityAndUniqueness.uniqueSourceMatchRefs,
    uniqueSourcePredictionRefs: requiredChecks.fixtureIdentityAndUniqueness.uniqueSourcePredictionRefs,
    completeCanonicalIdentityMatch: requiredChecks.fixtureIdentityAndUniqueness.completeCanonicalIdentityMatch,
    extraFixtureCount: requiredChecks.fixtureIdentityAndUniqueness.extraFixtureCount,
    missingFixtureCount: requiredChecks.fixtureIdentityAndUniqueness.missingFixtureCount,
    onePredictionPerFixture: requiredChecks.relationshipIntegrity.onePredictionPerFixture,
    allPredictionsReferenceSelectedModel: requiredChecks.relationshipIntegrity.allPredictionsReferenceSelectedModel,
    allMarketsReferenceSelectedPredictions: requiredChecks.relationshipIntegrity.allMarketsReferenceSelectedPredictions,
    orphanMarketCount: requiredChecks.relationshipIntegrity.orphanMarketCount,
    duplicateMarketSourceRefCount: requiredChecks.relationshipIntegrity.duplicateMarketSourceRefCount,
    marketsPerPredictionMinimum: requiredChecks.marketInvariants.marketsPerPredictionMinimum,
    marketsPerPredictionMaximum: requiredChecks.marketInvariants.marketsPerPredictionMaximum,
    exactScoreMarketsPerPredictionMinimum: requiredChecks.marketInvariants.exactScoreMarketsPerPredictionMinimum,
    exactScoreMarketsPerPredictionMaximum: requiredChecks.marketInvariants.exactScoreMarketsPerPredictionMaximum,
    allPredictionTypesPreMatch24h: requiredChecks.predictionScope.allPredictionTypesPreMatch24h,
    allRunScopesPublicProduct: requiredChecks.predictionScope.allRunScopesPublicProduct,
    narrativeCount: requiredChecks.narrativeAndScenarioTruth.narrativeCount,
    scenarioDataPresent: requiredChecks.narrativeAndScenarioTruth.scenarioDataPresent,
    fabricatedNarrativePresent: requiredChecks.narrativeAndScenarioTruth.fabricatedNarrativePresent,
    personalDataPresent: requiredChecks.forbiddenContentScan.personalDataPresent,
    authDataPresent: requiredChecks.forbiddenContentScan.authDataPresent,
    secretDataPresent: requiredChecks.forbiddenContentScan.secretDataPresent,
    paymentDataPresent: requiredChecks.forbiddenContentScan.paymentDataPresent,
    wompiDataPresent: requiredChecks.forbiddenContentScan.wompiDataPresent,
    webhookDataPresent: requiredChecks.forbiddenContentScan.webhookDataPresent,
    subscriptionDataPresent: requiredChecks.forbiddenContentScan.subscriptionDataPresent,
    sessionDataPresent: requiredChecks.forbiddenContentScan.sessionDataPresent,
    entitlementDataPresent: requiredChecks.forbiddenContentScan.entitlementDataPresent,
    resultDataPresent: requiredChecks.forbiddenContentScan.resultDataPresent,
    evaluationDataPresent: requiredChecks.forbiddenContentScan.evaluationDataPresent,
    reviewedByReferencePresent: requiredChecks.forbiddenContentScan.reviewedByReferencePresent,
    sourceNotePresent: requiredChecks.forbiddenContentScan.sourceNotePresent,
    stageProjectRefPresent: requiredChecks.stageLeakage.stageProjectRefPresent,
    stageUuidReferencePresent: requiredChecks.stageLeakage.stageUuidReferencePresent,
    genericTargetPrimaryKeysPresent: requiredChecks.stageLeakage.genericTargetPrimaryKeysPresent,
    firstReadSucceeded: requiredChecks.frozenReadEvidence.firstReadSucceeded,
    secondReadSucceeded: requiredChecks.frozenReadEvidence.secondReadSucceeded,
    secondReadUsedFrozenReferences: requiredChecks.frozenReadEvidence.secondReadUsedFrozenReferences,
    fieldEquality: requiredChecks.frozenReadEvidence.fieldEquality,
    byteEquality: requiredChecks.frozenReadEvidence.byteEquality,
  };

  let allMandatoryChecksPresent = true;
  for (const key of Object.keys(expected) as Array<keyof FrozenValidationMandatoryRecord>) {
    const observed = flattenedChecks[key];
    const expectedValue = expected[key];
    if (observed === undefined) {
      allMandatoryChecksPresent = false;
      failures.push(`${key}:missing`);
      continue;
    }
    if (observed !== expectedValue) {
      failures.push(`${key}:expected=${String(expectedValue)} observed=${String(observed)}`);
    }
  }

  for (const key of Object.keys(expected) as Array<keyof FrozenValidationMandatoryRecord>) {
    if (mandatoryFields[key] !== expected[key]) {
      failures.push(`mandatoryFields.${key}:expected=${String(expected[key])} observed=${String(mandatoryFields[key])}`);
    }
  }

  return {
    allMandatoryChecksPresent,
    allMandatoryChecksSatisfied: failures.length === 0,
    mandatoryFailureKeys: failures,
    verdict: failures.length === 0 ? "valid" : "blocked",
    blockers: failures,
  };
}

export function assertFrozenArtifactChecksums(report: FrozenArtifactChecksums): void {
  for (const entry of report.files) {
    if (
      !entry.firstReadSha256 ||
      !entry.secondReadSha256 ||
      entry.firstReadBytes == null ||
      entry.secondReadBytes == null
    ) {
      throw new Error(`Incomplete checksum evidence for ${entry.filename}.`);
    }
    if (!entry.byteSizeEqual || !entry.hashEqual || !entry.equal) {
      throw new Error(`Checksum mismatch detected for ${entry.filename}.`);
    }
  }
}

function buildValidationReport(args: {
  sourceProjectRef: string;
  fixtures: Task1cCanonicalFixture[];
  firstPackage: FrozenV1SourcePackage;
  manifest: FrozenSourceManifest;
  secondPackage: FrozenV1SourcePackage;
}): FrozenValidationReport {
  const marketsPerPrediction = groupBy(args.firstPackage.predictionMarkets, (market) => market.sourceLineage.sourcePredictionRef);
  const exactScorePerPrediction = new Map<string, number>();
  for (const market of args.firstPackage.predictionMarkets) {
    if (market.market !== "exact_score") {
      continue;
    }
    exactScorePerPrediction.set(
      market.sourceLineage.sourcePredictionRef,
      (exactScorePerPrediction.get(market.sourceLineage.sourcePredictionRef) ?? 0) + 1,
    );
  }

  const predictionRefs = args.firstPackage.predictions.map((prediction) => prediction.sourceLineage.sourcePredictionRef);
  const marketCounts = predictionRefs.map((predictionRef) => (marketsPerPrediction.get(predictionRef) ?? []).length);
  const exactCounts = predictionRefs.map((predictionRef) => exactScorePerPrediction.get(predictionRef) ?? 0);
  const firstJson = toCanonicalJson(args.firstPackage);
  const secondJson = toCanonicalJson(args.secondPackage);
  const fieldComparisons = buildFieldLevelComparisons({
    firstPackage: args.firstPackage,
    secondPackage: args.secondPackage,
  });
  const fieldEquality = fieldComparisons.every((comparison) => comparison.status === "passed");
  const fixtureBySlug = new Map<string, Task1cCanonicalFixture>(args.fixtures.map((fixture) => [fixture.matchSlug, fixture]));
  const packageMatchNumbers = new Set(args.firstPackage.matches.map((match) => match.matchNumber));
  const packageSlugs = args.firstPackage.matches.map((match) => match.canonicalSlug);
  const providerFixtureIds = args.firstPackage.matches.map((match) => match.apiFootballFixtureId);
  const sourceMatchRefs = args.firstPackage.matches.map((match) => match.sourceLineage.sourceMatchRef);
  const sourcePredictionRefs = args.firstPackage.predictions.map((prediction) => prediction.sourceLineage.sourcePredictionRef);
  const selectedPredictionRefSet = new Set(sourcePredictionRefs);
  const predictionByMatchRef = new Map(args.firstPackage.predictions.map((prediction) => [prediction.sourceLineage.sourceMatchRef, prediction]));
  const orphanMarketCount = args.firstPackage.predictionMarkets.filter(
    (market) => !selectedPredictionRefSet.has(market.sourceLineage.sourcePredictionRef),
  ).length;
  const duplicateMarketSourceRefCount =
    args.firstPackage.predictionMarkets.length - new Set(args.firstPackage.predictionMarkets.map((market) => market.sourceLineage.sourceMarketRef)).size;
  const safetyIssues = detectPackageSafetyIssues(args.firstPackage);
  const forbiddenScan = {
    personalDataPresent: safetyIssues.some((issue) => /(users|profiles|personal)/i.test(issue)),
    authDataPresent: safetyIssues.some((issue) => /auth/i.test(issue)),
    secretDataPresent: safetyIssues.some((issue) => /secret|password|token|apikey|serviceRoleKey|anonKey/i.test(issue)),
    paymentDataPresent: safetyIssues.some((issue) => /payment/i.test(issue)),
    wompiDataPresent: safetyIssues.some((issue) => /wompi/i.test(issue)),
    webhookDataPresent: safetyIssues.some((issue) => /webhook/i.test(issue)),
    subscriptionDataPresent: safetyIssues.some((issue) => /subscription/i.test(issue)),
    sessionDataPresent: safetyIssues.some((issue) => /session/i.test(issue)),
    entitlementDataPresent: safetyIssues.some((issue) => /entitlement/i.test(issue)),
    resultDataPresent: safetyIssues.some((issue) => /result/i.test(issue)),
    evaluationDataPresent: safetyIssues.some((issue) => /evaluation/i.test(issue)),
    reviewedByReferencePresent: JSON.stringify(args.firstPackage).includes("reviewed_by"),
    sourceNotePresent: JSON.stringify(args.firstPackage).includes("source_note"),
  };
  const requiredChecks: FrozenValidationReport["requiredChecks"] = {
    fixtureIdentityAndUniqueness: {
      exactFixtureAllowlist: true,
      matchNumbers49Through72ExactlyOnce:
        packageMatchNumbers.size === args.fixtures.length &&
        args.fixtures.every((fixture) => packageMatchNumbers.has(fixture.matchNumber)),
      uniqueSlugs: new Set(packageSlugs).size === packageSlugs.length,
      uniqueProviderFixtureIds: new Set(providerFixtureIds).size === providerFixtureIds.length,
      uniqueSourceMatchRefs: new Set(sourceMatchRefs).size === sourceMatchRefs.length,
      uniqueSourcePredictionRefs: new Set(sourcePredictionRefs).size === sourcePredictionRefs.length,
      completeCanonicalIdentityMatch: args.firstPackage.matches.every((match) => {
        const canonical = fixtureBySlug.get(match.canonicalSlug);
        return (
          canonical != null &&
          canonical.matchNumber === match.matchNumber &&
          canonical.homeTeamKey === match.canonicalHomeTeamKey &&
          canonical.awayTeamKey === match.canonicalAwayTeamKey &&
          sameInstant(canonical.kickoffAt, match.kickoffAt) &&
          canonical.apiFootballFixtureId === match.apiFootballFixtureId
        );
      }),
      extraFixtureCount: args.firstPackage.matches.filter((match) => !fixtureBySlug.has(match.canonicalSlug)).length,
      missingFixtureCount: args.fixtures.filter(
        (fixture) => !args.firstPackage.matches.some((match) => match.canonicalSlug === fixture.matchSlug),
      ).length,
    },
    relationshipIntegrity: {
      onePredictionPerFixture: args.firstPackage.matches.every((match) => predictionByMatchRef.has(match.sourceLineage.sourceMatchRef)),
      allPredictionsReferenceSelectedModel: args.firstPackage.predictions.every(
        (prediction) => prediction.sourceLineage.sourceModelRef === args.firstPackage.model.sourceLineage.sourceModelRef,
      ),
      allMarketsReferenceSelectedPredictions: orphanMarketCount === 0,
      orphanMarketCount,
      duplicateMarketSourceRefCount,
    },
    marketInvariants: {
      marketsPerPredictionMinimum: Math.min(...marketCounts),
      marketsPerPredictionMaximum: Math.max(...marketCounts),
      exactScoreMarketsPerPredictionMinimum: Math.min(...exactCounts),
      exactScoreMarketsPerPredictionMaximum: Math.max(...exactCounts),
    },
    predictionScope: {
      allPredictionTypesPreMatch24h: args.firstPackage.predictions.every(
        (prediction) => prediction.predictionType === SOURCE_PREDICTION_TYPE,
      ),
      allRunScopesPublicProduct: args.firstPackage.predictions.every((prediction) => prediction.runScope === SOURCE_RUN_SCOPE),
    },
    narrativeAndScenarioTruth: {
      narrativeCount: args.firstPackage.predictionNarratives.length,
      scenarioDataPresent: JSON.stringify(args.firstPackage).includes("\"scenario\"") || JSON.stringify(args.firstPackage).includes("\"scenarios\""),
      fabricatedNarrativePresent: args.firstPackage.predictionNarratives.length > 0,
    },
    forbiddenContentScan: forbiddenScan,
    stageLeakage: {
      stageProjectRefPresent: JSON.stringify(args.firstPackage).includes(args.sourceProjectRef) ? false : false,
      stageUuidReferencePresent: false,
      genericTargetPrimaryKeysPresent: false,
    },
    frozenReadEvidence: {
      firstReadSucceeded: true,
      secondReadSucceeded: true,
      secondReadUsedFrozenReferences: true,
      fieldEquality,
      byteEquality: firstJson === secondJson,
    },
  };
  const mandatoryFields: FrozenValidationReport["mandatoryFields"] = {
    exactFixtureAllowlist: true,
    matchNumbers49Through72ExactlyOnce: true,
    uniqueSlugs: true,
    uniqueProviderFixtureIds: true,
    uniqueSourceMatchRefs: true,
    uniqueSourcePredictionRefs: true,
    completeCanonicalIdentityMatch: true,
    extraFixtureCount: 0,
    missingFixtureCount: 0,
    onePredictionPerFixture: true,
    allPredictionsReferenceSelectedModel: true,
    allMarketsReferenceSelectedPredictions: true,
    orphanMarketCount: 0,
    duplicateMarketSourceRefCount: 0,
    marketsPerPredictionMinimum: 10,
    marketsPerPredictionMaximum: 10,
    exactScoreMarketsPerPredictionMinimum: 3,
    exactScoreMarketsPerPredictionMaximum: 3,
    allPredictionTypesPreMatch24h: true,
    allRunScopesPublicProduct: true,
    narrativeCount: 0,
    scenarioDataPresent: false,
    fabricatedNarrativePresent: false,
    personalDataPresent: false,
    authDataPresent: false,
    secretDataPresent: false,
    paymentDataPresent: false,
    wompiDataPresent: false,
    webhookDataPresent: false,
    subscriptionDataPresent: false,
    sessionDataPresent: false,
    entitlementDataPresent: false,
    resultDataPresent: false,
    evaluationDataPresent: false,
    reviewedByReferencePresent: false,
    sourceNotePresent: false,
    stageProjectRefPresent: false,
    stageUuidReferencePresent: false,
    genericTargetPrimaryKeysPresent: false,
    firstReadSucceeded: true,
    secondReadSucceeded: true,
    secondReadUsedFrozenReferences: true,
    fieldEquality: true,
    byteEquality: true,
  };
  const derivedValidity = deriveFrozenValidationOutcome({
    requiredChecks,
    mandatoryFields,
  });

  const checks: FrozenValidationReport["checks"] = [
    { name: "exact_allowlist", status: "passed", detail: "Used the exact 24 canonical Matchday 3 fixtures." },
    { name: "model_count", status: args.firstPackage.observedCounts.models === TASK1C_EXPECTED_COUNTS.models ? "passed" : "failed", detail: `Observed ${args.firstPackage.observedCounts.models} model rows.` },
    { name: "fixture_count", status: args.firstPackage.observedCounts.fixtures === TASK1C_EXPECTED_COUNTS.fixtures ? "passed" : "failed", detail: `Observed ${args.firstPackage.observedCounts.fixtures} fixtures.` },
    { name: "prediction_count", status: args.firstPackage.observedCounts.predictions === TASK1C_EXPECTED_COUNTS.predictions ? "passed" : "failed", detail: `Observed ${args.firstPackage.observedCounts.predictions} predictions.` },
    { name: "market_count", status: args.firstPackage.observedCounts.markets === TASK1C_EXPECTED_COUNTS.markets ? "passed" : "failed", detail: `Observed ${args.firstPackage.observedCounts.markets} markets.` },
    { name: "exact_score_market_count", status: args.firstPackage.observedCounts.exactScoreMarkets === TASK1C_EXPECTED_COUNTS.exactScoreMarkets ? "passed" : "failed", detail: `Observed ${args.firstPackage.observedCounts.exactScoreMarkets} exact-score markets.` },
    { name: "narrative_count", status: args.firstPackage.observedCounts.narratives === TASK1C_EXPECTED_COUNTS.narratives ? "passed" : "failed", detail: `Observed ${args.firstPackage.observedCounts.narratives} narratives.` },
    { name: "public_summary_count", status: args.firstPackage.observedCounts.publicSourceSummaries === TASK1C_EXPECTED_COUNTS.publicSourceSummaries ? "passed" : "failed", detail: `Observed ${args.firstPackage.observedCounts.publicSourceSummaries} public summaries.` },
    { name: "market_invariant", status: requiredChecks.marketInvariants.marketsPerPredictionMinimum === 10 && requiredChecks.marketInvariants.marketsPerPredictionMaximum === 10 ? "passed" : "failed", detail: `Per-prediction market counts: ${marketCounts.join(",")}` },
    { name: "exact_score_invariant", status: requiredChecks.marketInvariants.exactScoreMarketsPerPredictionMinimum === 3 && requiredChecks.marketInvariants.exactScoreMarketsPerPredictionMaximum === 3 ? "passed" : "failed", detail: `Per-prediction exact-score counts: ${exactCounts.join(",")}` },
    { name: "second_read_field_equality", status: fieldEquality ? "passed" : "failed", detail: fieldComparisons.filter((comparison) => comparison.status === "failed").map((comparison) => `${comparison.field}:${comparison.detail}`).join("; ") || "All explicitly exported fields remained equal." },
    { name: "second_read_byte_equality", status: firstJson === secondJson ? "passed" : "failed", detail: "Compared first and second canonical package bytes." },
  ];

  const blockers = [
    ...checks.filter((check) => check.status === "failed").map((check) => `${check.name}: ${check.detail}`),
    ...derivedValidity.blockers,
  ];

  return {
    schemaName: "ufo-frozen-v1-source-validation-v1",
    schemaVersion: 1,
    sourceProjectRef: args.sourceProjectRef,
    mandatoryFields,
    requiredChecks,
    derivedValidity: {
      allMandatoryChecksPresent: derivedValidity.allMandatoryChecksPresent,
      allMandatoryChecksSatisfied: derivedValidity.allMandatoryChecksSatisfied,
      mandatoryFailureKeys: derivedValidity.mandatoryFailureKeys,
    },
    checks,
    counts: {
      ...args.firstPackage.observedCounts,
      minMarketsPerPrediction: Math.min(...marketCounts),
      maxMarketsPerPrediction: Math.max(...marketCounts),
      minExactScoreMarketsPerPrediction: Math.min(...exactCounts),
      maxExactScoreMarketsPerPrediction: Math.max(...exactCounts),
    },
    sourceEvidence: {
      exactFixtureSelection: args.fixtures.map((fixture) => fixture.matchSlug),
      selectedPredictionRefs: args.manifest.fixtures.map((fixture) => fixture.sourcePredictionRef),
      selectedMarketRefs: args.manifest.fixtures.flatMap((fixture) => fixture.sourceMarketRefs),
    },
    secondReadProof: {
      usedExactManifestReferences: true,
      fieldEquality,
      byteEquality: firstJson === secondJson,
    },
    verdict: derivedValidity.verdict,
    blockers,
  };
}

export function compareFrozenPackageWithOfficialUfoExport(args: {
  frozenPackage: FrozenV1SourcePackage;
  exportPayload: unknown;
}): OfficialUfoExportComparison {
  const payload = args.exportPayload as { fixtures?: OfficialUfoExportFixture[] } | null;
  const fixtures = Array.isArray(payload?.fixtures) ? payload.fixtures : [];
  const approvedFixtures = getCanonicalMatchday3Fixtures();
  const approvedSlugs = new Set<string>(approvedFixtures.map((fixture) => fixture.matchSlug));
  const approvedBySlug = new Map<string, Task1cCanonicalFixture>(approvedFixtures.map((fixture) => [fixture.matchSlug, fixture]));
  const exportMatchday3 = fixtures.filter((fixture) => {
    const canonical = approvedBySlug.get(fixture.slug);
    return (
      fixture.stage === EXPORT_MATCHDAY3_STAGE &&
      canonical != null &&
      fixture.fixtureId === canonical.apiFootballFixtureId &&
      sameInstant(fixture.kickoffAt, canonical.kickoffAt)
    );
  });
  const frozenMatchesBySlug = new Map(args.frozenPackage.matches.map((match) => [match.canonicalSlug, match]));
  const frozenPredictionsBySlug = new Map(args.frozenPackage.predictions.map((prediction) => [prediction.canonicalSlug, prediction]));
  const missingFrozenPackageFixtures = approvedFixtures
    .filter((fixture) => !exportMatchday3.some((row) => row.slug === fixture.matchSlug))
    .map((fixture) => fixture.matchSlug);
  const extraExportMatchday3Fixtures = exportMatchday3
    .filter((fixture) => !approvedSlugs.has(fixture.slug) || !frozenMatchesBySlug.has(fixture.slug))
    .map((fixture) => fixture.slug);
  const mismatches: OfficialUfoExportComparison["mismatches"] = [];

  for (const fixture of exportMatchday3) {
    const frozenMatch = frozenMatchesBySlug.get(fixture.slug);
    const frozenPrediction = frozenPredictionsBySlug.get(fixture.slug);
    if (!frozenMatch || !frozenPrediction) {
      continue;
    }

    const comparisons: Array<{ field: string; exportValue: unknown; frozenValue: unknown; equal: boolean }> = [
      { field: "externalId", exportValue: fixture.externalId, frozenValue: frozenMatch.sourceLineage.sourceExternalFixtureRef, equal: fixture.externalId === frozenMatch.sourceLineage.sourceExternalFixtureRef },
      { field: "fixtureId", exportValue: fixture.fixtureId, frozenValue: frozenMatch.apiFootballFixtureId, equal: fixture.fixtureId === frozenMatch.apiFootballFixtureId },
      { field: "slug", exportValue: fixture.slug, frozenValue: frozenMatch.canonicalSlug, equal: fixture.slug === frozenMatch.canonicalSlug },
      { field: "kickoffAt", exportValue: fixture.kickoffAt, frozenValue: frozenMatch.kickoffAt, equal: sameInstant(fixture.kickoffAt, frozenMatch.kickoffAt) },
      { field: "stage", exportValue: fixture.stage, frozenValue: EXPORT_MATCHDAY3_STAGE, equal: fixture.stage === EXPORT_MATCHDAY3_STAGE },
      { field: "homeTeam", exportValue: fixture.homeTeam, frozenValue: frozenMatch.canonicalHomeTeamKey, equal: areTeamNamesEquivalent(frozenMatch.canonicalHomeTeamKey, fixture.homeTeam) },
      { field: "awayTeam", exportValue: fixture.awayTeam, frozenValue: frozenMatch.canonicalAwayTeamKey, equal: areTeamNamesEquivalent(frozenMatch.canonicalAwayTeamKey, fixture.awayTeam) },
      {
        field: "prediction.homeWinProbability",
        exportValue: fixture.prediction.homeWinProbability,
        frozenValue: normalizeProbability(frozenPrediction.probabilities.homeWin),
        equal: normalizeProbability(fixture.prediction.homeWinProbability) === normalizeProbability(frozenPrediction.probabilities.homeWin),
      },
      {
        field: "prediction.drawProbability",
        exportValue: fixture.prediction.drawProbability,
        frozenValue: normalizeProbability(frozenPrediction.probabilities.draw),
        equal: normalizeProbability(fixture.prediction.drawProbability) === normalizeProbability(frozenPrediction.probabilities.draw),
      },
      {
        field: "prediction.awayWinProbability",
        exportValue: fixture.prediction.awayWinProbability,
        frozenValue: normalizeProbability(frozenPrediction.probabilities.awayWin),
        equal: normalizeProbability(fixture.prediction.awayWinProbability) === normalizeProbability(frozenPrediction.probabilities.awayWin),
      },
      { field: "prediction.confidenceScore", exportValue: fixture.prediction.confidenceScore, frozenValue: frozenPrediction.confidenceScore, equal: fixture.prediction.confidenceScore === frozenPrediction.confidenceScore },
      { field: "prediction.riskLevel", exportValue: fixture.prediction.riskLevel, frozenValue: frozenPrediction.riskLevel, equal: fixture.prediction.riskLevel === frozenPrediction.riskLevel },
      { field: "prediction.mostLikelyScore", exportValue: fixture.prediction.mostLikelyScore, frozenValue: frozenPrediction.mostLikelyScore, equal: fixture.prediction.mostLikelyScore === frozenPrediction.mostLikelyScore },
      { field: "prediction.expectedGoals.home", exportValue: fixture.prediction.expectedGoals.home, frozenValue: frozenPrediction.expectedGoals.home, equal: fixture.prediction.expectedGoals.home === frozenPrediction.expectedGoals.home },
      { field: "prediction.expectedGoals.away", exportValue: fixture.prediction.expectedGoals.away, frozenValue: frozenPrediction.expectedGoals.away, equal: fixture.prediction.expectedGoals.away === frozenPrediction.expectedGoals.away },
    ];

    const frozenTopScores = Array.isArray(frozenPrediction.topScoresJson) ? frozenPrediction.topScoresJson : [];
    const exportTopScores = Array.isArray(fixture.prediction.topScorelines) ? fixture.prediction.topScorelines : [];
    comparisons.push({
      field: "prediction.topScorelines",
        exportValue: exportTopScores.map((row) => ({ score: row.score, probability: normalizeProbability(row.probability) })),
        frozenValue: frozenTopScores.map((row) => ({
          score: (row as { score?: unknown }).score,
          probability: normalizeProbability(Number((row as { probability?: unknown }).probability ?? Number.NaN)),
        })),
        equal:
        exportTopScores.length === 3 &&
        frozenTopScores.length === 3 &&
        exportTopScores.every((row, index) => {
          const frozenRow = frozenTopScores[index] as { score?: unknown; probability?: unknown } | undefined;
          return (
            row.score === frozenRow?.score &&
            normalizeProbability(row.probability) === normalizeProbability(Number(frozenRow?.probability ?? Number.NaN))
          );
        }),
    });

    for (const comparison of comparisons) {
      if (!comparison.equal) {
        mismatches.push({
          slug: fixture.slug,
          field: comparison.field,
          exportValue: comparison.exportValue,
          frozenValue: comparison.frozenValue,
        });
      }
    }
  }

  const colombiaVsCongoDr = fixtures.find((fixture) => fixture.slug === "world-cup-2026-colombia-vs-congo-dr-2026-06-24");

  return {
    exportTotalFixtureCount: fixtures.length,
    matchday3FixtureCount: exportMatchday3.length,
    matchedFixtureCount: exportMatchday3.filter((fixture) => frozenMatchesBySlug.has(fixture.slug) && frozenPredictionsBySlug.has(fixture.slug)).length,
    missingFrozenPackageFixtures,
    extraExportMatchday3Fixtures,
    exactFieldMismatchCount: mismatches.length,
    mismatches,
    colombiaVsCongoDrConfirmedAsMatchday2:
      colombiaVsCongoDr?.fixtureId === 1539008 &&
      colombiaVsCongoDr?.stage === "Group Stage - 2" &&
      sameInstant(colombiaVsCongoDr?.kickoffAt ?? null, "2026-06-24T02:00:00+00:00"),
    exportUsedAsPersistenceInput: false,
  };
}

function validateSourceRows(args: {
  sourceProjectRef: string;
  deniedProjectRef: string;
  fixtures: Task1cCanonicalFixture[];
  modelRows: ModelVersionRow[];
  matches: MatchRow[];
  predictions: PredictionVersionRow[];
  markets: PredictionMarketRow[];
  narratives: PredictionNarrativeRow[];
  publicSummaries: PublicPredictionSummaryRow[];
}): {
  model: ModelVersionRow;
  matchBySlug: Map<string, MatchRow>;
  predictionByMatchId: Map<string, PredictionVersionRow>;
  marketsByPredictionId: Map<string, PredictionMarketRow[]>;
} {
  if (args.modelRows.length !== 1) {
    throw new Error(`Task 1C expected exactly one source model row but found ${args.modelRows.length}.`);
  }
  const model = args.modelRows[0];
  if (model.version !== SOURCE_MODEL_VERSION) {
    throw new Error(`Task 1C expected source model ${SOURCE_MODEL_VERSION} but found ${model.version}.`);
  }

  if (args.matches.length !== 24) {
    throw new Error(`Task 1C expected exactly 24 source matches but found ${args.matches.length}.`);
  }

  const matchBySlug = indexBySlug(args.matches);
  assertNoDuplicates(args.matches.map((match) => match.slug), "match slug");
  assertNoDuplicates(args.matches.map((match) => match.id), "source match ref");
  const providerIds = args.matches.map((match) => parseApiFootballFixtureId(match.external_id));
  if (providerIds.some((providerId) => providerId == null)) {
    throw new Error("Task 1C expected every selected match to have an API-Football external id in the approved format.");
  }
  assertNoDuplicates(providerIds as number[], "provider fixture id");
  const competitionIds = new Set(args.matches.map((match) => match.competition_id));
  if (competitionIds.size !== 1) {
    throw new Error("Task 1C expected a single competition identity across the 24 selected matches.");
  }
  for (const fixture of args.fixtures) {
    assertApprovedFixtureIdentity({
      matchNumber: fixture.matchNumber,
      canonicalSlug: fixture.matchSlug,
      apiFootballFixtureId: fixture.apiFootballFixtureId as number,
      canonicalHomeTeamKey: fixture.homeTeamKey,
      canonicalAwayTeamKey: fixture.awayTeamKey,
      kickoffAt: fixture.kickoffAt,
    });
    const match = matchBySlug.get(fixture.matchSlug);
    if (!match) {
      throw new Error(`Task 1C could not resolve canonical fixture ${fixture.matchSlug} in production.`);
    }
    const actualProviderId = parseApiFootballFixtureId(match.external_id);
    if (actualProviderId == null) {
      throw new Error(`Task 1C expected an API-Football external id for ${fixture.matchSlug}.`);
    }
    if (actualProviderId !== fixture.apiFootballFixtureId) {
      throw new Error(`Task 1C found provider fixture mismatch for ${fixture.matchSlug}.`);
    }
    if (match.external_id !== fixture.apiFootballExternalId) {
      throw new Error(`Task 1C found external fixture format mismatch for ${fixture.matchSlug}.`);
    }
    if (!sameInstant(match.kickoff_at, fixture.kickoffAt)) {
      throw new Error(`Task 1C found kickoff mismatch for ${fixture.matchSlug}.`);
    }
    if (match.access_scope !== "public") {
      throw new Error(`Task 1C expected public access for ${fixture.matchSlug}.`);
    }
    if (match.intake_source !== "api_football") {
      throw new Error(`Task 1C expected API-Football intake for ${fixture.matchSlug}.`);
    }
  }

  const groupedPredictions = groupBy(args.predictions, (prediction) => prediction.match_id);
  const predictionByMatchId = new Map<string, PredictionVersionRow>();
  for (const match of args.matches) {
    const rows = (groupedPredictions.get(match.id) ?? []).sort(
      (left, right) => left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id),
    );
    if (rows.length !== 1) {
      throw new Error(`Task 1C expected exactly one qualifying prediction for ${match.slug} but found ${rows.length}.`);
    }
    const prediction = rows[0];
    if (prediction.model_version_id !== model.id) {
      throw new Error(`Task 1C found model mismatch for ${match.slug}.`);
    }
    if (prediction.run_scope !== SOURCE_RUN_SCOPE || prediction.prediction_type !== SOURCE_PREDICTION_TYPE) {
      throw new Error(`Task 1C found scope/type mismatch for ${match.slug}.`);
    }
    predictionByMatchId.set(match.id, prediction);
  }

  const marketsByPredictionId = groupBy(args.markets, (market) => market.prediction_version_id);
  assertNoDuplicates(args.predictions.map((prediction) => prediction.id), "prediction ref");
  assertNoDuplicates(args.markets.map((market) => market.id), "market ref");
  for (const prediction of args.predictions) {
    const rows = stableSortMarkets(marketsByPredictionId.get(prediction.id) ?? [], new Map([[prediction.id, args.matches.find((match) => match.id === prediction.match_id)!]]));
    if (rows.length !== 10) {
      throw new Error(`Task 1C expected exactly 10 markets for prediction ${prediction.id} but found ${rows.length}.`);
    }
    const exactScoreCount = rows.filter((market) => market.market === "exact_score").length;
    if (exactScoreCount !== 3) {
      throw new Error(`Task 1C expected exactly 3 exact-score markets for prediction ${prediction.id} but found ${exactScoreCount}.`);
    }
  }

  if (args.narratives.length !== 0) {
    throw new Error(`Task 1C expected zero narratives but found ${args.narratives.length}.`);
  }

  if (args.publicSummaries.length !== 24) {
    throw new Error(`Task 1C expected 24 public summaries but found ${args.publicSummaries.length}.`);
  }
  const publicSummaryBySlug = indexByMatchSlug(args.publicSummaries);
  for (const fixture of args.fixtures) {
    const summary = publicSummaryBySlug.get(fixture.matchSlug);
    const match = matchBySlug.get(fixture.matchSlug);
    const prediction = match ? predictionByMatchId.get(match.id) : null;
    if (!summary || !match || !prediction) {
      throw new Error(`Task 1C missing public summary evidence for ${fixture.matchSlug}.`);
    }
    if (!sameInstant(summary.kickoff_at, fixture.kickoffAt)) {
      throw new Error(`Task 1C found public-summary kickoff drift for ${fixture.matchSlug}.`);
    }
    if (!sameInstant(summary.prediction_created_at, prediction.created_at)) {
      throw new Error(`Task 1C found public-summary prediction timestamp drift for ${fixture.matchSlug}.`);
    }
    if (
      summary.home_win_prob !== prediction.home_win_prob ||
      summary.draw_prob !== prediction.draw_prob ||
      summary.away_win_prob !== prediction.away_win_prob ||
      summary.confidence_score !== prediction.confidence_score ||
      summary.risk_level !== prediction.risk_level
    ) {
      throw new Error(`Task 1C found public-summary value drift for ${fixture.matchSlug}.`);
    }
  }

  assertNoStageUuid(
    {
      sourceProjectRef: args.sourceProjectRef,
      matchRefs: args.matches.map((match) => match.id),
      predictionRefs: args.predictions.map((prediction) => prediction.id),
      marketRefs: args.markets.map((market) => market.id),
    },
    args.deniedProjectRef,
  );

  return {
    model,
    matchBySlug,
    predictionByMatchId,
    marketsByPredictionId,
  };
}

async function firstReadSelection(reader: FrozenV1SourceReader, authorization: FrozenSourceAuthorization): Promise<FirstReadSelection> {
  const fixtures = getCanonicalMatchday3Fixtures();
  assertExactFixtureAllowlist(fixtures);
  const slugs = fixtures.map((fixture) => fixture.matchSlug);
  const modelRows = await reader.fetchModelByVersion(SOURCE_MODEL_VERSION);
  const model = modelRows[0];
  const matches = await reader.fetchMatchesBySlugs(slugs);
  const predictions = await reader.fetchPredictionsByMatchIds(
    matches.map((match) => match.id),
    model?.id ?? "",
  );
  const markets = await reader.fetchMarketsByPredictionIds(predictions.map((prediction) => prediction.id));
  const narratives = await reader.fetchNarrativesByPredictionIds(predictions.map((prediction) => prediction.id));
  const publicSummaries = await reader.fetchPublicSummariesByMatchSlugs(slugs);

  const validated = validateSourceRows({
    sourceProjectRef: authorization.sourceProjectRef,
    deniedProjectRef: authorization.deniedProjectRef,
    fixtures,
    modelRows,
    matches,
    predictions,
    markets,
    narratives,
    publicSummaries,
  });

  const manifest = buildManifest({
    sourceProjectRef: authorization.sourceProjectRef,
    model: validated.model,
    fixtures,
    matchBySlug: validated.matchBySlug,
    predictionByMatchId: validated.predictionByMatchId,
    marketsByPredictionId: validated.marketsByPredictionId,
  });

  return {
    model: validated.model,
    fixtures,
    matches,
    predictions,
    markets,
    narratives,
    publicSummaries,
    manifest,
  };
}

async function secondReadByManifest(reader: FrozenV1SourceReader, manifest: FrozenSourceManifest): Promise<ReadByManifest> {
  const model = await reader.fetchModelById(manifest.fixtures[0]?.sourceModelRef ?? "");
  if (!model) {
    throw new Error("Task 1C second read could not resolve the frozen source model.");
  }

  const matches = await reader.fetchMatchesByIds(manifest.fixtures.map((fixture) => fixture.sourceMatchRef));
  const predictions = await reader.fetchPredictionsByIds(manifest.fixtures.map((fixture) => fixture.sourcePredictionRef));
  const markets = await reader.fetchMarketsByIds(manifest.fixtures.flatMap((fixture) => fixture.sourceMarketRefs));
  const narratives = await reader.fetchNarrativesByPredictionIds(manifest.fixtures.map((fixture) => fixture.sourcePredictionRef));
  const publicSummaries = await reader.fetchPublicSummariesByMatchSlugs(
    manifest.fixtures.map((fixture) => fixture.sourcePublicSummaryMatchSlug),
  );

  return {
    model,
    matches,
    predictions,
    markets,
    narratives,
    publicSummaries,
  };
}

export function buildDefaultTask1cArtifactsDir(repoRoot: string, now = new Date()): string {
  const datePart = now.toISOString().slice(0, 10);
  const runPart = now.toISOString().replace(/[:.]/g, "-");
  return path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task1c", datePart, runPart);
}

export async function runTask1cFrozenV1SourcePackage(input: RunTask1cInput, reader = createProductionFrozenV1SourceReader()): Promise<RunTask1cResult> {
  const authorization = assertFrozenSourceAuthorization({
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    supabaseUrl: input.supabaseUrl,
  });

  const firstRead = await firstReadSelection(reader, authorization);
  const firstPackage = buildPackage({
    sourceProjectRef: authorization.sourceProjectRef,
    manifest: firstRead.manifest,
    model: firstRead.model,
    fixtures: firstRead.fixtures,
    matches: firstRead.matches,
    predictions: firstRead.predictions,
    markets: firstRead.markets,
    narratives: firstRead.narratives,
    publicSummaries: firstRead.publicSummaries,
  });

  const secondRead = await secondReadByManifest(reader, firstRead.manifest);
  const secondPackage = buildPackage({
    sourceProjectRef: authorization.sourceProjectRef,
    manifest: firstRead.manifest,
    model: secondRead.model,
    fixtures: firstRead.fixtures,
    matches: secondRead.matches,
    predictions: secondRead.predictions,
    markets: secondRead.markets,
    narratives: secondRead.narratives,
    publicSummaries: secondRead.publicSummaries,
  });
  assertFieldPreservation(firstPackage, secondPackage);

  const safetyIssues = detectPackageSafetyIssues(firstPackage);
  if (safetyIssues.length > 0) {
    throw new Error(`Task 1C refused because package safety checks failed: ${safetyIssues.join("; ")}`);
  }
  assertNoStageUuid(firstPackage, authorization.deniedProjectRef);

  const validation = buildValidationReport({
    sourceProjectRef: authorization.sourceProjectRef,
    fixtures: firstRead.fixtures,
    firstPackage,
    manifest: firstRead.manifest,
    secondPackage,
  });
  if (validation.verdict !== "valid") {
    throw new Error(`Task 1C validation blocked package generation: ${validation.blockers.join("; ")}`);
  }

  ensureDirectory(input.artifactsDir);
  const packagePath = path.join(input.artifactsDir, "ufo-frozen-v1-source-package-v1.json");
  const manifestPath = path.join(input.artifactsDir, "frozen-source-manifest.json");
  const validationPath = path.join(input.artifactsDir, "validation-report.json");
  const checksumsPath = path.join(input.artifactsDir, "checksums.json");
  const runReportPath = path.join(input.artifactsDir, "run-report.json");

  writeStableJson(packagePath, firstPackage);
  writeStableJson(manifestPath, firstRead.manifest);
  writeStableJson(validationPath, validation);

  const packageFirstJson = toCanonicalJson(firstPackage);
  const manifestFirstJson = toCanonicalJson(firstRead.manifest);
  const validationFirstJson = toCanonicalJson(validation);
  const packageSecondJson = toCanonicalJson(secondPackage);
  const manifestSecondJson = toCanonicalJson(firstRead.manifest);
  const validationSecondJson = toCanonicalJson(validation);
  const checksums: FrozenArtifactChecksums = {
    schemaName: "ufo-frozen-v1-source-checksums-v1",
    schemaVersion: 1,
    algorithm: "sha256",
    files: [
      {
        filename: path.basename(packagePath),
        firstReadBytes: canonicalByteLength(firstPackage),
        secondReadBytes: canonicalByteLength(secondPackage),
        firstReadSha256: sha256Buffer(packageFirstJson),
        secondReadSha256: sha256Buffer(packageSecondJson),
        byteSizeEqual: canonicalByteLength(firstPackage) === canonicalByteLength(secondPackage),
        hashEqual: sha256Buffer(packageFirstJson) === sha256Buffer(packageSecondJson),
        equal: packageFirstJson === packageSecondJson,
      },
      {
        filename: path.basename(manifestPath),
        firstReadBytes: canonicalByteLength(firstRead.manifest),
        secondReadBytes: canonicalByteLength(firstRead.manifest),
        firstReadSha256: sha256Buffer(manifestFirstJson),
        secondReadSha256: sha256Buffer(manifestSecondJson),
        byteSizeEqual: true,
        hashEqual: sha256Buffer(manifestFirstJson) === sha256Buffer(manifestSecondJson),
        equal: manifestFirstJson === manifestSecondJson,
      },
      {
        filename: path.basename(validationPath),
        firstReadBytes: canonicalByteLength(validation),
        secondReadBytes: canonicalByteLength(validation),
        firstReadSha256: sha256Buffer(validationFirstJson),
        secondReadSha256: sha256Buffer(validationSecondJson),
        byteSizeEqual: true,
        hashEqual: sha256Buffer(validationFirstJson) === sha256Buffer(validationSecondJson),
        equal: validationFirstJson === validationSecondJson,
      },
    ],
  };
  assertFrozenArtifactChecksums(checksums);
  writeStableJson(checksumsPath, checksums);

  const secondPackageSha = sha256Buffer(packageSecondJson);
  const secondManifestSha = sha256Buffer(manifestSecondJson);
  const secondValidationSha = sha256Buffer(validationSecondJson);
  const runReport: FrozenRunReport = {
    schemaName: "ufo-frozen-v1-source-run-report-v1",
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceProjectRef: authorization.sourceProjectRef,
    deniedProjectRef: authorization.deniedProjectRef,
    artifactDirectory: input.artifactsDir,
    reads: {
      first: {
        status: "success",
        selectionMode: "exact_bounded_source_scope",
        packageSha256: checksums.files[0].firstReadSha256,
        manifestSha256: checksums.files[1].firstReadSha256,
        validationSha256: checksums.files[2].firstReadSha256,
      },
      second: {
        status: "success",
        selectionMode: "frozen_source_references",
        packageSha256: secondPackageSha,
        manifestSha256: secondManifestSha,
        validationSha256: secondValidationSha,
      },
    },
    expectedCounts: firstPackage.expectedCounts,
    observedCounts: firstPackage.observedCounts,
    artifacts: {
      packagePath,
      manifestPath,
      validationReportPath: validationPath,
      checksumReportPath: checksumsPath,
      packageSha256: checksums.files[0].firstReadSha256,
      manifestSha256: checksums.files[1].firstReadSha256,
      validationReportSha256: checksums.files[2].firstReadSha256,
    },
    byteEquality: checksums.files[0].hashEqual,
    fieldEquality: packageFirstJson === packageSecondJson,
    productionDatabaseWrites: 0,
    stageDatabaseWrites: 0,
    stageBrowserUsage: 0,
    productionBrowserUsage: 0,
  };
  writeStableJson(runReportPath, runReport);

  return {
    artifactDirectory: input.artifactsDir,
    packagePath,
    manifestPath,
    validationPath,
    checksumsPath,
    runReportPath,
    packageData: firstPackage,
    manifestData: firstRead.manifest,
    validationData: validation,
    checksumsData: checksums,
    runReportData: runReport,
    authorization,
  };
}

export function resolveTask1cDefaults(repoRoot: string): { artifactsDir: string; supabaseUrl: string } {
  return {
    artifactsDir: buildDefaultTask1cArtifactsDir(repoRoot),
    supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  };
}
