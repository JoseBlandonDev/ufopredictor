import "server-only";

import { buildPremiumMatchResource } from "@/lib/permissions/premium-match-resource";
import { type PremiumMatchProjection } from "@/lib/permissions/premium-match-projection";
import {
  resolvePremiumProjectionForMatch,
  type PremiumProjectionRpcRow,
} from "@/lib/permissions/premium-match-projection-resolver";
import { isLaunchSafePublicMatch } from "@/lib/supabase/public-launch-filters";
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
  verified_home_goals: number | null;
  verified_away_goals: number | null;
  result_decision_method: "ft" | "aet" | "pen" | null;
  verified_regulation_home_goals: number | null;
  verified_regulation_away_goals: number | null;
  verified_after_extra_time_home_goals: number | null;
  verified_after_extra_time_away_goals: number | null;
  verified_penalty_home_goals: number | null;
  verified_penalty_away_goals: number | null;
  verified_advancing_team_name: string | null;
  result_verification_status: "verified" | null;
};

type PublicMatchPredictionRow = {
  prediction_created_at: string;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  confidence_score: number;
  risk_level: PredictionVersionRow["risk_level"];
};

type AuthenticatedPublicMatchProbableScoreRow = {
  most_likely_score: string | null;
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
  verifiedResult: {
    homeGoals: number;
    awayGoals: number;
    decisionMethod: "ft" | "aet" | "pen";
    regulationHomeGoals: number | null;
    regulationAwayGoals: number | null;
    afterExtraTimeHomeGoals: number | null;
    afterExtraTimeAwayGoals: number | null;
    penaltyHomeGoals: number | null;
    penaltyAwayGoals: number | null;
    advancingTeamName: string | null;
    verificationStatus: "verified";
  } | null;
  prediction: PublicMatchPredictionView | null;
  premiumAccess: PublicMatchPremiumAccess;
  premiumProjection: PremiumMatchProjection;
};

export type PublicMatchPremiumAccess =
  | {
      status: "authorized";
      mode: "premium_entitlement" | "historical_preview";
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
  probableScore: string | null;
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
  probableScore: string | null = null,
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
      probableScore,
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

function hasVerifiedPublicResult(match: PublicMatchDetailRow) {
  return (
    match.result_verification_status === "verified" &&
    match.verified_home_goals !== null &&
    match.verified_away_goals !== null
  );
}

function isPredictionPublishedBeforeKickoff(
  prediction: PublicMatchPredictionRow | null,
  match: Pick<PublicMatchDetailRow, "kickoff_at">,
) {
  if (!prediction?.prediction_created_at) {
    return false;
  }

  return new Date(prediction.prediction_created_at).getTime() < new Date(match.kickoff_at).getTime();
}

function isEligibleHistoricalPreview(args: {
  viewer: PublicPredictionViewer;
  match: PublicMatchDetailRow;
  prediction: PublicMatchPredictionRow | null;
  premiumAccess: PublicMatchPremiumAccess;
}) {
  const { viewer, match, prediction, premiumAccess } = args;

  return (
    viewer === "registered_free" &&
    premiumAccess.status === "locked" &&
    match.status === "finished" &&
    hasVerifiedPublicResult(match) &&
    isPredictionPublishedBeforeKickoff(prediction, match)
  );
}

function toVerifiedPublicResult(
  match: PublicMatchDetailRow,
): PublicMatchDetailView["verifiedResult"] {
  if (!hasVerifiedPublicResult(match)) {
    return null;
  }

  const homeGoals = match.verified_home_goals;
  const awayGoals = match.verified_away_goals;
  if (homeGoals === null || awayGoals === null) {
    return null;
  }

  return {
    homeGoals,
    awayGoals,
    decisionMethod: match.result_decision_method ?? "ft",
    regulationHomeGoals: match.verified_regulation_home_goals,
    regulationAwayGoals: match.verified_regulation_away_goals,
    afterExtraTimeHomeGoals: match.verified_after_extra_time_home_goals,
    afterExtraTimeAwayGoals: match.verified_after_extra_time_away_goals,
    penaltyHomeGoals: match.verified_penalty_home_goals,
    penaltyAwayGoals: match.verified_penalty_away_goals,
    advancingTeamName: match.verified_advancing_team_name,
    verificationStatus: "verified" as const,
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
      "match_slug, match_id, kickoff_at, stage, status, competition_name, competition_slug, competition_access_key, competition_id, home_team_name, home_team_slug, home_team_logo_url, home_team_flag_url, home_team_id, away_team_name, away_team_slug, away_team_logo_url, away_team_flag_url, away_team_id, venue_name, venue_city, verified_home_goals, verified_away_goals, result_decision_method, verified_regulation_home_goals, verified_regulation_away_goals, verified_after_extra_time_home_goals, verified_after_extra_time_away_goals, verified_penalty_home_goals, verified_penalty_away_goals, verified_advancing_team_name, result_verification_status",
    )
    .eq("match_slug", slug)
    .maybeSingle();

  if (matchError) {
    return unavailable();
  }

  if (!matchData) {
    return { status: "not_found" };
  }

  const match = matchData as PublicMatchDetailRow;

  if (!isLaunchSafePublicMatch(match.match_slug, match.competition_slug)) {
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

  const prediction = predictionData as PublicMatchPredictionRow | null;
  let probableScore: string | null = null;

  if (viewer === "registered_free" && prediction && hasVerifiedPublicResult(match)) {
    const { data: probableScoreData, error: probableScoreError } = await supabase.rpc(
      "get_authenticated_public_match_probable_score",
      {
        p_match_id: match.match_id,
      },
    );

    if (!probableScoreError && probableScoreData) {
      probableScore = (
        probableScoreData as AuthenticatedPublicMatchProbableScoreRow
      ).most_likely_score;
    }
  }

  const matchResourceBuild = buildPremiumMatchResource({
    matchId: match.match_id ?? null,
    competitionAccessKey: match.competition_access_key ?? null,
    homeTeamId: match.home_team_id ?? null,
    awayTeamId: match.away_team_id ?? null,
    stageLabel: match.stage,
  });

  let premiumAccess: PublicMatchPremiumAccess;

  if (matchResourceBuild.status === "invalid") {
    premiumAccess = toUnavailablePremiumAccess("missing_match_context");
  } else {
    const accessDecision = await getPremiumMatchAccessDecision(matchResourceBuild.resource);
    if (accessDecision.status === "unavailable") {
      premiumAccess = toUnavailablePremiumAccess("access_decision_unavailable");
    } else if (accessDecision.access.canAccess) {
      premiumAccess = { status: "authorized", mode: "premium_entitlement" };
    } else {
      premiumAccess = toLockedPremiumAccess();
    }
  }

  const historicalPreviewEligible = isEligibleHistoricalPreview({
    viewer,
    match,
    prediction,
    premiumAccess,
  });

  let premiumProjection = await resolvePremiumProjectionForMatch({
    premiumAccess:
      premiumAccess.status === "authorized" || historicalPreviewEligible
        ? { status: "authorized" as const }
        : premiumAccess,
    matchId: match.match_id,
    fetchProjection: async (matchId) => {
      const { data, error } = await supabase.rpc("get_premium_match_projection", {
        p_match_id: matchId,
      });
      return {
        data: data as PremiumProjectionRpcRow | null,
        error,
      };
    },
  });

  if (
    historicalPreviewEligible &&
    premiumProjection.status === "authorized" &&
    premiumAccess.status === "locked"
  ) {
    premiumAccess = { status: "authorized", mode: "historical_preview" };
  } else if (historicalPreviewEligible && premiumAccess.status === "locked") {
    premiumProjection = {
      status: "locked",
      reason: "no_entitlement",
    };
  }

  const verifiedResult = toVerifiedPublicResult(match);

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
      verifiedResult,
      prediction: prediction ? toMatchPredictionView(prediction, viewer, probableScore) : null,
      premiumAccess,
      premiumProjection,
    },
  };
}
