import { requireAdmin } from "@/lib/auth/session";
import { PREDICTION_REFRESH_REVIEW_PATH } from "../../../lib/prediction-review/constants";
import { getPredictionRefreshReviewPageData } from "@/lib/supabase/prediction-refresh-review-queries";
import {
  analyzePredictionRefreshWithAiAction,
  generatePredictionRefreshShadowAction,
  holdPredictionRefreshAction,
  keepCurrentPredictionRefreshAction,
  previewReviewedXgAction,
  publishRefreshedPredictionReviewAction,
} from "./actions";
import { SubmitButton } from "../real-fixture-lab/submit-button";

export const dynamic = "force-dynamic";

const ACTION_BUTTON_CLASS =
  "cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
const ACCENT_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} border-[var(--accent)]/35 bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/20`;
const WARNING_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} border-[var(--warning)]/35 bg-[var(--warning)]/15 text-[var(--warning)] hover:bg-[var(--warning)]/20`;
const EMERALD_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} border-emerald-400/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15`;

type PageProps = {
  searchParams: Promise<{
    action?: string;
    externalId?: string;
    message?: string;
  }>;
};

function formatKickoff(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function renderStatusMessage(action?: string, externalId?: string, message?: string) {
  if (!action) {
    return null;
  }

  const title =
    action === "shadow_generated"
      ? "Predicción sombra generada"
      : action === "ai_analyzed"
        ? "Análisis IA guardado"
        : action === "ai_unavailable"
          ? "IA no disponible"
          : action === "kept_current"
            ? "Decisión guardada"
            : action === "published_refreshed"
              ? "Versión refrescada publicada"
              : action === "held"
                ? "Fixture retenido"
                : action === "reviewed_xg_preview_saved"
                  ? "Preview reviewed xG guardado"
                  : "Operación bloqueada o incompleta";

  return {
    title,
    body: externalId ? `${externalId}${message ? ` · ${message}` : ""}` : (message ?? "Revisa el estado actual del fixture."),
  };
}

export default async function PredictionRefreshReviewPage({ searchParams }: PageProps) {
  await requireAdmin(PREDICTION_REFRESH_REVIEW_PATH);
  const { action, externalId, message } = await searchParams;
  const pageData = await getPredictionRefreshReviewPageData();
  const statusMessage = renderStatusMessage(action, externalId, message);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Admin / Revision de predicciones
        </p>
        <h1 className="text-4xl font-semibold">Revision de refresco de predicciones</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          Cola acotada para detectar anomalías, generar predicción sombra, comparar UFO contra la referencia Elo/FIFA,
          y registrar revisión humana antes de cualquier publicación. No reutiliza Real Fixture Lab como superficie operativa.
        </p>
      </section>

      {statusMessage ? (
        <section className="rounded-lg border border-[var(--accent)]/35 bg-[var(--accent)]/10 p-4">
          <h2 className="text-lg font-semibold">{statusMessage.title}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{statusMessage.body}</p>
        </section>
      ) : null}

      <section className="panel rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Estado del gate</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              La revalidacion del provider es obligatoria antes de revisar, previsualizar o publicar cualquier fixture.
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[var(--muted)]">
            Provider IA:{" "}
            {pageData.aiAvailability.status === "available"
              ? `${pageData.aiAvailability.provider} / ${pageData.aiAvailability.model}`
              : pageData.aiAvailability.reason}
          </div>
        </div>

        {pageData.warnings.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-[var(--warning)]">
            {pageData.warnings.map((warning) => (
              <li key={warning} className="rounded-md border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-3 py-2">
                {warning}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-4">
        {pageData.cases.length === 0 ? (
          <div className="panel rounded-lg p-5 text-sm text-[var(--muted)]">
            No hay fixtures accionables en este gate por ahora.
          </div>
        ) : (
          pageData.cases.map((reviewCase) => (
            <article key={reviewCase.matchId} className="panel rounded-lg p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {reviewCase.homeTeamNameEn} vs {reviewCase.awayTeamNameEn}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {reviewCase.homeTeamDisplayNameEs} vs {reviewCase.awayTeamDisplayNameEs}
                  </p>
                  <p className="mt-2 font-mono text-xs text-[var(--muted)]">{reviewCase.externalId}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Kickoff: {formatKickoff(reviewCase.kickoffAt)} · access_scope: {reviewCase.accessScope}
                  </p>
                </div>
                <div className="space-y-2 text-right text-sm">
                  <p className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-[var(--muted)]">
                    Provider: {reviewCase.providerStatusLabel}
                  </p>
                  {reviewCase.providerStatusReason ? (
                    <p className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-[var(--muted)]">
                      No accionable: {reviewCase.providerStatusReason}
                    </p>
                  ) : null}
                  {reviewCase.retainedFixtureOverride ? (
                    <p className="rounded-md border border-[var(--warning)]/35 bg-[var(--warning)]/10 px-3 py-2 text-[var(--warning)]">
                      fixture retenido para revision
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="font-semibold">Prediccion actual</h3>
                  {reviewCase.currentPrediction ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 text-sm text-[var(--muted)]">
                        <p>1X2: {formatPct(reviewCase.currentPrediction.homeWinProb)} / {formatPct(reviewCase.currentPrediction.drawProb)} / {formatPct(reviewCase.currentPrediction.awayWinProb)}</p>
                        <p>xG: {reviewCase.currentPrediction.expectedHomeGoals.toFixed(2)} - {reviewCase.currentPrediction.expectedAwayGoals.toFixed(2)}</p>
                        <p>Marcador modal: {reviewCase.currentPrediction.mostLikelyScore}</p>
                      </div>
                      <div className="space-y-1 text-sm text-[var(--muted)]">
                        <p>BTTS si: {formatPct(reviewCase.currentPrediction.bttsYesProb)}</p>
                        <p>O2.5: {formatPct(reviewCase.currentPrediction.over25Prob)}</p>
                        <p>Confianza/Riesgo: {formatPct(reviewCase.currentPrediction.confidenceScore)} / {reviewCase.currentPrediction.riskLevel}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--warning)]">Todavia no hay una version actual de prediccion para este fixture.</p>
                  )}
                </section>

                <section className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
                  <h3 className="font-semibold">Refresco sombra</h3>
                  {reviewCase.shadowPrediction ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 text-sm text-[var(--muted)]">
                        <p>1X2: {formatPct(reviewCase.shadowPrediction.homeWinProb)} / {formatPct(reviewCase.shadowPrediction.drawProb)} / {formatPct(reviewCase.shadowPrediction.awayWinProb)}</p>
                        <p>xG: {reviewCase.shadowPrediction.expectedHomeGoals.toFixed(2)} - {reviewCase.shadowPrediction.expectedAwayGoals.toFixed(2)}</p>
                        <p>Marcador modal: {reviewCase.shadowPrediction.mostLikelyScore}</p>
                      </div>
                      <div className="space-y-1 text-sm text-[var(--muted)]">
                        <p>BTTS si: {formatPct(reviewCase.shadowPrediction.bttsYesProb)}</p>
                        <p>O2.5: {formatPct(reviewCase.shadowPrediction.over25Prob)}</p>
                        <p>Confianza/Riesgo: {formatPct(reviewCase.shadowPrediction.confidenceScore)} / {reviewCase.shadowPrediction.riskLevel}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--muted)]">Genera una prediccion sombra para comparar el pack refrescado contra la version actual.</p>
                  )}
                </section>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="font-semibold">Alertas</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[...reviewCase.refreshAlerts, ...reviewCase.coherenceAlerts].map((alert) => (
                      <span
                        key={`${reviewCase.matchId}-${alert.code}`}
                        className="rounded-md border border-[var(--warning)]/35 bg-[var(--warning)]/10 px-2 py-1 text-xs text-[var(--warning)]"
                        title={alert.description}
                      >
                        {alert.label}
                      </span>
                    ))}
                    {reviewCase.refreshAlerts.length === 0 && reviewCase.coherenceAlerts.length === 0 ? (
                      <span className="rounded-md border border-emerald-400/35 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                        sin alertas
                      </span>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="font-semibold">Recomendacion IA</h3>
                  {reviewCase.latestAiRecommendation ? (
                    <div className="mt-3 space-y-1 text-sm text-[var(--muted)]">
                      <p>Decision: {reviewCase.latestAiRecommendation.decision}</p>
                      <p>Confianza: {reviewCase.latestAiRecommendation.confidence}</p>
                      <p>{reviewCase.latestAiRecommendation.rationale}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      {reviewCase.aiAvailability.status === "available"
                        ? "Todavia no hay una recomendacion IA registrada para este fixture."
                        : `IA no disponible: ${reviewCase.aiAvailability.reason}`}
                    </p>
                  )}
                </section>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="font-semibold">Acciones</h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <form action={generatePredictionRefreshShadowAction}>
                      <input type="hidden" name="matchId" value={reviewCase.matchId} />
                      <input type="hidden" name="externalId" value={reviewCase.externalId} />
                      <SubmitButton idleLabel="Generar predicción sombra" pendingLabel="Generando..." className={ACCENT_BUTTON_CLASS} disabled={!reviewCase.providerStatusAvailable} />
                    </form>

                    <form action={analyzePredictionRefreshWithAiAction}>
                      <input type="hidden" name="matchId" value={reviewCase.matchId} />
                      <input type="hidden" name="externalId" value={reviewCase.externalId} />
                      <SubmitButton idleLabel="Analizar con IA" pendingLabel="Analizando..." className={ACCENT_BUTTON_CLASS} disabled={!reviewCase.providerStatusAvailable || reviewCase.aiAvailability.status !== "available"} />
                    </form>
                  </div>

                  <form action={keepCurrentPredictionRefreshAction} className="mt-4 space-y-3">
                    <input type="hidden" name="matchId" value={reviewCase.matchId} />
                    <input type="hidden" name="externalId" value={reviewCase.externalId} />
                    <input
                      type="text"
                      name="reason"
                      required
                      placeholder="Motivo obligatorio para mantener la versión actual"
                      className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                    />
                    <SubmitButton idleLabel="Mantener actual" pendingLabel="Guardando..." className={ACCENT_BUTTON_CLASS} />
                  </form>

                  <form action={holdPredictionRefreshAction} className="mt-4 space-y-3">
                    <input type="hidden" name="matchId" value={reviewCase.matchId} />
                    <input type="hidden" name="externalId" value={reviewCase.externalId} />
                    <input
                      type="text"
                      name="reason"
                      required
                      placeholder="Motivo obligatorio para retener el fixture"
                      className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                    />
                    <SubmitButton idleLabel="Retener" pendingLabel="Guardando..." className={WARNING_BUTTON_CLASS} />
                  </form>

                  <form action={publishRefreshedPredictionReviewAction} className="mt-4 space-y-3">
                    <input type="hidden" name="matchId" value={reviewCase.matchId} />
                    <input type="hidden" name="externalId" value={reviewCase.externalId} />
                    <input
                      type="text"
                      name="reason"
                      required
                      placeholder="Motivo obligatorio para publicar la versión refrescada"
                      className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                    />
                    <SubmitButton idleLabel="Publicar versión refrescada" pendingLabel="Publicando..." className={EMERALD_BUTTON_CLASS} disabled={!reviewCase.shadowPrediction || !reviewCase.providerStatusAvailable || reviewCase.accessScope !== "admin_only"} />
                  </form>
                </section>

                <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="font-semibold">Preview de reviewed xG</h3>
                  <form action={previewReviewedXgAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="matchId" value={reviewCase.matchId} />
                    <input type="hidden" name="externalId" value={reviewCase.externalId} />
                    <label className="space-y-2 text-sm text-[var(--muted)]">
                      <span>xG local</span>
                      <input type="number" step="0.01" min="0" name="homeXg" required className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white" />
                    </label>
                    <label className="space-y-2 text-sm text-[var(--muted)]">
                      <span>xG visitante</span>
                      <input type="number" step="0.01" min="0" name="awayXg" required className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white" />
                    </label>
                    <div className="sm:col-span-2">
                      <SubmitButton idleLabel="Generar preview reviewed xG" pendingLabel="Generando preview..." className={ACCENT_BUTTON_CLASS} disabled={!reviewCase.providerStatusAvailable} />
                    </div>
                  </form>

                  <p className="mt-3 text-xs text-[var(--warning)]">
                    El reviewed xG solo genera y guarda un preview coherente. Su publicacion sigue deshabilitada en este MVP aunque los limites ya esten definidos.
                  </p>

                  {reviewCase.reviewedXgPreview ? (
                    <div className="mt-4 space-y-1 text-sm text-[var(--muted)]">
                      <p>Preview xG: {reviewCase.reviewedXgPreview.expectedHomeGoals.toFixed(2)} - {reviewCase.reviewedXgPreview.expectedAwayGoals.toFixed(2)}</p>
                      <p>Preview 1X2: {formatPct(reviewCase.reviewedXgPreview.homeWinProb)} / {formatPct(reviewCase.reviewedXgPreview.drawProb)} / {formatPct(reviewCase.reviewedXgPreview.awayWinProb)}</p>
                      <p>Preview score: {reviewCase.reviewedXgPreview.mostLikelyScore}</p>
                    </div>
                  ) : null}
                </section>
              </div>

              {reviewCase.auditHistory.length > 0 ? (
                <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="font-semibold">Historial de auditoria</h3>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    {reviewCase.auditHistory.map((entry) => (
                      <li key={entry.id} className="rounded-md border border-white/10 px-3 py-2">
                        {entry.kind} · {entry.summary} · {new Date(entry.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" })}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
