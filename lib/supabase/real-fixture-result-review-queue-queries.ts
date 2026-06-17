import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CompetitionRow, MatchResultRow, MatchRow, TeamRow } from "@/types/database";

const WORLD_CUP_COMPETITION_SLUG = "world-cup-2026";

type ResultReviewQueueResultRow = Pick<
  MatchResultRow,
  | "id"
  | "match_id"
  | "home_goals"
  | "away_goals"
  | "verification_status"
  | "intake_source"
  | "recorded_at"
>;

type ResultReviewQueueMatchRow = Pick<
  MatchRow,
  | "id"
  | "external_id"
  | "slug"
  | "competition_id"
  | "home_team_id"
  | "away_team_id"
  | "kickoff_at"
  | "status"
  | "access_scope"
  | "intake_source"
> & {
  external_id: string;
  intake_source: "api_football";
};

type ResultReviewQueueCompetitionRow = Pick<
  CompetitionRow,
  "id" | "name" | "slug" | "usage_scope"
>;

type ResultReviewQueueTeamRow = Pick<TeamRow, "id" | "name">;

export type RealFixtureResultReviewQueueRow = {
  matchId: string;
  matchResultId: string;
  externalId: string;
  apiFootballFixtureId: string | null;
  slug: string;
  kickoffAt: string;
  matchStatus: MatchRow["status"];
  accessScope: MatchRow["access_scope"];
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  verificationStatus: "pending_review";
  recordedAt: string;
};

export type RealFixtureResultReviewQueueData = {
  rows: RealFixtureResultReviewQueueRow[];
};

function parseApiFootballFixtureId(externalId: string) {
  const match = /^api-football:fixture:(\d+)$/.exec(externalId);
  return match ? match[1] : null;
}

function mapById<T extends { id: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.id, row]));
}

export async function getRealFixtureResultReviewQueueData(): Promise<RealFixtureResultReviewQueueData> {
  const supabase = await createSupabaseServerClient();

  const { data: resultData, error: resultError } = await supabase
    .from("match_results")
    .select("id, match_id, home_goals, away_goals, verification_status, intake_source, recorded_at")
    .eq("verification_status", "pending_review")
    .eq("intake_source", "api_football")
    .order("recorded_at", { ascending: false });

  if (resultError) {
    throw new Error(`No fue posible leer resultados pendientes de revision: ${resultError.message}`);
  }

  const results = (resultData ?? []) as ResultReviewQueueResultRow[];
  if (results.length === 0) {
    return { rows: [] };
  }

  const matchIds = [...new Set(results.map((result) => result.match_id))];
  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("id, external_id, slug, competition_id, home_team_id, away_team_id, kickoff_at, status, access_scope, intake_source")
    .in("id", matchIds)
    .eq("intake_source", "api_football")
    .in("access_scope", ["admin_only", "public"]);

  if (matchError) {
    throw new Error(`No fue posible leer fixtures con resultados pendientes: ${matchError.message}`);
  }

  const matches = (matchData ?? []) as ResultReviewQueueMatchRow[];
  if (matches.length === 0) {
    return { rows: [] };
  }

  const competitionIds = [...new Set(matches.map((match) => match.competition_id))];
  const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];

  const [
    { data: competitionData, error: competitionError },
    { data: teamData, error: teamError },
  ] = await Promise.all([
    supabase.from("competitions").select("id, name, slug, usage_scope").in("id", competitionIds),
    supabase.from("teams").select("id, name").in("id", teamIds),
  ]);

  if (competitionError) {
    throw new Error(`No fue posible leer competencias de resultados pendientes: ${competitionError.message}`);
  }

  if (teamError) {
    throw new Error(`No fue posible leer equipos de resultados pendientes: ${teamError.message}`);
  }

  const resultByMatchId = new Map(results.map((result) => [result.match_id, result]));
  const competitionById = mapById((competitionData ?? []) as ResultReviewQueueCompetitionRow[]);
  const teamById = mapById((teamData ?? []) as ResultReviewQueueTeamRow[]);

  const rows = matches
    .map((match) => {
      const result = resultByMatchId.get(match.id);
      const competition = competitionById.get(match.competition_id);

      if (!result || !competition || competition.slug !== WORLD_CUP_COMPETITION_SLUG) {
        return null;
      }

      return {
        matchId: match.id,
        matchResultId: result.id,
        externalId: match.external_id,
        apiFootballFixtureId: parseApiFootballFixtureId(match.external_id),
        slug: match.slug,
        kickoffAt: match.kickoff_at,
        matchStatus: match.status,
        accessScope: match.access_scope,
        competitionName: competition.name,
        homeTeamName: teamById.get(match.home_team_id)?.name ?? "Equipo local no disponible",
        awayTeamName: teamById.get(match.away_team_id)?.name ?? "Equipo visitante no disponible",
        homeGoals: result.home_goals,
        awayGoals: result.away_goals,
        verificationStatus: "pending_review",
        recordedAt: result.recorded_at,
      } satisfies RealFixtureResultReviewQueueRow;
    })
    .filter((row): row is RealFixtureResultReviewQueueRow => row !== null)
    .sort((left, right) => new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime());

  return { rows };
}
