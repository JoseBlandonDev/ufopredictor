import type { PerformanceMetric, PastPrediction } from "@/types/prediction";

export function TransparencyStats({ metrics, history }: { metrics: PerformanceMetric[]; history: PastPrediction[] }) {
  return (
    <div className="space-y-6">
      <div className="metric-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="panel rounded-lg p-5">
            <p className="text-sm text-[var(--muted)]">{metric.label}</p>
            <p className="mt-2 font-mono text-3xl text-[var(--accent)]">{metric.value}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">{metric.detail}</p>
          </div>
        ))}
      </div>
      <div className="panel overflow-x-auto rounded-lg">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Partido</th>
              <th className="px-4 py-3">Mercado</th>
              <th className="px-4 py-3">Predicción</th>
              <th className="px-4 py-3">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={`${item.match}-${item.market}`} className="border-t border-white/10">
                <td className="px-4 py-3">{item.match}</td>
                <td className="px-4 py-3">{item.market}</td>
                <td className="px-4 py-3">{item.prediction}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{item.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
