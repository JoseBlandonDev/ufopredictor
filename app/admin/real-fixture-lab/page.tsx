import { requireAdmin } from "@/lib/auth/session";
import { generatePrediction } from "@/lib/prediction-engine/generate-prediction";
import { buildRealFixturePredictionInput } from "@/lib/prediction-engine/real-fixture-adapter";
import { getAdminRealFixtureLabData } from "@/lib/supabase/real-fixture-lab-queries";

export const dynamic = "force-dynamic";

const DEFAULT_EXTERNAL_ID = "api-football:fixture:1546413";

type RealFixtureLabPageProps = {
  searchParams: Promise<{ externalId?: string }>;
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

export default async function RealFixtureLabPage({ searchParams }: RealFixtureLabPageProps) {
  await requireAdmin("/admin/real-fixture-lab");

  const { externalId } = await searchParams;
  const selectedExternalId = externalId?.trim() || DEFAULT_EXTERNAL_ID;
  const realFixtureLabData = await getAdminRealFixtureLabData({
    externalId: selectedExternalId,
  });

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

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="panel rounded-lg p-5">
          <h2 className="text-lg font-semibold">Fixture objetivo</h2>
          <p className="mt-2 font-mono text-xs text-[var(--muted)]">{selectedExternalId}</p>
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
        </div>

        <div className="panel rounded-lg border border-[var(--warning)]/35 p-5">
          <h2 className="text-lg font-semibold text-[var(--warning)]">Phase 2 limit</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Prediction preview is in-memory only. Nothing is persisted, nothing is public, and this view
            does not consume provider predictions or odds.
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
          {realFixtureLabData.warnings.length > 0 ? (
            <div className="mt-4 rounded-lg border border-[var(--warning)]/35 bg-[var(--warning)]/10 p-4">
              <h3 className="text-sm font-semibold text-[var(--warning)]">Lectura parcial</h3>
              <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                {realFixtureLabData.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-4 space-y-4">
            {realFixtureLabData.fixtures.map((fixture) => {
              const predictionInput = buildRealFixturePredictionInput(fixture);
              const preview = generatePrediction(predictionInput);

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
                          <p>{fixture.result.source_note ?? "Sin nota de resultado."}</p>
                        </div>
                      ) : (
                        <p className="mt-3 text-[var(--muted)]">Aun no existe `match_result` registrado para este fixture.</p>
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
                          no persistence
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
                        <h4 className="font-semibold text-[var(--warning)]">Preview caution</h4>
                        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                          <li>Uses internal preview defaults when fixture signals are missing.</li>
                          <li>Does not read provider predictions.</li>
                          <li>Does not read betting odds.</li>
                          <li>Does not create prediction_versions, prediction_markets, or prediction_results.</li>
                          <li>Intended only for internal model-trial preparation.</li>
                        </ul>
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
