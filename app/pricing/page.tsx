import Link from "next/link";
import { PlanCard } from "@/components/plan-card";
import { WompiCheckoutButton } from "@/components/wompi-checkout-button";
import { hasCurrentPremiumAccess } from "@/lib/permissions/current-premium-access";
import {
  getPublicPlansCatalogData,
  getViewerEntitlementSummary,
} from "@/lib/supabase/entitlement-queries";
import { getWompiWorldCupPassPrice } from "@/lib/wompi/pricing";

export const dynamic = "force-dynamic";

const worldCupPackageRoadmap = [
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
    description: "Acceso planificado por seleccion o equipo especifico.",
  },
  {
    slug: "group-pass",
    name: "Group Pass",
    description: "Acceso planificado por grupo del Mundial.",
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
  const [catalog, worldCupPassPrice, viewerSummary] = await Promise.all([
    getPublicPlansCatalogData(),
    getWompiWorldCupPassPrice(),
    getViewerEntitlementSummary(),
  ]);
  const premiumAccessActive = hasCurrentPremiumAccess(viewerSummary);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Planes
        </p>
        <h1 className="text-4xl font-semibold">Ruta de acceso actual</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          {premiumAccessActive
            ? "Tu World Cup Pass ya esta activo. Desde aqui puedes revisar tu estado premium o volver a las predicciones con el acceso desbloqueado."
            : "Las cuentas gratis estan disponibles ahora. El World Cup Pass ya puede iniciar checkout con Wompi; el acceso se confirma solo con webhook validado."}
        </p>
      </section>

      <section className={premiumAccessActive ? "grid gap-4" : "grid gap-4 lg:grid-cols-2"}>
        {premiumAccessActive ? (
          <article className="ufo-card rounded-lg border border-[var(--accent)]/40 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                  Acceso premium
                </p>
                <h2 className="mt-2 text-xl font-semibold">World Cup Pass activo</h2>
              </div>
              <span className="ufo-pill">Premium activo</span>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Tu membresia ya esta vinculada a derechos premium del Mundial 2026. No necesitas
              comprar de nuevo; el acceso se valida desde el servidor en cada vista protegida.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
                Abrir panel premium
              </Link>
              <Link href="/predictions" className="ufo-btn-secondary ufo-focus-ring">
                Ver predicciones
              </Link>
            </div>
          </article>
        ) : (
          <>
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
                Predicciones publicas, detalle publico de partidos y contexto basico de confianza y
                riesgo para fixtures reales ya publicados.
              </p>
            </article>

            <article className="ufo-card rounded-lg border border-[var(--accent)]/40 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                    Wompi
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">World Cup Pass</h2>
                </div>
                <span className="ufo-pill">Activo</span>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {worldCupPassPrice.displayPrice}
              </p>
              {worldCupPassPrice.isOfferActive && worldCupPassPrice.offerEndsAt ? (
                <p className="mt-2 text-xs font-medium text-[var(--accent)]">
                  Oferta activa por tiempo limitado.
                </p>
              ) : null}
              <p className="mt-3 text-sm text-[var(--muted)]">
                Accede a xG, top scorelines, BTTS, Over/Under y lectura avanzada del modelo.
              </p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                El redirect no activa premium. La activacion ocurre cuando Wompi confirma el pago por webhook validado.
              </p>
              <div className="mt-5">
                <WompiCheckoutButton />
              </div>
            </article>
          </>
        )}
      </section>

      <section className="ufo-card rounded-lg border border-white/15 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Paquetes Mundial 2026
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Ruta planeada del catalogo premium</h2>
          </div>
          <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">Ruta parcial</span>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
          El MVP habilita solo World Cup Pass con Wompi. Los demas paquetes siguen
          planeados. El acceso premium se habilita unicamente con autorizacion server-side.
        </p>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {worldCupPackageRoadmap.map((pkg) => (
            <article key={pkg.slug} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                  Proximamente
                </p>
                <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">Planificado</span>
              </div>
              <h3 className="mt-3 text-base font-semibold">{pkg.name}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{pkg.description}</p>
              <p className="mt-3 text-xs text-[var(--muted)]">Sin checkout activo todavia.</p>
            </article>
          ))}
        </div>
      </section>

      {catalog.status === "unavailable" ? (
        <section className="ufo-card rounded-lg p-5 text-sm text-[var(--muted)]">
          <p>{catalog.message}</p>
          {premiumAccessActive ? (
            <p className="mt-2">Tu World Cup Pass sigue activo aunque el catalogo dinamico no responda.</p>
          ) : (
            <p className="mt-2">
              Las cuentas gratis siguen activas mientras la publicacion de planes premium se organiza
              para mas adelante.
            </p>
          )}
          <p className="mt-2">El checkout usa Wompi y requiere webhook validado para activar premium.</p>
        </section>
      ) : catalog.plans.length === 0 ? (
        <section className="ufo-card rounded-lg p-5 text-sm text-[var(--muted)]">
          <p>No hay planes publicos visibles en este momento.</p>
          {premiumAccessActive ? (
            <p className="mt-2">Tu World Cup Pass activo se muestra arriba aunque el catalogo dinamico no este disponible.</p>
          ) : (
            <>
              <p className="mt-2">El acceso con cuenta gratis sigue disponible.</p>
              <p className="mt-2">El World Cup Pass se muestra arriba aunque el catalogo dinamico no este disponible.</p>
            </>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                Catalogo disponible
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Planes previstos para etapas posteriores</h2>
            </div>
            <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">Pagos deshabilitados</span>
          </div>
          <p className="max-w-3xl text-sm text-[var(--muted)]">
            Estas tarjetas describen el catalogo planeado. Solo World Cup Pass tiene checkout con Wompi
            en este MVP.
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
