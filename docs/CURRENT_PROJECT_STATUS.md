# UFO Predictor — Current Project Status

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

## Executive summary

UFO Predictor is now in a stronger MVP 1 World Cup Launch state.

The product no longer has only one proof-of-path fixture. It now has four real World Cup fixtures published publicly, with MVP 1 fallback signals active and a working exact refresh path for already-public predictions.

Public fixtures now visible:

| Match | API-Football fixture | Public state | Notes |
|---|---|---|---|
| Mexico vs South Africa | `api-football:fixture:1489369` | public | Refreshed after fallback signals. |
| South Korea vs Czech Republic | `api-football:fixture:1538999` | public | Refreshed after fallback signals. |
| Canada vs Bosnia & Herzegovina | `api-football:fixture:1539000` | public | Published with fallback active. |
| USA vs Paraguay | `api-football:fixture:1489370` | public | Published with fallback active. |

This is still not broad publication, batch publication, or automatic publication. The flow remains intentionally controlled, exact-fixture, and admin-operated. Humanity continues to be supervised, which seems wise.

## Recently merged PRs

### PR #58 — Public launch surface real-fixture safe

Result:

- public surface cleaned for MVP 1 launch;
- homepage moved away from internal release-note tone;
- `/predictions` focused on real World Cup public fixtures;
- legacy/mock public leakage reduced through launch-safe filtering;
- navbar/session-aware CTA cleanup completed;
- Google auth follow-up PRs were already merged into `main` and incorporated before later work.

### PR #61 — E07 next World Cup fixture publication

Result:

- MVP 1 fallback signals added for immediate World Cup fixtures;
- exact admin refresh for already-public API-Football fixtures implemented;
- migration `0030_real_fixture_lab_public_refresh_rls.sql` added and applied manually;
- Mexico and South Korea public predictions refreshed;
- Canada and USA fixtures published with fallback signals active;
- public views verified to show latest public predictions.

## Current public prediction surface

`/predictions` now shows four real World Cup fixtures:

- Mexico vs South Africa;
- South Korea vs Czech Republic;
- Canada vs Bosnia & Herzegovina;
- USA vs Paraguay.

Each public card currently shows:

- 1X2 probabilities;
- confidence;
- risk;
- match date/time;
- basic safe explanatory copy.

Current public product does **not** expose:

- `prediction_results`;
- raw internal Lab payloads;
- provider predictions;
- betting odds;
- admin-only fixtures;
- service-role-only data.

## Current Real Fixture Lab state

Real Fixture Lab supports:

- loading exact API-Football fixtures;
- saving internal `internal_lab` predictions;
- publishing one exact `admin_only` fixture manually;
- loading an already-public exact fixture for admin refresh;
- appending a replacement `public_product` prediction row for already-public fixtures.

The public refresh path is exact and admin-only. It does not batch anything, does not consume odds, and does not mutate `prediction_results`.

## Current migration state

Important runtime publication migrations:

- `0029_manual_publication_match_access_scope_rpc.sql`
- `0030_real_fixture_lab_public_refresh_rls.sql`

`0029` remains the stable match access publication path:

```text
admin_only scheduled API-Football match
-> RPC flips matches.access_scope to public
```

`0030` enables exact admin refresh of already-public scheduled API-Football public-product fixtures:

```text
public scheduled API-Football match
-> admin Real Fixture Lab can load exact row
-> refresh creates new internal evidence + new public_product row
```

Supabase migrations are still applied manually in SQL Editor. `0030` was applied manually and validated by loading/refeshing public fixtures. No applied migrations were edited.

## Current model state

Active model:

- `v0.2-prelaunch`

MVP 1 fallback signals now cover:

- Mexico;
- South Africa;
- South Korea / Korea Republic;
- Czech Republic / Czechia;
- Canada;
- Bosnia & Herzegovina / Bosnia and Herzegovina;
- USA / United States;
- Paraguay.

Purpose:

- prevent default-signal collapse;
- make immediate World Cup predictions differentiated;
- keep launch operations deterministic and reviewable.

Important limitation:

- Scoreline generation still tends too conservatively toward `1-1`.
- The fallback file is still a pragmatic MVP 1 bridge, not a fully live real-data model.
- Future enrichment should use real sources with provenance, not vibes wearing a jersey.

## Current MVP status

### MVP 0

Complete.

- D05/D06/D07/D08A complete.
- Real-data internal loop proved.
- 5-fixture friendly pilot completed.

### MVP 1

Active / public launch baseline established.

Completed:

- public surface cleanup;
- exact World Cup ingest;
- manual publication;
- exact public refresh;
- four real public fixtures.

Immediate next:

- access tiers for prediction detail;
- probable score visibility decision;
- scoreline calibration plan;
- real signal enrichment plan;
- result verification after first fixtures finish.

## Current risks and debts

### Access-tier clarity

The product needs a clearer value ladder:

- anonymous users;
- registered-free users;
- future premium users.

Current public 1X2 is useful, but if every valuable detail becomes public, registration and premium lose meaning. Astounding revelation: people rarely pay for what they already get free.

### Scoreline visibility

Probable score exists in Lab payloads and public prediction payloads, but public UI currently emphasizes 1X2. Need a decision:

- show probable score publicly;
- show it only to registered users;
- reserve it for premium;
- expose top scorelines only in premium.

### Scoreline calibration

The model still leans too often toward `1-1`. Future work should inspect:

- expected goals;
- scoreline probability distribution;
- how team edge influences low-score outcomes;
- calibration against real results.

### Real signal enrichment

Static fallback is acceptable for MVP 1 launch, but next model maturity should consider:

- FIFA ranking snapshots;
- Elo-style ratings;
- recent form;
- attack/defense features;
- source/provenance dates;
- DB-backed team strength snapshots.

### Result verification

Once matches finish:

- ingest/verify actual result;
- keep `prediction_results` internal;
- decide which real-result facts are shown publicly;
- avoid public performance claims until there is enough sample size.

## Current no-go list

Do not do these without explicit approval:

- broad World Cup apply;
- broad friendlies apply;
- automatic publication;
- batch publication;
- service-role in app routes;
- public `prediction_results`;
- provider predictions;
- betting odds as hidden model input;
- payment implementation outside a defined Epic G slice;
- large model rewrite without planned calibration scope;
- editing already-applied migrations.

## Recommended next branch

```bash
git checkout main
git pull origin main
git status --short
git checkout -b feature/e09-access-tiers-prediction-detail
git status --short
git branch --show-current
```

## Recommended next recognition prompt theme

Next work should not start with implementation.

Recognition should answer:

1. What public prediction payload is already available to `/predictions` and `/matches/[slug]`?
2. Can probable score be displayed without exposing `prediction_results`?
3. What should anonymous vs free-auth vs premium see?
4. Are new views/migrations needed, or only UI/query changes?
5. How can the MVP 1 value ladder be improved without implementing payments?
