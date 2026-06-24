import { describe, expect, it } from "vitest";

import {
  assertTask1LocalOnlyPreflight,
  buildEvidencePreviews,
  buildTeamSignalSnapshot,
  loadTask1Datasets,
  resolveDefaultPreparedPaths,
  verifyNoLeakage,
} from "./task1";

const paths = resolveDefaultPreparedPaths(process.cwd(), "test-run");

describe("prediction intelligence v2 task1", () => {
  const datasets = loadTask1Datasets(paths);

  it("covers official world cup match numbers 1 through 104 with resolved venues", () => {
    expect(datasets.schedule).toHaveLength(104);
    expect(datasets.venues).toHaveLength(16);
    expect(datasets.schedule[0]?.official_match_number).toBe(1);
    expect(datasets.schedule.at(-1)?.official_match_number).toBe(104);
    expect(new Set(datasets.schedule.map((row) => row.venue_key)).size).toBe(16);
  });

  it("keeps spanish and english team localizations structurally complete for the world cup catalog", () => {
    const localizedWorldCupTeams = datasets.localizations.filter((localization) =>
      datasets.schedule.some(
        (match) =>
          match.home_team_key === localization.canonical_team_key ||
          match.away_team_key === localization.canonical_team_key,
      ),
    );
    expect(localizedWorldCupTeams.every((team) => team.display_name_es.length > 0)).toBe(true);
    expect(localizedWorldCupTeams.every((team) => team.display_name_en.length > 0)).toBe(true);
  });

  it("builds cutoff-safe signals without leaking the target match date", () => {
    expect(verifyNoLeakage("germany", "2026-06-21", datasets.historicalFacts)).toBe(true);
    const signal = buildTeamSignalSnapshot(
      "germany",
      "2026-06-21T00:00:00Z",
      datasets.historicalFacts,
      datasets.localizations,
      datasets.eloCurrent,
      datasets.eloStart2026,
      datasets.fifaRanking,
    );

    expect(signal.signal_version).toBe("prediction-intelligence-v2-task1");
    expect(signal.sample_sizes.last_20).toBeGreaterThan(0);
    expect(signal.structural_strength.current_elo).toBeGreaterThan(0);
    expect(signal.diagnostic_effective_strength.score).toBeGreaterThan(0);
  });

  it("creates pre-match evidence previews for the requested historical fixtures", () => {
    const evidence = buildEvidencePreviews(
      [
        { home: "germany", away: "curacao" },
        { home: "spain", away: "cape_verde" },
        { home: "brazil", away: "morocco" },
        { home: "germany", away: "ivory_coast" },
        { home: "ecuador", away: "curacao" },
      ],
      datasets.historicalFacts,
      datasets.localizations,
      datasets.eloCurrent,
      datasets.eloStart2026,
      datasets.fifaRanking,
      datasets.schedule,
    );

    expect(evidence).toHaveLength(5);
    expect(evidence[0]?.pre_match).toHaveLength(2);
    expect(evidence.some((item) => item.actual_result.scoreline === "pending")).toBe(true);
  });

  it("refuses to overwrite the preserved 2026-06-20 historical artifact path", () => {
    expect(() =>
      assertTask1LocalOnlyPreflight(resolveDefaultPreparedPaths(process.cwd(), "2026-06-20")),
    ).toThrow(/preserved historical evidence path/i);
  });
});
