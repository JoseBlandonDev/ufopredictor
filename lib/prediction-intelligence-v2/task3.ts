import fs from "node:fs";
import path from "node:path";

import { fetchApiFootballFixturesByLeague } from "../football-api/api-football-client.ts";
import { buildPredictionIntelligenceV2ReplayInput, buildInitialImportPlan, buildSignalSnapshots, loadTask1Datasets, type ImportPlan, type PreparedPaths, type TeamSignalSnapshot } from "./task1.ts";
import { loadProductReplayInventory, reconcileFinishedFixtures } from "./task1-1.ts";
import { selectNotStartedFixtures } from "./task2.ts";
import type { TorneoUfoExport } from "../supabase/torneo-export-core.ts";

type Task3ADatabaseExecutionStatus =
  | "not_executed_no_safe_target"
  | "pending_safe_development_target"
  | "ready_for_proven_development_target";

type Task3ATargetKind = "missing" | "local" | "hosted_unproven" | "hosted_confirmed_dev";
type Task3AWriteIntent = "dry_run" | "write_requested";

type Task3AEnvironmentGuard = {
  writeIntent: Task3AWriteIntent;
  targetKind: Task3ATargetKind;
  supabaseUrlHost: string | null;
  appUrlHost: string | null;
  serviceRolePresent: boolean;
  anonKeyPresent: boolean;
  apiFootballConfigured: boolean;
  writesAllowed: boolean;
  productionWritesImpossible: boolean;
  safeguards: string[];
};

type Task3AMigrationPlanner = {
  migrationFile: string;
  migrationExecution: Task3ADatabaseExecutionStatus;
  developmentSeedWrite: Task3ADatabaseExecutionStatus;
  physicalDatabaseValidation: Task3ADatabaseExecutionStatus;
  localSupabaseConfigured: boolean;
  localSupabaseRunnable: boolean;
  safeWriteTargetAvailable: boolean;
  commands: {
    startLocalSupabase: string;
    checkMigrationStatus: string;
    applyMigrationLocally: string;
    runTask3ADryRun: string;
    runTask3AWriteModeAgainstProvenDevelopmentTarget: string;
  };
};

type Task3ASourceTablePlan = {
  table: string;
  rowCount: number;
  idempotencyStrategy: string;
  uniqueKey: string;
  status: "planned" | "planner_only_requires_safe_target_reads";
};

type Task3AImportPlanner = {
  sourceDiscoverySummary: ImportPlan["counts"];
  tables: Task3ASourceTablePlan[];
  unresolvedAliases: number;
  affectedTeams: string[];
};

type Task3AReleaseReview = {
  generationCutoff: string;
  newlyCompletedFixtures: Array<{
    providerFixtureId: number;
    fixture: string;
    scoreline: string;
    officialMatchNumber: number | null;
  }>;
  scoreOrStatusCorrections: Array<{
    providerFixtureId: number;
    fixture: string;
    scoreline: string;
    officialMatchNumber: number | null;
  }>;
  missingOrConflictingStatuses: Array<{
    matchId: string;
    slug: string;
    productStatus: string;
    providerStatus: string | null;
    providerShortStatus: string | null;
  }>;
  futureFixtureIds: string[];
  futureFixtureCount: number;
  releaseCandidateDecision: "gated_v2_probability_v2_analysis" | "v1_probability_v2_analysis";
  releaseCandidateFixtureCount: number;
  fixturesExcludedSinceTask2_3: string[];
  affectedTeamsRequiringSignalRecomputation: string[];
};

type Task3ASignalPersistencePlan = {
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
};

type Task3AImmutablePublicationPlan = {
  candidateIdentifier: "gated_v2_probability_v2_analysis" | "v1_probability_v2_analysis";
  publicationExecution: Task3ADatabaseExecutionStatus;
  fixtures: Array<{
    fixtureId: string;
    currentPredictionVersionId: string | null;
    immutableVersionKey: string;
    createNewImmutableVersion: true;
    preserveOriginalVersion: true;
    sourceCutoff: string;
    status: Task3ADatabaseExecutionStatus;
  }>;
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

type Task3AComparisonEntry = {
  fixtureId: string;
  matchSlug: string;
  officialMatchNumber: number | null;
  fixture: string;
  kickoffAt: string;
  regeneratedCurrentV1: Task3AComparisonState;
  gatedV2: Task3AComparisonState;
  features: {
    homeTeamKey: string;
    awayTeamKey: string;
  };
};

type Task3AReleaseCandidateFixture = {
  fixtureId: string;
  matchSlug: string;
  officialMatchNumber: number | null;
  kickoffAt: string;
  currentPredictionVersionId: string | null;
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
};

type Task3ATorneoExportFixture = TorneoUfoExport["fixtures"][number];

type Task3ATorneoExportPlan = {
  schemaVersion: TorneoUfoExport["schemaVersion"];
  exportExecution: Task3ADatabaseExecutionStatus;
  payload: TorneoUfoExport;
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

function readTextIfExists(filePath: string): string | null {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
}

function parseEnvFile(filePath: string) {
  const values = new Map<string, string>();
  const content = readTextIfExists(filePath);
  if (!content) {
    return values;
  }
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    values.set(trimmed.slice(0, separatorIndex).trim(), trimmed.slice(separatorIndex + 1).trim());
  }
  return values;
}

export function parseSupabaseSeedPaths(configToml: string) {
  const match = /^\s*sql_paths\s*=\s*\[(.+?)\]\s*$/m.exec(configToml);
  if (!match) {
    return [] as string[];
  }

  return match[1]
    .split(",")
    .map((entry) => entry.trim().replace(/^"|"$/g, ""))
    .filter((entry) => entry.length > 0);
}

export function resolveTask3AEnvironmentGuard(args: {
  env: NodeJS.ProcessEnv;
  envExampleValues: Map<string, string>;
  writeRequested: boolean;
}) {
  const supabaseUrl = args.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const appUrl = args.env.NEXT_PUBLIC_APP_URL ?? null;
  const confirmedSafeHost = args.env.PREDICTION_INTELLIGENCE_V2_CONFIRMED_SAFE_SUPABASE_HOST ?? null;
  const explicitTargetEnv = args.env.PREDICTION_INTELLIGENCE_V2_TARGET_ENV ?? null;
  const writesEnabled = args.env.PREDICTION_INTELLIGENCE_V2_ENABLE_WRITES === "true";

  const parseHost = (value: string | null) => {
    if (!value) {
      return null;
    }
    try {
      return new URL(value).host;
    } catch {
      return null;
    }
  };

  const supabaseUrlHost = parseHost(supabaseUrl);
  const appUrlHost = parseHost(appUrl);
  const localHosts = new Set(["127.0.0.1:54321", "localhost:54321", "127.0.0.1", "localhost"]);

  let targetKind: Task3ATargetKind = "missing";
  if (supabaseUrlHost && localHosts.has(supabaseUrlHost)) {
    targetKind = "local";
  } else if (
    supabaseUrlHost &&
    confirmedSafeHost != null &&
    confirmedSafeHost === supabaseUrlHost &&
    explicitTargetEnv === "development"
  ) {
    targetKind = "hosted_confirmed_dev";
  } else if (supabaseUrlHost) {
    targetKind = "hosted_unproven";
  }

  const serviceRolePresent = Boolean(args.env.SUPABASE_SERVICE_ROLE_KEY);
  const anonKeyPresent = Boolean(args.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const apiFootballConfigured = Boolean(args.env.API_FOOTBALL_KEY);
  const writesAllowed =
    args.writeRequested &&
    writesEnabled &&
    serviceRolePresent &&
    (targetKind === "local" || targetKind === "hosted_confirmed_dev");

  const safeguards = [
    "write mode requires PREDICTION_INTELLIGENCE_V2_ENABLE_WRITES=true",
    "write mode requires SUPABASE_SERVICE_ROLE_KEY",
    "hosted Supabase writes require PREDICTION_INTELLIGENCE_V2_TARGET_ENV=development",
    "hosted Supabase writes require PREDICTION_INTELLIGENCE_V2_CONFIRMED_SAFE_SUPABASE_HOST to exactly match NEXT_PUBLIC_SUPABASE_URL host",
    "unproven hosted Supabase targets are always forced to dry-run",
    "physical migration, seed, and publication execution remain blocked without a proven safe development target",
  ];

  return {
    writeIntent: args.writeRequested ? "write_requested" : "dry_run",
    targetKind,
    supabaseUrlHost,
    appUrlHost,
    serviceRolePresent,
    anonKeyPresent,
    apiFootballConfigured,
    writesAllowed,
    productionWritesImpossible: !writesAllowed,
    safeguards,
    templateAppUrl: args.envExampleValues.get("NEXT_PUBLIC_APP_URL") ?? null,
  } satisfies Task3AEnvironmentGuard & { templateAppUrl: string | null };
}

function buildTask3AMigrationPlanner(args: {
  localConfigExists: boolean;
  supabaseCliAvailable: boolean;
  dockerAvailable: boolean;
  guard: Task3AEnvironmentGuard;
}) {
  const safeWriteTargetAvailable = args.guard.writesAllowed;
  return {
    migrationFile: "supabase/migrations/0038_prediction_intelligence_v2_data_foundation.sql",
    migrationExecution: safeWriteTargetAvailable ? "ready_for_proven_development_target" : "not_executed_no_safe_target",
    developmentSeedWrite: safeWriteTargetAvailable ? "ready_for_proven_development_target" : "not_executed_no_safe_target",
    physicalDatabaseValidation: safeWriteTargetAvailable
      ? "ready_for_proven_development_target"
      : "pending_safe_development_target",
    localSupabaseConfigured: args.localConfigExists,
    localSupabaseRunnable: args.localConfigExists && args.supabaseCliAvailable && args.dockerAvailable,
    safeWriteTargetAvailable,
    commands: {
      startLocalSupabase: "npx supabase start",
      checkMigrationStatus: "npx supabase migration list --local",
      applyMigrationLocally: "npx supabase db reset",
      runTask3ADryRun: "npm run prediction-intelligence-v2:task3a",
      runTask3AWriteModeAgainstProvenDevelopmentTarget:
        "$env:PREDICTION_INTELLIGENCE_V2_ENABLE_WRITES='true'; $env:PREDICTION_INTELLIGENCE_V2_TARGET_ENV='development'; $env:PREDICTION_INTELLIGENCE_V2_CONFIRMED_SAFE_SUPABASE_HOST='<confirmed-dev-host>'; npm run prediction-intelligence-v2:task3a -- --write",
    },
  } satisfies Task3AMigrationPlanner;
}

function buildTask3AImportPlanner(args: { importPlan: ImportPlan; datasets: ReturnType<typeof loadTask1Datasets> }) {
  const tables: Task3ASourceTablePlan[] = [
    {
      table: "source_snapshots",
      rowCount: args.importPlan.sourceAccess.length,
      idempotencyStrategy: "upsert by (source_key, payload_hash) and unique snapshot_id",
      uniqueKey: "snapshot_id",
      status: "planned",
    },
    {
      table: "canonical_team_aliases",
      rowCount: args.datasets.aliases.length,
      idempotencyStrategy: "upsert by (alias_normalized, source_scope)",
      uniqueKey: "(alias_normalized, source_scope)",
      status: "planned",
    },
    {
      table: "canonical_team_localizations",
      rowCount: args.datasets.localizations.length * 2,
      idempotencyStrategy: "upsert by (canonical_team_key, locale)",
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
      idempotencyStrategy: "upsert by (source_key, effective_at, canonical_team_key)",
      uniqueKey: "(source_key, effective_at, canonical_team_key)",
      status: "planned",
    },
    {
      table: "historical_match_facts",
      rowCount: args.datasets.historicalFacts.length,
      idempotencyStrategy: "upsert by (source_snapshot_id, natural_match_key)",
      uniqueKey: "(source_snapshot_id, natural_match_key)",
      status: "planned",
    },
    {
      table: "historical_match_fact_links",
      rowCount: args.datasets.historicalFacts.length,
      idempotencyStrategy: "planner-only candidate links until safe target match_id reads are available",
      uniqueKey: "historical_match_fact_id",
      status: "planner_only_requires_safe_target_reads",
    },
    {
      table: "schedule_snapshots",
      rowCount: 1,
      idempotencyStrategy: "upsert by snapshot_id",
      uniqueKey: "snapshot_id",
      status: "planned",
    },
    {
      table: "world_cup_venue_catalog",
      rowCount: args.datasets.venues.length,
      idempotencyStrategy: "upsert by venue_key",
      uniqueKey: "venue_key",
      status: "planned",
    },
    {
      table: "official_schedule_matches",
      rowCount: args.datasets.schedule.length,
      idempotencyStrategy: "upsert by (tournament_key, official_match_number)",
      uniqueKey: "(tournament_key, official_match_number)",
      status: "planned",
    },
    {
      table: "official_schedule_match_links",
      rowCount: args.datasets.schedule.length,
      idempotencyStrategy: "planner-only links until safe target match inventory is approved for write mode",
      uniqueKey: "official_schedule_match_id",
      status: "planner_only_requires_safe_target_reads",
    },
    {
      table: "signal_snapshots",
      rowCount: 0,
      idempotencyStrategy: "planned separately from current-cutoff signal persistence planner",
      uniqueKey: "(signal_version, cutoff_at, canonical_team_key)",
      status: "planned",
    },
  ];

  return {
    sourceDiscoverySummary: args.importPlan.counts,
    tables,
    unresolvedAliases: args.importPlan.unresolvedAliases.length,
    affectedTeams: args.importPlan.affectedTeams,
  } satisfies Task3AImportPlanner;
}

function buildCurrentCutoffReleaseReview(args: {
  generationCutoff: string;
  refreshPlan: ReturnType<typeof reconcileFinishedFixtures>;
  operationalState: ReturnType<typeof selectNotStartedFixtures>;
  comparisonEntries: Task3AComparisonEntry[];
  releaseDecision: { probabilityEngine: "release_gated_v2" | "retain_current_v1" };
}) {
  const newlyCompletedFixtures = args.refreshPlan.newly_discovered_results.map((row) => ({
    providerFixtureId: row.provider_fixture_id,
    fixture: `${row.canonical_home_team_key} vs ${row.canonical_away_team_key}`,
    scoreline:
      row.provider_score.home != null && row.provider_score.away != null
        ? `${row.provider_score.home}-${row.provider_score.away}`
        : "unknown",
    officialMatchNumber: row.official_match_number,
  }));
  const scoreOrStatusCorrections = args.refreshPlan.score_or_status_corrections.map((row) => ({
    providerFixtureId: row.provider_fixture_id,
    fixture: `${row.canonical_home_team_key} vs ${row.canonical_away_team_key}`,
    scoreline:
      row.provider_score.home != null && row.provider_score.away != null
        ? `${row.provider_score.home}-${row.provider_score.away}`
        : "unknown",
    officialMatchNumber: row.official_match_number,
  }));
  const futureFixtureIds = args.operationalState.remaining.map((match) => match.id);
  const fixturesExcludedSinceTask2_3 = args.comparisonEntries
    .map((entry) => entry.fixtureId)
    .filter((fixtureId) => !futureFixtureIds.includes(fixtureId));
  const affectedTeamsRequiringSignalRecomputation = Array.from(
    new Set(
      [...args.refreshPlan.newly_discovered_results, ...args.refreshPlan.score_or_status_corrections].flatMap((row) => [
        row.canonical_home_team_key,
        row.canonical_away_team_key,
      ]),
    ),
  )
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort();

  return {
    generationCutoff: args.generationCutoff,
    newlyCompletedFixtures,
    scoreOrStatusCorrections,
    missingOrConflictingStatuses: args.operationalState.missingOrConflictingStatuses,
    futureFixtureIds,
    futureFixtureCount: futureFixtureIds.length,
    releaseCandidateDecision:
      args.releaseDecision.probabilityEngine === "release_gated_v2"
        ? "gated_v2_probability_v2_analysis"
        : "v1_probability_v2_analysis",
    releaseCandidateFixtureCount: futureFixtureIds.length,
    fixturesExcludedSinceTask2_3,
    affectedTeamsRequiringSignalRecomputation,
  } satisfies Task3AReleaseReview;
}

function buildTask3ASignalPersistencePlan(args: {
  repoRoot: string;
  generationCutoff: string;
  releaseReview: Task3AReleaseReview;
  comparisonEntries: Task3AComparisonEntry[];
  datasets: ReturnType<typeof loadTask1Datasets>;
}) {
  const futureReleaseTeamKeys = Array.from(
    new Set(
      args.comparisonEntries
        .filter((entry) => args.releaseReview.futureFixtureIds.includes(entry.fixtureId))
        .flatMap((entry) => [entry.features.homeTeamKey, entry.features.awayTeamKey]),
    ),
  ).sort();
  const persistenceTeamKeys = Array.from(
    new Set([...args.releaseReview.affectedTeamsRequiringSignalRecomputation, ...futureReleaseTeamKeys]),
  ).sort();
  const plannedSignalRows = buildSignalSnapshots(
    args.generationCutoff,
    persistenceTeamKeys,
    args.datasets.historicalFacts,
    args.datasets.localizations,
    args.datasets.aliases,
    args.datasets.eloCurrent,
    args.datasets.eloStart2026,
    args.datasets.fifaRanking,
    args.datasets.schedule,
  ).map((snapshot) => ({
    canonicalTeamKey: snapshot.canonical_team_key,
    signalVersion: snapshot.signal_version,
    cutoffAt: snapshot.cutoff_at,
    sourceSnapshotIds: snapshot.source_snapshot_ids,
    idempotencyKey: `${snapshot.signal_version}:${snapshot.cutoff_at}:${snapshot.canonical_team_key}`,
  }));

  return {
    generationCutoff: args.generationCutoff,
    recomputeTeamKeys: args.releaseReview.affectedTeamsRequiringSignalRecomputation,
    futureReleaseTeamKeys,
    persistenceTeamKeys,
    plannedSignalRows,
  } satisfies Task3ASignalPersistencePlan;
}

function buildTask3AImmutablePublicationPlan(args: {
  releaseReview: Task3AReleaseReview;
  releaseCandidateFixtures: Task3AReleaseCandidateFixture[];
}) {
  return {
    candidateIdentifier: args.releaseReview.releaseCandidateDecision,
    publicationExecution: "not_executed_no_safe_target",
    fixtures: args.releaseCandidateFixtures.map((fixture) => ({
      fixtureId: fixture.fixtureId,
      currentPredictionVersionId: fixture.currentPredictionVersionId,
      immutableVersionKey: `${fixture.fixtureId}:${args.releaseReview.releaseCandidateDecision}:${fixture.sourceCutoff}`,
      createNewImmutableVersion: true,
      preserveOriginalVersion: true,
      sourceCutoff: fixture.sourceCutoff,
      status: "not_executed_no_safe_target",
    })),
  } satisfies Task3AImmutablePublicationPlan;
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

function buildTask3ATorneoExport(args: {
  generationCutoff: string;
  appOrigin: string;
  comparisonEntries: Task3AComparisonEntry[];
  releaseReview: Task3AReleaseReview;
  matchesById: Map<string, { external_id: string | null; slug: string; kickoff_at: string; stage: string | null; status: string }>;
}) {
  const fixtures: Task3ATorneoExportFixture[] = args.comparisonEntries
    .filter((entry) => args.releaseReview.futureFixtureIds.includes(entry.fixtureId))
    .map((entry) => {
      const match = args.matchesById.get(entry.fixtureId);
      const chosenState =
        args.releaseReview.releaseCandidateDecision === "gated_v2_probability_v2_analysis"
          ? entry.gatedV2
          : entry.regeneratedCurrentV1;
      const fixtureIdMatch = match?.external_id ? /^api-football:fixture:(\d+)$/.exec(match.external_id) : null;
      return {
        externalId: match?.external_id ?? entry.fixtureId,
        fixtureId: fixtureIdMatch ? Number(fixtureIdMatch[1]) : null,
        slug: match?.slug ?? entry.matchSlug,
        ufoUrl: `${args.appOrigin}/matches/${match?.slug ?? entry.matchSlug}`,
        kickoffAt: match?.kickoff_at ?? entry.kickoffAt,
        stage: match?.stage ?? "group_stage",
        status: match?.status ?? "scheduled",
        homeTeam: entry.fixture.split(" vs ")[0] ?? entry.fixture,
        awayTeam: entry.fixture.split(" vs ")[1] ?? entry.fixture,
        prediction: {
          homeWinProbability: chosenState.probabilities.homeWin,
          drawProbability: chosenState.probabilities.draw,
          awayWinProbability: chosenState.probabilities.awayWin,
          confidenceScore: null,
          riskLevel: null,
          mostLikelyScore: chosenState.mostLikelyScore,
          expectedGoals: {
            home: chosenState.expectedGoals.home,
            away: chosenState.expectedGoals.away,
          },
          topScorelines: chosenState.prediction.topScorelines.slice(0, 5),
          bothTeamsToScore: toProbabilityPair(chosenState.prediction.probabilities.btts),
          totalGoals25: toGoals25Pair(chosenState.prediction.probabilities.overUnder25),
        },
      } satisfies Task3ATorneoExportFixture;
    });

  const dateOnly = args.generationCutoff.slice(0, 10);
  return {
    schemaVersion: "torneo-ufo-export-v1",
    exportExecution: "not_executed_no_safe_target",
    payload: {
      schemaVersion: "torneo-ufo-export-v1",
      generatedAt: args.generationCutoff,
      source: "ufo_predictor",
      sourceAppUrl: args.appOrigin,
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
  } satisfies Task3ATorneoExportPlan;
}

function loadTask2_3Artifacts(artifactBase: string) {
  return {
    futureThreeStateComparison: readJsonFile<Task3AComparisonEntry[]>(path.join(artifactBase, "future-three-state-comparison.json")),
    releaseDecision: readJsonFile<{ probabilityEngine: "release_gated_v2" | "retain_current_v1" }>(
      path.join(artifactBase, "release-decision.json"),
    ),
    safeAnalysisCandidates: readJsonFile<Task3AReleaseCandidateFixture[]>(
      path.join(artifactBase, "safe-analysis-release-candidate.json"),
    ),
    gatedCandidates: readJsonFile<Task3AReleaseCandidateFixture[]>(
      path.join(artifactBase, "gated-v2-release-candidate.json"),
    ),
  };
}

export async function runTask3A(
  paths: PreparedPaths & { artifactDate: string; generationCutoff: string; task2_3ArtifactDate: string; writeRequested: boolean },
) {
  const envExampleValues = parseEnvFile(path.join(paths.repoRoot, ".env.example"));
  const guard = resolveTask3AEnvironmentGuard({
    env: process.env,
    envExampleValues,
    writeRequested: paths.writeRequested,
  });
  const localConfigExists = fs.existsSync(path.join(paths.repoRoot, "supabase", "config.toml"));
  const localConfigText = readTextIfExists(path.join(paths.repoRoot, "supabase", "config.toml")) ?? "";
  const localGitignoreText = readTextIfExists(path.join(paths.repoRoot, "supabase", ".gitignore")) ?? "";
  const configSeedPaths = parseSupabaseSeedPaths(localConfigText);
  const dockerAvailable = true;
  const supabaseCliAvailable = false;
  const migrationPlanner = buildTask3AMigrationPlanner({
    localConfigExists,
    supabaseCliAvailable,
    dockerAvailable,
    guard,
  });

  const datasets = loadTask1Datasets(paths);
  const importPlan = await buildInitialImportPlan(paths);
  const task2_3Artifacts = loadTask2_3Artifacts(
    path.join(paths.repoRoot, "artifacts", "prediction-intelligence-v2", "task2-3", paths.task2_3ArtifactDate),
  );

  const productInventory = await loadProductReplayInventory();
  const providerFixtures = await fetchApiFootballFixturesByLeague({
    leagueId: 1,
    season: 2026,
  });
  const refreshPlan = reconcileFinishedFixtures({
    providerFixtures,
    scheduleRows: datasets.schedule,
    historicalFacts: datasets.historicalFacts,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
    productInventory,
  });
  const operationalState = selectNotStartedFixtures({
    productInventory,
    providerFixtures,
    generationCutoff: paths.generationCutoff,
  });

  const releaseReview = buildCurrentCutoffReleaseReview({
    generationCutoff: paths.generationCutoff,
    refreshPlan,
    operationalState,
    comparisonEntries: task2_3Artifacts.futureThreeStateComparison,
    releaseDecision: task2_3Artifacts.releaseDecision,
  });
  const signalPersistencePlan = buildTask3ASignalPersistencePlan({
    repoRoot: paths.repoRoot,
    generationCutoff: paths.generationCutoff,
    releaseReview,
    comparisonEntries: task2_3Artifacts.futureThreeStateComparison,
    datasets,
  });
  const importPlanner = buildTask3AImportPlanner({
    importPlan,
    datasets,
  });
  const chosenReleaseFixtures =
    releaseReview.releaseCandidateDecision === "gated_v2_probability_v2_analysis"
      ? task2_3Artifacts.gatedCandidates
      : task2_3Artifacts.safeAnalysisCandidates;
  const filteredReleaseFixtures = chosenReleaseFixtures.filter((fixture) =>
    releaseReview.futureFixtureIds.includes(fixture.fixtureId),
  );
  const immutablePublicationPlan = buildTask3AImmutablePublicationPlan({
    releaseReview,
    releaseCandidateFixtures: filteredReleaseFixtures,
  });
  const appOrigin =
    guard.templateAppUrl && /^https?:\/\//.test(guard.templateAppUrl)
      ? new URL(guard.templateAppUrl).origin
      : "https://ufopredictor.com";
  const matchesById = new Map(
    productInventory.matches.map((match) => [
      match.id,
      {
        external_id: match.external_id,
        slug: match.slug,
        kickoff_at: match.kickoff_at,
        stage: match.stage,
        status: match.status,
      },
    ]),
  );
  const torneoExportPlan = buildTask3ATorneoExport({
    generationCutoff: paths.generationCutoff,
    appOrigin,
    comparisonEntries: task2_3Artifacts.futureThreeStateComparison,
    releaseReview,
    matchesById,
  });

  const artifactBase = paths.artifactsDir;
  ensureDirectory(artifactBase);
  writeJson(path.join(artifactBase, "environment-guard.json"), {
    ...guard,
    localSupabaseConfigPresent: localConfigExists,
    localSupabaseSeedPaths: configSeedPaths,
    localSupabaseGitignoreSafe: localGitignoreText.includes(".env.local"),
  });
  writeJson(path.join(artifactBase, "migration-planner.json"), migrationPlanner);
  writeJson(path.join(artifactBase, "idempotent-import-plan.json"), importPlanner);
  writeJson(path.join(artifactBase, "current-cutoff-release-review.json"), releaseReview);
  writeJson(path.join(artifactBase, "signal-persistence-plan.json"), signalPersistencePlan);
  writeJson(path.join(artifactBase, "immutable-publication-plan.json"), immutablePublicationPlan);
  writeJson(path.join(artifactBase, "torneo-mundialista-export-dry-run.json"), torneoExportPlan);
  writeJson(path.join(artifactBase, "database-target-status.json"), {
    migrationExecution: "not_executed_no_safe_target",
    developmentSeedWrite: "not_executed_no_safe_target",
    physicalDatabaseValidation: "pending_safe_development_target",
  });
  writeText(
    path.join(artifactBase, "future-safe-development-command.txt"),
    [
      migrationPlanner.commands.runTask3AWriteModeAgainstProvenDevelopmentTarget,
      migrationPlanner.commands.checkMigrationStatus,
      migrationPlanner.commands.applyMigrationLocally,
    ].join("\n"),
  );
  writeText(
    path.join(artifactBase, "README.txt"),
    [
      "Prediction Intelligence v2 Task 3A artifacts",
      `artifact_date=${paths.artifactDate}`,
      `generation_cutoff=${paths.generationCutoff}`,
      "migration_execution=not_executed_no_safe_target",
      "development_seed_write=not_executed_no_safe_target",
      "physical_database_validation=pending_safe_development_target",
      `future_release_fixtures=${releaseReview.futureFixtureCount}`,
      `chosen_candidate=${releaseReview.releaseCandidateDecision}`,
    ].join("\n"),
  );

  return {
    guard,
    migrationPlanner,
    importPlanner,
    releaseReview,
    signalPersistencePlan,
    immutablePublicationPlan,
    torneoExportPlan,
  };
}
