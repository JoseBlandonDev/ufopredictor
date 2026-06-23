import { describe, expect, it } from "vitest";

import {
  formatVenueLabel,
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
});
