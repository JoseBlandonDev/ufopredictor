import type { ProviderCompetition } from "@/lib/football-api/api-football-types";

function slugifyPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function toSlugPart(value: string): string {
  const slug = slugifyPart(value);
  return slug.length > 0 ? slug : "unknown";
}

export function buildCompetitionSlug(competition: ProviderCompetition): string {
  const nameSlug = toSlugPart(competition.name);
  const countrySlug = competition.country ? toSlugPart(competition.country) : "";
  const includesCountry =
    countrySlug.length > 0 && (nameSlug === countrySlug || nameSlug.startsWith(`${countrySlug}-`));
  const base = countrySlug && !includesCountry ? `${countrySlug}-${nameSlug}` : nameSlug;

  if (typeof competition.season === "number") {
    return `${base}-${competition.season}`;
  }

  return base;
}

export function buildMatchSlug(input: {
  competitionSlug: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  internalIdSuffix?: string;
}): string {
  const kickoffDate = input.kickoffAt.slice(0, 10);
  const base = [
    input.competitionSlug,
    toSlugPart(input.homeTeamName),
    "vs",
    toSlugPart(input.awayTeamName),
    kickoffDate,
  ].join("-");

  if (input.internalIdSuffix) {
    return `${base}-${toSlugPart(input.internalIdSuffix)}`;
  }

  return base;
}
