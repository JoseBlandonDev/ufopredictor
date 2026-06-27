import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getRealFixtureResultReviewQueueData } from "@/lib/supabase/real-fixture-result-review-queue-queries";
import {
  createManualRealFixtureResultAction,
  verifyRealFixtureResultAction,
} from "../real-fixture-lab/actions";
import { SubmitButton } from "../real-fixture-lab/submit-button";

export const dynamic = "force-dynamic";

const QUEUE_PATH = "/admin/real-fixture-result-review-queue";
const ACTION_BUTTON_CLASS =
  "cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
const WARNING_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} border-[var(--warning)]/35 bg-[var(--warning)]/15 text-[var(--warning)] hover:bg-[var(--warning)]/20`;

type RealFixtureResultReviewQueuePageProps = {
  searchParams: Promise<{
    externalId?: string;
    result?: string;
    manual?: string;
  }>;
};

function formatKickoff(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

function getStatusMessage(args: { externalId?: string; result?: string; manual?: string }) {
  if (args.result === "verified") {
    return {
      tone: "success" as const,
      title: "Resultado verificado",
      body: `El resultado pendiente de ${args.externalId ?? "este fixture"} quedo marcado como verified.`,
    };
  }

  if (args.result === "already_verified") {
    return {
      tone: "info" as const,
      title: "Resultado ya verificado",
      body: "La cola detecto que ese resultado ya estaba marcado como verified.",
    };
  }

  if (args.result) {
    return {
      tone: "warning" as const,
      title: "Verificacion no completada",
      body: "La accion no termino como se esperaba. Revisa el estado actual del resultado antes de reintentar.",
    };
  }

  if (args.manual === "created") {
    return {
      tone: "success" as const,
      title: "Resultado manual pendiente creado",
      body:
        `Se registro un match_result pending_review para ${args.externalId ?? "este fixture"}. ` +
        "La verificacion y la evaluacion siguen siendo pasos separados.",
    };
  }

  if (args.manual === "already_pending") {
    return {
      tone: "info" as const,
      title: "Resultado manual ya pendiente",
      body: "La misma combinacion de marcador y source note ya existia como pending_review.",
    };
  }

  if (args.manual === "already_verified") {
    return {
      tone: "info" as const,
      title: "Resultado ya verificado",
      body: "Ese fixture ya tenia un resultado verified con el mismo marcador.",
    };
  }

  if (args.manual) {
    return {
      tone: "warning" as const,
      title: "Resultado manual no creado",
      body:
        "La accion fue bloqueada o encontro un conflicto. Confirma identidad, kickoff, marcador y source note antes de reintentar.",
    };
  }

  return null;
}

function getStatusClassName(tone: "success" | "info" | "warning") {
  switch (tone) {
    case "success":
      return "rounded-lg border border-emerald-400/35 bg-emerald-500/10 p-4";
    case "info":
      return "rounded-lg border border-[var(--accent)]/35 bg-[var(--accent)]/10 p-4";
    case "warning":
      return "rounded-lg border border-[var(--warning)]/35 bg-[var(--warning)]/10 p-4";
  }
}

export default async function RealFixtureResultReviewQueuePage({
  searchParams,
}: RealFixtureResultReviewQueuePageProps) {
  await requireAdmin(QUEUE_PATH);

  const { externalId, result, manual } = await searchParams;
  const statusMessage = getStatusMessage({ externalId, result, manual });
  const queueData = await getRealFixtureResultReviewQueueData();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Admin / Result Review
        </p>
        <h1 className="text-4xl font-semibold">Result review queue</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          Cola minima para verificar resultados reales pendientes sin abrir el detalle pesado de Real Fixture
          Lab. Tambien permite crear un resultado manual pending_review para fixtures exactos del Mundial
          que siguen sin resultado verificado despues del kickoff.
        </p>
      </section>

      {statusMessage ? (
        <section className={getStatusClassName(statusMessage.tone)}>
          <h2 className="text-lg font-semibold">{statusMessage.title}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{statusMessage.body}</p>
        </section>
      ) : null}

      <section className="panel rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Pending result review</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              World Cup fixtures with pending_review match_results. La cola conserva el origen real del
              registro y no auto-verifica resultados manuales.
            </p>
          </div>
          <span className="rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
            admin-only queue
          </span>
        </div>

        {queueData.rows.length === 0 ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--muted)]">
            No pending result review rows are available.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  <th className="px-3 py-3 font-medium">Fixture</th>
                  <th className="px-3 py-3 font-medium">Kickoff</th>
                  <th className="px-3 py-3 font-medium">Score</th>
                  <th className="px-3 py-3 font-medium">Result row</th>
                  <th className="px-3 py-3 font-medium">Match</th>
                  <th className="px-3 py-3 font-medium">Public link</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {queueData.rows.map((row) => (
                  <tr key={row.matchResultId} className="border-b border-white/10 align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium text-white">
                        {row.homeTeamName} vs {row.awayTeamName}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[var(--muted)]">{row.externalId}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        api_football_fixture_id: {row.apiFootballFixtureId ?? "n/a"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">{formatKickoff(row.kickoffAt)}</td>
                    <td className="px-3 py-3">
                      <p className="font-mono text-base text-white">
                        {row.homeGoals}-{row.awayGoals}
                      </p>
                      <p className="mt-1 text-xs text-[var(--warning)]">{row.verificationStatus}</p>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      <div className="space-y-1">
                        <p>intake_source: {row.resultIntakeSource}</p>
                        <p className="font-mono text-xs">match_result_id: {row.matchResultId}</p>
                        <p className="text-xs">
                          source_note: {row.sourceNote?.trim() ? row.sourceNote : "n/a"}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      <div className="space-y-1">
                        <p>{row.matchStatus}</p>
                        <p>access_scope: {row.accessScope}</p>
                        <p>{row.competitionName}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {row.accessScope === "public" ? (
                        <Link
                          href={`/matches/${row.slug}`}
                          className="font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                        >
                          {row.slug}
                        </Link>
                      ) : (
                        <p className="font-mono text-xs text-[var(--muted)]">{row.slug}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <form action={verifyRealFixtureResultAction} className="space-y-2">
                        <input type="hidden" name="externalId" value={row.externalId} />
                        <input type="hidden" name="matchResultId" value={row.matchResultId} />
                        <input type="hidden" name="returnTo" value={QUEUE_PATH} />
                        <SubmitButton
                          idleLabel="Verify result"
                          pendingLabel="Verifying..."
                          className={WARNING_BUTTON_CLASS}
                        />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Manual result reconciliation</h2>
            <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">
              Fixtures exactos del Mundial con kickoff pasado y sin `match_result`. Crear aqui solo genera
              un `pending_review`; la verificacion y la evaluacion siguen ocurriendo en pasos separados.
            </p>
          </div>
          <span className="rounded-md border border-[var(--warning)]/25 bg-[var(--warning)]/10 px-3 py-1 text-xs text-[var(--warning)]">
            official-source required
          </span>
        </div>

        <div className="mt-4 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4 text-sm text-[var(--muted)]">
          <p>Confirm the score from an official source before submitting.</p>
          <p className="mt-2">Submission creates a pending review only.</p>
          <p className="mt-2">Verification is a separate protected action.</p>
          <p className="mt-2">Original prediction probabilities remain immutable.</p>
        </div>

        {queueData.manualCandidates.length === 0 ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--muted)]">
            No manual reconciliation candidates are currently available.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {queueData.manualCandidates.map((row) => (
              <article key={row.matchId} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <div className="space-y-2 text-sm text-[var(--muted)]">
                    <p className="text-base font-medium text-white">
                      {row.homeTeamName} vs {row.awayTeamName}
                    </p>
                    <p className="font-mono text-xs">{row.externalId}</p>
                    <p className="font-mono text-xs">match_id: {row.matchId}</p>
                    <p className="font-mono text-xs">
                      api_football_fixture_id: {row.apiFootballFixtureId ?? "n/a"}
                    </p>
                    <p>kickoff: {formatKickoff(row.kickoffAt)}</p>
                    <p>status: {row.matchStatus}</p>
                    <p>access_scope: {row.accessScope}</p>
                    <p>existing_result_state: {row.existingResultState}</p>
                    {row.accessScope === "public" ? (
                      <Link
                        href={`/matches/${row.slug}`}
                        className="font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                      >
                        /matches/{row.slug}
                      </Link>
                    ) : (
                      <p className="font-mono text-xs">{row.slug}</p>
                    )}
                  </div>

                  <form action={createManualRealFixtureResultAction} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="matchId" value={row.matchId} />
                    <input type="hidden" name="externalId" value={row.externalId} />
                    <input type="hidden" name="returnTo" value={QUEUE_PATH} />

                    <label className="space-y-2 text-sm text-[var(--muted)]">
                      <span>Home goals</span>
                      <input
                        type="number"
                        name="home_goals"
                        min={0}
                        max={20}
                        required
                        className="w-full rounded-md border border-white/10 bg-black/10 px-3 py-2 text-white"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-[var(--muted)]">
                      <span>Away goals</span>
                      <input
                        type="number"
                        name="away_goals"
                        min={0}
                        max={20}
                        required
                        className="w-full rounded-md border border-white/10 bg-black/10 px-3 py-2 text-white"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-[var(--muted)] sm:col-span-2">
                      <span>Official source note</span>
                      <textarea
                        name="source_note"
                        rows={3}
                        maxLength={500}
                        required
                        className="w-full rounded-md border border-white/10 bg-black/10 px-3 py-2 text-white"
                        placeholder="Documenta la fuente oficial confirmada para este marcador final."
                      />
                    </label>

                    <div className="sm:col-span-2">
                      <SubmitButton
                        idleLabel="Create pending manual result"
                        pendingLabel="Creating pending result..."
                        className={WARNING_BUTTON_CLASS}
                      />
                    </div>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
