import type { MatchRow } from "@/types/database";
import type { ProviderFixtureStatus } from "@/lib/football-api/api-football-types";

export type FixtureStatusMapping =
  | {
      action: "persist";
      status: MatchRow["status"];
    }
  | {
      action: "skip";
      reason: "unknown_status";
    };

export function mapProviderFixtureStatus(
  status: ProviderFixtureStatus,
): FixtureStatusMapping {
  switch (status) {
    case "scheduled":
      return { action: "persist", status: "scheduled" };
    case "live":
      return { action: "persist", status: "live" };
    case "halftime":
      return { action: "persist", status: "live" };
    case "finished":
      return { action: "persist", status: "finished" };
    case "postponed":
      return { action: "persist", status: "postponed" };
    case "cancelled":
      return { action: "persist", status: "cancelled" };
    case "abandoned":
      return { action: "persist", status: "cancelled" };
    case "unknown":
    default:
      return { action: "skip", reason: "unknown_status" };
  }
}
