import { Check, Minus } from "lucide-react";
import type { Plan } from "@/types/plans";

export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article
      className={`ufo-card rounded-lg p-5 ${
        plan.highlighted ? "border-[var(--accent)]/70 shadow-[0_0_34px_rgba(0,215,255,0.12)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            {plan.isActive ? "Catálogo beta" : "Acceso futuro"}
          </p>
          <h3 className="mt-2 text-xl font-semibold">{plan.name}</h3>
        </div>
        {plan.highlighted ? (
          <span className="ufo-pill">Destacado</span>
        ) : (
          <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">
            Próximamente
          </span>
        )}
      </div>

      {plan.billingType !== "free" ? (
        <p className="mt-3 inline-flex rounded-md border border-white/15 px-2 py-1 text-xs text-[var(--muted)]">
          Solo preview — llegará más adelante
        </p>
      ) : null}

      <p className="mt-4 text-sm text-[var(--muted)]">{plan.description}</p>
      <p className="mt-5 font-mono text-3xl">
        ${plan.price}
        <span className="text-sm text-[var(--muted)]"> {plan.currency}</span>
      </p>

      <ul className="mt-5 space-y-3 text-sm">
        {plan.features.map((feature) => (
          <li key={feature.key} className="flex items-center gap-2">
            {feature.included ? (
              <Check className="h-4 w-4 text-[var(--accent)]" />
            ) : (
              <Minus className="h-4 w-4 text-[var(--muted)]" />
            )}
            <span className={feature.included ? "text-white" : "text-[var(--muted)]"}>
              {feature.label}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
