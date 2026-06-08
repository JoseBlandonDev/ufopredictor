import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CompetitionRow, MatchResultRow, MatchRow, TeamRow } from "@/types/database";

type RealFixtureLabMatch = Pick<
  MatchRow,
  | "id"
  | "external_id"
  | "slug"
  | "competition_id"
  | "home_team_id"
  | "away_team_id"
  | "kickoff_at"
  | "stage"
  | "status"
  | "access_scope"
  | "intake_source"
  | "source_note"
> & {
  external_id: string;
  access_scope: "admin_only";
  intake_source: "api_football";
};

type RealFixtureLabCompetition = Pick<CompetitionRow, "id" | "name">;
type RealFixtureLabTeam = Pick<TeamRow, "id" | "name">;

type RealFixtureLabResult = Pick<
  MatchResultRow,
  "home_goals" | "away_goals" | "verification_status" | "intake_source" | "source_note"
>;

export type RealFixtureLabFixtureView = {
  id: string;
  externalId: string;
  slug: string;
  kickoffAt: string;
  stage: string | null;
  status: MatchRow["status"];
  accessScope: "admin_only";
  intakeSource: "api_football";
  sourceNote: string | null;
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  result: RealFixtureLabResult | null;
};

export type RealFixtureLabData =
  | {
      status: "ready";
      selectedExternalId: string | null;
      fixtures: RealFixtureLabFixtureView[];
    }
  | {
      status: "unavailable";
      selectedExternalId: string | null;
      message: string;
    };

export type GetAdminRealFixtureLabDataOptions = {
  externalId?: string | null;
};

function unavailable(selectedExternalId: string | null): RealFixtureLabData {
  return {
    status: "unavailable",
    selectedExternalId,
    message: "No fue posible consultar los fixtures reales internos en este momento.",
  };
}

export function mapRealFixtureLabFixtureView(args: {
  match: RealFixtureLabMatch;
  competition: RealFixtureLabCompetition | null;
  homeTeam: RealFixtureLabTeam | null;
  awayTeam: RealFixtureLabTeam | null;
  result: RealFixtureLabResult | null;
}): RealFixtureLabFixtureView {
  const { match, competition, homeTeam, awayTeam, result } = args;

  return {
    id: match.id,
    externalId: match.external_id,
    slug: match.slug,
    kickoffAt: match.kickoff_at,
    stage: match.stage,
    status: match.status,
    accessScope: match.access_scope,
    intakeSource: match.intake_source,
    sourceNote: match.source_note,
    competitionName: competition?.name ?? "Competicion no disponible",
    homeTeamName: homeTeam?.name ?? "Equipo local no disponible",
    awayTeamName: awayTeam?.name ?? "Equipo visitante no disponible",
    result,
  };
}

export async function getAdminRealFixtureLabData(
  options: GetAdminRealFixtureLabDataOptions = {},
): Promise<RealFixtureLabData> {
  const selectedExternalId = options.externalId?.trim() || null;
  const supabase = await createSupabaseServerClient();
  let matchQuery = supabase
    .from("matches")
    .select(
      "id, external_id, slug, competition_id, home_team_id, away_team_id, kickoff_at, stage, status, access_scope, intake_source, source_note",
    )
    .eq("access_scope", "admin_only")
    .eq("intake_source", "api_football");

  if (selectedExternalId) {
    matchQuery = matchQuery.eq("external_id", selectedExternalId);
  }

  const { data: matchData, error: matchError } = await matchQuery.order("kickoff_at");

  if (matchError) {
    return unavailable(selectedExternalId);
  }

  const matches = (matchData ?? []) as RealFixtureLabMatch[];

  if (matches.length === 0) {
    return {
      status: "ready",
      selectedExternalId,
      fixtures: [],
    };
  }

  const competitionIds = Array.from(new Set(matches.map((match) => match.competition_id)));
  const teamIds = Array.from(new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id])));
  const matchIds = matches.map((match) => match.id);

  const [
    { data: competitionData, error: competitionError },
    { data: teamData, error: teamError },
    { data: resultData, error: resultError },
  ] = await Promise.all([
    supabase.from("competitions").select("id, name").in("id", competitionIds),
    supabase.from("teams").select("id, name").in("id", teamIds),
    supabase
      .from("match_results")
      .select("match_id, home_goals, away_goals, verification_status, intake_source, source_note")
      .in("match_id", matchIds),
  ]);

  if (competitionError || teamError || resultError) {
    return unavailable(selectedExternalId);
  }

  const competitions = (competitionData ?? []) as RealFixtureLabCompetition[];
  const teams = (teamData ?? []) as RealFixtureLabTeam[];
  const results = ((resultData ?? []) as (RealFixtureLabResult & { match_id: string })[]);
  const competitionById = new Map(competitions.map((competition) => [competition.id, competition]));
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const resultByMatchId = new Map(results.map((result) => [result.match_id, result]));

  return {
    status: "ready",
    selectedExternalId,
    fixtures: matches.map((match) =>
      mapRealFixtureLabFixtureView({
        match,
        competition: competitionById.get(match.competition_id) ?? null,
        homeTeam: teamById.get(match.home_team_id) ?? null,
        awayTeam: teamById.get(match.away_team_id) ?? null,
        result: resultByMatchId.get(match.id) ?? null,
      }),
    ),
  };
}
