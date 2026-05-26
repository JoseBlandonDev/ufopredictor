import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchRow, PredictionVersionRow } from "@/types/database";

type PublicMatchDetailRow = {
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
};

type PublicMatchPredictionRow = {
  prediction_created_at: string;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  confidence_score: number;
  risk_level: PredictionVersionRow["risk_level"];
};

export type PublicMatchDetailView = {
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
  prediction: {
    createdAt: string;
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
    confidenceScore: number;
    riskLevel: PredictionVersionRow["risk_level"];
  } | null;
};

export type PublicMatchDetailData =
  | {
      status: "ready";
      match: PublicMatchDetailView;
    }
  | {
      status: "not_found";
    }
  | {
      status: "unavailable";
      message: string;
    };

function unavailable(): PublicMatchDetailData {
  return {
    status: "unavailable",
    message: "No fue posible consultar el detalle público del partido en este momento.",
  };
}

export async function getPublicMatchDetailData(slug: string): Promise<PublicMatchDetailData> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return unavailable();
  }

  const { data: matchData, error: matchError } = await supabase
    .from("public_match_details")
    .select(
      "match_slug, kickoff_at, stage, status, competition_name, competition_slug, home_team_name, home_team_slug, home_team_logo_url, home_team_flag_url, away_team_name, away_team_slug, away_team_logo_url, away_team_flag_url, venue_name, venue_city",
    )
    .eq("match_slug", slug)
    .maybeSingle();

  if (matchError) {
    return unavailable();
  }

  if (!matchData) {
    return { status: "not_found" };
  }

  const { data: predictionData, error: predictionError } = await supabase
    .from("public_prediction_summaries")
    .select(
      "prediction_created_at, home_win_prob, draw_prob, away_win_prob, confidence_score, risk_level",
    )
    .eq("match_slug", slug)
    .maybeSingle();

  if (predictionError) {
    return unavailable();
  }

  const match = matchData as PublicMatchDetailRow;
  const prediction = predictionData as PublicMatchPredictionRow | null;

  return {
    status: "ready",
    match: {
      matchSlug: match.match_slug,
      kickoffAt: match.kickoff_at,
      stage: match.stage,
      status: match.status,
      competitionName: match.competition_name,
      competitionSlug: match.competition_slug,
      homeTeamName: match.home_team_name,
      homeTeamSlug: match.home_team_slug,
      homeTeamLogoUrl: match.home_team_logo_url,
      homeTeamFlagUrl: match.home_team_flag_url,
      awayTeamName: match.away_team_name,
      awayTeamSlug: match.away_team_slug,
      awayTeamLogoUrl: match.away_team_logo_url,
      awayTeamFlagUrl: match.away_team_flag_url,
      venueName: match.venue_name,
      venueCity: match.venue_city,
      prediction: prediction
        ? {
            createdAt: prediction.prediction_created_at,
            homeWinProb: prediction.home_win_prob,
            drawProb: prediction.draw_prob,
            awayWinProb: prediction.away_win_prob,
            confidenceScore: prediction.confidence_score,
            riskLevel: prediction.risk_level,
          }
        : null,
    },
  };
}
