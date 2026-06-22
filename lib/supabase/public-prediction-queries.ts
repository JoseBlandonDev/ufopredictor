import "server-only";

import { isLaunchSafePublicMatch } from "@/lib/supabase/public-launch-filters";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchRow, PredictionVersionRow } from "@/types/database";

const PUBLIC_PREDICTION_SUMMARY_SELECT =
  "match_slug, kickoff_at, stage, status, competition_name, competition_slug, home_team_name, home_team_slug, home_team_logo_url, home_team_flag_url, away_team_name, away_team_slug, away_team_logo_url, away_team_flag_url, venue_name, venue_city, verified_home_goals, verified_away_goals, result_verification_status, prediction_created_at, home_win_prob, draw_prob, away_win_prob, confidence_score, risk_level";

const WORLD_CUP_2026_SLUG = "world-cup-2026";
const WORLD_CUP_2026_MATCH_PREFIX = "world-cup-2026-%";
const DEFAULT_MAX_PREDICTION_PAGE = 100;

export const PREDICTIONS_LANDING_UPCOMING_LIMIT = 8;
export const PREDICTIONS_LANDING_HISTORY_LIMIT = 4;
export const PREDICTIONS_PAGE_SIZE = 12;

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

type PublicPredictionUnavailable = Extract<PublicPredictionsData, { status: "unavailable" }>;

export type PublicPredictionPaginationResult = {
  status: "ready";
  predictions: PublicPredictionCardView[];
  page: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

function unavailable(): PublicPredictionUnavailable {
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

export function parsePredictionPage(
  rawPage: string | string[] | undefined,
  maxPage = DEFAULT_MAX_PREDICTION_PAGE,
) {
  const value = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const parsed = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, maxPage);
}

function buildPublicPredictionQuery(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  return supabase
    .from("public_prediction_summaries")
    .select(PUBLIC_PREDICTION_SUMMARY_SELECT)
    .eq("competition_slug", WORLD_CUP_2026_SLUG)
    .like("match_slug", WORLD_CUP_2026_MATCH_PREFIX);
}

async function fetchPublicPredictionRows(args: {
  viewer: PublicPredictionViewer;
  status: MatchRow["status"];
  verifiedOnly?: boolean;
  limit?: number;
  page?: number;
  pageSize?: number;
  ascending: boolean;
}): Promise<PublicPredictionPaginationResult | PublicPredictionUnavailable> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return unavailable();
  }

  let query = buildPublicPredictionQuery(supabase).eq("status", args.status);

  if (args.verifiedOnly) {
    query = query.eq("result_verification_status", "verified");
  }

  query = query
    .order("kickoff_at", { ascending: args.ascending })
    .order("match_slug", { ascending: true });

  if (typeof args.limit === "number") {
    query = query.limit(args.limit);
  } else if (typeof args.page === "number" && typeof args.pageSize === "number") {
    const start = (args.page - 1) * args.pageSize;
    const end = start + args.pageSize;
    query = query.range(start, end);
  }

  const { data, error } = await query;

  if (error) {
    return unavailable();
  }

  const filteredPredictions = ((data ?? []) as PublicPredictionSummaryRow[])
    .filter((prediction) =>
      isLaunchSafePublicMatch(prediction.match_slug, prediction.competition_slug),
    )
    .map((prediction) => toPredictionCardView(prediction, args.viewer));

  if (typeof args.limit === "number") {
    return {
      status: "ready",
      predictions: filteredPredictions,
      page: 1,
      pageSize: args.limit,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }

  const page = args.page ?? 1;
  const pageSize = args.pageSize ?? PREDICTIONS_PAGE_SIZE;
  const hasNextPage = filteredPredictions.length > pageSize;

  return {
    status: "ready",
    predictions: filteredPredictions.slice(0, pageSize),
    page,
    pageSize,
    hasPreviousPage: page > 1,
    hasNextPage,
  };
}

export async function getPublicPredictionsData(
  viewer: PublicPredictionViewer,
): Promise<PublicPredictionsData> {
  const [scheduledResult, historyResult] = await Promise.all([
    fetchPublicPredictionRows({
      viewer,
      status: "scheduled",
      ascending: true,
      limit: PREDICTIONS_LANDING_UPCOMING_LIMIT,
    }),
    fetchPublicPredictionRows({
      viewer,
      status: "finished",
      verifiedOnly: true,
      ascending: false,
      limit: PREDICTIONS_LANDING_HISTORY_LIMIT,
    }),
  ]);

  if (
    scheduledResult.status === "unavailable" ||
    historyResult.status === "unavailable"
  ) {
    return unavailable();
  }

  return {
    status: "ready",
    upcomingPredictions: sortUpcomingPredictions(scheduledResult.predictions),
    historicalPredictions: historyResult.predictions,
  };
}

export async function getUpcomingPublicPredictionsPage(
  viewer: PublicPredictionViewer,
  page: number,
): Promise<PublicPredictionPaginationResult | PublicPredictionUnavailable> {
  return fetchPublicPredictionRows({
    viewer,
    status: "scheduled",
    ascending: true,
    page,
    pageSize: PREDICTIONS_PAGE_SIZE,
  });
}

export async function getHistoricalPublicPredictionsPage(
  viewer: PublicPredictionViewer,
  page: number,
): Promise<PublicPredictionPaginationResult | PublicPredictionUnavailable> {
  return fetchPublicPredictionRows({
    viewer,
    status: "finished",
    verifiedOnly: true,
    ascending: false,
    page,
    pageSize: PREDICTIONS_PAGE_SIZE,
  });
}
