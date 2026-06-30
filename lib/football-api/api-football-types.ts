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

export type ProviderFixtureScore = {
  halftime: ProviderScore;
  fulltime: ProviderScore;
  extratime: ProviderScore;
  penalty: ProviderScore;
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
  score: ProviderFixtureScore;
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

export type FetchFixtureRoundsParams = {
  leagueId: number;
  season: number;
  current?: boolean;
  dates?: boolean;
  timezone?: string;
};

export type ProviderApiPaging = {
  current: number | null;
  total: number | null;
};

export type ProviderApiRequestDiagnostics = {
  endpoint: string;
  query: Record<string, string>;
  results: number | null;
  errors: string[];
  paging: ProviderApiPaging | null;
};

export type ProviderFixtureRoundsResult = {
  rounds: string[];
  diagnostics: ProviderApiRequestDiagnostics;
};
