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
    expect(scenario.supportSignals).toContain(
      "Probabilidad de que anoten ambos equipos: 58.4%",
    );
    expect(scenario.disclaimer).toBe("Son escenarios representativos basados en probabilidades.");
    expect(scenario.explanation).not.toMatch(/Elo|FIFA|lesiones|alineaciones/i);
    expect(scenario.supportSignals).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("Ambos equipos marcan:"),
        expect.stringContaining("Ambos equipos no marcan:"),
        expect.stringContaining("Más de 2,5 goles:"),
        expect.stringContaining("Menos de 2,5 goles:"),
      ]),
    );
  });

  it("uses the approved negative btts and under-goals wording without changing formatting or order", () => {
    const scenario = buildRepresentativeScenario({
      score: "1-0",
      probability: 16.2,
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
    expect(scenario.probabilityLabel).toBe("16.2%");
    expect(scenario.supportSignals).toEqual([
      "Victoria local 1X2: 54.2%",
      "xG estimado: 1.76 - 0.98",
      "Probabilidad de que al menos uno no marque: 41.6%",
    ]);
    expect(scenario.weakeningCondition).toBe(
      "Se debilita si Arabia Saudita sostiene mejor el empate o reduce los espacios del partido.",
    );
  });

  it("uses the approved under-goals wording when the total-goals signal is included", () => {
    const scenario = buildRepresentativeScenario({
      score: "0-0",
      probability: 12.3,
      homeTeamName: "Germany",
      awayTeamName: "Saudi Arabia",
      homeWinProb: 54.2,
      drawProb: 23.1,
      awayWinProb: 22.7,
      expectedGoals: null,
      btts: null,
      totalGoals25: { overProbability: 55.1, underProbability: 44.9 },
    });

    expect(scenario.title).toBe("Partido cerrado");
    expect(scenario.supportSignals).toEqual([
      "Empate 1X2: 23.1%",
      "Probabilidad de 2 o menos goles: 44.9%",
    ]);
    expect(scenario.explanation).toContain("partido muy cerrado");
  });

  it("uses the approved over-goals wording when the total-goals signal is included", () => {
    const scenario = buildRepresentativeScenario({
      score: "2-2",
      probability: 11.4,
      homeTeamName: "Germany",
      awayTeamName: "Saudi Arabia",
      homeWinProb: 54.2,
      drawProb: 23.1,
      awayWinProb: 22.7,
      expectedGoals: null,
      btts: null,
      totalGoals25: { overProbability: 55.1, underProbability: 44.9 },
    });

    expect(scenario.title).toBe("Intercambio equilibrado");
    expect(scenario.supportSignals).toEqual([
      "Empate 1X2: 23.1%",
      "Probabilidad de 3 o más goles: 55.1%",
    ]);
    expect(scenario.disclaimer).toBe("Son escenarios representativos basados en probabilidades.");
  });
});
