import "server-only";

import { isLaunchSafePublicMatch } from "@/lib/supabase/public-launch-filters";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchRow, PredictionVersionRow } from "@/types/database";

export type PublicPredictionViewer = "anonymous" | "registered_free";

type PublicPredictionSummaryRow = {
  match_slug: string;
  kickoff_at: string;
  stage: string | null;
  status: MatchRow["status"];
  competition_name: string;
  competition_slug: string;
  home_team_name: string;
  home_team_slug: string;
  home_team_logo_url: string | null;
  home_team_flag_url: string | null;
  away_team_name: string;
  away_team_slug: string;
  away_team_logo_url: string | null;
  away_team_flag_url: string | null;
  venue_name: string | null;
  venue_city: string | null;
  verified_home_goals: number | null;
  verified_away_goals: number | null;
  result_verification_status: "verified" | null;
  prediction_created_at: string;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  confidence_score: number;
  risk_level: PredictionVersionRow["risk_level"];
};

export type PublicVerifiedResultView = {
  homeGoals: number;
  awayGoals: number;
  verificationStatus: "verified";
};

type PublicPredictionCardBaseView = {
  predictionCreatedAt: string;
  viewer: PublicPredictionViewer;
  matchSlug: string;
  kickoffAt: string;
  stage: string | null;
  status: MatchRow["status"];
  competitionName: string;
  competitionSlug: string;
  homeTeamName: string;
  homeTeamSlug: string;
  homeTeamLogoUrl: string | null;
  homeTeamFlagUrl: string | null;
  awayTeamName: string;
  awayTeamSlug: string;
  awayTeamLogoUrl: string | null;
  awayTeamFlagUrl: string | null;
  venueName: string | null;
  venueCity: string | null;
  verifiedResult: PublicVerifiedResultView | null;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
};

export type PublicPredictionCardAnonymousView = PublicPredictionCardBaseView & {
  viewer: "anonymous";
};

export type PublicPredictionCardRegisteredView = PublicPredictionCardBaseView & {
  viewer: "registered_free";
  confidenceScore: number;
  riskLevel: PredictionVersionRow["risk_level"];
};

export type PublicPredictionCardView =
  | PublicPredictionCardAnonymousView
  | PublicPredictionCardRegisteredView;

export type PublicPredictionsData =
  | {
      status: "ready";
      upcomingPredictions: PublicPredictionCardView[];
      historicalPredictions: PublicPredictionCardView[];
    }
  | {
      status: "unavailable";
      message: string;
    };

function unavailable(): PublicPredictionsData {
  return {
    status: "unavailable",
    message: "No fue posible consultar las predicciones públicas en este momento.",
  };
}

function toCardBaseView(prediction: PublicPredictionSummaryRow): PublicPredictionCardBaseView {
  const verifiedResult =
    prediction.result_verification_status === "verified" &&
    prediction.verified_home_goals !== null &&
    prediction.verified_away_goals !== null
      ? {
          homeGoals: prediction.verified_home_goals,
          awayGoals: prediction.verified_away_goals,
          verificationStatus: "verified" as const,
        }
      : null;

  return {
    viewer: "anonymous",
    predictionCreatedAt: prediction.prediction_created_at,
    matchSlug: prediction.match_slug,
    kickoffAt: prediction.kickoff_at,
    stage: prediction.stage,
    status: prediction.status,
    competitionName: prediction.competition_name,
    competitionSlug: prediction.competition_slug,
    homeTeamName: prediction.home_team_name,
    homeTeamSlug: prediction.home_team_slug,
    homeTeamLogoUrl: prediction.home_team_logo_url,
    homeTeamFlagUrl: prediction.home_team_flag_url,
    awayTeamName: prediction.away_team_name,
    awayTeamSlug: prediction.away_team_slug,
    awayTeamLogoUrl: prediction.away_team_logo_url,
    awayTeamFlagUrl: prediction.away_team_flag_url,
    venueName: prediction.venue_name,
    venueCity: prediction.venue_city,
    verifiedResult,
    homeWinProb: prediction.home_win_prob,
    drawProb: prediction.draw_prob,
    awayWinProb: prediction.away_win_prob,
  };
}

function getUpcomingPriority(status: MatchRow["status"]) {
  switch (status) {
    case "live":
      return 0;
    case "scheduled":
      return 1;
    case "postponed":
      return 2;
    case "cancelled":
      return 3;
    case "finished":
      return 4;
    default:
      return 5;
  }
}

export function sortUpcomingPredictions(predictions: PublicPredictionCardView[]) {
  return [...predictions].sort((left, right) => {
    const statusDelta = getUpcomingPriority(left.status) - getUpcomingPriority(right.status);
    if (statusDelta !== 0) return statusDelta;

    return new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime();
  });
}

export function sortHistoricalPredictions(predictions: PublicPredictionCardView[]) {
  return [...predictions].sort(
    (left, right) => new Date(right.kickoffAt).getTime() - new Date(left.kickoffAt).getTime(),
  );
}

export function toPredictionCardView(
  prediction: PublicPredictionSummaryRow,
  viewer: PublicPredictionViewer,
): PublicPredictionCardView {
  const base = toCardBaseView(prediction);

  if (viewer === "registered_free") {
    return {
      ...base,
      viewer,
      confidenceScore: prediction.confidence_score,
      riskLevel: prediction.risk_level,
    };
  }

  return {
    ...base,
    viewer,
  };
}

export async function getPublicPredictionsData(
  viewer: PublicPredictionViewer,
): Promise<PublicPredictionsData> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return unavailable();
  }

  const { data, error } = await supabase
    .from("public_prediction_summaries")
    .select(
      "match_slug, kickoff_at, stage, status, competition_name, competition_slug, home_team_name, home_team_slug, home_team_logo_url, home_team_flag_url, away_team_name, away_team_slug, away_team_logo_url, away_team_flag_url, venue_name, venue_city, verified_home_goals, verified_away_goals, result_verification_status, prediction_created_at, home_win_prob, draw_prob, away_win_prob, confidence_score, risk_level",
    )
    .order("kickoff_at");

  if (error) {
    return unavailable();
  }

  const predictions = ((data ?? []) as PublicPredictionSummaryRow[])
    .filter((prediction) =>
      isLaunchSafePublicMatch(prediction.match_slug, prediction.competition_slug),
    )
    .map((prediction) => toPredictionCardView(prediction, viewer));

  return {
    status: "ready",
    upcomingPredictions: sortUpcomingPredictions(
      predictions.filter((prediction) => prediction.status !== "finished"),
    ),
    historicalPredictions: sortHistoricalPredictions(
      predictions.filter((prediction) => prediction.status === "finished"),
    ),
  };
}
