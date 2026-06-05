begin;

alter table public.matches
  drop constraint if exists matches_intake_source_check;

alter table public.matches
  add constraint matches_intake_source_check
  check (intake_source in ('mock', 'manual', 'csv_import', 'api_football'));

alter table public.match_results
  drop constraint if exists match_results_intake_source_check;

alter table public.match_results
  add constraint match_results_intake_source_check
  check (intake_source in ('mock', 'manual', 'csv_import', 'api_football'));

alter table public.matches
  alter column access_scope set default 'admin_only';

commit;
