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

function redirectWithStatus(status: "saved" | "invalid" | "error"): never {
  redirect(`/admin/beta-lab?review=${status}`);
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
