export type WorldCup2026SourceAuthority = "fifa_official_schedule_pdf";

export type WorldCup2026CoverageStatus = "group_stage_complete_from_pdf_grid";

export type WorldCup2026Stage = "group_stage";

export type WorldCup2026CatalogMetadata = {
  sourceAuthority: WorldCup2026SourceAuthority;
  sourceFileName: string;
  sourceDate: string;
  catalogGeneratedAt: string;
  coverageStatus: WorldCup2026CoverageStatus;
  sourceNotes: readonly string[];
};

export type WorldCup2026Team = {
  teamKey: string;
  displayName: string;
  fifaOfficialName: string;
  slug: string;
  fifaCode: string;
  country: string;
  groupKey: string;
  aliases: readonly string[];
  apiFootballTeamId: number | null;
  notes: string | null;
};

export type WorldCup2026Group = {
  groupKey: string;
  displayName: string;
  fifaGroupCode: string;
  teamKeys: readonly string[];
};

export type WorldCup2026Venue = {
  venueKey: string;
  displayName: string;
  stadiumName: string;
  city: string;
  country: string;
  capacity: number | null;
  apiFootballVenueId: number | null;
  notes: string | null;
};

export type WorldCup2026Fixture = {
  fixtureKey: string;
  matchNumber: number;
  matchSlug: string;
  stage: WorldCup2026Stage;
  groupKey: string;
  roundLabel: string;
  kickoffDateET: string;
  kickoffTimeET: string;
  kickoffAt: string;
  timezone: string;
  homeTeamKey: string;
  awayTeamKey: string;
  homeTeamFifaCode: string;
  awayTeamFifaCode: string;
  venueKey: string;
  hostCity: string;
  hostCountry: string;
  apiFootballFixtureId: number | null;
  apiFootballExternalId: string | null;
  statusHint: string;
  sourceNotes: string;
};
