import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type PublicMatchIdRow = {
  match_id: string;
};

type SavedMatchRow = {
  match_id: string;
  saved_at: string;
};

type PublicMatchDetailDashboardRow = {
  match_id: string;
  match_slug: string;
  kickoff_at: string;
  competition_name: string;
  home_team_name: string;
  away_team_name: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  stage: string | null;
  venue_name: string | null;
  venue_city: string | null;
};

export type SavedMatchDashboardItem = {
  matchId: string;
  savedAt: string;
  matchSlug: string;
  kickoffAt: string;
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  stage: string | null;
  venueName: string | null;
  venueCity: string | null;
};

export type SavedMatchesDashboardResult =
  | { status: "ready"; matches: SavedMatchDashboardItem[] }
  | { status: "unauthenticated"; matches: [] }
  | { status: "unavailable"; message: string };

export type SavedMatchMutationResult =
  | { status: "saved" | "removed" }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "unavailable"; message: string };

export type SavedMatchStateResult =
  | { status: "ready"; isAuthenticated: false; isSaved: false }
  | { status: "ready"; isAuthenticated: true; isSaved: boolean }
  | { status: "not_found" }
  | { status: "unavailable"; message: string };

function unavailable(message: string): SavedMatchMutationResult {
  return { status: "unavailable", message };
}

async function resolvePublicMatchIdBySlug(
  slug: string,
): Promise<{ status: "ready"; matchId: string } | { status: "not_found" | "unavailable" }> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return { status: "unavailable" };
  }

  const { data, error } = await supabase
    .from("public_match_details")
    .select("match_id")
    .eq("match_slug", slug)
    .maybeSingle();

  if (error) {
    return { status: "unavailable" };
  }

  if (!data) {
    return { status: "not_found" };
  }

  return { status: "ready", matchId: (data as PublicMatchIdRow).match_id };
}

export async function getSavedMatchStateBySlug(slug: string): Promise<SavedMatchStateResult> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      status: "unavailable",
      message: "No fue posible consultar el estado de guardado de este partido.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      status: "unavailable",
      message: "No fue posible consultar el estado de guardado de este partido.",
    };
  }

  if (!user) {
    return { status: "ready", isAuthenticated: false, isSaved: false };
  }

  const matchIdResult = await resolvePublicMatchIdBySlug(slug);

  if (matchIdResult.status !== "ready") {
    if (matchIdResult.status === "not_found") {
      return { status: "not_found" };
    }

    return {
      status: "unavailable",
      message: "No fue posible consultar el estado de guardado de este partido.",
    };
  }
  const { matchId } = matchIdResult;

  const { data, error } = await supabase
    .from("user_saved_matches")
    .select("id")
    .eq("user_id", user.id)
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) {
    return {
      status: "unavailable",
      message: "No fue posible consultar el estado de guardado de este partido.",
    };
  }

  return { status: "ready", isAuthenticated: true, isSaved: Boolean(data) };
}

export async function saveMatchBySlug(slug: string): Promise<SavedMatchMutationResult> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return unavailable("No fue posible guardar este partido en este momento.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return unavailable("No fue posible guardar este partido en este momento.");
  }

  if (!user) {
    return { status: "unauthenticated" };
  }

  const matchIdResult = await resolvePublicMatchIdBySlug(slug);

  if (matchIdResult.status !== "ready") {
    if (matchIdResult.status === "not_found") {
      return { status: "not_found" };
    }

    return unavailable("No fue posible guardar este partido en este momento.");
  }

  const { matchId } = matchIdResult;

  const { error } = await supabase.from("user_saved_matches").upsert(
    {
      user_id: user.id,
      match_id: matchId,
    },
    {
      onConflict: "user_id,match_id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    return unavailable("No fue posible guardar este partido en este momento.");
  }

  return { status: "saved" };
}

export async function removeSavedMatchBySlug(slug: string): Promise<SavedMatchMutationResult> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return unavailable("No fue posible quitar este partido guardado en este momento.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return unavailable("No fue posible quitar este partido guardado en este momento.");
  }

  if (!user) {
    return { status: "unauthenticated" };
  }

  const matchIdResult = await resolvePublicMatchIdBySlug(slug);

  if (matchIdResult.status !== "ready") {
    if (matchIdResult.status === "not_found") {
      return { status: "not_found" };
    }

    return unavailable("No fue posible quitar este partido guardado en este momento.");
  }

  const { matchId } = matchIdResult;

  const { error } = await supabase
    .from("user_saved_matches")
    .delete()
    .eq("user_id", user.id)
    .eq("match_id", matchId);

  if (error) {
    return unavailable("No fue posible quitar este partido guardado en este momento.");
  }

  return { status: "removed" };
}

export async function getSavedMatchesForDashboard(): Promise<SavedMatchesDashboardResult> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      status: "unavailable",
      message: "No fue posible consultar tus partidos guardados en este momento.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      status: "unavailable",
      message: "No fue posible consultar tus partidos guardados en este momento.",
    };
  }

  if (!user) {
    return { status: "unauthenticated", matches: [] };
  }

  const { data: savedRows, error: savedError } = await supabase
    .from("user_saved_matches")
    .select("match_id, saved_at")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  if (savedError) {
    return {
      status: "unavailable",
      message: "No fue posible consultar tus partidos guardados en este momento.",
    };
  }

  const saved = (savedRows ?? []) as SavedMatchRow[];

  if (saved.length === 0) {
    return { status: "ready", matches: [] };
  }

  const matchIds = saved.map((row) => row.match_id);
  const savedAtByMatchId = new Map(saved.map((row) => [row.match_id, row.saved_at]));

  const { data: publicMatches, error: publicMatchesError } = await supabase
    .from("public_match_details")
    .select(
      "match_id, match_slug, kickoff_at, competition_name, home_team_name, away_team_name, status, stage, venue_name, venue_city",
    )
    .in("match_id", matchIds);

  if (publicMatchesError) {
    return {
      status: "unavailable",
      message: "No fue posible consultar tus partidos guardados en este momento.",
    };
  }

  const publicByMatchId = new Map(
    ((publicMatches ?? []) as PublicMatchDetailDashboardRow[]).map((match) => [match.match_id, match]),
  );

  const matches = saved
    .map((row) => {
      const detail = publicByMatchId.get(row.match_id);

      if (!detail) {
        return null;
      }

      return {
        matchId: detail.match_id,
        savedAt: savedAtByMatchId.get(detail.match_id) ?? row.saved_at,
        matchSlug: detail.match_slug,
        kickoffAt: detail.kickoff_at,
        competitionName: detail.competition_name,
        homeTeamName: detail.home_team_name,
        awayTeamName: detail.away_team_name,
        status: detail.status,
        stage: detail.stage,
        venueName: detail.venue_name,
        venueCity: detail.venue_city,
      } satisfies SavedMatchDashboardItem;
    })
    .filter((value): value is SavedMatchDashboardItem => value !== null);

  return {
    status: "ready",
    matches,
  };
}
