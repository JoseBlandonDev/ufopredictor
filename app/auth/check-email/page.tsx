import Link from "next/link";
import { CheckCircle2, MailCheck, RotateCcw } from "lucide-react";
import { continueAfterConfirmationAction, resendConfirmationAction } from "@/app/auth/actions";
import { getSafeRedirectPath } from "@/lib/auth/paths";

type CheckEmailPageProps = {
  searchParams: Promise<{
    email?: string;
    message?: string;
    next?: string;
  }>;
};

function getDisplayEmail(value: string | undefined) {
  if (!value || !value.includes("@")) {
    return null;
  }

  return value.trim();
}

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const params = await searchParams;
  const nextPath = getSafeRedirectPath(params.next);
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const displayEmail = getDisplayEmail(params.email);

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <section className="panel w-full max-w-lg rounded-lg p-6 sm:p-8">
        <div className="flex items-center gap-3 text-[var(--accent)]">
          <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-2">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="font-mono text-xs uppercase tracking-[0.2em]">CONFIRMA TU EMAIL</p>
        </div>

        <h1 className="mt-5 text-3xl font-semibold">Confirma tu cuenta</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Hemos enviado un correo de confirmacion a tu email. Abre el enlace para activar tu cuenta y
          volver al panel.
        </p>

        {displayEmail ? (
          <div className="mt-5 rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/10 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Correo enviado a</p>
            <a href={`mailto:${displayEmail}`} className="mt-2 block break-all text-sm font-semibold text-white">
              {displayEmail}
            </a>
          </div>
        ) : null}

        {params.message ? (
          <p className="mt-5 rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 p-3 text-sm text-[var(--accent)]">
            {params.message}
          </p>
        ) : null}

        <form action={continueAfterConfirmationAction} className="mt-6">
          <input type="hidden" name="next" value={nextPath} />
          <button
            type="submit"
            className="ufo-focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_0_22px_rgba(0,215,255,0.2)] transition hover:bg-white"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Ya confirme mi correo
          </button>
        </form>

        <form action={resendConfirmationAction} className="mt-3 space-y-3">
          <input type="hidden" name="next" value={nextPath} />
          {displayEmail ? (
            <input type="hidden" name="email" value={displayEmail} />
          ) : (
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
          )}
          <button
            type="submit"
            className="ufo-focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--accent)]/35 bg-[#0a1a2b]/70 px-4 py-3 text-sm font-semibold text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reenviar correo
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          <Link href={loginHref} className="text-[var(--muted)] underline-offset-4 hover:text-white hover:underline">
            Volver a iniciar sesion
          </Link>
        </p>
      </section>
    </div>
  );
}
