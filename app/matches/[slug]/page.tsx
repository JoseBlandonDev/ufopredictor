import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { buildRepresentativeScenario } from "../../../lib/presentation/premium-scenarios";
import {
  formatMatchDateTimeLabel,
  formatProbability,
  formatVenueLabel,
  getMarketGlossary,
  resolvePremiumMarketLabel,
  resolvePremiumMarketSelection,
  getWorldCupProductName,
  resolveCompetitionDisplayName,
  resolveMatchStatusLabel,
  resolveStageDisplayName,
  resolveTeamDisplayName,
} from "../../../lib/presentation/public-display";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ProbabilityBar } from "@/components/probability-bar";
import { RiskBadge } from "@/components/risk-badge";
import { getPublicMatchDetailData } from "@/lib/supabase/public-match-detail-queries";
import { getSavedMatchStateBySlug } from "@/lib/supabase/saved-matches-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { removeSavedMatchAction, saveMatchAction } from "./actions";

export const dynamic = "force-dynamic";

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
  const kickoff = formatMatchDateTimeLabel(match.kickoffAt);
  const venue = formatVenueLabel({
    venueName: match.venueName,
    venueCity: match.venueCity,
  });
  const saveAction = saveMatchAction.bind(null, match.matchSlug);
  const removeAction = removeSavedMatchAction.bind(null, match.matchSlug);
  const hasPremiumModelDetail =
    match.premiumProjection.status === "authorized" &&
    match.premiumProjection.payload.modelDetail !== null;
  const hasLegacyPremiumMarkets =
    match.premiumProjection.status === "authorized" &&
    match.premiumProjection.payload.markets.length > 0;
  const hasPremiumAccess =
    match.premiumProjection.status === "authorized" ||
    match.premiumProjection.status === "authorized_unavailable";
  const canShowRegisteredFreeProbableScore =
    !hasPremiumAccess && match.prediction?.viewer === "registered_free" && match.verifiedResult !== null;
  const homeTeamName = resolveTeamDisplayName(match.homeTeamName);
  const awayTeamName = resolveTeamDisplayName(match.awayTeamName);
  const competitionLabel = resolveCompetitionDisplayName(match.competitionName);
  const stageLabel = resolveStageDisplayName(match.stage);
  const glossary = getMarketGlossary();
  const premiumPayload =
    match.premiumProjection.status === "authorized" ? match.premiumProjection.payload : null;
  const premiumModelDetail = premiumPayload?.modelDetail ?? null;
  const representativeScenarios =
    premiumModelDetail
      ? premiumModelDetail.topScorelines.map((scoreline) =>
          buildRepresentativeScenario({
            score: scoreline.score,
            probability: scoreline.probability,
            homeTeamName: match.homeTeamName,
            awayTeamName: match.awayTeamName,
            homeWinProb: match.prediction?.homeWinProb ?? 0,
            drawProb: match.prediction?.drawProb ?? 0,
            awayWinProb: match.prediction?.awayWinProb ?? 0,
            expectedGoals: premiumModelDetail.expectedGoals,
            btts: premiumModelDetail.bothTeamsToScore,
            totalGoals25: premiumModelDetail.totalGoals25,
          }),
        )
      : [];

  return (
    <div className="space-y-6">
      <section className="ufo-card rounded-lg p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              {competitionLabel} {stageLabel ? `- ${stageLabel}` : ""}
            </p>
            <h1 className="mt-3 text-3xl font-semibold break-words sm:text-4xl">
              {homeTeamName} <span className="text-[var(--muted)]">vs</span> {awayTeamName}
            </h1>
          </div>
          <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">
            {resolveMatchStatusLabel(match.status)}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {kickoff}
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
            {homeTeamName} {match.verifiedResult.homeGoals} - {match.verifiedResult.awayGoals} {awayTeamName}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Este partido ya tiene marcador final verificado. La predicción pública se mantiene abajo
            como referencia histórica del producto.
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
                Señal base
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
          {!hasPremiumAccess && match.prediction.viewer === "registered_free" ? (
            <div className="mt-5 rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/6 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                Marcador probable
              </p>
              {canShowRegisteredFreeProbableScore && match.prediction.probableScore ? (
                <>
                  <p className="mt-2 text-2xl font-semibold text-white">{match.prediction.probableScore}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Este es el marcador más probable según el modelo, no una garantía de resultado final.
                  </p>
                </>
              ) : canShowRegisteredFreeProbableScore ? (
                <>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    El marcador probable no está disponible para este partido en este momento.
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Después del resultado verificado, este detalle puede mostrarse como referencia post-partido.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    El marcador probable y los escenarios avanzados están reservados para el detalle premium antes del partido.
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Después del resultado verificado, este detalle puede mostrarse como referencia post-partido.
                  </p>
                </>
              )}
            </div>
          ) : !hasPremiumAccess ? (
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
                  Iniciar sesión
                </Link>
              </div>
            </div>
          ) : null}
          <div className="mt-5 space-y-2">
            <p className="text-xs text-[var(--muted)]">
              {hasPremiumAccess
                ? `Vista premium: tu ${getWorldCupProductName()} habilita el detalle avanzado cuando este partido ya tiene contenido premium publicado.`
                : isAuthenticated
                  ? "Vista con cuenta gratis: contexto completo de confianza y riesgo y lectura pública del partido."
                  : "Vista pública base: 1X2 completo y señal inicial de confianza y riesgo."}
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
          Detalle premium
        </p>
        {match.premiumProjection.status === "locked" ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">Acceso premium bloqueado</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Esta cuenta todavía no tiene derechos premium para este partido.
            </p>
            <div className="mt-4">
              <Link href="/pricing" className="ufo-btn-primary ufo-focus-ring">
                Ver {getWorldCupProductName()}
              </Link>
            </div>
          </>
        ) : match.premiumProjection.status === "unavailable" ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">Detalle premium no disponible</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              No fue posible preparar el contexto premium de este partido en este momento.
            </p>
          </>
        ) : match.premiumProjection.status === "authorized_unavailable" ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">Contenido premium temporalmente no disponible</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Tu acceso está activo, pero el contenido premium todavía no está listo para mostrarse.
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
                    Promedio estimado de gol para local y visitante según la lectura actual del modelo.
                  </p>
                </article>

                <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium">Confianza y riesgo</p>
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
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    La confianza resume la estabilidad de la lectura actual. El riesgo expresa cuánta
                    incertidumbre todavía puede desviar el partido del escenario central.
                  </p>
                </article>

                <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
                  <p className="text-sm font-medium">Escenarios representativos del partido</p>
                  <div className="mt-3 grid gap-3 xl:grid-cols-3">
                    {representativeScenarios.map((scenario) => (
                      <article
                        key={`${scenario.title}:${scenario.scoreline}`}
                        className="rounded-lg border border-white/10 bg-[#050b14]/60 p-4"
                      >
                        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                          {scenario.title}
                        </p>
                        <p className="mt-3 font-mono text-3xl">{scenario.scoreline}</p>
                        <p className="mt-2 text-sm text-[var(--muted)]">{scenario.probabilityLabel}</p>
                        <p className="mt-3 text-sm text-[var(--muted)]">{scenario.explanation}</p>
                        {scenario.supportSignals.length > 0 ? (
                          <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
                            {scenario.supportSignals.map((signal) => (
                              <p key={signal}>{signal}</p>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-3 text-xs text-[var(--muted)]">
                          Puede perder fuerza si: {scenario.weakeningCondition}
                        </p>
                        <p className="mt-3 text-xs text-[var(--muted)]">{scenario.disclaimer}</p>
                      </article>
                    ))}
                  </div>
                </article>

                <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium">Ambos equipos marcan (BTTS)</p>
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
                  <p className="text-sm font-medium">Más / Menos de 2,5 goles</p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    <p>
                      Más de 2,5:{" "}
                      <span className="font-medium text-white">
                        {formatProbability(
                          match.premiumProjection.payload.modelDetail.totalGoals25.overProbability,
                        )}
                      </span>
                    </p>
                    <p>
                      Menos de 2,5:{" "}
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
                  El detalle premium del modelo no está disponible para este partido en este momento.
                </p>
              </div>
            )}

            {hasLegacyPremiumMarkets || !hasPremiumModelDetail ? (
              <>
                <h3 className="text-base font-semibold">Lecturas complementarias</h3>
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
                        <p className="text-sm font-medium">
                          {resolvePremiumMarketLabel(market.marketKey)}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {resolvePremiumMarketSelection(market.selection)} - {market.probability}%
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : null}
            {match.premiumProjection.payload.narrative ? (
              <article className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm font-medium">Lectura adicional</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {match.premiumProjection.payload.narrative.premiumAnalysis}
                </p>
              </article>
            ) : null}

            <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium">Glosario rápido del partido</p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {glossary.map((item) => (
                  <div key={item.key} className="rounded-lg border border-white/10 bg-[#050b14]/60 p-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">{item.description}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}
      </section>

      {hasPremiumAccess ? (
        <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            {getWorldCupProductName()} activo
          </p>
          <h2 className="mt-2 text-lg font-semibold">
            Tu acceso premium está activo y fue validado en el servidor.
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            El contenido premium se muestra arriba cuando existe una publicación avanzada disponible para este partido.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
              Abrir panel
            </Link>
          </div>
        </section>
      ) : null}

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

      {!hasPremiumAccess ? (
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
          Esta página mantiene la lectura pública base separada del detalle premium disponible con el pase activo.
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
      ) : null}

      <section className="ufo-card rounded-lg p-5">
        <p className="text-sm text-[var(--muted)]">
          Esta página muestra solo información pública del partido y probabilidades publicadas del
          modelo cuando están disponibles.
        </p>
      </section>
    </div>
  );
}
