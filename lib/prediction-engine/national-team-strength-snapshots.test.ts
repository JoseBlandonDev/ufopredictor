import { describe, expect, it } from "vitest";

import { WORLD_CUP_2026_TEAMS } from "../world-cup-2026";
import {
  CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS,
  getNationalTeamSnapshotCoverage,
  LEGACY_TEST_ONLY_SNAPSHOTS,
  LEGACY_TEST_ONLY_TEAM_KEYS,
  NATIONAL_TEAM_STRENGTH_SNAPSHOTS,
  resolveNationalTeamSnapshotSignals,
  resolveNationalTeamStrengthSnapshot,
} from "./national-team-strength-snapshots";

function normalizeAlias(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

describe("national team strength snapshots", () => {
  it("covers every canonical world cup 2026 team with a source-dated snapshot", () => {
    expect(WORLD_CUP_2026_TEAMS).toHaveLength(48);
    expect(CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS).toHaveLength(48);

    const snapshotTeamKeys = new Set(CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS.map((snapshot) => snapshot.teamKey));

    expect(WORLD_CUP_2026_TEAMS.every((team) => snapshotTeamKeys.has(team.teamKey))).toBe(true);
    expect(
      CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS.every(
        (snapshot) =>
          snapshot.snapshotDate === "2026-06-18" &&
          snapshot.sourceLabel === "SIGNAL04 static FIFA + Elo + recent aggregate signal pack" &&
          snapshot.sourceNotes.includes("validated aggregate recent-form inputs") &&
          snapshot.sourceNotes.includes("raw recent-match arrays"),
      ),
    ).toBe(true);
  });

  it("carries real FIFA, Elo, and recent-form metadata for every canonical team", () => {
    expect(
      CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS.every(
        (snapshot) =>
          typeof snapshot.fifaRank === "number" &&
          typeof snapshot.fifaPoints === "number" &&
          typeof snapshot.eloRank === "number" &&
          typeof snapshot.eloRating === "number" &&
          typeof snapshot.recentMatchCount === "number" &&
          snapshot.recentMatchCount > 0,
      ),
    ).toBe(true);
  });

  it("resolves every canonical world cup team by display name", () => {
    expect(
      WORLD_CUP_2026_TEAMS.every((team) => {
        const snapshot = resolveNationalTeamStrengthSnapshot({ name: team.displayName });
        return snapshot?.teamKey === team.teamKey;
      }),
    ).toBe(true);
  });

  it("keeps the immediate public world cup teams covered", () => {
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
      ]),
    );
  });

  it("keeps important aliases on a single source of truth", () => {
    expect(resolveNationalTeamStrengthSnapshot({ name: "Korea Republic" })?.teamKey).toBe("south-korea");
    expect(resolveNationalTeamStrengthSnapshot({ name: "South Korea" })?.teamKey).toBe("south-korea");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Czechia" })?.teamKey).toBe("czech-republic");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Czech Republic" })?.teamKey).toBe("czech-republic");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Bosnia and Herzegovina" })?.teamKey).toBe(
      "bosnia-herzegovina",
    );
    expect(resolveNationalTeamStrengthSnapshot({ name: "Bosnia & Herzegovina" })?.teamKey).toBe(
      "bosnia-herzegovina",
    );
    expect(resolveNationalTeamStrengthSnapshot({ name: "United States" })?.teamKey).toBe("usa");
    expect(resolveNationalTeamStrengthSnapshot({ name: "USA" })?.teamKey).toBe("usa");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Turkey" })?.teamKey).toBe("turkiye");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Türkiye" })?.teamKey).toBe("turkiye");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Curacao" })?.teamKey).toBe("curacao");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Curaçao" })?.teamKey).toBe("curacao");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Ivory Coast" })?.teamKey).toBe("cote-divoire");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Côte d’Ivoire" })?.teamKey).toBe("cote-divoire");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Cape Verde" })?.teamKey).toBe("cabo-verde");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Cabo Verde" })?.teamKey).toBe("cabo-verde");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Iran" })?.teamKey).toBe("iran");
    expect(resolveNationalTeamStrengthSnapshot({ name: "IR Iran" })?.teamKey).toBe("iran");
    expect(resolveNationalTeamStrengthSnapshot({ name: "DR Congo" })?.teamKey).toBe("congo-dr");
    expect(resolveNationalTeamStrengthSnapshot({ name: "Congo DR" })?.teamKey).toBe("congo-dr");
  });

  it("separates legacy test-only coverage from canonical world cup coverage", () => {
    expect(LEGACY_TEST_ONLY_TEAM_KEYS).toEqual(["iceland", "chile", "hungary", "kazakhstan", "venezuela"]);
    expect(LEGACY_TEST_ONLY_SNAPSHOTS.map((snapshot) => snapshot.teamKey)).toEqual([
      "iceland",
      "chile",
      "hungary",
      "kazakhstan",
      "venezuela",
    ]);

    const canonicalTeamKeys = new Set(WORLD_CUP_2026_TEAMS.map((team) => team.teamKey));
    const unexpectedTeamKeys = NATIONAL_TEAM_STRENGTH_SNAPSHOTS.map((snapshot) => snapshot.teamKey).filter(
      (teamKey) => !canonicalTeamKeys.has(teamKey) && !LEGACY_TEST_ONLY_TEAM_KEYS.includes(teamKey),
    );

    expect(unexpectedTeamKeys).toEqual([]);
  });

  it("avoids duplicate alias collisions across the full catalog", () => {
    const aliases = NATIONAL_TEAM_STRENGTH_SNAPSHOTS.flatMap((snapshot) => snapshot.aliases);
    const normalizedAliases = aliases.map(normalizeAlias);

    expect(new Set(normalizedAliases).size).toBe(normalizedAliases.length);
  });

  it("returns only the six engine fields and keeps neutral non-odds placeholders", () => {
    const signals = resolveNationalTeamSnapshotSignals({ name: "Mexico" });

    expect(signals).toEqual({
      ratingScore: 64.67,
      recentFormScore: 86.67,
      attackScore: 55.35,
      defenseScore: 72.68,
      marketScore: 50,
      lineupContextScore: 50,
    });
  });

  it("keeps neutral market and lineup placeholders for all canonical snapshots", () => {
    expect(
      CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS.every(
        (snapshot) =>
          snapshot.signals.marketScore === 50 &&
          snapshot.signals.lineupContextScore === 50 &&
          snapshot.snapshotDate.length > 0 &&
          snapshot.sourceLabel.length > 0 &&
          snapshot.sourceNotes.length > 0,
      ),
    ).toBe(true);
  });

  it("does not silently fall back to default-like empty canonical signals", () => {
    expect(
      WORLD_CUP_2026_TEAMS.every((team) => {
        const signals = resolveNationalTeamSnapshotSignals({ name: team.displayName });

        return (
          signals !== undefined &&
          signals.ratingScore !== undefined &&
          signals.recentFormScore !== undefined &&
          signals.attackScore !== undefined &&
          signals.defenseScore !== undefined
        );
      }),
    ).toBe(true);
  });

  it("returns undefined for unknown teams", () => {
    expect(resolveNationalTeamStrengthSnapshot({ name: "Atletico Nacional" })).toBeUndefined();
    expect(resolveNationalTeamSnapshotSignals({ name: "Atletico Nacional" })).toBeUndefined();
  });
});
