"use server";

import { revalidatePath } from "next/cache";
import { removeSavedMatchBySlug, saveMatchBySlug } from "@/lib/supabase/saved-matches-queries";

export async function saveMatchAction(slug: string) {
  await saveMatchBySlug(slug);
  revalidatePath(`/matches/${slug}`);
}

export async function removeSavedMatchAction(slug: string) {
  await removeSavedMatchBySlug(slug);
  revalidatePath(`/matches/${slug}`);
}
