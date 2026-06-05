import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TargetCompetition } from "@/lib/football-api/target-competitions";
import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import { planControlledFixtureWrite, resolveApplyConfig } from "./apply";
import {
  buildApiFootballLeagueExternalId,
  buildApiFootballTeamExternalId,
  buildApiFootballFixtureExternalId,
} from "./external-ids";

type CompetitionRow = {
  id: string;
  external_id: string | null;
  slug: string;
  usage_scope: "public_product" | "internal_lab";
};

type SeasonRow = {
  id: string;
  competition_id: string;
  year: number;
};

type TeamRow = {
  id: string;
  external_id: string | null;
  slug: string;
};

type MatchRow = {
  id: string;
  external_id: string | null;
  slug: string;
  access_scope: "public" | "premium" | "admin_only" | "lab_only";
};

type MatchResultRow = {
  id: string;
  match_id: string;
  verification_status: "pending_review" | "verified" | "rejected";
  home_goals: number;
  away_goals: number;
};

export type ControlledWriteExecutionReport = ReturnType<typeof planControlledFixtureWrite> & {
  counts: {
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
};

async function loadExistingState(
  target: TargetCompetition,
  fixtures: ProviderFixture[],
) {
  const supabase = createSupabaseAdminClient();

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
    .select("id, external_id, slug, usage_scope")
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
    .select("id, external_id, slug")
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
    .select("id, external_id, slug, access_scope")
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
      .select("id, competition_id, year")
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
      .select("id, match_id, verification_status, home_goals, away_goals")
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

export async function executeControlledFixtureWrite(input: {
  target: TargetCompetition;
  fixtures: ProviderFixture[];
  apply: boolean;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<ControlledWriteExecutionReport> {
  const applyConfig = resolveApplyConfig({
    apply: input.apply,
    competition: input.target.key,
    from: input.from,
    to: input.to,
    limit: input.limit,
  });

  if (!applyConfig) {
    throw new Error("Controlled write execution requires --apply true.");
  }

  const existing = await loadExistingState(input.target, input.fixtures);
  const plan = planControlledFixtureWrite(input.fixtures, input.target, applyConfig, existing);
  const supabase = createSupabaseAdminClient();

  let competitionsCreated = 0;
  let competitionsUpdated = 0;
  let seasonsCreated = 0;
  let seasonsUpdated = 0;
  let teamsCreated = 0;
  let teamsUpdated = 0;
  let matchesCreated = 0;
  let matchesUpdated = 0;
  let matchResultsCreated = 0;
  let matchResultsUpdated = 0;
  let matchResultsSkipped = 0;

  for (const competition of plan.competitionPlans) {
    const existingCompetition = existing.competitionByExternalId.get(competition.externalId);

    if (!existingCompetition) {
      const { error } = await supabase.from("competitions").insert({
        external_id: competition.externalId,
        name: competition.name,
        slug: competition.slug,
        country: competition.country,
        type: competition.type,
        usage_scope: competition.usageScope,
      });

      if (error) {
        throw new Error(`Failed to insert competition ${competition.externalId}: ${error.message}`);
      }
      competitionsCreated += 1;
      continue;
    }

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
      throw new Error(`Failed to update competition ${competition.externalId}: ${error.message}`);
    }
    competitionsUpdated += 1;
  }

  const refreshedExisting = await loadExistingState(input.target, input.fixtures);

  for (const season of plan.seasonPlans) {
    const competition = refreshedExisting.competitionByExternalId.get(season.competitionExternalId);
    if (!competition) {
      throw new Error(`Competition missing after write for season plan ${season.competitionExternalId}.`);
    }

    const existingSeason = refreshedExisting.seasonByCompetitionYear.get(
      `${competition.id}:${season.year}`,
    );

    if (!existingSeason) {
      const { error } = await supabase.from("seasons").insert({
        competition_id: competition.id,
        name: season.name,
        year: season.year,
        starts_at: season.startsAt,
        ends_at: season.endsAt,
      });

      if (error) {
        throw new Error(`Failed to insert season ${season.year}: ${error.message}`);
      }
      seasonsCreated += 1;
      continue;
    }

    const { error } = await supabase
      .from("seasons")
      .update({
        name: season.name,
        starts_at: season.startsAt,
        ends_at: season.endsAt,
      })
      .eq("id", existingSeason.id);

    if (error) {
      throw new Error(`Failed to update season ${season.year}: ${error.message}`);
    }
    seasonsUpdated += 1;
  }

  const existingAfterSeason = await loadExistingState(input.target, input.fixtures);

  for (const team of plan.teamPlans) {
    const existingTeam = existingAfterSeason.teamByExternalId.get(team.externalId);

    if (!existingTeam) {
      const { error } = await supabase.from("teams").insert({
        external_id: team.externalId,
        name: team.name,
        slug: team.slug,
        country: team.country,
      });

      if (error) {
        throw new Error(`Failed to insert team ${team.externalId}: ${error.message}`);
      }
      teamsCreated += 1;
      continue;
    }

    const { error } = await supabase
      .from("teams")
      .update({
        name: team.name,
        country: team.country,
      })
      .eq("id", existingTeam.id);

    if (error) {
      throw new Error(`Failed to update team ${team.externalId}: ${error.message}`);
    }
    teamsUpdated += 1;
  }

  const existingAfterTeams = await loadExistingState(input.target, input.fixtures);
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
      const { error } = await supabase.from("matches").insert({
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
        access_scope: "admin_only",
        intake_source: "api_football",
        source_note: match.sourceNote,
      });

      if (error) {
        throw new Error(`Failed to insert match ${match.externalId}: ${error.message}`);
      }
      matchesCreated += 1;
      continue;
    }

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
      throw new Error(`Failed to update match ${match.externalId}: ${error.message}`);
    }
    matchesUpdated += 1;
  }

  const existingAfterMatches = await loadExistingState(input.target, input.fixtures);

  for (const result of plan.matchResultPlans) {
    if (result.action === "skip") {
      matchResultsSkipped += 1;
      continue;
    }

    const existingMatch = existingAfterMatches.matchByExternalId.get(result.matchExternalId);
    if (!existingMatch) {
      throw new Error(`Match missing for match result ${result.matchExternalId}.`);
    }

    const existingResult = existingAfterMatches.matchResultByMatchId.get(existingMatch.id);

    if (result.action === "create") {
      const { error } = await supabase.from("match_results").insert({
        match_id: existingMatch.id,
        home_goals: result.homeGoals,
        away_goals: result.awayGoals,
        verification_status: "pending_review",
        intake_source: "api_football",
        source_note: result.sourceNote,
      });

      if (error) {
        throw new Error(`Failed to insert match result for ${result.matchExternalId}: ${error.message}`);
      }
      matchResultsCreated += 1;
      continue;
    }

    if (!existingResult || existingResult.verification_status !== "pending_review") {
      matchResultsSkipped += 1;
      continue;
    }

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
      throw new Error(`Failed to update match result for ${result.matchExternalId}: ${error.message}`);
    }
    matchResultsUpdated += 1;
  }

  return {
    ...plan,
    counts: {
      competitionsCreated,
      competitionsUpdated,
      competitionsSkipped: 0,
      seasonsCreated,
      seasonsUpdated,
      seasonsSkipped: 0,
      teamsCreated,
      teamsUpdated,
      teamsSkipped: 0,
      matchesCreated,
      matchesUpdated,
      matchesSkipped: 0,
      matchResultsCreated,
      matchResultsUpdated,
      matchResultsSkipped,
    },
  };
}
