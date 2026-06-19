import Link from "next/link";
import { PublicPredictionCard } from "@/components/public-prediction-card";
import { hasCurrentPremiumAccess } from "@/lib/permissions/current-premium-access";
import { getViewerEntitlementSummary } from "@/lib/supabase/entitlement-queries";
import { getPublicPredictionsData } from "@/lib/supabase/public-prediction-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer = user ? "registered_free" : "anonymous";
  const isAuthenticated = viewer === "registered_free";
  const [data, viewerSummary] = await Promise.all([
    getPublicPredictionsData(viewer),
    user ? getViewerEntitlementSummary() : Promise.resolve(null),
  ]);
  const premiumAccessActive = hasCurrentPremiumAccess(viewerSummary);

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Predicciones
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Predicciones reales publicadas del Mundial 2026</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Las probabilidades 1X2 basicas ya estan publicadas para fixtures reales seleccionados del
          Mundial 2026. El detalle premium se muestra cuando tu acceso y la publicacion del partido lo permiten.
        </p>
      </section>

      <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-5">
        <h2 className="text-lg font-semibold">
          {premiumAccessActive
            ? "World Cup Pass activo"
            : isAuthenticated
              ? "Tu cuenta gratis esta activa"
              : "Cuenta gratis disponible"}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {premiumAccessActive
            ? "Tu acceso premium ya esta activo. Entra al detalle de cada partido para ver las secciones avanzadas que esten publicadas."
            : isAuthenticated
              ? "Ya ves el contexto completo de confianza y riesgo en las predicciones publicas publicadas y puedes seguir el detalle del partido."
              : "Crea una cuenta gratis para desbloquear el contexto completo de confianza y riesgo y seguir las predicciones publicas publicadas con mas claridad."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {premiumAccessActive ? (
            <>
              <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
                Abrir panel premium
              </Link>
              <Link href="/pricing" className="ufo-btn-secondary ufo-focus-ring">
                Revisar World Cup Pass
              </Link>
            </>
          ) : isAuthenticated ? (
            <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
              Abrir tu panel
            </Link>
          ) : (
            <>
              <Link href="/register?next=/predictions" className="ufo-btn-primary ufo-focus-ring">
                Crear cuenta gratis
              </Link>
              <Link href="/login?next=/predictions" className="ufo-btn-secondary ufo-focus-ring">
                Iniciar sesion
              </Link>
            </>
          )}
        </div>
      </section>

      {data.status === "unavailable" ? (
        <section className="ufo-card rounded-lg border border-[var(--warning)]/25 p-6">
          <h2 className="text-lg font-semibold">Predicciones temporalmente no disponibles</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{data.message}</p>
        </section>
      ) : data.upcomingPredictions.length === 0 && data.historicalPredictions.length === 0 ? (
        <section className="ufo-card rounded-lg p-6">
          <h2 className="text-lg font-semibold">Aun no hay predicciones publicas</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Las predicciones publicadas para producto publico apareceran aqui.
          </p>
        </section>
      ) : (
        <>
          {data.upcomingPredictions.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Predicciones activas y proximas</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Los partidos en vivo o por jugar aparecen primero para priorizar la lectura actual
                  del modelo.
                </p>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {data.upcomingPredictions.map((prediction) => (
                  <PublicPredictionCard
                    key={prediction.matchSlug}
                    prediction={prediction}
                    premiumAccessActive={premiumAccessActive}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {data.historicalPredictions.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Resultados recientes e historial</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Los fixtures finalizados quedan en una seccion secundaria para no dominar la vista
                  principal de predicciones.
                </p>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {data.historicalPredictions.map((prediction) => (
                  <PublicPredictionCard
                    key={prediction.matchSlug}
                    prediction={prediction}
                    premiumAccessActive={premiumAccessActive}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="ufo-card rounded-lg border border-white/15 p-5">
            <h2 className="text-lg font-semibold">Como leer esta vista</h2>
            <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <p>Las probabilidades reflejan una lectura del modelo, no una promesa de resultado.</p>
              <p>Alta incertidumbre: probabilidades cercanas. Ventaja ligera, no certeza.</p>
              <p>
                {premiumAccessActive
                  ? "Tu World Cup Pass habilita las secciones premium cuando estan publicadas para el partido."
                  : "Esta vista sigue limitada a predicciones publicas basicas para fixtures reales seleccionados."}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
