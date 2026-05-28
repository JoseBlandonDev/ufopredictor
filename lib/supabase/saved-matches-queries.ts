import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type PublicMatchIdRow = {
  match_id: string;
};

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
