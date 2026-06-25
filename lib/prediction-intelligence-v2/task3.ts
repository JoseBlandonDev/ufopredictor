import fs from "node:fs";
import path from "node:path";

import {
  buildInitialImportPlan,
  buildSignalSnapshots,
  loadTask1Datasets,
  type ImportPlan,
  type PreparedPaths,
  type TeamSignalSnapshot,
} from "./task1";

const HISTORICAL_ARTIFACT_DATE = "2026-06-22";
const DEFAULT_TASK2_3_ARTIFACT_DATE = "2026-06-21";
const PLANNER_EXECUTION_STATUS = "explicitly_denied_planner_only";
const DEFAULT_APP_ORIGIN = ["https", "//ufopredictor.com"].join(":");

type Task3AReleaseCandidateDecision = "gated_v2_probability_v2_analysis" | "v1_probability_v2_analysis";

type Task3AReleaseDecisionInput = {
  analysisLayer: "release" | "retain";
  probabilityEngine: "release_gated_v2" | "retain_current_v1";
  rationale: string[];
  fixturesRequiringHumanReview: string[];
};

type Task3AComparisonState = {
  generationCutoff: string;
  sourceSnapshotReferences: string[];
  probabilities: { homeWin: number; draw: number; awayWin: number };
  expectedGoals: { home: number; away: number };
  mostLikelyScore: string;
  prediction: {
    probabilities: {
      btts: { yes: number; no: number };
      overUnder25: { over: number; under: number };
    };
    topScorelines: Array<{ score: string; probability: number }>;
  };
};

export type Task3AComparisonEntry = {
  fixtureId: string;
  matchSlug: string;
  officialMatchNumber: number | null;
  kickoffAt: string;
  predictionIdentifier: string;
  currentPredictionVersionId: string | null;
  candidateIdentifier: string;
  sourceCutoff: string;
  teams: {
    home: { canonicalKey: string; nameEn: string; nameEs: string };
    away: { canonicalKey: string; nameEn: string; nameEs: string };
  };
  venue: {
    venueKey: string | null;
    venueName: string | null;
    cityEn: string | null;
    cityEs: string | null;
    actualCity: string | null;
    countryCode: string | null;
  };
  probabilities: { homeWin: number; draw: number; awayWin: number };
  expectedGoals: { home: number; away: number };
  scenarios: Array<Record<string, unknown>>;
  regeneratedCurrentV1: Task3AComparisonState;
  gatedV2: Task3AComparisonState;
  features: {
    homeTeamKey: string;
    awayTeamKey: string;
  };
};

export type Task3AReleaseCandidateFixture = {
  fixtureId: string;
  matchSlug: string;
  officialMatchNumber: number | null;
  kickoffAt: string;
  predictionIdentifier: string;
  currentPredictionVersionId: string | null;
  candidateIdentifier: Task3AReleaseCandidateDecision;
  sourceCutoff: string;
  teams: {
    home: { canonicalKey: string; nameEn: string; nameEs: string };
    away: { canonicalKey: string; nameEn: string; nameEs: string };
  };
  venue: {
    venueKey: string | null;
    venueName: string | null;
    cityEn: string | null;
    cityEs: string | null;
    actualCity: string | null;
    countryCode: string | null;
  };
  probabilities: { homeWin: number; draw: number; awayWin: number };
  expectedGoals: { home: number; away: number };
  scenarios: Array<Record<string, unknown>>;
};

export type Task3APaths = PreparedPaths & {
  artifactDate: string;
  generationCutoff: string;
  task2_3ArtifactDate?: string;
  plannerInput?: {
    targetLabel?: string;
    appOrigin?: string;
  };
};

export type Task3AEnvironmentGuard = {
  executionMode: "local_only_planner";
  targetLabel: string;
  artifactsDir: string;
  writeIntent: "dry_run_only";
  localInputsOnly: true;
  credentialsRequired: false;
  networkAccessRequired: false;
  productionExecutionAuthorized: false;
  stageExecutionAuthorized: false;
  remoteExecutionAuthorized: false;
  migrationExecutionAuthorized: false;
  importExecutionAuthorized: false;
  signalPersistenceAuthorized: false;
  publicationAuthorized: false;
  partnerDeliveryAuthorized: false;
  historicalCommandEvidenceInert: true;
  historicalArtifactsAuthoritativeRuntimeConfig: false;
  safeguards: string[];
};

export type Task3AMigrationPlanner = {
  migrationFile: string;
  executionStatus: typeof PLANNER_EXECUTION_STATUS;
  orderedPlan: string[];
  blockers: string[];
};

type Task3ASourceTablePlan = {
  table: string;
  rowCount: number;
  idempotencyStrategy: string;
  uniqueKey: string;
  status: "planned" | "planner_only";
};

export type Task3AImportPlanner = {
  sourceDiscoverySummary: ImportPlan["counts"];
  tables: Task3ASourceTablePlan[];
  unresolvedAliases: number;
  affectedTeams: string[];
  executionStatus: typeof PLANNER_EXECUTION_STATUS;
};

export type Task3AReleaseReview = {
  generationCutoff: string;
  releaseDecisionSource: "task2_3_local_artifacts";
  liveResultRefreshAvailable: false;
  newlyCompletedFixtures: Array<Record<string, never>>;
  scoreOrStatusCorrections: Array<Record<string, never>>;
  missingOrConflictingStatuses: Array<Record<string, never>>;
  futureFixtureIds: string[];
  futureFixtureCount: number;
  releaseCandidateDecision: Task3AReleaseCandidateDecision;
  releaseCandidateFixtureCount: number;
  fixturesExcludedSinceTask2_3: string[];
  affectedTeamsRequiringSignalRecomputation: string[];
  fixturesRequiringHumanReview: string[];
  rationale: string[];
  executionStatus: typeof PLANNER_EXECUTION_STATUS;
};

export type Task3ASignalPersistencePlan = {
  generationCutoff: string;
  recomputeTeamKeys: string[];
  futureReleaseTeamKeys: string[];
  persistenceTeamKeys: string[];
  plannedSignalRows: Array<{
    canonicalTeamKey: string;
    signalVersion: string;
    cutoffAt: string;
    sourceSnapshotIds: string[];
    idempotencyKey: string;
  }>;
  executionStatus: typeof PLANNER_EXECUTION_STATUS;
};

export type Task3AImmutablePublicationPlan = {
  candidateIdentifier: Task3AReleaseCandidateDecision;
  executionStatus: typeof PLANNER_EXECUTION_STATUS;
  fixtures: Array<{
    fixtureId: string;
    currentPredictionVersionId: string | null;
    immutableVersionKey: string;
    createNewImmutableVersion: true;
    preserveOriginalVersion: true;
    sourceCutoff: string;
    status: typeof PLANNER_EXECUTION_STATUS;
  }>;
};

type Task3ATorneoExportFixture = {
  externalId: string;
  fixtureId: string;
  slug: string;
  ufoUrl: string;
  kickoffAt: string;
  stage: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  prediction: {
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    confidenceScore: null;
    riskLevel: null;
    mostLikelyScore: string;
    expectedGoals: {
      home: number;
      away: number;
    };
    topScorelines: Array<{ score: string; probability: number }>;
    bothTeamsToScore: {
      yesProbability: number;
      noProbability: number;
    };
    totalGoals25: {
      overProbability: number;
      underProbability: number;
    };
  };
};

export type Task3ATorneoExportPlan = {
  schemaVersion: "torneo-ufo-export-v1";
  executionStatus: typeof PLANNER_EXECUTION_STATUS;
  payload: {
    schemaVersion: "torneo-ufo-export-v1";
    generatedAt: string;
    source: "ufo_predictor";
    sourceAppUrl: string;
    competition: "world-cup-2026";
    range: { from: string; to: string };
    displayGuidance: {
      defaultTeaser: "show_1x2_probabilities_and_link";
      exactScoreRecommendedReveal: "after_user_pick_or_pick_deadline";
      topScorelinesRecommendedReveal: "after_user_pick_or_pick_deadline";
      postMatchUse: "comparison_and_learning";
    };
    fixtures: Task3ATorneoExportFixture[];
  };
};

export type Task3AResult = {
  guard: Task3AEnvironmentGuard;
  migrationPlanner: Task3AMigrationPlanner;
  importPlanner: Task3AImportPlanner;
  releaseReview: Task3AReleaseReview;
  signalPersistencePlan: Task3ASignalPersistencePlan;
  immutablePublicationPlan: Task3AImmutablePublicationPlan;
  torneoExportPlan: Task3ATorneoExportPlan;
  generatedArtifacts: string[];
  safeApproximationUsed: true;
};

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

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function isPathWithinResolvedRoot(args: { candidatePath: string; rootPath: string; allowSamePath?: boolean }): boolean {
  const relativePath = path.relative(args.rootPath, args.candidatePath);
  if (relativePath === "") {
    return args.allowSamePath ?? false;
  }

  return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function buildTask3ALocalRunRoot(repoRoot: string): string {
  return path.resolve(repoRoot, "artifacts", "prediction-intelligence-v2", "task3a", "local-run");
}

function buildTask3AHistoricalArtifactRoot(repoRoot: string): string {
  return path.resolve(repoRoot, "artifacts", "prediction-intelligence-v2", "task3a", HISTORICAL_ARTIFACT_DATE);
}

function buildTask2_3ArtifactRoot(repoRoot: string, artifactDate: string): string {
  return path.resolve(repoRoot, "artifacts", "prediction-intelligence-v2", "task2-3", artifactDate);
}

export function assertTask3ALocalOnlyPreflight(paths: Task3APaths): void {
  if (!fs.existsSync(paths.preparedDir)) {
    throw new Error(`Prepared V2 workspace not found: ${paths.preparedDir}`);
  }

  const task2_3ArtifactRoot = buildTask2_3ArtifactRoot(paths.repoRoot, paths.task2_3ArtifactDate ?? DEFAULT_TASK2_3_ARTIFACT_DATE);
  if (!fs.existsSync(task2_3ArtifactRoot)) {
    throw new Error(`Task 2.3 artifact directory not found: ${task2_3ArtifactRoot}`);
  }

  const resolvedArtifactsDir = path.resolve(paths.artifactsDir);
  const preservedHistoricalRoot = buildTask3AHistoricalArtifactRoot(paths.repoRoot);
  if (
    isPathWithinResolvedRoot({
      candidatePath: resolvedArtifactsDir,
      rootPath: preservedHistoricalRoot,
      allowSamePath: true,
    })
  ) {
    throw new Error(
      `Task 3A local run refused because artifactsDir points at the preserved historical evidence path (${HISTORICAL_ARTIFACT_DATE}).`,
    );
  }

  const allowedLocalRunRoot = buildTask3ALocalRunRoot(paths.repoRoot);
  if (
    !isPathWithinResolvedRoot({
      candidatePath: resolvedArtifactsDir,
      rootPath: allowedLocalRunRoot,
      allowSamePath: false,
    })
  ) {
    throw new Error(`Task 3A local run refused because artifactsDir must resolve inside ${allowedLocalRunRoot}${path.sep}.`);
  }

  if (fs.existsSync(resolvedArtifactsDir)) {
    const stat = fs.statSync(resolvedArtifactsDir);
    if (!stat.isDirectory()) {
      throw new Error(`Task 3A local run refused because artifactsDir must be a directory: ${resolvedArtifactsDir}`);
    }

    if (fs.readdirSync(resolvedArtifactsDir).length > 0) {
      throw new Error(`Task 3A local run refused because artifactsDir already exists and is not empty: ${resolvedArtifactsDir}`);
    }
  }
}

export function resolveTask3ALocalPlannerGuard(args: {
  artifactsDir: string;
  targetLabel?: string;
}): Task3AEnvironmentGuard {
  return {
    executionMode: "local_only_planner",
    targetLabel: args.targetLabel ?? "local_prepared_workspace",
    artifactsDir: path.resolve(args.artifactsDir),
    writeIntent: "dry_run_only",
    localInputsOnly: true,
    credentialsRequired: false,
    networkAccessRequired: false,
    productionExecutionAuthorized: false,
    stageExecutionAuthorized: false,
    remoteExecutionAuthorized: false,
    migrationExecutionAuthorized: false,
    importExecutionAuthorized: false,
    signalPersistenceAuthorized: false,
    publicationAuthorized: false,
    partnerDeliveryAuthorized: false,
    historicalCommandEvidenceInert: true,
    historicalArtifactsAuthoritativeRuntimeConfig: false,
    safeguards: [
      "planner consumes only committed local Task 1 data and local Task 2.3 artifacts",
      "all migration, import, persistence, publication, and partner delivery actions remain denied",
      "stage and production execution remain unauthorized",
      "historical command evidence is preserved as inert text only",
    ],
  };
}

function buildTask3AMigrationPlanner(): Task3AMigrationPlanner {
  return {
    migrationFile: "supabase/migrations/0038_prediction_intelligence_v2_data_foundation.sql",
    executionStatus: PLANNER_EXECUTION_STATUS,
    orderedPlan: [
      "review migration ordering against current committed schema history",
      "validate idempotent reference imports against a safe local rehearsal only",
      "review release evidence before any future owner-approved execution workflow",
    ],
    blockers: [
      "remote execution is structurally disabled in Task 3A",
      "stage execution is unauthorized",
      "production execution is unauthorized",
    ],
  };
}

function buildTask3AImportPlanner(args: { importPlan: ImportPlan; datasets: ReturnType<typeof loadTask1Datasets> }): Task3AImportPlanner {
  const tables: Task3ASourceTablePlan[] = [
    {
      table: "source_snapshots",
      rowCount: args.importPlan.sourceAccess.length,
      idempotencyStrategy: "upsert by snapshot_id and payload hash",
      uniqueKey: "snapshot_id",
      status: "planned",
    },
    {
      table: "canonical_team_aliases",
      rowCount: args.datasets.aliases.length,
      idempotencyStrategy: "upsert by alias_normalized and source_scope",
      uniqueKey: "(alias_normalized, source_scope)",
      status: "planned",
    },
    {
      table: "canonical_team_localizations",
      rowCount: args.datasets.localizations.length * 2,
      idempotencyStrategy: "upsert by canonical_team_key and locale",
      uniqueKey: "(canonical_team_key, locale)",
      status: "planned",
    },
    {
      table: "canonical_team_links",
      rowCount: args.importPlan.productTeamLinks.length,
      idempotencyStrategy: "upsert by canonical_team_key",
      uniqueKey: "canonical_team_key",
      status: "planned",
    },
    {
      table: "team_rating_snapshots",
      rowCount: args.datasets.eloCurrent.length + args.datasets.eloStart2026.length + args.datasets.fifaRanking.length,
      idempotencyStrategy: "upsert by source_key, effective_at, canonical_team_key",
      uniqueKey: "(source_key, effective_at, canonical_team_key)",
      status: "planned",
    },
    {
      table: "historical_match_facts",
      rowCount: args.datasets.historicalFacts.length,
      idempotencyStrategy: "upsert by source_snapshot_id and natural_match_key",
      uniqueKey: "(source_snapshot_id, natural_match_key)",
      status: "planned",
    },
    {
      table: "official_schedule_matches",
      rowCount: args.datasets.schedule.length,
      idempotencyStrategy: "upsert by tournament_key and official_match_number",
      uniqueKey: "(tournament_key, official_match_number)",
      status: "planned",
    },
    {
      table: "official_schedule_match_links",
      rowCount: args.datasets.schedule.length,
      idempotencyStrategy: "prepare idempotent linkage candidates for future owner-reviewed execution only",
      uniqueKey: "official_schedule_match_id",
      status: "planner_only",
    },
    {
      table: "signal_snapshots",
      rowCount: 0,
      idempotencyStrategy: "planned separately from the current-cutoff signal persistence plan",
      uniqueKey: "(signal_version, cutoff_at, canonical_team_key)",
      status: "planner_only",
    },
  ];

  return {
    sourceDiscoverySummary: args.importPlan.counts,
    tables,
    unresolvedAliases: args.importPlan.unresolvedAliases.length,
    affectedTeams: args.importPlan.affectedTeams,
    executionStatus: PLANNER_EXECUTION_STATUS,
  };
}

function mapReleaseDecision(probabilityEngine: Task3AReleaseDecisionInput["probabilityEngine"]): Task3AReleaseCandidateDecision {
  return probabilityEngine === "release_gated_v2" ? "gated_v2_probability_v2_analysis" : "v1_probability_v2_analysis";
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))).sort();
}

function buildCurrentCutoffReleaseReview(args: {
  generationCutoff: string;
  futureComparisons: Task3AComparisonEntry[];
  chosenReleaseFixtures: Task3AReleaseCandidateFixture[];
  releaseDecision: Task3AReleaseDecisionInput;
}): Task3AReleaseReview {
  const futureFixtureIds = uniqueSorted(args.futureComparisons.map((entry) => entry.fixtureId));
  const chosenFixtureIds = new Set(args.chosenReleaseFixtures.map((entry) => entry.fixtureId));
  const affectedTeamsRequiringSignalRecomputation = uniqueSorted(
    args.chosenReleaseFixtures.flatMap((fixture) => [fixture.teams.home.canonicalKey, fixture.teams.away.canonicalKey]),
  );

  return {
    generationCutoff: args.generationCutoff,
    releaseDecisionSource: "task2_3_local_artifacts",
    liveResultRefreshAvailable: false,
    newlyCompletedFixtures: [],
    scoreOrStatusCorrections: [],
    missingOrConflictingStatuses: [],
    futureFixtureIds,
    futureFixtureCount: futureFixtureIds.length,
    releaseCandidateDecision: mapReleaseDecision(args.releaseDecision.probabilityEngine),
    releaseCandidateFixtureCount: args.chosenReleaseFixtures.length,
    fixturesExcludedSinceTask2_3: futureFixtureIds.filter((fixtureId) => !chosenFixtureIds.has(fixtureId)),
    affectedTeamsRequiringSignalRecomputation,
    fixturesRequiringHumanReview: [...args.releaseDecision.fixturesRequiringHumanReview],
    rationale: [...args.releaseDecision.rationale],
    executionStatus: PLANNER_EXECUTION_STATUS,
  };
}

function buildSignalRows(generationCutoff: string, persistenceTeamKeys: string[], datasets: ReturnType<typeof loadTask1Datasets>) {
  return buildSignalSnapshots(
    generationCutoff,
    persistenceTeamKeys,
    datasets.historicalFacts,
    datasets.localizations,
    datasets.aliases,
    datasets.eloCurrent,
    datasets.eloStart2026,
    datasets.fifaRanking,
    datasets.schedule,
  ).map((snapshot: TeamSignalSnapshot) => ({
    canonicalTeamKey: snapshot.canonical_team_key,
    signalVersion: snapshot.signal_version,
    cutoffAt: snapshot.cutoff_at,
    sourceSnapshotIds: snapshot.source_snapshot_ids,
    idempotencyKey: `${snapshot.signal_version}:${snapshot.cutoff_at}:${snapshot.canonical_team_key}`,
  }));
}

function buildTask3ASignalPersistencePlan(args: {
  generationCutoff: string;
  releaseReview: Task3AReleaseReview;
  datasets: ReturnType<typeof loadTask1Datasets>;
}): Task3ASignalPersistencePlan {
  const futureReleaseTeamKeys = uniqueSorted(
    args.releaseReview.affectedTeamsRequiringSignalRecomputation,
  );
  const persistenceTeamKeys = uniqueSorted([
    ...args.releaseReview.affectedTeamsRequiringSignalRecomputation,
    ...futureReleaseTeamKeys,
  ]);

  return {
    generationCutoff: args.generationCutoff,
    recomputeTeamKeys: args.releaseReview.affectedTeamsRequiringSignalRecomputation,
    futureReleaseTeamKeys,
    persistenceTeamKeys,
    plannedSignalRows: buildSignalRows(args.generationCutoff, persistenceTeamKeys, args.datasets),
    executionStatus: PLANNER_EXECUTION_STATUS,
  };
}

function buildTask3AImmutablePublicationPlan(args: {
  releaseReview: Task3AReleaseReview;
  chosenReleaseFixtures: Task3AReleaseCandidateFixture[];
}): Task3AImmutablePublicationPlan {
  return {
    candidateIdentifier: args.releaseReview.releaseCandidateDecision,
    executionStatus: PLANNER_EXECUTION_STATUS,
    fixtures: args.chosenReleaseFixtures.map((fixture) => ({
      fixtureId: fixture.fixtureId,
      currentPredictionVersionId: fixture.currentPredictionVersionId,
      immutableVersionKey: `${fixture.fixtureId}:${args.releaseReview.releaseCandidateDecision}:${fixture.sourceCutoff}`,
      createNewImmutableVersion: true,
      preserveOriginalVersion: true,
      sourceCutoff: fixture.sourceCutoff,
      status: PLANNER_EXECUTION_STATUS,
    })),
  };
}

function toProbabilityPair(args: { yes: number; no: number }) {
  return {
    yesProbability: args.yes,
    noProbability: args.no,
  };
}

function toGoals25Pair(args: { over: number; under: number }) {
  return {
    overProbability: args.over,
    underProbability: args.under,
  };
}

function resolveAppOrigin(appOrigin?: string): string {
  if (!appOrigin) {
    return DEFAULT_APP_ORIGIN;
  }

  return new URL(appOrigin).origin;
}

function buildTask3ATorneoExport(args: {
  generationCutoff: string;
  appOrigin?: string;
  chosenReleaseFixtures: Task3AReleaseCandidateFixture[];
  comparisonByFixtureId: Map<string, Task3AComparisonEntry>;
  releaseReview: Task3AReleaseReview;
}): Task3ATorneoExportPlan {
  const fixtures = args.chosenReleaseFixtures.map((fixture) => {
    const comparison = args.comparisonByFixtureId.get(fixture.fixtureId);
    const chosenState =
      args.releaseReview.releaseCandidateDecision === "gated_v2_probability_v2_analysis"
        ? comparison?.gatedV2
        : comparison?.regeneratedCurrentV1;

    return {
      externalId: fixture.fixtureId,
      fixtureId: fixture.fixtureId,
      slug: fixture.matchSlug,
      ufoUrl: `${resolveAppOrigin(args.appOrigin)}/matches/${fixture.matchSlug}`,
      kickoffAt: fixture.kickoffAt,
      stage: "group_stage",
      status: "scheduled",
      homeTeam: fixture.teams.home.nameEn,
      awayTeam: fixture.teams.away.nameEn,
      prediction: {
        homeWinProbability: fixture.probabilities.homeWin,
        drawProbability: fixture.probabilities.draw,
        awayWinProbability: fixture.probabilities.awayWin,
        confidenceScore: null,
        riskLevel: null,
        mostLikelyScore: chosenState?.mostLikelyScore ?? "unavailable",
        expectedGoals: {
          home: fixture.expectedGoals.home,
          away: fixture.expectedGoals.away,
        },
        topScorelines: chosenState?.prediction.topScorelines.slice(0, 5) ?? [],
        bothTeamsToScore: toProbabilityPair(chosenState?.prediction.probabilities.btts ?? { yes: 0, no: 0 }),
        totalGoals25: toGoals25Pair(chosenState?.prediction.probabilities.overUnder25 ?? { over: 0, under: 0 }),
      },
    } satisfies Task3ATorneoExportFixture;
  });

  const dateOnly = args.generationCutoff.slice(0, 10);
  return {
    schemaVersion: "torneo-ufo-export-v1",
    executionStatus: PLANNER_EXECUTION_STATUS,
    payload: {
      schemaVersion: "torneo-ufo-export-v1",
      generatedAt: args.generationCutoff,
      source: "ufo_predictor",
      sourceAppUrl: resolveAppOrigin(args.appOrigin),
      competition: "world-cup-2026",
      range: { from: dateOnly, to: dateOnly },
      displayGuidance: {
        defaultTeaser: "show_1x2_probabilities_and_link",
        exactScoreRecommendedReveal: "after_user_pick_or_pick_deadline",
        topScorelinesRecommendedReveal: "after_user_pick_or_pick_deadline",
        postMatchUse: "comparison_and_learning",
      },
      fixtures,
    },
  };
}

function loadTask2_3Artifacts(artifactBase: string) {
  return {
    futureThreeStateComparison: readJsonFile<Task3AComparisonEntry[]>(path.join(artifactBase, "future-three-state-comparison.json")),
    releaseDecision: readJsonFile<Task3AReleaseDecisionInput>(path.join(artifactBase, "release-decision.json")),
    safeAnalysisCandidates: readJsonFile<Task3AReleaseCandidateFixture[]>(
      path.join(artifactBase, "safe-analysis-release-candidate.json"),
    ),
    gatedCandidates: readJsonFile<Task3AReleaseCandidateFixture[]>(path.join(artifactBase, "gated-v2-release-candidate.json")),
  };
}

function buildTask3ADatabaseTargetStatus() {
  return {
    migrationExecution: PLANNER_EXECUTION_STATUS,
    importExecution: PLANNER_EXECUTION_STATUS,
    signalPersistenceExecution: PLANNER_EXECUTION_STATUS,
    publicationExecution: PLANNER_EXECUTION_STATUS,
    stageExecution: PLANNER_EXECUTION_STATUS,
    productionExecution: PLANNER_EXECUTION_STATUS,
  };
}

function buildInertCommandText(): string {
  return [
    "planner_only=true",
    "historical_command_text_is_inert=true",
    "execution_requires_separate_owner_approved_workflow=true",
    "no_command_is_executed_by_task3a_runner=true",
  ].join("\n");
}

function buildReadme(args: {
  artifactDate: string;
  generationCutoff: string;
  futureFixtureCount: number;
  chosenCandidate: Task3AReleaseCandidateDecision;
}): string {
  return [
    "Prediction Intelligence v2 Task 3A local-only planner artifacts",
    `artifact_date=${args.artifactDate}`,
    `generation_cutoff=${args.generationCutoff}`,
    "execution_mode=planner_only",
    "remote_execution=denied",
    "stage_execution=unauthorized",
    "production_execution=unauthorized",
    "historical_preservation_mode=safe_approximation",
    `future_release_fixtures=${args.futureFixtureCount}`,
    `chosen_candidate=${args.chosenCandidate}`,
  ].join("\n");
}

function writeTask3AArtifacts(args: {
  artifactBase: string;
  guard: Task3AEnvironmentGuard;
  migrationPlanner: Task3AMigrationPlanner;
  importPlanner: Task3AImportPlanner;
  releaseReview: Task3AReleaseReview;
  signalPersistencePlan: Task3ASignalPersistencePlan;
  immutablePublicationPlan: Task3AImmutablePublicationPlan;
  torneoExportPlan: Task3ATorneoExportPlan;
  artifactDate: string;
  generationCutoff: string;
}): string[] {
  ensureDirectory(args.artifactBase);

  const files = [
    "README.txt",
    "current-cutoff-release-review.json",
    "database-target-status.json",
    "environment-guard.json",
    "future-safe-development-command.txt",
    "idempotent-import-plan.json",
    "immutable-publication-plan.json",
    "migration-planner.json",
    "signal-persistence-plan.json",
    "torneo-mundialista-export-dry-run.json",
  ];

  writeText(
    path.join(args.artifactBase, "README.txt"),
    buildReadme({
      artifactDate: args.artifactDate,
      generationCutoff: args.generationCutoff,
      futureFixtureCount: args.releaseReview.futureFixtureCount,
      chosenCandidate: args.releaseReview.releaseCandidateDecision,
    }),
  );
  writeJson(path.join(args.artifactBase, "environment-guard.json"), args.guard);
  writeJson(path.join(args.artifactBase, "migration-planner.json"), args.migrationPlanner);
  writeJson(path.join(args.artifactBase, "idempotent-import-plan.json"), args.importPlanner);
  writeJson(path.join(args.artifactBase, "current-cutoff-release-review.json"), args.releaseReview);
  writeJson(path.join(args.artifactBase, "signal-persistence-plan.json"), args.signalPersistencePlan);
  writeJson(path.join(args.artifactBase, "immutable-publication-plan.json"), args.immutablePublicationPlan);
  writeJson(path.join(args.artifactBase, "torneo-mundialista-export-dry-run.json"), args.torneoExportPlan);
  writeJson(path.join(args.artifactBase, "database-target-status.json"), buildTask3ADatabaseTargetStatus());
  writeText(path.join(args.artifactBase, "future-safe-development-command.txt"), buildInertCommandText());

  return files.map((fileName) => path.join(args.artifactBase, fileName));
}

export async function runTask3A(paths: Task3APaths): Promise<Task3AResult> {
  assertTask3ALocalOnlyPreflight(paths);

  const datasets = loadTask1Datasets(paths);
  const importPlan = buildInitialImportPlan(paths);
  const task2_3Artifacts = loadTask2_3Artifacts(
    buildTask2_3ArtifactRoot(paths.repoRoot, paths.task2_3ArtifactDate ?? DEFAULT_TASK2_3_ARTIFACT_DATE),
  );

  const chosenReleaseFixtures =
    task2_3Artifacts.releaseDecision.probabilityEngine === "release_gated_v2"
      ? task2_3Artifacts.gatedCandidates
      : task2_3Artifacts.safeAnalysisCandidates;

  const releaseReview = buildCurrentCutoffReleaseReview({
    generationCutoff: paths.generationCutoff,
    futureComparisons: task2_3Artifacts.futureThreeStateComparison,
    chosenReleaseFixtures,
    releaseDecision: task2_3Artifacts.releaseDecision,
  });
  const guard = resolveTask3ALocalPlannerGuard({
    artifactsDir: paths.artifactsDir,
    targetLabel: paths.plannerInput?.targetLabel,
  });
  const migrationPlanner = buildTask3AMigrationPlanner();
  const importPlanner = buildTask3AImportPlanner({
    importPlan,
    datasets,
  });
  const signalPersistencePlan = buildTask3ASignalPersistencePlan({
    generationCutoff: paths.generationCutoff,
    releaseReview,
    datasets,
  });
  const immutablePublicationPlan = buildTask3AImmutablePublicationPlan({
    releaseReview,
    chosenReleaseFixtures,
  });
  const torneoExportPlan = buildTask3ATorneoExport({
    generationCutoff: paths.generationCutoff,
    appOrigin: paths.plannerInput?.appOrigin,
    chosenReleaseFixtures,
    comparisonByFixtureId: new Map(task2_3Artifacts.futureThreeStateComparison.map((entry) => [entry.fixtureId, entry])),
    releaseReview,
  });
  const generatedArtifacts = writeTask3AArtifacts({
    artifactBase: paths.artifactsDir,
    guard,
    migrationPlanner,
    importPlanner,
    releaseReview,
    signalPersistencePlan,
    immutablePublicationPlan,
    torneoExportPlan,
    artifactDate: paths.artifactDate,
    generationCutoff: paths.generationCutoff,
  });

  return {
    guard,
    migrationPlanner,
    importPlanner,
    releaseReview,
    signalPersistencePlan,
    immutablePublicationPlan,
    torneoExportPlan,
    generatedArtifacts,
    safeApproximationUsed: true,
  };
}
