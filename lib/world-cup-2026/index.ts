import { WORLD_CUP_2026_FIXTURES } from "./canonical-fixtures";
import { WORLD_CUP_2026_GROUPS } from "./canonical-groups";
import { WORLD_CUP_2026_TEAMS } from "./canonical-teams";
import { WORLD_CUP_2026_VENUES } from "./canonical-venues";
import type { WorldCup2026CatalogMetadata } from "./types";

export * from "./canonical-fixtures";
export * from "./canonical-groups";
export * from "./canonical-teams";
export * from "./canonical-venues";
export * from "./types";

export const WORLD_CUP_2026_CATALOG_METADATA = {
  sourceAuthority: "fifa_official_schedule_pdf",
  sourceFileName: "FWC26 Match Schedule_v17_10042026_EN.pdf",
  sourceDate: "2026-06-30",
  catalogGeneratedAt: "2026-06-30T12:00:00.000000Z",
  coverageStatus: "round_of_32_complete_from_verified_schedule_and_provider",
  sourceNotes: [
    "Extracted from the uploaded FIFA match schedule PDF grid dated 10 April 2026.",
    "The PDF states all times are Eastern Time (ET) and the schedule is subject to change.",
    "This source file captures the 72 group-stage fixtures, 48 teams, 12 groups, and 16 host venues/host cities from the PDF grid.",
    "Round of 32 fixtures 73 through 88 use the official FIFA schedule rows plus the verified 2026-06-30 operator-captured API-Football participant identities and fixture ids.",
    "API-Football IDs are included only where UFO Predictor has already verified/publicly used them.",
  ],
} as const satisfies WorldCup2026CatalogMetadata;

export const WORLD_CUP_2026_CATALOG = {
  metadata: WORLD_CUP_2026_CATALOG_METADATA,
  teams: WORLD_CUP_2026_TEAMS,
  groups: WORLD_CUP_2026_GROUPS,
  venues: WORLD_CUP_2026_VENUES,
  fixtures: WORLD_CUP_2026_FIXTURES,
} as const;
