import teamDisplayNamesSource from "../../data/prediction-engine/national-team-signals/2026-06-19/team-display-names-es-en.json";

type TeamDisplayNamesSource = {
  teams: Array<{
    teamKey: string;
    databaseNameEn: string;
    displayNameEs: string;
    aliases?: string[];
  }>;
};

type TeamDisplayEntry = {
  teamKey: string;
  databaseNameEn: string;
  displayNameEs: string;
  aliases: string[];
};

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function applyPresentationOverrides(entry: TeamDisplayEntry): TeamDisplayEntry {
  switch (entry.teamKey) {
    case "cape-verde":
      return { ...entry, displayNameEs: "Cabo Verde" };
    case "united-states":
      return { ...entry, displayNameEs: "Estados Unidos" };
    default:
      return entry;
  }
}

const entries = ((teamDisplayNamesSource as TeamDisplayNamesSource).teams ?? []).map((team) =>
  applyPresentationOverrides({
    teamKey: team.teamKey,
    databaseNameEn: team.databaseNameEn,
    displayNameEs: team.displayNameEs,
    aliases: [...new Set([team.databaseNameEn, ...(team.aliases ?? [])])],
  }),
);

const displayNameByNormalizedAlias = new Map<string, string>();
const teamKeyByNormalizedAlias = new Map<string, string>();
const aliasesByTeamKey = new Map<string, Set<string>>();

for (const entry of entries) {
  const teamAliases = aliasesByTeamKey.get(entry.teamKey) ?? new Set<string>();

  for (const alias of [...entry.aliases, entry.displayNameEs]) {
    const normalizedAlias = normalizeName(alias);
    if (!normalizedAlias) {
      continue;
    }

    displayNameByNormalizedAlias.set(normalizedAlias, entry.displayNameEs);
    teamKeyByNormalizedAlias.set(normalizedAlias, entry.teamKey);
    teamAliases.add(normalizedAlias);
  }

  aliasesByTeamKey.set(entry.teamKey, teamAliases);
}

export function normalizePredictionReviewTeamName(value: string) {
  return normalizeName(value);
}

export function resolvePredictionReviewTeamDisplayNameEs(nameEn: string) {
  return displayNameByNormalizedAlias.get(normalizeName(nameEn)) ?? nameEn;
}

export function arePredictionReviewTeamNamesEquivalent(leftName: string, rightName: string) {
  const leftKey = teamKeyByNormalizedAlias.get(normalizeName(leftName));
  const rightKey = teamKeyByNormalizedAlias.get(normalizeName(rightName));

  if (leftKey && rightKey) {
    return leftKey === rightKey;
  }

  return normalizeName(leftName) === normalizeName(rightName);
}
