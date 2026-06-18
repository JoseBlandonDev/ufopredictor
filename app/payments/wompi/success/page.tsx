import Link from "next/link";

export default function WompiSuccessPage() {
  return (
    <section className="ufo-card rounded-lg border border-emerald-400/25 p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">
        Pago recibido
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Estamos verificando tu World Cup Pass</h1>
      <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
        Esta pantalla es informativa. El acceso queda activo cuando el webhook validado de Wompi materializa el entitlement.
      </p>
      <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring mt-5 inline-flex">
        Abrir panel
      </Link>
    </section>
  );
}
