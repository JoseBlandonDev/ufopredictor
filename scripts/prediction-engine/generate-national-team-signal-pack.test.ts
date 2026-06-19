import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generatePack, isGeneratedPackUpToDate, mapSourceTeams, scale } = require("./generate-national-team-signal-pack.js");

type RuntimeSafeInputs = {
  eloRating: number;
  historicalGoalsForPerMatch: number;
  historicalGoalsAgainstPerMatch: number;
};

type SourceTeam = {
  teamKey: string;
  runtimeSafeInputs: RuntimeSafeInputs;
};

function loadPackFromContent(content: string) {
  const executable = content
    .replace(/^import .*?;\n/, "")
    .replace(/export const /g, "const ")
    .replace(/ as const/g, "")
    .replace(/ satisfies Record<string, CanonicalSnapshotSeed>;/g, ";");
  const context: Record<string, unknown> = {};
  vm.createContext(context);
  vm.runInContext(`${executable}\nthis.pack = REAL_SIGNAL_PACK_CANONICAL_SNAPSHOT_SEEDS;`, context);
  return context.pack as Record<
    string,
    {
      eloRating: number;
      historicalGoalsForPerMatch: number;
      historicalGoalsAgainstPerMatch: number;
      signals: {
        ratingScore: number;
        recentFormScore: number;
        attackScore: number;
        defenseScore: number;
      };
    }
  >;
}

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), "utf8"));
}

describe("generate-national-team-signal-pack", () => {
  it("renders deterministic output from the tracked source snapshot", () => {
    expect(generatePack()).toBe(generatePack());
  });

  it("treats CRLF and LF versions of the same generated pack as up to date", () => {
    const generated = generatePack();
    const crlfGenerated = generated.replace(/\n/g, "\r\n");

    expect(isGeneratedPackUpToDate(generated, crlfGenerated)).toBe(true);
    expect(isGeneratedPackUpToDate(crlfGenerated, generated)).toBe(true);
  });

  it("reconstructs the proven SIGNAL04 formulas from tracked inputs", () => {
    const source = readJson("data/prediction-engine/national-team-signals/2026-06-19/source.json");
    const pack = loadPackFromContent(generatePack());
    const teams = source.teams as SourceTeam[];
    const eloBounds = {
      min: Math.min(...teams.map((team) => team.runtimeSafeInputs.eloRating)),
      max: Math.max(...teams.map((team) => team.runtimeSafeInputs.eloRating)),
    };
    const historicalGoalsForBounds = {
      min: Math.min(...teams.map((team) => team.runtimeSafeInputs.historicalGoalsForPerMatch)),
      max: Math.max(...teams.map((team) => team.runtimeSafeInputs.historicalGoalsForPerMatch)),
    };
    const historicalGoalsAgainstBounds = {
      min: Math.min(...teams.map((team) => team.runtimeSafeInputs.historicalGoalsAgainstPerMatch)),
      max: Math.max(...teams.map((team) => team.runtimeSafeInputs.historicalGoalsAgainstPerMatch)),
    };

    const mexico = pack.mexico;
    const argentina = pack.argentina;
    const qatar = pack.qatar;

    expect(mexico.signals.ratingScore).toBe(scale(mexico.eloRating, eloBounds.min, eloBounds.max));
    expect(mexico.signals.attackScore).toBe(
      scale(mexico.historicalGoalsForPerMatch, historicalGoalsForBounds.min, historicalGoalsForBounds.max),
    );
    expect(mexico.signals.defenseScore).toBe(
      scale(
        mexico.historicalGoalsAgainstPerMatch,
        historicalGoalsAgainstBounds.min,
        historicalGoalsAgainstBounds.max,
        { invert: true },
      ),
    );
    expect(mexico.signals.recentFormScore).toBe(100);
    expect(argentina.signals.ratingScore).toBe(99.86);
    expect(qatar.signals.recentFormScore).toBeCloseTo(16.67, 2);
  });

  it("maps the normalized source snapshot to the existing runtime canonical keys", () => {
    const source = readJson("data/prediction-engine/national-team-signals/2026-06-19/source.json");
    const mapped = mapSourceTeams(
      [
        {
          teamKey: "czech-republic",
          slug: "czech-republic",
          displayName: "Czech Republic",
          fifaOfficialName: "Czechia",
          country: "Czech Republic",
          aliases: ["CZE", "Czech Republic", "Czechia"],
        },
        {
          teamKey: "bosnia-herzegovina",
          slug: "bosnia-herzegovina",
          displayName: "Bosnia & Herzegovina",
          fifaOfficialName: "Bosnia & Herzegovina",
          country: "Bosnia & Herzegovina",
          aliases: ["BIH", "Bosnia & Herzegovina", "Bosnia and Herzegovina"],
        },
        {
          teamKey: "usa",
          slug: "usa",
          displayName: "USA",
          fifaOfficialName: "USA",
          country: "USA",
          aliases: ["USA", "United States", "United States of America"],
        },
        {
          teamKey: "turkiye",
          slug: "turkiye",
          displayName: "Türkiye",
          fifaOfficialName: "Türkiye",
          country: "Türkiye",
          aliases: ["TUR", "Turkey", "Turkiye", "Türkiye"],
        },
        {
          teamKey: "cote-divoire",
          slug: "cote-divoire",
          displayName: "Côte d’Ivoire",
          fifaOfficialName: "Côte d’Ivoire",
          country: "Côte d’Ivoire",
          aliases: ["CIV", "Cote d Ivoire", "Cote d’Ivoire", "Côte d’Ivoire", "Ivory Coast"],
        },
        {
          teamKey: "cabo-verde",
          slug: "cabo-verde",
          displayName: "Cabo Verde",
          fifaOfficialName: "Cabo Verde",
          country: "Cabo Verde",
          aliases: ["CPV", "Cabo Verde", "Cape Verde", "Cape Verde Islands"],
        },
        {
          teamKey: "congo-dr",
          slug: "congo-dr",
          displayName: "Congo DR",
          fifaOfficialName: "Congo DR",
          country: "Congo DR",
          aliases: ["COD", "Congo DR", "DR Congo", "Democratic Republic of the Congo"],
        },
      ],
      (source.teams as SourceTeam[]).filter((team) =>
        [
          "czechia",
          "bosnia-and-herzegovina",
          "united-states",
          "turkey",
          "ivory-coast",
          "cape-verde",
          "dr-congo",
        ].includes(team.teamKey),
      ),
    );

    expect(mapped.get("czech-republic")?.teamKey).toBe("czechia");
    expect(mapped.get("bosnia-herzegovina")?.teamKey).toBe("bosnia-and-herzegovina");
    expect(mapped.get("usa")?.teamKey).toBe("united-states");
    expect(mapped.get("turkiye")?.teamKey).toBe("turkey");
    expect(mapped.get("cote-divoire")?.teamKey).toBe("ivory-coast");
    expect(mapped.get("cabo-verde")?.teamKey).toBe("cape-verde");
    expect(mapped.get("congo-dr")?.teamKey).toBe("dr-congo");
  });
});
