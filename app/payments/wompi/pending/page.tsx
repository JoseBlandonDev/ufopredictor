import Link from "next/link";

export default function WompiPendingPage() {
  return (
    <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
        Pago pendiente
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Pago pendiente de confirmacion</h1>
      <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
        Cuando Wompi apruebe la transaccion, el World Cup Pass se activara automaticamente en tu panel.
      </p>
      <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring mt-5 inline-flex">
        Abrir panel
      </Link>
    </section>
  );
}
