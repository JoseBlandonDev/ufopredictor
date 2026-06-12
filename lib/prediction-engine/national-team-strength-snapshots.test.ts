import { describe, expect, it } from "vitest";

import {
  getNationalTeamSnapshotCoverage,
  NATIONAL_TEAM_STRENGTH_SNAPSHOTS,
  resolveNationalTeamSnapshotSignals,
  resolveNationalTeamStrengthSnapshot,
} from "./national-team-strength-snapshots";

describe("national team strength snapshots", () => {
  it("resolves source-dated snapshots for the immediate public world cup teams", () => {
    const mexico = resolveNationalTeamStrengthSnapshot({ name: "Mexico" });
    const southAfrica = resolveNationalTeamStrengthSnapshot({ name: "South Africa" });
    const southKorea = resolveNationalTeamStrengthSnapshot({ name: "South Korea" });
    const czechRepublic = resolveNationalTeamStrengthSnapshot({ name: "Czech Republic" });
    const canada = resolveNationalTeamStrengthSnapshot({ name: "Canada" });
    const bosnia = resolveNationalTeamStrengthSnapshot({ name: "Bosnia & Herzegovina" });
    const usa = resolveNationalTeamStrengthSnapshot({ name: "USA" });
    const paraguay = resolveNationalTeamStrengthSnapshot({ name: "Paraguay" });

    expect(
      [mexico, southAfrica, southKorea, czechRepublic, canada, bosnia, usa, paraguay].every(
        (snapshot) => snapshot?.snapshotDate === "2026-06-12",
      ),
    ).toBe(true);
    expect(
      [mexico, southAfrica, southKorea, czechRepublic, canada, bosnia, usa, paraguay].every(
        (snapshot) => snapshot?.sourceLabel.includes("snapshot"),
      ),
    ).toBe(true);
  });

  it("extends coverage to the broader world cup teams already present in project context", () => {
    const coverage = getNationalTeamSnapshotCoverage();

    expect(coverage).toEqual(
      expect.arrayContaining([
        "Mexico",
        "South Africa",
        "South Korea",
        "Czech Republic",
        "Canada",
        "Bosnia & Herzegovina",
        "USA",
        "Paraguay",
        "Colombia",
        "Portugal",
        "Japan",
        "Germany",
        "Morocco",
        "Argentina",
      ]),
    );
  });

  it("keeps alias resolution on a single source of truth", () => {
    const southKorea = resolveNationalTeamStrengthSnapshot({ name: "South Korea" });
    const koreaRepublic = resolveNationalTeamStrengthSnapshot({ name: "Korea Republic" });
    const czechRepublic = resolveNationalTeamStrengthSnapshot({ name: "Czech Republic" });
    const czechia = resolveNationalTeamStrengthSnapshot({ name: "Czechia" });
    const bosniaAmpersand = resolveNationalTeamStrengthSnapshot({ name: "Bosnia & Herzegovina" });
    const bosniaAnd = resolveNationalTeamStrengthSnapshot({ name: "Bosnia and Herzegovina" });
    const usa = resolveNationalTeamStrengthSnapshot({ name: "USA" });
    const unitedStates = resolveNationalTeamStrengthSnapshot({ name: "United States" });

    expect(southKorea?.teamKey).toBe("south-korea");
    expect(koreaRepublic?.teamKey).toBe("south-korea");
    expect(czechRepublic?.teamKey).toBe("czech-republic");
    expect(czechia?.teamKey).toBe("czech-republic");
    expect(bosniaAmpersand?.teamKey).toBe("bosnia-herzegovina");
    expect(bosniaAnd?.teamKey).toBe("bosnia-herzegovina");
    expect(usa?.teamKey).toBe("usa");
    expect(unitedStates?.teamKey).toBe("usa");
    expect(southKorea?.signals).toEqual(koreaRepublic?.signals);
    expect(czechRepublic?.signals).toEqual(czechia?.signals);
    expect(bosniaAmpersand?.signals).toEqual(bosniaAnd?.signals);
    expect(usa?.signals).toEqual(unitedStates?.signals);
  });

  it("avoids duplicate alias collisions across the catalog", () => {
    const aliases = NATIONAL_TEAM_STRENGTH_SNAPSHOTS.flatMap((snapshot) => snapshot.aliases);
    const normalizedAliases = aliases.map((alias) =>
      alias
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );

    expect(new Set(normalizedAliases).size).toBe(normalizedAliases.length);
  });

  it("returns only the six engine fields and keeps neutral non-odds placeholders", () => {
    const signals = resolveNationalTeamSnapshotSignals({ name: "Mexico" });

    expect(signals).toEqual({
      ratingScore: 76,
      recentFormScore: 69,
      attackScore: 68,
      defenseScore: 66,
      marketScore: 50,
      lineupContextScore: 50,
    });
  });

  it("returns undefined for unknown teams", () => {
    expect(resolveNationalTeamStrengthSnapshot({ name: "Atletico Nacional" })).toBeUndefined();
    expect(resolveNationalTeamSnapshotSignals({ name: "Atletico Nacional" })).toBeUndefined();
  });

  it("provides provenance fields for every snapshot and keeps neutral market/lineup placeholders", () => {
    expect(
      NATIONAL_TEAM_STRENGTH_SNAPSHOTS.every((snapshot) => {
        return (
          snapshot.snapshotDate.length > 0 &&
          snapshot.sourceLabel.length > 0 &&
          snapshot.sourceNotes.length > 0 &&
          snapshot.signals.marketScore === 50 &&
          snapshot.signals.lineupContextScore === 50
        );
      }),
    ).toBe(true);
  });
});
