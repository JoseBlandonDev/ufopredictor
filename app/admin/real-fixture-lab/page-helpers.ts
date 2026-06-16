import type { RealFixtureLabFixtureView } from "@/lib/supabase/real-fixture-lab-queries";

type FixtureSummaryStatus =
  | "saved"
  | "ready_to_persist"
  | "waiting_verification"
  | "waiting_result"
  | "no_saved_prediction";

type FixtureOperationalState =
  | "needs_prediction"
  | "future_premium_missing"
  | "future_ready"
  | "kickoff_passed_no_result"
  | "likely_finished_needs_result_check"
  | "pending_result_review"
  | "verified_missing_evaluation"
  | "complete";

type FixtureEntry = {
  fixture: RealFixtureLabFixtureView;
  derivedSignalWarning: string | null;
  evaluationStatus: FixtureSummaryStatus;
  operationalState: FixtureOperationalState;
};

type SummaryFilter =
  | "all"
  | "world_cup_active"
  | "needs_prediction"
  | "pending_result"
  | "verified_evaluated"
  | "legacy_pilot";

type SummarySection = {
  key: string;
  title: string;
  description: string;
  entries: FixtureEntry[];
};

const RESULT_CHECK_GRACE_MS = 150 * 60 * 1000;

function isWorldCupFixture(fixture: RealFixtureLabFixtureView) {
  return fixture.competitionName.toLowerCase().includes("world cup");
}

function getFixtureEvaluationStatus(entry: Pick<FixtureEntry, "fixture">): FixtureSummaryStatus {
  if (!entry.fixture.savedPrediction) {
    return "no_saved_prediction";
  }

  if (entry.fixture.savedEvaluation) {
    return "saved";
  }

  if (entry.fixture.result?.verification_status === "verified") {
    return "ready_to_persist";
  }

  if (entry.fixture.result) {
    return "waiting_verification";
  }

  return "waiting_result";
}

function getFixtureOperationalState(
  fixture: RealFixtureLabFixtureView,
  evaluationStatus: FixtureSummaryStatus,
  now: Date,
): FixtureOperationalState {
  const kickoffTime = new Date(fixture.kickoffAt).getTime();
  const nowTime = now.getTime();
  const hasVerifiedResult = fixture.result?.verification_status === "verified";

  if (hasVerifiedResult) {
    if (fixture.savedPrediction !== null && evaluationStatus !== "saved") {
      return "verified_missing_evaluation";
    }

    return "complete";
  }

  if (fixture.result !== null) {
    return "pending_result_review";
  }

  if (nowTime >= kickoffTime) {
    if (nowTime - kickoffTime >= RESULT_CHECK_GRACE_MS) {
      return "likely_finished_needs_result_check";
    }

    return "kickoff_passed_no_result";
  }

  if (fixture.latestPublicPredictionId === null) {
    return "needs_prediction";
  }

  if (fixture.latestPublicPredictionMarketCount <= 0 && !fixture.hasLatestPublicModelDetail) {
    return "future_premium_missing";
  }

  return "future_ready";
}

function getUpcomingFixturePriority(entry: FixtureEntry) {
  switch (entry.operationalState) {
    case "needs_prediction":
      return 0;
    case "future_premium_missing":
      return 1;
    case "future_ready":
      return 2;
    default:
      return 3;
  }
}

function sortUpcomingEntries(left: FixtureEntry, right: FixtureEntry) {
  const priorityDelta = getUpcomingFixturePriority(left) - getUpcomingFixturePriority(right);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  return new Date(left.fixture.kickoffAt).getTime() - new Date(right.fixture.kickoffAt).getTime();
}

function getOperationalPriority(entry: FixtureEntry) {
  switch (entry.operationalState) {
    case "likely_finished_needs_result_check":
      return 0;
    case "pending_result_review":
      return 1;
    case "kickoff_passed_no_result":
      return 2;
    case "verified_missing_evaluation":
      return 3;
    default:
      return 4;
  }
}

function sortOperationalEntries(left: FixtureEntry, right: FixtureEntry) {
  const priorityDelta = getOperationalPriority(left) - getOperationalPriority(right);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  return new Date(right.fixture.kickoffAt).getTime() - new Date(left.fixture.kickoffAt).getTime();
}

function sortLegacyEntries(left: FixtureEntry, right: FixtureEntry) {
  return new Date(right.fixture.kickoffAt).getTime() - new Date(left.fixture.kickoffAt).getTime();
}

function sortVerifiedEntries(left: FixtureEntry, right: FixtureEntry) {
  if (left.operationalState !== right.operationalState) {
    return left.operationalState === "verified_missing_evaluation" ? -1 : 1;
  }

  return new Date(right.fixture.kickoffAt).getTime() - new Date(left.fixture.kickoffAt).getTime();
}

function isOperationalNowState(state: FixtureOperationalState) {
  return (
    state === "kickoff_passed_no_result" ||
    state === "likely_finished_needs_result_check" ||
    state === "pending_result_review" ||
    state === "verified_missing_evaluation"
  );
}

function isUpcomingState(state: FixtureOperationalState) {
  return state === "needs_prediction" || state === "future_premium_missing" || state === "future_ready";
}

function isVerifiedState(state: FixtureOperationalState) {
  return state === "verified_missing_evaluation" || state === "complete";
}

export function organizeFixtureEntries(
  fixtureEntries: FixtureEntry[],
  summaryFilter: SummaryFilter,
  now: Date = new Date(),
): { primarySections: SummarySection[]; legacyEntries: FixtureEntry[] } {
  const worldCupEntries = fixtureEntries.filter((entry) => isWorldCupFixture(entry.fixture));
  const legacyEntries = fixtureEntries
    .filter((entry) => !isWorldCupFixture(entry.fixture))
    .sort(sortLegacyEntries);

  const refreshEntries = worldCupEntries.map((entry) => ({
    ...entry,
    evaluationStatus: getFixtureEvaluationStatus(entry),
    operationalState: getFixtureOperationalState(entry.fixture, getFixtureEvaluationStatus(entry), now),
  }));

  const operationalWorldCup = refreshEntries
    .filter((entry) => isOperationalNowState(entry.operationalState))
    .sort(sortOperationalEntries);
  const upcomingWorldCup = refreshEntries
    .filter((entry) => isUpcomingState(entry.operationalState))
    .sort(sortUpcomingEntries);
  const verifiedWorldCup = refreshEntries
    .filter((entry) => isVerifiedState(entry.operationalState))
    .sort(sortVerifiedEntries);

  const sectionsByFilter: Record<SummaryFilter, SummarySection[]> = {
    all: [
      {
        key: "operational",
        title: "Operational now",
        description: "World Cup fixtures that still need result follow-up or internal completion.",
        entries: operationalWorldCup,
      },
      {
        key: "upcoming",
        title: "Upcoming fixtures",
        description: "Scheduled World Cup fixtures prioritized for exact pre-kickoff operations.",
        entries: upcomingWorldCup,
      },
    ],
    world_cup_active: [
      {
        key: "operational",
        title: "Operational now",
        description: "World Cup fixtures that still need result follow-up or internal completion.",
        entries: operationalWorldCup,
      },
      {
        key: "upcoming",
        title: "Upcoming fixtures",
        description: "Scheduled World Cup fixtures prioritized for exact pre-kickoff operations.",
        entries: upcomingWorldCup,
      },
    ],
    needs_prediction: [
      {
        key: "needs_prediction",
        title: "Needs prediction",
        description: "Fixtures without a latest public prediction row yet.",
        entries: upcomingWorldCup.filter((entry) => entry.operationalState === "needs_prediction"),
      },
    ],
    pending_result: [
      {
        key: "pending_result",
        title: "Pending result follow-up",
        description: "Fixtures past kickoff or with unverified results that still need manual result handling.",
        entries: operationalWorldCup.filter(
          (entry) => entry.operationalState !== "verified_missing_evaluation",
        ),
      },
    ],
    verified_evaluated: [
      {
        key: "verified",
        title: "Verified / evaluated",
        description:
          "Verified results remain split between fixtures still missing internal evaluation and fixtures already complete.",
        entries: verifiedWorldCup,
      },
    ],
    legacy_pilot: [],
  };

  return {
    primarySections: sectionsByFilter[summaryFilter].filter((section) => section.entries.length > 0),
    legacyEntries: summaryFilter === "all" || summaryFilter === "legacy_pilot" ? legacyEntries : [],
  };
}
