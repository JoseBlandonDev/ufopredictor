import { requireAdmin } from "@/lib/auth/session";
import { generatePrediction } from "@/lib/prediction-engine/generate-prediction";
import { buildRealFixturePredictionInput } from "@/lib/prediction-engine/real-fixture-adapter";
import {
  persistRealFixtureEvaluationAction,
  publishRealFixturePredictionAction,
  saveRealFixturePredictionAction,
  verifyRealFixtureResultAction,
} from "./actions";
import {
  getAdminRealFixtureLabData,
  type RealFixtureLabFixtureView,
} from "@/lib/supabase/real-fixture-lab-queries";

export const dynamic = "force-dynamic";

type RealFixtureLabPageProps = {
  searchParams: Promise<{ externalId?: string; save?: string; evaluation?: string; result?: string; publish?: string }>;
};

type FixtureSummaryStatus =
  | "saved"
  | "ready_to_persist"
  | "waiting_verification"
  | "waiting_result"
  | "no_saved_prediction";

type FixtureEntry = {
  fixture: RealFixtureLabFixtureView;
  predictionInput: ReturnType<typeof buildRealFixturePredictionInput>;
  preview: ReturnType<typeof generatePrediction>;
  derivedSignalWarning: string | null;
  evaluationStatus: FixtureSummaryStatus;
};

function formatKickoff(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

function formatMetric(value: boolean | null) {
  if (value === null) {
    return "ambiguous";
  }

  return value ? "correct" : "incorrect";
}

function getFixtureEvaluationStatus(entry: FixtureEntry): FixtureSummaryStatus {
  if (!entry.fixture.savedPrediction) {
    return "no_saved_prediction";
  }

  if (entry.fixture.savedEvaluation) {
    return "saved";
  }

  if (entry.fixture.result?.verification_status === "verified") {
    return "ready_to_persist";
  }

  if (entry.fixture.result) {
    return "waiting_verification";
  }

  return "waiting_result";
}

function formatFixtureEvaluationStatus(status: FixtureSummaryStatus) {
  switch (status) {
    case "saved":
      return "saved";
    case "ready_to_persist":
      return "verified / pending evaluation";
    case "waiting_verification":
      return "pending result verification";
    case "waiting_result":
      return "waiting match_result";
    case "no_saved_prediction":
      return "no saved prediction";
  }
}

function getDerivedSignalWarning(preview: ReturnType<typeof generatePrediction>) {
  if (
    preview.normalizedInput.dataCompleteness === 0 &&
    preview.normalizedInput.homeTeam.providedSignals.length === 0 &&
    preview.normalizedInput.awayTeam.providedSignals.length === 0
  ) {
    return "baseline/default signals";
  }

  return null;
}

function getSaveStatusMessage(status: string | undefined) {
  switch (status) {
    case "saved":
      return {
        title: "Prediccion interna guardada",
        body: "La prediccion interna se guardo para este fixture real y permanece en alcance interno.",
        tone: "success" as const,
      };
    case "duplicate":
      return {
        title: "Prediccion interna ya guardada",
        body: "Ya existe una prediccion interna compatible para este fixture y no se creo un duplicado.",
        tone: "info" as const,
      };
    case "no_model":
      return {
        title: "Modelo activo no disponible",
        body: "No existe una version activa del modelo para guardar esta prediccion interna.",
        tone: "warning" as const,
      };
    case "not_found":
      return {
        title: "Fixture no disponible",
        body: "El fixture solicitado ya no esta disponible dentro del alcance admin_only de API-Football.",
        tone: "warning" as const,
      };
    case "invalid":
      return {
        title: "Solicitud invalida",
        body: "No fue posible procesar la solicitud de guardado para esta prediccion interna.",
        tone: "warning" as const,
      };
    case "error":
      return {
        title: "No se pudo guardar la prediccion interna",
        body: "La operacion fallo antes de persistir el flujo completo. Revisa la configuracion interna y vuelve a intentarlo.",
        tone: "warning" as const,
      };
    default:
      return null;
  }
}

function getEvaluationStatusMessage(status: string | undefined) {
  switch (status) {
    case "saved":
      return {
        title: "Evaluacion interna guardada",
        body: "La evaluacion interna se persistio a partir del resultado verificado de este fixture real.",
        tone: "success" as const,
      };
    case "refreshed":
      return {
        title: "Evaluacion interna refrescada",
        body: "La evaluacion interna se actualizo usando el resultado verificado mas reciente para este fixture.",
        tone: "info" as const,
      };
    case "no_result":
      return {
        title: "Resultado no disponible",
        body: "Todavia no existe un match_result guardado para evaluar esta prediccion interna.",
        tone: "warning" as const,
      };
    case "unverified":
      return {
        title: "Resultado sin verificar",
        body: "La evaluacion interna solo puede persistirse cuando el match_result esta marcado como verified.",
        tone: "warning" as const,
      };
    case "incomplete":
      return {
        title: "Prediccion incompleta para evaluar",
        body: "Faltan mercados requeridos o el detalle de scorelines no es valido para construir la evaluacion interna.",
        tone: "warning" as const,
      };
    case "not_evaluable":
      return {
        title: "Prediccion no evaluable",
        body: "El helper interno de evaluacion rechazo esta combinacion de prediccion y resultado verificado.",
        tone: "warning" as const,
      };
    case "not_found":
      return {
        title: "Prediccion no disponible",
        body: "La prediccion interna solicitada ya no esta disponible dentro del alcance admin_only de API-Football.",
        tone: "warning" as const,
      };
    case "invalid":
      return {
        title: "Solicitud invalida",
        body: "No fue posible procesar la solicitud de evaluacion interna.",
        tone: "warning" as const,
      };
    case "error":
      return {
        title: "No se pudo persistir la evaluacion interna",
        body: "La operacion fallo antes de completar la lectura o persistencia de prediction_results.",
        tone: "warning" as const,
      };
    default:
      return null;
  }
}

function getResultStatusMessage(status: string | undefined) {
  switch (status) {
    case "verified":
      return {
        title: "Resultado marcado como verificado",
        body: "El match_result real quedo marcado como verified para este fixture admin_only de API-Football.",
        tone: "success" as const,
      };
    case "already_verified":
      return {
        title: "Resultado ya verificado",
        body: "Este match_result ya estaba marcado como verified y no requirio una nueva actualizacion.",
        tone: "info" as const,
      };
    case "rejected":
      return {
        title: "Resultado rechazado",
        body: "Este match_result esta marcado como rejected y no puede verificarse desde este slice.",
        tone: "warning" as const,
      };
    case "no_result":
      return {
        title: "Resultado no disponible",
        body: "No existe un match_result guardado para verificar este fixture real.",
        tone: "warning" as const,
      };
    case "not_found":
      return {
        title: "Resultado fuera de alcance",
        body: "El match_result solicitado ya no coincide con un fixture admin_only de API-Football dentro de esta ruta.",
        tone: "warning" as const,
      };
    case "invalid":
      return {
        title: "Solicitud invalida",
        body: "No fue posible procesar la solicitud de verificacion del resultado.",
        tone: "warning" as const,
      };
    case "error":
      return {
        title: "No se pudo verificar el resultado",
        body: "La operacion fallo antes de completar la verificacion interna del match_result.",
        tone: "warning" as const,
      };
    default:
      return null;
  }
}

function getPublishStatusMessage(status: string | undefined) {
  switch (status) {
    case "published":
      return {
        title: "Prediccion publica basica publicada",
        body: "Se creo una nueva prediccion public_product para un unico fixture y el partido paso a alcance publico.",
        tone: "success" as const,
      };
    case "already_published":
      return {
        title: "Publicacion ya existente",
        body: "Ya existia una prediccion public_product compatible para ese fixture y solo se confirmo el alcance publico del partido.",
        tone: "info" as const,
      };
    case "blocked":
      return {
        title: "Publicacion bloqueada por guardrails",
        body: "Este fixture o esta prediccion interna no cumplen el contrato minimo de publicacion manual para producto publico.",
        tone: "warning" as const,
      };
    case "not_found":
      return {
        title: "Fixture o prediccion no disponibles",
        body: "No fue posible encontrar el match o la prediccion interna solicitada para publicacion manual.",
        tone: "warning" as const,
      };
    case "invalid":
      return {
        title: "Solicitud de publicacion invalida",
        body: "No fue posible procesar la solicitud de publicacion manual para este fixture.",
        tone: "warning" as const,
      };
    case "error":
      return {
        title: "No se pudo publicar la prediccion basica",
        body: "La operacion fallo antes de completar la copia public_product o el cambio de alcance del partido.",
        tone: "warning" as const,
      };
    default:
      return null;
  }
}

export default async function RealFixtureLabPage({ searchParams }: RealFixtureLabPageProps) {
  await requireAdmin("/admin/real-fixture-lab");

  const { externalId, save, evaluation, result, publish } = await searchParams;
  const selectedExternalId = externalId?.trim() || null;
  const saveStatusMessage = getSaveStatusMessage(save);
  const evaluationStatusMessage = getEvaluationStatusMessage(evaluation);
  const resultStatusMessage = getResultStatusMessage(result);
  const publishStatusMessage = getPublishStatusMessage(publish);
  const statusMessage =
    saveStatusMessage ?? evaluationStatusMessage ?? resultStatusMessage ?? publishStatusMessage;
  const realFixtureLabData = await getAdminRealFixtureLabData();
  const fixtureEntries: FixtureEntry[] =
    realFixtureLabData.status === "ready"
      ? realFixtureLabData.fixtures.map((fixture) => {
          const predictionInput = buildRealFixturePredictionInput(fixture);
          const preview = generatePrediction(predictionInput);

          return {
            fixture,
            predictionInput,
            preview,
            derivedSignalWarning: getDerivedSignalWarning(preview),
            evaluationStatus: "waiting_result",
          };
        })
      : [];

  for (const entry of fixtureEntries) {
    entry.evaluationStatus = getFixtureEvaluationStatus(entry);
  }

  const selectedFixtureEntry = selectedExternalId
    ? fixtureEntries.find((entry) => entry.fixture.externalId === selectedExternalId) ?? null
    : null;

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Admin / Real Fixture Lab
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Real Fixture Lab Trial</h1>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">
          Superficie interna de solo lectura para fixtures reales ingeridos desde API-Football. Este flujo
          permanece restringido a administracion, conserva el alcance <code>admin_only</code> y no expone
          nada al producto publico.
        </p>
      </section>

      {statusMessage ? (
        <section
          className={`panel rounded-lg border p-5 ${
            statusMessage.tone === "success"
              ? "border-emerald-400/35 bg-emerald-500/10"
              : statusMessage.tone === "info"
                ? "border-[var(--accent)]/35 bg-[var(--accent)]/10"
                : "border-[var(--warning)]/35 bg-[var(--warning)]/10"
          }`}
        >
          <h2
            className={`text-lg font-semibold ${
              statusMessage.tone === "success"
                ? "text-emerald-300"
                : statusMessage.tone === "info"
                  ? "text-[var(--accent)]"
                  : "text-[var(--warning)]"
            }`}
          >
            {statusMessage.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{statusMessage.body}</p>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="panel rounded-lg p-5">
          <h2 className="text-lg font-semibold">Fixture objetivo</h2>
          <p className="mt-2 font-mono text-xs text-[var(--muted)]">
            {selectedExternalId ?? "Sin externalId seleccionado"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2 py-1 text-[var(--warning)]">
              Internal only
            </span>
            <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-1 text-[var(--accent)]">
              API-Football real fixture
            </span>
            <span className="rounded-md border border-white/10 px-2 py-1 text-[var(--muted)]">admin_only</span>
            <span className="rounded-md border border-white/10 px-2 py-1 text-[var(--muted)]">not public</span>
          </div>
          <form action="/admin/real-fixture-lab" method="get" className="mt-4 space-y-3">
            <label className="block text-sm text-[var(--muted)]" htmlFor="externalId">
              External ID de fixture real
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="externalId"
                name="externalId"
                type="text"
                defaultValue={selectedExternalId ?? ""}
                placeholder="api-football:fixture:123456"
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]/40"
              />
              <button
                type="submit"
                className="rounded-md border border-[var(--accent)]/35 bg-[var(--accent)]/15 px-3 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
              >
                Cargar fixture
              </button>
            </div>
          </form>
        </div>

        <div className="panel rounded-lg border border-[var(--warning)]/35 p-5">
          <h2 className="text-lg font-semibold text-[var(--warning)]">Phase 3A guardrail</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            This route can store and internally evaluate one saved pre-match prediction for a selected
            real fixture, but it does not publish anything, does not consume provider predictions or odds,
            and only evaluates after a verified result exists.
          </p>
        </div>
      </section>

      {realFixtureLabData.status === "unavailable" ? (
        <section className="panel rounded-lg border border-[var(--warning)]/35 p-5">
          <h2 className="text-lg font-semibold">Datos no disponibles</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{realFixtureLabData.message}</p>
        </section>
      ) : realFixtureLabData.fixtures.length === 0 ? (
        <section className="panel rounded-lg p-5">
          <h2 className="text-lg font-semibold">Sin fixtures internos disponibles</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Aun no hay fixtures reales API-Football con alcance <code>admin_only</code> disponibles para el
            resumen piloto.
          </p>
        </section>
      ) : (
        <section className="panel rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Pilot summary</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Resumen admin-only de fixtures reales API-Football ya disponibles dentro del piloto D06.
              </p>
            </div>
            <span className="rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
              internal evidence only
            </span>
          </div>

          {realFixtureLabData.warnings.length ? (
            <div className="mt-4 rounded-lg border border-[var(--warning)]/35 bg-[var(--warning)]/10 p-4">
              <h3 className="text-sm font-semibold text-[var(--warning)]">Lectura parcial</h3>
              <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                {realFixtureLabData.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  <th className="px-3 py-3 font-medium">Fixture</th>
                  <th className="px-3 py-3 font-medium">Kickoff</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Prediction</th>
                  <th className="px-3 py-3 font-medium">Result</th>
                  <th className="px-3 py-3 font-medium">Evaluation</th>
                  <th className="px-3 py-3 font-medium">Signals</th>
                  <th className="w-32 px-3 py-3 font-medium whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {fixtureEntries.map((entry) => (
                  <tr key={entry.fixture.id} className="border-b border-white/10 align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium text-white">
                        {entry.fixture.homeTeamName} vs {entry.fixture.awayTeamName}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[var(--muted)]">{entry.fixture.externalId}</p>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">{formatKickoff(entry.fixture.kickoffAt)}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-[var(--muted)]">
                        {entry.fixture.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {entry.fixture.savedPrediction ? (
                        <div className="space-y-1">
                          <p className="text-emerald-300">saved</p>
                          <p className="font-mono text-xs">prediction_version_id: {entry.fixture.savedPrediction.id}</p>
                          <p>model_version: {entry.fixture.savedPrediction.modelVersionVersion ?? entry.fixture.savedPrediction.modelVersionId}</p>
                          <p>prediction_type: {entry.fixture.savedPrediction.predictionType}</p>
                          <p>run_scope: {entry.fixture.savedPrediction.runScope}</p>
                        </div>
                      ) : (
                        <span className="text-[var(--warning)]">not saved</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {entry.fixture.result ? entry.fixture.result.verification_status : "no result"}
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {formatFixtureEvaluationStatus(entry.evaluationStatus)}
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {entry.derivedSignalWarning ? (
                        <div className="space-y-1">
                          <p className="text-[var(--warning)]">{entry.derivedSignalWarning}</p>
                          <p>data_completeness: {formatPercentage(entry.preview.normalizedInput.dataCompleteness * 100)}</p>
                          <p>provided_home: {entry.preview.normalizedInput.homeTeam.providedSignals.length}</p>
                          <p>provided_away: {entry.preview.normalizedInput.awayTeam.providedSignals.length}</p>
                        </div>
                      ) : (
                        <span>ok</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <a
                        href={`/admin/real-fixture-lab?externalId=${encodeURIComponent(entry.fixture.externalId)}`}
                        className="inline-flex min-w-28 items-center justify-center whitespace-nowrap rounded-md border border-[var(--accent)]/35 bg-[var(--accent)]/15 px-3 py-2 text-center text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
                      >
                        Open detail
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!selectedExternalId ? (
        <section className="panel rounded-lg p-5">
          <h2 className="text-lg font-semibold">Ningun fixture seleccionado</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Abre esta ruta con <code>?externalId=api-football:fixture:&lt;id&gt;</code> o carga un
            external id desde el formulario para revisar un fixture real <code>admin_only</code> de
            API-Football.
          </p>
        </section>
      ) : realFixtureLabData.status !== "ready" ? null : !selectedFixtureEntry ? (
        <section className="panel rounded-lg p-5">
          <h2 className="text-lg font-semibold">Fixture no encontrado</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            No existe un fixture real API-Football con alcance <code>admin_only</code> para el external id
            solicitado.
          </p>
        </section>
      ) : (
        <section className="panel rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Fixtures reales seleccionados</h2>
            <span className="rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
              lectura admin
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {[selectedFixtureEntry].map((entry) => {
              const { fixture, predictionInput, preview } = entry;

              return (
                <article
                  key={fixture.id}
                  className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md border border-white/10 px-2 py-1 text-[var(--muted)]">
                          {fixture.competitionName}
                        </span>
                        <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-1 text-[var(--accent)]">
                          {fixture.intakeSource}
                        </span>
                        <span className="rounded-md border border-white/10 px-2 py-1 text-[var(--muted)]">
                          {fixture.accessScope}
                        </span>
                        <span className="rounded-md border border-white/10 px-2 py-1 text-[var(--muted)]">
                          {fixture.status}
                        </span>
                      </div>
                      <p className="mt-3 text-xl font-medium">{fixture.homeTeamName} vs {fixture.awayTeamName}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{fixture.stage ?? "Etapa sin registrar"}</p>
                      <div className="mt-3 space-y-1 text-sm text-[var(--muted)]">
                        <p>Kickoff: {formatKickoff(fixture.kickoffAt)}</p>
                        <p className="font-mono text-xs">slug: {fixture.slug}</p>
                        <p className="font-mono text-xs">external_id: {fixture.externalId}</p>
                      </div>
                      <p className="mt-3 text-sm text-[var(--muted)]">
                        {fixture.sourceNote ?? "Sin source_note visible para este fixture."}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm">
                      <h3 className="font-semibold">Resultado actual</h3>
                      {fixture.result ? (
                        <div className="mt-3 space-y-2 text-[var(--muted)]">
                          <p className="font-mono text-base text-white">
                            {fixture.result.home_goals}-{fixture.result.away_goals}
                          </p>
                          <p>verification_status: {fixture.result.verification_status}</p>
                          <p>intake_source: {fixture.result.intake_source}</p>
                          {fixture.result.reviewed_at ? (
                            <p>reviewed_at: {formatTimestamp(fixture.result.reviewed_at)}</p>
                          ) : null}
                          {fixture.result.reviewed_by ? <p className="font-mono text-xs">reviewed_by: {fixture.result.reviewed_by}</p> : null}
                          <p>{fixture.result.source_note ?? "Sin nota de resultado."}</p>
                          {fixture.result.verification_status === "pending_review" ? (
                            <div className="rounded-md border border-[var(--warning)]/35 bg-[var(--warning)]/10 px-3 py-2 text-xs text-[var(--warning)]">
                              Pending review interno. D05H permanece bloqueado hasta marcar este resultado como verified.
                            </div>
                          ) : fixture.result.verification_status === "verified" ? (
                            <div className="rounded-md border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                              Resultado verificado. La evaluacion interna ya puede persistirse si existe prediccion guardada.
                            </div>
                          ) : (
                            <div className="rounded-md border border-[var(--warning)]/35 bg-[var(--warning)]/10 px-3 py-2 text-xs text-[var(--warning)]">
                              Resultado rechazado. Este slice no permite cambiarlo ni re-verificarlo.
                            </div>
                          )}
                          {fixture.result.verification_status === "pending_review" ? (
                            <form action={verifyRealFixtureResultAction} className="pt-1">
                              <input type="hidden" name="externalId" value={fixture.externalId} />
                              <input type="hidden" name="matchResultId" value={fixture.result.id} />
                              <button
                                type="submit"
                                className="rounded-md border border-[var(--warning)]/35 bg-[var(--warning)]/15 px-3 py-2 text-sm font-medium text-[var(--warning)] transition hover:bg-[var(--warning)]/20"
                              >
                                Marcar resultado como verificado
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2 text-[var(--muted)]">
                          <p>Aun no existe `match_result` registrado para este fixture.</p>
                          <p className="text-xs">Sin match_result no hay accion de verificacion ni evaluacion interna disponible.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <section className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">Prediction preview</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Internal trial preview only. In-memory, not persisted, not public.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2 py-1 text-[var(--warning)]">
                          no provider predictions
                        </span>
                        <span className="rounded-md border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2 py-1 text-[var(--warning)]">
                          no odds
                        </span>
                        <span className="rounded-md border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2 py-1 text-[var(--warning)]">
                          Preview in-memory
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="space-y-4">
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                          <h4 className="font-semibold">Model input summary</h4>
                          <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                            <p className="font-mono text-xs">match_id: {predictionInput.matchId}</p>
                            <p>run_scope: {preview.normalizedInput.runScope}</p>
                            <p>prediction_type: {preview.normalizedInput.predictionType}</p>
                            <p>
                              context: neutralVenue=
                              {preview.normalizedInput.context.neutralVenue ? "true" : "false"} / homeAdvantageScore=
                              {preview.normalizedInput.context.homeAdvantageScore}
                            </p>
                            <p>data_completeness: {formatPercentage(preview.normalizedInput.dataCompleteness * 100)}</p>
                            <p>provided_signals_home: {preview.normalizedInput.homeTeam.providedSignals.length}</p>
                            <p>provided_signals_away: {preview.normalizedInput.awayTeam.providedSignals.length}</p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                          <h4 className="font-semibold">Generated output</h4>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-lg border border-white/10 p-3">
                              <p className="text-xs text-[var(--muted)]">1X2</p>
                              <p className="mt-2 text-sm text-white">
                                Local {formatPercentage(preview.probabilities.oneXTwo.homeWin)}
                              </p>
                              <p className="text-sm text-white">Empate {formatPercentage(preview.probabilities.oneXTwo.draw)}</p>
                              <p className="text-sm text-white">Visita {formatPercentage(preview.probabilities.oneXTwo.awayWin)}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 p-3">
                              <p className="text-xs text-[var(--muted)]">BTTS</p>
                              <p className="mt-2 text-sm text-white">Yes {formatPercentage(preview.probabilities.btts.yes)}</p>
                              <p className="text-sm text-white">No {formatPercentage(preview.probabilities.btts.no)}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 p-3">
                              <p className="text-xs text-[var(--muted)]">Over/Under 2.5</p>
                              <p className="mt-2 text-sm text-white">
                                Over {formatPercentage(preview.probabilities.overUnder25.over)}
                              </p>
                              <p className="text-sm text-white">
                                Under {formatPercentage(preview.probabilities.overUnder25.under)}
                              </p>
                            </div>
                            <div className="rounded-lg border border-white/10 p-3">
                              <p className="text-xs text-[var(--muted)]">Projection</p>
                              <p className="mt-2 text-sm text-white">Score {preview.mostLikelyScore}</p>
                              <p className="text-sm text-white">Confidence {formatPercentage(preview.confidence)}</p>
                              <p className="text-sm text-white">Risk {preview.risk}</p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div>
                              <h5 className="text-sm font-medium">Top scorelines</h5>
                              <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                                {preview.topScorelines.map((scoreline) => (
                                  <li key={scoreline.score} className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
                                    <span className="font-mono text-white">{scoreline.score}</span>
                                    <span>{formatPercentage(scoreline.probability)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium">Notes and factors</h5>
                              <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                                {[...preview.notes, ...preview.factors].map((entry) => (
                                  <li key={entry} className="rounded-md border border-white/10 px-3 py-2">
                                    {entry}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <aside className="rounded-lg border border-[var(--warning)]/35 bg-[var(--warning)]/10 p-4">
                        <h4 className="font-semibold text-[var(--warning)]">Internal persistence</h4>
                        {fixture.savedPrediction ? (
                          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-[var(--muted)]">
                            <p className="font-medium text-emerald-300">Latest saved internal prediction</p>
                            <p className="mt-2">run_scope: {fixture.savedPrediction.runScope}</p>
                            <p>prediction_type: {fixture.savedPrediction.predictionType}</p>
                            <p className="font-mono text-xs">prediction_version_id: {fixture.savedPrediction.id}</p>
                            <p>
                              model_version: {fixture.savedPrediction.modelVersionVersion ?? fixture.savedPrediction.modelVersionId}
                            </p>
                            <p>guardada: {formatTimestamp(fixture.savedPrediction.createdAt)}</p>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-[var(--muted)]">No saved internal prediction yet.</p>
                        )}
                        <div className="mt-3 rounded-lg border border-white/10 bg-black/10 p-3 text-sm text-[var(--muted)]">
                          <p className="font-medium text-white">Active model context</p>
                          {fixture.activeModelVersionId ? (
                            <>
                              <p className="mt-2">active_model_version: {fixture.activeModelVersion ?? fixture.activeModelVersionId}</p>
                              <p className="font-mono text-xs">active_model_version_id: {fixture.activeModelVersionId}</p>
                              <p>
                                active_model_saved: {fixture.hasSavedPredictionForActiveModel ? "yes" : "no"}
                              </p>
                              {fixture.activeModelSavedPredictionId ? (
                                <p className="font-mono text-xs">
                                  active_model_prediction_version_id: {fixture.activeModelSavedPredictionId}
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <p className="mt-2 text-[var(--warning)]">
                              No active model version is configured. Internal save stays blocked until one is activated.
                            </p>
                          )}
                        </div>
                        {fixture.activeModelVersionId ? (
                          fixture.hasSavedPredictionForActiveModel ? (
                            <p className="mt-3 text-xs text-[var(--muted)]">
                              This fixture already has an internal prediction for the active model version.
                            </p>
                          ) : (
                            <form action={saveRealFixturePredictionAction} className="mt-3 space-y-3">
                              <input type="hidden" name="externalId" value={fixture.externalId} />
                              <button
                                type="submit"
                                className="rounded-md border border-[var(--accent)]/35 bg-[var(--accent)]/15 px-3 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
                              >
                                Guardar prediccion interna para modelo activo
                              </button>
                            </form>
                          )
                        ) : null}
                        {fixture.savedPrediction ? (
                          fixture.result?.verification_status === "verified" ? (
                            fixture.savedEvaluation ? (
                              <div className="mt-3 space-y-3">
                                <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3 text-sm text-[var(--muted)]">
                                  <p className="font-medium text-[var(--accent)]">Evaluacion interna guardada</p>
                                  <p className="mt-2">winner: {formatMetric(fixture.savedEvaluation.winnerCorrect)}</p>
                                  <p>btts: {formatMetric(fixture.savedEvaluation.bttsCorrect)}</p>
                                  <p>over_2_5: {formatMetric(fixture.savedEvaluation.over25Correct)}</p>
                                  <p>exact_score: {formatMetric(fixture.savedEvaluation.exactScoreCorrect)}</p>
                                  <p>goal_error: {fixture.savedEvaluation.goalError ?? "n/a"}</p>
                                  <p>validada: {formatTimestamp(fixture.savedEvaluation.validatedAt)}</p>
                                  <p className="mt-2">{fixture.savedEvaluation.errorSummary ?? "Sin resumen adicional."}</p>
                                </div>
                                <form action={persistRealFixtureEvaluationAction} className="space-y-3">
                                  <input type="hidden" name="predictionVersionId" value={fixture.savedPrediction.id} />
                                  <input type="hidden" name="externalId" value={fixture.externalId} />
                                  <button
                                    type="submit"
                                    className="rounded-md border border-[var(--accent)]/35 bg-[var(--accent)]/15 px-3 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
                                  >
                                    Refrescar evaluacion desde resultado verificado
                                  </button>
                                </form>
                              </div>
                            ) : (
                              <form action={persistRealFixtureEvaluationAction} className="mt-3 space-y-3">
                                <input type="hidden" name="predictionVersionId" value={fixture.savedPrediction.id} />
                                <input type="hidden" name="externalId" value={fixture.externalId} />
                                <button
                                  type="submit"
                                  className="rounded-md border border-[var(--accent)]/35 bg-[var(--accent)]/15 px-3 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
                                >
                                  Persistir evaluacion interna
                                </button>
                              </form>
                            )
                          ) : fixture.result ? (
                            <p className="mt-3 text-xs text-[var(--muted)]">
                              La evaluacion interna sigue bloqueada hasta que el `match_result` quede marcado como
                              `verified`.
                            </p>
                          ) : (
                            <p className="mt-3 text-xs text-[var(--muted)]">
                              La evaluacion interna sigue bloqueada hasta que exista un `match_result` verificado.
                            </p>
                          )
                        ) : null}
                        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                          <li>Uses internal preview defaults when fixture signals are missing.</li>
                          <li>Stored predictions remain internal and are not public.</li>
                          <li>Does not read provider predictions.</li>
                          <li>Does not read betting odds.</li>
                          <li>Evaluation remains internal-only and depends on a verified match result.</li>
                          <li>Intended only for internal model-trial preparation.</li>
                        </ul>
                        {fixture.savedPrediction ? (
                          <form action={publishRealFixturePredictionAction} className="mt-4 space-y-3">
                            <input type="hidden" name="matchId" value={fixture.id} />
                            <input type="hidden" name="matchSlug" value={fixture.slug} />
                            <input
                              type="hidden"
                              name="internalPredictionVersionId"
                              value={fixture.savedPrediction.id}
                            />
                            <button
                              type="submit"
                              className="rounded-md border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/15"
                            >
                              Publicar prediccion basica para este fixture
                            </button>
                            <p className="text-xs text-[var(--muted)]">
                              Crea una nueva prediccion <code>public_product</code> para este partido y cambia
                              solo este match a alcance <code>public</code>. No modifica la fila interna ni toca
                              <code> prediction_results</code>.
                            </p>
                          </form>
                        ) : null}
                        {!fixture.hasSavedPredictionForActiveModel && fixture.activeModelVersionId ? (
                          <p className="mt-3 text-xs text-[var(--muted)]">
                            Guardado interno solamente. No publica la prediccion, no usa provider predictions y no usa odds.
                          </p>
                        ) : null}
                      </aside>
                    </div>
                  </section>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
