import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { PublicPredictionCard } from "../components/public-prediction-card";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getWorldCupProductName,
  resolveTeamDisplayName,
} from "../lib/presentation/public-display";
import { hasCurrentPremiumAccess } from "@/lib/permissions/current-premium-access";
import { getViewerEntitlementSummary } from "@/lib/supabase/entitlement-queries";
import { getPublicPredictionsData } from "@/lib/supabase/public-prediction-queries";

export default async function HomePage() {
  const user = await getCurrentUser();
  const viewerSummary = user ? await getViewerEntitlementSummary() : null;
  const premiumAccessActive = hasCurrentPremiumAccess(viewerSummary);
  const viewer = user ? "registered_free" : "anonymous";
  const publicPredictionsData = await getPublicPredictionsData(viewer);
  const livePredictions =
    publicPredictionsData.status === "ready" ? publicPredictionsData.livePredictions : [];
  const awaitingUpdatePredictions =
    publicPredictionsData.status === "ready" ? publicPredictionsData.awaitingUpdatePredictions : [];
  const upcomingPredictions =
    publicPredictionsData.status === "ready" ? publicPredictionsData.upcomingPredictions : [];
  const featuredPrediction = livePredictions[0] ?? upcomingPredictions[0] ?? null;
  const isFeaturedPredictionLive = featuredPrediction?.collectionMode === "in_progress";
  const additionalPredictions =
    livePredictions.length > 0 ? upcomingPredictions.slice(0, 3) : upcomingPredictions.slice(1, 4);
  const featureCards = premiumAccessActive
    ? [
        [
          "Predicciones publicadas",
          "Consulta probabilidades 1X2 y una lectura pública del riesgo para los partidos publicados del Mundial 2026.",
        ],
        [
          `${getWorldCupProductName()} activo`,
          "Tu acceso premium ya está activo y habilita el detalle avanzado cuando ese partido está publicado.",
        ],
        [
          "Detalle premium",
          "Las secciones avanzadas se muestran automáticamente cuando el partido tiene proyección premium publicada.",
        ],
      ]
    : [
        [
          "Predicciones públicas",
          "Consulta probabilidades 1X2 y una lectura pública del riesgo para los partidos publicados del Mundial 2026.",
        ],
        [
          "Cuenta gratis",
          "Las cuentas gratis añaden contexto completo de confianza y riesgo, además de herramientas de seguimiento para guardar partidos.",
        ],
        [
          getWorldCupProductName(),
          "Activa el acceso premium para ver escenarios, xG y señales ampliadas en todos los partidos publicados del Mundial.",
        ],
      ];

  return (
    <div className="space-y-12">
      <section className="relative grid items-center gap-8 overflow-hidden py-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(0,215,255,0.15),transparent_48%),radial-gradient(circle_at_top_right,rgba(0,153,204,0.12),transparent_40%)]" />
        <div className="relative">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--accent)]">
            Predicciones del Mundial 2026
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            UFO Predictor
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
            Sigue el Mundial 2026 con probabilidades 1X2 publicadas, contexto de confianza y riesgo,
            y un detalle premium pensado para leer cada partido sin convertir la incertidumbre en falsa certeza.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {premiumAccessActive ? (
              <>
                <Link href="/predictions" className="ufo-btn-primary ufo-focus-ring">
                  Ver análisis premium <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="ufo-btn-secondary ufo-focus-ring">
                  Abrir panel
                </Link>
              </>
            ) : viewer === "registered_free" ? (
              <>
                <Link href="/predictions" className="ufo-btn-primary ufo-focus-ring">
                  Ver predicciones <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/pricing" className="ufo-btn-secondary ufo-focus-ring">
                  Desbloquear análisis premium
                </Link>
              </>
            ) : (
              <>
                <Link href="/register?next=/predictions" className="ufo-btn-primary ufo-focus-ring">
                  Crear cuenta gratis <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/predictions" className="ufo-btn-secondary ufo-focus-ring">
                  Ver predicciones
                </Link>
                <Link href="/pricing" className="ufo-link-action ufo-focus-ring">
                  Ver {getWorldCupProductName()}
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="panel relative overflow-hidden rounded-2xl p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[var(--accent)]/10 blur-3xl" />
          <div className="relative mx-auto mb-5 aspect-square w-full max-w-[260px] sm:max-w-[320px]">
            <Image
              src="/brand/ufo-predictor-logo-main.png"
              alt="UFO Predictor"
              fill
              className="object-contain drop-shadow-[0_0_24px_rgba(0,215,255,0.28)]"
              sizes="(min-width: 1024px) 320px, 70vw"
              priority
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Antes y después del partido
            </p>
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm">Probabilidades 1X2</p>
              <p className="mt-1 text-xl text-[var(--accent)]">Local, empate y visitante</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Lectura pública del partido con una vista útil para visitantes, cuentas gratis y acceso premium.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm">Contexto de riesgo</p>
              <p className="mt-1 text-xl text-[var(--accent)]">Probabilidades, no certezas</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Una ventaja ligera no significa certeza y las probabilidades cerradas exigen cautela.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm">Cobertura gradual</p>
              <p className="mt-1 text-xl text-[var(--accent)]">Partidos publicados</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Los partidos terminados con resultado verificado permanecen disponibles como historial público.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Disponible ahora
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Predicciones disponibles</h2>
          </div>
          <Link href="/predictions" className="hidden text-sm text-[var(--accent)] sm:block">
            Ir a predicciones
          </Link>
        </div>
        {featuredPrediction ? (
          <div className="panel rounded-lg p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              {isFeaturedPredictionLive
                ? "Partido en curso destacado"
                : "Próximo partido destacado"}
            </p>
            <h3 className="mt-3 text-2xl font-semibold break-words">
              {resolveTeamDisplayName(featuredPrediction.homeTeamName)} vs{" "}
              {resolveTeamDisplayName(featuredPrediction.awayTeamName)}
            </h3>
            <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
              {isFeaturedPredictionLive
                ? "Consulta la predicción publicada antes del inicio del partido, conserva sus probabilidades 1X2 y revisa el detalle sin tratarla como una actualización en vivo."
                : "Consulta la predicción pública más cercana, revisa sus probabilidades 1X2 y entra al detalle para entender el contexto de riesgo de ese partido."}
            </p>
            <div className="mt-5">
              <PublicPredictionCard
                prediction={featuredPrediction}
                detailMode="full"
                premiumAccessActive={premiumAccessActive}
                showLiveState={isFeaturedPredictionLive}
                showPreMatchDisclaimer={isFeaturedPredictionLive}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/matches/${featuredPrediction.matchSlug}`}
                className="ufo-btn-primary ufo-focus-ring"
              >
                {premiumAccessActive ? "Ver análisis completo" : "Ver detalle del partido"}
              </Link>
              <Link href="/predictions" className="ufo-btn-secondary ufo-focus-ring">
                Ver todas las predicciones
              </Link>
              {!premiumAccessActive && viewer === "anonymous" ? (
                <Link href="/pricing" className="ufo-link-action ufo-focus-ring">
                  Ver {getWorldCupProductName()}
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="panel rounded-lg p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Sin próximos partidos publicados
            </p>
            <h3 className="mt-3 text-2xl font-semibold">Aún no hay un partido destacado para mostrar</h3>
            <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
              En cuanto haya un próximo partido publicado, esta portada mostrará su lectura 1X2, la
              fecha en COT y el acceso directo al detalle.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/predictions" className="ufo-btn-primary ufo-focus-ring">
                Ver predicciones
              </Link>
              <Link href="/pricing" className="ufo-btn-secondary ufo-focus-ring">
                Ver {getWorldCupProductName()}
              </Link>
            </div>
          </div>
        )}
      </section>

      {additionalPredictions.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Más próximos partidos
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Sigue lo que viene después</h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {additionalPredictions.map((prediction) => (
              <PublicPredictionCard
                key={prediction.matchSlug}
                prediction={prediction}
                detailMode={viewer === "anonymous" ? "preview" : "full"}
                premiumAccessActive={premiumAccessActive}
              />
            ))}
          </div>
        </section>
      ) : null}

      {awaitingUpdatePredictions.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Sincronización pendiente
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Pendientes de actualización</h2>
            <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
              Estos partidos ya salieron de la ventana normal en curso o recibieron un estado oficial
              no programado. La predicción publicada sigue visible mientras se sincroniza y verifica
              el resultado oficial.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {awaitingUpdatePredictions.map((prediction) => (
              <PublicPredictionCard
                key={prediction.matchSlug}
                prediction={prediction}
                detailMode={viewer === "anonymous" ? "preview" : "full"}
                premiumAccessActive={premiumAccessActive}
                showLiveState
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {featureCards.map(([title, description]) => (
          <div key={title} className="panel rounded-lg p-5">
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
          </div>
        ))}
      </section>

      <section className="panel rounded-lg p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Interpretación responsable
        </p>
        <h2 className="mt-3 text-2xl font-semibold">Probabilidades, no certezas</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <p className="text-sm text-[var(--muted)]">
            Alta incertidumbre: probabilidades cercanas. Una ventaja ligera del modelo no debe
            leerse como una promesa de resultado.
          </p>
          <p className="text-sm text-[var(--muted)]">
            Mostramos una lectura pública del modelo con límites claros y una ruta premium simple
            para quienes quieran ver el detalle completo.
          </p>
        </div>
      </section>
    </div>
  );
}
