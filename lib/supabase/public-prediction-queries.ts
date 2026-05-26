import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchRow, PredictionVersionRow } from "@/types/database";

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
  prediction_created_at: string;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  confidence_score: number;
  risk_level: PredictionVersionRow["risk_level"];
};

export type PublicPredictionCardView = {
  predictionCreatedAt: string;
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
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  confidenceScore: number;
  riskLevel: PredictionVersionRow["risk_level"];
};

export type PublicPredictionsData =
  | {
      status: "ready";
      predictions: PublicPredictionCardView[];
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

function toCardView(prediction: PublicPredictionSummaryRow): PublicPredictionCardView {
  return {
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
    homeWinProb: prediction.home_win_prob,
    drawProb: prediction.draw_prob,
    awayWinProb: prediction.away_win_prob,
    confidenceScore: prediction.confidence_score,
    riskLevel: prediction.risk_level,
  };
}

export async function getPublicPredictionsData(): Promise<PublicPredictionsData> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return unavailable();
  }

  const { data, error } = await supabase
    .from("public_prediction_summaries")
    .select(
      "match_slug, kickoff_at, stage, status, competition_name, competition_slug, home_team_name, home_team_slug, home_team_logo_url, home_team_flag_url, away_team_name, away_team_slug, away_team_logo_url, away_team_flag_url, venue_name, venue_city, prediction_created_at, home_win_prob, draw_prob, away_win_prob, confidence_score, risk_level",
    )
    .order("kickoff_at");

  if (error) {
    return unavailable();
  }

  return {
    status: "ready",
    predictions: ((data ?? []) as PublicPredictionSummaryRow[]).map(toCardView),
  };
}
