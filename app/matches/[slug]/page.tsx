import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ProbabilityBar } from "@/components/probability-bar";
import { RiskBadge } from "@/components/risk-badge";
import { getPublicMatchDetailData } from "@/lib/supabase/public-match-detail-queries";
import { getSavedMatchStateBySlug } from "@/lib/supabase/saved-matches-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchRow } from "@/types/database";
import { removeSavedMatchAction, saveMatchAction } from "./actions";

export const dynamic = "force-dynamic";

const statusLabels: Record<MatchRow["status"], string> = {
  scheduled: "Programado",
  live: "En vivo",
  finished: "Finalizado",
  postponed: "Aplazado",
  cancelled: "Cancelado",
};

function formatProbability(value: number) {
  return `${value.toFixed(1)}%`;
}

export default async function MatchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer = user ? "registered_free" : "anonymous";
  const isAuthenticated = viewer === "registered_free";
  const data = await getPublicMatchDetailData(slug, viewer);
  const savedState = await getSavedMatchStateBySlug(slug);

  if (data.status === "not_found") {
    notFound();
  }

  if (data.status === "unavailable") {
    return (
      <section className="ufo-card rounded-lg border border-[var(--warning)]/25 p-6">
        <h1 className="text-xl font-semibold">Detalle temporalmente no disponible</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{data.message}</p>
      </section>
    );
  }

  const { match } = data;
  const kickoff = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(match.kickoffAt));
  const venue = [match.venueName, match.venueCity].filter(Boolean).join(", ") || "Sede por confirmar";
  const saveAction = saveMatchAction.bind(null, match.matchSlug);
  const removeAction = removeSavedMatchAction.bind(null, match.matchSlug);
  const hasPremiumModelDetail =
    match.premiumProjection.status === "authorized" &&
    match.premiumProjection.payload.modelDetail !== null;
  const hasLegacyPremiumMarkets =
    match.premiumProjection.status === "authorized" &&
    match.premiumProjection.payload.markets.length > 0;

  return (
    <div className="space-y-6">
      <section className="ufo-card rounded-lg p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              {match.competitionName} {match.stage ? `- ${match.stage}` : ""}
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              {match.homeTeamName} <span className="text-[var(--muted)]">vs</span>{" "}
              {match.awayTeamName}
            </h1>
          </div>
          <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">
            {statusLabels[match.status]}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {kickoff} COT
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {venue}
          </span>
        </div>
      </section>

      {match.verifiedResult ? (
        <section className="ufo-card rounded-lg border border-emerald-400/25 bg-emerald-500/8 p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">
            Resultado final verificado
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {match.homeTeamName} {match.verifiedResult.homeGoals} - {match.verifiedResult.awayGoals}{" "}
            {match.awayTeamName}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Este partido ya tiene marcador final verificado. La prediccion publica se mantiene abajo
            como referencia historica, sin exponer evaluacion interna del modelo.
          </p>
        </section>
      ) : null}

      {match.prediction ? (
        <section className="ufo-card rounded-lg p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                Predicción pública básica
              </p>
              <h2 className="mt-2 text-xl font-semibold">Probabilidades 1X2 publicadas</h2>
            </div>
            {match.prediction.viewer === "registered_free" ? (
              <div className="flex gap-2">
                <ConfidenceBadge score={match.prediction.confidenceScore} />
                <RiskBadge level={match.prediction.riskLevel} />
              </div>
            ) : (
              <div className="ufo-pill rounded-md border-[var(--accent)]/35 bg-[var(--accent)]/10 px-3 py-2 text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                  Señal básica
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">Confianza y riesgo completos con cuenta gratis</p>
              </div>
            )}
          </div>
          <div className="mt-6 max-w-2xl">
            <ProbabilityBar
              probabilities={{
                homeWin: match.prediction.homeWinProb,
                draw: match.prediction.drawProb,
                awayWin: match.prediction.awayWinProb,
              }}
            />
          </div>
          {match.prediction.viewer === "registered_free" ? (
            <div className="mt-5 rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/6 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                Marcador probable
              </p>
              {match.prediction.probableScore ? (
                <>
                  <p className="mt-2 text-2xl font-semibold text-white">{match.prediction.probableScore}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Este es el escenario de marcador m&aacute;s probable seg&uacute;n el modelo, no una
                    garant&iacute;a de resultado final.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    El marcador probable no est&aacute; disponible para este partido en este momento.
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    La vista p&uacute;blica b&aacute;sica y el contexto de confianza/riesgo siguen
                    disponibles.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/6 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                Marcador probable
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Crea una cuenta gratis para desbloquear el marcador probable del modelo para este
                partido.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/register?next=/matches/${match.matchSlug}`} className="ufo-btn-primary ufo-focus-ring">
                  Crear cuenta gratis
                </Link>
                <Link href={`/login?next=/matches/${match.matchSlug}`} className="ufo-btn-secondary ufo-focus-ring">
                  Iniciar sesi&oacute;n
                </Link>
              </div>
            </div>
          )}
          <div className="mt-5 space-y-2">
            <p className="text-xs text-[var(--muted)]">
              {isAuthenticated
                ? "Vista registrada gratis: contexto completo de confianza y riesgo y lectura pública del partido."
                : "Vista pública básica: 1X2 completo y señal inicial de confianza y riesgo."}
            </p>
            <p className="text-xs text-[var(--muted)]">
              Las probabilidades reflejan una lectura del modelo, no una promesa de resultado.
            </p>
            <p className="text-xs text-[var(--muted)]">
              Alta incertidumbre: probabilidades cercanas. Una ventaja ligera no implica certeza.
            </p>
          </div>
        </section>
      ) : (
        <section className="ufo-card rounded-lg p-6">
          <h2 className="text-lg font-semibold">Predicción aún no publicada</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            El partido está disponible públicamente, pero todavía no existe una predicción básica
            publicada.
          </p>
        </section>
      )}

      <section className="ufo-card rounded-lg border border-white/15 p-5 sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Proyección premium
        </p>
        {match.premiumProjection.status === "locked" ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">Acceso premium bloqueado</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Esta cuenta todavía no tiene derechos premium para este partido.
            </p>
          </>
        ) : match.premiumProjection.status === "unavailable" ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">Proyección premium no disponible</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              No fue posible preparar el contexto premium de este partido en este momento.
            </p>
          </>
        ) : match.premiumProjection.status === "authorized_unavailable" ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">Contenido premium temporalmente no disponible</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Tu acceso está activo, pero la proyección premium todavía no está lista para mostrarse.
            </p>
          </>
        ) : (
          <div className="mt-3 space-y-4">
            <h2 className="text-lg font-semibold">Detalle premium del modelo</h2>
            {match.premiumProjection.payload.modelDetail ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium">Goles esperados</p>
                  <p className="mt-2 font-mono text-3xl">
                    {match.premiumProjection.payload.modelDetail.expectedGoals.home.toFixed(2)} -{" "}
                    {match.premiumProjection.payload.modelDetail.expectedGoals.away.toFixed(2)}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Proyeccion de gol esperada para local y visitante segun el modelo actual.
                  </p>
                </article>

                <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium">Confianza premium</p>
                  {match.premiumProjection.payload.modelDetail.confidence ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ConfidenceBadge
                        score={match.premiumProjection.payload.modelDetail.confidence.score}
                      />
                      <RiskBadge
                        level={match.premiumProjection.payload.modelDetail.confidence.riskLevel}
                      />
                    </div>
                  ) : match.premiumProjection.payload.confidenceContext ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ConfidenceBadge
                        score={match.premiumProjection.payload.confidenceContext.confidenceScore}
                      />
                      <RiskBadge
                        level={match.premiumProjection.payload.confidenceContext.riskLevel}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      No hay contexto adicional de confianza disponible para este partido.
                    </p>
                  )}
                </article>

                <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
                  <p className="text-sm font-medium">Top 3 scorelines probables</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {match.premiumProjection.payload.modelDetail.topScorelines.map((scoreline) => (
                      <div
                        key={`${scoreline.score}:${scoreline.probability}`}
                        className="rounded-lg border border-white/10 bg-[#050b14]/60 p-3"
                      >
                        <p className="font-mono text-2xl">{scoreline.score}</p>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {formatProbability(scoreline.probability)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium">BTTS</p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    <p>
                      Si:{" "}
                      <span className="font-medium text-white">
                        {formatProbability(
                          match.premiumProjection.payload.modelDetail.bothTeamsToScore.yesProbability,
                        )}
                      </span>
                    </p>
                    <p>
                      No:{" "}
                      <span className="font-medium text-white">
                        {formatProbability(
                          match.premiumProjection.payload.modelDetail.bothTeamsToScore.noProbability,
                        )}
                      </span>
                    </p>
                  </div>
                </article>

                <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium">Total goals 2.5</p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    <p>
                      Over:{" "}
                      <span className="font-medium text-white">
                        {formatProbability(
                          match.premiumProjection.payload.modelDetail.totalGoals25.overProbability,
                        )}
                      </span>
                    </p>
                    <p>
                      Under:{" "}
                      <span className="font-medium text-white">
                        {formatProbability(
                          match.premiumProjection.payload.modelDetail.totalGoals25.underProbability,
                        )}
                      </span>
                    </p>
                  </div>
                </article>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-[var(--muted)]">
                  El detalle premium del modelo no esta disponible para este partido en este momento.
                </p>
              </div>
            )}

            {hasLegacyPremiumMarkets || !hasPremiumModelDetail ? (
              <>
                <h3 className="text-base font-semibold">Mercados premium autorizados</h3>
                {match.premiumProjection.payload.markets.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    No hay mercados premium publicados para este partido.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {match.premiumProjection.payload.markets.map((market) => (
                      <article
                        key={`${market.marketKey}:${market.selection}`}
                        className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                      >
                        <p className="text-sm font-medium">{market.label}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {market.selection} - {market.probability}%
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : null}
            {match.premiumProjection.payload.narrative ? (
              <article className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm font-medium">Narrativa premium</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {match.premiumProjection.payload.narrative.premiumAnalysis}
                </p>
              </article>
            ) : null}
          </div>
        )}
      </section>

      <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-5 sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Partidos guardados
        </p>
        {savedState.status === "ready" && savedState.isAuthenticated ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">
              {savedState.isSaved ? "Partido guardado en tu watchlist" : "Guardar partido en tu watchlist"}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {savedState.isSaved
                ? "Puedes quitar este partido en cualquier momento."
                : "Guarda este partido para seguirlo más tarde desde tu cuenta."}
            </p>
            <form action={savedState.isSaved ? removeAction : saveAction} className="mt-4">
              <button type="submit" className="ufo-btn-primary ufo-focus-ring">
                {savedState.isSaved ? "Quitar de guardados" : "Guardar partido"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-lg font-semibold">Guarda este partido con una cuenta gratis</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Crea una cuenta o inicia sesión para guardar este partido en tu watchlist.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/register?next=/matches/${match.matchSlug}`} className="ufo-btn-primary ufo-focus-ring">
                Crear cuenta gratis
              </Link>
              <Link href={`/login?next=/matches/${match.matchSlug}`} className="ufo-btn-secondary ufo-focus-ring">
                Iniciar sesión
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-5 sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          {isAuthenticated ? "Tu cuenta gratis está activa" : "Cuenta gratis disponible"}
        </p>
        <h2 className="mt-2 text-lg font-semibold">
          {isAuthenticated
            ? "Tu cuenta gratis ya desbloquea el contexto ampliado de confianza y riesgo para este partido publicado."
            : "Crea una cuenta gratis para ver el contexto completo de confianza y riesgo en este partido publicado."}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          El análisis premium llegará más adelante. Esta página mantiene la lectura pública básica
          separada del contenido premium y del Lab interno.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
              Abrir panel
            </Link>
          ) : (
            <>
              <Link href={`/register?next=/matches/${match.matchSlug}`} className="ufo-btn-primary ufo-focus-ring">
                Crear cuenta gratis
              </Link>
              <Link href={`/login?next=/matches/${match.matchSlug}`} className="ufo-btn-secondary ufo-focus-ring">
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="ufo-card rounded-lg p-5">
        <p className="text-sm text-[var(--muted)]">
          Esta página solo expone metadata pública básica del partido y probabilidades del modelo
          cuando están disponibles. No muestra resultados internos, evaluaciones internas ni
          automatización de publicación.
        </p>
      </section>
    </div>
  );
}
