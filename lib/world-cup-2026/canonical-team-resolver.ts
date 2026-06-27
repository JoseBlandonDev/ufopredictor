import { WORLD_CUP_2026_TEAMS } from "./canonical-teams";

type WorldCup2026TeamKey = (typeof WORLD_CUP_2026_TEAMS)[number]["teamKey"];

const TEAM_BY_KEY = new Map(WORLD_CUP_2026_TEAMS.map((team) => [team.teamKey, team] as const));

function normalizeWorldCupTeamAlias(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function buildAliasIndex() {
  const aliasToTeamKey = new Map<string, WorldCup2026TeamKey | null>();

  for (const team of WORLD_CUP_2026_TEAMS) {
    const aliases = [team.teamKey, team.displayName, team.fifaOfficialName, team.fifaCode, ...team.aliases];

    for (const alias of aliases) {
      const normalizedAlias = normalizeWorldCupTeamAlias(alias);
      if (!normalizedAlias) {
        continue;
      }

      const existing = aliasToTeamKey.get(normalizedAlias);
      aliasToTeamKey.set(
        normalizedAlias,
        existing && existing !== team.teamKey ? null : team.teamKey,
      );
    }
  }

  return aliasToTeamKey;
}

const WORLD_CUP_2026_TEAM_ALIAS_TO_KEY = buildAliasIndex();

export function resolveWorldCup2026TeamKey(name: string): WorldCup2026TeamKey | null {
  return WORLD_CUP_2026_TEAM_ALIAS_TO_KEY.get(normalizeWorldCupTeamAlias(name)) ?? null;
}

export function isWorldCup2026TeamNameMatch(teamKey: WorldCup2026TeamKey, name: string): boolean {
  return resolveWorldCup2026TeamKey(name) === teamKey;
}

export function getWorldCup2026TeamDisplayName(teamKey: WorldCup2026TeamKey): string {
  const team = TEAM_BY_KEY.get(teamKey);
  if (!team) {
    throw new Error(`Unknown canonical World Cup team key: ${teamKey}`);
  }

  return team.displayName;
}
