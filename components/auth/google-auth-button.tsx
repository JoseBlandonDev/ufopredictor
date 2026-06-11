"use client";

type GoogleAuthButtonProps = {
  nextPath?: string;
};

export function GoogleAuthButton({ nextPath }: GoogleAuthButtonProps) {
  async function handleGoogleLogin() {
    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
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
      window.location.assign(
        nextPath ? `/login?error=${encodeURIComponent("No pudimos conectar con Google. Intenta de nuevo o usa correo y contraseña.")}&next=${encodeURIComponent(nextPath)}` : "/login?error=No+pudimos+conectar+con+Google.+Intenta+de+nuevo+o+usa+correo+y+contrase%C3%B1a.",
      );
      return;
    }

    window.location.assign(data.url);
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="ufo-focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#eaf6fb]"
    >
      Continuar con Google
    </button>
  );
}
