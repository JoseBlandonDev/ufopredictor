alter table public.match_results
  add column if not exists decision_method text not null default 'ft',
  add column if not exists regulation_home_goals integer,
  add column if not exists regulation_away_goals integer,
  add column if not exists after_extra_time_home_goals integer,
  add column if not exists after_extra_time_away_goals integer,
  add column if not exists penalty_home_goals integer,
  add column if not exists penalty_away_goals integer,
  add column if not exists advancing_team_id uuid references public.teams(id);

update public.match_results
set
  regulation_home_goals = home_goals,
  regulation_away_goals = away_goals
where
  decision_method = 'ft'
  and regulation_home_goals is null
  and regulation_away_goals is null
  and after_extra_time_home_goals is null
  and after_extra_time_away_goals is null
  and penalty_home_goals is null
  and penalty_away_goals is null
  and advancing_team_id is null;

alter table public.match_results
  drop constraint if exists match_results_decision_method_check;

alter table public.match_results
  add constraint match_results_decision_method_check
  check (decision_method in ('ft', 'aet', 'pen'));

alter table public.match_results
  drop constraint if exists match_results_home_goals_nonnegative;

alter table public.match_results
  add constraint match_results_home_goals_nonnegative
  check (home_goals >= 0);

alter table public.match_results
  drop constraint if exists match_results_away_goals_nonnegative;

alter table public.match_results
  add constraint match_results_away_goals_nonnegative
  check (away_goals >= 0);

alter table public.match_results
  drop constraint if exists match_results_regulation_home_goals_nonnegative;

alter table public.match_results
  add constraint match_results_regulation_home_goals_nonnegative
  check (regulation_home_goals is null or regulation_home_goals >= 0);

alter table public.match_results
  drop constraint if exists match_results_regulation_away_goals_nonnegative;

alter table public.match_results
  add constraint match_results_regulation_away_goals_nonnegative
  check (regulation_away_goals is null or regulation_away_goals >= 0);

alter table public.match_results
  drop constraint if exists match_results_after_extra_time_home_goals_nonnegative;

alter table public.match_results
  add constraint match_results_after_extra_time_home_goals_nonnegative
  check (after_extra_time_home_goals is null or after_extra_time_home_goals >= 0);

alter table public.match_results
  drop constraint if exists match_results_after_extra_time_away_goals_nonnegative;

alter table public.match_results
  add constraint match_results_after_extra_time_away_goals_nonnegative
  check (after_extra_time_away_goals is null or after_extra_time_away_goals >= 0);

alter table public.match_results
  drop constraint if exists match_results_penalty_home_goals_nonnegative;

alter table public.match_results
  add constraint match_results_penalty_home_goals_nonnegative
  check (penalty_home_goals is null or penalty_home_goals >= 0);

alter table public.match_results
  drop constraint if exists match_results_penalty_away_goals_nonnegative;

alter table public.match_results
  add constraint match_results_penalty_away_goals_nonnegative
  check (penalty_away_goals is null or penalty_away_goals >= 0);

create or replace function public.is_supported_world_cup_knockout_stage(stage_label text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select lower(trim(coalesce(stage_label, ''))) in (
    'round of 32',
    'round of 16',
    'quarter finals',
    'quarter final',
    'semi finals',
    'semi final',
    'third place',
    'final'
  );
$$;

create or replace function public.can_admin_insert_real_fixture_lab_manual_result(
  target_match_id uuid,
  target_home_goals integer,
  target_away_goals integer,
  target_verification_status text,
  target_intake_source text,
  target_source_note text,
  target_reviewed_at timestamptz,
  target_reviewed_by uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_real_fixture_lab_admin()
    and public.can_admin_access_real_fixture_lab_reconciliation_match(target_match_id)
    and target_verification_status = 'pending_review'
    and target_intake_source = 'manual'
    and target_home_goals between 0 and 20
    and target_away_goals between 0 and 20
    and nullif(btrim(coalesce(target_source_note, '')), '') is not null
    and target_reviewed_at is null
    and target_reviewed_by is null
    and not exists (
      select 1
      from public.match_results
      where match_results.match_id = target_match_id
    )
    and exists (
      select 1
      from public.matches
      where matches.id = target_match_id
        and not public.is_supported_world_cup_knockout_stage(matches.stage)
    );
$$;

create or replace function public.enforce_structured_match_result_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
begin
  select *
  into v_match
  from public.matches
  where id = new.match_id;

  if not found then
    raise exception 'match_results.match_id must reference an existing match'
      using errcode = '23503';
  end if;

  if new.decision_method = 'ft' then
    new.regulation_home_goals := coalesce(new.regulation_home_goals, new.home_goals);
    new.regulation_away_goals := coalesce(new.regulation_away_goals, new.away_goals);
    new.after_extra_time_home_goals := null;
    new.after_extra_time_away_goals := null;
    new.penalty_home_goals := null;
    new.penalty_away_goals := null;

    if new.regulation_home_goals is null or new.regulation_away_goals is null then
      raise exception 'FT match_results require regulation score fields'
        using errcode = '23514';
    end if;

    if new.home_goals <> new.regulation_home_goals then
      raise exception 'FT match_results.home_goals must equal regulation_home_goals'
        using errcode = '23514';
    end if;

    if new.away_goals <> new.regulation_away_goals then
      raise exception 'FT match_results.away_goals must equal regulation_away_goals'
        using errcode = '23514';
    end if;

    if new.after_extra_time_home_goals is not null
      or new.after_extra_time_away_goals is not null
      or new.penalty_home_goals is not null
      or new.penalty_away_goals is not null
    then
      raise exception 'FT match results cannot store extra-time or penalty score fields'
        using errcode = '23514';
    end if;
  elsif new.decision_method = 'aet' then
    if new.after_extra_time_home_goals is not null and new.home_goals <> new.after_extra_time_home_goals then
      raise exception 'AET match_results.home_goals must equal after_extra_time_home_goals'
        using errcode = '23514';
    end if;

    if new.after_extra_time_away_goals is not null and new.away_goals <> new.after_extra_time_away_goals then
      raise exception 'AET match_results.away_goals must equal after_extra_time_away_goals'
        using errcode = '23514';
    end if;

    if new.penalty_home_goals is not null or new.penalty_away_goals is not null then
      raise exception 'AET match results cannot store penalty score fields'
        using errcode = '23514';
    end if;

    if new.verification_status = 'verified' then
      if new.regulation_home_goals is null or new.regulation_away_goals is null then
        raise exception 'Verified AET results require regulation score fields'
          using errcode = '23514';
      end if;

      if new.regulation_home_goals <> new.regulation_away_goals then
        raise exception 'Verified AET results require a drawn regulation score'
          using errcode = '23514';
      end if;

      if new.after_extra_time_home_goals is null or new.after_extra_time_away_goals is null then
        raise exception 'Verified AET results require after-extra-time score fields'
          using errcode = '23514';
      end if;

      if new.after_extra_time_home_goals < new.regulation_home_goals
        or new.after_extra_time_away_goals < new.regulation_away_goals
      then
        raise exception 'Verified AET results cannot reduce regulation goals after extra time'
          using errcode = '23514';
      end if;

      if new.home_goals <> new.after_extra_time_home_goals
        or new.away_goals <> new.after_extra_time_away_goals
      then
        raise exception 'Verified AET results must keep terminal goals aligned with after-extra-time scoring'
          using errcode = '23514';
      end if;

      if new.home_goals = new.away_goals then
        raise exception 'Verified AET results cannot end with a drawn football score'
          using errcode = '23514';
      end if;

      if new.advancing_team_id is null then
        raise exception 'Verified AET results require an advancing_team_id'
          using errcode = '23514';
      end if;
    end if;
  elsif new.decision_method = 'pen' then
    if new.after_extra_time_home_goals is not null and new.home_goals <> new.after_extra_time_home_goals then
      raise exception 'PEN match_results.home_goals must equal after_extra_time_home_goals when present'
        using errcode = '23514';
    end if;

    if new.after_extra_time_away_goals is not null and new.away_goals <> new.after_extra_time_away_goals then
      raise exception 'PEN match_results.away_goals must equal after_extra_time_away_goals when present'
        using errcode = '23514';
    end if;

    if new.verification_status = 'verified' then
      if new.regulation_home_goals is null or new.regulation_away_goals is null then
        raise exception 'Verified PEN results require regulation score fields'
          using errcode = '23514';
      end if;

      if new.regulation_home_goals <> new.regulation_away_goals then
        raise exception 'Verified PEN results require a drawn regulation score'
          using errcode = '23514';
      end if;

      if new.after_extra_time_home_goals is null or new.after_extra_time_away_goals is null then
        raise exception 'Verified PEN results require after-extra-time score fields'
          using errcode = '23514';
      end if;

      if new.after_extra_time_home_goals < new.regulation_home_goals
        or new.after_extra_time_away_goals < new.regulation_away_goals
      then
        raise exception 'Verified PEN results cannot reduce regulation goals after extra time'
          using errcode = '23514';
      end if;

      if new.home_goals <> new.after_extra_time_home_goals
        or new.away_goals <> new.after_extra_time_away_goals
      then
        raise exception 'Verified PEN results must keep terminal football goals aligned with after-extra-time scoring'
          using errcode = '23514';
      end if;

      if new.home_goals <> new.away_goals then
        raise exception 'Verified PEN results must keep the terminal football score as a draw'
          using errcode = '23514';
      end if;

      if new.penalty_home_goals is null or new.penalty_away_goals is null then
        raise exception 'Verified PEN results require penalty score fields'
          using errcode = '23514';
      end if;

      if new.penalty_home_goals = new.penalty_away_goals then
        raise exception 'Verified PEN results cannot store an equal penalty score'
          using errcode = '23514';
      end if;

      if new.advancing_team_id is null then
        raise exception 'Verified PEN results require an advancing_team_id'
          using errcode = '23514';
      end if;
    end if;
  end if;

  if new.advancing_team_id is not null and new.advancing_team_id not in (v_match.home_team_id, v_match.away_team_id) then
    raise exception 'advancing_team_id must belong to the match home or away team'
      using errcode = '23514';
  end if;

  if new.decision_method = 'pen'
    and new.advancing_team_id is not null
    and new.penalty_home_goals is not null
    and new.penalty_away_goals is not null
  then
    if new.penalty_home_goals > new.penalty_away_goals and new.advancing_team_id <> v_match.home_team_id then
      raise exception 'advancing_team_id must agree with the higher penalty score'
        using errcode = '23514';
    end if;

    if new.penalty_away_goals > new.penalty_home_goals and new.advancing_team_id <> v_match.away_team_id then
      raise exception 'advancing_team_id must agree with the higher penalty score'
        using errcode = '23514';
    end if;
  end if;

  if new.decision_method = 'aet'
    and new.advancing_team_id is not null
    and new.home_goals <> new.away_goals
  then
    if new.home_goals > new.away_goals and new.advancing_team_id <> v_match.home_team_id then
      raise exception 'advancing_team_id must agree with the terminal football score'
        using errcode = '23514';
    end if;

    if new.away_goals > new.home_goals and new.advancing_team_id <> v_match.away_team_id then
      raise exception 'advancing_team_id must agree with the terminal football score'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_structured_match_result_consistency on public.match_results;

create trigger enforce_structured_match_result_consistency
before insert or update on public.match_results
for each row
execute function public.enforce_structured_match_result_consistency();

create or replace view public.public_match_details
with (security_barrier = true)
as
select
  matches.slug as match_slug,
  matches.kickoff_at,
  matches.stage,
  matches.status,
  competitions.name as competition_name,
  competitions.slug as competition_slug,
  home_teams.name as home_team_name,
  home_teams.slug as home_team_slug,
  home_teams.logo_url as home_team_logo_url,
  home_teams.flag_url as home_team_flag_url,
  away_teams.name as away_team_name,
  away_teams.slug as away_team_slug,
  away_teams.logo_url as away_team_logo_url,
  away_teams.flag_url as away_team_flag_url,
  venues.name as venue_name,
  venues.city as venue_city,
  matches.id as match_id,
  competitions.id as competition_id,
  case
    when competitions.slug = 'world-cup-2026' then 'world_cup_2026'
    else replace(lower(competitions.slug), '-', '_')
  end as competition_access_key,
  home_teams.id as home_team_id,
  away_teams.id as away_team_id,
  verified_result.home_goals as verified_home_goals,
  verified_result.away_goals as verified_away_goals,
  verified_result.verification_status as result_verification_status,
  verified_result.decision_method as result_decision_method,
  verified_result.regulation_home_goals as verified_regulation_home_goals,
  verified_result.regulation_away_goals as verified_regulation_away_goals,
  verified_result.after_extra_time_home_goals as verified_after_extra_time_home_goals,
  verified_result.after_extra_time_away_goals as verified_after_extra_time_away_goals,
  verified_result.penalty_home_goals as verified_penalty_home_goals,
  verified_result.penalty_away_goals as verified_penalty_away_goals,
  verified_result.advancing_team_id as verified_advancing_team_id,
  advancing_team.name as verified_advancing_team_name
from public.matches
join public.competitions
  on competitions.id = matches.competition_id
join public.teams as home_teams
  on home_teams.id = matches.home_team_id
join public.teams as away_teams
  on away_teams.id = matches.away_team_id
left join public.venues
  on venues.id = matches.venue_id
left join lateral (
  select
    match_results.home_goals,
    match_results.away_goals,
    match_results.decision_method,
    match_results.regulation_home_goals,
    match_results.regulation_away_goals,
    match_results.after_extra_time_home_goals,
    match_results.after_extra_time_away_goals,
    match_results.penalty_home_goals,
    match_results.penalty_away_goals,
    match_results.advancing_team_id,
    match_results.verification_status
  from public.match_results
  where match_results.match_id = matches.id
    and match_results.verification_status = 'verified'
  order by
    match_results.reviewed_at desc nulls last,
    match_results.recorded_at desc,
    match_results.id desc
  limit 1
) as verified_result
  on true
left join public.teams as advancing_team
  on advancing_team.id = verified_result.advancing_team_id
where matches.access_scope = 'public'
  and competitions.usage_scope = 'public_product';

create or replace view public.public_prediction_summaries
with (security_barrier = true)
as
select distinct on (matches.slug)
  matches.slug as match_slug,
  matches.kickoff_at,
  matches.stage,
  matches.status,
  competitions.name as competition_name,
  competitions.slug as competition_slug,
  home_teams.name as home_team_name,
  home_teams.slug as home_team_slug,
  home_teams.logo_url as home_team_logo_url,
  home_teams.flag_url as home_team_flag_url,
  away_teams.name as away_team_name,
  away_teams.slug as away_team_slug,
  away_teams.logo_url as away_team_logo_url,
  away_teams.flag_url as away_team_flag_url,
  venues.name as venue_name,
  venues.city as venue_city,
  prediction_versions.created_at as prediction_created_at,
  prediction_versions.home_win_prob,
  prediction_versions.draw_prob,
  prediction_versions.away_win_prob,
  prediction_versions.confidence_score,
  prediction_versions.risk_level,
  verified_result.home_goals as verified_home_goals,
  verified_result.away_goals as verified_away_goals,
  verified_result.verification_status as result_verification_status,
  verified_result.decision_method as result_decision_method,
  verified_result.regulation_home_goals as verified_regulation_home_goals,
  verified_result.regulation_away_goals as verified_regulation_away_goals,
  verified_result.after_extra_time_home_goals as verified_after_extra_time_home_goals,
  verified_result.after_extra_time_away_goals as verified_after_extra_time_away_goals,
  verified_result.penalty_home_goals as verified_penalty_home_goals,
  verified_result.penalty_away_goals as verified_penalty_away_goals,
  verified_result.advancing_team_id as verified_advancing_team_id,
  advancing_team.name as verified_advancing_team_name
from public.matches
join public.competitions
  on competitions.id = matches.competition_id
join public.teams as home_teams
  on home_teams.id = matches.home_team_id
join public.teams as away_teams
  on away_teams.id = matches.away_team_id
left join public.venues
  on venues.id = matches.venue_id
left join lateral (
  select
    match_results.home_goals,
    match_results.away_goals,
    match_results.decision_method,
    match_results.regulation_home_goals,
    match_results.regulation_away_goals,
    match_results.after_extra_time_home_goals,
    match_results.after_extra_time_away_goals,
    match_results.penalty_home_goals,
    match_results.penalty_away_goals,
    match_results.advancing_team_id,
    match_results.verification_status
  from public.match_results
  where match_results.match_id = matches.id
    and match_results.verification_status = 'verified'
  order by
    match_results.reviewed_at desc nulls last,
    match_results.recorded_at desc,
    match_results.id desc
  limit 1
) as verified_result
  on true
left join public.teams as advancing_team
  on advancing_team.id = verified_result.advancing_team_id
join public.prediction_versions
  on prediction_versions.match_id = matches.id
where matches.access_scope = 'public'
  and competitions.usage_scope = 'public_product'
  and prediction_versions.run_scope = 'public_product'
order by matches.slug, prediction_versions.created_at desc, prediction_versions.id desc;
