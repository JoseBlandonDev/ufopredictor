with internal_lab_market_seed (
  id,
  prediction_version_id,
  market,
  selection,
  probability,
  confidence,
  is_premium
) as (
  values
    (
      '00000000-0000-4000-8000-000000012201'::uuid,
      '00000000-0000-4000-8000-000000012101'::uuid,
      'btts',
      'yes',
      53::numeric,
      57::numeric,
      false
    ),
    (
      '00000000-0000-4000-8000-000000012202'::uuid,
      '00000000-0000-4000-8000-000000012101'::uuid,
      'btts',
      'no',
      47::numeric,
      57::numeric,
      false
    ),
    (
      '00000000-0000-4000-8000-000000012203'::uuid,
      '00000000-0000-4000-8000-000000012101'::uuid,
      'over_2_5',
      'over',
      51::numeric,
      57::numeric,
      false
    ),
    (
      '00000000-0000-4000-8000-000000012204'::uuid,
      '00000000-0000-4000-8000-000000012101'::uuid,
      'over_2_5',
      'under',
      49::numeric,
      57::numeric,
      false
    ),
    (
      '00000000-0000-4000-8000-000000012205'::uuid,
      '00000000-0000-4000-8000-000000012102'::uuid,
      'btts',
      'yes',
      46::numeric,
      54::numeric,
      false
    ),
    (
      '00000000-0000-4000-8000-000000012206'::uuid,
      '00000000-0000-4000-8000-000000012102'::uuid,
      'btts',
      'no',
      54::numeric,
      54::numeric,
      false
    ),
    (
      '00000000-0000-4000-8000-000000012207'::uuid,
      '00000000-0000-4000-8000-000000012102'::uuid,
      'over_2_5',
      'over',
      44::numeric,
      54::numeric,
      false
    ),
    (
      '00000000-0000-4000-8000-000000012208'::uuid,
      '00000000-0000-4000-8000-000000012102'::uuid,
      'over_2_5',
      'under',
      56::numeric,
      54::numeric,
      false
    )
)
insert into public.prediction_markets (
  id,
  prediction_version_id,
  market,
  selection,
  probability,
  confidence,
  is_premium
)
select
  seeded.id,
  seeded.prediction_version_id,
  seeded.market,
  seeded.selection,
  seeded.probability,
  seeded.confidence,
  seeded.is_premium
from internal_lab_market_seed seeded
join public.prediction_versions pv
  on pv.id = seeded.prediction_version_id
 and pv.run_scope = 'internal_lab'
join public.matches m
  on m.id = pv.match_id
 and m.access_scope = 'lab_only'
join public.competitions c
  on c.id = m.competition_id
 and c.usage_scope = 'internal_lab'
on conflict (id) do update set
  prediction_version_id = excluded.prediction_version_id,
  market = excluded.market,
  selection = excluded.selection,
  probability = excluded.probability,
  confidence = excluded.confidence,
  is_premium = excluded.is_premium;
