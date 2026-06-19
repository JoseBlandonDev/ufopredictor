import type { CanonicalSnapshotSeed } from "./national-team-strength-snapshots";

// Generated file. Do not edit manually.
// Source snapshot: data/prediction-engine/national-team-signals/2026-06-19/source.json
// Quality report: data/prediction-engine/national-team-signals/2026-06-19/quality-report.json
// Source manifest: data/prediction-engine/national-team-signals/2026-06-19/source-manifest.json
// Generator: scripts/prediction-engine/generate-national-team-signal-pack.js
// Generation command: node scripts/prediction-engine/generate-national-team-signal-pack.js

export const REAL_SIGNAL_PACK_SNAPSHOT_DATE = "2026-06-19" as const;
export const REAL_SIGNAL_PACK_SOURCE_LABEL = "SIGNAL04 tracked FIFA + Elo + recent aggregate signal pack" as const;
export const REAL_SIGNAL_PACK_SOURCE_NOTES = "Generated from tracked normalized source inputs at data/prediction-engine/national-team-signals/2026-06-19/source.json. Manifest SHA evidence lives at data/prediction-engine/national-team-signals/2026-06-19/source-manifest.json. Uses validated aggregate recent-form inputs while runtime continues to exclude raw recent-match arrays from the committed static pack. Runtime consumes generated static TypeScript only; raw HTML/CSV are not runtime dependencies. Market and lineup context remain neutral placeholders until direct inputs exist." as const;

export const REAL_SIGNAL_PACK_CANONICAL_SNAPSHOT_SEEDS = {
  "mexico":   {
    "aliases": [
      "Mexico",
      "México"
    ],
    "sourceNotes": "Mexico: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 11,
    "fifaPoints": 1721.78,
    "fifaScore": 88.1,
    "fifaSourceTeamName": "Mexico",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 12,
    "eloRating": 1896,
    "eloAverageRank": 20,
    "eloAverageRating": 1783,
    "eloSourceTeamName": "Mexico",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.777,
    "historicalGoalsAgainstPerMatch": 1.022,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 66.81,
      "recentFormScore": 100,
      "attackScore": 55.28,
      "defenseScore": 72.76
    }
  },
  "south-africa":   {
    "aliases": [
      "South Africa",
      "Sudáfrica"
    ],
    "sourceNotes": "South Africa: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 61,
    "fifaPoints": 1418.21,
    "fifaScore": 28.57,
    "fifaSourceTeamName": "South Africa",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 79,
    "eloRating": 1527,
    "eloAverageRank": 32,
    "eloAverageRating": 1707,
    "eloSourceTeamName": "South Africa",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.366,
    "historicalGoalsAgainstPerMatch": 1.034,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 14.25,
      "recentFormScore": 20,
      "attackScore": 22.91,
      "defenseScore": 71.38
    }
  },
  "south-korea":   {
    "aliases": [
      "República de Corea",
      "South Korea"
    ],
    "sourceNotes": "South Korea: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 24,
    "fifaPoints": 1591.75,
    "fifaScore": 72.62,
    "fifaSourceTeamName": "South Korea",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 31,
    "eloRating": 1771,
    "eloAverageRank": 35,
    "eloAverageRating": 1687,
    "eloSourceTeamName": "South Korea",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.817,
    "historicalGoalsAgainstPerMatch": 0.917,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 49,
      "recentFormScore": 60,
      "attackScore": 58.43,
      "defenseScore": 84.83
    }
  },
  "czech-republic":   {
    "aliases": [
      "Chequia",
      "Czechia"
    ],
    "sourceNotes": "Czech Republic: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 44,
    "fifaPoints": 1481.49,
    "fifaScore": 48.81,
    "fifaSourceTeamName": "Czechia",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 48,
    "eloRating": 1696,
    "eloAverageRank": 13,
    "eloAverageRating": 1854,
    "eloSourceTeamName": "Czechia",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.841,
    "historicalGoalsAgainstPerMatch": 1.244,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 38.32,
      "recentFormScore": 53.33,
      "attackScore": 60.31,
      "defenseScore": 47.24
    }
  },
  "canada":   {
    "aliases": [
      "Canada",
      "Canadá"
    ],
    "sourceNotes": "Canada: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 28,
    "fifaPoints": 1572.13,
    "fifaScore": 67.86,
    "fifaSourceTeamName": "Canada",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 29,
    "eloRating": 1777,
    "eloAverageRank": 49,
    "eloAverageRating": 1599,
    "eloSourceTeamName": "Canada",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.293,
    "historicalGoalsAgainstPerMatch": 1.27,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 49.86,
      "recentFormScore": 60,
      "attackScore": 17.17,
      "defenseScore": 44.25
    }
  },
  "bosnia-herzegovina":   {
    "aliases": [
      "Bosnia and Herzegovina",
      "Bosnia y Herzegovina"
    ],
    "sourceNotes": "Bosnia & Herzegovina: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 64,
    "fifaPoints": 1381.18,
    "fifaScore": 25,
    "fifaSourceTeamName": "Bosnia and Herzegovina",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 65,
    "eloRating": 1596,
    "eloAverageRank": 53,
    "eloAverageRating": 1626,
    "eloSourceTeamName": "Bosnia & Herzegovina",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.399,
    "historicalGoalsAgainstPerMatch": 1.382,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 24.07,
      "recentFormScore": 26.67,
      "attackScore": 25.51,
      "defenseScore": 31.38
    }
  },
  "qatar":   {
    "aliases": [
      "Catar",
      "Qatar"
    ],
    "sourceNotes": "Qatar: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 58,
    "fifaPoints": 1438.82,
    "fifaScore": 32.14,
    "fifaSourceTeamName": "Qatar",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 91,
    "eloRating": 1437,
    "eloAverageRank": 93,
    "eloAverageRating": 1416,
    "eloSourceTeamName": "Qatar",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.418,
    "historicalGoalsAgainstPerMatch": 1.188,
    "recentMatchCount": 4,
    "signals": {
      "ratingScore": 1.42,
      "recentFormScore": 16.67,
      "attackScore": 27.01,
      "defenseScore": 53.68
    }
  },
  "switzerland":   {
    "aliases": [
      "Suiza",
      "Switzerland"
    ],
    "sourceNotes": "Switzerland: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 19,
    "fifaPoints": 1654.94,
    "fifaScore": 78.57,
    "fifaSourceTeamName": "Switzerland",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 14,
    "eloRating": 1885,
    "eloAverageRank": 27,
    "eloAverageRating": 1689,
    "eloSourceTeamName": "Switzerland",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.496,
    "historicalGoalsAgainstPerMatch": 1.655,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 65.24,
      "recentFormScore": 60,
      "attackScore": 33.15,
      "defenseScore": 0
    }
  },
  "brazil":   {
    "aliases": [
      "Brasil",
      "Brazil"
    ],
    "sourceNotes": "Brazil: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 5,
    "fifaPoints": 1765.34,
    "fifaScore": 95.24,
    "fifaSourceTeamName": "Brazil",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 6,
    "eloRating": 1978,
    "eloAverageRank": 4,
    "eloAverageRating": 1998,
    "eloSourceTeamName": "Brazil",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 2.156,
    "historicalGoalsAgainstPerMatch": 0.897,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 78.49,
      "recentFormScore": 66.67,
      "attackScore": 85.12,
      "defenseScore": 87.13
    }
  },
  "morocco":   {
    "aliases": [
      "Marruecos",
      "Morocco"
    ],
    "sourceNotes": "Morocco: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 6,
    "fifaPoints": 1755.62,
    "fifaScore": 94.05,
    "fifaSourceTeamName": "Morocco",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 22,
    "eloRating": 1840,
    "eloAverageRank": 43,
    "eloAverageRating": 1657,
    "eloSourceTeamName": "Morocco",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.517,
    "historicalGoalsAgainstPerMatch": 0.843,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 58.83,
      "recentFormScore": 73.33,
      "attackScore": 34.8,
      "defenseScore": 93.33
    }
  },
  "haiti":   {
    "aliases": [
      "Haiti",
      "Haití"
    ],
    "sourceNotes": "Haiti: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 85,
    "fifaPoints": 1277.67,
    "fifaScore": 0,
    "fifaSourceTeamName": "Haiti",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 76,
    "eloRating": 1536,
    "eloAverageRank": 81,
    "eloAverageRating": 1418,
    "eloSourceTeamName": "Haiti",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.706,
    "historicalGoalsAgainstPerMatch": 1.351,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 15.53,
      "recentFormScore": 26.67,
      "attackScore": 49.69,
      "defenseScore": 34.94
    }
  },
  "scotland":   {
    "aliases": [
      "Escocia",
      "Scotland"
    ],
    "sourceNotes": "Scotland: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 37,
    "fifaPoints": 1518.77,
    "fifaScore": 57.14,
    "fifaSourceTeamName": "Scotland",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 25,
    "eloRating": 1794,
    "eloAverageRank": 14,
    "eloAverageRating": 1879,
    "eloSourceTeamName": "Scotland",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.729,
    "historicalGoalsAgainstPerMatch": 1.237,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 52.28,
      "recentFormScore": 60,
      "attackScore": 51.5,
      "defenseScore": 48.05
    }
  },
  "usa":   {
    "aliases": [
      "EE. UU.",
      "USA",
      "United States"
    ],
    "sourceNotes": "USA: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 15,
    "fifaPoints": 1688.53,
    "fifaScore": 83.33,
    "fifaSourceTeamName": "USA",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 26,
    "eloRating": 1780,
    "eloAverageRank": 41,
    "eloAverageRating": 1642,
    "eloSourceTeamName": "United States",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.514,
    "historicalGoalsAgainstPerMatch": 1.302,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 50.28,
      "recentFormScore": 40,
      "attackScore": 34.57,
      "defenseScore": 40.57
    }
  },
  "paraguay":   {
    "aliases": [
      "Paraguay"
    ],
    "sourceNotes": "Paraguay: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 42,
    "fifaPoints": 1488.05,
    "fifaScore": 51.19,
    "fifaSourceTeamName": "Paraguay",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 26,
    "eloRating": 1780,
    "eloAverageRank": 23,
    "eloAverageRating": 1755,
    "eloSourceTeamName": "Paraguay",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.275,
    "historicalGoalsAgainstPerMatch": 1.416,
    "recentMatchCount": 4,
    "signals": {
      "ratingScore": 50.28,
      "recentFormScore": 50,
      "attackScore": 15.75,
      "defenseScore": 27.47
    }
  },
  "australia":   {
    "aliases": [
      "Australia"
    ],
    "sourceNotes": "Australia: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 22,
    "fifaPoints": 1605.61,
    "fifaScore": 75,
    "fifaSourceTeamName": "Australia",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 23,
    "eloRating": 1839,
    "eloAverageRank": 35,
    "eloAverageRating": 1672,
    "eloSourceTeamName": "Australia",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 2.025,
    "historicalGoalsAgainstPerMatch": 1.122,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 58.69,
      "recentFormScore": 66.67,
      "attackScore": 74.8,
      "defenseScore": 61.26
    }
  },
  "turkiye":   {
    "aliases": [
      "Turkey",
      "Turquía",
      "Türkiye"
    ],
    "sourceNotes": "Türkiye: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 26,
    "fifaPoints": 1579.47,
    "fifaScore": 70.24,
    "fifaSourceTeamName": "Türkiye",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 21,
    "eloRating": 1849,
    "eloAverageRank": 43,
    "eloAverageRating": 1610,
    "eloSourceTeamName": "Turkey",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.416,
    "historicalGoalsAgainstPerMatch": 1.449,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 60.11,
      "recentFormScore": 80,
      "attackScore": 26.85,
      "defenseScore": 23.68
    }
  },
  "germany":   {
    "aliases": [
      "Alemania",
      "Germany"
    ],
    "sourceNotes": "Germany: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 9,
    "fifaPoints": 1743.54,
    "fifaScore": 90.48,
    "fifaSourceTeamName": "Germany",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 9,
    "eloRating": 1939,
    "eloAverageRank": 8,
    "eloAverageRating": 1911,
    "eloSourceTeamName": "Germany",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 2.257,
    "historicalGoalsAgainstPerMatch": 1.177,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 72.93,
      "recentFormScore": 100,
      "attackScore": 93.07,
      "defenseScore": 54.94
    }
  },
  "curacao":   {
    "aliases": [
      "Curacao",
      "Curazao",
      "Curaçao"
    ],
    "sourceNotes": "Curaçao: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 83,
    "fifaPoints": 1287,
    "fifaScore": 2.38,
    "fifaSourceTeamName": "Curaçao",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 94,
    "eloRating": 1427,
    "eloAverageRank": 97,
    "eloAverageRating": 1381,
    "eloSourceTeamName": "Curaçao",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.766,
    "historicalGoalsAgainstPerMatch": 1.553,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 0,
      "recentFormScore": 20,
      "attackScore": 54.41,
      "defenseScore": 11.72
    }
  },
  "cote-divoire":   {
    "aliases": [
      "Costa de Marfil",
      "Ivory Coast"
    ],
    "sourceNotes": "Côte d’Ivoire: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 31,
    "fifaPoints": 1568.62,
    "fifaScore": 64.29,
    "fifaSourceTeamName": "Ivory Coast",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 37,
    "eloRating": 1743,
    "eloAverageRank": 45,
    "eloAverageRating": 1640,
    "eloSourceTeamName": "Ivory Coast",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.633,
    "historicalGoalsAgainstPerMatch": 1.003,
    "recentMatchCount": 4,
    "signals": {
      "ratingScore": 45.01,
      "recentFormScore": 100,
      "attackScore": 43.94,
      "defenseScore": 74.94
    }
  },
  "ecuador":   {
    "aliases": [
      "Ecuador"
    ],
    "sourceNotes": "Ecuador: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 29,
    "fifaPoints": 1570.76,
    "fifaScore": 66.67,
    "fifaSourceTeamName": "Ecuador",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 13,
    "eloRating": 1890,
    "eloAverageRank": 64,
    "eloAverageRating": 1526,
    "eloSourceTeamName": "Ecuador",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.205,
    "historicalGoalsAgainstPerMatch": 1.506,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 65.95,
      "recentFormScore": 53.33,
      "attackScore": 10.24,
      "defenseScore": 17.13
    }
  },
  "netherlands":   {
    "aliases": [
      "Netherlands",
      "Países Bajos"
    ],
    "sourceNotes": "Netherlands: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 8,
    "fifaPoints": 1749.2,
    "fifaScore": 91.67,
    "fifaSourceTeamName": "Netherlands",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 8,
    "eloRating": 1944,
    "eloAverageRank": 15,
    "eloAverageRating": 1848,
    "eloSourceTeamName": "Netherlands",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 2.097,
    "historicalGoalsAgainstPerMatch": 1.268,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 73.65,
      "recentFormScore": 53.33,
      "attackScore": 80.47,
      "defenseScore": 44.48
    }
  },
  "japan":   {
    "aliases": [
      "Japan",
      "Japón"
    ],
    "sourceNotes": "Japan: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 17,
    "fifaPoints": 1665.94,
    "fifaScore": 80.95,
    "fifaSourceTeamName": "Japan",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 11,
    "eloRating": 1910,
    "eloAverageRank": 61,
    "eloAverageRating": 1467,
    "eloSourceTeamName": "Japan",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.816,
    "historicalGoalsAgainstPerMatch": 1.179,
    "recentMatchCount": 4,
    "signals": {
      "ratingScore": 68.8,
      "recentFormScore": 83.33,
      "attackScore": 58.35,
      "defenseScore": 54.71
    }
  },
  "sweden":   {
    "aliases": [
      "Suecia",
      "Sweden"
    ],
    "sourceNotes": "Sweden: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 34,
    "fifaPoints": 1533.19,
    "fifaScore": 60.71,
    "fifaSourceTeamName": "Sweden",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 35,
    "eloRating": 1755,
    "eloAverageRank": 17,
    "eloAverageRating": 1795,
    "eloSourceTeamName": "Sweden",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.993,
    "historicalGoalsAgainstPerMatch": 1.327,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 46.72,
      "recentFormScore": 66.67,
      "attackScore": 72.28,
      "defenseScore": 37.7
    }
  },
  "tunisia":   {
    "aliases": [
      "Tunisia",
      "Túnez"
    ],
    "sourceNotes": "Tunisia: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 54,
    "fifaPoints": 1453,
    "fifaScore": 36.9,
    "fifaSourceTeamName": "Tunisia",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 69,
    "eloRating": 1585,
    "eloAverageRank": 47,
    "eloAverageRating": 1616,
    "eloSourceTeamName": "Tunisia",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.422,
    "historicalGoalsAgainstPerMatch": 1.093,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 22.51,
      "recentFormScore": 26.67,
      "attackScore": 27.32,
      "defenseScore": 64.6
    }
  },
  "belgium":   {
    "aliases": [
      "Belgium",
      "Bélgica"
    ],
    "sourceNotes": "Belgium: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 10,
    "fifaPoints": 1733.93,
    "fifaScore": 89.29,
    "fifaSourceTeamName": "Belgium",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 16,
    "eloRating": 1879,
    "eloAverageRank": 24,
    "eloAverageRating": 1755,
    "eloSourceTeamName": "Belgium",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.828,
    "historicalGoalsAgainstPerMatch": 1.547,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 64.39,
      "recentFormScore": 73.33,
      "attackScore": 59.29,
      "defenseScore": 12.41
    }
  },
  "egypt":   {
    "aliases": [
      "Egipto",
      "Egypt"
    ],
    "sourceNotes": "Egypt: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 30,
    "fifaPoints": 1570.67,
    "fifaScore": 65.48,
    "fifaSourceTeamName": "Egypt",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 42,
    "eloRating": 1711,
    "eloAverageRank": 37,
    "eloAverageRating": 1662,
    "eloSourceTeamName": "Egypt",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.746,
    "historicalGoalsAgainstPerMatch": 1.043,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 40.46,
      "recentFormScore": 53.33,
      "attackScore": 52.83,
      "defenseScore": 70.34
    }
  },
  "iran":   {
    "aliases": [
      "Iran",
      "RI de Irán"
    ],
    "sourceNotes": "IR Iran: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 23,
    "fifaPoints": 1605.12,
    "fifaScore": 73.81,
    "fifaSourceTeamName": "Iran",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 34,
    "eloRating": 1756,
    "eloAverageRank": 40,
    "eloAverageRating": 1658,
    "eloSourceTeamName": "Iran",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.903,
    "historicalGoalsAgainstPerMatch": 0.785,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 46.87,
      "recentFormScore": 66.67,
      "attackScore": 65.2,
      "defenseScore": 100
    }
  },
  "new-zealand":   {
    "aliases": [
      "New Zealand",
      "Nueva Zelanda"
    ],
    "sourceNotes": "New Zealand: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 82,
    "fifaPoints": 1290.04,
    "fifaScore": 3.57,
    "fifaSourceTeamName": "New Zealand",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 70,
    "eloRating": 1578,
    "eloAverageRank": 66,
    "eloAverageRating": 1500,
    "eloSourceTeamName": "New Zealand",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.74,
    "historicalGoalsAgainstPerMatch": 1.475,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 21.51,
      "recentFormScore": 26.67,
      "attackScore": 52.36,
      "defenseScore": 20.69
    }
  },
  "spain":   {
    "aliases": [
      "España",
      "Spain"
    ],
    "sourceNotes": "Spain: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 3,
    "fifaPoints": 1856.03,
    "fifaScore": 97.62,
    "fifaSourceTeamName": "Spain",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 1,
    "eloRating": 2129,
    "eloAverageRank": 7,
    "eloAverageRating": 1946,
    "eloSourceTeamName": "Spain",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 2.037,
    "historicalGoalsAgainstPerMatch": 0.893,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 100,
      "recentFormScore": 60,
      "attackScore": 75.75,
      "defenseScore": 87.59
    }
  },
  "cabo-verde":   {
    "aliases": [
      "Cape Verde",
      "Cape Verde Islands",
      "Islas de Cabo Verde"
    ],
    "sourceNotes": "Cabo Verde: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 63,
    "fifaPoints": 1389.79,
    "fifaScore": 26.19,
    "fifaSourceTeamName": "Cape Verde Islands",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 62,
    "eloRating": 1606,
    "eloAverageRank": 120,
    "eloAverageRating": 1302,
    "eloSourceTeamName": "Cape Verde",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.075,
    "historicalGoalsAgainstPerMatch": 1.094,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 25.5,
      "recentFormScore": 53.33,
      "attackScore": 0,
      "defenseScore": 64.48
    }
  },
  "saudi-arabia":   {
    "aliases": [
      "Arabia Saudí",
      "Saudi Arabia"
    ],
    "sourceNotes": "Saudi Arabia: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 59,
    "fifaPoints": 1435,
    "fifaScore": 30.95,
    "fifaSourceTeamName": "Saudi Arabia",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 64,
    "eloRating": 1598,
    "eloAverageRank": 76,
    "eloAverageRating": 1499,
    "eloSourceTeamName": "Saudi Arabia",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.529,
    "historicalGoalsAgainstPerMatch": 1.068,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 24.36,
      "recentFormScore": 33.33,
      "attackScore": 35.75,
      "defenseScore": 67.47
    }
  },
  "uruguay":   {
    "aliases": [
      "Uruguay"
    ],
    "sourceNotes": "Uruguay: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 18,
    "fifaPoints": 1661.95,
    "fifaScore": 79.76,
    "fifaSourceTeamName": "Uruguay",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 17,
    "eloRating": 1870,
    "eloAverageRank": 12,
    "eloAverageRating": 1876,
    "eloSourceTeamName": "Uruguay",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.579,
    "historicalGoalsAgainstPerMatch": 1.23,
    "recentMatchCount": 3,
    "signals": {
      "ratingScore": 63.11,
      "recentFormScore": 33.33,
      "attackScore": 39.69,
      "defenseScore": 48.85
    }
  },
  "france":   {
    "aliases": [
      "France",
      "Francia"
    ],
    "sourceNotes": "France: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 2,
    "fifaPoints": 1887.11,
    "fifaScore": 98.81,
    "fifaSourceTeamName": "France",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 3,
    "eloRating": 2084,
    "eloAverageRank": 16,
    "eloAverageRating": 1795,
    "eloSourceTeamName": "France",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.82,
    "historicalGoalsAgainstPerMatch": 1.356,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 93.59,
      "recentFormScore": 80,
      "attackScore": 58.66,
      "defenseScore": 34.37
    }
  },
  "senegal":   {
    "aliases": [
      "Senegal"
    ],
    "sourceNotes": "Senegal: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 16,
    "fifaPoints": 1667.66,
    "fifaScore": 82.14,
    "fifaSourceTeamName": "Senegal",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 23,
    "eloRating": 1839,
    "eloAverageRank": 56,
    "eloAverageRating": 1591,
    "eloSourceTeamName": "Senegal",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.372,
    "historicalGoalsAgainstPerMatch": 0.955,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 58.69,
      "recentFormScore": 46.67,
      "attackScore": 23.39,
      "defenseScore": 80.46
    }
  },
  "iraq":   {
    "aliases": [
      "Irak",
      "Iraq"
    ],
    "sourceNotes": "Iraq: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 60,
    "fifaPoints": 1426.53,
    "fifaScore": 29.76,
    "fifaSourceTeamName": "Iraq",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 66,
    "eloRating": 1592,
    "eloAverageRank": 47,
    "eloAverageRating": 1622,
    "eloSourceTeamName": "Iraq",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.579,
    "historicalGoalsAgainstPerMatch": 0.936,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 23.5,
      "recentFormScore": 46.67,
      "attackScore": 39.69,
      "defenseScore": 82.64
    }
  },
  "norway":   {
    "aliases": [
      "Noruega",
      "Norway"
    ],
    "sourceNotes": "Norway: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 27,
    "fifaPoints": 1577.18,
    "fifaScore": 69.05,
    "fifaSourceTeamName": "Norway",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 10,
    "eloRating": 1929,
    "eloAverageRank": 38,
    "eloAverageRating": 1623,
    "eloSourceTeamName": "Norway",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.553,
    "historicalGoalsAgainstPerMatch": 1.627,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 71.51,
      "recentFormScore": 53.33,
      "attackScore": 37.64,
      "defenseScore": 3.22
    }
  },
  "argentina":   {
    "aliases": [
      "Argentina"
    ],
    "sourceNotes": "Argentina: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 1,
    "fifaPoints": 1889.06,
    "fifaScore": 100,
    "fifaSourceTeamName": "Argentina",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 2,
    "eloRating": 2128,
    "eloAverageRank": 5,
    "eloAverageRating": 1987,
    "eloSourceTeamName": "Argentina",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.906,
    "historicalGoalsAgainstPerMatch": 1.022,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 99.86,
      "recentFormScore": 100,
      "attackScore": 65.43,
      "defenseScore": 72.76
    }
  },
  "algeria":   {
    "aliases": [
      "Algeria",
      "Argelia"
    ],
    "sourceNotes": "Algeria: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 32,
    "fifaPoints": 1559.24,
    "fifaScore": 63.1,
    "fifaSourceTeamName": "Algeria",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 33,
    "eloRating": 1759,
    "eloAverageRank": 48,
    "eloAverageRating": 1621,
    "eloSourceTeamName": "Algeria",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.53,
    "historicalGoalsAgainstPerMatch": 1.022,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 47.29,
      "recentFormScore": 66.67,
      "attackScore": 35.83,
      "defenseScore": 72.76
    }
  },
  "austria":   {
    "aliases": [
      "Austria"
    ],
    "sourceNotes": "Austria: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 21,
    "fifaPoints": 1612.86,
    "fifaScore": 76.19,
    "fifaSourceTeamName": "Austria",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 20,
    "eloRating": 1857,
    "eloAverageRank": 20,
    "eloAverageRating": 1810,
    "eloSourceTeamName": "Austria",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.804,
    "historicalGoalsAgainstPerMatch": 1.525,
    "recentMatchCount": 4,
    "signals": {
      "ratingScore": 61.25,
      "recentFormScore": 100,
      "attackScore": 57.4,
      "defenseScore": 14.94
    }
  },
  "jordan":   {
    "aliases": [
      "Jordan",
      "Jordania"
    ],
    "sourceNotes": "Jordan: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 68,
    "fifaPoints": 1372.29,
    "fifaScore": 20.24,
    "fifaSourceTeamName": "Jordan",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 55,
    "eloRating": 1653,
    "eloAverageRank": 111,
    "eloAverageRating": 1324,
    "eloSourceTeamName": "Jordan",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.247,
    "historicalGoalsAgainstPerMatch": 1.229,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 32.19,
      "recentFormScore": 13.33,
      "attackScore": 13.54,
      "defenseScore": 48.97
    }
  },
  "portugal":   {
    "aliases": [
      "Portugal"
    ],
    "sourceNotes": "Portugal: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 7,
    "fifaPoints": 1755.09,
    "fifaScore": 92.86,
    "fifaSourceTeamName": "Portugal",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 7,
    "eloRating": 1967,
    "eloAverageRank": 19,
    "eloAverageRating": 1797,
    "eloSourceTeamName": "Portugal",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.76,
    "historicalGoalsAgainstPerMatch": 1.122,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 76.92,
      "recentFormScore": 73.33,
      "attackScore": 53.94,
      "defenseScore": 61.26
    }
  },
  "congo-dr":   {
    "aliases": [
      "Congo DR",
      "DR Congo",
      "RD Congo"
    ],
    "sourceNotes": "Congo DR: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 43,
    "fifaPoints": 1487.18,
    "fifaScore": 50,
    "fifaSourceTeamName": "Congo DR",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 52,
    "eloRating": 1674,
    "eloAverageRank": 62,
    "eloAverageRating": 1557,
    "eloSourceTeamName": "DR Congo",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.522,
    "historicalGoalsAgainstPerMatch": 1.171,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 35.19,
      "recentFormScore": 53.33,
      "attackScore": 35.2,
      "defenseScore": 55.63
    }
  },
  "uzbekistan":   {
    "aliases": [
      "Uzbekistan",
      "Uzbekistán"
    ],
    "sourceNotes": "Uzbekistan: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 55,
    "fifaPoints": 1444.48,
    "fifaScore": 35.71,
    "fifaSourceTeamName": "Uzbekistan",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 47,
    "eloRating": 1698,
    "eloAverageRank": 59,
    "eloAverageRating": 1596,
    "eloSourceTeamName": "Uzbekistan",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.731,
    "historicalGoalsAgainstPerMatch": 1.101,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 38.6,
      "recentFormScore": 26.67,
      "attackScore": 51.65,
      "defenseScore": 63.68
    }
  },
  "colombia":   {
    "aliases": [
      "Colombia"
    ],
    "sourceNotes": "Colombia: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 12,
    "fifaPoints": 1712.6,
    "fifaScore": 86.9,
    "fifaSourceTeamName": "Colombia",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 5,
    "eloRating": 1998,
    "eloAverageRank": 48,
    "eloAverageRating": 1621,
    "eloSourceTeamName": "Colombia",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.306,
    "historicalGoalsAgainstPerMatch": 1.141,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 81.34,
      "recentFormScore": 60,
      "attackScore": 18.19,
      "defenseScore": 59.08
    }
  },
  "england":   {
    "aliases": [
      "England",
      "Inglaterra"
    ],
    "sourceNotes": "England: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 4,
    "fifaPoints": 1847.68,
    "fifaScore": 96.43,
    "fifaSourceTeamName": "England",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 4,
    "eloRating": 2055,
    "eloAverageRank": 4,
    "eloAverageRating": 1983,
    "eloSourceTeamName": "England",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 2.345,
    "historicalGoalsAgainstPerMatch": 0.963,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 89.46,
      "recentFormScore": 66.67,
      "attackScore": 100,
      "defenseScore": 79.54
    }
  },
  "croatia":   {
    "aliases": [
      "Croacia",
      "Croatia"
    ],
    "sourceNotes": "Croatia: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 14,
    "fifaPoints": 1695.21,
    "fifaScore": 84.52,
    "fifaSourceTeamName": "Croatia",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 15,
    "eloRating": 1881,
    "eloAverageRank": 12,
    "eloAverageRating": 1881,
    "eloSourceTeamName": "Croatia",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.741,
    "historicalGoalsAgainstPerMatch": 1.017,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 64.67,
      "recentFormScore": 40,
      "attackScore": 52.44,
      "defenseScore": 73.33
    }
  },
  "ghana":   {
    "aliases": [
      "Ghana"
    ],
    "sourceNotes": "Ghana: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 65,
    "fifaPoints": 1380.71,
    "fifaScore": 23.81,
    "fifaSourceTeamName": "Ghana",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 73,
    "eloRating": 1557,
    "eloAverageRank": 42,
    "eloAverageRating": 1650,
    "eloSourceTeamName": "Ghana",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.601,
    "historicalGoalsAgainstPerMatch": 1.055,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 18.52,
      "recentFormScore": 26.67,
      "attackScore": 41.42,
      "defenseScore": 68.97
    }
  },
  "panama":   {
    "aliases": [
      "Panama",
      "Panamá"
    ],
    "sourceNotes": "Panama: generated from tracked source snapshot data/prediction-engine/national-team-signals/2026-06-19/source.json. Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; recentFormScore is recent points per match divided by 3 and scaled to 0-100; attackScore min-max normalizes historical goals for per match; defenseScore inverse min-max normalizes historical goals against per match. Market and lineup context remain neutral placeholders.",
    "fifaRank": 40,
    "fifaPoints": 1505.33,
    "fifaScore": 53.57,
    "fifaSourceTeamName": "Panama",
    "fifaSourceFile": "ranking-fifa-raw.csv",
    "eloRank": 49,
    "eloRating": 1683,
    "eloAverageRank": 99,
    "eloAverageRating": 1362,
    "eloSourceTeamName": "Panama",
    "eloSourceFile": "ranking-elo-raw.html",
    "historicalGoalsForPerMatch": 1.249,
    "historicalGoalsAgainstPerMatch": 1.539,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 36.47,
      "recentFormScore": 46.67,
      "attackScore": 13.7,
      "defenseScore": 13.33
    }
  }
} as const satisfies Record<string, CanonicalSnapshotSeed>;

export const REAL_SIGNAL_PACK_SOURCE_SHA256S = {
  "ranking-fifa-raw.html": "b11817b6e95331d1fd3d0807f7efb60cf2f8b074c72e9d0e345d00886002bb41",
  "ranking-fifa-raw.csv": "bb9fa11d485c098f01312029c43873d2654f9572b26b1515528f36a343a4d0c9",
  "ranking-elo-raw.html": "cff5e0de39e25abcb3fd140fabe3189e302884fa854a38d6f57b2c5c4a1ed236",
  "results-elo-raw.html": "051188a3dc7087c15300b9a503dd442f101d3582c9926282c11044c8d78d71e7",
  "fixtures-elo-raw.html": "986f05dd04c5d3bf4199ce3167fe6e330bf0e0cd59386643a53acdf54753fa7a",
  "ufo-national-team-signal-refresh-post-md1-v1.json": "5cd202e81ffcc3403508d8edd966a7b703d0e866e6f16fc14cd70a2149953da0"
} as const;
