import "server-only";

import { buildPremiumMatchResource } from "@/lib/permissions/premium-match-resource";
import {
  shapePremiumMatchProjection,
  type PremiumMatchProjection,
} from "@/lib/permissions/premium-match-projection";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicPredictionViewer } from "@/lib/supabase/public-prediction-queries";
import type { MatchRow, PredictionVersionRow } from "@/types/database";
import { getPremiumMatchAccessDecision } from "./viewer-access-queries";

type PublicMatchDetailRow = {
  match_slug: string;
  match_id: string;
  kickoff_at: string;
  stage: string | null;
  status: MatchRow["status"];
  competition_name: string;
  competition_slug: string;
  competition_access_key: string;
  competition_id: string;
  home_team_name: string;
  home_team_slug: string;
  home_team_logo_url: string | null;
  home_team_flag_url: string | null;
  home_team_id: string;
  away_team_name: string;
  away_team_slug: string;
  away_team_logo_url: string | null;
  away_team_flag_url: string | null;
  away_team_id: string;
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
  prediction: PublicMatchPredictionView | null;
  premiumAccess: PublicMatchPremiumAccess;
  premiumProjection: PremiumMatchProjection;
};

export type PublicMatchPremiumAccess =
  | {
      status: "authorized";
    }
  | {
      status: "locked";
      reason: "no_entitlement";
    }
  | {
      status: "unavailable";
      reason:
        | "missing_match_context"
        | "invalid_match_context"
        | "access_decision_unavailable";
    };

type PublicMatchPremiumUnavailableReason = Extract<
  PublicMatchPremiumAccess,
  { status: "unavailable" }
>["reason"];

type PublicMatchPredictionBaseView = {
  viewer: PublicPredictionViewer;
  createdAt: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
};

export type PublicMatchPredictionAnonymousView = PublicMatchPredictionBaseView & {
  viewer: "anonymous";
};

export type PublicMatchPredictionRegisteredView = PublicMatchPredictionBaseView & {
  viewer: "registered_free";
  confidenceScore: number;
  riskLevel: PredictionVersionRow["risk_level"];
};

export type PublicMatchPredictionView =
  | PublicMatchPredictionAnonymousView
  | PublicMatchPredictionRegisteredView;

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

export function toLockedPremiumAccess(): PublicMatchPremiumAccess {
  return { status: "locked", reason: "no_entitlement" };
}

export function toUnavailablePremiumAccess(
  reason: PublicMatchPremiumUnavailableReason,
): PublicMatchPremiumAccess {
  return { status: "unavailable", reason };
}

export function toMatchPredictionView(
  prediction: PublicMatchPredictionRow,
  viewer: PublicPredictionViewer,
): PublicMatchPredictionView {
  if (viewer === "registered_free") {
    return {
      viewer,
      createdAt: prediction.prediction_created_at,
      homeWinProb: prediction.home_win_prob,
      drawProb: prediction.draw_prob,
      awayWinProb: prediction.away_win_prob,
      confidenceScore: prediction.confidence_score,
      riskLevel: prediction.risk_level,
    };
  }

  return {
    viewer,
    createdAt: prediction.prediction_created_at,
    homeWinProb: prediction.home_win_prob,
    drawProb: prediction.draw_prob,
    awayWinProb: prediction.away_win_prob,
  };
}

export async function getPublicMatchDetailData(
  slug: string,
  viewer: PublicPredictionViewer,
): Promise<PublicMatchDetailData> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return unavailable();
  }

  const { data: matchData, error: matchError } = await supabase
    .from("public_match_details")
    .select(
      "match_slug, match_id, kickoff_at, stage, status, competition_name, competition_slug, competition_access_key, competition_id, home_team_name, home_team_slug, home_team_logo_url, home_team_flag_url, home_team_id, away_team_name, away_team_slug, away_team_logo_url, away_team_flag_url, away_team_id, venue_name, venue_city",
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
  const matchResourceBuild = buildPremiumMatchResource({
    matchId: match.match_id ?? null,
    competitionAccessKey: match.competition_access_key ?? null,
    homeTeamId: match.home_team_id ?? null,
    awayTeamId: match.away_team_id ?? null,
    stageLabel: match.stage,
  });

  let premiumAccess: PublicMatchPremiumAccess;

  if (matchResourceBuild.status === "invalid") {
    premiumAccess =
      matchResourceBuild.reason === "unrecognized_world_cup_stage"
        ? toUnavailablePremiumAccess("invalid_match_context")
        : toUnavailablePremiumAccess("missing_match_context");
  } else {
    const accessDecision = await getPremiumMatchAccessDecision(matchResourceBuild.resource);
    if (accessDecision.status === "unavailable") {
      premiumAccess = toUnavailablePremiumAccess("access_decision_unavailable");
    } else if (accessDecision.access.canAccess) {
      premiumAccess = { status: "authorized" };
    } else {
      premiumAccess = toLockedPremiumAccess();
    }
  }
  const premiumProjection = shapePremiumMatchProjection(
    premiumAccess.status === "authorized"
      ? { status: "authorized" }
      : premiumAccess,
    null,
  );

  return {
    status: "ready",
    match: {
      viewer,
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
      prediction: prediction ? toMatchPredictionView(prediction, viewer) : null,
      premiumAccess,
      premiumProjection,
    },
  };
}
