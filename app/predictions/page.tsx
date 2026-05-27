import Link from "next/link";
import { PublicPredictionCard } from "@/components/public-prediction-card";
import { getPublicPredictionsData } from "@/lib/supabase/public-prediction-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const data = await getPublicPredictionsData();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Predicciones
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Panel público de predicciones Mundial 2026</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Las probabilidades 1X2 básicas, confianza y riesgo están disponibles públicamente.
          Los datos internos del Lab y el análisis premium quedan fuera de esta vista.
        </p>
      </section>

      <section className="panel rounded-lg border border-[var(--accent)]/30 p-5">
        <h2 className="text-lg font-semibold">
          {user ? "Tu cuenta gratis está activa" : "Preview con cuenta gratis"}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {user
            ? "Las señales preview seleccionadas aparecerán antes del Mundial."
            : "Crea una cuenta gratis para desbloquear previews seleccionados, señales del modelo y contexto previo al Mundial."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)]"
            >
              Abrir tu panel
            </Link>
          ) : (
            <>
              <Link
                href="/register?next=/predictions"
                className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)]"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/login?next=/predictions"
                className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white"
              >
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      </section>

      {data.status === "unavailable" ? (
        <section className="panel rounded-lg border border-[var(--warning)]/25 p-6">
          <h2 className="text-lg font-semibold">Predicciones temporalmente no disponibles</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{data.message}</p>
        </section>
      ) : data.predictions.length === 0 ? (
        <section className="panel rounded-lg p-6">
          <h2 className="text-lg font-semibold">Aún no hay predicciones públicas</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Las predicciones publicadas para producto público aparecerán aquí.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.predictions.map((prediction) => (
            <PublicPredictionCard key={prediction.matchSlug} prediction={prediction} />
          ))}
        </div>
      )}
    </div>
  );
}
