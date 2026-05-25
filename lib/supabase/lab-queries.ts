import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CompetitionRow,
  MatchResultRow,
  MatchRow,
  ModelVersionRow,
  PredictionResultRow,
  PredictionVersionRow,
  TeamRow,
} from "@/types/database";

type LabCompetition = Pick<CompetitionRow, "id" | "name" | "usage_scope">;
type LabTeam = Pick<TeamRow, "id" | "name">;
type LabMatch = Pick<
  MatchRow,
  | "id"
  | "competition_id"
  | "home_team_id"
  | "away_team_id"
  | "stage"
  | "kickoff_at"
  | "lab_status"
  | "intake_source"
  | "data_quality"
  | "source_note"
>;
type LabResult = Pick<
  MatchResultRow,
  "match_id" | "home_goals" | "away_goals" | "verification_status"
>;
type LabPrediction = Pick<
  PredictionVersionRow,
  | "id"
  | "match_id"
  | "model_version_id"
  | "run_scope"
  | "most_likely_score"
  | "confidence_score"
  | "risk_level"
  | "created_at"
>;
type LabModelVersion = Pick<ModelVersionRow, "id" | "version">;
type LabEvaluation = Pick<
  PredictionResultRow,
  | "prediction_version_id"
  | "winner_correct"
  | "btts_correct"
  | "over_2_5_correct"
  | "exact_score_correct"
  | "goal_error"
  | "error_summary"
>;

export type LabFixtureView = {
  id: string;
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  stage: string | null;
  kickoffAt: string;
  labStatus: MatchRow["lab_status"];
  intakeSource: MatchRow["intake_source"];
  dataQuality: MatchRow["data_quality"];
  sourceNote: string | null;
  result: LabResult | null;
  prediction:
    | {
        id: string;
        modelVersion: string;
        runScope: PredictionVersionRow["run_scope"];
        mostLikelyScore: string;
        confidenceScore: number;
        riskLevel: PredictionVersionRow["risk_level"];
        evaluation: LabEvaluation | null;
      }
    | null;
};

export type LabDashboardData =
  | {
      status: "ready";
      fixtures: LabFixtureView[];
      predictionCount: number;
      registeredResultCount: number;
      persistedEvaluationCount: number;
    }
  | {
      status: "unavailable";
      message: string;
    };

function unavailable(): LabDashboardData {
  return {
    status: "unavailable",
    message: "No fue posible consultar los datos internos del laboratorio en este momento.",
  };
}

export async function getAdminLabDashboardData(): Promise<LabDashboardData> {
  const supabase = await createSupabaseServerClient();
  const { data: competitionData, error: competitionError } = await supabase
    .from("competitions")
    .select("id, name, usage_scope")
    .eq("usage_scope", "internal_lab")
    .order("name");

  if (competitionError) {
    return unavailable();
  }

  const competitions = (competitionData ?? []) as LabCompetition[];

  if (competitions.length === 0) {
    return {
      status: "ready",
      fixtures: [],
      predictionCount: 0,
      registeredResultCount: 0,
      persistedEvaluationCount: 0,
    };
  }

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select(
      "id, competition_id, home_team_id, away_team_id, stage, kickoff_at, lab_status, intake_source, data_quality, source_note",
    )
    .in(
      "competition_id",
      competitions.map((competition) => competition.id),
    )
    .eq("access_scope", "lab_only")
    .order("kickoff_at");

  if (matchError) {
    return unavailable();
  }

  const matches = (matchData ?? []) as LabMatch[];

  if (matches.length === 0) {
    return {
      status: "ready",
      fixtures: [],
      predictionCount: 0,
      registeredResultCount: 0,
      persistedEvaluationCount: 0,
    };
  }

  const matchIds = matches.map((match) => match.id);
  const teamIds = Array.from(
    new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id])),
  );
  const [
    { data: teamData, error: teamError },
    { data: resultData, error: resultError },
    { data: predictionData, error: predictionError },
  ] = await Promise.all([
    supabase.from("teams").select("id, name").in("id", teamIds),
    supabase
      .from("match_results")
      .select("match_id, home_goals, away_goals, verification_status")
      .in("match_id", matchIds),
    supabase
      .from("prediction_versions")
      .select(
        "id, match_id, model_version_id, run_scope, most_likely_score, confidence_score, risk_level, created_at",
      )
      .in("match_id", matchIds)
      .eq("run_scope", "internal_lab")
      .order("created_at", { ascending: false }),
  ]);

  if (teamError || resultError || predictionError) {
    return unavailable();
  }

  const teams = (teamData ?? []) as LabTeam[];
  const results = (resultData ?? []) as LabResult[];
  const predictions = (predictionData ?? []) as LabPrediction[];
  const predictionIds = predictions.map((prediction) => prediction.id);
  const modelVersionIds = Array.from(
    new Set(predictions.map((prediction) => prediction.model_version_id)),
  );

  let modelVersions: LabModelVersion[] = [];
  let evaluations: LabEvaluation[] = [];

  if (predictions.length > 0) {
    const [
      { data: modelVersionData, error: modelVersionError },
      { data: evaluationData, error: evaluationError },
    ] = await Promise.all([
      supabase.from("model_versions").select("id, version").in("id", modelVersionIds),
      supabase
        .from("prediction_results")
        .select(
          "prediction_version_id, winner_correct, btts_correct, over_2_5_correct, exact_score_correct, goal_error, error_summary",
        )
        .in("prediction_version_id", predictionIds),
    ]);

    if (modelVersionError || evaluationError) {
      return unavailable();
    }

    modelVersions = (modelVersionData ?? []) as LabModelVersion[];
    evaluations = (evaluationData ?? []) as LabEvaluation[];
  }

  const competitionById = new Map(competitions.map((competition) => [competition.id, competition]));
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const resultByMatchId = new Map(results.map((result) => [result.match_id, result]));
  const modelVersionById = new Map(modelVersions.map((version) => [version.id, version]));
  const evaluationByPredictionId = new Map(
    evaluations.map((evaluation) => [evaluation.prediction_version_id, evaluation]),
  );
  const latestPredictionByMatchId = new Map<string, LabPrediction>();

  predictions.forEach((prediction) => {
    if (!latestPredictionByMatchId.has(prediction.match_id)) {
      latestPredictionByMatchId.set(prediction.match_id, prediction);
    }
  });

  const fixtures = matches.map((match) => {
    const prediction = latestPredictionByMatchId.get(match.id);

    return {
      id: match.id,
      competitionName: competitionById.get(match.competition_id)?.name ?? "Competencia interna",
      homeTeamName: teamById.get(match.home_team_id)?.name ?? "Equipo local",
      awayTeamName: teamById.get(match.away_team_id)?.name ?? "Equipo visitante",
      stage: match.stage,
      kickoffAt: match.kickoff_at,
      labStatus: match.lab_status,
      intakeSource: match.intake_source,
      dataQuality: match.data_quality,
      sourceNote: match.source_note,
      result: resultByMatchId.get(match.id) ?? null,
      prediction: prediction
        ? {
            id: prediction.id,
            modelVersion:
              modelVersionById.get(prediction.model_version_id)?.version ?? "version no disponible",
            runScope: prediction.run_scope,
            mostLikelyScore: prediction.most_likely_score,
            confidenceScore: prediction.confidence_score,
            riskLevel: prediction.risk_level,
            evaluation: evaluationByPredictionId.get(prediction.id) ?? null,
          }
        : null,
    } satisfies LabFixtureView;
  });

  return {
    status: "ready",
    fixtures,
    predictionCount: predictions.length,
    registeredResultCount: results.length,
    persistedEvaluationCount: evaluations.length,
  };
}
