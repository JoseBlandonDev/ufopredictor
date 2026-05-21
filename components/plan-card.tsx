import { Check, Minus } from "lucide-react";
import type { Plan } from "@/types/plans";

export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article className={`panel rounded-lg p-5 transition hover:border-[var(--accent)]/55 ${plan.highlighted ? "border-[var(--accent)]/70 shadow-[0_0_34px_rgba(0,215,255,0.12)]" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            {plan.isActive ? "Plan simulado activo" : "Preparado"}
          </p>
          <h3 className="mt-2 text-xl font-semibold">{plan.name}</h3>
        </div>
        {plan.highlighted ? <span className="rounded-md bg-[var(--accent)] px-2 py-1 text-xs font-semibold text-[var(--accent-contrast)]">Principal</span> : null}
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">{plan.description}</p>
      <p className="mt-5 font-mono text-3xl">
        ${plan.price}
        <span className="text-sm text-[var(--muted)]"> {plan.currency}</span>
      </p>
      <ul className="mt-5 space-y-3 text-sm">
        {plan.features.map((feature) => (
          <li key={feature.key} className="flex items-center gap-2">
            {feature.included ? <Check className="h-4 w-4 text-[var(--accent)]" /> : <Minus className="h-4 w-4 text-[var(--muted)]" />}
            <span className={feature.included ? "text-white" : "text-[var(--muted)]"}>{feature.label}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
