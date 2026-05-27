import { PlanCard } from "@/components/plan-card";
import { getPublicPlansCatalogData } from "@/lib/supabase/entitlement-queries";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const catalog = await getPublicPlansCatalogData();

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Planes
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Ruta de acceso para la etapa beta</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Las cuentas gratis están disponibles ahora. Los planes premium llegarán más adelante.
          En esta fase todavía no hay checkout ni pagos.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel rounded-lg border border-[var(--accent)]/30 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Disponible ahora
          </p>
          <h2 className="mt-2 text-xl font-semibold">Cuenta gratis</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Predicciones públicas, detalle público de partidos y señales preview seleccionadas antes del Mundial.
          </p>
        </article>
        <article className="panel rounded-lg border border-white/15 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Más adelante
          </p>
          <h2 className="mt-2 text-xl font-semibold">Planes premium</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            El análisis más profundo y capas premium adicionales se introducirán en una fase posterior.
          </p>
        </article>
      </section>

      {catalog.status === "unavailable" ? (
        <section className="panel rounded-lg p-5 text-sm text-[var(--muted)]">
          <p>{catalog.message}</p>
          <p className="mt-2">
            Las cuentas gratis siguen activas mientras la publicación de planes premium se organiza para más adelante.
          </p>
          <p className="mt-2">Todavía no hay checkout ni pagos disponibles.</p>
        </section>
      ) : catalog.plans.length === 0 ? (
        <section className="panel rounded-lg p-5 text-sm text-[var(--muted)]">
          <p>No hay planes beta públicos visibles en este momento.</p>
          <p className="mt-2">El acceso con cuenta gratis sigue disponible.</p>
          <p className="mt-2">Todavía no hay checkout ni pagos disponibles.</p>
        </section>
      ) : (
        <>
          <p className="text-sm text-[var(--muted)]">
            Las tarjetas de planes premium son previews del catálogo beta. Todavía no hay checkout
            ni pagos disponibles.
          </p>
        <div className="grid gap-4 lg:grid-cols-3">
          {catalog.plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
        </>
      )}
    </div>
  );
}
