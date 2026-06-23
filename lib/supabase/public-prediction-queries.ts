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
export const PREDICTIONS_LANDING_LIVE_LIMIT = 4;
export const PREDICTIONS_LANDING_AWAITING_LIMIT = 4;
export const PREDICTIONS_PAGE_SIZE = 12;

// Three hours is a conservative public window: it keeps a just-started or stoppage-heavy match
// visible as in progress, but prevents a stale status from looking live indefinitely.
export const PUBLIC_ACTIVE_MATCH_WINDOW_MS = 3 * 60 * 60 * 1000;

export type PublicPredictionViewer = "anonymous" | "registered_free";
export type PublicPredictionCollectionMode =
  | "in_progress"
  | "awaiting_result_update"
  | "upcoming"
  | "history";
export type PublicLifecycleStateLabel =
  | "En vivo"
  | "Partido suspendido"
  | "Partido cancelado"
  | "Esperando resultado oficial";
export type PublicPredictionLifecycle =
  | "upcoming"
  | "in_progress"
  | "awaiting_result_update"
  | "cancelled"
  | "postponed"
  | "history";

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
  collectionMode: PublicPredictionCollectionMode;
  liveStateLabel: PublicLifecycleStateLabel | null;
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
      livePredictions: PublicPredictionCardView[];
      awaitingUpdatePredictions: PublicPredictionCardView[];
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

function hasVerifiedFinalResult(prediction: Pick<
  PublicPredictionSummaryRow,
  "result_verification_status" | "verified_home_goals" | "verified_away_goals"
>) {
  return (
    prediction.result_verification_status === "verified" &&
    prediction.verified_home_goals !== null &&
    prediction.verified_away_goals !== null
  );
}

export function derivePublicPredictionLifecycle(
  prediction: Pick<
    PublicPredictionSummaryRow,
    "kickoff_at" | "status" | "result_verification_status" | "verified_home_goals" | "verified_away_goals"
  >,
  now = new Date(),
): PublicPredictionLifecycle {
  if (hasVerifiedFinalResult(prediction)) {
    return "history";
  }

  if (prediction.status === "postponed") {
    return "postponed";
  }

  if (prediction.status === "cancelled") {
    return "cancelled";
  }

  if (prediction.status === "finished") {
    return "awaiting_result_update";
  }

  const kickoffTime = new Date(prediction.kickoff_at).getTime();
  const nowTime = now.getTime();

  if (kickoffTime > nowTime) {
    return "upcoming";
  }

  if (nowTime < kickoffTime + PUBLIC_ACTIVE_MATCH_WINDOW_MS) {
    return "in_progress";
  }

  return "awaiting_result_update";
}

function isUpcomingPrediction(
  prediction: Pick<
    PublicPredictionSummaryRow,
    "kickoff_at" | "status" | "result_verification_status" | "verified_home_goals" | "verified_away_goals"
  >,
  now = new Date(),
) {
  return derivePublicPredictionLifecycle(prediction, now) === "upcoming";
}

function isInProgressPrediction(
  prediction: Pick<
    PublicPredictionSummaryRow,
    "kickoff_at" | "status" | "result_verification_status" | "verified_home_goals" | "verified_away_goals"
  >,
  now = new Date(),
) {
  return derivePublicPredictionLifecycle(prediction, now) === "in_progress";
}

function isAwaitingUpdatePrediction(
  prediction: Pick<
    PublicPredictionSummaryRow,
    "kickoff_at" | "status" | "result_verification_status" | "verified_home_goals" | "verified_away_goals"
  >,
  now = new Date(),
) {
  const lifecycle = derivePublicPredictionLifecycle(prediction, now);
  return (
    lifecycle === "awaiting_result_update" ||
    lifecycle === "cancelled" ||
    lifecycle === "postponed"
  );
}

function getLifecycleStateLabel(
  prediction: Pick<
    PublicPredictionSummaryRow,
    "kickoff_at" | "status" | "result_verification_status" | "verified_home_goals" | "verified_away_goals"
  >,
  collectionMode: PublicPredictionCollectionMode,
  now = new Date(),
): PublicLifecycleStateLabel | null {
  if (collectionMode === "upcoming" || collectionMode === "history") {
    return null;
  }

  const lifecycle = derivePublicPredictionLifecycle(prediction, now);

  switch (lifecycle) {
    case "in_progress":
      return "En vivo";
    case "postponed":
      return "Partido suspendido";
    case "cancelled":
      return "Partido cancelado";
    case "awaiting_result_update":
      return "Esperando resultado oficial";
    default:
      return null;
  }
}

function toCardBaseView(
  prediction: PublicPredictionSummaryRow,
  collectionMode: PublicPredictionCollectionMode,
  now = new Date(),
): PublicPredictionCardBaseView {
  const verifiedResult =
    hasVerifiedFinalResult(prediction)
      ? {
          homeGoals: prediction.verified_home_goals!,
          awayGoals: prediction.verified_away_goals!,
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
    collectionMode,
    liveStateLabel: getLifecycleStateLabel(prediction, collectionMode, now),
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

function getAwaitingPriority(status: MatchRow["status"]) {
  switch (status) {
    case "postponed":
      return 0;
    case "cancelled":
      return 1;
    default:
      return 2;
  }
}

export function sortInProgressPredictions(predictions: PublicPredictionCardView[]) {
  return [...predictions].sort(
    (left, right) => new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime(),
  );
}

export function sortAwaitingUpdatePredictions(predictions: PublicPredictionCardView[]) {
  return [...predictions].sort((left, right) => {
    const leftPriority = getAwaitingPriority(left.status);
    const rightPriority = getAwaitingPriority(right.status);

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return new Date(right.kickoffAt).getTime() - new Date(left.kickoffAt).getTime();
  });
}

export function sortUpcomingPredictions(predictions: PublicPredictionCardView[]) {
  return [...predictions].sort(
    (left, right) => new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime(),
  );
}

export function sortHistoricalPredictions(predictions: PublicPredictionCardView[]) {
  return [...predictions].sort(
    (left, right) => new Date(right.kickoffAt).getTime() - new Date(left.kickoffAt).getTime(),
  );
}

export function toPredictionCardView(
  prediction: PublicPredictionSummaryRow,
  viewer: PublicPredictionViewer,
  collectionMode: PublicPredictionCollectionMode,
  now = new Date(),
): PublicPredictionCardView {
  const base = toCardBaseView(prediction, collectionMode, now);

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
    .like("match_slug", WORLD_CUP_2026_MATCH_PREFIX)
    .order("kickoff_at", { ascending: true })
    .order("match_slug", { ascending: true });
}

async function fetchAllPublicPredictionRows() {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return unavailable();
  }

  const { data, error } = await buildPublicPredictionQuery(supabase);

  if (error) {
    return unavailable();
  }

  return {
    status: "ready" as const,
    rows: ((data ?? []) as PublicPredictionSummaryRow[]).filter((prediction) =>
      isLaunchSafePublicMatch(prediction.match_slug, prediction.competition_slug),
    ),
  };
}

function selectPredictionRowsForMode(args: {
  rows: PublicPredictionSummaryRow[];
  viewer: PublicPredictionViewer;
  mode: PublicPredictionCollectionMode;
  now?: Date;
}) {
  const now = args.now ?? new Date();

  const filteredRows = args.rows.filter((prediction) => {
    switch (args.mode) {
      case "upcoming":
        return isUpcomingPrediction(prediction, now);
      case "in_progress":
        return isInProgressPrediction(prediction, now);
      case "awaiting_result_update":
        return isAwaitingUpdatePrediction(prediction, now);
      case "history":
        return derivePublicPredictionLifecycle(prediction, now) === "history";
    }
  });

  const mappedRows = filteredRows.map((prediction) =>
    toPredictionCardView(prediction, args.viewer, args.mode, now),
  );

  switch (args.mode) {
    case "in_progress":
      return sortInProgressPredictions(mappedRows);
    case "awaiting_result_update":
      return sortAwaitingUpdatePredictions(mappedRows);
    case "upcoming":
      return sortUpcomingPredictions(mappedRows);
    case "history":
      return sortHistoricalPredictions(mappedRows);
  }
}

function toPaginationResult(args: {
  predictions: PublicPredictionCardView[];
  page?: number;
  pageSize?: number;
  limit?: number;
}): PublicPredictionPaginationResult {
  if (typeof args.limit === "number") {
    return {
      status: "ready",
      predictions: args.predictions.slice(0, args.limit),
      page: 1,
      pageSize: args.limit,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }

  const page = args.page ?? 1;
  const pageSize = args.pageSize ?? PREDICTIONS_PAGE_SIZE;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagePredictions = args.predictions.slice(start, end);

  return {
    status: "ready",
    predictions: pagePredictions,
    page,
    pageSize,
    hasPreviousPage: page > 1,
    hasNextPage: end < args.predictions.length,
  };
}

async function fetchPublicPredictionRows(args: {
  viewer: PublicPredictionViewer;
  mode: PublicPredictionCollectionMode;
  limit?: number;
  page?: number;
  pageSize?: number;
  now?: Date;
}): Promise<PublicPredictionPaginationResult | PublicPredictionUnavailable> {
  const allRowsResult = await fetchAllPublicPredictionRows();

  if (allRowsResult.status === "unavailable") {
    return allRowsResult;
  }

  const predictions = selectPredictionRowsForMode({
    rows: allRowsResult.rows,
    viewer: args.viewer,
    mode: args.mode,
    now: args.now,
  });

  return toPaginationResult({
    predictions,
    page: args.page,
    pageSize: args.pageSize,
    limit: args.limit,
  });
}

export async function getPublicPredictionsData(
  viewer: PublicPredictionViewer,
): Promise<PublicPredictionsData> {
  const [liveResult, awaitingResult, scheduledResult, historyResult] = await Promise.all([
    fetchPublicPredictionRows({
      viewer,
      mode: "in_progress",
      limit: PREDICTIONS_LANDING_LIVE_LIMIT,
    }),
    fetchPublicPredictionRows({
      viewer,
      mode: "awaiting_result_update",
      limit: PREDICTIONS_LANDING_AWAITING_LIMIT,
    }),
    fetchPublicPredictionRows({
      viewer,
      mode: "upcoming",
      limit: PREDICTIONS_LANDING_UPCOMING_LIMIT,
    }),
    fetchPublicPredictionRows({
      viewer,
      mode: "history",
      limit: PREDICTIONS_LANDING_HISTORY_LIMIT,
    }),
  ]);

  if (
    liveResult.status === "unavailable" ||
    awaitingResult.status === "unavailable" ||
    scheduledResult.status === "unavailable" ||
    historyResult.status === "unavailable"
  ) {
    return unavailable();
  }

  return {
    status: "ready",
    livePredictions: liveResult.predictions,
    awaitingUpdatePredictions: awaitingResult.predictions,
    upcomingPredictions: scheduledResult.predictions,
    historicalPredictions: historyResult.predictions,
  };
}

export async function getUpcomingPublicPredictionsPage(
  viewer: PublicPredictionViewer,
  page: number,
): Promise<PublicPredictionPaginationResult | PublicPredictionUnavailable> {
  return fetchPublicPredictionRows({
    viewer,
    mode: "upcoming",
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
    mode: "history",
    page,
    pageSize: PREDICTIONS_PAGE_SIZE,
  });
}
