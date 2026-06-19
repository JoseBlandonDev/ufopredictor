import fs from "node:fs";
import path from "node:path";
import { SIGNAL_SOURCE_SNAPSHOT_ID } from "./constants";
import type { PredictionReviewCoherenceFixture } from "./types";

type RawCoherenceSource = {
  fixtures?: Array<{
    matchDate?: string;
    teamAKey?: string;
    teamAEn?: string;
    teamADisplayNameEs?: string;
    teamBKey?: string;
    teamBEn?: string;
    teamBDisplayNameEs?: string;
    eloRankA?: number;
    eloRankB?: number;
    eloRatingA?: number;
    eloRatingB?: number;
    eloWinningExpectancyA?: number;
    eloWinningExpectancyB?: number;
  }>;
};

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const COHERENCE_PATH = path.join(
  process.cwd(),
  "data",
  "prediction-engine",
  "national-team-signals",
  SIGNAL_SOURCE_SNAPSHOT_ID,
  "fixture-elo-coherence.json",
);

let cachedFixtures: PredictionReviewCoherenceFixture[] | null = null;

export function loadPredictionReviewCoherenceFixtures() {
  if (cachedFixtures) {
    return cachedFixtures;
  }

  const raw = JSON.parse(fs.readFileSync(COHERENCE_PATH, "utf8")) as RawCoherenceSource;
  cachedFixtures = (raw.fixtures ?? [])
    .filter((fixture) =>
      typeof fixture.teamAKey === "string" &&
      typeof fixture.teamBKey === "string" &&
      typeof fixture.teamAEn === "string" &&
      typeof fixture.teamBEn === "string" &&
      typeof fixture.teamADisplayNameEs === "string" &&
      typeof fixture.teamBDisplayNameEs === "string" &&
      typeof fixture.matchDate === "string" &&
      typeof fixture.eloRankA === "number" &&
      typeof fixture.eloRankB === "number" &&
      typeof fixture.eloRatingA === "number" &&
      typeof fixture.eloRatingB === "number" &&
      typeof fixture.eloWinningExpectancyA === "number" &&
      typeof fixture.eloWinningExpectancyB === "number",
    )
    .map((fixture) => ({
      matchDate: fixture.matchDate!,
      teamAKey: fixture.teamAKey!,
      teamAEn: fixture.teamAEn!,
      teamADisplayNameEs: fixture.teamADisplayNameEs!,
      teamBKey: fixture.teamBKey!,
      teamBEn: fixture.teamBEn!,
      teamBDisplayNameEs: fixture.teamBDisplayNameEs!,
      eloRankA: fixture.eloRankA!,
      eloRankB: fixture.eloRankB!,
      eloRatingA: fixture.eloRatingA!,
      eloRatingB: fixture.eloRatingB!,
      eloWinningExpectancyA: fixture.eloWinningExpectancyA!,
      eloWinningExpectancyB: fixture.eloWinningExpectancyB!,
    }));

  return cachedFixtures;
}

export function findPredictionReviewCoherenceFixture(args: {
  homeTeamName: string;
  awayTeamName: string;
}) {
  const homeKey = normalizeKey(args.homeTeamName);
  const awayKey = normalizeKey(args.awayTeamName);

  return (
    loadPredictionReviewCoherenceFixtures().find((fixture) => {
      const directMatch =
        normalizeKey(fixture.teamAEn) === homeKey &&
        normalizeKey(fixture.teamBEn) === awayKey;
      const inverseMatch =
        normalizeKey(fixture.teamAEn) === awayKey &&
        normalizeKey(fixture.teamBEn) === homeKey;

      return directMatch || inverseMatch;
    }) ?? null
  );
}
