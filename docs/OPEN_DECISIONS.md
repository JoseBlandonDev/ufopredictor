# UFO Predictor — Open Decisions

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

## Recently settled decisions

### How should a selected internal prediction become public?

Decision: use a manual admin publication bridge.

Current contract:

- selected `internal_lab` prediction is copied into a `public_product` prediction version;
- the internal row is left untouched;
- the selected match is flipped from `admin_only` to `public`;
- no `prediction_results` are exposed;
- no batch publication.

Runtime-proven access-scope flip:

- use RPC `publish_real_fixture_match_access_scope(target_match_id, target_match_slug)` from `0029_manual_publication_match_access_scope_rpc.sql`.

### Should already-public fixtures be refreshable after model/fallback updates?

Decision: yes, through exact admin refresh only.

Current contract:

- only exact API-Football public fixtures can be refreshed;
- refresh creates new `internal_lab` evidence;
- refresh appends a new replacement `public_product` row;
- old public rows remain as history/audit;
- `matches.access_scope` remains `public`;
- no `prediction_results` exposure.

Runtime-proven RLS support:

- migration `0030_real_fixture_lab_public_refresh_rls.sql`.

### Should app routes use service-role for publication or refresh?

Decision: no.

The app keeps normal authenticated server client behavior and uses admin checks/RLS/RPCs rather than service-role in routes.

### Should broad World Cup apply be enabled now?

Decision: no.

World Cup apply remains exact-fixture only.

### Should v0.2-prelaunch be changed immediately?

Decision: no large rewrite.

MVP 1 fallback signals were expanded for immediate launch teams, but the active model remains `v0.2-prelaunch`. Further scoreline/model calibration requires a dedicated epic.

### What should happen to public mock/previews?

Decision: do not mix legacy/mock rows into the main launch-safe public prediction surface.

The public prediction surface now focuses on real World Cup fixtures. Mocks/previews should stay out of the primary public launch UX unless explicitly separated/labeled in a future design.

### Which second fixture should be published?

Superseded.

The product now has four real public fixtures:

- Mexico vs South Africa;
- South Korea vs Czech Republic;
- Canada vs Bosnia & Herzegovina;
- USA vs Paraguay.

## Immediate open decisions

### E09 — What should each access tier see?

Need define the product value ladder.

Candidate direction:

| Tier | Candidate visibility |
|---|---|
| Anonymous | 1X2 probabilities, confidence/risk, basic match info. |
| Free authenticated | probable score, short interpretation, watchlist/following. |
| Future premium | top scorelines, BTTS, Over/Under, expanded signals/explanation, model movement/history. |

Open questions:

- Is probable score enough value to require login?
- Should exact score remain premium-only?
- Should BTTS/O-U be premium-only?
- Should registered-free users see only one probable score and no top 3?
- How should “premium unavailable yet” be messaged without looking broken?

### Should probable score be visible publicly?

Current state:

- Lab shows probable score/top scorelines.
- Public cards/details currently emphasize 1X2, confidence, and risk.

Options:

1. Keep probable score hidden from anonymous users.
2. Show probable score to free authenticated users only.
3. Show probable score publicly but reserve top scorelines for premium.
4. Reserve all scoreline information for premium.

Recommendation:

- Keep 1X2 public.
- Use probable score as free-authenticated value.
- Reserve top scorelines / BTTS / Over-Under for premium future.

This gives people a reason to register and eventually pay, a shocking concept in product design.

### How should “confidence” be framed when 1X2 is close?

Current issue:

- Some fixtures show relatively high confidence while 1X2 probabilities remain close.
- Users may interpret confidence as certainty unless copy is careful.

Open direction:

- define confidence as confidence in model/input quality, not certainty of outcome;
- keep risk label visible;
- add better interpretation copy in public detail.

### How should scoreline generation be calibrated?

Current issue:

- model differentiates fixtures better after fallback expansion;
- scoreline generation still tends too much toward `1-1`.

Future work:

- inspect expected-goals logic;
- inspect scoreline probability distribution;
- test how team-power differences affect scorelines;
- avoid over-marketing exact score.

### How should real data enrichment work?

Current fallback is static/repo-local.

Future options:

1. keep static fallback but expand carefully;
2. add DB-backed team strength snapshots;
3. ingest/maintain FIFA/Elo-style rankings;
4. add recent form/attack/defense;
5. add provenance/source dates.

Open decision:

- which source is authoritative enough for MVP 1.5;
- whether data lives in repo or DB;
- how often it updates;
- how to avoid hidden odds/provider predictions.

### Should public predictions have DB-native lineage?

Current state:

- no `source_prediction_version_id`;
- no `metadata_json`;
- no `source_note` on `prediction_versions`.

Open decision:

- add lineage field in a future migration;
- or keep operational/manual evidence for MVP 1.

Recommendation:

- defer if launch pressure is high;
- add before broader/batch publication or automation.

### Payment provider and tournament pass

Still open.

Constraints:

- do not assume Stripe;
- PayPal or another selected/available gateway is preferred for MVP 1 exploration;
- World Cup monetization should start with a one-time tournament pass or package;
- recurring subscriptions are post-World-Cup unless there is a clear reason.

## Medium-term open decisions

### Workers / automation

Manual flow works for exact fixtures. Automation is still future.

Open questions:

- when to automate exact fixture refresh;
- how to avoid broad writes;
- how to schedule pre-match publication windows;
- whether workers should only prepare drafts and leave publication manual.

### Result/evaluation public transparency

`prediction_results` is internal-only today.

Open questions:

- when and how to show public historical accuracy;
- what aggregation level is safe;
- whether public accuracy should wait for enough real World Cup sample size;
- how to show final match results publicly without exposing internal evaluation rows.

### Model feature expansion

Current `v0.2-prelaunch` uses static fallback signals for launch-window teams.

Future possible sources:

- stronger team ratings/Elo;
- roster/injury/lineup context;
- recent competitive form;
- market benchmarks as comparison only, not hidden input;
- venue/travel context.

Decision remains: no large model rewrite during MVP 1 launch unless explicitly planned.

## Closed historical decisions retained for context

- D06 friendly pilot completed with 5 evaluated fixtures.
- D07 activated `v0.2-prelaunch` and froze it.
- Real Fixture Lab remains admin/internal.
- Provider predictions and betting odds remain outside current model input.
- Payments are not implemented.
