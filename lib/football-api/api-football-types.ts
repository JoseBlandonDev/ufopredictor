export type ProviderFixtureStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "cancelled"
  | "abandoned"
  | "unknown";

export type ProviderCompetition = {
  providerCompetitionId: number;
  name: string;
  country: string | null;
  season: number | null;
  round: string | null;
};

export type ProviderTeam = {
  providerTeamId: number;
  name: string;
  winner: boolean | null;
};

export type ProviderScore = {
  home: number | null;
  away: number | null;
};

export type ProviderFixture = {
  provider: "api-football";
  providerFixtureId: number;
  kickoffAt: string;
  timezone: string | null;
  status: ProviderFixtureStatus;
  statusShort: string;
  elapsedMinutes: number | null;
  competition: ProviderCompetition;
  homeTeam: ProviderTeam;
  awayTeam: ProviderTeam;
  goals: ProviderScore;
};

export type FetchFixturesByLeagueParams = {
  leagueId: number;
  season: number;
  from?: string;
  to?: string;
  status?: string;
};

export type ProviderLeague = {
  providerLeagueId: number;
  name: string;
  type: string | null;
  country: string | null;
  countryCode: string | null;
  seasonYears: number[];
};

export type FetchLeaguesParams = {
  country?: string;
  search?: string;
  season?: number;
  id?: number;
};
