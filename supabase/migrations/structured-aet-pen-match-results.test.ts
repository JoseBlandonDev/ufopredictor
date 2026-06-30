import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationName = readdirSync(join(process.cwd(), "supabase/migrations")).find((fileName) =>
  fileName.endsWith("_structured_aet_pen_match_results.sql"),
);
const migration = migrationName
  ? readFileSync(join(process.cwd(), "supabase/migrations", migrationName), "utf8")
  : "";

describe("structured AET/PEN match results migration", () => {
  it("backfills only legacy FT rows that have not been structurally initialized", () => {
    expect(migrationName).toBeDefined();
    expect(migration).toContain("update public.match_results");
    expect(migration).toContain("regulation_home_goals = home_goals");
    expect(migration).toContain("regulation_away_goals = away_goals");
    expect(migration).toContain("decision_method = 'ft'");
    expect(migration).toContain("regulation_home_goals is null");
    expect(migration).toContain("regulation_away_goals is null");
    expect(migration).toContain("after_extra_time_home_goals is null");
    expect(migration).toContain("after_extra_time_away_goals is null");
    expect(migration).toContain("penalty_home_goals is null");
    expect(migration).toContain("penalty_away_goals is null");
    expect(migration).toContain("advancing_team_id is null");
    expect(migration).not.toContain("decision_method = 'ft',");
    expect(migration).not.toContain("after_extra_time_home_goals = null");
    expect(migration).not.toContain("penalty_home_goals = null");
  });

  it("automatically normalizes legacy FT writes inside the protected trigger", () => {
    expect(migration).toContain("new.regulation_home_goals := coalesce(new.regulation_home_goals, new.home_goals)");
    expect(migration).toContain("new.regulation_away_goals := coalesce(new.regulation_away_goals, new.away_goals)");
    expect(migration).toContain("new.after_extra_time_home_goals := null");
    expect(migration).toContain("new.after_extra_time_away_goals := null");
    expect(migration).toContain("new.penalty_home_goals := null");
    expect(migration).toContain("new.penalty_away_goals := null");
    expect(migration).toContain("FT match_results.home_goals must equal regulation_home_goals");
    expect(migration).toContain("FT match_results.away_goals must equal regulation_away_goals");
  });

  it("keeps verified AET/PEN rows structurally constrained without inventing missing fields", () => {
    expect(migration).toContain("Verified AET results require a drawn regulation score");
    expect(migration).toContain("Verified AET results require after-extra-time score fields");
    expect(migration).toContain("Verified AET results cannot reduce regulation goals after extra time");
    expect(migration).toContain("Verified PEN results require a drawn regulation score");
    expect(migration).toContain("Verified PEN results require after-extra-time score fields");
    expect(migration).toContain("Verified PEN results cannot reduce regulation goals after extra time");
    expect(migration).toContain("Verified PEN results require penalty score fields");
    expect(migration).toContain("advancing_team_id must agree with the higher penalty score");
    expect(migration).toContain("advancing_team_id must agree with the terminal football score");
  });

  it("keeps existing verified-result columns ahead of the new structured result fields in both public views", () => {
    const publicMatchDetailsStart = migration.indexOf("create or replace view public.public_match_details");
    const publicPredictionSummariesStart = migration.indexOf("create or replace view public.public_prediction_summaries");

    expect(publicMatchDetailsStart).toBeGreaterThanOrEqual(0);
    expect(publicPredictionSummariesStart).toBeGreaterThanOrEqual(0);

    const publicMatchDetailsSql = migration.slice(
      publicMatchDetailsStart,
      publicPredictionSummariesStart,
    );
    const publicPredictionSummariesSql = migration.slice(publicPredictionSummariesStart);

    for (const viewSql of [publicMatchDetailsSql, publicPredictionSummariesSql]) {
      const verifiedHomeGoalsIndex = viewSql.indexOf("verified_result.home_goals as verified_home_goals");
      const verifiedAwayGoalsIndex = viewSql.indexOf("verified_result.away_goals as verified_away_goals");
      const resultVerificationStatusIndex = viewSql.indexOf(
        "verified_result.verification_status as result_verification_status",
      );

      expect(verifiedHomeGoalsIndex).toBeGreaterThanOrEqual(0);
      expect(verifiedAwayGoalsIndex).toBeGreaterThan(verifiedHomeGoalsIndex);
      expect(resultVerificationStatusIndex).toBeGreaterThan(verifiedAwayGoalsIndex);

      for (const structuredColumn of [
        "verified_result.decision_method as result_decision_method",
        "verified_result.regulation_home_goals as verified_regulation_home_goals",
        "verified_result.regulation_away_goals as verified_regulation_away_goals",
        "verified_result.after_extra_time_home_goals as verified_after_extra_time_home_goals",
        "verified_result.after_extra_time_away_goals as verified_after_extra_time_away_goals",
        "verified_result.penalty_home_goals as verified_penalty_home_goals",
        "verified_result.penalty_away_goals as verified_penalty_away_goals",
        "verified_result.advancing_team_id as verified_advancing_team_id",
        "advancing_team.name as verified_advancing_team_name",
      ]) {
        expect(viewSql.indexOf(structuredColumn)).toBeGreaterThan(resultVerificationStatusIndex);
      }
    }
  });
});
