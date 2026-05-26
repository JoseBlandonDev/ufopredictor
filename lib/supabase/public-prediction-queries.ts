import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CompetitionRow,
  MatchRow,
  PredictionVersionRow,
  TeamRow,
  VenueRow,
} from "@/types/database";

type PublicCompetition = Pick<CompetitionRow, "id" | "name" | "slug">;
type PublicMatch = Pick<
  MatchRow,
  | "id"
  | "slug"
  | "competition_id"
  | "home_team_id"
  | "away_team_id"
  | "venue_id"
  | "kickoff_at"
  | "stage"
  | "status"
>;
type PublicTeam = Pick<TeamRow, "id" | "name" | "slug" | "logo_url" | "flag_url">;
type PublicVenue = Pick<VenueRow, "id" | "name" | "city">;
type PublicPrediction = Pick<
  PredictionVersionRow,
  | "id"
  | "match_id"
  | "home_win_prob"
  | "draw_prob"
  | "away_win_prob"
  | "confidence_score"
  | "risk_level"
  | "created_at"
>;

export type PublicPredictionCardView = {
  predictionVersionId: string;
  predictionCreatedAt: string;
  matchId: string;
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

export async function getPublicPredictionsData(): Promise<PublicPredictionsData> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return unavailable();
  }

  const { data: competitionData, error: competitionError } = await supabase
    .from("competitions")
    .select("id, name, slug")
    .eq("usage_scope", "public_product")
    .order("name");

  if (competitionError) {
    return unavailable();
  }

  const competitions = (competitionData ?? []) as PublicCompetition[];

  if (competitions.length === 0) {
    return { status: "ready", predictions: [] };
  }

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select(
      "id, slug, competition_id, home_team_id, away_team_id, venue_id, kickoff_at, stage, status",
    )
    .in(
      "competition_id",
      competitions.map((competition) => competition.id),
    )
    .eq("access_scope", "public")
    .order("kickoff_at");

  if (matchError) {
    return unavailable();
  }

  const matches = (matchData ?? []) as PublicMatch[];

  if (matches.length === 0) {
    return { status: "ready", predictions: [] };
  }

  const matchIds = matches.map((match) => match.id);
  const { data: predictionData, error: predictionError } = await supabase
    .from("prediction_versions")
    .select(
      "id, match_id, home_win_prob, draw_prob, away_win_prob, confidence_score, risk_level, created_at",
    )
    .in("match_id", matchIds)
    .eq("run_scope", "public_product")
    .order("created_at", { ascending: false });

  if (predictionError) {
    return unavailable();
  }

  const predictions = (predictionData ?? []) as PublicPrediction[];

  if (predictions.length === 0) {
    return { status: "ready", predictions: [] };
  }

  const latestPredictionByMatchId = new Map<string, PublicPrediction>();

  // Until publication versioning exists, the most recent public run represents each match.
  predictions.forEach((prediction) => {
    if (!latestPredictionByMatchId.has(prediction.match_id)) {
      latestPredictionByMatchId.set(prediction.match_id, prediction);
    }
  });

  const predictedMatches = matches.filter((match) => latestPredictionByMatchId.has(match.id));
  const teamIds = Array.from(
    new Set(predictedMatches.flatMap((match) => [match.home_team_id, match.away_team_id])),
  );
  const venueIds = Array.from(
    new Set(
      predictedMatches
        .map((match) => match.venue_id)
        .filter((venueId): venueId is string => venueId !== null),
    ),
  );

  const [{ data: teamData, error: teamError }, venueResponse] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, slug, logo_url, flag_url")
      .in("id", teamIds),
    venueIds.length > 0
      ? supabase.from("venues").select("id, name, city").in("id", venueIds)
      : Promise.resolve({ data: [] as PublicVenue[], error: null }),
  ]);

  if (teamError || venueResponse.error) {
    return unavailable();
  }

  const teams = (teamData ?? []) as PublicTeam[];
  const venues = (venueResponse.data ?? []) as PublicVenue[];
  const competitionById = new Map(competitions.map((competition) => [competition.id, competition]));
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const venueById = new Map(venues.map((venue) => [venue.id, venue]));
  const cardViews: PublicPredictionCardView[] = [];

  for (const match of predictedMatches) {
    const competition = competitionById.get(match.competition_id);
    const homeTeam = teamById.get(match.home_team_id);
    const awayTeam = teamById.get(match.away_team_id);
    const prediction = latestPredictionByMatchId.get(match.id);

    if (!competition || !homeTeam || !awayTeam || !prediction) {
      return unavailable();
    }

    const venue = match.venue_id ? venueById.get(match.venue_id) ?? null : null;

    cardViews.push({
      predictionVersionId: prediction.id,
      predictionCreatedAt: prediction.created_at,
      matchId: match.id,
      matchSlug: match.slug,
      kickoffAt: match.kickoff_at,
      stage: match.stage,
      status: match.status,
      competitionName: competition.name,
      competitionSlug: competition.slug,
      homeTeamName: homeTeam.name,
      homeTeamSlug: homeTeam.slug,
      homeTeamLogoUrl: homeTeam.logo_url,
      homeTeamFlagUrl: homeTeam.flag_url,
      awayTeamName: awayTeam.name,
      awayTeamSlug: awayTeam.slug,
      awayTeamLogoUrl: awayTeam.logo_url,
      awayTeamFlagUrl: awayTeam.flag_url,
      venueName: venue?.name ?? null,
      venueCity: venue?.city ?? null,
      homeWinProb: prediction.home_win_prob,
      drawProb: prediction.draw_prob,
      awayWinProb: prediction.away_win_prob,
      confidenceScore: prediction.confidence_score,
      riskLevel: prediction.risk_level,
    });
  }

  return { status: "ready", predictions: cardViews };
}
