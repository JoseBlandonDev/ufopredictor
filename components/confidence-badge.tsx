export function ConfidenceBadge({ score }: { score: number }) {
  const tone = score >= 68 ? "text-[var(--accent)] border-[var(--accent)]/35 bg-[var(--accent)]/10" : score >= 58 ? "text-[var(--warning)] border-[var(--warning)]/35 bg-[var(--warning)]/10" : "text-[var(--danger)] border-[var(--danger)]/35 bg-[var(--danger)]/10";

  return <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${tone}`}>{score}% confianza</span>;
}
