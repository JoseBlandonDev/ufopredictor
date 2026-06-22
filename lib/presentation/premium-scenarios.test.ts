import { describe, expect, it } from "vitest";

import { buildRepresentativeScenario } from "./premium-scenarios";

describe("premium scenarios", () => {
  it("builds representative scenarios using only current v1 fields", () => {
    const scenario = buildRepresentativeScenario({
      score: "2-1",
      probability: 18.4,
      homeTeamName: "Germany",
      awayTeamName: "Saudi Arabia",
      homeWinProb: 54.2,
      drawProb: 23.1,
      awayWinProb: 22.7,
      expectedGoals: { home: 1.76, away: 0.98 },
      btts: { yesProbability: 58.4, noProbability: 41.6 },
      totalGoals25: { overProbability: 55.1, underProbability: 44.9 },
    });

    expect(scenario.title).toBe("Victoria local ajustada");
    expect(scenario.supportSignals).toContain("Victoria local 1X2: 54.2%");
    expect(scenario.supportSignals).toContain("xG estimado: 1.76 - 0.98");
    expect(scenario.supportSignals).toContain("Ambos equipos marcan: 58.4%");
    expect(scenario.disclaimer).toContain("No son resultados garantizados");
    expect(scenario.explanation).not.toMatch(/Elo|FIFA|lesiones|alineaciones/i);
  });
});
