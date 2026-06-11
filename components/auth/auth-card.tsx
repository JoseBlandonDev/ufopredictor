import Link from "next/link";
import { LockKeyhole, Radar } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";

type AuthCardProps = {
  mode: "login" | "register";
  action: (formData: FormData) => void | Promise<void>;
  nextPath?: string;
  error?: string;
  message?: string;
};

export function AuthCard({ mode, action, nextPath, error, message }: AuthCardProps) {
  const isLogin = mode === "login";
  const alternateHref = isLogin ? "/register" : "/login";
  const alternateHrefWithNext = nextPath
    ? `${alternateHref}?next=${encodeURIComponent(nextPath)}`
    : alternateHref;

  return (
    <section className="panel w-full max-w-md rounded-lg p-6 sm:p-8">
      <div className="flex items-center gap-3 text-[var(--accent)]">
        <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-2">
          {isLogin ? <LockKeyhole className="h-5 w-5" /> : <Radar className="h-5 w-5" />}
        </span>
        <p className="font-mono text-xs uppercase tracking-[0.2em]">{isLogin ? "Acceso" : "Registro"}</p>
      </div>
      <h1 className="mt-5 text-3xl font-semibold">{isLogin ? "Inicia sesión" : "Crea tu cuenta"}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {isLogin
          ? "Accede a tu panel y a las señales habilitadas para tu perfil."
          : "Crea tu perfil de observador para acceder al panel de UFO Predictor."}
      </p>

      {message ? (
        <p className="mt-5 rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 p-3 text-sm text-[var(--accent)]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-5 rounded-md border border-[var(--danger)]/35 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <GoogleAuthButton nextPath={nextPath} />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase text-[var(--muted)]">
        <span className="h-px flex-1 bg-white/10" />
        <span>o usa correo</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form action={action} className="space-y-4">
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        {!isLogin ? (
          <label className="block space-y-2 text-sm">
            <span className="text-[var(--muted)]">Nombre</span>
            <input
              name="fullName"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              className="w-full rounded-md border border-white/10 bg-[#050b14]/70 px-3 py-3 text-white outline-none transition focus:border-[var(--accent)]"
            />
          </label>
        ) : null}
        <label className="block space-y-2 text-sm">
          <span className="text-[var(--muted)]">Correo electrónico</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-white/10 bg-[#050b14]/70 px-3 py-3 text-white outline-none transition focus:border-[var(--accent)]"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-[var(--muted)]">Contraseña</span>
          <input
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? 1 : 8}
            className="w-full rounded-md border border-white/10 bg-[#050b14]/70 px-3 py-3 text-white outline-none transition focus:border-[var(--accent)]"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_0_22px_rgba(0,215,255,0.2)] transition hover:bg-white"
        >
          {isLogin ? "Ingresar" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--muted)]">
        {isLogin ? "¿Aún no tienes cuenta? " : "¿Ya tienes cuenta? "}
        <Link href={alternateHrefWithNext} className="text-[var(--accent)] hover:text-white">
          {isLogin ? "Regístrate" : "Inicia sesión"}
        </Link>
      </p>
    </section>
  );
}
