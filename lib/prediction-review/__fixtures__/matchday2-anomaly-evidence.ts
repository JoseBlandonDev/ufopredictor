import type { AtypicalFixtureDetectorInput } from "../types";

const ANALYSIS_AS_OF = "2026-06-19T21:11:52.000Z";

type FixtureOverride = {
  fixture?: {
    matchId?: string;
    providerFixtureId?: number | null;
    competitionKey?: string;
    stage?: string | null;
    kickoffAt?: string;
    status?: string;
    homeTeam?: Partial<AtypicalFixtureDetectorInput["fixture"]["homeTeam"]>;
    awayTeam?: Partial<AtypicalFixtureDetectorInput["fixture"]["awayTeam"]>;
  };
  prediction?: Partial<AtypicalFixtureDetectorInput["prediction"]>;
  coverage?: Partial<AtypicalFixtureDetectorInput["coverage"]>;
  evidence?: {
    oneXtwo?: Partial<AtypicalFixtureDetectorInput["evidence"]["oneXtwo"]>;
    expectedGoals?: Partial<AtypicalFixtureDetectorInput["evidence"]["expectedGoals"]>;
    modalScore?: Partial<AtypicalFixtureDetectorInput["evidence"]["modalScore"]>;
    elo?: Partial<AtypicalFixtureDetectorInput["evidence"]["elo"]>;
    signals?: {
      home?: Partial<AtypicalFixtureDetectorInput["evidence"]["signals"]["home"]>;
      away?: Partial<AtypicalFixtureDetectorInput["evidence"]["signals"]["away"]>;
      componentGaps?: Partial<AtypicalFixtureDetectorInput["evidence"]["signals"]["componentGaps"]>;
      movement?: Partial<AtypicalFixtureDetectorInput["evidence"]["signals"]["movement"]>;
    };
    markets?: Partial<AtypicalFixtureDetectorInput["evidence"]["markets"]>;
    confidenceRisk?: Partial<AtypicalFixtureDetectorInput["evidence"]["confidenceRisk"]>;
    sourceIntegrity?: Partial<AtypicalFixtureDetectorInput["evidence"]["sourceIntegrity"]>;
    referenceProjection?: Partial<AtypicalFixtureDetectorInput["evidence"]["referenceProjection"]>;
  };
  provenance?: Partial<AtypicalFixtureDetectorInput["provenance"]>;
};

function createFixture(name: string, overrides: FixtureOverride = {}): {
  analysisAsOf: string;
  inputFingerprint: string;
  input: AtypicalFixtureDetectorInput;
} {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const base: AtypicalFixtureDetectorInput = {
    fixture: {
      matchId: `match-${slug}`,
      providerFixtureId: 1000 + slug.length,
      competitionKey: "world-cup",
      stage: "Group Stage - 2",
      kickoffAt: "2026-06-21T19:00:00.000Z",
      status: "scheduled",
      homeTeam: {
        canonicalKey: "home",
        displayName: "Home",
      },
      awayTeam: {
        canonicalKey: "away",
        displayName: "Away",
      },
    },
    prediction: {
      predictionVersionId: `prediction-${slug}`,
      modelVersionId: "model-v0",
      modelVersionName: "v0.1-lab",
      generatedAt: "2026-06-19T12:00:00.000Z",
      scope: "public_product",
      signalSnapshotId: "2026-06-19",
    },
    coverage: {
      missingEvidence: ["signals.movement.history"],
      preMatchCutoffSatisfied: true,
    },
    evidence: {
      oneXtwo: {
        homePct: 52,
        drawPct: 25,
        awayPct: 23,
      },
      expectedGoals: {
        home: 1.45,
        away: 0.95,
      },
      modalScore: {
        homeGoals: 1,
        awayGoals: 0,
        probabilityPct: 13,
      },
      elo: {
        available: true,
        homeTwoWayPct: 62,
        awayTwoWayPct: 38,
        homeRating: 1840,
        awayRating: 1765,
        favoriteNeutralMarginPct: 7,
        dominantFavoriteThresholdPct: 70,
        dominantInversionFavoriteWinThresholdPct: 75,
        dominantInversionRawFavoriteMarginPp: 12,
      },
      signals: {
        home: {
          ratingScore: 71,
          recentFormScore: 66,
          attackScore: 62,
          defenseScore: 63,
          weightedPower: 65.1,
        },
        away: {
          ratingScore: 60,
          recentFormScore: 56,
          attackScore: 55,
          defenseScore: 54,
          weightedPower: 56.95,
        },
        componentGaps: {
          rating: 11,
          recentForm: 10,
          attack: 7,
          defense: 9,
          weightedPower: 8.15,
        },
        movement: {
          available: false,
          maxAbsoluteDelta: null,
          totalAbsoluteDelta: null,
          changedComponents: [],
        },
      },
      markets: {
        bttsYesPct: 48,
        over25Pct: 46,
      },
      confidenceRisk: {
        confidenceScore: 62,
        riskLevel: "medium",
      },
      sourceIntegrity: {
        qualityVerdict: "PASS",
        homeAliasResolved: true,
        awayAliasResolved: true,
        homeRecentSampleSize: 5,
        awayRecentSampleSize: 5,
        latestEvidenceAt: "2026-06-18T00:00:00.000Z",
        postCutoffEvidenceCount: 0,
        centralProvenanceComplete: true,
      },
      referenceProjection: {
        available: true,
        oneXtwoDeltaMaxPp: 2.5,
        expectedGoalsDeltaMax: 0.12,
        favoriteChanged: false,
      },
    },
    provenance: {
      predictionVersionId: `prediction-${slug}`,
      modelVersionId: "model-v0",
      signalSnapshotId: "2026-06-19",
      signalSnapshotDate: "2026-06-19",
      eloSnapshotId: "fixture-elo-coherence:2026-06-19",
      qualityReportId: "quality-report:2026-06-19",
      sourceManifestId: "source-manifest:2026-06-19",
      aliasResolverVersion: "national-team-strength-snapshots:2026-06-19",
      referenceProjectionGeneratedInMemory: true,
    },
  };

  return {
    analysisAsOf: ANALYSIS_AS_OF,
    inputFingerprint: `fixture-${slug}`,
    input: {
      ...base,
      ...overrides,
      fixture: {
        ...base.fixture,
        ...overrides.fixture,
        homeTeam: {
          ...base.fixture.homeTeam,
          ...overrides.fixture?.homeTeam,
        },
        awayTeam: {
          ...base.fixture.awayTeam,
          ...overrides.fixture?.awayTeam,
        },
      },
      prediction: {
        ...base.prediction,
        ...overrides.prediction,
      },
      coverage: {
        ...base.coverage,
        ...overrides.coverage,
      },
      evidence: {
        ...base.evidence,
        ...overrides.evidence,
        oneXtwo: {
          ...base.evidence.oneXtwo,
          ...overrides.evidence?.oneXtwo,
        },
        expectedGoals: {
          ...base.evidence.expectedGoals,
          ...overrides.evidence?.expectedGoals,
        },
        modalScore: {
          ...base.evidence.modalScore,
          ...overrides.evidence?.modalScore,
        },
        elo: {
          ...base.evidence.elo,
          ...overrides.evidence?.elo,
        },
        signals: {
          ...base.evidence.signals,
          ...overrides.evidence?.signals,
          home: {
            ...base.evidence.signals.home,
            ...overrides.evidence?.signals?.home,
          },
          away: {
            ...base.evidence.signals.away,
            ...overrides.evidence?.signals?.away,
          },
          componentGaps: {
            ...base.evidence.signals.componentGaps,
            ...overrides.evidence?.signals?.componentGaps,
          },
          movement: {
            ...base.evidence.signals.movement,
            ...overrides.evidence?.signals?.movement,
          },
        },
        markets: {
          ...base.evidence.markets,
          ...overrides.evidence?.markets,
        },
        confidenceRisk: {
          ...base.evidence.confidenceRisk,
          ...overrides.evidence?.confidenceRisk,
        },
        sourceIntegrity: {
          ...base.evidence.sourceIntegrity,
          ...overrides.evidence?.sourceIntegrity,
        },
        referenceProjection: {
          ...base.evidence.referenceProjection,
          ...overrides.evidence?.referenceProjection,
        },
      },
      provenance: {
        ...base.provenance,
        ...overrides.provenance,
      },
    },
  };
}

export const MATCHDAY2_ANOMALY_FIXTURES = {
  brazilVsHaiti: createFixture("Brazil vs Haiti", {
    fixture: {
      kickoffAt: "2026-06-19T22:00:00.000Z",
      homeTeam: { canonicalKey: "brazil", displayName: "Brazil" },
      awayTeam: { canonicalKey: "haiti", displayName: "Haiti" },
    },
    evidence: {
      oneXtwo: { homePct: 78, drawPct: 15, awayPct: 7 },
      expectedGoals: { home: 2.15, away: 0.55 },
      modalScore: { homeGoals: 2, awayGoals: 0, probabilityPct: 15 },
      elo: { homeTwoWayPct: 93, awayTwoWayPct: 7, homeRating: 1978, awayRating: 1536 },
      signals: {
        home: { weightedPower: 78.2 },
        away: { weightedPower: 48.3 },
        componentGaps: { rating: 34, weightedPower: 29.9 },
      },
      markets: { bttsYesPct: 34, over25Pct: 57 },
      confidenceRisk: { confidenceScore: 77, riskLevel: "low" },
    },
  }),
  spainVsSaudiArabia: createFixture("Spain vs Saudi Arabia", {
    fixture: {
      homeTeam: { canonicalKey: "spain", displayName: "Spain" },
      awayTeam: { canonicalKey: "saudi-arabia", displayName: "Saudi Arabia" },
    },
    evidence: {
      oneXtwo: { homePct: 67, drawPct: 20, awayPct: 13 },
      expectedGoals: { home: 1.9, away: 0.72 },
      modalScore: { homeGoals: 2, awayGoals: 0, probabilityPct: 12 },
      elo: { homeTwoWayPct: 83, awayTwoWayPct: 17 },
      confidenceRisk: { confidenceScore: 72, riskLevel: "low" },
    },
  }),
  argentinaVsAustria: createFixture("Argentina vs Austria", {
    fixture: {
      homeTeam: { canonicalKey: "argentina", displayName: "Argentina" },
      awayTeam: { canonicalKey: "austria", displayName: "Austria" },
    },
    evidence: {
      oneXtwo: { homePct: 61, drawPct: 24, awayPct: 15 },
      expectedGoals: { home: 1.72, away: 0.88 },
      modalScore: { homeGoals: 1, awayGoals: 0, probabilityPct: 11.5 },
      elo: { homeTwoWayPct: 77, awayTwoWayPct: 23 },
      confidenceRisk: { confidenceScore: 68, riskLevel: "low" },
    },
  }),
  englandVsGhana: createFixture("England vs Ghana", {
    fixture: {
      homeTeam: { canonicalKey: "england", displayName: "England" },
      awayTeam: { canonicalKey: "ghana", displayName: "Ghana" },
    },
    evidence: {
      oneXtwo: { homePct: 63, drawPct: 22, awayPct: 15 },
      expectedGoals: { home: 1.68, away: 0.84 },
      modalScore: { homeGoals: 1, awayGoals: 0, probabilityPct: 11.6 },
      elo: { homeTwoWayPct: 79, awayTwoWayPct: 21 },
      confidenceRisk: { confidenceScore: 70, riskLevel: "low" },
    },
  }),
  netherlandsVsSweden: createFixture("Netherlands vs Sweden", {
    fixture: {
      homeTeam: { canonicalKey: "netherlands", displayName: "Netherlands" },
      awayTeam: { canonicalKey: "sweden", displayName: "Sweden" },
    },
    evidence: {
      oneXtwo: { homePct: 48, drawPct: 28, awayPct: 24 },
      expectedGoals: { home: 1.32, away: 0.94 },
      modalScore: { homeGoals: 1, awayGoals: 1, probabilityPct: 12.4 },
      elo: { homeTwoWayPct: 75, awayTwoWayPct: 25 },
      confidenceRisk: { confidenceScore: 59, riskLevel: "medium" },
    },
  }),
  uruguayVsCapeVerde: createFixture("Uruguay vs Cape Verde", {
    fixture: {
      homeTeam: { canonicalKey: "uruguay", displayName: "Uruguay" },
      awayTeam: { canonicalKey: "cape-verde", displayName: "Cape Verde Islands" },
    },
    evidence: {
      oneXtwo: { homePct: 54, drawPct: 25, awayPct: 21 },
      expectedGoals: { home: 1.38, away: 0.89 },
      modalScore: { homeGoals: 1, awayGoals: 0, probabilityPct: 11.1 },
      elo: { homeTwoWayPct: 82, awayTwoWayPct: 18 },
      confidenceRisk: { confidenceScore: 63, riskLevel: "medium" },
    },
  }),
  newZealandVsEgypt: createFixture("New Zealand vs Egypt", {
    fixture: {
      homeTeam: { canonicalKey: "new-zealand", displayName: "New Zealand" },
      awayTeam: { canonicalKey: "egypt", displayName: "Egypt" },
    },
    evidence: {
      oneXtwo: { homePct: 31, drawPct: 31, awayPct: 38 },
      expectedGoals: { home: 1.05, away: 1.18 },
      modalScore: { homeGoals: 1, awayGoals: 1, probabilityPct: 13.3 },
      elo: { homeTwoWayPct: 36, awayTwoWayPct: 64 },
      confidenceRisk: { confidenceScore: 51, riskLevel: "medium" },
    },
  }),
  germanyVsIvoryCoast: createFixture("Germany vs Ivory Coast", {
    fixture: {
      homeTeam: { canonicalKey: "germany", displayName: "Germany" },
      awayTeam: { canonicalKey: "ivory-coast", displayName: "Ivory Coast" },
    },
    evidence: {
      oneXtwo: { homePct: 53, drawPct: 25, awayPct: 22 },
      expectedGoals: { home: 1.48, away: 1.01 },
      modalScore: { homeGoals: 1, awayGoals: 0, probabilityPct: 11.9 },
      elo: { homeTwoWayPct: 76, awayTwoWayPct: 24 },
      confidenceRisk: { confidenceScore: 91, riskLevel: "low" },
    },
  }),
  jordanVsAlgeria: createFixture("Jordan vs Algeria", {
    fixture: {
      homeTeam: { canonicalKey: "jordan", displayName: "Jordan" },
      awayTeam: { canonicalKey: "algeria", displayName: "Algeria" },
    },
    evidence: {
      oneXtwo: { homePct: 34, drawPct: 31, awayPct: 35 },
      expectedGoals: { home: 1.14, away: 1.15 },
      modalScore: { homeGoals: 1, awayGoals: 0, probabilityPct: 13.8 },
      elo: { homeTwoWayPct: 48, awayTwoWayPct: 52 },
      confidenceRisk: { confidenceScore: 82, riskLevel: "low" },
    },
  }),
  ecuadorVsCuracao: createFixture("Ecuador vs Curacao", {
    fixture: {
      homeTeam: { canonicalKey: "ecuador", displayName: "Ecuador" },
      awayTeam: { canonicalKey: "curacao", displayName: "Curaçao" },
    },
    evidence: {
      oneXtwo: { homePct: 29, drawPct: 26, awayPct: 45 },
      expectedGoals: { home: 1.12, away: 1.56 },
      modalScore: { homeGoals: 1, awayGoals: 2, probabilityPct: 9.2 },
      elo: { homeTwoWayPct: 93, awayTwoWayPct: 7, homeRating: 1890, awayRating: 1427 },
      signals: {
        home: { weightedPower: 68.8 },
        away: { weightedPower: 50.4 },
        componentGaps: { rating: 31, weightedPower: 18.4 },
      },
      confidenceRisk: { confidenceScore: 64, riskLevel: "medium" },
    },
  }),
  franceVsIraq: createFixture("France vs Iraq", {
    fixture: {
      homeTeam: { canonicalKey: "france", displayName: "France" },
      awayTeam: { canonicalKey: "iraq", displayName: "Iraq" },
    },
    evidence: {
      oneXtwo: { homePct: 43, drawPct: 30, awayPct: 27 },
      expectedGoals: { home: 1.19, away: 1.05 },
      modalScore: { homeGoals: 1, awayGoals: 1, probabilityPct: 13.6 },
      elo: { homeTwoWayPct: 88, awayTwoWayPct: 12, homeRating: 1987, awayRating: 1655 },
      confidenceRisk: { confidenceScore: 58, riskLevel: "medium" },
    },
  }),
  belgiumVsIran: createFixture("Belgium vs Iran", {
    fixture: {
      homeTeam: { canonicalKey: "belgium", displayName: "Belgium" },
      awayTeam: { canonicalKey: "iran", displayName: "Iran" },
    },
    evidence: {
      oneXtwo: { homePct: 24, drawPct: 27, awayPct: 49 },
      expectedGoals: { home: 0.98, away: 1.51 },
      modalScore: { homeGoals: 0, awayGoals: 1, probabilityPct: 10.8 },
      elo: { homeTwoWayPct: 67, awayTwoWayPct: 33 },
      confidenceRisk: { confidenceScore: 67, riskLevel: "medium" },
    },
  }),
  portugalVsUzbekistan: createFixture("Portugal vs Uzbekistan", {
    fixture: {
      homeTeam: { canonicalKey: "portugal", displayName: "Portugal" },
      awayTeam: { canonicalKey: "uzbekistan", displayName: "Uzbekistan" },
    },
    evidence: {
      oneXtwo: { homePct: 45, drawPct: 30, awayPct: 25 },
      expectedGoals: { home: 1.24, away: 0.99 },
      modalScore: { homeGoals: 1, awayGoals: 1, probabilityPct: 13.2 },
      elo: { homeTwoWayPct: 86, awayTwoWayPct: 14 },
      confidenceRisk: { confidenceScore: 57, riskLevel: "medium" },
    },
  }),
  colombiaVsCongoDr: createFixture("Colombia vs Congo DR", {
    fixture: {
      homeTeam: { canonicalKey: "colombia", displayName: "Colombia" },
      awayTeam: { canonicalKey: "congo-dr", displayName: "Congo DR" },
    },
    evidence: {
      oneXtwo: { homePct: 46, drawPct: 29, awayPct: 25 },
      expectedGoals: { home: 1.22, away: 0.98 },
      modalScore: { homeGoals: 1, awayGoals: 1, probabilityPct: 13.1 },
      elo: { homeTwoWayPct: 85, awayTwoWayPct: 15 },
      confidenceRisk: { confidenceScore: 60, riskLevel: "medium" },
    },
  }),
  japanVsTunisia: createFixture("Japan vs Tunisia", {
    fixture: {
      homeTeam: { canonicalKey: "japan", displayName: "Japan" },
      awayTeam: { canonicalKey: "tunisia", displayName: "Tunisia" },
    },
    evidence: {
      oneXtwo: { homePct: 58, drawPct: 24, awayPct: 18 },
      expectedGoals: { home: 1.52, away: 0.8 },
      modalScore: { homeGoals: 1, awayGoals: 0, probabilityPct: 12.1 },
      elo: { homeTwoWayPct: 87, awayTwoWayPct: 13 },
      sourceIntegrity: { awayRecentSampleSize: 2 },
    },
  }),
  paraguayVsTurkey: createFixture("Paraguay vs Turkey", {
    fixture: {
      kickoffAt: "2026-06-19T23:00:00.000Z",
      homeTeam: { canonicalKey: "paraguay", displayName: "Paraguay" },
      awayTeam: { canonicalKey: "turkey", displayName: "Türkiye" },
    },
    evidence: {
      oneXtwo: { homePct: 40, drawPct: 29, awayPct: 31 },
      expectedGoals: { home: 1.19, away: 1.14 },
      modalScore: { homeGoals: 1, awayGoals: 1, probabilityPct: 14 },
      elo: { homeTwoWayPct: 40, awayTwoWayPct: 60 },
      sourceIntegrity: { homeRecentSampleSize: 2 },
    },
  }),
  moroccoVsScotland: createFixture("Morocco vs Scotland", {
    fixture: {
      kickoffAt: "2026-06-19T23:30:00.000Z",
      homeTeam: { canonicalKey: "morocco", displayName: "Morocco" },
      awayTeam: { canonicalKey: "scotland", displayName: "Scotland" },
    },
    evidence: {
      oneXtwo: { homePct: 44, drawPct: 29, awayPct: 27 },
      expectedGoals: { home: 1.21, away: 1.01 },
      modalScore: { homeGoals: 1, awayGoals: 1, probabilityPct: 13.7 },
      elo: { homeTwoWayPct: 57, awayTwoWayPct: 43 },
    },
  }),
  usaVsAustralia: createFixture("USA vs Australia", {
    fixture: {
      kickoffAt: "2026-06-20T00:30:00.000Z",
      homeTeam: { canonicalKey: "usa", displayName: "USA" },
      awayTeam: { canonicalKey: "australia", displayName: "Australia" },
    },
    evidence: {
      oneXtwo: { homePct: 38, drawPct: 31, awayPct: 31 },
      expectedGoals: { home: 1.17, away: 1.09 },
      modalScore: { homeGoals: 1, awayGoals: 1, probabilityPct: 13.9 },
      elo: { homeTwoWayPct: 56, awayTwoWayPct: 44 },
    },
  }),
  mexicoVsSouthKorea: createFixture("Mexico vs South Korea", {
    fixture: {
      kickoffAt: "2026-06-20T02:00:00.000Z",
      homeTeam: { canonicalKey: "mexico", displayName: "Mexico" },
      awayTeam: { canonicalKey: "south-korea", displayName: "South Korea" },
    },
    evidence: {
      oneXtwo: { homePct: 55, drawPct: 25, awayPct: 20 },
      expectedGoals: { home: 1.41, away: 0.9 },
      modalScore: { homeGoals: 1, awayGoals: 0, probabilityPct: 11.7 },
      elo: { homeTwoWayPct: 75, awayTwoWayPct: 25 },
    },
  }),
} as const;

export const MATCHDAY2_ANOMALY_BATCH_FIXTURES = [
  MATCHDAY2_ANOMALY_FIXTURES.paraguayVsTurkey,
  MATCHDAY2_ANOMALY_FIXTURES.moroccoVsScotland,
  MATCHDAY2_ANOMALY_FIXTURES.usaVsAustralia,
  MATCHDAY2_ANOMALY_FIXTURES.mexicoVsSouthKorea,
  MATCHDAY2_ANOMALY_FIXTURES.ecuadorVsCuracao,
  MATCHDAY2_ANOMALY_FIXTURES.germanyVsIvoryCoast,
  MATCHDAY2_ANOMALY_FIXTURES.japanVsTunisia,
  MATCHDAY2_ANOMALY_FIXTURES.netherlandsVsSweden,
  MATCHDAY2_ANOMALY_FIXTURES.belgiumVsIran,
  MATCHDAY2_ANOMALY_FIXTURES.uruguayVsCapeVerde,
  MATCHDAY2_ANOMALY_FIXTURES.newZealandVsEgypt,
  MATCHDAY2_ANOMALY_FIXTURES.franceVsIraq,
  MATCHDAY2_ANOMALY_FIXTURES.portugalVsUzbekistan,
  MATCHDAY2_ANOMALY_FIXTURES.colombiaVsCongoDr,
  MATCHDAY2_ANOMALY_FIXTURES.jordanVsAlgeria,
  MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti,
  MATCHDAY2_ANOMALY_FIXTURES.spainVsSaudiArabia,
  MATCHDAY2_ANOMALY_FIXTURES.argentinaVsAustria,
  MATCHDAY2_ANOMALY_FIXTURES.englandVsGhana,
];

export { ANALYSIS_AS_OF as MATCHDAY2_ANOMALY_ANALYSIS_AS_OF };
