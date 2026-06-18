import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLaunchSafePublicMatch } from "./public-launch-filters";
import {
  REAL_FIXTURE_LAB_PREDICTION_TYPE,
  REAL_FIXTURE_LAB_RUN_SCOPE,
} from "../prediction-engine/real-fixture-persistence";

const WORLD_CUP_COMPETITION_SLUG = "world-cup-2026";
const WORLD_CUP_PUBLISH_QUEUE_WINDOW_DAYS = 10;

type PublishQueueMatchRow = {
  id: string;
  external_id: string;
  slug: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  kickoff_at: string;
  status: string;
  access_scope: string;
  intake_source: string;
};

type PublishQueueTeamRow = {
  id: string;
  name: string;
};

type PublishQueuePredictionRow = {
  id: string;
  match_id: string;
  created_at: string;
};

type PublishQueueCompetitionRow = {
  id: string;
  slug: string;
  usage_scope: string;
};

export type RealFixturePublishQueueRow = {
  id: string;
  externalId: string;
  apiFootballFixtureId: string | null;
  slug: string;
  kickoffAt: string;
  status: string;
  accessScope: string;
  homeTeamName: string;
  awayTeamName: string;
  savedPredictionId: string | null;
  latestPublicPredictionId: string | null;
};

export type RealFixturePublishQueueData = {
  activeModelVersionId: string | null;
  rows: RealFixturePublishQueueRow[];
};

function parseApiFootballFixtureId(externalId: string) {
  const match = /^api-football:fixture:(\d+)$/.exec(externalId);
  return match ? match[1] : null;
}

function buildLatestPredictionMap(rows: PublishQueuePredictionRow[] | null | undefined) {
  const latestByMatchId = new Map<string, string>();

  for (const row of rows ?? []) {
    if (!latestByMatchId.has(row.match_id)) {
      latestByMatchId.set(row.match_id, row.id);
    }
  }

  return latestByMatchId;
}

export async function getRealFixturePublishQueueData(): Promise<RealFixturePublishQueueData> {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const maxKickoffIso = new Date(
    now.getTime() + WORLD_CUP_PUBLISH_QUEUE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    { data: activeModelVersionData },
    { data: competitionData, error: competitionError },
    { data: matchData, error: matchError },
  ] = await Promise.all([
    supabase
      .from("model_versions")
      .select("id, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("competitions")
      .select("id, slug, usage_scope")
      .eq("slug", WORLD_CUP_COMPETITION_SLUG)
      .eq("usage_scope", "public_product")
      .maybeSingle(),
    supabase
      .from("matches")
      .select("id, external_id, slug, competition_id, home_team_id, away_team_id, kickoff_at, status, access_scope, intake_source")
      .eq("access_scope", "admin_only")
      .eq("intake_source", "api_football")
      .eq("status", "scheduled")
      .gte("kickoff_at", nowIso)
      .lte("kickoff_at", maxKickoffIso)
      .order("kickoff_at", { ascending: true }),
  ]);

  if (competitionError || !competitionData) {
    throw new Error("No fue posible identificar la competencia publica del Mundial 2026 para la cola.");
  }

  if (matchError) {
    throw new Error(`No fue posible leer la cola de fixtures reales: ${matchError.message}`);
  }

  const competition = competitionData as PublishQueueCompetitionRow;
  const matches = ((matchData ?? []) as PublishQueueMatchRow[]).filter(
    (match) =>
      match.competition_id === competition.id &&
      isLaunchSafePublicMatch(match.slug, competition.slug),
  );

  if (matches.length === 0) {
    return {
      activeModelVersionId: activeModelVersionData?.id ?? null,
      rows: [],
    };
  }

  const teamIds = [...new Set(matches.flatMap((match) => [match.home_team_id, match.away_team_id]))];
  const matchIds = matches.map((match) => match.id);

  const [
    { data: teamData, error: teamError },
    { data: savedPredictionData, error: savedPredictionError },
    { data: publicPredictionData, error: publicPredictionError },
  ] = await Promise.all([
    supabase.from("teams").select("id, name").in("id", teamIds),
    supabase
      .from("prediction_versions")
      .select("id, match_id, created_at")
      .in("match_id", matchIds)
      .eq("prediction_type", REAL_FIXTURE_LAB_PREDICTION_TYPE)
      .eq("run_scope", REAL_FIXTURE_LAB_RUN_SCOPE)
      .order("created_at", { ascending: false }),
    supabase
      .from("prediction_versions")
      .select("id, match_id, created_at")
      .in("match_id", matchIds)
      .eq("prediction_type", REAL_FIXTURE_LAB_PREDICTION_TYPE)
      .eq("run_scope", "public_product")
      .order("created_at", { ascending: false }),
  ]);

  if (teamError) {
    throw new Error(`No fue posible leer los equipos de la cola real: ${teamError.message}`);
  }

  if (savedPredictionError) {
    throw new Error(`No fue posible leer las predicciones internas de la cola real: ${savedPredictionError.message}`);
  }

  if (publicPredictionError) {
    throw new Error(`No fue posible leer las predicciones publicas de la cola real: ${publicPredictionError.message}`);
  }

  const teamById = new Map(((teamData ?? []) as PublishQueueTeamRow[]).map((team) => [team.id, team.name]));
  const savedPredictionByMatchId = buildLatestPredictionMap((savedPredictionData ?? []) as PublishQueuePredictionRow[]);
  const publicPredictionByMatchId = buildLatestPredictionMap((publicPredictionData ?? []) as PublishQueuePredictionRow[]);

  return {
    activeModelVersionId: activeModelVersionData?.id ?? null,
    rows: matches
      .map((match) => ({
        id: match.id,
        externalId: match.external_id,
        apiFootballFixtureId: parseApiFootballFixtureId(match.external_id),
        slug: match.slug,
        kickoffAt: match.kickoff_at,
        status: match.status,
        accessScope: match.access_scope,
        homeTeamName: teamById.get(match.home_team_id) ?? "Equipo local no disponible",
        awayTeamName: teamById.get(match.away_team_id) ?? "Equipo visitante no disponible",
        savedPredictionId: savedPredictionByMatchId.get(match.id) ?? null,
        latestPublicPredictionId: publicPredictionByMatchId.get(match.id) ?? null,
      }))
      .filter((match) => match.latestPublicPredictionId === null),
  };
}
