import { describe, expect, it } from "vitest";
import {
  buildPublicExpertConfidenceNote,
  buildPublicExpertReadSummary,
  buildPublicExpertReadView,
} from "./public-expert-read";

describe("public expert read", () => {
  it("describes a clear home-team advantage as a model reading", () => {
    expect(
      buildPublicExpertReadSummary({
        homeTeamName: "México",
        awayTeamName: "Sudáfrica",
        homeWinProb: 54,
        drawProb: 24,
        awayWinProb: 22,
      }),
    ).toBe("El modelo le da a México la probabilidad más alta en su lectura del partido.");
  });

  it("describes a clear away-team advantage as a model reading", () => {
    expect(
      buildPublicExpertReadSummary({
        homeTeamName: "Canadá",
        awayTeamName: "Brasil",
        homeWinProb: 19,
        drawProb: 23,
        awayWinProb: 58,
      }),
    ).toBe("El modelo le da a Brasil la probabilidad más alta en su lectura del partido.");
  });

  it("describes balanced team probabilities without implying causality", () => {
    expect(
      buildPublicExpertReadSummary({
        homeTeamName: "Alemania",
        awayTeamName: "Países Bajos",
        homeWinProb: 34,
        drawProb: 32,
        awayWinProb: 34,
      }),
    ).toBe("El modelo ve un partido muy equilibrado entre Alemania y Países Bajos.");
  });

  it("treats the draw as the leading outcome when it is highest", () => {
    expect(
      buildPublicExpertReadSummary({
        homeTeamName: "Portugal",
        awayTeamName: "Croacia",
        homeWinProb: 31,
        drawProb: 35,
        awayWinProb: 34,
      }),
    ).toBe(
      "El modelo ve un partido muy equilibrado entre Portugal y Croacia, con el empate apenas por delante.",
    );
  });

  it("keeps the draw important when it stays close to the favored team", () => {
    expect(
      buildPublicExpertReadSummary({
        homeTeamName: "México",
        awayTeamName: "Japón",
        homeWinProb: 41,
        drawProb: 37,
        awayWinProb: 22,
      }),
    ).toBe(
      "El modelo le da una ligera ventaja a México, aunque el empate sigue siendo importante en la lectura del partido.",
    );
  });

  it("handles malformed probabilities safely", () => {
    expect(
      buildPublicExpertReadSummary({
        homeTeamName: "México",
        awayTeamName: "Japón",
        homeWinProb: Number.NaN,
        drawProb: 30,
        awayWinProb: 25,
      }),
    ).toBe("La lectura del modelo no está disponible para este partido en este momento.");
  });

  it("keeps anonymous output free of confidence wording", () => {
    const view = buildPublicExpertReadView({
      base: {
        homeTeamName: "México",
        awayTeamName: "Japón",
        homeWinProb: 41,
        drawProb: 37,
        awayWinProb: 22,
      },
    });

    expect(view.summary).toContain("El modelo");
    expect(view.confidenceNote).toBeNull();
  });

  it("adds the authorized uncertainty note for registered free viewers", () => {
    expect(
      buildPublicExpertConfidenceNote({
        confidenceScore: 52,
        riskLevel: "high",
      }),
    ).toBe("La lectura del modelo sigue abierta y con bastante incertidumbre.");
  });
});
