import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export type AppRole = ProfileRow["role"];

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

async function getProfileForUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ProfileRow;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return getProfileForUser(user.id);
}

export async function requireUser(nextPath = "/dashboard"): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

export async function hasRole(role: AppRole) {
  const profile = await getCurrentProfile();

  return profile?.role === role;
}

export async function requireAdmin(nextPath = "/admin") {
  const user = await requireUser(nextPath);
  const profile = await getProfileForUser(user.id);

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard?error=admin-access-required");
  }

  return { user, profile };
}
