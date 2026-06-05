import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CompetitionRow,
  MatchResultRow,
  MatchRow,
  ModelVersionRow,
  PredictionMarketRow,
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
  | "reviewed_at"
  | "reviewed_by"
> & {
  intake_source: Exclude<MatchRow["intake_source"], "api_football">;
};
type LabResult = Pick<
  MatchResultRow,
  | "match_id"
  | "home_goals"
  | "away_goals"
  | "verification_status"
  | "intake_source"
  | "source_note"
  | "reviewed_at"
  | "reviewed_by"
> & {
  intake_source: Exclude<MatchResultRow["intake_source"], "api_football">;
};
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
type LabMarket = Pick<PredictionMarketRow, "prediction_version_id" | "market" | "selection">;
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
  intakeSource: Exclude<MatchRow["intake_source"], "api_football">;
  dataQuality: MatchRow["data_quality"];
  sourceNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  result: LabResult | null;
  prediction:
    | {
        id: string;
        modelVersion: string;
        runScope: PredictionVersionRow["run_scope"];
        mostLikelyScore: string;
        confidenceScore: number;
        riskLevel: PredictionVersionRow["risk_level"];
        hasCompleteMarkets: boolean;
        hasVerifiedResult: boolean;
        hasPersistedEvaluation: boolean;
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

function hasCompleteEvaluationMarkets(markets: LabMarket[]) {
  const expectedKeys = new Set(["btts:yes", "btts:no", "over_2_5:over", "over_2_5:under"]);
  const presentKeys = new Set<string>();

  for (const market of markets) {
    if (market.market !== "btts" && market.market !== "over_2_5") {
      continue;
    }

    const key = `${market.market}:${market.selection}`;

    if (!expectedKeys.has(key) || presentKeys.has(key)) {
      return false;
    }

    presentKeys.add(key);
  }

  return presentKeys.size === expectedKeys.size;
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
      "id, competition_id, home_team_id, away_team_id, stage, kickoff_at, lab_status, intake_source, data_quality, source_note, reviewed_at, reviewed_by",
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
      .select(
        "match_id, home_goals, away_goals, verification_status, intake_source, source_note, reviewed_at, reviewed_by",
      )
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
  let markets: LabMarket[] = [];

  if (predictions.length > 0) {
    const [
      { data: modelVersionData, error: modelVersionError },
      { data: evaluationData, error: evaluationError },
      { data: marketData, error: marketError },
    ] = await Promise.all([
      supabase.from("model_versions").select("id, version").in("id", modelVersionIds),
      supabase
        .from("prediction_results")
        .select(
          "prediction_version_id, winner_correct, btts_correct, over_2_5_correct, exact_score_correct, goal_error, error_summary",
        )
        .in("prediction_version_id", predictionIds),
      supabase
        .from("prediction_markets")
        .select("prediction_version_id, market, selection")
        .in("prediction_version_id", predictionIds)
        .in("market", ["btts", "over_2_5"]),
    ]);

    if (modelVersionError || evaluationError || marketError) {
      return unavailable();
    }

    modelVersions = (modelVersionData ?? []) as LabModelVersion[];
    evaluations = (evaluationData ?? []) as LabEvaluation[];
    markets = (marketData ?? []) as LabMarket[];
  }

  const competitionById = new Map(competitions.map((competition) => [competition.id, competition]));
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const resultByMatchId = new Map(results.map((result) => [result.match_id, result]));
  const modelVersionById = new Map(modelVersions.map((version) => [version.id, version]));
  const evaluationByPredictionId = new Map(
    evaluations.map((evaluation) => [evaluation.prediction_version_id, evaluation]),
  );
  const marketsByPredictionId = new Map<string, LabMarket[]>();

  markets.forEach((market) => {
    const predictionMarkets = marketsByPredictionId.get(market.prediction_version_id) ?? [];
    predictionMarkets.push(market);
    marketsByPredictionId.set(market.prediction_version_id, predictionMarkets);
  });
  const latestPredictionByMatchId = new Map<string, LabPrediction>();

  predictions.forEach((prediction) => {
    if (!latestPredictionByMatchId.has(prediction.match_id)) {
      latestPredictionByMatchId.set(prediction.match_id, prediction);
    }
  });

  const fixtures = matches.map((match) => {
    const prediction = latestPredictionByMatchId.get(match.id);
    const result = resultByMatchId.get(match.id) ?? null;
    const evaluation = prediction ? evaluationByPredictionId.get(prediction.id) ?? null : null;

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
      reviewedAt: match.reviewed_at,
      reviewedBy: match.reviewed_by,
      result,
      prediction: prediction
        ? {
            id: prediction.id,
            modelVersion:
              modelVersionById.get(prediction.model_version_id)?.version ?? "version no disponible",
            runScope: prediction.run_scope,
            mostLikelyScore: prediction.most_likely_score,
            confidenceScore: prediction.confidence_score,
            riskLevel: prediction.risk_level,
            hasCompleteMarkets: hasCompleteEvaluationMarkets(marketsByPredictionId.get(prediction.id) ?? []),
            hasVerifiedResult: result?.verification_status === "verified",
            hasPersistedEvaluation: evaluation !== null,
            evaluation,
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
