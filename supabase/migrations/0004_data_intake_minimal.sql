alter table public.matches
add column intake_source text not null default 'mock'
  check (intake_source in ('mock', 'manual', 'csv_import')),
add column data_quality text not null default 'unreviewed'
  check (data_quality in ('unreviewed', 'reviewed', 'verified', 'rejected')),
add column source_note text,
add column reviewed_at timestamptz,
add column reviewed_by uuid references auth.users(id) on delete set null;

create index matches_intake_source_idx on public.matches (intake_source);
create index matches_data_quality_idx on public.matches (data_quality);

create table public.match_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  home_goals integer not null check (home_goals >= 0),
  away_goals integer not null check (away_goals >= 0),
  verification_status text not null default 'pending_review'
    check (verification_status in ('pending_review', 'verified', 'rejected')),
  intake_source text not null default 'manual'
    check (intake_source in ('mock', 'manual', 'csv_import')),
  source_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now()
);

create index match_results_match_id_idx on public.match_results (match_id);
create index match_results_verification_status_idx on public.match_results (verification_status);
create index match_results_intake_source_idx on public.match_results (intake_source);

alter table public.match_results enable row level security;

create policy "Authenticated users may read verified match results"
on public.match_results
for select
to authenticated
using (verification_status = 'verified');

create policy "Admins may read all match results"
on public.match_results
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins may insert match results"
on public.match_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins may update match results"
on public.match_results
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins may delete match results"
on public.match_results
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);
