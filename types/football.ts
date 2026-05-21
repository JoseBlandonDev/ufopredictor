export type MatchStatus = "scheduled" | "live" | "finished";
export type PredictionStatus = "pre-match" | "post-lineup" | "pre-kickoff";

export type Team = {
  id: string;
  name: string;
  slug: string;
  country: string;
  flag: string;
  fifaRank: number;
  eloRating: number;
};

export type Competition = {
  id: string;
  name: string;
  slug: string;
  season: string;
};

export type Match = {
  id: string;
  slug: string;
  competition: Competition;
  stage: string;
  venue: string;
  city: string;
  kickoffAt: string;
  status: MatchStatus;
  predictionStatus: PredictionStatus;
  homeTeam: Team;
  awayTeam: Team;
  isPremium: boolean;
  betaStatus: "ready" | "review" | "needs-data";
};
