import { PlanCard } from "@/components/plan-card";
import { plans } from "@/lib/mock-data";

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Planes</p>
        <h1 className="mt-3 text-4xl font-semibold">Estructura de planes dinámicos</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Estos planes son registros simulados preparados para futura configuración en base de datos, permisos y desbloqueos de partidos.
        </p>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
