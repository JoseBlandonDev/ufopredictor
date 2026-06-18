import Link from "next/link";

export default function WompiFailurePage() {
  return (
    <section className="ufo-card rounded-lg border border-[var(--warning)]/25 p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--warning)]">
        Pago no completado
      </p>
      <h1 className="mt-2 text-3xl font-semibold">No se activo acceso premium</h1>
      <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
        Los redirects no activan premium. Puedes volver a pricing e iniciar un checkout nuevo.
      </p>
      <Link href="/pricing" className="ufo-btn-primary ufo-focus-ring mt-5 inline-flex">
        Volver a pricing
      </Link>
    </section>
  );
}
