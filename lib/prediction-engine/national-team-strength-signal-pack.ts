import type { CanonicalSnapshotSeed } from "./national-team-strength-snapshots";

// Generated from codex-inputs/e10c/ufo-e10c-real-signal-pack-48-v2.json for E10C real signal enrichment.
export const REAL_SIGNAL_PACK_SNAPSHOT_DATE = "2026-06-13" as const;
export const REAL_SIGNAL_PACK_SOURCE_LABEL = "E10C normalized FIFA + Elo + recent-form signal pack" as const;
export const REAL_SIGNAL_PACK_SOURCE_NOTES = "Derived from the normalized local E10C signal pack built from FIFA ranking snapshots, Elo historical data, and 2025-2026 recent-form results. Market and lineup context remain neutral placeholders until direct inputs exist." as const;

export const REAL_SIGNAL_PACK_CANONICAL_SNAPSHOT_SEEDS = {
  "mexico": {
    "aliases": [
      "MEX",
      "Mexico",
      "México"
    ],
    "sourceNotes": "Mexico: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 13,
    "fifaPoints": 1700.98,
    "fifaScore": 85.71,
    "fifaSourceTeamName": "Mexico",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 18,
    "eloRating": 1881,
    "eloAverageRank": 20,
    "eloAverageRating": 1783,
    "eloSourceTeamName": "Mexico",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.7777,
    "historicalGoalsAgainstPerMatch": 1.0233,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 62.5,
      "recentFormScore": 90.67,
      "attackScore": 55.26,
      "defenseScore": 72.53
    }
  },
  "south-africa": {
    "aliases": [
      "RSA",
      "South Africa"
    ],
    "sourceNotes": "South Africa: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 61,
    "fifaPoints": 1414.88,
    "fifaScore": 28.57,
    "fifaSourceTeamName": "South Africa",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 80,
    "eloRating": 1511,
    "eloAverageRank": 32,
    "eloAverageRating": 1707,
    "eloSourceTeamName": "South Africa",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.3662,
    "historicalGoalsAgainstPerMatch": 1.0342,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 12.23,
      "recentFormScore": 20,
      "attackScore": 22.71,
      "defenseScore": 71.28
    }
  },
  "south-korea": {
    "aliases": [
      "KOR",
      "Korea Republic",
      "Republic of Korea",
      "South Korea"
    ],
    "sourceNotes": "South Korea: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 22,
    "fifaPoints": 1612.55,
    "fifaScore": 75,
    "fifaSourceTeamName": "Korea Republic",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 25,
    "eloRating": 1786,
    "eloAverageRank": 35,
    "eloAverageRating": 1687,
    "eloSourceTeamName": "South Korea",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.8186,
    "historicalGoalsAgainstPerMatch": 0.9164,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 49.59,
      "recentFormScore": 63,
      "attackScore": 58.49,
      "defenseScore": 84.78
    }
  },
  "czech-republic": {
    "aliases": [
      "CZE",
      "Czech Republic",
      "Czechia"
    ],
    "sourceNotes": "Czech Republic: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 43,
    "fifaPoints": 1484.82,
    "fifaScore": 50,
    "fifaSourceTeamName": "Czechia",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 42,
    "eloRating": 1712,
    "eloAverageRank": 13,
    "eloAverageRating": 1855,
    "eloSourceTeamName": "Czechia",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.8418,
    "historicalGoalsAgainstPerMatch": 1.2441,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 39.54,
      "recentFormScore": 58.33,
      "attackScore": 60.33,
      "defenseScore": 47.23
    }
  },
  "canada": {
    "aliases": [
      "CAN",
      "Canada"
    ],
    "sourceNotes": "Canada: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 31,
    "fifaPoints": 1551.5,
    "fifaScore": 64.29,
    "fifaSourceTeamName": "Canada",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 32,
    "eloRating": 1767,
    "eloAverageRank": 49,
    "eloAverageRating": 1599,
    "eloSourceTeamName": "Canada",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.2831,
    "historicalGoalsAgainstPerMatch": 1.2729,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 47.01,
      "recentFormScore": 53.67,
      "attackScore": 16.14,
      "defenseScore": 43.93
    }
  },
  "bosnia-herzegovina": {
    "aliases": [
      "BIH",
      "Bosnia & Herzegovina",
      "Bosnia and Herzegovina"
    ],
    "sourceNotes": "Bosnia & Herzegovina: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 63,
    "fifaPoints": 1395.19,
    "fifaScore": 26.19,
    "fifaSourceTeamName": "Bosnia and Herzegovina",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 60,
    "eloRating": 1616,
    "eloAverageRank": 53,
    "eloAverageRating": 1626,
    "eloSourceTeamName": "Bosnia and Herzegovina",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.4007,
    "historicalGoalsAgainstPerMatch": 1.3723,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 26.49,
      "recentFormScore": 72,
      "attackScore": 25.44,
      "defenseScore": 32.53
    }
  },
  "qatar": {
    "aliases": [
      "QAT",
      "Qatar"
    ],
    "sourceNotes": "Qatar: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 56,
    "fifaPoints": 1450.31,
    "fifaScore": 34.52,
    "fifaSourceTeamName": "Qatar",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 96,
    "eloRating": 1421,
    "eloAverageRank": 93,
    "eloAverageRating": 1416,
    "eloSourceTeamName": "Qatar",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.4206,
    "historicalGoalsAgainstPerMatch": 1.1817,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 0,
      "recentFormScore": 9.33,
      "attackScore": 27.01,
      "defenseScore": 54.38
    }
  },
  "switzerland": {
    "aliases": [
      "SUI",
      "Switzerland"
    ],
    "sourceNotes": "Switzerland: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 19,
    "fifaPoints": 1650.06,
    "fifaScore": 78.57,
    "fifaSourceTeamName": "Switzerland",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 17,
    "eloRating": 1891,
    "eloAverageRank": 27,
    "eloAverageRating": 1689,
    "eloSourceTeamName": "Switzerland",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.4933,
    "historicalGoalsAgainstPerMatch": 1.6562,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 63.86,
      "recentFormScore": 49,
      "attackScore": 32.76,
      "defenseScore": 0
    }
  },
  "brazil": {
    "aliases": [
      "BRA",
      "Brazil"
    ],
    "sourceNotes": "Brazil: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 6,
    "fifaPoints": 1765.86,
    "fifaScore": 94.05,
    "fifaSourceTeamName": "Brazil",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 5,
    "eloRating": 1991,
    "eloAverageRank": 4,
    "eloAverageRating": 1998,
    "eloSourceTeamName": "Brazil",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 2.1575,
    "historicalGoalsAgainstPerMatch": 0.8969,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 77.45,
      "recentFormScore": 76.67,
      "attackScore": 85.3,
      "defenseScore": 87.02
    }
  },
  "morocco": {
    "aliases": [
      "MAR",
      "Morocco"
    ],
    "sourceNotes": "Morocco: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 7,
    "fifaPoints": 1755.1,
    "fifaScore": 92.86,
    "fifaSourceTeamName": "Morocco",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 24,
    "eloRating": 1827,
    "eloAverageRank": 43,
    "eloAverageRating": 1657,
    "eloSourceTeamName": "Morocco",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.5178,
    "historicalGoalsAgainstPerMatch": 0.8425,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 55.16,
      "recentFormScore": 81.33,
      "attackScore": 34.7,
      "defenseScore": 93.25
    }
  },
  "haiti": {
    "aliases": [
      "HAI",
      "Haiti"
    ],
    "sourceNotes": "Haiti: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 83,
    "fifaPoints": 1293.1,
    "fifaScore": 2.38,
    "fifaSourceTeamName": "Haiti",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 73,
    "eloRating": 1548,
    "eloAverageRank": 81,
    "eloAverageRating": 1418,
    "eloSourceTeamName": "Haiti",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.7087,
    "historicalGoalsAgainstPerMatch": 1.3517,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 17.26,
      "recentFormScore": 59.67,
      "attackScore": 49.8,
      "defenseScore": 34.9
    }
  },
  "scotland": {
    "aliases": [
      "SCO",
      "Scotland"
    ],
    "sourceNotes": "Scotland: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 41,
    "fifaPoints": 1503.34,
    "fifaScore": 52.38,
    "fifaSourceTeamName": "Scotland",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 26,
    "eloRating": 1782,
    "eloAverageRank": 14,
    "eloAverageRating": 1879,
    "eloSourceTeamName": "Scotland",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.7296,
    "historicalGoalsAgainstPerMatch": 1.2382,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 49.05,
      "recentFormScore": 72,
      "attackScore": 51.45,
      "defenseScore": 47.9
    }
  },
  "usa": {
    "aliases": [
      "USA",
      "United States",
      "United States of America"
    ],
    "sourceNotes": "USA: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 17,
    "fifaPoints": 1671.23,
    "fifaScore": 80.95,
    "fifaSourceTeamName": "USA",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 38,
    "eloRating": 1726,
    "eloAverageRank": 41,
    "eloAverageRating": 1642,
    "eloSourceTeamName": "United States",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.5115,
    "historicalGoalsAgainstPerMatch": 1.3023,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 41.44,
      "recentFormScore": 40,
      "attackScore": 34.2,
      "defenseScore": 40.56
    }
  },
  "paraguay": {
    "aliases": [
      "PAR",
      "Paraguay"
    ],
    "sourceNotes": "Paraguay: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 40,
    "fifaPoints": 1505.35,
    "fifaScore": 53.57,
    "fifaSourceTeamName": "Paraguay",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 22,
    "eloRating": 1834,
    "eloAverageRank": 23,
    "eloAverageRating": 1755,
    "eloSourceTeamName": "Paraguay",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.275,
    "historicalGoalsAgainstPerMatch": 1.4132,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 56.11,
      "recentFormScore": 69,
      "attackScore": 15.49,
      "defenseScore": 27.85
    }
  },
  "australia": {
    "aliases": [
      "AUS",
      "Australia"
    ],
    "sourceNotes": "Australia: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 27,
    "fifaPoints": 1579.34,
    "fifaScore": 69.05,
    "fifaSourceTeamName": "Australia",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 28,
    "eloRating": 1777,
    "eloAverageRank": 35,
    "eloAverageRating": 1672,
    "eloSourceTeamName": "Australia",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 2.0251,
    "historicalGoalsAgainstPerMatch": 1.124,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 48.37,
      "recentFormScore": 50.67,
      "attackScore": 74.82,
      "defenseScore": 60.99
    }
  },
  "turkiye": {
    "aliases": [
      "TUR",
      "Turkey",
      "Turkiye",
      "Türkiye"
    ],
    "sourceNotes": "Türkiye: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 23,
    "fifaPoints": 1605.73,
    "fifaScore": 73.81,
    "fifaSourceTeamName": "Türkiye",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 13,
    "eloRating": 1911,
    "eloAverageRank": 43,
    "eloAverageRating": 1610,
    "eloSourceTeamName": "Turkey",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.4179,
    "historicalGoalsAgainstPerMatch": 1.4478,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 66.58,
      "recentFormScore": 90.67,
      "attackScore": 26.8,
      "defenseScore": 23.88
    }
  },
  "germany": {
    "aliases": [
      "GER",
      "Germany"
    ],
    "sourceNotes": "Germany: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 10,
    "fifaPoints": 1735.77,
    "fifaScore": 89.29,
    "fifaSourceTeamName": "Germany",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 10,
    "eloRating": 1932,
    "eloAverageRank": 8,
    "eloAverageRating": 1911,
    "eloSourceTeamName": "Germany",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 2.2521,
    "historicalGoalsAgainstPerMatch": 1.1777,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 69.43,
      "recentFormScore": 100,
      "attackScore": 92.78,
      "defenseScore": 54.84
    }
  },
  "curacao": {
    "aliases": [
      "CUW",
      "Curacao",
      "Curaçao"
    ],
    "sourceNotes": "Curaçao: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 82,
    "fifaPoints": 1294.77,
    "fifaScore": 3.57,
    "fifaSourceTeamName": "Curaçao",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 91,
    "eloRating": 1434,
    "eloAverageRank": 97,
    "eloAverageRating": 1381,
    "eloSourceTeamName": "Curaçao",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.768,
    "historicalGoalsAgainstPerMatch": 1.542,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 1.77,
      "recentFormScore": 18.67,
      "attackScore": 54.49,
      "defenseScore": 13.09
    }
  },
  "cote-divoire": {
    "aliases": [
      "CIV",
      "Cote d Ivoire",
      "Cote d’Ivoire",
      "Côte d’Ivoire",
      "Ivory Coast"
    ],
    "sourceNotes": "Côte d’Ivoire: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 33,
    "fifaPoints": 1540.87,
    "fifaScore": 61.9,
    "fifaSourceTeamName": "Côte d'Ivoire",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 49,
    "eloRating": 1695,
    "eloAverageRank": 45,
    "eloAverageRating": 1640,
    "eloSourceTeamName": "Ivory Coast",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.6335,
    "historicalGoalsAgainstPerMatch": 1.0043,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 37.23,
      "recentFormScore": 90.67,
      "attackScore": 43.85,
      "defenseScore": 74.71
    }
  },
  "ecuador": {
    "aliases": [
      "ECU",
      "Ecuador"
    ],
    "sourceNotes": "Ecuador: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 24,
    "fifaPoints": 1598.52,
    "fifaScore": 72.62,
    "fifaSourceTeamName": "Ecuador",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 9,
    "eloRating": 1938,
    "eloAverageRank": 64,
    "eloAverageRating": 1525,
    "eloSourceTeamName": "Ecuador",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.2067,
    "historicalGoalsAgainstPerMatch": 1.5067,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 70.24,
      "recentFormScore": 81.33,
      "attackScore": 10.09,
      "defenseScore": 17.13
    }
  },
  "netherlands": {
    "aliases": [
      "Holland",
      "NED",
      "Netherlands"
    ],
    "sourceNotes": "Netherlands: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 8,
    "fifaPoints": 1753.57,
    "fifaScore": 91.67,
    "fifaSourceTeamName": "Netherlands",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 8,
    "eloRating": 1948,
    "eloAverageRank": 15,
    "eloAverageRating": 1848,
    "eloSourceTeamName": "Netherlands",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 2.0975,
    "historicalGoalsAgainstPerMatch": 1.2669,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 71.6,
      "recentFormScore": 76.67,
      "attackScore": 80.55,
      "defenseScore": 44.61
    }
  },
  "japan": {
    "aliases": [
      "JPN",
      "Japan"
    ],
    "sourceNotes": "Japan: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 18,
    "fifaPoints": 1661.58,
    "fifaScore": 79.76,
    "fifaSourceTeamName": "Japan",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 14,
    "eloRating": 1906,
    "eloAverageRank": 61,
    "eloAverageRating": 1467,
    "eloSourceTeamName": "Japan",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.8158,
    "historicalGoalsAgainstPerMatch": 1.1782,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 65.9,
      "recentFormScore": 100,
      "attackScore": 58.27,
      "defenseScore": 54.78
    }
  },
  "sweden": {
    "aliases": [
      "SWE",
      "Sweden"
    ],
    "sourceNotes": "Sweden: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 38,
    "fifaPoints": 1509.79,
    "fifaScore": 55.95,
    "fifaSourceTeamName": "Sweden",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 42,
    "eloRating": 1712,
    "eloAverageRank": 17,
    "eloAverageRating": 1795,
    "eloSourceTeamName": "Sweden",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.9902,
    "historicalGoalsAgainstPerMatch": 1.3277,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 39.54,
      "recentFormScore": 55.33,
      "attackScore": 72.06,
      "defenseScore": 37.65
    }
  },
  "tunisia": {
    "aliases": [
      "TUN",
      "Tunisia"
    ],
    "sourceNotes": "Tunisia: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 45,
    "fifaPoints": 1476.41,
    "fifaScore": 47.62,
    "fifaSourceTeamName": "Tunisia",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 58,
    "eloRating": 1628,
    "eloAverageRank": 47,
    "eloAverageRating": 1616,
    "eloSourceTeamName": "Tunisia",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.4221,
    "historicalGoalsAgainstPerMatch": 1.0875,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 28.12,
      "recentFormScore": 23.33,
      "attackScore": 27.13,
      "defenseScore": 65.17
    }
  },
  "belgium": {
    "aliases": [
      "BEL",
      "Belgium"
    ],
    "sourceNotes": "Belgium: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 9,
    "fifaPoints": 1742.24,
    "fifaScore": 90.48,
    "fifaSourceTeamName": "Belgium",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 15,
    "eloRating": 1894,
    "eloAverageRank": 24,
    "eloAverageRating": 1755,
    "eloSourceTeamName": "Belgium",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.8292,
    "historicalGoalsAgainstPerMatch": 1.5478,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 64.27,
      "recentFormScore": 90.67,
      "attackScore": 59.33,
      "defenseScore": 12.42
    }
  },
  "egypt": {
    "aliases": [
      "EGY",
      "Egypt"
    ],
    "sourceNotes": "Egypt: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 29,
    "fifaPoints": 1562.37,
    "fifaScore": 66.67,
    "fifaSourceTeamName": "Egypt",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 48,
    "eloRating": 1696,
    "eloAverageRank": 37,
    "eloAverageRating": 1662,
    "eloSourceTeamName": "Egypt",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.7469,
    "historicalGoalsAgainstPerMatch": 1.0429,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 37.36,
      "recentFormScore": 64.33,
      "attackScore": 52.82,
      "defenseScore": 70.28
    }
  },
  "iran": {
    "aliases": [
      "IR Iran",
      "IRN",
      "Iran"
    ],
    "sourceNotes": "IR Iran: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 20,
    "fifaPoints": 1619.58,
    "fifaScore": 77.38,
    "fifaSourceTeamName": "IR Iran",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 29,
    "eloRating": 1772,
    "eloAverageRank": 40,
    "eloAverageRating": 1658,
    "eloSourceTeamName": "Iran",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.903,
    "historicalGoalsAgainstPerMatch": 0.7836,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 47.69,
      "recentFormScore": 76.67,
      "attackScore": 65.17,
      "defenseScore": 100
    }
  },
  "new-zealand": {
    "aliases": [
      "NZL",
      "New Zealand"
    ],
    "sourceNotes": "New Zealand: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 85,
    "fifaPoints": 1275.58,
    "fifaScore": 0,
    "fifaSourceTeamName": "New Zealand",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 72,
    "eloRating": 1562,
    "eloAverageRank": 66,
    "eloAverageRating": 1500,
    "eloSourceTeamName": "New Zealand",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.7392,
    "historicalGoalsAgainstPerMatch": 1.4739,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 19.16,
      "recentFormScore": 14,
      "attackScore": 52.21,
      "defenseScore": 20.89
    }
  },
  "spain": {
    "aliases": [
      "ESP",
      "Spain"
    ],
    "sourceNotes": "Spain: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 2,
    "fifaPoints": 1874.71,
    "fifaScore": 98.81,
    "fifaSourceTeamName": "Spain",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 1,
    "eloRating": 2157,
    "eloAverageRank": 7,
    "eloAverageRating": 1946,
    "eloSourceTeamName": "Spain",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 2.0396,
    "historicalGoalsAgainstPerMatch": 0.8939,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 100,
      "recentFormScore": 72,
      "attackScore": 75.97,
      "defenseScore": 87.36
    }
  },
  "cabo-verde": {
    "aliases": [
      "CPV",
      "Cabo Verde",
      "Cape Verde"
    ],
    "sourceNotes": "Cabo Verde: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 67,
    "fifaPoints": 1371.11,
    "fifaScore": 21.43,
    "fifaSourceTeamName": "Cabo Verde",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 68,
    "eloRating": 1578,
    "eloAverageRank": 120,
    "eloAverageRating": 1302,
    "eloSourceTeamName": "Cape Verde",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.0791,
    "historicalGoalsAgainstPerMatch": 1.0988,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 21.33,
      "recentFormScore": 64.33,
      "attackScore": 0,
      "defenseScore": 63.88
    }
  },
  "saudi-arabia": {
    "aliases": [
      "KSA",
      "Saudi Arabia"
    ],
    "sourceNotes": "Saudi Arabia: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 60,
    "fifaPoints": 1423.88,
    "fifaScore": 29.76,
    "fifaSourceTeamName": "Saudi Arabia",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 69,
    "eloRating": 1576,
    "eloAverageRank": 76,
    "eloAverageRating": 1499,
    "eloSourceTeamName": "Saudi Arabia",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.5292,
    "historicalGoalsAgainstPerMatch": 1.0679,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 21.06,
      "recentFormScore": 24.67,
      "attackScore": 35.6,
      "defenseScore": 67.42
    }
  },
  "uruguay": {
    "aliases": [
      "URU",
      "Uruguay"
    ],
    "sourceNotes": "Uruguay: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 16,
    "fifaPoints": 1673.07,
    "fifaScore": 82.14,
    "fifaSourceTeamName": "Uruguay",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 16,
    "eloRating": 1892,
    "eloAverageRank": 12,
    "eloAverageRating": 1876,
    "eloSourceTeamName": "Uruguay",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.58,
    "historicalGoalsAgainstPerMatch": 1.2306,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 63.99,
      "recentFormScore": 34,
      "attackScore": 39.62,
      "defenseScore": 48.77
    }
  },
  "france": {
    "aliases": [
      "FRA",
      "France"
    ],
    "sourceNotes": "France: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 3,
    "fifaPoints": 1870.7,
    "fifaScore": 97.62,
    "fifaSourceTeamName": "France",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 3,
    "eloRating": 2063,
    "eloAverageRank": 16,
    "eloAverageRating": 1795,
    "eloSourceTeamName": "France",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.8191,
    "historicalGoalsAgainstPerMatch": 1.3564,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 87.23,
      "recentFormScore": 86,
      "attackScore": 58.53,
      "defenseScore": 34.36
    }
  },
  "senegal": {
    "aliases": [
      "SEN",
      "Senegal"
    ],
    "sourceNotes": "Senegal: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 15,
    "fifaPoints": 1684.07,
    "fifaScore": 83.33,
    "fifaSourceTeamName": "Senegal",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 21,
    "eloRating": 1860,
    "eloAverageRank": 56,
    "eloAverageRating": 1591,
    "eloSourceTeamName": "Senegal",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.3725,
    "historicalGoalsAgainstPerMatch": 0.9518,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 59.65,
      "recentFormScore": 76.67,
      "attackScore": 23.21,
      "defenseScore": 80.72
    }
  },
  "iraq": {
    "aliases": [
      "IRQ",
      "Iraq"
    ],
    "sourceNotes": "Iraq: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 57,
    "fifaPoints": 1446.28,
    "fifaScore": 33.33,
    "fifaSourceTeamName": "Iraq",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 64,
    "eloRating": 1607,
    "eloAverageRank": 47,
    "eloAverageRating": 1622,
    "eloSourceTeamName": "Iraq",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.5801,
    "historicalGoalsAgainstPerMatch": 0.9318,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 25.27,
      "recentFormScore": 44.67,
      "attackScore": 39.63,
      "defenseScore": 83.02
    }
  },
  "norway": {
    "aliases": [
      "NOR",
      "Norway"
    ],
    "sourceNotes": "Norway: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 30,
    "fifaPoints": 1557.44,
    "fifaScore": 65.48,
    "fifaSourceTeamName": "Norway",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 11,
    "eloRating": 1914,
    "eloAverageRank": 38,
    "eloAverageRating": 1623,
    "eloSourceTeamName": "Norway",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.5507,
    "historicalGoalsAgainstPerMatch": 1.6273,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 66.98,
      "recentFormScore": 64.33,
      "attackScore": 37.3,
      "defenseScore": 3.31
    }
  },
  "argentina": {
    "aliases": [
      "ARG",
      "Argentina"
    ],
    "sourceNotes": "Argentina: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 1,
    "fifaPoints": 1877.27,
    "fifaScore": 100,
    "fifaSourceTeamName": "Argentina",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 2,
    "eloRating": 2115,
    "eloAverageRank": 5,
    "eloAverageRating": 1987,
    "eloSourceTeamName": "Argentina",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.9055,
    "historicalGoalsAgainstPerMatch": 1.0225,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 94.29,
      "recentFormScore": 100,
      "attackScore": 65.36,
      "defenseScore": 72.62
    }
  },
  "algeria": {
    "aliases": [
      "ALG",
      "Algeria"
    ],
    "sourceNotes": "Algeria: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 28,
    "fifaPoints": 1571.03,
    "fifaScore": 67.86,
    "fifaSourceTeamName": "Algeria",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 29,
    "eloRating": 1772,
    "eloAverageRank": 48,
    "eloAverageRating": 1621,
    "eloSourceTeamName": "Algeria",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.5319,
    "historicalGoalsAgainstPerMatch": 1.0188,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 47.69,
      "recentFormScore": 90.67,
      "attackScore": 35.81,
      "defenseScore": 73.05
    }
  },
  "austria": {
    "aliases": [
      "AUT",
      "Austria"
    ],
    "sourceNotes": "Austria: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 25,
    "fifaPoints": 1597.4,
    "fifaScore": 71.43,
    "fifaSourceTeamName": "Austria",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 23,
    "eloRating": 1830,
    "eloAverageRank": 20,
    "eloAverageRating": 1810,
    "eloSourceTeamName": "Austria",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.8025,
    "historicalGoalsAgainstPerMatch": 1.5254,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 55.57,
      "recentFormScore": 90.67,
      "attackScore": 57.22,
      "defenseScore": 14.99
    }
  },
  "jordan": {
    "aliases": [
      "JOR",
      "Jordan"
    ],
    "sourceNotes": "Jordan: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 64,
    "fifaPoints": 1387.74,
    "fifaScore": 25,
    "fifaSourceTeamName": "Jordan",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 52,
    "eloRating": 1680,
    "eloAverageRank": 111,
    "eloAverageRating": 1324,
    "eloSourceTeamName": "Jordan",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.2479,
    "historicalGoalsAgainstPerMatch": 1.2256,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 35.19,
      "recentFormScore": 9.33,
      "attackScore": 13.35,
      "defenseScore": 49.35
    }
  },
  "portugal": {
    "aliases": [
      "POR",
      "Portugal"
    ],
    "sourceNotes": "Portugal: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 5,
    "fifaPoints": 1767.85,
    "fifaScore": 95.24,
    "fifaSourceTeamName": "Portugal",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 6,
    "eloRating": 1989,
    "eloAverageRank": 19,
    "eloAverageRating": 1797,
    "eloSourceTeamName": "Portugal",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.7615,
    "historicalGoalsAgainstPerMatch": 1.1221,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 77.17,
      "recentFormScore": 90.67,
      "attackScore": 53.97,
      "defenseScore": 61.21
    }
  },
  "congo-dr": {
    "aliases": [
      "COD",
      "Congo DR",
      "DR Congo",
      "Democratic Republic of the Congo"
    ],
    "sourceNotes": "Congo DR: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 46,
    "fifaPoints": 1474.43,
    "fifaScore": 46.43,
    "fifaSourceTeamName": "Congo DR",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 55,
    "eloRating": 1652,
    "eloAverageRank": 62,
    "eloAverageRating": 1557,
    "eloSourceTeamName": "DR Congo",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.5228,
    "historicalGoalsAgainstPerMatch": 1.1712,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 31.39,
      "recentFormScore": 76.67,
      "attackScore": 35.09,
      "defenseScore": 55.58
    }
  },
  "uzbekistan": {
    "aliases": [
      "UZB",
      "Uzbekistan"
    ],
    "sourceNotes": "Uzbekistan: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 50,
    "fifaPoints": 1458.73,
    "fifaScore": 41.67,
    "fifaSourceTeamName": "Uzbekistan",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 41,
    "eloRating": 1714,
    "eloAverageRank": 59,
    "eloAverageRating": 1596,
    "eloSourceTeamName": "Uzbekistan",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.733,
    "historicalGoalsAgainstPerMatch": 1.0954,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 39.81,
      "recentFormScore": 35.33,
      "attackScore": 51.72,
      "defenseScore": 64.27
    }
  },
  "colombia": {
    "aliases": [
      "COL",
      "Colombia"
    ],
    "sourceNotes": "Colombia: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 14,
    "fifaPoints": 1698.35,
    "fifaScore": 84.52,
    "fifaSourceTeamName": "Colombia",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 7,
    "eloRating": 1982,
    "eloAverageRank": 48,
    "eloAverageRating": 1621,
    "eloSourceTeamName": "Colombia",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.3031,
    "historicalGoalsAgainstPerMatch": 1.1415,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 76.22,
      "recentFormScore": 69,
      "attackScore": 17.72,
      "defenseScore": 58.98
    }
  },
  "england": {
    "aliases": [
      "ENG",
      "England"
    ],
    "sourceNotes": "England: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 4,
    "fifaPoints": 1828.02,
    "fifaScore": 96.43,
    "fifaSourceTeamName": "England",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 4,
    "eloRating": 2024,
    "eloAverageRank": 4,
    "eloAverageRating": 1983,
    "eloSourceTeamName": "England",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 2.3434,
    "historicalGoalsAgainstPerMatch": 0.9621,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 81.93,
      "recentFormScore": 76.67,
      "attackScore": 100,
      "defenseScore": 79.54
    }
  },
  "croatia": {
    "aliases": [
      "CRO",
      "Croatia"
    ],
    "sourceNotes": "Croatia: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 11,
    "fifaPoints": 1714.87,
    "fifaScore": 88.1,
    "fifaSourceTeamName": "Croatia",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 12,
    "eloRating": 1912,
    "eloAverageRank": 12,
    "eloAverageRating": 1881,
    "eloSourceTeamName": "Croatia",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.74,
    "historicalGoalsAgainstPerMatch": 1.01,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 66.71,
      "recentFormScore": 54,
      "attackScore": 52.27,
      "defenseScore": 74.05
    }
  },
  "ghana": {
    "aliases": [
      "GHA",
      "Ghana"
    ],
    "sourceNotes": "Ghana: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 73,
    "fifaPoints": 1346.88,
    "fifaScore": 14.29,
    "fifaSourceTeamName": "Ghana",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 81,
    "eloRating": 1510,
    "eloAverageRank": 42,
    "eloAverageRating": 1650,
    "eloSourceTeamName": "Ghana",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.6021,
    "historicalGoalsAgainstPerMatch": 1.0565,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 12.09,
      "recentFormScore": 4.67,
      "attackScore": 41.37,
      "defenseScore": 68.73
    }
  },
  "panama": {
    "aliases": [
      "PAN",
      "Panama",
      "Panamá"
    ],
    "sourceNotes": "Panama: derived from the normalized local E10C signal pack. FIFA, Elo, and recent-form fields are source-dated local inputs; market and lineup context remain neutral placeholders.",
    "fifaRank": 34,
    "fifaPoints": 1539.16,
    "fifaScore": 60.71,
    "fifaSourceTeamName": "Panama",
    "fifaSourceFile": "Hoja de cálculo sin título - Hoja 1.csv",
    "eloRank": 37,
    "eloRating": 1730,
    "eloAverageRank": 99,
    "eloAverageRating": 1362,
    "eloSourceTeamName": "Panama",
    "eloSourceFile": "elo.html",
    "historicalGoalsForPerMatch": 1.2508,
    "historicalGoalsAgainstPerMatch": 1.5404,
    "recentMatchCount": 10,
    "signals": {
      "ratingScore": 41.98,
      "recentFormScore": 67.67,
      "attackScore": 13.58,
      "defenseScore": 13.27
    }
  }
} satisfies Record<string, CanonicalSnapshotSeed>;
