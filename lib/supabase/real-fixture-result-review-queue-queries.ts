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
  | "source_note"
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
  resultIntakeSource: MatchResultRow["intake_source"];
  sourceNote: string | null;
  recordedAt: string;
};

export type RealFixtureManualResultCandidateRow = {
  matchId: string;
  externalId: string;
  apiFootballFixtureId: string | null;
  slug: string;
  kickoffAt: string;
  matchStatus: MatchRow["status"];
  accessScope: Extract<MatchRow["access_scope"], "admin_only" | "public">;
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  existingResultState: "no_result";
};

export type RealFixtureResultReviewQueueData = {
  rows: RealFixtureResultReviewQueueRow[];
  manualCandidates: RealFixtureManualResultCandidateRow[];
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
  const nowIso = new Date().toISOString();

  const { data: resultData, error: resultError } = await supabase
    .from("match_results")
    .select("id, match_id, home_goals, away_goals, verification_status, intake_source, source_note, recorded_at")
    .eq("verification_status", "pending_review")
    .order("recorded_at", { ascending: false });

  if (resultError) {
    throw new Error(`No fue posible leer resultados pendientes de revision: ${resultError.message}`);
  }

  const results = (resultData ?? []) as ResultReviewQueueResultRow[];
  const [pendingMatchDataResult, manualCandidateMatchDataResult] = await Promise.all([
    results.length > 0
      ? supabase
          .from("matches")
          .select("id, external_id, slug, competition_id, home_team_id, away_team_id, kickoff_at, status, access_scope, intake_source")
          .in("id", [...new Set(results.map((result) => result.match_id))])
          .eq("intake_source", "api_football")
          .in("access_scope", ["admin_only", "public"])
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("matches")
      .select("id, external_id, slug, competition_id, home_team_id, away_team_id, kickoff_at, status, access_scope, intake_source")
      .eq("intake_source", "api_football")
      .in("access_scope", ["admin_only", "public"])
      .lte("kickoff_at", nowIso)
      .order("kickoff_at", { ascending: false }),
  ]);

  if (pendingMatchDataResult.error) {
    throw new Error(`No fue posible leer fixtures con resultados pendientes: ${pendingMatchDataResult.error.message}`);
  }

  if (manualCandidateMatchDataResult.error) {
    throw new Error(`No fue posible leer fixtures candidatos para conciliacion manual: ${manualCandidateMatchDataResult.error.message}`);
  }

  const pendingMatches = (pendingMatchDataResult.data ?? []) as ResultReviewQueueMatchRow[];
  const manualCandidateMatches = (manualCandidateMatchDataResult.data ?? []) as ResultReviewQueueMatchRow[];
  const allMatches = [...pendingMatches, ...manualCandidateMatches];

  if (allMatches.length === 0) {
    return { rows: [], manualCandidates: [] };
  }

  const uniqueMatches = [...new Map(allMatches.map((match) => [match.id, match])).values()];
  const competitionIds = [...new Set(uniqueMatches.map((match) => match.competition_id))];
  const teamIds = [...new Set(uniqueMatches.flatMap((match) => [match.home_team_id, match.away_team_id]))];

  const [
    { data: competitionData, error: competitionError },
    { data: teamData, error: teamError },
    { data: candidateResultData, error: candidateResultError },
  ] = await Promise.all([
    supabase.from("competitions").select("id, name, slug, usage_scope").in("id", competitionIds),
    supabase.from("teams").select("id, name").in("id", teamIds),
    supabase
      .from("match_results")
      .select("id, match_id, home_goals, away_goals, verification_status, intake_source, source_note, recorded_at")
      .in(
        "match_id",
        manualCandidateMatches.length > 0
          ? manualCandidateMatches.map((match) => match.id)
          : ["00000000-0000-0000-0000-000000000000"],
      ),
  ]);

  if (competitionError) {
    throw new Error(`No fue posible leer competencias de resultados pendientes: ${competitionError.message}`);
  }

  if (teamError) {
    throw new Error(`No fue posible leer equipos de resultados pendientes: ${teamError.message}`);
  }

  if (candidateResultError) {
    throw new Error(`No fue posible leer estados de resultado para conciliacion manual: ${candidateResultError.message}`);
  }

  const resultByMatchId = new Map(results.map((result) => [result.match_id, result]));
  const competitionById = mapById((competitionData ?? []) as ResultReviewQueueCompetitionRow[]);
  const teamById = mapById((teamData ?? []) as ResultReviewQueueTeamRow[]);
  const existingResultByMatchId = new Map(
    ((candidateResultData ?? []) as ResultReviewQueueResultRow[]).map((result) => [result.match_id, result]),
  );

  const rows = pendingMatches
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
        resultIntakeSource: result.intake_source,
        sourceNote: result.source_note,
        recordedAt: result.recorded_at,
      } satisfies RealFixtureResultReviewQueueRow;
    })
    .filter((row): row is RealFixtureResultReviewQueueRow => row !== null)
    .sort((left, right) => new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime());

  const manualCandidates = manualCandidateMatches
    .map((match) => {
      const competition = competitionById.get(match.competition_id);
      const existingResult = existingResultByMatchId.get(match.id) ?? null;
      const accessScope = match.access_scope;

      if (
        !competition ||
        competition.slug !== WORLD_CUP_COMPETITION_SLUG ||
        existingResult ||
        (accessScope !== "admin_only" && accessScope !== "public")
      ) {
        return null;
      }

      return {
        matchId: match.id,
        externalId: match.external_id,
        apiFootballFixtureId: parseApiFootballFixtureId(match.external_id),
        slug: match.slug,
        kickoffAt: match.kickoff_at,
        matchStatus: match.status,
        accessScope,
        competitionName: competition.name,
        homeTeamName: teamById.get(match.home_team_id)?.name ?? "Equipo local no disponible",
        awayTeamName: teamById.get(match.away_team_id)?.name ?? "Equipo visitante no disponible",
        existingResultState: "no_result",
      } satisfies RealFixtureManualResultCandidateRow;
    })
    .filter((row): row is RealFixtureManualResultCandidateRow => row !== null)
    .sort((left, right) => new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime());

  return { rows, manualCandidates };
}
