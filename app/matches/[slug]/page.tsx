import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { buildRepresentativeScenario } from "../../../lib/presentation/premium-scenarios";
import { buildPublicExpertReadView } from "../../../lib/presentation/public-expert-read";
import {
  formatMatchDateTimeLabel,
  formatProbability,
  formatVenueLabel,
  getMarketGlossary,
  getWorldCupProductName,
  resolveCompetitionDisplayName,
  resolveMatchStatusLabel,
  resolvePremiumMarketLabel,
  resolvePremiumMarketSelection,
  resolveStageDisplayName,
  resolveTeamDisplayName,
} from "../../../lib/presentation/public-display";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ProbabilityBar } from "@/components/probability-bar";
import { RiskBadge } from "@/components/risk-badge";
import {
  getPublicMatchDetailData,
  type PublicMatchDetailView,
} from "@/lib/supabase/public-match-detail-queries";
import { getSavedMatchStateBySlug } from "@/lib/supabase/saved-matches-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { removeSavedMatchAction, saveMatchAction } from "./actions";

export const dynamic = "force-dynamic";

function wasPublishedBeforeKickoff(predictionCreatedAt: string | null | undefined, kickoffAt: string) {
  if (!predictionCreatedAt) {
    return false;
  }

  return new Date(predictionCreatedAt).getTime() < new Date(kickoffAt).getTime();
}

function parseScoreline(scoreline: string) {
  const match = scoreline.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    homeGoals: Number.parseInt(match[1], 10),
    awayGoals: Number.parseInt(match[2], 10),
  };
}

type ScenarioMatchState = "fulfilled" | "scoreline_match" | null;

function resolveScenarioMatchState(args: {
  parsedScoreline: ReturnType<typeof parseScoreline>;
  verifiedResult: PublicMatchDetailView["verifiedResult"];
}): ScenarioMatchState {
  const { parsedScoreline, verifiedResult } = args;

  if (
    parsedScoreline === null ||
    verifiedResult === null ||
    verifiedResult.verificationStatus !== "verified"
  ) {
    return null;
  }

  if (
    verifiedResult.decisionMethod === "ft" &&
    parsedScoreline.homeGoals === verifiedResult.homeGoals &&
    parsedScoreline.awayGoals === verifiedResult.awayGoals
  ) {
    return "fulfilled";
  }

  if (verifiedResult.decisionMethod === "aet") {
    return null;
  }

  if (
    verifiedResult.decisionMethod === "pen" &&
    verifiedResult.regulationHomeGoals !== null &&
    verifiedResult.regulationAwayGoals !== null &&
    verifiedResult.afterExtraTimeHomeGoals !== null &&
    verifiedResult.afterExtraTimeAwayGoals !== null &&
    verifiedResult.regulationHomeGoals === verifiedResult.afterExtraTimeHomeGoals &&
    verifiedResult.regulationAwayGoals === verifiedResult.afterExtraTimeAwayGoals &&
    parsedScoreline.homeGoals === verifiedResult.regulationHomeGoals &&
    parsedScoreline.awayGoals === verifiedResult.regulationAwayGoals
  ) {
    return "scoreline_match";
  }

  return null;
}

function buildVerifiedResultCopy(
  verifiedResult: NonNullable<PublicMatchDetailView["verifiedResult"]>,
  homeTeamName: string,
  awayTeamName: string,
) {
  const headline = `${homeTeamName} ${verifiedResult.homeGoals} - ${verifiedResult.awayGoals} ${awayTeamName}`;

  if (verifiedResult.decisionMethod === "pen") {
    const advancingTeamName = verifiedResult.advancingTeamName ?? "Un equipo";
    const penaltyScore =
      verifiedResult.penaltyHomeGoals !== null && verifiedResult.penaltyAwayGoals !== null
        ? `${verifiedResult.penaltyHomeGoals}-${verifiedResult.penaltyAwayGoals}`
        : null;

    return {
      headline,
      detail: penaltyScore
        ? `${advancingTeamName} avanzó ${penaltyScore} en penales.`
        : `${advancingTeamName} avanzó en penales.`,
    };
  }

  if (verifiedResult.decisionMethod === "aet") {
    const advancingTeamName = verifiedResult.advancingTeamName ?? "El ganador";
    return {
      headline,
      detail: `${advancingTeamName} avanzó después del tiempo extra.`,
    };
  }

  return {
    headline,
    detail: "Este partido ya tiene marcador final verificado. La predicción pública se conserva como referencia histórica del producto.",
  };
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
  const kickoff = formatMatchDateTimeLabel(match.kickoffAt);
  const venue = formatVenueLabel({
    venueName: match.venueName,
    venueCity: match.venueCity,
  });
  const saveAction = saveMatchAction.bind(null, match.matchSlug);
  const removeAction = removeSavedMatchAction.bind(null, match.matchSlug);
  const homeTeamName = resolveTeamDisplayName(match.homeTeamName);
  const awayTeamName = resolveTeamDisplayName(match.awayTeamName);
  const competitionLabel = resolveCompetitionDisplayName(match.competitionName);
  const stageLabel = resolveStageDisplayName(match.stage);
  const glossary = getMarketGlossary();
  const premiumPayload =
    match.premiumProjection.status === "authorized" ? match.premiumProjection.payload : null;
  const premiumModelDetail = premiumPayload?.modelDetail ?? null;
  const hasPremiumAccess =
    match.premiumProjection.status === "authorized" ||
    match.premiumProjection.status === "authorized_unavailable";
  const isHistoricalPreview =
    match.premiumAccess.status === "authorized" && match.premiumAccess.mode === "historical_preview";
  const isPremiumEntitlement =
    match.premiumAccess.status === "authorized" && match.premiumAccess.mode === "premium_entitlement";
  const predictionPublishedBeforeKickoff = wasPublishedBeforeKickoff(
    match.prediction?.createdAt,
    match.kickoffAt,
  );
  const publicationLabel =
    match.prediction?.createdAt && predictionPublishedBeforeKickoff
      ? formatMatchDateTimeLabel(match.prediction.createdAt)
      : null;
  const canShowRegisteredFreeProbableScore =
    !hasPremiumAccess && match.prediction?.viewer === "registered_free" && match.verifiedResult !== null;
  const expertRead =
    match.prediction
      ? buildPublicExpertReadView({
          base: {
            homeTeamName,
            awayTeamName,
            homeWinProb: match.prediction.homeWinProb,
            drawProb: match.prediction.drawProb,
            awayWinProb: match.prediction.awayWinProb,
          },
          confidence:
            match.prediction.viewer === "registered_free"
              ? {
                  confidenceScore: match.prediction.confidenceScore,
                  riskLevel: match.prediction.riskLevel,
                }
              : null,
        })
      : null;

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

  const scenarioMatches = representativeScenarios.map((scenario) => {
    const parsed = parseScoreline(scenario.scoreline);
    const matchState = resolveScenarioMatchState({
      parsedScoreline: parsed,
      verifiedResult: match.verifiedResult,
    });

    return {
      scenario,
      matchState,
    };
  });
  const anyExactScenarioMatch = scenarioMatches.some((entry) => entry.matchState !== null);
  const verifiedResultCopy = match.verifiedResult
    ? buildVerifiedResultCopy(match.verifiedResult, homeTeamName, awayTeamName)
    : null;

  return (
    <div className="space-y-6">
      <section className="ufo-card rounded-2xl p-5 sm:p-6">
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
        <section className="ufo-card rounded-2xl border border-emerald-400/25 bg-emerald-500/8 p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">
            Resultado final verificado
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {verifiedResultCopy?.headline}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {verifiedResultCopy?.detail}
          </p>
          {predictionPublishedBeforeKickoff ? (
            <p className="mt-3 text-xs text-[var(--muted)]">
              Predicción publicada antes del partido{publicationLabel ? `: ${publicationLabel}.` : "."}
            </p>
          ) : null}
        </section>
      ) : null}

      {match.prediction ? (
        <section className="ufo-card rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                Predicción pública básica
              </p>
              <h2 className="mt-2 text-xl font-semibold">Probabilidad del resultado publicada</h2>
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
            <p className="mb-3 text-sm font-medium text-white">Probabilidad del resultado</p>
            <ProbabilityBar
              probabilities={{
                homeWin: match.prediction.homeWinProb,
                draw: match.prediction.drawProb,
                awayWin: match.prediction.awayWinProb,
              }}
            />
          </div>
          {expertRead ? (
            <div className="mt-5 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/6 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                Lectura UFO
              </p>
              <p className="mt-2 text-sm text-white">{expertRead.summary}</p>
              {expertRead.confidenceNote ? (
                <p className="mt-2 text-sm text-[var(--muted)]">{expertRead.confidenceNote}</p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-5 space-y-2 text-sm text-[var(--muted)]">
            <p>Las probabilidades reflejan una lectura del modelo, no una promesa de resultado.</p>
          </div>
          {!hasPremiumAccess && match.prediction.viewer === "registered_free" ? (
            <div className="mt-5 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/6 p-4">
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
                <p className="mt-2 text-sm text-[var(--muted)]">
                  El marcador probable no está disponible para este partido en este momento.
                </p>
              ) : (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  El marcador probable y los escenarios avanzados permanecen reservados para el detalle premium previo al partido.
                </p>
              )}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="ufo-card rounded-lg p-6">
          <h2 className="text-lg font-semibold">Predicción aún no publicada</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            El partido está disponible públicamente, pero todavía no existe una predicción básica publicada.
          </p>
        </section>
      )}

      {match.premiumProjection.status === "locked" ? (
        viewer === "anonymous" ? (
          <section className="ufo-card rounded-2xl border border-[var(--accent)]/25 p-5 sm:p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              {match.verifiedResult ? "Historial premium" : "Cuenta gratis"}
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              {match.verifiedResult ? "Revisa cómo fue el análisis completo" : "Continúa con una cuenta gratis"}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {match.verifiedResult
                ? "Crea una cuenta gratis para consultar los escenarios, señales y explicación que fueron publicados antes de este partido."
                : "Regístrate para consultar las probabilidades 1X2 completas, el contexto de confianza y riesgo, y guardar este partido."}
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-medium text-white">Vista premium disponible para usuarios autorizados</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                <li>Escenarios representativos explicados</li>
                <li>Goles esperados</li>
                <li>Probabilidad de que anoten ambos equipos</li>
                <li>Proyección del total de goles</li>
                <li>Interpretación completa del partido</li>
              </ul>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/register?next=/matches/${match.matchSlug}`} className="ufo-btn-primary ufo-focus-ring">
                Crear cuenta gratis
              </Link>
              <Link href={`/login?next=/matches/${match.matchSlug}`} className="ufo-btn-secondary ufo-focus-ring">
                Iniciar sesión
              </Link>
            </div>
          </section>
        ) : (
          <section className="ufo-card rounded-2xl border border-[var(--accent)]/25 p-5 sm:p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Vista premium bloqueada
            </p>
            <h2 className="mt-2 text-lg font-semibold">Desbloquea el análisis completo del partido</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              El {getWorldCupProductName()} habilita el detalle avanzado antes del inicio de cada encuentro publicado.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Tres escenarios representativos explicados</li>
              <li>Goles esperados</li>
              <li>Probabilidad de que anoten ambos equipos</li>
              <li>Proyección del total de goles</li>
              <li>Lectura completa de confianza y riesgo</li>
            </ul>
            <div className="mt-4">
              <Link href="/pricing" className="ufo-btn-primary ufo-focus-ring">
                Obtener {getWorldCupProductName()}
              </Link>
            </div>
          </section>
        )
      ) : match.premiumProjection.status === "unavailable" ? (
        <section className="ufo-card rounded-2xl border border-white/15 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Detalle premium no disponible</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            No fue posible preparar el contexto premium de este partido en este momento.
          </p>
        </section>
      ) : match.premiumProjection.status === "authorized_unavailable" ? (
        <section className="ufo-card rounded-2xl border border-white/15 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Contenido premium temporalmente no disponible</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Tu acceso está activo, pero el contenido premium todavía no está listo para mostrarse.
          </p>
        </section>
      ) : (
        <section className="ufo-card rounded-2xl border border-white/15 p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            {isHistoricalPreview ? "Historial premium verificado" : "Detalle premium"}
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {isHistoricalPreview ? "Análisis premium publicado antes del partido" : "Detalle premium del modelo"}
          </h2>

          {isHistoricalPreview ? (
            <div className="mt-4 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/6 p-4 text-sm text-[var(--muted)]">
              <p>
                Este análisis fue publicado antes del partido. Los usuarios del Pase Mundial pudieron consultarlo antes del inicio; ahora está disponible como parte del historial verificado.
              </p>
              {publicationLabel ? (
                <p className="mt-2 text-xs">Publicado: {publicationLabel}.</p>
              ) : null}
            </div>
          ) : null}

          {premiumModelDetail ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium">Goles esperados (xG)</p>
                <p className="mt-2 font-mono text-3xl">
                  {premiumModelDetail.expectedGoals.home.toFixed(2)} - {premiumModelDetail.expectedGoals.away.toFixed(2)}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Promedio estimado de gol para local y visitante según la lectura actual del modelo.
                </p>
              </article>

              <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium">Confianza y riesgo</p>
                {premiumModelDetail.confidence ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ConfidenceBadge score={premiumModelDetail.confidence.score} />
                    <RiskBadge level={premiumModelDetail.confidence.riskLevel} />
                  </div>
                ) : premiumPayload?.confidenceContext ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ConfidenceBadge score={premiumPayload.confidenceContext.confidenceScore} />
                    <RiskBadge level={premiumPayload.confidenceContext.riskLevel} />
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    No hay contexto adicional de confianza disponible para este partido.
                  </p>
                )}
                <p className="mt-3 text-xs text-[var(--muted)]">
                  La confianza resume la estabilidad de la lectura actual. El riesgo expresa cuánta incertidumbre todavía puede desviar el partido del escenario central.
                </p>
              </article>

              <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
                <p className="text-sm font-medium">Escenarios representativos del partido</p>
                <div className="mt-3 grid gap-3 xl:grid-cols-3">
                  {scenarioMatches.map(({ scenario, matchState }, index) => (
                    <article
                      key={`${scenario.title}:${scenario.scoreline}`}
                      className={
                        matchState === "fulfilled"
                          ? "rounded-xl border border-emerald-400/40 bg-emerald-500/8 p-4"
                          : matchState === "scoreline_match"
                            ? "rounded-xl border border-sky-400/40 bg-sky-500/8 p-4"
                          : index === 0
                            ? "rounded-xl border border-[var(--accent)]/25 bg-[#050b14]/75 p-4"
                            : "rounded-xl border border-white/10 bg-[#050b14]/60 p-4"
                      }
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                          {scenario.title}
                        </p>
                        {matchState === "fulfilled" ? (
                          <span className="ufo-pill border-emerald-400/35 bg-emerald-500/12 text-emerald-200">
                            Escenario cumplido
                          </span>
                        ) : matchState === "scoreline_match" ? (
                          <span className="ufo-pill border-sky-400/35 bg-sky-500/12 text-sky-100">
                            Marcador coincidente
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 font-mono text-3xl">{scenario.scoreline}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">{scenario.probabilityLabel}</p>
                      {matchState === "fulfilled" ? (
                        <p className="mt-3 text-sm text-emerald-100">
                          Este escenario coincidió exactamente con el resultado final verificado.
                        </p>
                      ) : matchState === "scoreline_match" ? (
                        <p className="mt-3 text-sm text-sky-100">
                          Este escenario coincidió con el marcador antes de los penales.
                        </p>
                      ) : null}
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
                {match.verifiedResult && !anyExactScenarioMatch ? (
                  <p className="mt-4 text-sm text-[var(--muted)]">
                    Ninguno de los tres escenarios representativos coincidió exactamente con el marcador final.
                  </p>
                ) : null}
              </article>

              <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium">¿Anotan ambos equipos?</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Probabilidad de que cada equipo marque al menos un gol.
                </p>
                <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <p>
                    Sí: <span className="font-medium text-white">{formatProbability(premiumModelDetail.bothTeamsToScore.yesProbability)}</span>
                  </p>
                  <p>
                    No: <span className="font-medium text-white">{formatProbability(premiumModelDetail.bothTeamsToScore.noProbability)}</span>
                  </p>
                </div>
              </article>

              <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium">Total de goles del partido</p>
                <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <p>
                    3 o más goles: <span className="font-medium text-white">{formatProbability(premiumModelDetail.totalGoals25.overProbability)}</span>
                  </p>
                  <p>
                    2 o menos goles: <span className="font-medium text-white">{formatProbability(premiumModelDetail.totalGoals25.underProbability)}</span>
                  </p>
                </div>
              </article>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-[var(--muted)]">
                El detalle premium del modelo no está disponible para este partido en este momento.
              </p>
            </div>
          )}

          {premiumPayload?.markets.length ? (
            <div className="mt-5 space-y-2">
              <h3 className="text-base font-semibold">Lecturas complementarias</h3>
              {premiumPayload.markets.map((market) => (
                <article
                  key={`${market.marketKey}:${market.selection}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <p className="text-sm font-medium">{resolvePremiumMarketLabel(market.marketKey)}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {resolvePremiumMarketSelection(market.selection)} - {formatProbability(market.probability)}
                  </p>
                </article>
              ))}
            </div>
          ) : null}

          {premiumPayload?.narrative ? (
            <article className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium">Lectura adicional</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{premiumPayload.narrative.premiumAnalysis}</p>
            </article>
          ) : null}

          <details className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-white">
              Glosario rápido del partido
            </summary>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {glossary.map((item) => (
                <div key={item.key} className="rounded-xl border border-white/10 bg-[#050b14]/60 p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">{item.description}</p>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}

      {isPremiumEntitlement ? (
        <section className="ufo-card rounded-2xl border border-[var(--accent)]/30 p-5 sm:p-6">
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

      {isHistoricalPreview ? (
        <section className="ufo-card rounded-2xl border border-[var(--accent)]/30 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Consulta este nivel de análisis antes del próximo partido</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            El {getWorldCupProductName()} desbloquea los escenarios, goles esperados y señales avanzadas antes del inicio de cada encuentro publicado.
          </p>
          <div className="mt-4">
            <Link href="/pricing" className="ufo-btn-primary ufo-focus-ring">
              Obtener {getWorldCupProductName()}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="ufo-card rounded-2xl border border-[var(--accent)]/30 p-5 sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Partidos guardados
        </p>
        {savedState.status === "ready" && savedState.isAuthenticated ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">
              {savedState.isSaved ? "Partido guardado en tu lista" : "Guardar partido en tu lista"}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {savedState.isSaved ? "Puedes quitar este partido en cualquier momento." : "Guarda este partido en tu lista para seguirlo más tarde desde tu cuenta."}
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
              Crea una cuenta o inicia sesión para guardar este partido en tu lista.
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

      {!hasPremiumAccess && !isHistoricalPreview ? (
        <section className="ufo-card rounded-2xl border border-[var(--accent)]/30 p-5 sm:p-6">
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

      <section className="ufo-card rounded-2xl p-5">
        <p className="text-sm text-[var(--muted)]">
          Esta página muestra solo información pública del partido y probabilidades publicadas del modelo cuando están disponibles.
        </p>
      </section>
    </div>
  );
}
