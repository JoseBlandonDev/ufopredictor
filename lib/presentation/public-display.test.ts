import { describe, expect, it } from "vitest";

import {
  formatVenueLabel,
  getMarketGlossary,
  resolvePremiumMarketLabel,
  resolvePremiumMarketSelection,
  resolveTeamDisplayName,
} from "./public-display";

describe("public display helpers", () => {
  it("resolves known Spanish team names and falls back to raw values", () => {
    expect(resolveTeamDisplayName("Netherlands")).toBe("Países Bajos");
    expect(resolveTeamDisplayName("Germany")).toBe("Alemania");
    expect(resolveTeamDisplayName("Cape Verde Islands")).toBe("Cabo Verde");
    expect(resolveTeamDisplayName("Unknown Select XI")).toBe("Unknown Select XI");
  });

  it("formats venues with stadium priority and safe fallbacks", () => {
    expect(
      formatVenueLabel({ venueName: "Estadio Azteca", venueCity: "Ciudad de México" }),
    ).toBe("Estadio Azteca, Ciudad de México");
    expect(formatVenueLabel({ venueName: "Estadio Akron", venueCity: null })).toBe(
      "Estadio Akron",
    );
    expect(formatVenueLabel({ venueName: null, venueCity: "Monterrey" })).toBe("Monterrey");
    expect(formatVenueLabel({ venueName: null, venueCity: null })).toBe(
      "Estadio pendiente de confirmación",
    );
  });

  it("uses football-first premium labels and glossary definitions", () => {
    const glossary = getMarketGlossary();

    expect(resolvePremiumMarketLabel("btts")).toBe("¿Anotan ambos equipos?");
    expect(resolvePremiumMarketLabel("over_2_5")).toBe("Total de goles del partido");
    expect(resolvePremiumMarketSelection("over")).toBe("3 o más goles");
    expect(resolvePremiumMarketSelection("under")).toBe("2 o menos goles");
    expect(glossary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "btts",
          title: "¿Anotan ambos equipos?",
          description: "Probabilidad de que cada equipo marque al menos un gol.",
        }),
        expect.objectContaining({
          key: "over-2-5",
          title: "Total de goles del partido: 3 o más goles",
          description: "Probabilidad de que el partido termine con 3 o más goles.",
        }),
        expect.objectContaining({
          key: "under-2-5",
          title: "Total de goles del partido: 2 o menos goles",
          description: "Probabilidad de que el partido termine con 2 o menos goles.",
        }),
      ]),
    );
  });
});
