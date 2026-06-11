import { NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/auth/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const nextPath = getSafeRedirectPath(url.searchParams.get("next"));

  if (oauthError) {
    const params = new URLSearchParams({
      error: "No pudimos completar el acceso con Google.",
      next: nextPath,
    });

    return NextResponse.redirect(new URL(`/login?${params.toString()}`, url.origin));
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=El+enlace+de+confirmaci%C3%B3n+no+es+v%C3%A1lido.", url.origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=No+pudimos+confirmar+tu+sesi%C3%B3n.+Solicita+un+nuevo+acceso.", url.origin),
    );
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
