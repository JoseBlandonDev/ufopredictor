import { createSupabaseScriptAdminClient } from "@/lib/supabase/script-admin";
import type { TargetCompetition } from "@/lib/football-api/target-competitions";
import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import {
  assertSingleFriendlyApplyPlan,
  planControlledFixtureWrite,
  resolveApplyConfig,
} from "./apply";
import {
  buildApiFootballLeagueExternalId,
  buildApiFootballTeamExternalId,
  buildApiFootballFixtureExternalId,
} from "./external-ids";

type CompetitionRow = {
  id: string;
  external_id: string | null;
  name: string;
  slug: string;
  country: string | null;
  type: "international" | "league" | "cup";
  usage_scope: "public_product" | "internal_lab";
};

type SeasonRow = {
  id: string;
  competition_id: string;
  name: string;
  year: number;
  starts_at: string;
  ends_at: string;
};

type TeamRow = {
  id: string;
  external_id: string | null;
  name: string;
  slug: string;
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

type MatchResultRow = {
  id: string;
  match_id: string;
  home_goals: number;
  away_goals: number;
  verification_status: "pending_review" | "verified" | "rejected";
  intake_source: "mock" | "manual" | "csv_import" | "api_football";
  source_note: string | null;
};

type IngestRunRow = {
  id: string;
};

type RunStatus = "started" | "completed" | "failed";
type RunItemEntityTable =
  | "competitions"
  | "seasons"
  | "teams"
  | "matches"
  | "match_results";
type RunItemAction = "created" | "updated" | "skipped" | "error";

type RunItemWarning = {
  code: string;
  message: string;
  entity_table?: RunItemEntityTable;
  entity_external_id?: string;
  context?: Record<string, unknown>;
};

type RunItemError = {
  code: string;
  message: string;
  entity_table?: RunItemEntityTable;
  entity_external_id?: string;
  phase?: string;
  context?: Record<string, unknown>;
};

type ControlledWriteCounts = {
  competitionsCreated: number;
  competitionsUpdated: number;
  competitionsSkipped: number;
  seasonsCreated: number;
  seasonsUpdated: number;
  seasonsSkipped: number;
  teamsCreated: number;
  teamsUpdated: number;
  teamsSkipped: number;
  matchesCreated: number;
  matchesUpdated: number;
  matchesSkipped: number;
  matchResultsCreated: number;
  matchResultsUpdated: number;
  matchResultsSkipped: number;
};

type CountsSummary = {
  competitions: { created: number; updated: number; skipped: number; errors: number };
  seasons: { created: number; updated: number; skipped: number; errors: number };
  teams: { created: number; updated: number; skipped: number; errors: number };
  matches: { created: number; updated: number; skipped: number; errors: number };
  match_results: { created: number; updated: number; skipped: number; errors: number };
  fixtures: {
    fetched: number;
    planned: number;
    skipped_unknown: number;
    skipped_cancelled: number;
    skipped_postponed: number;
    skipped_abandoned: number;
  };
};

type IngestRunInsertPayload = {
  provider: "api_football";
  competition_key: string;
  provider_league_id: number;
  from_date: string;
  to_date: string;
  limit_value: number;
  apply_mode: true;
  run_tag: string;
  source_note: string;
  status: RunStatus;
  fetched_fixtures_count: number;
  planned_fixtures_count: number;
  counts_summary: CountsSummary;
  warnings_summary: RunItemWarning[];
  errors_summary: RunItemError[] | null;
  cli_args: {
    competition: string;
    from: string;
    to: string;
    limit: number;
    apply: true;
  };
  execution_context: "local_cli_script";
  created_by: string | null;
};

type IngestRunUpdatePayload = {
  status: RunStatus;
  finished_at: string;
  counts_summary: CountsSummary;
  warnings_summary: RunItemWarning[];
  errors_summary: RunItemError[] | null;
};

type IngestRunItemInsertPayload = {
  run_id: string;
  entity_table: RunItemEntityTable;
  entity_id: string | null;
  entity_external_id: string | null;
  entity_natural_key: Record<string, unknown> | null;
  action: RunItemAction;
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
  skip_reason: string | null;
  error_message: string | null;
};

export type ControlledWriteExecutionReport = ReturnType<typeof planControlledFixtureWrite> & {
  ingestRunId?: string;
  counts: ControlledWriteCounts;
};

const EMPTY_ERROR_COUNTS = { errors: 0 };

function buildEmptyCounts(): ControlledWriteCounts {
  return {
    competitionsCreated: 0,
    competitionsUpdated: 0,
    competitionsSkipped: 0,
    seasonsCreated: 0,
    seasonsUpdated: 0,
    seasonsSkipped: 0,
    teamsCreated: 0,
    teamsUpdated: 0,
    teamsSkipped: 0,
    matchesCreated: 0,
    matchesUpdated: 0,
    matchesSkipped: 0,
    matchResultsCreated: 0,
    matchResultsUpdated: 0,
    matchResultsSkipped: 0,
  };
}

function createSupabaseClient() {
  return createSupabaseScriptAdminClient();
}

function buildCountsSummary(
  plan: ReturnType<typeof planControlledFixtureWrite>,
  counts: ControlledWriteCounts,
  errorCounts?: Partial<Record<RunItemEntityTable, number>>,
): CountsSummary {
  return {
    competitions: {
      created: counts.competitionsCreated,
      updated: counts.competitionsUpdated,
      skipped: counts.competitionsSkipped,
      errors: errorCounts?.competitions ?? EMPTY_ERROR_COUNTS.errors,
    },
    seasons: {
      created: counts.seasonsCreated,
      updated: counts.seasonsUpdated,
      skipped: counts.seasonsSkipped,
      errors: errorCounts?.seasons ?? EMPTY_ERROR_COUNTS.errors,
    },
    teams: {
      created: counts.teamsCreated,
      updated: counts.teamsUpdated,
      skipped: counts.teamsSkipped,
      errors: errorCounts?.teams ?? EMPTY_ERROR_COUNTS.errors,
    },
    matches: {
      created: counts.matchesCreated,
      updated: counts.matchesUpdated,
      skipped: counts.matchesSkipped,
      errors: errorCounts?.matches ?? EMPTY_ERROR_COUNTS.errors,
    },
    match_results: {
      created: counts.matchResultsCreated,
      updated: counts.matchResultsUpdated,
      skipped: counts.matchResultsSkipped,
      errors: errorCounts?.match_results ?? EMPTY_ERROR_COUNTS.errors,
    },
    fixtures: {
      fetched: plan.fetchedFixtures,
      planned: plan.plannedFixtures,
      skipped_unknown: plan.skippedUnknown,
      skipped_cancelled: plan.skippedCancelled,
      skipped_postponed: plan.skippedPostponed,
      skipped_abandoned: plan.skippedAbandoned,
    },
  };
}

function buildWarningsSummary(
  plan: ReturnType<typeof planControlledFixtureWrite>,
): RunItemWarning[] {
  return plan.warnings.map((warning) => ({
    code: "writer_warning",
    message: warning,
  }));
}

function buildIngestRunHeaderInsertPayload(input: {
  target: TargetCompetition;
  plan: ReturnType<typeof planControlledFixtureWrite>;
  applyConfig: { from: string; to: string; limit: number };
  counts: ControlledWriteCounts;
}): IngestRunInsertPayload {
  return {
    provider: "api_football",
    competition_key: input.plan.competition,
    provider_league_id: input.target.leagueId,
    from_date: input.applyConfig.from,
    to_date: input.applyConfig.to,
    limit_value: input.applyConfig.limit,
    apply_mode: true,
    run_tag: input.plan.runTag,
    source_note: input.plan.sourceNote,
    status: "started",
    fetched_fixtures_count: input.plan.fetchedFixtures,
    planned_fixtures_count: input.plan.plannedFixtures,
    counts_summary: buildCountsSummary(input.plan, input.counts),
    warnings_summary: buildWarningsSummary(input.plan),
    errors_summary: null,
    cli_args: {
      competition: input.plan.competition,
      from: input.applyConfig.from,
      to: input.applyConfig.to,
      limit: input.applyConfig.limit,
      apply: true,
    },
    execution_context: "local_cli_script",
    created_by: process.env.USERNAME ?? null,
  };
}

function buildIngestRunUpdatePayload(input: {
  status: RunStatus;
  finishedAt: string;
  plan: ReturnType<typeof planControlledFixtureWrite>;
  counts: ControlledWriteCounts;
  warnings: RunItemWarning[];
  errors: RunItemError[] | null;
  errorCounts?: Partial<Record<RunItemEntityTable, number>>;
}): IngestRunUpdatePayload {
  return {
    status: input.status,
    finished_at: input.finishedAt,
    counts_summary: buildCountsSummary(input.plan, input.counts, input.errorCounts),
    warnings_summary: input.warnings,
    errors_summary: input.errors,
  };
}

function buildIngestRunItemInsertPayload(input: {
  runId: string;
  entityTable: RunItemEntityTable;
  action: RunItemAction;
  entityId?: string | null;
  entityExternalId?: string | null;
  entityNaturalKey?: Record<string, unknown> | null;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  skipReason?: string | null;
  errorMessage?: string | null;
}): IngestRunItemInsertPayload {
  return {
    run_id: input.runId,
    entity_table: input.entityTable,
    entity_id: input.entityId ?? null,
    entity_external_id: input.entityExternalId ?? null,
    entity_natural_key: input.entityNaturalKey ?? null,
    action: input.action,
    before_snapshot: input.beforeSnapshot ?? null,
    after_snapshot: input.afterSnapshot ?? null,
    skip_reason: input.skipReason ?? null,
    error_message: input.errorMessage ?? null,
  };
}

function snapshotCompetition(row: CompetitionRow): Record<string, unknown> {
  return {
    id: row.id,
    external_id: row.external_id,
    name: row.name,
    slug: row.slug,
    country: row.country,
    type: row.type,
    usage_scope: row.usage_scope,
  };
}

function snapshotSeason(row: SeasonRow): Record<string, unknown> {
  return {
    id: row.id,
    competition_id: row.competition_id,
    name: row.name,
    year: row.year,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
  };
}

function snapshotTeam(row: TeamRow): Record<string, unknown> {
  return {
    id: row.id,
    external_id: row.external_id,
    name: row.name,
    slug: row.slug,
    country: row.country,
  };
}

function snapshotMatch(row: MatchRow): Record<string, unknown> {
  return {
    id: row.id,
    external_id: row.external_id,
    slug: row.slug,
    competition_id: row.competition_id,
    season_id: row.season_id,
    home_team_id: row.home_team_id,
    away_team_id: row.away_team_id,
    venue_id: row.venue_id,
    kickoff_at: row.kickoff_at,
    stage: row.stage,
    status: row.status,
    access_scope: row.access_scope,
    intake_source: row.intake_source,
    source_note: row.source_note,
  };
}

function snapshotMatchResult(row: MatchResultRow): Record<string, unknown> {
  return {
    id: row.id,
    match_id: row.match_id,
    home_goals: row.home_goals,
    away_goals: row.away_goals,
    verification_status: row.verification_status,
    intake_source: row.intake_source,
    source_note: row.source_note,
  };
}

async function loadExistingState(
  target: TargetCompetition,
  fixtures: ProviderFixture[],
  supabase = createSupabaseClient(),
) {
  const competitionExternalId = buildApiFootballLeagueExternalId(target.leagueId);
  const teamExternalIds = Array.from(
    new Set(
      fixtures.flatMap((fixture) => [
        buildApiFootballTeamExternalId(fixture.homeTeam.providerTeamId),
        buildApiFootballTeamExternalId(fixture.awayTeam.providerTeamId),
      ]),
    ),
  );
  const matchExternalIds = fixtures.map((fixture) =>
    buildApiFootballFixtureExternalId(fixture.providerFixtureId),
  );

  const { data: competitionData, error: competitionError } = await supabase
    .from("competitions")
    .select("id, external_id, name, slug, country, type, usage_scope")
    .eq("external_id", competitionExternalId)
    .limit(1);

  if (competitionError) {
    throw new Error(`Failed to read existing competition rows: ${competitionError.message}`);
  }

  const competitionByExternalId = new Map<string, CompetitionRow>();
  const existingCompetition = (competitionData?.[0] as CompetitionRow | undefined) ?? undefined;
  if (existingCompetition?.external_id) {
    competitionByExternalId.set(existingCompetition.external_id, existingCompetition);
  }

  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id, external_id, name, slug, country")
    .in("external_id", teamExternalIds);

  if (teamError) {
    throw new Error(`Failed to read existing team rows: ${teamError.message}`);
  }

  const teamByExternalId = new Map<string, TeamRow>();
  for (const team of (teamData ?? []) as TeamRow[]) {
    if (team.external_id) {
      teamByExternalId.set(team.external_id, team);
    }
  }

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select(
      "id, external_id, slug, competition_id, season_id, home_team_id, away_team_id, venue_id, kickoff_at, stage, status, access_scope, intake_source, source_note",
    )
    .in("external_id", matchExternalIds);

  if (matchError) {
    throw new Error(`Failed to read existing match rows: ${matchError.message}`);
  }

  const matchByExternalId = new Map<string, MatchRow>();
  const existingMatchIds: string[] = [];
  for (const match of (matchData ?? []) as MatchRow[]) {
    if (match.external_id) {
      matchByExternalId.set(match.external_id, match);
      existingMatchIds.push(match.id);
    }
  }

  const seasonByCompetitionYear = new Map<string, SeasonRow>();
  if (existingCompetition) {
    const { data: seasonData, error: seasonError } = await supabase
      .from("seasons")
      .select("id, competition_id, name, year, starts_at, ends_at")
      .eq("competition_id", existingCompetition.id)
      .eq("year", target.season);

    if (seasonError) {
      throw new Error(`Failed to read existing season rows: ${seasonError.message}`);
    }

    for (const season of (seasonData ?? []) as SeasonRow[]) {
      seasonByCompetitionYear.set(`${season.competition_id}:${season.year}`, season);
    }
  }

  const matchResultByMatchId = new Map<string, MatchResultRow>();
  if (existingMatchIds.length > 0) {
    const { data: matchResultData, error: matchResultError } = await supabase
      .from("match_results")
      .select("id, match_id, home_goals, away_goals, verification_status, intake_source, source_note")
      .in("match_id", existingMatchIds);

    if (matchResultError) {
      throw new Error(`Failed to read existing match result rows: ${matchResultError.message}`);
    }

    for (const result of (matchResultData ?? []) as MatchResultRow[]) {
      matchResultByMatchId.set(result.match_id, result);
    }
  }

  return {
    competitionByExternalId,
    seasonByCompetitionYear,
    teamByExternalId,
    matchByExternalId,
    matchResultByMatchId,
  };
}

async function insertRunHeader(
  supabase: ReturnType<typeof createSupabaseClient>,
  payload: IngestRunInsertPayload,
): Promise<string> {
  const { data, error } = await supabase
    .from("ingest_runs")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert ingest run header: ${error?.message ?? "missing row id"}`);
  }

  return (data as IngestRunRow).id;
}

async function updateRunHeader(
  supabase: ReturnType<typeof createSupabaseClient>,
  runId: string,
  payload: IngestRunUpdatePayload,
): Promise<void> {
  const { error } = await supabase
    .from("ingest_runs")
    .update(payload)
    .eq("id", runId);

  if (error) {
    throw new Error(`Failed to update ingest run header ${runId}: ${error.message}`);
  }
}

async function recordRunItem(
  supabase: ReturnType<typeof createSupabaseClient>,
  payload: IngestRunItemInsertPayload,
): Promise<void> {
  const { error } = await supabase.from("ingest_run_items").insert(payload);
  if (error) {
    throw new Error(`Failed to insert ingest run item: ${error.message}`);
  }
}

async function tryRecordRunItem(
  supabase: ReturnType<typeof createSupabaseClient>,
  payload: IngestRunItemInsertPayload,
): Promise<void> {
  try {
    await recordRunItem(supabase, payload);
  } catch {
    // Preserve the original write failure if audit logging also fails.
  }
}

function buildFailureError(input: {
  code: string;
  message: string;
  entityTable?: RunItemEntityTable;
  entityExternalId?: string;
  phase: string;
  context?: Record<string, unknown>;
}): RunItemError {
  return {
    code: input.code,
    message: input.message,
    entity_table: input.entityTable,
    entity_external_id: input.entityExternalId,
    phase: input.phase,
    context: input.context,
  };
}

function buildCreatedCompetitionAfterSnapshot(input: {
  id?: string;
  externalId: string;
  name: string;
  slug: string;
  country: string | null;
  type: "international" | "league" | "cup";
  usageScope: "public_product";
}): Record<string, unknown> {
  return {
    id: input.id ?? null,
    external_id: input.externalId,
    name: input.name,
    slug: input.slug,
    country: input.country,
    type: input.type,
    usage_scope: input.usageScope,
  };
}

function buildCreatedSeasonAfterSnapshot(input: {
  id?: string;
  competitionId: string;
  name: string;
  year: number;
  startsAt: string;
  endsAt: string;
}): Record<string, unknown> {
  return {
    id: input.id ?? null,
    competition_id: input.competitionId,
    name: input.name,
    year: input.year,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
  };
}

function buildCreatedTeamAfterSnapshot(input: {
  id?: string;
  externalId: string;
  name: string;
  slug: string;
  country: string | null;
}): Record<string, unknown> {
  return {
    id: input.id ?? null,
    external_id: input.externalId,
    name: input.name,
    slug: input.slug,
    country: input.country,
  };
}

function buildCreatedMatchAfterSnapshot(input: {
  id?: string;
  externalId: string;
  slug: string;
  competitionId: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  stage: string | null;
  status: MatchRow["status"];
  sourceNote: string;
}): Record<string, unknown> {
  return {
    id: input.id ?? null,
    external_id: input.externalId,
    slug: input.slug,
    competition_id: input.competitionId,
    season_id: input.seasonId,
    home_team_id: input.homeTeamId,
    away_team_id: input.awayTeamId,
    venue_id: null,
    kickoff_at: input.kickoffAt,
    stage: input.stage,
    status: input.status,
    access_scope: "admin_only",
    intake_source: "api_football",
    source_note: input.sourceNote,
  };
}

function buildCreatedMatchResultAfterSnapshot(input: {
  id?: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  sourceNote: string;
}): Record<string, unknown> {
  return {
    id: input.id ?? null,
    match_id: input.matchId,
    home_goals: input.homeGoals,
    away_goals: input.awayGoals,
    verification_status: "pending_review",
    intake_source: "api_football",
    source_note: input.sourceNote,
  };
}

function incrementErrorCount(
  errorCounts: Partial<Record<RunItemEntityTable, number>>,
  entityTable: RunItemEntityTable,
): void {
  errorCounts[entityTable] = (errorCounts[entityTable] ?? 0) + 1;
}

export async function executeControlledFixtureWrite(input: {
  target: TargetCompetition;
  fixtures: ProviderFixture[];
  apply: boolean;
  from?: string;
  to?: string;
  limit?: number;
  fixtureId?: number;
}): Promise<ControlledWriteExecutionReport> {
  const applyConfig = resolveApplyConfig({
    apply: input.apply,
    competition: input.target.key,
    from: input.from,
    to: input.to,
    limit: input.limit,
    fixtureId: input.fixtureId,
  });

  if (!applyConfig) {
    throw new Error("Controlled write execution requires --apply true.");
  }

  const supabase = createSupabaseClient();
  const existing = await loadExistingState(input.target, input.fixtures, supabase);
  const plan = planControlledFixtureWrite(input.fixtures, input.target, applyConfig, existing);
  assertSingleFriendlyApplyPlan(plan, input.target, applyConfig);
  const counts = buildEmptyCounts();
  const warningSummary = buildWarningsSummary(plan);
  const errorSummary: RunItemError[] = [];
  const errorCounts: Partial<Record<RunItemEntityTable, number>> = {};
  const runId = await insertRunHeader(
    supabase,
    buildIngestRunHeaderInsertPayload({
      target: input.target,
      plan,
      applyConfig,
      counts,
    }),
  );

  try {
    for (const competition of plan.competitionPlans) {
      const existingCompetition = existing.competitionByExternalId.get(competition.externalId);

      if (!existingCompetition) {
        const payload = {
          external_id: competition.externalId,
          name: competition.name,
          slug: competition.slug,
          country: competition.country,
          type: competition.type,
          usage_scope: competition.usageScope,
        };

        const { data, error } = await supabase
          .from("competitions")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          const failure = buildFailureError({
            code: "competition_insert_failed",
            message: `Failed to insert competition ${competition.externalId}: ${error.message}`,
            entityTable: "competitions",
            entityExternalId: competition.externalId,
            phase: "competitions",
          });
          errorSummary.push(failure);
          incrementErrorCount(errorCounts, "competitions");
          await tryRecordRunItem(
            supabase,
            buildIngestRunItemInsertPayload({
              runId,
              entityTable: "competitions",
              action: "error",
              entityExternalId: competition.externalId,
              errorMessage: failure.message,
              afterSnapshot: buildCreatedCompetitionAfterSnapshot({
                externalId: competition.externalId,
                name: competition.name,
                slug: competition.slug,
                country: competition.country,
                type: competition.type,
                usageScope: competition.usageScope,
              }),
            }),
          );
          throw new Error(failure.message);
        }

        counts.competitionsCreated += 1;
        await recordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "competitions",
            action: "created",
            entityId: (data as IngestRunRow | null)?.id ?? null,
            entityExternalId: competition.externalId,
            afterSnapshot: buildCreatedCompetitionAfterSnapshot({
              id: (data as IngestRunRow | null)?.id,
              externalId: competition.externalId,
              name: competition.name,
              slug: competition.slug,
              country: competition.country,
              type: competition.type,
              usageScope: competition.usageScope,
            }),
          }),
        );
        continue;
      }

      const beforeSnapshot = snapshotCompetition(existingCompetition);
      const { error } = await supabase
        .from("competitions")
        .update({
          name: competition.name,
          country: competition.country,
          type: competition.type,
          usage_scope: "public_product",
        })
        .eq("id", existingCompetition.id);

      if (error) {
        const failure = buildFailureError({
          code: "competition_update_failed",
          message: `Failed to update competition ${competition.externalId}: ${error.message}`,
          entityTable: "competitions",
          entityExternalId: competition.externalId,
          phase: "competitions",
        });
        errorSummary.push(failure);
        incrementErrorCount(errorCounts, "competitions");
        await tryRecordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "competitions",
            action: "error",
            entityId: existingCompetition.id,
            entityExternalId: competition.externalId,
            beforeSnapshot,
            errorMessage: failure.message,
          }),
        );
        throw new Error(failure.message);
      }

      counts.competitionsUpdated += 1;
      await recordRunItem(
        supabase,
        buildIngestRunItemInsertPayload({
          runId,
          entityTable: "competitions",
          action: "updated",
          entityId: existingCompetition.id,
          entityExternalId: competition.externalId,
          beforeSnapshot,
          afterSnapshot: buildCreatedCompetitionAfterSnapshot({
            id: existingCompetition.id,
            externalId: competition.externalId,
            name: competition.name,
            slug: existingCompetition.slug,
            country: competition.country,
            type: competition.type,
            usageScope: "public_product",
          }),
        }),
      );
    }

    const refreshedExisting = await loadExistingState(input.target, input.fixtures, supabase);

    for (const season of plan.seasonPlans) {
      const competition = refreshedExisting.competitionByExternalId.get(season.competitionExternalId);
      if (!competition) {
        throw new Error(`Competition missing after write for season plan ${season.competitionExternalId}.`);
      }

      const existingSeason = refreshedExisting.seasonByCompetitionYear.get(
        `${competition.id}:${season.year}`,
      );

      if (!existingSeason) {
        const payload = {
          competition_id: competition.id,
          name: season.name,
          year: season.year,
          starts_at: season.startsAt,
          ends_at: season.endsAt,
        };

        const { data, error } = await supabase
          .from("seasons")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          const failure = buildFailureError({
            code: "season_insert_failed",
            message: `Failed to insert season ${season.year}: ${error.message}`,
            entityTable: "seasons",
            phase: "seasons",
            context: { competition_external_id: season.competitionExternalId, year: season.year },
          });
          errorSummary.push(failure);
          incrementErrorCount(errorCounts, "seasons");
          await tryRecordRunItem(
            supabase,
            buildIngestRunItemInsertPayload({
              runId,
              entityTable: "seasons",
              action: "error",
              entityNaturalKey: {
                competition_external_id: season.competitionExternalId,
                year: season.year,
              },
              errorMessage: failure.message,
              afterSnapshot: buildCreatedSeasonAfterSnapshot({
                competitionId: competition.id,
                name: season.name,
                year: season.year,
                startsAt: season.startsAt,
                endsAt: season.endsAt,
              }),
            }),
          );
          throw new Error(failure.message);
        }

        counts.seasonsCreated += 1;
        await recordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "seasons",
            action: "created",
            entityId: (data as IngestRunRow | null)?.id ?? null,
            entityNaturalKey: {
              competition_external_id: season.competitionExternalId,
              year: season.year,
            },
            afterSnapshot: buildCreatedSeasonAfterSnapshot({
              id: (data as IngestRunRow | null)?.id,
              competitionId: competition.id,
              name: season.name,
              year: season.year,
              startsAt: season.startsAt,
              endsAt: season.endsAt,
            }),
          }),
        );
        continue;
      }

      const beforeSnapshot = snapshotSeason(existingSeason);
      const { error } = await supabase
        .from("seasons")
        .update({
          name: season.name,
          starts_at: season.startsAt,
          ends_at: season.endsAt,
        })
        .eq("id", existingSeason.id);

      if (error) {
        const failure = buildFailureError({
          code: "season_update_failed",
          message: `Failed to update season ${season.year}: ${error.message}`,
          entityTable: "seasons",
          phase: "seasons",
          context: { competition_external_id: season.competitionExternalId, year: season.year },
        });
        errorSummary.push(failure);
        incrementErrorCount(errorCounts, "seasons");
        await tryRecordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "seasons",
            action: "error",
            entityId: existingSeason.id,
            entityNaturalKey: {
              competition_external_id: season.competitionExternalId,
              year: season.year,
            },
            beforeSnapshot,
            errorMessage: failure.message,
          }),
        );
        throw new Error(failure.message);
      }

      counts.seasonsUpdated += 1;
      await recordRunItem(
        supabase,
        buildIngestRunItemInsertPayload({
          runId,
          entityTable: "seasons",
          action: "updated",
          entityId: existingSeason.id,
          entityNaturalKey: {
            competition_external_id: season.competitionExternalId,
            year: season.year,
          },
          beforeSnapshot,
          afterSnapshot: buildCreatedSeasonAfterSnapshot({
            id: existingSeason.id,
            competitionId: competition.id,
            name: season.name,
            year: season.year,
            startsAt: season.startsAt,
            endsAt: season.endsAt,
          }),
        }),
      );
    }

    const existingAfterSeason = await loadExistingState(input.target, input.fixtures, supabase);

    for (const team of plan.teamPlans) {
      const existingTeam = existingAfterSeason.teamByExternalId.get(team.externalId);

      if (!existingTeam) {
        const payload = {
          external_id: team.externalId,
          name: team.name,
          slug: team.slug,
          country: team.country,
        };

        const { data, error } = await supabase
          .from("teams")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          const failure = buildFailureError({
            code: "team_insert_failed",
            message: `Failed to insert team ${team.externalId}: ${error.message}`,
            entityTable: "teams",
            entityExternalId: team.externalId,
            phase: "teams",
          });
          errorSummary.push(failure);
          incrementErrorCount(errorCounts, "teams");
          await tryRecordRunItem(
            supabase,
            buildIngestRunItemInsertPayload({
              runId,
              entityTable: "teams",
              action: "error",
              entityExternalId: team.externalId,
              errorMessage: failure.message,
              afterSnapshot: buildCreatedTeamAfterSnapshot({
                externalId: team.externalId,
                name: team.name,
                slug: team.slug,
                country: team.country,
              }),
            }),
          );
          throw new Error(failure.message);
        }

        counts.teamsCreated += 1;
        await recordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "teams",
            action: "created",
            entityId: (data as IngestRunRow | null)?.id ?? null,
            entityExternalId: team.externalId,
            afterSnapshot: buildCreatedTeamAfterSnapshot({
              id: (data as IngestRunRow | null)?.id,
              externalId: team.externalId,
              name: team.name,
              slug: team.slug,
              country: team.country,
            }),
          }),
        );
        continue;
      }

      const beforeSnapshot = snapshotTeam(existingTeam);
      const { error } = await supabase
        .from("teams")
        .update({
          name: team.name,
          country: team.country,
        })
        .eq("id", existingTeam.id);

      if (error) {
        const failure = buildFailureError({
          code: "team_update_failed",
          message: `Failed to update team ${team.externalId}: ${error.message}`,
          entityTable: "teams",
          entityExternalId: team.externalId,
          phase: "teams",
        });
        errorSummary.push(failure);
        incrementErrorCount(errorCounts, "teams");
        await tryRecordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "teams",
            action: "error",
            entityId: existingTeam.id,
            entityExternalId: team.externalId,
            beforeSnapshot,
            errorMessage: failure.message,
          }),
        );
        throw new Error(failure.message);
      }

      counts.teamsUpdated += 1;
      await recordRunItem(
        supabase,
        buildIngestRunItemInsertPayload({
          runId,
          entityTable: "teams",
          action: "updated",
          entityId: existingTeam.id,
          entityExternalId: team.externalId,
          beforeSnapshot,
          afterSnapshot: buildCreatedTeamAfterSnapshot({
            id: existingTeam.id,
            externalId: team.externalId,
            name: team.name,
            slug: existingTeam.slug,
            country: team.country,
          }),
        }),
      );
    }

    const existingAfterTeams = await loadExistingState(input.target, input.fixtures, supabase);
    const competition = existingAfterTeams.competitionByExternalId.get(
      buildApiFootballLeagueExternalId(input.target.leagueId),
    );
    if (!competition) {
      throw new Error("Competition missing after writes.");
    }
    const season = existingAfterTeams.seasonByCompetitionYear.get(`${competition.id}:${input.target.season}`);
    if (!season) {
      throw new Error("Season missing after writes.");
    }

    for (const match of plan.matchPlans) {
      const existingMatch = existingAfterTeams.matchByExternalId.get(match.externalId);
      const homeTeam = existingAfterTeams.teamByExternalId.get(match.homeTeamExternalId);
      const awayTeam = existingAfterTeams.teamByExternalId.get(match.awayTeamExternalId);

      if (!homeTeam || !awayTeam) {
        throw new Error(`Teams missing for match ${match.externalId}.`);
      }

      if (!existingMatch) {
        const payload = {
          external_id: match.externalId,
          slug: match.slug,
          competition_id: competition.id,
          season_id: season.id,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          venue_id: null,
          kickoff_at: match.kickoffAt,
          stage: match.stage,
          status: match.status,
          access_scope: "admin_only" as const,
          intake_source: "api_football" as const,
          source_note: match.sourceNote,
        };

        const { data, error } = await supabase
          .from("matches")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          const failure = buildFailureError({
            code: "match_insert_failed",
            message: `Failed to insert match ${match.externalId}: ${error.message}`,
            entityTable: "matches",
            entityExternalId: match.externalId,
            phase: "matches",
            context: { fixture_id: match.fixtureId },
          });
          errorSummary.push(failure);
          incrementErrorCount(errorCounts, "matches");
          await tryRecordRunItem(
            supabase,
            buildIngestRunItemInsertPayload({
              runId,
              entityTable: "matches",
              action: "error",
              entityExternalId: match.externalId,
              entityNaturalKey: { fixture_id: match.fixtureId },
              errorMessage: failure.message,
              afterSnapshot: buildCreatedMatchAfterSnapshot({
                externalId: match.externalId,
                slug: match.slug,
                competitionId: competition.id,
                seasonId: season.id,
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                kickoffAt: match.kickoffAt,
                stage: match.stage,
                status: match.status,
                sourceNote: match.sourceNote,
              }),
            }),
          );
          throw new Error(failure.message);
        }

        counts.matchesCreated += 1;
        await recordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "matches",
            action: "created",
            entityId: (data as IngestRunRow | null)?.id ?? null,
            entityExternalId: match.externalId,
            entityNaturalKey: { fixture_id: match.fixtureId },
            afterSnapshot: buildCreatedMatchAfterSnapshot({
              id: (data as IngestRunRow | null)?.id,
              externalId: match.externalId,
              slug: match.slug,
              competitionId: competition.id,
              seasonId: season.id,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              kickoffAt: match.kickoffAt,
              stage: match.stage,
              status: match.status,
              sourceNote: match.sourceNote,
            }),
          }),
        );
        continue;
      }

      const beforeSnapshot = snapshotMatch(existingMatch);
      const { error } = await supabase
        .from("matches")
        .update({
          competition_id: competition.id,
          season_id: season.id,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          venue_id: null,
          kickoff_at: match.kickoffAt,
          stage: match.stage,
          status: match.status,
          access_scope: match.accessScope,
          intake_source: "api_football",
          source_note: match.sourceNote,
        })
        .eq("id", existingMatch.id);

      if (error) {
        const failure = buildFailureError({
          code: "match_update_failed",
          message: `Failed to update match ${match.externalId}: ${error.message}`,
          entityTable: "matches",
          entityExternalId: match.externalId,
          phase: "matches",
          context: { fixture_id: match.fixtureId },
        });
        errorSummary.push(failure);
        incrementErrorCount(errorCounts, "matches");
        await tryRecordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "matches",
            action: "error",
            entityId: existingMatch.id,
            entityExternalId: match.externalId,
            entityNaturalKey: { fixture_id: match.fixtureId },
            beforeSnapshot,
            errorMessage: failure.message,
          }),
        );
        throw new Error(failure.message);
      }

      counts.matchesUpdated += 1;
      await recordRunItem(
        supabase,
        buildIngestRunItemInsertPayload({
          runId,
          entityTable: "matches",
          action: "updated",
          entityId: existingMatch.id,
          entityExternalId: match.externalId,
          entityNaturalKey: { fixture_id: match.fixtureId },
          beforeSnapshot,
          afterSnapshot: buildCreatedMatchAfterSnapshot({
            id: existingMatch.id,
            externalId: match.externalId,
            slug: existingMatch.slug,
            competitionId: competition.id,
            seasonId: season.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            kickoffAt: match.kickoffAt,
            stage: match.stage,
            status: match.status,
            sourceNote: match.sourceNote,
          }),
        }),
      );
    }

    const existingAfterMatches = await loadExistingState(input.target, input.fixtures, supabase);

    for (const result of plan.matchResultPlans) {
      const existingMatch = existingAfterMatches.matchByExternalId.get(result.matchExternalId);
      if (!existingMatch) {
        throw new Error(`Match missing for match result ${result.matchExternalId}.`);
      }

      const existingResult = existingAfterMatches.matchResultByMatchId.get(existingMatch.id);

      if (result.action === "skip") {
        counts.matchResultsSkipped += 1;
        await recordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "match_results",
            action: "skipped",
            entityId: existingResult?.id ?? null,
            entityExternalId: result.matchExternalId,
            entityNaturalKey: { match_id: existingMatch.id },
            beforeSnapshot: existingResult ? snapshotMatchResult(existingResult) : null,
            skipReason: result.reason,
          }),
        );
        continue;
      }

      if (result.action === "create") {
        const payload = {
          match_id: existingMatch.id,
          home_goals: result.homeGoals,
          away_goals: result.awayGoals,
          verification_status: "pending_review" as const,
          intake_source: "api_football" as const,
          source_note: result.sourceNote,
        };

        const { data, error } = await supabase
          .from("match_results")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          const failure = buildFailureError({
            code: "match_result_insert_failed",
            message: `Failed to insert match result for ${result.matchExternalId}: ${error.message}`,
            entityTable: "match_results",
            entityExternalId: result.matchExternalId,
            phase: "match_results",
          });
          errorSummary.push(failure);
          incrementErrorCount(errorCounts, "match_results");
          await tryRecordRunItem(
            supabase,
            buildIngestRunItemInsertPayload({
              runId,
              entityTable: "match_results",
              action: "error",
              entityExternalId: result.matchExternalId,
              entityNaturalKey: { match_id: existingMatch.id },
              errorMessage: failure.message,
              afterSnapshot: buildCreatedMatchResultAfterSnapshot({
                matchId: existingMatch.id,
                homeGoals: result.homeGoals,
                awayGoals: result.awayGoals,
                sourceNote: result.sourceNote,
              }),
            }),
          );
          throw new Error(failure.message);
        }

        counts.matchResultsCreated += 1;
        await recordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "match_results",
            action: "created",
            entityId: (data as IngestRunRow | null)?.id ?? null,
            entityExternalId: result.matchExternalId,
            entityNaturalKey: { match_id: existingMatch.id },
            afterSnapshot: buildCreatedMatchResultAfterSnapshot({
              id: (data as IngestRunRow | null)?.id,
              matchId: existingMatch.id,
              homeGoals: result.homeGoals,
              awayGoals: result.awayGoals,
              sourceNote: result.sourceNote,
            }),
          }),
        );
        continue;
      }

      if (!existingResult || existingResult.verification_status !== "pending_review") {
        counts.matchResultsSkipped += 1;
        await recordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "match_results",
            action: "skipped",
            entityId: existingResult?.id ?? null,
            entityExternalId: result.matchExternalId,
            entityNaturalKey: { match_id: existingMatch.id },
            beforeSnapshot: existingResult ? snapshotMatchResult(existingResult) : null,
            skipReason: "existing_verified_or_rejected",
          }),
        );
        continue;
      }

      const beforeSnapshot = snapshotMatchResult(existingResult);
      const { error } = await supabase
        .from("match_results")
        .update({
          home_goals: result.homeGoals,
          away_goals: result.awayGoals,
          intake_source: "api_football",
          source_note: result.sourceNote,
        })
        .eq("id", existingResult.id);

      if (error) {
        const failure = buildFailureError({
          code: "match_result_update_failed",
          message: `Failed to update match result for ${result.matchExternalId}: ${error.message}`,
          entityTable: "match_results",
          entityExternalId: result.matchExternalId,
          phase: "match_results",
        });
        errorSummary.push(failure);
        incrementErrorCount(errorCounts, "match_results");
        await tryRecordRunItem(
          supabase,
          buildIngestRunItemInsertPayload({
            runId,
            entityTable: "match_results",
            action: "error",
            entityId: existingResult.id,
            entityExternalId: result.matchExternalId,
            entityNaturalKey: { match_id: existingMatch.id },
            beforeSnapshot,
            errorMessage: failure.message,
          }),
        );
        throw new Error(failure.message);
      }

      counts.matchResultsUpdated += 1;
      await recordRunItem(
        supabase,
        buildIngestRunItemInsertPayload({
          runId,
          entityTable: "match_results",
          action: "updated",
          entityId: existingResult.id,
          entityExternalId: result.matchExternalId,
          entityNaturalKey: { match_id: existingMatch.id },
          beforeSnapshot,
          afterSnapshot: buildCreatedMatchResultAfterSnapshot({
            id: existingResult.id,
            matchId: existingMatch.id,
            homeGoals: result.homeGoals,
            awayGoals: result.awayGoals,
            sourceNote: result.sourceNote,
          }),
        }),
      );
    }

    await updateRunHeader(
      supabase,
      runId,
      buildIngestRunUpdatePayload({
        status: "completed",
        finishedAt: new Date().toISOString(),
        plan,
        counts,
        warnings: warningSummary,
        errors: errorSummary.length > 0 ? errorSummary : null,
        errorCounts,
      }),
    );

    return {
      ...plan,
      ingestRunId: runId,
      counts,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown controlled ingest write error";

    if (errorSummary.length === 0 || errorSummary[errorSummary.length - 1]?.message !== message) {
      errorSummary.push(
        buildFailureError({
          code: "writer_failed",
          message,
          phase: "writer",
        }),
      );
    }

    try {
      await updateRunHeader(
        supabase,
        runId,
        buildIngestRunUpdatePayload({
          status: "failed",
          finishedAt: new Date().toISOString(),
          plan,
          counts,
          warnings: warningSummary,
          errors: errorSummary,
          errorCounts,
        }),
      );
    } catch {
      // Best-effort failure marking only. Preserve the original domain error.
    }

    throw error;
  }
}

export {
  buildCountsSummary,
  buildWarningsSummary,
  buildIngestRunHeaderInsertPayload,
  buildIngestRunItemInsertPayload,
};
