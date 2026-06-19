import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  const secondaryCta = user
    ? { href: "/dashboard", label: "Abrir panel" }
    : { href: "/register", label: "Crear cuenta gratis" };

  return (
    <div className="space-y-12">
      <section className="grid min-h-[72vh] items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--accent)]">
            Predicciones del Mundial 2026
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            UFO Predictor
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
            Predicciones del Mundial 2026 con contexto de riesgo. Consulta probabilidades
            públicas para fixtures seleccionados y entiende cuándo una ventaja del modelo es
            ligera, cerrada o incierta.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/predictions"
              className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_0_24px_rgba(0,215,255,0.24)] transition hover:bg-white"
            >
              Ver predicciones <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={secondaryCta.href}
              className="rounded-md border border-[var(--accent)]/35 bg-[#0a1a2b]/55 px-5 py-3 text-sm font-semibold text-white transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
            >
              {secondaryCta.label}
            </Link>
          </div>
        </div>
        <div className="panel relative overflow-hidden rounded-lg p-5">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[var(--accent)]/10 blur-3xl" />
          <div className="relative mx-auto mb-5 aspect-square w-full max-w-[260px] sm:max-w-[320px]">
            <Image
              src="/brand/ufo-predictor-logo-main.png"
              alt="UFO Predictor"
              fill
              className="object-contain drop-shadow-[0_0_24px_rgba(0,215,255,0.28)]"
              sizes="(min-width: 1024px) 320px, 70vw"
              priority
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Cobertura gradual
            </p>
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm">Probabilidades 1X2</p>
              <p className="mt-1 text-xl text-[var(--accent)]">Local, empate y visitante</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Lectura pública del partido con probabilidades base y acceso claro al detalle.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm">Contexto de riesgo</p>
              <p className="mt-1 text-xl text-[var(--accent)]">Probabilidades, no certezas</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Una ventaja ligera no significa certeza y las probabilidades cerradas exigen cautela.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm">Cobertura gradual</p>
              <p className="mt-1 text-xl text-[var(--accent)]">Fixtures reales seleccionados</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Nuevos fixtures seleccionados se irán habilitando después de revisión durante el torneo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Disponible ahora
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Predicciones disponibles</h2>
          </div>
          <Link href="/predictions" className="hidden text-sm text-[var(--accent)] sm:block">
            Ir a predicciones
          </Link>
        </div>
        <div className="panel rounded-lg p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Cobertura inicial del Mundial 2026
          </p>
          <h3 className="mt-3 text-2xl font-semibold">Mexico vs South Africa</h3>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
            Consulta la predicción pública del partido inaugural y revisa cómo leer
            probabilidades cerradas con contexto de confianza y riesgo según tu tipo de acceso.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
            Más fixtures seleccionados se irán habilitando después de revisión.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/matches/world-cup-2026-mexico-vs-south-africa-2026-06-11"
              className="ufo-btn-primary ufo-focus-ring"
            >
              Ver detalle del partido
            </Link>
            <Link href="/predictions" className="ufo-btn-secondary ufo-focus-ring">
              Ver todas las predicciones publicadas
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          [
            "Predicciones públicas",
            "Consulta probabilidades 1X2 y una lectura pública del riesgo para fixtures reales seleccionados del Mundial 2026.",
          ],
          [
            "Cuenta gratis",
            "Las cuentas gratis añaden contexto completo de confianza y riesgo, además de herramientas de seguimiento con reglas aplicadas server-side.",
          ],
          [
            "World Cup Pass",
            "El acceso premium ya está disponible en Planes y se activa automáticamente cuando Wompi confirma el pago aprobado por webhook.",
          ],
        ].map(([title, description]) => (
          <div key={title} className="panel rounded-lg p-5">
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
          </div>
        ))}
      </section>

      <section className="panel rounded-lg p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Interpretación responsable
        </p>
        <h2 className="mt-3 text-2xl font-semibold">Probabilidades, no certezas</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <p className="text-sm text-[var(--muted)]">
            Alta incertidumbre: probabilidades cercanas. Una ventaja ligera del modelo no debe
            leerse como una promesa de resultado.
          </p>
          <p className="text-sm text-[var(--muted)]">
            Mostramos una lectura pública del modelo con límites claros. La cobertura se ampliará
            de forma gradual durante el torneo.
          </p>
        </div>
      </section>
    </div>
  );
}
