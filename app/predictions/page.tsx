import Link from "next/link";
import { PublicPredictionCard } from "@/components/public-prediction-card";
import { getPublicPredictionsData } from "@/lib/supabase/public-prediction-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer = user ? "registered_free" : "anonymous";
  const isAuthenticated = viewer === "registered_free";
  const data = await getPublicPredictionsData(viewer);

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Predicciones
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Predicciones reales publicadas del Mundial 2026</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Las probabilidades 1X2 básicas ya están publicadas para fixtures reales seleccionados del
          Mundial 2026. Los datos internos del Lab y el análisis premium quedan fuera de esta
          vista.
        </p>
      </section>

      <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-5">
        <h2 className="text-lg font-semibold">
          {isAuthenticated ? "Tu cuenta gratis está activa" : "Cuenta gratis disponible"}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {isAuthenticated
            ? "Ya ves el contexto completo de confianza y riesgo en las predicciones públicas publicadas y puedes seguir el detalle del partido."
            : "Crea una cuenta gratis para desbloquear el contexto completo de confianza y riesgo y seguir las predicciones públicas publicadas con más claridad."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
              Abrir tu panel
            </Link>
          ) : (
            <>
              <Link href="/register?next=/predictions" className="ufo-btn-primary ufo-focus-ring">
                Crear cuenta gratis
              </Link>
              <Link href="/login?next=/predictions" className="ufo-btn-secondary ufo-focus-ring">
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      </section>

      {data.status === "unavailable" ? (
        <section className="ufo-card rounded-lg border border-[var(--warning)]/25 p-6">
          <h2 className="text-lg font-semibold">Predicciones temporalmente no disponibles</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{data.message}</p>
        </section>
      ) : data.predictions.length === 0 ? (
        <section className="ufo-card rounded-lg p-6">
          <h2 className="text-lg font-semibold">Aún no hay predicciones públicas</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Las predicciones publicadas para producto público aparecerán aquí.
          </p>
        </section>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            {data.predictions.map((prediction) => (
              <PublicPredictionCard key={prediction.matchSlug} prediction={prediction} />
            ))}
          </div>

          <section className="ufo-card rounded-lg border border-white/15 p-5">
            <h2 className="text-lg font-semibold">Cómo leer esta vista</h2>
            <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <p>Las probabilidades reflejan una lectura del modelo, no una promesa de resultado.</p>
              <p>Alta incertidumbre: probabilidades cercanas. Ventaja ligera, no certeza.</p>
              <p>Esta vista sigue limitada a predicciones públicas básicas para fixtures reales seleccionados.</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
