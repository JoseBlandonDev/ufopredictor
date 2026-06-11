import { NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/auth/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = getSafeRedirectPath(url.searchParams.get("next"));
  const callbackUrl = new URL("/auth/callback", getAppUrl());
  callbackUrl.searchParams.set("next", nextPath);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "No pudimos conectar con Google. Intenta de nuevo o usa correo y contraseña.",
        )}&next=${encodeURIComponent(nextPath)}`,
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(data.url);
}
