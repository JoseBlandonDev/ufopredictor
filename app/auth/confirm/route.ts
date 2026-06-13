import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { buildAppUrl } from "@/lib/auth/app-url";
import { getSafeRedirectPath } from "@/lib/auth/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appOrigin = buildAppUrl("/", url.origin).origin;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextPath = getSafeRedirectPath(url.searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, appOrigin));
    }
  }

  const params = new URLSearchParams({
    error: "El enlace de confirmacion expiro, ya fue usado o no es valido. Solicita una nueva confirmacion.",
    next: nextPath,
  });

  return NextResponse.redirect(new URL(`/login?${params.toString()}`, appOrigin));
}
