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
        <h1 className="mt-3 text-4xl font-semibold">Planes para la etapa beta</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Este catálogo muestra opciones activas para el acceso futuro y la beta
          freemium. Todavía no hay compras, checkout ni pagos habilitados.
        </p>
      </section>

      {catalog.status === "unavailable" ? (
        <p className="panel rounded-lg p-5 text-sm text-[var(--muted)]">{catalog.message}</p>
      ) : catalog.plans.length === 0 ? (
        <p className="panel rounded-lg p-5 text-sm text-[var(--muted)]">
          No hay planes visibles para la etapa beta en este momento.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {catalog.plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
