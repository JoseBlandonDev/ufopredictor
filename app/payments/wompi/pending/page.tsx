import Link from "next/link";

export default function WompiPendingPage() {
  return (
    <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
        Verificacion en curso
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Pago pendiente de confirmacion</h1>
      <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
        El acceso premium se activa solo cuando el webhook validado de Wompi confirma el pago en el servidor.
      </p>
      <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring mt-5 inline-flex">
        Abrir panel
      </Link>
    </section>
  );
}
