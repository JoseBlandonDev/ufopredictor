import type { MatchPredictionInput } from "./types";

export const balancedLabFixture: MatchPredictionInput = {
  matchId: "lab-balanced-fixture",
  homeTeam: {
    id: "orbital-united",
    name: "Orbital United",
    signals: {
      ratingScore: 60,
      recentFormScore: 58,
      attackScore: 56,
      defenseScore: 57,
      marketScore: 50,
      lineupContextScore: 50,
    },
  },
  awayTeam: {
    id: "meridian-fc",
    name: "Meridian FC",
    signals: {
      ratingScore: 60,
      recentFormScore: 58,
      attackScore: 56,
      defenseScore: 57,
      marketScore: 50,
      lineupContextScore: 50,
    },
  },
  context: {
    neutralVenue: true,
  },
  runScope: "internal_lab",
};

export const strongHomeLabFixture: MatchPredictionInput = {
  matchId: "lab-strong-home-fixture",
  homeTeam: {
    id: "aurora-fc",
    name: "Aurora FC",
    signals: {
      ratingScore: 94,
      recentFormScore: 90,
      attackScore: 93,
      defenseScore: 88,
      marketScore: 82,
      lineupContextScore: 86,
    },
  },
  awayTeam: {
    id: "calibration-xi",
    name: "Calibration XI",
    signals: {
      ratingScore: 28,
      recentFormScore: 31,
      attackScore: 27,
      defenseScore: 34,
      marketScore: 42,
      lineupContextScore: 38,
    },
  },
  context: {
    neutralVenue: true,
  },
  runScope: "internal_lab",
};

export const incompleteLabFixture: MatchPredictionInput = {
  matchId: "lab-incomplete-fixture",
  homeTeam: {
    id: "pending-home",
    name: "Pending Home",
    signals: {
      ratingScore: null,
      attackScore: Number.NaN,
    },
  },
  awayTeam: {
    id: "pending-away",
    name: "Pending Away",
  },
  runScope: "internal_lab",
};
