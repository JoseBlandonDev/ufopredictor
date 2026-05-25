-- Development/staging sample data only. This seed intentionally creates no auth users.

insert into public.competitions (id, external_id, name, slug, country, type)
values (
  '00000000-0000-4000-8000-000000000001',
  'mock-world-cup-2026',
  'Mundial 2026',
  'world-cup-2026',
  null,
  'international'
)
on conflict (slug) do update set
  name = excluded.name,
  external_id = excluded.external_id,
  type = excluded.type;

insert into public.seasons (id, competition_id, name, year, starts_at, ends_at)
values (
  '00000000-0000-4000-8000-000000000011',
  (select id from public.competitions where slug = 'world-cup-2026'),
  '2026',
  2026,
  '2026-06-11',
  '2026-07-19'
)
on conflict (competition_id, year) do update set
  name = excluded.name,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at;

insert into public.teams (id, external_id, name, slug, country, fifa_rank, elo_rating)
values
  ('00000000-0000-4000-8000-000000000101', 'mock-colombia', 'Colombia', 'colombia', 'Colombia', 12, 1858),
  ('00000000-0000-4000-8000-000000000102', 'mock-portugal', 'Portugal', 'portugal', 'Portugal', 6, 1939),
  ('00000000-0000-4000-8000-000000000103', 'mock-japan', 'Japón', 'japan', 'Japan', 18, 1794),
  ('00000000-0000-4000-8000-000000000104', 'mock-mexico', 'México', 'mexico', 'Mexico', 14, 1812)
on conflict (slug) do update set
  name = excluded.name,
  external_id = excluded.external_id,
  country = excluded.country,
  fifa_rank = excluded.fifa_rank,
  elo_rating = excluded.elo_rating;

insert into public.venues (id, external_id, name, city, country, capacity)
values
  ('00000000-0000-4000-8000-000000000201', 'mock-metlife', 'MetLife Stadium', 'New York/New Jersey', 'USA', 82500),
  ('00000000-0000-4000-8000-000000000202', 'mock-att', 'AT&T Stadium', 'Dallas', 'USA', 80000)
on conflict (external_id) do update set
  name = excluded.name,
  city = excluded.city,
  country = excluded.country,
  capacity = excluded.capacity;

insert into public.matches (
  id,
  external_id,
  slug,
  competition_id,
  season_id,
  home_team_id,
  away_team_id,
  venue_id,
  kickoff_at,
  stage,
  status
)
values
  (
    '00000000-0000-4000-8000-000000000301',
    'mock-colombia-portugal',
    'colombia-vs-portugal',
    (select id from public.competitions where slug = 'world-cup-2026'),
    (select id from public.seasons where competition_id = (select id from public.competitions where slug = 'world-cup-2026') and year = 2026),
    (select id from public.teams where slug = 'colombia'),
    (select id from public.teams where slug = 'portugal'),
    (select id from public.venues where external_id = 'mock-metlife'),
    '2026-06-18T20:00:00Z',
    'Fase de grupos',
    'scheduled'
  ),
  (
    '00000000-0000-4000-8000-000000000302',
    'mock-japan-mexico',
    'japan-vs-mexico',
    (select id from public.competitions where slug = 'world-cup-2026'),
    (select id from public.seasons where competition_id = (select id from public.competitions where slug = 'world-cup-2026') and year = 2026),
    (select id from public.teams where slug = 'japan'),
    (select id from public.teams where slug = 'mexico'),
    (select id from public.venues where external_id = 'mock-att'),
    '2026-06-19T01:00:00Z',
    'Fase de grupos',
    'scheduled'
  )
on conflict (slug) do update set
  kickoff_at = excluded.kickoff_at,
  venue_id = excluded.venue_id,
  stage = excluded.stage,
  status = excluded.status;

insert into public.plans (id, name, slug, description, price, currency, billing_type, is_active)
values
  ('00000000-0000-4000-8000-000000001001', 'Gratis', 'free', 'Señal diaria básica para revisar partidos de forma casual.', 0, 'USD', 'free', true),
  ('00000000-0000-4000-8000-000000001002', 'World Cup Pass', 'world-cup-pass', 'Análisis premium para todos los partidos del Mundial 2026.', 29, 'USD', 'one_time', true),
  ('00000000-0000-4000-8000-000000001003', 'Pack de 10 partidos', '10-match-pack', 'Desbloquea lecturas premium para diez partidos seleccionados.', 12, 'USD', 'custom_pack', true),
  ('00000000-0000-4000-8000-000000001004', 'Pase fase eliminatoria', 'knockout-pass', 'Preparado para activarse en fases eliminatorias.', 18, 'USD', 'one_time', false),
  ('00000000-0000-4000-8000-000000001005', 'Pase por selección', 'team-pass', 'Sigue una selección durante todo el torneo.', 9, 'USD', 'one_time', false),
  ('00000000-0000-4000-8000-000000001006', 'Premium mensual', 'premium-monthly', 'Acceso mensual futuro para ligas después del Mundial.', 15, 'USD', 'monthly', false)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  currency = excluded.currency,
  billing_type = excluded.billing_type,
  is_active = excluded.is_active;

insert into public.plan_features (plan_id, feature_key, feature_value)
values
  ((select id from public.plans where slug = 'free'), 'basic_1x2', '{"included": true}'::jsonb),
  ((select id from public.plans where slug = 'free'), 'short_summary', '{"included": true}'::jsonb),
  ((select id from public.plans where slug = 'world-cup-pass'), 'competition_scope', '{"competition_slug": "world-cup-2026"}'::jsonb),
  ((select id from public.plans where slug = 'world-cup-pass'), 'golden_hour_delta', '{"included": true}'::jsonb),
  ((select id from public.plans where slug = 'world-cup-pass'), 'model_vs_market', '{"included": true}'::jsonb),
  ((select id from public.plans where slug = '10-match-pack'), 'matches_limit', '{"limit": 10}'::jsonb),
  ((select id from public.plans where slug = 'knockout-pass'), 'stage_scope', '{"stage": "knockout"}'::jsonb),
  ((select id from public.plans where slug = 'team-pass'), 'team_scope', '{"teams_limit": 1}'::jsonb),
  ((select id from public.plans where slug = 'premium-monthly'), 'monthly_access', '{"included": true}'::jsonb)
on conflict (plan_id, feature_key) do update set
  feature_value = excluded.feature_value;

insert into public.model_versions (id, version, description, weights_json, is_active)
values (
  '00000000-0000-4000-8000-000000002001',
  'v0.1',
  'Statistical model contract for development data; calculations are not implemented in this epic.',
  '{
    "rating_score": 0.25,
    "recent_form_score": 0.20,
    "attack_score": 0.15,
    "defense_score": 0.15,
    "market_score": 0.15,
    "lineup_context_score": 0.10
  }'::jsonb,
  true
)
on conflict (version) do update set
  description = excluded.description,
  weights_json = excluded.weights_json,
  is_active = excluded.is_active;

insert into public.prediction_versions (
  id,
  match_id,
  model_version_id,
  prediction_type,
  home_win_prob,
  draw_prob,
  away_win_prob,
  expected_home_goals,
  expected_away_goals,
  most_likely_score,
  top_scores_json,
  confidence_score,
  risk_level
)
values (
  '00000000-0000-4000-8000-000000002101',
  (select id from public.matches where slug = 'colombia-vs-portugal'),
  (select id from public.model_versions where version = 'v0.1'),
  'post_lineup',
  25,
  27,
  48,
  1.05,
  1.48,
  '1-1',
  '[{"score": "1-1", "probability": 12.2}, {"score": "1-2", "probability": 10.8}, {"score": "0-1", "probability": 9.7}]'::jsonb,
  62,
  'medium'
)
on conflict (id) do nothing;

insert into public.prediction_markets (
  id,
  prediction_version_id,
  market,
  selection,
  probability,
  confidence,
  is_premium
)
values
  ('00000000-0000-4000-8000-000000002201', '00000000-0000-4000-8000-000000002101', 'match_winner', 'Portugal', 48, 62, false),
  ('00000000-0000-4000-8000-000000002202', '00000000-0000-4000-8000-000000002101', 'over_2_5', 'over', 49, 62, true),
  ('00000000-0000-4000-8000-000000002203', '00000000-0000-4000-8000-000000002101', 'btts', 'yes', 53, 62, true),
  ('00000000-0000-4000-8000-000000002204', '00000000-0000-4000-8000-000000002101', 'exact_score', '1-1', 12.2, 62, true)
on conflict (id) do nothing;

insert into public.prediction_narratives (
  id,
  prediction_version_id,
  locale,
  free_summary,
  premium_analysis,
  why_it_changed,
  risk_notes
)
values (
  '00000000-0000-4000-8000-000000002301',
  '00000000-0000-4000-8000-000000002101',
  'es',
  'Portugal llega con una ventaja estrecha del modelo, pero el empate sigue siendo relevante.',
  'Análisis de muestra para desarrollo local. No representa una recomendación de apuesta.',
  'La actualización mock refleja el contexto de alineaciones del prototipo.',
  'Predicción probabilística de muestra con nivel de riesgo medio.'
)
on conflict (prediction_version_id, locale) do update set
  free_summary = excluded.free_summary,
  premium_analysis = excluded.premium_analysis,
  why_it_changed = excluded.why_it_changed,
  risk_notes = excluded.risk_notes;

insert into public.worker_runs (
  id,
  worker_name,
  status,
  started_at,
  finished_at,
  records_processed,
  error_message,
  metadata_json
)
values
  (
    '00000000-0000-4000-8000-000000003001',
    'sync-fixtures',
    'success',
    '2026-06-18T10:00:00Z',
    '2026-06-18T10:00:08Z',
    48,
    null,
    '{"provider": "mock", "competition": "world-cup-2026"}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000003002',
    'sync-odds',
    'failed',
    '2026-06-18T11:00:00Z',
    '2026-06-18T11:00:04Z',
    0,
    'Mock provider timeout',
    '{"provider": "mock", "retryable": true}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000003003',
    'generate-narrative',
    'queued',
    '2026-06-18T19:03:00Z',
    null,
    0,
    null,
    '{"llmProvider": "mock", "locale": "es/en"}'::jsonb
  )
on conflict (id) do nothing;
