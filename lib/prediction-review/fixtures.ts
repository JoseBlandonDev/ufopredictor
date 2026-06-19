function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const RETAINED_FIXTURE_KEYS = new Set([
  "germany::ivory-coast",
  "ecuador::curacao",
  "belgium::iran",
  "france::iraq",
  "portugal::uzbekistan",
  "colombia::congo-dr",
]);

function canonicalTeamKey(value: string) {
  const normalized = normalizeKey(value);

  switch (normalized) {
    case "curaçao":
    case "curacao":
      return "curacao";
    case "dr-congo":
    case "congo-dr":
    case "rd-congo":
      return "congo-dr";
    case "cote-divoire":
    case "ivory-coast":
      return "ivory-coast";
    default:
      return normalized;
  }
}

export function isRetainedPredictionReviewFixture(homeTeamName: string, awayTeamName: string) {
  const homeKey = canonicalTeamKey(homeTeamName);
  const awayKey = canonicalTeamKey(awayTeamName);

  return (
    RETAINED_FIXTURE_KEYS.has(`${homeKey}::${awayKey}`) ||
    RETAINED_FIXTURE_KEYS.has(`${awayKey}::${homeKey}`)
  );
}
