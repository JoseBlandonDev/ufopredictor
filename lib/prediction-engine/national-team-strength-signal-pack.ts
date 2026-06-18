import type { CanonicalSnapshotSeed } from "./national-team-strength-snapshots";

// Generated from codex-inputs/signal-refresh/ufo-national-team-signal-refresh-post-md1-v1.json for SIGNAL04 static national-team signal refresh.
export const REAL_SIGNAL_PACK_SNAPSHOT_DATE = "2026-06-18" as const;
export const REAL_SIGNAL_PACK_SOURCE_LABEL = "SIGNAL04 static FIFA + Elo + recent aggregate signal pack" as const;
export const REAL_SIGNAL_PACK_SOURCE_NOTES = "Derived from the local SIGNAL04 refresh pack built from FIFA ranking snapshots, Elo ranking data, and validated aggregate recent-form results after the first World Cup matchday. Runtime excludes raw recent-match arrays because source validation found null opponent keys and invalid dates. Market and lineup context remain neutral placeholders until direct inputs exist." as const;

export const REAL_SIGNAL_PACK_CANONICAL_SNAPSHOT_SEEDS = {
  "mexico": {
    "aliases": [
      "Mexico"
    ],
    "sourceNotes": "Mexico: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 13,
    "fifaPoints": 1700.98,
    "fifaScore": 85.71,
    "fifaSourceTeamName": "Mexico",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 13,
    "eloRating": 1881,
    "eloAverageRank": 20,
    "eloAverageRating": 1783,
    "eloSourceTeamName": "Mexico",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.778,
    "historicalGoalsAgainstPerMatch": 1.023,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 64.67,
      "recentFormScore": 86.67,
      "attackScore": 55.35,
      "defenseScore": 72.68
    }
  },
  "south-africa": {
    "aliases": [
      "South Africa"
    ],
    "sourceNotes": "South Africa: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 61,
    "fifaPoints": 1418.21,
    "fifaScore": 28.57,
    "fifaSourceTeamName": "South Africa",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 79,
    "eloRating": 1527,
    "eloAverageRank": 32,
    "eloAverageRating": 1707,
    "eloSourceTeamName": "South Africa",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.366,
    "historicalGoalsAgainstPerMatch": 1.034,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 14.25,
      "recentFormScore": 20,
      "attackScore": 22.91,
      "defenseScore": 71.41
    }
  },
  "south-korea": {
    "aliases": [
      "South Korea",
      "Korea Republic",
      "Republic of Korea"
    ],
    "sourceNotes": "South Korea: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 22,
    "fifaPoints": 1612.55,
    "fifaScore": 75,
    "fifaSourceTeamName": "South Korea",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 26,
    "eloRating": 1786,
    "eloAverageRank": 35,
    "eloAverageRating": 1687,
    "eloSourceTeamName": "South Korea",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.819,
    "historicalGoalsAgainstPerMatch": 0.916,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 51.14,
      "recentFormScore": 60,
      "attackScore": 58.58,
      "defenseScore": 84.96
    }
  },
  "czech-republic": {
    "aliases": [
      "Czechia"
    ],
    "sourceNotes": "Czechia: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 44,
    "fifaPoints": 1481.49,
    "fifaScore": 48.81,
    "fifaSourceTeamName": "Czechia",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 48,
    "eloRating": 1696,
    "eloAverageRank": 13,
    "eloAverageRating": 1854,
    "eloSourceTeamName": "Czechia",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.841,
    "historicalGoalsAgainstPerMatch": 1.244,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 38.32,
      "recentFormScore": 53.33,
      "attackScore": 60.31,
      "defenseScore": 47.3
    }
  },
  "canada": {
    "aliases": [
      "Canada"
    ],
    "sourceNotes": "Canada: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 32,
    "fifaPoints": 1551.5,
    "fifaScore": 63.1,
    "fifaSourceTeamName": "Canada",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 31,
    "eloRating": 1767,
    "eloAverageRank": 49,
    "eloAverageRating": 1599,
    "eloSourceTeamName": "Canada",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.283,
    "historicalGoalsAgainstPerMatch": 1.273,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 48.43,
      "recentFormScore": 46.67,
      "attackScore": 16.38,
      "defenseScore": 43.97
    }
  },
  "bosnia-herzegovina": {
    "aliases": [
      "Bosnia and Herzegovina"
    ],
    "sourceNotes": "Bosnia and Herzegovina: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 63,
    "fifaPoints": 1406.18,
    "fifaScore": 26.19,
    "fifaSourceTeamName": "Bosnia and Herzegovina",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 59,
    "eloRating": 1616,
    "eloAverageRank": 53,
    "eloAverageRating": 1626,
    "eloSourceTeamName": "Bosnia and Herzegovina",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.401,
    "historicalGoalsAgainstPerMatch": 1.372,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 26.92,
      "recentFormScore": 33.33,
      "attackScore": 25.67,
      "defenseScore": 32.61
    }
  },
  "qatar": {
    "aliases": [
      "Qatar"
    ],
    "sourceNotes": "Qatar: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 49,
    "fifaPoints": 1459.45,
    "fifaScore": 42.86,
    "fifaSourceTeamName": "Qatar",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 90,
    "eloRating": 1447,
    "eloAverageRank": 93,
    "eloAverageRating": 1416,
    "eloSourceTeamName": "Qatar",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.42,
    "historicalGoalsAgainstPerMatch": 1.181,
    "recentMatchCount": 3,
    "signals": {
      "ratingScore": 2.85,
      "recentFormScore": 22.23,
      "attackScore": 27.17,
      "defenseScore": 54.54
    }
  },
  "switzerland": {
    "aliases": [
      "Switzerland"
    ],
    "sourceNotes": "Switzerland: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 19,
    "fifaPoints": 1629.94,
    "fifaScore": 78.57,
    "fifaSourceTeamName": "Switzerland",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 19,
    "eloRating": 1865,
    "eloAverageRank": 27,
    "eloAverageRating": 1689,
    "eloSourceTeamName": "Switzerland",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.493,
    "historicalGoalsAgainstPerMatch": 1.656,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 62.39,
      "recentFormScore": 40,
      "attackScore": 32.91,
      "defenseScore": 0
    }
  },
  "brazil": {
    "aliases": [
      "Brazil"
    ],
    "sourceNotes": "Brazil: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 5,
    "fifaPoints": 1765.34,
    "fifaScore": 95.24,
    "fifaSourceTeamName": "Brazil",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 6,
    "eloRating": 1978,
    "eloAverageRank": 4,
    "eloAverageRating": 1998,
    "eloSourceTeamName": "Brazil",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 2.156,
    "historicalGoalsAgainstPerMatch": 0.897,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 78.49,
      "recentFormScore": 66.67,
      "attackScore": 85.12,
      "defenseScore": 87.14
    }
  },
  "morocco": {
    "aliases": [
      "Morocco"
    ],
    "sourceNotes": "Morocco: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 6,
    "fifaPoints": 1755.62,
    "fifaScore": 94.05,
    "fifaSourceTeamName": "Morocco",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 22,
    "eloRating": 1840,
    "eloAverageRank": 43,
    "eloAverageRating": 1657,
    "eloSourceTeamName": "Morocco",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.517,
    "historicalGoalsAgainstPerMatch": 0.843,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 58.83,
      "recentFormScore": 73.33,
      "attackScore": 34.8,
      "defenseScore": 93.34
    }
  },
  "haiti": {
    "aliases": [
      "Haiti"
    ],
    "sourceNotes": "Haiti: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 85,
    "fifaPoints": 1277.67,
    "fifaScore": 0,
    "fifaSourceTeamName": "Haiti",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 76,
    "eloRating": 1536,
    "eloAverageRank": 81,
    "eloAverageRating": 1418,
    "eloSourceTeamName": "Haiti",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.706,
    "historicalGoalsAgainstPerMatch": 1.351,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 15.53,
      "recentFormScore": 26.67,
      "attackScore": 49.69,
      "defenseScore": 35.02
    }
  },
  "scotland": {
    "aliases": [
      "Scotland"
    ],
    "sourceNotes": "Scotland: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 37,
    "fifaPoints": 1518.77,
    "fifaScore": 57.14,
    "fifaSourceTeamName": "Scotland",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 25,
    "eloRating": 1794,
    "eloAverageRank": 14,
    "eloAverageRating": 1879,
    "eloSourceTeamName": "Scotland",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.729,
    "historicalGoalsAgainstPerMatch": 1.237,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 52.28,
      "recentFormScore": 60,
      "attackScore": 51.5,
      "defenseScore": 48.11
    }
  },
  "usa": {
    "aliases": [
      "United States"
    ],
    "sourceNotes": "United States: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 15,
    "fifaPoints": 1688.53,
    "fifaScore": 83.33,
    "fifaSourceTeamName": "United States",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 27,
    "eloRating": 1780,
    "eloAverageRank": 41,
    "eloAverageRating": 1642,
    "eloSourceTeamName": "United States",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.514,
    "historicalGoalsAgainstPerMatch": 1.302,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 50.28,
      "recentFormScore": 40,
      "attackScore": 34.57,
      "defenseScore": 40.64
    }
  },
  "paraguay": {
    "aliases": [
      "Paraguay"
    ],
    "sourceNotes": "Paraguay: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 42,
    "fifaPoints": 1488.05,
    "fifaScore": 51.19,
    "fifaSourceTeamName": "Paraguay",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 27,
    "eloRating": 1780,
    "eloAverageRank": 23,
    "eloAverageRating": 1755,
    "eloSourceTeamName": "Paraguay",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.275,
    "historicalGoalsAgainstPerMatch": 1.416,
    "recentMatchCount": 4,
    "signals": {
      "ratingScore": 50.28,
      "recentFormScore": 50,
      "attackScore": 15.75,
      "defenseScore": 27.55
    }
  },
  "australia": {
    "aliases": [
      "Australia"
    ],
    "sourceNotes": "Australia: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 23,
    "fifaPoints": 1605.61,
    "fifaScore": 73.81,
    "fifaSourceTeamName": "Australia",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 23,
    "eloRating": 1839,
    "eloAverageRank": 35,
    "eloAverageRating": 1672,
    "eloSourceTeamName": "Australia",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 2.025,
    "historicalGoalsAgainstPerMatch": 1.122,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 58.69,
      "recentFormScore": 66.67,
      "attackScore": 74.8,
      "defenseScore": 61.31
    }
  },
  "turkiye": {
    "aliases": [
      "Turkey",
      "Turkiye"
    ],
    "sourceNotes": "Turkey: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 26,
    "fifaPoints": 1579.47,
    "fifaScore": 70.24,
    "fifaSourceTeamName": "Turkey",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 21,
    "eloRating": 1849,
    "eloAverageRank": 43,
    "eloAverageRating": 1610,
    "eloSourceTeamName": "Turkey",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.416,
    "historicalGoalsAgainstPerMatch": 1.449,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 60.11,
      "recentFormScore": 80,
      "attackScore": 26.85,
      "defenseScore": 23.77
    }
  },
  "germany": {
    "aliases": [
      "Germany"
    ],
    "sourceNotes": "Germany: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 9,
    "fifaPoints": 1743.54,
    "fifaScore": 90.48,
    "fifaSourceTeamName": "Germany",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 9,
    "eloRating": 1939,
    "eloAverageRank": 8,
    "eloAverageRating": 1911,
    "eloSourceTeamName": "Germany",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 2.257,
    "historicalGoalsAgainstPerMatch": 1.177,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 72.93,
      "recentFormScore": 100,
      "attackScore": 93.07,
      "defenseScore": 54.99
    }
  },
  "curacao": {
    "aliases": [
      "Curacao"
    ],
    "sourceNotes": "Curacao: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 83,
    "fifaPoints": 1287,
    "fifaScore": 2.38,
    "fifaSourceTeamName": "Curacao",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 94,
    "eloRating": 1427,
    "eloAverageRank": 97,
    "eloAverageRating": 1381,
    "eloSourceTeamName": "Curacao",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.766,
    "historicalGoalsAgainstPerMatch": 1.553,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 0,
      "recentFormScore": 20,
      "attackScore": 54.41,
      "defenseScore": 11.83
    }
  },
  "cote-divoire": {
    "aliases": [
      "Ivory Coast",
      "Cote d Ivoire"
    ],
    "sourceNotes": "Ivory Coast: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 30,
    "fifaPoints": 1568.62,
    "fifaScore": 65.48,
    "fifaSourceTeamName": "Ivory Coast",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 37,
    "eloRating": 1743,
    "eloAverageRank": 45,
    "eloAverageRating": 1640,
    "eloSourceTeamName": "Ivory Coast",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.633,
    "historicalGoalsAgainstPerMatch": 1.003,
    "recentMatchCount": 4,
    "signals": {
      "ratingScore": 45.01,
      "recentFormScore": 100,
      "attackScore": 43.94,
      "defenseScore": 74.97
    }
  },
  "ecuador": {
    "aliases": [
      "Ecuador"
    ],
    "sourceNotes": "Ecuador: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 28,
    "fifaPoints": 1570.76,
    "fifaScore": 67.86,
    "fifaSourceTeamName": "Ecuador",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 12,
    "eloRating": 1890,
    "eloAverageRank": 64,
    "eloAverageRating": 1526,
    "eloSourceTeamName": "Ecuador",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.205,
    "historicalGoalsAgainstPerMatch": 1.506,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 65.95,
      "recentFormScore": 53.33,
      "attackScore": 10.24,
      "defenseScore": 17.22
    }
  },
  "netherlands": {
    "aliases": [
      "Netherlands"
    ],
    "sourceNotes": "Netherlands: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 8,
    "fifaPoints": 1749.2,
    "fifaScore": 91.67,
    "fifaSourceTeamName": "Netherlands",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 8,
    "eloRating": 1944,
    "eloAverageRank": 15,
    "eloAverageRating": 1848,
    "eloSourceTeamName": "Netherlands",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 2.097,
    "historicalGoalsAgainstPerMatch": 1.268,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 73.65,
      "recentFormScore": 53.33,
      "attackScore": 80.47,
      "defenseScore": 44.55
    }
  },
  "japan": {
    "aliases": [
      "Japan"
    ],
    "sourceNotes": "Japan: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 17,
    "fifaPoints": 1665.94,
    "fifaScore": 80.95,
    "fifaSourceTeamName": "Japan",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 11,
    "eloRating": 1910,
    "eloAverageRank": 61,
    "eloAverageRating": 1467,
    "eloSourceTeamName": "Japan",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.816,
    "historicalGoalsAgainstPerMatch": 1.179,
    "recentMatchCount": 4,
    "signals": {
      "ratingScore": 68.8,
      "recentFormScore": 83.33,
      "attackScore": 58.35,
      "defenseScore": 54.76
    }
  },
  "sweden": {
    "aliases": [
      "Sweden"
    ],
    "sourceNotes": "Sweden: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 34,
    "fifaPoints": 1533.19,
    "fifaScore": 60.71,
    "fifaSourceTeamName": "Sweden",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 35,
    "eloRating": 1755,
    "eloAverageRank": 17,
    "eloAverageRating": 1795,
    "eloSourceTeamName": "Sweden",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.993,
    "historicalGoalsAgainstPerMatch": 1.327,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 46.72,
      "recentFormScore": 66.67,
      "attackScore": 72.28,
      "defenseScore": 37.77
    }
  },
  "tunisia": {
    "aliases": [
      "Tunisia"
    ],
    "sourceNotes": "Tunisia: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 55,
    "fifaPoints": 1453,
    "fifaScore": 35.71,
    "fifaSourceTeamName": "Tunisia",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 69,
    "eloRating": 1585,
    "eloAverageRank": 47,
    "eloAverageRating": 1616,
    "eloSourceTeamName": "Tunisia",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.422,
    "historicalGoalsAgainstPerMatch": 1.093,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 22.51,
      "recentFormScore": 26.67,
      "attackScore": 27.32,
      "defenseScore": 64.64
    }
  },
  "belgium": {
    "aliases": [
      "Belgium"
    ],
    "sourceNotes": "Belgium: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 10,
    "fifaPoints": 1733.93,
    "fifaScore": 89.29,
    "fifaSourceTeamName": "Belgium",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 15,
    "eloRating": 1879,
    "eloAverageRank": 24,
    "eloAverageRating": 1755,
    "eloSourceTeamName": "Belgium",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.828,
    "historicalGoalsAgainstPerMatch": 1.547,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 64.39,
      "recentFormScore": 73.33,
      "attackScore": 59.29,
      "defenseScore": 12.51
    }
  },
  "egypt": {
    "aliases": [
      "Egypt"
    ],
    "sourceNotes": "Egypt: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 29,
    "fifaPoints": 1570.67,
    "fifaScore": 66.67,
    "fifaSourceTeamName": "Egypt",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 42,
    "eloRating": 1711,
    "eloAverageRank": 37,
    "eloAverageRating": 1662,
    "eloSourceTeamName": "Egypt",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.746,
    "historicalGoalsAgainstPerMatch": 1.043,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 40.46,
      "recentFormScore": 53.33,
      "attackScore": 52.83,
      "defenseScore": 70.38
    }
  },
  "iran": {
    "aliases": [
      "Iran",
      "IR Iran"
    ],
    "sourceNotes": "Iran: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 24,
    "fifaPoints": 1605.12,
    "fifaScore": 72.62,
    "fifaSourceTeamName": "Iran",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 34,
    "eloRating": 1756,
    "eloAverageRank": 40,
    "eloAverageRating": 1658,
    "eloSourceTeamName": "Iran",
    "eloSourceFile": "ranking ELO.html",
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
  "new-zealand": {
    "aliases": [
      "New Zealand"
    ],
    "sourceNotes": "New Zealand: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 82,
    "fifaPoints": 1290.04,
    "fifaScore": 3.57,
    "fifaSourceTeamName": "New Zealand",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 70,
    "eloRating": 1578,
    "eloAverageRank": 66,
    "eloAverageRating": 1500,
    "eloSourceTeamName": "New Zealand",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.74,
    "historicalGoalsAgainstPerMatch": 1.475,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 21.51,
      "recentFormScore": 26.67,
      "attackScore": 52.36,
      "defenseScore": 20.78
    }
  },
  "spain": {
    "aliases": [
      "Spain"
    ],
    "sourceNotes": "Spain: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 3,
    "fifaPoints": 1856.03,
    "fifaScore": 97.62,
    "fifaSourceTeamName": "Spain",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 1,
    "eloRating": 2129,
    "eloAverageRank": 7,
    "eloAverageRating": 1946,
    "eloSourceTeamName": "Spain",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 2.037,
    "historicalGoalsAgainstPerMatch": 0.893,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 100,
      "recentFormScore": 60,
      "attackScore": 75.75,
      "defenseScore": 87.6
    }
  },
  "cabo-verde": {
    "aliases": [
      "Cape Verde"
    ],
    "sourceNotes": "Cape Verde: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 64,
    "fifaPoints": 1389.79,
    "fifaScore": 25,
    "fifaSourceTeamName": "Cape Verde",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 63,
    "eloRating": 1606,
    "eloAverageRank": 120,
    "eloAverageRating": 1302,
    "eloSourceTeamName": "Cape Verde",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.075,
    "historicalGoalsAgainstPerMatch": 1.094,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 25.5,
      "recentFormScore": 53.33,
      "attackScore": 0,
      "defenseScore": 64.52
    }
  },
  "saudi-arabia": {
    "aliases": [
      "Saudi Arabia"
    ],
    "sourceNotes": "Saudi Arabia: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 59,
    "fifaPoints": 1435,
    "fifaScore": 30.95,
    "fifaSourceTeamName": "Saudi Arabia",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 65,
    "eloRating": 1598,
    "eloAverageRank": 76,
    "eloAverageRating": 1499,
    "eloSourceTeamName": "Saudi Arabia",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.529,
    "historicalGoalsAgainstPerMatch": 1.068,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 24.36,
      "recentFormScore": 33.33,
      "attackScore": 35.75,
      "defenseScore": 67.51
    }
  },
  "uruguay": {
    "aliases": [
      "Uruguay"
    ],
    "sourceNotes": "Uruguay: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 18,
    "fifaPoints": 1661.95,
    "fifaScore": 79.76,
    "fifaSourceTeamName": "Uruguay",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 16,
    "eloRating": 1870,
    "eloAverageRank": 12,
    "eloAverageRating": 1876,
    "eloSourceTeamName": "Uruguay",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.579,
    "historicalGoalsAgainstPerMatch": 1.23,
    "recentMatchCount": 3,
    "signals": {
      "ratingScore": 63.11,
      "recentFormScore": 33.33,
      "attackScore": 39.69,
      "defenseScore": 48.91
    }
  },
  "france": {
    "aliases": [
      "France"
    ],
    "sourceNotes": "France: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 2,
    "fifaPoints": 1887.11,
    "fifaScore": 98.81,
    "fifaSourceTeamName": "France",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 3,
    "eloRating": 2084,
    "eloAverageRank": 16,
    "eloAverageRating": 1795,
    "eloSourceTeamName": "France",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.82,
    "historicalGoalsAgainstPerMatch": 1.356,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 93.59,
      "recentFormScore": 80,
      "attackScore": 58.66,
      "defenseScore": 34.44
    }
  },
  "senegal": {
    "aliases": [
      "Senegal"
    ],
    "sourceNotes": "Senegal: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 16,
    "fifaPoints": 1667.66,
    "fifaScore": 82.14,
    "fifaSourceTeamName": "Senegal",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 23,
    "eloRating": 1839,
    "eloAverageRank": 56,
    "eloAverageRating": 1591,
    "eloSourceTeamName": "Senegal",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.372,
    "historicalGoalsAgainstPerMatch": 0.955,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 58.69,
      "recentFormScore": 46.67,
      "attackScore": 23.39,
      "defenseScore": 80.48
    }
  },
  "iraq": {
    "aliases": [
      "Iraq"
    ],
    "sourceNotes": "Iraq: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 60,
    "fifaPoints": 1426.53,
    "fifaScore": 29.76,
    "fifaSourceTeamName": "Iraq",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 66,
    "eloRating": 1592,
    "eloAverageRank": 47,
    "eloAverageRating": 1622,
    "eloSourceTeamName": "Iraq",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.579,
    "historicalGoalsAgainstPerMatch": 0.936,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 23.5,
      "recentFormScore": 46.67,
      "attackScore": 39.69,
      "defenseScore": 82.66
    }
  },
  "norway": {
    "aliases": [
      "Norway"
    ],
    "sourceNotes": "Norway: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 27,
    "fifaPoints": 1577.18,
    "fifaScore": 69.05,
    "fifaSourceTeamName": "Norway",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 10,
    "eloRating": 1929,
    "eloAverageRank": 38,
    "eloAverageRating": 1623,
    "eloSourceTeamName": "Norway",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.553,
    "historicalGoalsAgainstPerMatch": 1.627,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 71.51,
      "recentFormScore": 53.33,
      "attackScore": 37.64,
      "defenseScore": 3.33
    }
  },
  "argentina": {
    "aliases": [
      "Argentina"
    ],
    "sourceNotes": "Argentina: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 1,
    "fifaPoints": 1889.06,
    "fifaScore": 100,
    "fifaSourceTeamName": "Argentina",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 2,
    "eloRating": 2128,
    "eloAverageRank": 5,
    "eloAverageRating": 1987,
    "eloSourceTeamName": "Argentina",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.906,
    "historicalGoalsAgainstPerMatch": 1.022,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 99.86,
      "recentFormScore": 100,
      "attackScore": 65.43,
      "defenseScore": 72.79
    }
  },
  "algeria": {
    "aliases": [
      "Algeria"
    ],
    "sourceNotes": "Algeria: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 31,
    "fifaPoints": 1559.24,
    "fifaScore": 64.29,
    "fifaSourceTeamName": "Algeria",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 33,
    "eloRating": 1759,
    "eloAverageRank": 48,
    "eloAverageRating": 1621,
    "eloSourceTeamName": "Algeria",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.53,
    "historicalGoalsAgainstPerMatch": 1.022,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 47.29,
      "recentFormScore": 66.67,
      "attackScore": 35.83,
      "defenseScore": 72.79
    }
  },
  "austria": {
    "aliases": [
      "Austria"
    ],
    "sourceNotes": "Austria: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 21,
    "fifaPoints": 1612.86,
    "fifaScore": 76.19,
    "fifaSourceTeamName": "Austria",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 20,
    "eloRating": 1857,
    "eloAverageRank": 20,
    "eloAverageRating": 1810,
    "eloSourceTeamName": "Austria",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.804,
    "historicalGoalsAgainstPerMatch": 1.525,
    "recentMatchCount": 4,
    "signals": {
      "ratingScore": 61.25,
      "recentFormScore": 100,
      "attackScore": 57.4,
      "defenseScore": 15.04
    }
  },
  "jordan": {
    "aliases": [
      "Jordan"
    ],
    "sourceNotes": "Jordan: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 68,
    "fifaPoints": 1372.29,
    "fifaScore": 20.24,
    "fifaSourceTeamName": "Jordan",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 55,
    "eloRating": 1653,
    "eloAverageRank": 111,
    "eloAverageRating": 1324,
    "eloSourceTeamName": "Jordan",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.247,
    "historicalGoalsAgainstPerMatch": 1.229,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 32.19,
      "recentFormScore": 13.33,
      "attackScore": 13.54,
      "defenseScore": 49.02
    }
  },
  "portugal": {
    "aliases": [
      "Portugal"
    ],
    "sourceNotes": "Portugal: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 7,
    "fifaPoints": 1755.09,
    "fifaScore": 92.86,
    "fifaSourceTeamName": "Portugal",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 7,
    "eloRating": 1967,
    "eloAverageRank": 19,
    "eloAverageRating": 1797,
    "eloSourceTeamName": "Portugal",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.76,
    "historicalGoalsAgainstPerMatch": 1.122,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 76.92,
      "recentFormScore": 73.33,
      "attackScore": 53.94,
      "defenseScore": 61.31
    }
  },
  "congo-dr": {
    "aliases": [
      "DR Congo",
      "Congo DR"
    ],
    "sourceNotes": "DR Congo: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 43,
    "fifaPoints": 1487.18,
    "fifaScore": 50,
    "fifaSourceTeamName": "DR Congo",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 52,
    "eloRating": 1674,
    "eloAverageRank": 62,
    "eloAverageRating": 1557,
    "eloSourceTeamName": "DR Congo",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.522,
    "historicalGoalsAgainstPerMatch": 1.171,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 35.19,
      "recentFormScore": 53.33,
      "attackScore": 35.2,
      "defenseScore": 55.68
    }
  },
  "uzbekistan": {
    "aliases": [
      "Uzbekistan"
    ],
    "sourceNotes": "Uzbekistan: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 56,
    "fifaPoints": 1444.48,
    "fifaScore": 34.52,
    "fifaSourceTeamName": "Uzbekistan",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 47,
    "eloRating": 1698,
    "eloAverageRank": 59,
    "eloAverageRating": 1596,
    "eloSourceTeamName": "Uzbekistan",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.731,
    "historicalGoalsAgainstPerMatch": 1.101,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 38.6,
      "recentFormScore": 26.67,
      "attackScore": 51.65,
      "defenseScore": 63.72
    }
  },
  "colombia": {
    "aliases": [
      "Colombia"
    ],
    "sourceNotes": "Colombia: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 11,
    "fifaPoints": 1712.6,
    "fifaScore": 88.1,
    "fifaSourceTeamName": "Colombia",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 5,
    "eloRating": 1998,
    "eloAverageRank": 48,
    "eloAverageRating": 1621,
    "eloSourceTeamName": "Colombia",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.306,
    "historicalGoalsAgainstPerMatch": 1.141,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 81.34,
      "recentFormScore": 60,
      "attackScore": 18.19,
      "defenseScore": 59.13
    }
  },
  "england": {
    "aliases": [
      "England"
    ],
    "sourceNotes": "England: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 4,
    "fifaPoints": 1847.68,
    "fifaScore": 96.43,
    "fifaSourceTeamName": "England",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 4,
    "eloRating": 2055,
    "eloAverageRank": 4,
    "eloAverageRating": 1983,
    "eloSourceTeamName": "England",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 2.345,
    "historicalGoalsAgainstPerMatch": 0.963,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 89.46,
      "recentFormScore": 66.67,
      "attackScore": 100,
      "defenseScore": 79.56
    }
  },
  "croatia": {
    "aliases": [
      "Croatia"
    ],
    "sourceNotes": "Croatia: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 14,
    "fifaPoints": 1695.21,
    "fifaScore": 84.52,
    "fifaSourceTeamName": "Croatia",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 13,
    "eloRating": 1881,
    "eloAverageRank": 12,
    "eloAverageRating": 1881,
    "eloSourceTeamName": "Croatia",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.741,
    "historicalGoalsAgainstPerMatch": 1.017,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 64.67,
      "recentFormScore": 40,
      "attackScore": 52.44,
      "defenseScore": 73.36
    }
  },
  "ghana": {
    "aliases": [
      "Ghana"
    ],
    "sourceNotes": "Ghana: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 65,
    "fifaPoints": 1380.71,
    "fifaScore": 23.81,
    "fifaSourceTeamName": "Ghana",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 73,
    "eloRating": 1557,
    "eloAverageRank": 42,
    "eloAverageRating": 1650,
    "eloSourceTeamName": "Ghana",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.601,
    "historicalGoalsAgainstPerMatch": 1.055,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 18.52,
      "recentFormScore": 26.67,
      "attackScore": 41.42,
      "defenseScore": 69
    }
  },
  "panama": {
    "aliases": [
      "Panama"
    ],
    "sourceNotes": "Panama: refreshed from the local SIGNAL04 pack using FIFA, Elo, and validated aggregate recent-form inputs. Runtime excludes raw recent-match arrays due source-quality guardrails; market and lineup context remain neutral placeholders.",
    "fifaRank": 40,
    "fifaPoints": 1505.33,
    "fifaScore": 53.57,
    "fifaSourceTeamName": "Panama",
    "fifaSourceFile": "Ranking FIFA - Hoja 2.csv",
    "eloRank": 49,
    "eloRating": 1683,
    "eloAverageRank": 99,
    "eloAverageRating": 1362,
    "eloSourceTeamName": "Panama",
    "eloSourceFile": "ranking ELO.html",
    "historicalGoalsForPerMatch": 1.249,
    "historicalGoalsAgainstPerMatch": 1.539,
    "recentMatchCount": 5,
    "signals": {
      "ratingScore": 36.47,
      "recentFormScore": 46.67,
      "attackScore": 13.7,
      "defenseScore": 13.43
    }
  }
} as const satisfies Record<string, CanonicalSnapshotSeed>;
