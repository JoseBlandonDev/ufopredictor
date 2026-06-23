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
  const checkEmailHref = nextPath
    ? `/auth/check-email?next=${encodeURIComponent(nextPath)}`
    : "/auth/check-email";
  const benefits = isLogin
    ? [
        "Accede a tus partidos guardados.",
        "Consulta el contexto completo de confianza y riesgo.",
        "Retoma tu recorrido hacia el Pase Mundial cuando lo necesites.",
      ]
    : [
        "Probabilidades 1X2 publicadas.",
        "Contexto de confianza y riesgo.",
        "Partidos guardados y análisis histórico verificado.",
      ];

  return (
    <section className="panel w-full max-w-lg rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-3 text-[var(--accent)]">
        <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-2">
          {isLogin ? <LockKeyhole className="h-5 w-5" /> : <Radar className="h-5 w-5" />}
        </span>
        <p className="font-mono text-xs uppercase tracking-[0.2em]">{isLogin ? "Acceso" : "Registro"}</p>
      </div>
      <h1 className="mt-5 text-3xl font-semibold">{isLogin ? "Inicia sesión" : "Crea tu cuenta"}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {isLogin
          ? "Accede a tu panel, a tus partidos guardados y a las señales habilitadas para tu perfil."
          : "Regístrate para seguir las predicciones públicas del Mundial 2026 y desbloquear una experiencia gratuita más útil."}
      </p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-white">{isLogin ? "Al entrar podrás" : "Con tu cuenta gratis obtienes"}</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          {benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Puedes revisar la información del {` `}
          <Link href="/pricing" className="text-[var(--accent)] hover:text-white">
            Pase Mundial 2026
          </Link>
          {` `}antes o después de crear tu cuenta.
        </p>
      </div>

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
              className="ufo-focus-ring w-full rounded-md border border-white/10 bg-[#050b14]/70 px-3 py-3 text-white outline-none transition focus:border-[var(--accent)]"
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
            className="ufo-focus-ring w-full rounded-md border border-white/10 bg-[#050b14]/70 px-3 py-3 text-white outline-none transition focus:border-[var(--accent)]"
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
            className="ufo-focus-ring w-full rounded-md border border-white/10 bg-[#050b14]/70 px-3 py-3 text-white outline-none transition focus:border-[var(--accent)]"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_0_22px_rgba(0,215,255,0.2)] transition hover:bg-white"
        >
          {isLogin ? "Ingresar" : "Crear cuenta"}
        </button>
      </form>

      {isLogin ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          <Link href={checkEmailHref} className="text-[var(--accent)] hover:text-white">
            Reenviar confirmación
          </Link>
        </p>
      ) : null}

      <p className="mt-6 text-sm text-[var(--muted)]">
        {isLogin ? "Aún no tienes cuenta? " : "Ya tienes cuenta? "}
        <Link href={alternateHrefWithNext} className="text-[var(--accent)] hover:text-white">
          {isLogin ? "Regístrate" : "Inicia sesión"}
        </Link>
      </p>
    </section>
  );
}
