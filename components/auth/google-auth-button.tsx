"use client";

import { LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type GoogleAuthButtonProps = {
  nextPath?: string;
};

function buildLoginErrorHref(nextPath?: string) {
  const error = encodeURIComponent("No pudimos conectar con Google. Intenta de nuevo o usa correo y contraseña.");

  if (!nextPath) {
    return `/login?error=${error}`;
  }

  return `/login?error=${error}&next=${encodeURIComponent(nextPath)}`;
}

export function GoogleAuthButton({ nextPath }: GoogleAuthButtonProps) {
  async function handleGoogleLogin() {
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);

      if (nextPath) {
        redirectTo.searchParams.set("next", nextPath);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error || !data.url) {
        window.location.assign(buildLoginErrorHref(nextPath));
        return;
      }

      window.location.assign(data.url);
    } catch {
      window.location.assign(buildLoginErrorHref(nextPath));
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="ufo-focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#eaf6fb]"
    >
      <LogIn className="h-4 w-4" aria-hidden="true" />
      Continuar con Google
    </button>
  );
}
