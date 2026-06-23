import Link from "next/link";
import { WompiCheckoutButton } from "@/components/wompi-checkout-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getWorldCupProductName } from "../../lib/presentation/public-display";
import { hasCurrentPremiumAccess } from "@/lib/permissions/current-premium-access";
import { getViewerEntitlementSummary } from "@/lib/supabase/entitlement-queries";
import { getWompiWorldCupPassPrice } from "@/lib/wompi/pricing";

export const dynamic = "force-dynamic";

const SAFE_PRICING_UNAVAILABLE_MESSAGE =
  "La compra está temporalmente no disponible. Inténtalo nuevamente más tarde.";

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
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Planes</p>
        <h1 className="text-4xl font-semibold">{getWorldCupProductName()}</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          {premiumAccessActive
            ? `Tu ${getWorldCupProductName()} ya está activo. Desde aquí puedes revisar tu estado premium o volver a las predicciones con el acceso desbloqueado.`
            : "Un solo pago desbloquea el análisis premium para los partidos publicados del Mundial 2026 cubiertos por este producto."}
        </p>
      </section>

      {premiumAccessActive ? (
        <section className="ufo-card rounded-2xl border border-[var(--accent)]/40 p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Acceso premium</p>
              <h2 className="mt-2 text-2xl font-semibold">{getWorldCupProductName()} activo</h2>
            </div>
            <span className="ufo-pill">Premium activo</span>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
            Tu acceso premium ya está listo para los partidos publicados del Mundial 2026. No necesitas comprar de nuevo.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/predictions" className="ufo-btn-secondary ufo-focus-ring">
              Explorar predicciones
            </Link>
            <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
              Abrir panel
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="ufo-card rounded-2xl border border-[var(--accent)]/35 p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Producto premium</p>
                <h2 className="mt-2 text-3xl font-semibold">{getWorldCupProductName()}</h2>
              </div>
              <span className="ufo-pill">Pago único</span>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="text-4xl font-semibold text-white">
                  {worldCupPassPrice.status === "available" ? worldCupPassPrice.displayPrice : "US$20"}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">Pago único para todo el torneo publicado.</p>
                <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                  <li>Escenarios representativos</li>
                  <li>Goles esperados (xG)</li>
                  <li>Ambos equipos marcan</li>
                  <li>Más/Menos de 2,5</li>
                  <li>Interpretación completa de confianza y riesgo</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-medium text-white">Acceso premium para partidos publicados</p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Diseñado para consultar el análisis completo antes de que empiece cada encuentro disponible.
                </p>
                <p className="mt-4 text-xs text-[var(--muted)]">
                  Wompi procesará el pago en pesos colombianos. Tu banco puede aplicar su propia conversión.
                </p>
                {worldCupPassPrice.status === "available" ? (
                  <>
                    <p className="mt-2 text-xs text-[var(--muted)]">Cobro Wompi: {worldCupPassPrice.checkoutDisplay}</p>
                    <div className="mt-5">
                      {user ? (
                        <WompiCheckoutButton />
                      ) : (
                        <Link href="/register?next=/pricing" className="ufo-btn-primary ufo-focus-ring inline-flex">
                          Crear cuenta para comprar
                        </Link>
                      )}
                    </div>
                    {!user ? (
                      <Link href="/login?next=/pricing" className="ufo-link-action ufo-focus-ring mt-3">
                        Iniciar sesión
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-5 text-sm text-[var(--warning)]">{SAFE_PRICING_UNAVAILABLE_MESSAGE}</p>
                )}
              </div>
            </div>
          </section>

          <section className="ufo-card rounded-2xl border border-white/15 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Comparación rápida</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-lg font-semibold">Cuenta gratis</h3>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <li>Probabilidades 1X2 publicadas</li>
                  <li>Contexto de confianza y riesgo</li>
                  <li>Partidos guardados</li>
                  <li>Historial premium verificado para casos elegibles</li>
                </ul>
              </article>
              <article className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/6 p-4">
                <h3 className="text-lg font-semibold">{getWorldCupProductName()}</h3>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <li>Análisis premium antes del inicio</li>
                  <li>Escenarios, xG y señales avanzadas</li>
                  <li>Lectura completa por partido</li>
                  <li>Sin recompras mientras siga activo</li>
                </ul>
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
