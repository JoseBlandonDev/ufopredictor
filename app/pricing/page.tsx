import { PlanCard } from "@/components/plan-card";
import { getPublicPlansCatalogData } from "@/lib/supabase/entitlement-queries";

export const dynamic = "force-dynamic";

const worldCupPackagePreview = [
  {
    slug: "world-cup-full-pass",
    name: "World Cup Full Pass",
    description: "Cobertura premium planificada para todo el Mundial 2026.",
  },
  {
    slug: "match-pack-10",
    name: "10 Match Pack",
    description: "Bolsa de 10 desbloqueos planificados para partidos seleccionados.",
  },
  {
    slug: "single-match-unlock",
    name: "Single Match Unlock",
    description: "Desbloqueo planificado para un partido premium puntual.",
  },
  {
    slug: "team-pass",
    name: "Country/Team Pass",
    description: "Acceso planificado por selección o equipo específico.",
  },
  {
    slug: "group-pass",
    name: "Group Pass",
    description: "Acceso planificado por grupo del Mundial (vista previa).",
  },
  {
    slug: "stage-pass",
    name: "Stage Pass",
    description: "Acceso planificado por fase del torneo (octavos, cuartos, etc.).",
  },
  {
    slug: "semifinals-final-pass",
    name: "Semifinals / Final Pass",
    description: "Acceso planificado para semifinales y final.",
  },
] as const;

export default async function PricingPage() {
  const catalog = await getPublicPlansCatalogData();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Planes
        </p>
        <h1 className="text-4xl font-semibold">Ruta de acceso para la etapa beta</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          Las cuentas gratis están disponibles ahora. Los planes premium llegarán más adelante.
          En esta fase todavía no hay checkout ni pagos habilitados.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="ufo-card rounded-lg border border-[var(--accent)]/30 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                Disponible ahora
              </p>
              <h2 className="mt-2 text-xl font-semibold">Cuenta gratis</h2>
            </div>
            <span className="ufo-pill">Activo</span>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Predicciones públicas, detalle público de partidos y señales preview seleccionadas antes del Mundial.
          </p>
        </article>

        <article className="ufo-card rounded-lg border border-white/15 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                Más adelante
              </p>
              <h2 className="mt-2 text-xl font-semibold">Planes premium</h2>
            </div>
            <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">Próximamente</span>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            El análisis más profundo y las capas premium adicionales se introducirán en una fase posterior.
          </p>
        </article>
      </section>

      <section className="ufo-card rounded-lg border border-white/15 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Paquetes Mundial 2026
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Vista previa del catálogo premium</h2>
          </div>
          <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">Sin checkout activo</span>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
          Estos paquetes están planeados para el Mundial. Todavía no hay checkout activo ni
          pagos habilitados en esta fase. El acceso premium se habilitará únicamente con
          autorización server-side.
        </p>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {worldCupPackagePreview.map((pkg) => (
            <article key={pkg.slug} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                  Próximamente
                </p>
                <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">Preview</span>
              </div>
              <h3 className="mt-3 text-base font-semibold">{pkg.name}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{pkg.description}</p>
              <p className="mt-3 text-xs text-[var(--muted)]">Sin checkout activo todavía.</p>
            </article>
          ))}
        </div>
      </section>

      {catalog.status === "unavailable" ? (
        <section className="ufo-card rounded-lg p-5 text-sm text-[var(--muted)]">
          <p>{catalog.message}</p>
          <p className="mt-2">
            Las cuentas gratis siguen activas mientras la publicación de planes premium se organiza para más adelante.
          </p>
          <p className="mt-2">Todavía no hay checkout ni pagos disponibles.</p>
        </section>
      ) : catalog.plans.length === 0 ? (
        <section className="ufo-card rounded-lg p-5 text-sm text-[var(--muted)]">
          <p>No hay planes beta públicos visibles en este momento.</p>
          <p className="mt-2">El acceso con cuenta gratis sigue disponible.</p>
          <p className="mt-2">Todavía no hay checkout ni pagos disponibles.</p>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                Catálogo beta
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Planes previstos para etapas posteriores</h2>
            </div>
            <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">Pagos deshabilitados</span>
          </div>
          <p className="max-w-3xl text-sm text-[var(--muted)]">
            Las tarjetas de planes premium son previews del catálogo beta. Todavía no hay checkout
            ni pagos disponibles.
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            {catalog.plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
