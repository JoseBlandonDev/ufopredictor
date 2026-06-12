import { describe, expect, it } from "vitest";

import { NATIONAL_TEAM_STRENGTH_SNAPSHOTS } from "../prediction-engine/national-team-strength-snapshots";
import {
  WORLD_CUP_2026_CATALOG_METADATA,
  WORLD_CUP_2026_FIXTURES,
  WORLD_CUP_2026_GROUPS,
  WORLD_CUP_2026_TEAMS,
  WORLD_CUP_2026_VENUES,
} from "./index";

function isValidIsoUtcTimestamp(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

describe("world cup 2026 canonical tournament catalog", () => {
  it("preserves the FIFA-derived source metadata and scope", () => {
    expect(WORLD_CUP_2026_CATALOG_METADATA).toEqual({
      sourceAuthority: "fifa_official_schedule_pdf",
      sourceFileName: "FWC26 Match Schedule_v17_10042026_EN.pdf",
      sourceDate: "2026-04-10",
      catalogGeneratedAt: "2026-06-12T19:54:35.241343Z",
      coverageStatus: "group_stage_complete_from_pdf_grid",
      sourceNotes: [
        "Extracted from the uploaded FIFA match schedule PDF grid dated 10 April 2026.",
        "The PDF states all times are Eastern Time (ET) and the schedule is subject to change.",
        "This source file captures the 72 group-stage fixtures, 48 teams, 12 groups, and 16 host venues/host cities from the PDF grid.",
        "Knockout fixtures are intentionally not expanded here because many participants are placeholders such as W73, 1A, 2B, etc.",
        "API-Football IDs are included only where UFO Predictor has already verified/publicly used them.",
      ],
    });
  });

  it("matches the expected group-stage coverage counts", () => {
    expect(WORLD_CUP_2026_TEAMS).toHaveLength(48);
    expect(WORLD_CUP_2026_GROUPS).toHaveLength(12);
    expect(WORLD_CUP_2026_VENUES).toHaveLength(16);
    expect(WORLD_CUP_2026_FIXTURES).toHaveLength(72);
  });

  it("keeps unique team, group, venue, and fixture identifiers", () => {
    expect(new Set(WORLD_CUP_2026_TEAMS.map((team) => team.teamKey)).size).toBe(WORLD_CUP_2026_TEAMS.length);
    expect(new Set(WORLD_CUP_2026_TEAMS.map((team) => team.fifaCode)).size).toBe(WORLD_CUP_2026_TEAMS.length);
    expect(new Set(WORLD_CUP_2026_GROUPS.map((group) => group.groupKey)).size).toBe(WORLD_CUP_2026_GROUPS.length);
    expect(new Set(WORLD_CUP_2026_VENUES.map((venue) => venue.venueKey)).size).toBe(WORLD_CUP_2026_VENUES.length);
    expect(new Set(WORLD_CUP_2026_FIXTURES.map((fixture) => fixture.fixtureKey)).size).toBe(
      WORLD_CUP_2026_FIXTURES.length,
    );
    expect(new Set(WORLD_CUP_2026_FIXTURES.map((fixture) => fixture.matchNumber)).size).toBe(
      WORLD_CUP_2026_FIXTURES.length,
    );
    expect(new Set(WORLD_CUP_2026_FIXTURES.map((fixture) => fixture.matchSlug)).size).toBe(
      WORLD_CUP_2026_FIXTURES.length,
    );
  });

  it("keeps team and venue references internally consistent", () => {
    const teamKeys = new Set(WORLD_CUP_2026_TEAMS.map((team) => team.teamKey));
    const groupKeys = new Set(WORLD_CUP_2026_GROUPS.map((group) => group.groupKey));
    const venueKeys = new Set(WORLD_CUP_2026_VENUES.map((venue) => venue.venueKey));

    expect(WORLD_CUP_2026_TEAMS.every((team) => groupKeys.has(team.groupKey))).toBe(true);
    expect(
      WORLD_CUP_2026_GROUPS.every((group) => group.teamKeys.every((teamKey) => teamKeys.has(teamKey))),
    ).toBe(true);
    expect(
      WORLD_CUP_2026_FIXTURES.every((fixture) => {
        return (
          teamKeys.has(fixture.homeTeamKey) &&
          teamKeys.has(fixture.awayTeamKey) &&
          groupKeys.has(fixture.groupKey) &&
          venueKeys.has(fixture.venueKey)
        );
      }),
    ).toBe(true);
  });

  it("uses valid UTC kickoff timestamps and group-stage stage labels", () => {
    expect(
      WORLD_CUP_2026_FIXTURES.every(
        (fixture) => fixture.stage === "group_stage" && isValidIsoUtcTimestamp(fixture.kickoffAt),
      ),
    ).toBe(true);
  });

  it("keeps optional API-Football fixture ids unique when present", () => {
    const fixtureIds = WORLD_CUP_2026_FIXTURES.flatMap((fixture) =>
      fixture.apiFootballFixtureId === null ? [] : [fixture.apiFootballFixtureId],
    );
    const externalIds = WORLD_CUP_2026_FIXTURES.flatMap((fixture) =>
      fixture.apiFootballExternalId === null ? [] : [fixture.apiFootballExternalId],
    );

    expect(fixtureIds).toEqual([1489369, 1538999, 1539000, 1489370]);
    expect(new Set(fixtureIds).size).toBe(fixtureIds.length);
    expect(new Set(externalIds).size).toBe(externalIds.length);
  });

  it("keeps the snapshot catalog aligned to canonical team keys", () => {
    const canonicalTeamKeys = new Set(WORLD_CUP_2026_TEAMS.map((team) => team.teamKey));
    const missingSnapshotTeamKeys = NATIONAL_TEAM_STRENGTH_SNAPSHOTS.map((snapshot) => snapshot.teamKey).filter(
      (teamKey) => !canonicalTeamKeys.has(teamKey),
    );

    expect(missingSnapshotTeamKeys).toEqual([
      "iceland",
      "chile",
      "hungary",
      "kazakhstan",
      "venezuela",
    ]);
  });
});
