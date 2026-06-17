import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getRealFixtureEvaluationQueueData } from "@/lib/supabase/real-fixture-evaluation-queue-queries";
import { persistRealFixtureEvaluationAction } from "../real-fixture-lab/actions";
import { SubmitButton } from "../real-fixture-lab/submit-button";

export const dynamic = "force-dynamic";

const QUEUE_PATH = "/admin/real-fixture-evaluation-queue";
const ACTION_BUTTON_CLASS =
  "cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
const ACCENT_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} border-[var(--accent)]/35 bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/20`;

type RealFixtureEvaluationQueuePageProps = {
  searchParams: Promise<{
    externalId?: string;
    evaluation?: string;
  }>;
};

function formatKickoff(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

function getStatusMessage(args: { externalId?: string; evaluation?: string }) {
  if (args.evaluation === "saved") {
    return {
      tone: "success" as const,
      title: "Evaluacion persistida",
      body: `La evaluacion interna de ${args.externalId ?? "este fixture"} se guardo correctamente.`,
    };
  }

  if (args.evaluation === "refreshed") {
    return {
      tone: "info" as const,
      title: "Evaluacion actualizada",
      body: `La evaluacion interna de ${args.externalId ?? "este fixture"} se recalculo desde el resultado verificado.`,
    };
  }

  if (args.evaluation) {
    return {
      tone: "warning" as const,
      title: "Evaluacion no completada",
      body: "La accion no termino como se esperaba. Revisa el estado actual antes de reintentar.",
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

export default async function RealFixtureEvaluationQueuePage({
  searchParams,
}: RealFixtureEvaluationQueuePageProps) {
  await requireAdmin(QUEUE_PATH);

  const { externalId, evaluation } = await searchParams;
  const statusMessage = getStatusMessage({ externalId, evaluation });
  const queueData = await getRealFixtureEvaluationQueueData();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Admin / Evaluation
        </p>
        <h1 className="text-4xl font-semibold">Real fixture evaluation queue</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          Cola minima para persistir evaluaciones internas de resultados reales ya verificados sin abrir el
          detalle pesado de Real Fixture Lab. Solo muestra campos escalares y reutiliza la accion admin
          existente de evaluacion.
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
            <h2 className="text-lg font-semibold">Verified results pending evaluation</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              API-Football World Cup fixtures with verified results, internal prediction available, and no
              persisted internal evaluation yet.
            </p>
          </div>
          <span className="rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
            admin-only queue
          </span>
        </div>

        {queueData.rows.length === 0 ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--muted)]">
            No verified results are currently waiting for internal evaluation persistence.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  <th className="px-3 py-3 font-medium">Fixture</th>
                  <th className="px-3 py-3 font-medium">Kickoff</th>
                  <th className="px-3 py-3 font-medium">Verified score</th>
                  <th className="px-3 py-3 font-medium">Prediction</th>
                  <th className="px-3 py-3 font-medium">Public link</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {queueData.rows.map((row) => (
                  <tr key={row.internalPredictionId} className="border-b border-white/10 align-top">
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
                      <p className="mt-1 text-xs text-emerald-300">{row.verificationStatus}</p>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      <div className="space-y-1">
                        <p className="font-mono text-xs">internal: {row.internalPredictionId}</p>
                        <p>public_product: {row.latestPublicPredictionId ? "available" : "missing"}</p>
                        <p>evaluation: {row.evaluationStatus}</p>
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
                      <form action={persistRealFixtureEvaluationAction} className="space-y-2">
                        <input type="hidden" name="predictionVersionId" value={row.internalPredictionId} />
                        <input type="hidden" name="externalId" value={row.externalId} />
                        <input type="hidden" name="returnTo" value={QUEUE_PATH} />
                        <SubmitButton
                          idleLabel="Persist evaluation"
                          pendingLabel="Persisting..."
                          className={ACCENT_BUTTON_CLASS}
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
    </div>
  );
}
