import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center text-center">
      <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Señal perdida</p>
      <h1 className="mt-4 text-4xl font-semibold">Partido no encontrado</h1>
      <p className="mt-3 text-[var(--muted)]">
        La predicción solicitada no está en la cartelera simulada del Mundial 2026.
      </p>
      <Link
        href="/predictions"
        className="mt-8 rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)]"
      >
        Volver a predicciones
      </Link>
    </section>
  );
}
