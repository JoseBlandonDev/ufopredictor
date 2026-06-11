"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";

type GoogleAuthButtonProps = {
  nextPath?: string;
};

export function GoogleAuthButton({ nextPath }: GoogleAuthButtonProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!supabaseUrl || !appUrl) {
    const errorHref = nextPath
      ? `/login?error=${encodeURIComponent("Falta configurar NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_APP_URL en el despliegue.")}&next=${encodeURIComponent(nextPath)}`
      : `/login?error=${encodeURIComponent("Falta configurar NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_APP_URL en el despliegue.")}`;

    return (
      <Link
        href={errorHref}
        className="ufo-focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#eaf6fb]"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Continuar con Google
      </Link>
    );
  }

  const redirectTo = new URL("/auth/callback", appUrl);

  if (nextPath) {
    redirectTo.searchParams.set("next", nextPath);
  }

  const href =
    `${supabaseUrl}/auth/v1/authorize?provider=google` +
    `&redirect_to=${encodeURIComponent(redirectTo.toString())}` +
    "&access_type=offline&prompt=select_account";

  return (
    <Link
      href={href}
      className="ufo-focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#eaf6fb]"
    >
      <LogIn className="h-4 w-4" aria-hidden="true" />
      Continuar con Google
    </Link>
  );
}
