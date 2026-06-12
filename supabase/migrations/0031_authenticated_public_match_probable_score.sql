-- E09A
-- Authenticated-only probable score boundary for latest public product match detail.
-- This exposes only the latest public_product most_likely_score for one exact public match.
-- It does not expose top_scores_json, prediction_markets, narratives, internal_lab rows,
-- prediction_results, provider content, or any broader prediction payload.

create or replace function public.get_authenticated_public_match_probable_score(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_most_likely_score text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  select pv.most_likely_score
  into v_most_likely_score
  from public.matches m
  join public.competitions c
    on c.id = m.competition_id
  join public.prediction_versions pv
    on pv.match_id = m.id
  where m.id = p_match_id
    and m.access_scope = 'public'
    and c.usage_scope = 'public_product'
    and pv.run_scope = 'public_product'
  order by pv.created_at desc, pv.id desc
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'most_likely_score', v_most_likely_score
  );
end;
$$;

revoke all on function public.get_authenticated_public_match_probable_score(uuid) from public;
revoke all on function public.get_authenticated_public_match_probable_score(uuid) from anon;
revoke all on function public.get_authenticated_public_match_probable_score(uuid) from authenticated;
grant execute on function public.get_authenticated_public_match_probable_score(uuid) to authenticated;
