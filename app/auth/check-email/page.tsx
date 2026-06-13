import Link from "next/link";
import { MailCheck } from "lucide-react";
import { resendConfirmationAction } from "@/app/auth/actions";
import { getSafeRedirectPath } from "@/lib/auth/paths";

type CheckEmailPageProps = {
  searchParams: Promise<{
    message?: string;
    next?: string;
  }>;
};

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const params = await searchParams;
  const nextPath = getSafeRedirectPath(params.next);
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <section className="panel w-full max-w-md rounded-lg p-6 sm:p-8">
        <div className="flex items-center gap-3 text-[var(--accent)]">
          <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-2">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="font-mono text-xs uppercase tracking-[0.2em]">Confirma tu cuenta</p>
        </div>

        <h1 className="mt-5 text-3xl font-semibold">Revisa tu correo</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Te enviamos un enlace para confirmar tu cuenta. Al abrirlo, quedaras con la sesion activa y
          volveras al panel.
        </p>

        {params.message ? (
          <p className="mt-5 rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 p-3 text-sm text-[var(--accent)]">
            {params.message}
          </p>
        ) : null}

        <form action={resendConfirmationAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <label className="block space-y-2 text-sm">
            <span className="text-[var(--muted)]">Correo electronico</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-white/10 bg-[#050b14]/70 px-3 py-3 text-white outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md border border-[var(--accent)]/35 bg-[#0a1a2b]/70 px-4 py-3 text-sm font-semibold text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
          >
            Reenviar confirmacion
          </button>
        </form>

        <Link href={loginHref} className="ufo-btn-primary ufo-focus-ring mt-6 w-full justify-center">
          Volver a iniciar sesion
        </Link>
      </section>
    </div>
  );
}
