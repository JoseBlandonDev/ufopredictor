import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  REAL_FIXTURE_LAB_PREDICTION_TYPE,
  REAL_FIXTURE_LAB_RUN_SCOPE,
} from "../prediction-engine/real-fixture-persistence";

export const REAL_FIXTURE_PUBLISH_QUEUE_EXTERNAL_IDS = [
  "api-football:fixture:1489384",
  "api-football:fixture:1489385",
  "api-football:fixture:1489386",
  "api-football:fixture:1539004",
  "api-football:fixture:1539005",
  "api-football:fixture:1489387",
  "api-football:fixture:1489388",
] as const;

type PublishQueueMatchRow = {
  id: string;
  external_id: string;
  slug: string;
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

  const [
    { data: activeModelVersionData },
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
      .from("matches")
      .select("id, external_id, slug, home_team_id, away_team_id, kickoff_at, status, access_scope, intake_source")
      .in("external_id", [...REAL_FIXTURE_PUBLISH_QUEUE_EXTERNAL_IDS])
      .eq("intake_source", "api_football")
      .order("kickoff_at", { ascending: true }),
  ]);

  if (matchError) {
    throw new Error(`No fue posible leer la cola de fixtures reales: ${matchError.message}`);
  }

  const matches = (matchData ?? []) as PublishQueueMatchRow[];

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
    rows: matches.map((match) => ({
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
    })),
  };
}
