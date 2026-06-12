import type { TeamPredictionInput } from "./types";
import { resolveNationalTeamSnapshotSignals } from "./national-team-strength-snapshots";

type NationalTeamFallbackSignals = NonNullable<TeamPredictionInput["signals"]>;

export function resolveNationalTeamFallbackSignals(
  team: Pick<TeamPredictionInput, "name">,
): NationalTeamFallbackSignals | undefined {
  return resolveNationalTeamSnapshotSignals(team);
}
