"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const reviewLabFixtureSchema = z.object({
  matchId: z.string().uuid(),
  lab_status: z.enum(["candidate", "ready", "review", "needs_data", "archived"]),
  data_quality: z.enum(["unreviewed", "reviewed", "verified", "rejected"]),
  source_note: z
    .string()
    .trim()
    .max(500, "La nota no puede superar 500 caracteres."),
});

const goalSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN),
  z.number().int().min(0),
);

const saveLabMatchResultSchema = z.object({
  matchId: z.string().uuid(),
  home_goals: goalSchema,
  away_goals: goalSchema,
  verification_status: z.enum(["pending_review", "verified", "rejected"]),
  intake_source: z.enum(["mock", "manual", "csv_import"]),
  source_note: z
    .string()
    .trim()
    .max(500, "La nota no puede superar 500 caracteres."),
});

function redirectWithStatus(status: "saved" | "invalid" | "error"): never {
  redirect(`/admin/beta-lab?review=${status}`);
}

function redirectWithResultStatus(status: "saved" | "invalid" | "error"): never {
  redirect(`/admin/beta-lab?result=${status}`);
}

export async function reviewLabFixtureAction(formData: FormData) {
  const input = reviewLabFixtureSchema.safeParse({
    matchId: formData.get("matchId"),
    lab_status: formData.get("lab_status"),
    data_quality: formData.get("data_quality"),
    source_note: formData.get("source_note") ?? "",
  });

  if (!input.success) {
    redirectWithStatus("invalid");
  }

  const { user } = await requireAdmin("/admin/beta-lab");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("matches")
    .update({
      lab_status: input.data.lab_status,
      data_quality: input.data.data_quality,
      source_note: input.data.source_note || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", input.data.matchId)
    .eq("access_scope", "lab_only")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirectWithStatus("error");
  }

  revalidatePath("/admin/beta-lab");
  redirectWithStatus("saved");
}

export async function saveLabMatchResultAction(formData: FormData) {
  const input = saveLabMatchResultSchema.safeParse({
    matchId: formData.get("matchId"),
    home_goals: formData.get("home_goals"),
    away_goals: formData.get("away_goals"),
    verification_status: formData.get("verification_status"),
    intake_source: formData.get("intake_source"),
    source_note: formData.get("source_note") ?? "",
  });

  if (!input.success) {
    redirectWithResultStatus("invalid");
  }

  const { user } = await requireAdmin("/admin/beta-lab");
  const supabase = await createSupabaseServerClient();
  const { data: labMatch, error: labMatchError } = await supabase
    .from("matches")
    .select("id")
    .eq("id", input.data.matchId)
    .eq("access_scope", "lab_only")
    .maybeSingle();

  if (labMatchError || !labMatch) {
    redirectWithResultStatus("error");
  }

  const { data: existingResult, error: existingResultError } = await supabase
    .from("match_results")
    .select("id")
    .eq("match_id", input.data.matchId)
    .maybeSingle();

  if (existingResultError) {
    redirectWithResultStatus("error");
  }

  const resultFields = {
    home_goals: input.data.home_goals,
    away_goals: input.data.away_goals,
    verification_status: input.data.verification_status,
    intake_source: input.data.intake_source,
    source_note: input.data.source_note || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  };

  const mutation = existingResult
    ? supabase
        .from("match_results")
        .update(resultFields)
        .eq("id", existingResult.id)
        .eq("match_id", input.data.matchId)
        .select("id")
        .maybeSingle()
    : supabase
        .from("match_results")
        .insert({
          match_id: input.data.matchId,
          ...resultFields,
        })
        .select("id")
        .maybeSingle();

  const { data, error } = await mutation;

  if (error || !data) {
    redirectWithResultStatus("error");
  }

  revalidatePath("/admin/beta-lab");
  redirectWithResultStatus("saved");
}
