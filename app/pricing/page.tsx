import Link from "next/link";
import { WompiCheckoutButton } from "@/components/wompi-checkout-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getWorldCupProductName } from "../../lib/presentation/public-display";
import { hasCurrentPremiumAccess } from "@/lib/permissions/current-premium-access";
import { getViewerEntitlementSummary } from "@/lib/supabase/entitlement-queries";
import { getWompiWorldCupPassPrice } from "@/lib/wompi/pricing";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const [worldCupPassPrice, user, viewerSummary] = await Promise.all([
    getWompiWorldCupPassPrice(),
    getCurrentUser(),
    getViewerEntitlementSummary(),
  ]);
  const premiumAccessActive = hasCurrentPremiumAccess(viewerSummary);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Planes
        </p>
        <h1 className="text-4xl font-semibold">{getWorldCupProductName()}</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          {premiumAccessActive
            ? `Tu ${getWorldCupProductName()} ya está activo. Desde aquí puedes revisar tu estado premium o volver a las predicciones con el acceso desbloqueado.`
            : "Un solo pago habilita el detalle premium para todos los partidos publicados del Mundial 2026."}
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
                <h2 className="mt-2 text-xl font-semibold">{getWorldCupProductName()} activo</h2>
              </div>
              <span className="ufo-pill">Premium activo</span>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Tu acceso premium ya está listo para los partidos publicados del Mundial 2026. No
              necesitas comprar de nuevo.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/predictions" className="ufo-btn-secondary ufo-focus-ring">
                Ver predicciones
              </Link>
              <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
                Abrir panel
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
                Predicciones públicas, detalle público de partidos y contexto base de confianza y
                riesgo para los encuentros ya publicados.
              </p>
            </article>

            <article className="ufo-card rounded-lg border border-[var(--accent)]/40 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                    Producto disponible
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">{getWorldCupProductName()}</h2>
                </div>
                <span className="ufo-pill">Pago único</span>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {worldCupPassPrice.status === "available"
                  ? worldCupPassPrice.displayPrice
                  : "Precio temporalmente no disponible"}
              </p>
              {worldCupPassPrice.status === "available" && worldCupPassPrice.isOfferActive && worldCupPassPrice.offerEndsAt ? (
                <p className="mt-2 text-xs font-medium text-[var(--accent)]">
                  Oferta activa por tiempo limitado.
                </p>
              ) : null}
              <p className="mt-3 text-sm text-[var(--muted)]">
                Accede al detalle premium de todos los partidos publicados del Mundial, con
                escenarios representativos, xG y señales ampliadas.
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">Pago único para todo el torneo publicado.</p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Wompi procesará el pago en pesos colombianos. Tu banco puede aplicar su propia conversión.
              </p>
              {worldCupPassPrice.status === "available" ? (
                <>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Cobro Wompi: {worldCupPassPrice.checkoutDisplay}
                  </p>
                  <div className="mt-5">
                    {user ? (
                      <WompiCheckoutButton />
                    ) : (
                      <Link href="/login?next=/pricing" className="ufo-btn-primary ufo-focus-ring inline-flex">
                        Inicia sesión para comprar
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-xs text-[var(--warning)]">
                  {worldCupPassPrice.message}
                </p>
              )}
            </article>
          </>
        )}
      </section>
    </div>
  );
}
