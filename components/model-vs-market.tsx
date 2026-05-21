import type { MarketProbability } from "@/types/prediction";

export function ModelVsMarket({ markets }: { markets: MarketProbability[] }) {
  const labelBySignal: Record<MarketProbability["label"], string> = {
    "no edge": "sin señal",
    "slight edge": "señal leve",
    "notable edge": "señal notable",
    "strong edge": "señal fuerte",
  };

  return (
    <section className="panel rounded-lg p-5">
      <h2 className="text-lg font-semibold">Modelo vs Mercado</h2>
      <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--line)]">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Selección</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Mercado</th>
              <th className="px-4 py-3">Señal</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((market) => (
              <tr key={market.selection} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium">{market.selection}</td>
                <td className="px-4 py-3 font-mono">{market.modelProbability}%</td>
                <td className="px-4 py-3 font-mono">{market.marketProbability}%</td>
                <td className="px-4 py-3 text-[var(--accent)]">{labelBySignal[market.label]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
