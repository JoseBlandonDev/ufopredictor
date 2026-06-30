import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CompetitionRow,
  MatchResultRow,
  MatchRow,
  PredictionResultRow,
  PredictionVersionRow,
  TeamRow,
} from "@/types/database";

const WORLD_CUP_COMPETITION_SLUG = "world-cup-2026";
const INTERNAL_PREDICTION_TYPE = "pre_match_24h";
const INTERNAL_RUN_SCOPE = "internal_lab";
const PUBLIC_RUN_SCOPE = "public_product";

type EvaluationQueueResultRow = Pick<
  MatchResultRow,
  | "id"
  | "match_id"
  | "home_goals"
  | "away_goals"
  | "decision_method"
  | "regulation_home_goals"
  | "regulation_away_goals"
  | "after_extra_time_home_goals"
  | "after_extra_time_away_goals"
  | "penalty_home_goals"
  | "penalty_away_goals"
  | "advancing_team_id"
  | "verification_status"
  | "reviewed_at"
> & {
  verification_status: "verified";
};

type EvaluationQueueMatchRow = Pick<
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

type EvaluationQueueCompetitionRow = Pick<CompetitionRow, "id" | "name" | "slug">;
type EvaluationQueueTeamRow = Pick<TeamRow, "id" | "name">;
type EvaluationQueuePredictionRow = Pick<
  PredictionVersionRow,
  "id" | "match_id" | "run_scope" | "prediction_type" | "created_at"
>;
type EvaluationQueuePredictionResultRow = Pick<
  PredictionResultRow,
  "id" | "prediction_version_id" | "validated_at"
>;

export type RealFixtureEvaluationQueueRow = {
  matchId: string;
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
  decisionMethod: MatchResultRow["decision_method"];
  regulationHomeGoals: number | null;
  regulationAwayGoals: number | null;
  afterExtraTimeHomeGoals: number | null;
  afterExtraTimeAwayGoals: number | null;
  penaltyHomeGoals: number | null;
  penaltyAwayGoals: number | null;
  advancingTeamName: string | null;
  verificationStatus: "verified";
  reviewedAt: string | null;
  internalPredictionId: string;
  latestPublicPredictionId: string | null;
  evaluationStatus: "pending" | "ineligible";
  evaluationIneligibleReason: string | null;
};

export type RealFixtureEvaluationQueueData = {
  rows: RealFixtureEvaluationQueueRow[];
};

function parseApiFootballFixtureId(externalId: string) {
  const match = /^api-football:fixture:(\d+)$/.exec(externalId);
  return match ? match[1] : null;
}

function mapById<T extends { id: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.id, row]));
}

function buildLatestPredictionMap(
  rows: EvaluationQueuePredictionRow[] | null | undefined,
  runScope: typeof INTERNAL_RUN_SCOPE | typeof PUBLIC_RUN_SCOPE,
) {
  const latestByMatchId = new Map<string, EvaluationQueuePredictionRow>();

  for (const row of rows ?? []) {
    if (row.run_scope !== runScope || row.prediction_type !== INTERNAL_PREDICTION_TYPE) {
      continue;
    }

    if (!latestByMatchId.has(row.match_id)) {
      latestByMatchId.set(row.match_id, row);
    }
  }

  return latestByMatchId;
}

export async function getRealFixtureEvaluationQueueData(): Promise<RealFixtureEvaluationQueueData> {
  const supabase = await createSupabaseServerClient();

  const { data: resultData, error: resultError } = await supabase
    .from("match_results")
    .select("id, match_id, home_goals, away_goals, decision_method, regulation_home_goals, regulation_away_goals, after_extra_time_home_goals, after_extra_time_away_goals, penalty_home_goals, penalty_away_goals, advancing_team_id, verification_status, reviewed_at")
    .eq("verification_status", "verified")
    .order("reviewed_at", { ascending: false });

  if (resultError) {
    throw new Error(`No fue posible leer resultados verificados para evaluacion: ${resultError.message}`);
  }

  const results = (resultData ?? []) as EvaluationQueueResultRow[];
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
    throw new Error(`No fue posible leer fixtures verificados para evaluacion: ${matchError.message}`);
  }

  const matches = (matchData ?? []) as EvaluationQueueMatchRow[];
  if (matches.length === 0) {
    return { rows: [] };
  }

  const competitionIds = [...new Set(matches.map((match) => match.competition_id))];
  const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];

  const [
    { data: competitionData, error: competitionError },
    { data: teamData, error: teamError },
    { data: predictionData, error: predictionError },
  ] = await Promise.all([
    supabase.from("competitions").select("id, name, slug").in("id", competitionIds),
    supabase.from("teams").select("id, name").in("id", teamIds),
    supabase
      .from("prediction_versions")
      .select("id, match_id, run_scope, prediction_type, created_at")
      .in("match_id", matches.map((match) => match.id))
      .eq("prediction_type", INTERNAL_PREDICTION_TYPE)
      .in("run_scope", [INTERNAL_RUN_SCOPE, PUBLIC_RUN_SCOPE])
      .order("created_at", { ascending: false }),
  ]);

  if (competitionError) {
    throw new Error(`No fue posible leer competencias para evaluacion: ${competitionError.message}`);
  }

  if (teamError) {
    throw new Error(`No fue posible leer equipos para evaluacion: ${teamError.message}`);
  }

  if (predictionError) {
    throw new Error(`No fue posible leer predicciones para evaluacion: ${predictionError.message}`);
  }

  const internalPredictionByMatchId = buildLatestPredictionMap(
    (predictionData ?? []) as EvaluationQueuePredictionRow[],
    INTERNAL_RUN_SCOPE,
  );
  const publicPredictionByMatchId = buildLatestPredictionMap(
    (predictionData ?? []) as EvaluationQueuePredictionRow[],
    PUBLIC_RUN_SCOPE,
  );

  const internalPredictionIds = [...new Set([...internalPredictionByMatchId.values()].map((row) => row.id))];
  const { data: evaluationData, error: evaluationError } = await supabase
    .from("prediction_results")
    .select("id, prediction_version_id, validated_at")
    .in("prediction_version_id", internalPredictionIds);

  if (evaluationError) {
    throw new Error(`No fue posible leer evaluaciones internas existentes: ${evaluationError.message}`);
  }

  const evaluationByPredictionId = new Map(
    ((evaluationData ?? []) as EvaluationQueuePredictionResultRow[]).map((row) => [row.prediction_version_id, row]),
  );
  const resultByMatchId = new Map(results.map((result) => [result.match_id, result]));
  const competitionById = mapById((competitionData ?? []) as EvaluationQueueCompetitionRow[]);
  const teamById = mapById((teamData ?? []) as EvaluationQueueTeamRow[]);

  const rows = matches
    .map((match) => {
      const result = resultByMatchId.get(match.id);
      const competition = competitionById.get(match.competition_id);
      const internalPrediction = internalPredictionByMatchId.get(match.id);
      const latestPublicPrediction = publicPredictionByMatchId.get(match.id) ?? null;

      if (!result || !competition || competition.slug !== WORLD_CUP_COMPETITION_SLUG || !internalPrediction) {
        return null;
      }

      if (evaluationByPredictionId.has(internalPrediction.id)) {
        return null;
      }

      return {
        matchId: match.id,
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
        decisionMethod: result.decision_method,
        regulationHomeGoals: result.regulation_home_goals,
        regulationAwayGoals: result.regulation_away_goals,
        afterExtraTimeHomeGoals: result.after_extra_time_home_goals,
        afterExtraTimeAwayGoals: result.after_extra_time_away_goals,
        penaltyHomeGoals: result.penalty_home_goals,
        penaltyAwayGoals: result.penalty_away_goals,
        advancingTeamName:
          result.advancing_team_id ? teamById.get(result.advancing_team_id)?.name ?? null : null,
        verificationStatus: "verified",
        reviewedAt: result.reviewed_at,
        internalPredictionId: internalPrediction.id,
        latestPublicPredictionId: latestPublicPrediction?.id ?? null,
        evaluationStatus: result.decision_method === "ft" ? "pending" : "ineligible",
        evaluationIneligibleReason:
          result.decision_method === "ft" ? null : "knockout_evaluation_policy_unconfirmed",
      } satisfies RealFixtureEvaluationQueueRow;
    })
    .filter((row): row is RealFixtureEvaluationQueueRow => row !== null)
    .sort((left, right) => new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime());

  return { rows };
}
