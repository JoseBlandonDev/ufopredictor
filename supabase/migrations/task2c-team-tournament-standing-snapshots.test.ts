import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationName = readdirSync(join(process.cwd(), "supabase/migrations")).find((fileName) =>
  fileName.endsWith("_task2c_team_tournament_standing_snapshots.sql"),
);
const migration = migrationName
  ? readFileSync(join(process.cwd(), "supabase/migrations", migrationName), "utf8")
  : "";

describe("prediction intelligence v2 task2c standings migration", () => {
  it("creates the bounded standings table without raw_values and with the required scalar columns", () => {
    expect(migrationName).toBeDefined();
    expect(migration).toContain("create table if not exists public.team_tournament_standing_snapshots");
    expect(migration).toContain("source_snapshot_id text not null references public.source_snapshots(snapshot_id) on delete cascade");
    expect(migration).toContain("competition_id uuid not null references public.competitions(id) on delete restrict");
    expect(migration).toContain("season_id uuid not null references public.seasons(id) on delete restrict");
    expect(migration).toContain("stage_key text not null");
    expect(migration).toContain("group_key text not null");
    expect(migration).toContain("canonical_team_key text not null");
    expect(migration).toContain("matches_played integer not null check (matches_played >= 0)");
    expect(migration).toContain("source_reported_qualification_status text");
    expect(migration).toContain("reliability_json jsonb not null default '{}'::jsonb");
    expect(migration).not.toContain("raw_values");
  });

  it("preserves the required natural key and raw-standings arithmetic and timestamp constraints", () => {
    expect(migration).toContain("unique (source_snapshot_id, competition_id, season_id, stage_key, group_key, canonical_team_key)");
    expect(migration).toContain("check (matches_played = wins + draws + losses)");
    expect(migration).toContain("check (goal_difference = goals_for - goals_against)");
    expect(migration).toContain("check (effective_at <= captured_at and captured_at <= cutoff_at)");
    expect(migration).toContain("check (source_reported_qualification_status in ('qualified', 'eliminated'))");
  });

  it("adds the expected indexes and no-direct-read rls policy without a public mutation policy", () => {
    expect(migration).toContain("alter table public.team_tournament_standing_snapshots enable row level security");
    expect(migration).toContain('create policy "No direct reads for team tournament standing snapshots"');
    expect(migration).toContain("create index if not exists team_tournament_standing_snapshots_lookup_idx");
    expect(migration).toContain("create index if not exists team_tournament_standing_snapshots_team_idx");
    expect(migration).toContain("create index if not exists team_tournament_standing_snapshots_source_snapshot_idx");
    expect(migration).not.toContain("for insert");
    expect(migration).not.toContain("for update");
    expect(migration).not.toContain("for delete");
  });
});
