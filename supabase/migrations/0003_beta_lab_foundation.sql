alter table public.competitions
add column usage_scope text not null default 'public_product'
  check (usage_scope in ('public_product', 'internal_lab'));

create index competitions_usage_scope_idx on public.competitions (usage_scope);

alter table public.matches
add column access_scope text not null default 'public'
  check (access_scope in ('public', 'premium', 'admin_only', 'lab_only')),
add column lab_status text
  check (lab_status is null or lab_status in ('candidate', 'ready', 'review', 'needs_data', 'archived')),
add constraint matches_lab_status_requires_lab_only
  check (lab_status is null or access_scope = 'lab_only');

create index matches_access_scope_idx on public.matches (access_scope);
create index matches_lab_status_idx on public.matches (lab_status)
where lab_status is not null;

alter table public.prediction_versions
add column run_scope text not null default 'public_product'
  check (run_scope in ('public_product', 'internal_lab'));

create index prediction_versions_run_scope_idx on public.prediction_versions (run_scope);
