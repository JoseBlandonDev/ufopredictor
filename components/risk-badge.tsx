import type { RiskLevel } from "@/types/prediction";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const labelByLevel = {
    low: "riesgo bajo",
    medium: "riesgo medio",
    high: "riesgo alto",
  };

  const tone =
    level === "low"
      ? "text-[var(--accent)] border-[var(--accent)]/35 bg-[var(--accent)]/10"
      : level === "medium"
        ? "text-[var(--warning)] border-[var(--warning)]/35 bg-[var(--warning)]/10"
        : "text-[var(--danger)] border-[var(--danger)]/35 bg-[var(--danger)]/10";

  return <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${tone}`}>{labelByLevel[level]}</span>;
}
