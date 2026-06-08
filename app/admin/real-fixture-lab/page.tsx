import { requireAdmin } from "@/lib/auth/session";
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
          <h2 className="text-lg font-semibold text-[var(--warning)]">Phase 1 limit</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Prediction generation and prediction persistence are not enabled in this phase. This page only
            confirms the real fixture is visible to admin in a separate internal path.
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
          <div className="mt-4 space-y-4">
            {realFixtureLabData.fixtures.map((fixture) => (
              <article
                key={fixture.id}
                className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-[minmax(0,1fr)_320px]"
              >
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
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
