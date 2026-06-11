"use client";

import { useMemo } from "react";
import { LogIn } from "lucide-react";

type GoogleAuthButtonProps = {
  nextPath?: string;
};

export function GoogleAuthButton({ nextPath }: GoogleAuthButtonProps) {
  const href = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return nextPath
        ? `/login?error=${encodeURIComponent("Falta configurar NEXT_PUBLIC_SUPABASE_URL en el despliegue.")}&next=${encodeURIComponent(nextPath)}`
        : `/login?error=${encodeURIComponent("Falta configurar NEXT_PUBLIC_SUPABASE_URL en el despliegue.")}`;
    }

    if (typeof window === "undefined") {
      return "#";
    }

    const callbackUrl = new URL("/auth/callback", window.location.origin);

    if (nextPath) {
      callbackUrl.searchParams.set("next", nextPath);
    }

    return (
      `${supabaseUrl}/auth/v1/authorize?provider=google` +
      `&redirect_to=${encodeURIComponent(callbackUrl.toString())}` +
      "&access_type=offline&prompt=select_account"
    );
  }, [nextPath]);

  const isReady = href !== "#";

  return (
    <a
      href={href ?? "#"}
      aria-disabled={!isReady}
      onClick={(event) => {
        if (!href) {
          event.preventDefault();
        }
      }}
      className="ufo-focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#eaf6fb] aria-disabled:cursor-wait aria-disabled:opacity-70"
    >
      <LogIn className="h-4 w-4" aria-hidden="true" />
      Continuar con Google
    </a>
  );
}
