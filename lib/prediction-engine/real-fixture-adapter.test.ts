import { describe, expect, it } from "vitest";

import { generatePrediction } from "./generate-prediction";
import { resolveNationalTeamStrengthSnapshot } from "./national-team-strength-snapshots";
import { buildRealFixturePredictionInput } from "./real-fixture-adapter";

const clubFixtureView = {
  id: "match-1",
  externalId: "api-football:fixture:1546413",
  slug: "colombia-final",
  competitionId: "competition-1",
  kickoffAt: "2026-06-08T22:00:00Z",
  stage: "Final",
  status: "scheduled",
  accessScope: "admin_only",
  intakeSource: "api_football",
  sourceNote: "tracked by ingest",
  competitionName: "Primera A",
  homeTeamId: "team-1",
  homeTeamName: "Atletico Nacional",
  awayTeamId: "team-2",
  awayTeamName: "Junior",
  result: null,
} as const;

const argentinaVsIcelandFixtureView = {
  id: "match-arg-isl",
  externalId: "api-football:fixture:1540357",
  slug: "argentina-iceland",
  competitionId: "competition-1",
  kickoffAt: "2026-06-09T02:00:00Z",
  stage: "Friendly",
  status: "scheduled",
  accessScope: "admin_only",
  intakeSource: "api_football",
  sourceNote: "tracked by ingest",
  competitionName: "Friendlies",
  homeTeamId: "team-arg",
  homeTeamName: "Argentina",
  awayTeamId: "team-isl",
  awayTeamName: "Iceland",
  result: null,
} as const;

const congoVsChileFixtureView = {
  id: "match-cod-chi",
  externalId: "api-football:fixture:1544367",
  slug: "congo-dr-chile",
  competitionId: "competition-1",
  kickoffAt: "2026-06-09T02:00:00Z",
  stage: "Friendly",
  status: "scheduled",
  accessScope: "admin_only",
  intakeSource: "api_football",
  sourceNote: "tracked by ingest",
  competitionName: "Friendlies",
  homeTeamId: "team-cod",
  homeTeamName: "Congo DR",
  awayTeamId: "team-chi",
  awayTeamName: "Chile",
  result: null,
} as const;

const southKoreaVsCzechRepublicFixtureView = {
  id: "match-kor-cze",
  externalId: "api-football:fixture:1538999",
  slug: "world-cup-2026-south-korea-vs-czech-republic-2026-06-12",
  competitionId: "competition-world-cup",
  kickoffAt: "2026-06-12T02:00:00Z",
  stage: "Group Stage - Round 1",
  status: "scheduled",
  accessScope: "admin_only",
  intakeSource: "api_football",
  sourceNote: "tracked by ingest",
  competitionName: "World Cup",
  homeTeamId: "team-kor",
  homeTeamName: "South Korea",
  awayTeamId: "team-cze",
  awayTeamName: "Czech Republic",
  result: null,
} as const;

const mexicoVsSouthAfricaFixtureView = {
  id: "match-mex-rsa",
  externalId: "api-football:fixture:1489369",
  slug: "world-cup-2026-mexico-vs-south-africa-2026-06-11",
  competitionId: "competition-world-cup",
  kickoffAt: "2026-06-11T19:00:00Z",
  stage: "Group Stage - Round 1",
  status: "scheduled",
  accessScope: "admin_only",
  intakeSource: "api_football",
  sourceNote: "tracked by ingest",
  competitionName: "World Cup",
  homeTeamId: "team-mex",
  homeTeamName: "Mexico",
  awayTeamId: "team-rsa",
  awayTeamName: "South Africa",
  result: null,
} as const;

describe("real fixture prediction adapter", () => {
  it("keeps unknown teams safe/default when no fallback is available", () => {
    const input = buildRealFixturePredictionInput(clubFixtureView);

    expect(input).toEqual({
      matchId: "match-1",
      homeTeam: {
        id: "team-1",
        name: "Atletico Nacional",
        signals: undefined,
      },
      awayTeam: {
        id: "team-2",
        name: "Junior",
        signals: undefined,
      },
      context: {
        neutralVenue: false,
      },
      runScope: "internal_lab",
      predictionType: "pre_match_24h",
    });
  });

  it("injects source-dated national-team snapshot signals with neutral market and lineup placeholders", () => {
    const input = buildRealFixturePredictionInput(argentinaVsIcelandFixtureView);
    const snapshot = resolveNationalTeamStrengthSnapshot({ name: "Argentina" });

    expect(snapshot?.displayName).toBe("Argentina");
    expect(snapshot?.snapshotDate).toBe("2026-06-13");
    expect(input.homeTeam.signals).toEqual({
      ratingScore: 94.29,
      recentFormScore: 100,
      attackScore: 65.36,
      defenseScore: 72.62,
      marketScore: 50,
      lineupContextScore: 50,
    });
    expect(input.awayTeam.signals).toEqual({
      ratingScore: 52,
      recentFormScore: 49,
      attackScore: 50,
      defenseScore: 53,
      marketScore: 50,
      lineupContextScore: 50,
    });
  });

  it("can generate an in-memory preview without provider predictions or odds", () => {
    const output = generatePrediction(buildRealFixturePredictionInput(clubFixtureView));

    expect(output.matchId).toBe("match-1");
    expect(output.predictionVersionProjection.runScope).toBe("internal_lab");
    expect(output.notes.some((note) => note.includes("Market score is neutral"))).toBe(true);
    expect(output.probabilities.oneXTwo.homeWin + output.probabilities.oneXTwo.draw + output.probabilities.oneXTwo.awayWin)
      .toBeCloseTo(100, 2);
  });

  it("raises data completeness above zero when fallback signals are injected", () => {
    const output = generatePrediction(buildRealFixturePredictionInput(argentinaVsIcelandFixtureView));

    expect(output.normalizedInput.dataCompleteness).toBeGreaterThan(0);
    expect(output.normalizedInput.homeTeam.providedSignals).toEqual([
      "ratingScore",
      "recentFormScore",
      "attackScore",
      "defenseScore",
      "marketScore",
      "lineupContextScore",
    ]);
    expect(output.normalizedInput.awayTeam.providedSignals).toEqual([
      "ratingScore",
      "recentFormScore",
      "attackScore",
      "defenseScore",
      "marketScore",
      "lineupContextScore",
    ]);
    expect(output.normalizedInput.homeTeam.signals.marketScore).toBe(50);
    expect(output.normalizedInput.homeTeam.signals.lineupContextScore).toBe(50);
  });

  it("resolves immediate world cup team aliases to the same fallback signals", () => {
    const southKorea = buildRealFixturePredictionInput({
      ...southKoreaVsCzechRepublicFixtureView,
      homeTeamName: "South Korea",
    });
    const koreaRepublic = buildRealFixturePredictionInput({
      ...southKoreaVsCzechRepublicFixtureView,
      homeTeamName: "Korea Republic",
    });
    const czechRepublic = buildRealFixturePredictionInput({
      ...southKoreaVsCzechRepublicFixtureView,
      awayTeamName: "Czech Republic",
    });
    const czechia = buildRealFixturePredictionInput({
      ...southKoreaVsCzechRepublicFixtureView,
      awayTeamName: "Czechia",
    });
    const bosniaAmpersand = buildRealFixturePredictionInput({
      ...southKoreaVsCzechRepublicFixtureView,
      awayTeamName: "Bosnia & Herzegovina",
    });
    const bosniaAnd = buildRealFixturePredictionInput({
      ...southKoreaVsCzechRepublicFixtureView,
      awayTeamName: "Bosnia and Herzegovina",
    });
    const usa = buildRealFixturePredictionInput({
      ...southKoreaVsCzechRepublicFixtureView,
      homeTeamName: "USA",
    });
    const unitedStates = buildRealFixturePredictionInput({
      ...southKoreaVsCzechRepublicFixtureView,
      homeTeamName: "United States",
    });

    expect(southKorea.homeTeam.signals).toEqual(koreaRepublic.homeTeam.signals);
    expect(czechRepublic.awayTeam.signals).toEqual(czechia.awayTeam.signals);
    expect(bosniaAmpersand.awayTeam.signals).toEqual(bosniaAnd.awayTeam.signals);
    expect(usa.homeTeam.signals).toEqual(unitedStates.homeTeam.signals);
  });

  it("injects fallback signals for immediate world cup teams so completeness is no longer zero", () => {
    const output = generatePrediction(buildRealFixturePredictionInput(southKoreaVsCzechRepublicFixtureView));

    expect(output.normalizedInput.dataCompleteness).toBeGreaterThan(0);
    expect(output.normalizedInput.homeTeam.providedSignals.length).toBeGreaterThan(0);
    expect(output.normalizedInput.awayTeam.providedSignals.length).toBeGreaterThan(0);
    expect(output.normalizedInput.homeTeam.defaultedSignals).toEqual([]);
    expect(output.normalizedInput.awayTeam.defaultedSignals).toEqual([]);
  });

  it("resolves the immediate public world cup teams through the snapshot catalog", () => {
    const mexico = resolveNationalTeamStrengthSnapshot({ name: "Mexico" });
    const southAfrica = resolveNationalTeamStrengthSnapshot({ name: "South Africa" });
    const southKorea = resolveNationalTeamStrengthSnapshot({ name: "South Korea" });
    const czechRepublic = resolveNationalTeamStrengthSnapshot({ name: "Czech Republic" });
    const canada = resolveNationalTeamStrengthSnapshot({ name: "Canada" });
    const bosnia = resolveNationalTeamStrengthSnapshot({ name: "Bosnia & Herzegovina" });
    const usa = resolveNationalTeamStrengthSnapshot({ name: "USA" });
    const paraguay = resolveNationalTeamStrengthSnapshot({ name: "Paraguay" });

    expect(mexico?.sourceNotes).toContain("normalized local E10C signal pack");
    expect(southAfrica?.sourceNotes).toContain("normalized local E10C signal pack");
    expect(southKorea?.sourceNotes).toContain("normalized local E10C signal pack");
    expect(czechRepublic?.sourceNotes).toContain("normalized local E10C signal pack");
    expect(canada?.sourceNotes).toContain("normalized local E10C signal pack");
    expect(bosnia?.sourceNotes).toContain("normalized local E10C signal pack");
    expect(usa?.sourceNotes).toContain("normalized local E10C signal pack");
    expect(paraguay?.sourceNotes).toContain("normalized local E10C signal pack");
  });

  it("differentiates Argentina vs Iceland from Congo DR vs Chile", () => {
    const argentinaVsIceland = generatePrediction(buildRealFixturePredictionInput(argentinaVsIcelandFixtureView));
    const congoVsChile = generatePrediction(buildRealFixturePredictionInput(congoVsChileFixtureView));

    expect(argentinaVsIceland.teamPower.home.score).not.toBe(congoVsChile.teamPower.home.score);
    expect(argentinaVsIceland.teamPower.away.score).not.toBe(congoVsChile.teamPower.away.score);
    expect(argentinaVsIceland.probabilities.oneXTwo.homeWin).not.toBe(congoVsChile.probabilities.oneXTwo.homeWin);
    expect(argentinaVsIceland.expectedGoals.home).toBeGreaterThan(argentinaVsIceland.expectedGoals.away);
    expect(congoVsChile.probabilities.oneXTwo.awayWin).toBeGreaterThan(congoVsChile.probabilities.oneXTwo.homeWin);
  });

  it("no longer produces identical previews for Mexico vs South Africa and South Korea vs Czech Republic", () => {
    const mexicoVsSouthAfrica = generatePrediction(buildRealFixturePredictionInput(mexicoVsSouthAfricaFixtureView));
    const southKoreaVsCzechRepublic = generatePrediction(
      buildRealFixturePredictionInput(southKoreaVsCzechRepublicFixtureView),
    );

    expect(mexicoVsSouthAfrica.normalizedInput.dataCompleteness).toBeGreaterThan(0);
    expect(southKoreaVsCzechRepublic.normalizedInput.dataCompleteness).toBeGreaterThan(0);
    expect(mexicoVsSouthAfrica.probabilities.oneXTwo).not.toEqual(
      southKoreaVsCzechRepublic.probabilities.oneXTwo,
    );
    expect(mexicoVsSouthAfrica.expectedGoals).not.toEqual(southKoreaVsCzechRepublic.expectedGoals);
    expect(mexicoVsSouthAfrica.teamPower.home.score).not.toBe(southKoreaVsCzechRepublic.teamPower.home.score);
    expect(mexicoVsSouthAfrica.teamPower.away.score).not.toBe(southKoreaVsCzechRepublic.teamPower.away.score);
  });
});
