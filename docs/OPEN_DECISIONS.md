# Open Decisions - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Recently closed decisions

### Premium Prediction Detail MVP v1 scope

Decision: closed. Premium v1 is match-detail only and uses a protected public-safe projection. It includes expected goals, top scorelines, BTTS, Over/Under 2.5, confidence/risk. It does not include payments, checkout, full subscription management, factors/narrative v2, or `/predictions` premium expansion.

### Free probable score policy

Decision: closed. Registered-free users do not see or fetch probable score before result verification. After verified result, probable score may be shown as post-match reference. Premium/admin access remains through premium projection.

### Publish queue operational bypass

Decision: closed. `/admin/real-fixture-publish-queue` is the current admin-only publication path while Real Fixture Lab exact-detail remains unstable.

### Payment gateway direction

Decision: Wompi sandbox is implemented for the `world-cup-pass` MVP. Production activation remains open pending production keys, webhook URL, final COP price, and smoke test.

G06B note: entitlement activation has a backend binding layer for admin/manual grants. G05B adds the verified Wompi webhook path into the same ledger/materialization model instead of creating a parallel premium system.

## Open decisions

### TM01 Torneo Mundialista export schema

Status: open. Proposed direction: admin-only JSON export from UFO Predictor using public-safe prediction fields.

Questions: final schema version, export date range controls, whether CSV is also needed, where the export button lives, and how Torneo imports the file.

### Torneo Mundialista reveal policy

Status: open. UFO can export a complete public-safe package; Torneo decides display policy.

Open questions: show only 1X2 before user pick, reveal exact score after user pick, reveal top scorelines after pick deadline, and show post-match comparison between user/group/global/UFO.

Recommended default: do not show exact UFO score before a user submits a pick unless intentionally approved for acquisition/marketing.

### Real Fixture Lab cleanup

Status: open. `/admin/real-fixture-lab` and exact-detail routes still hit `RangeError: Maximum call stack size exceeded`. Decide whether to refactor the Lab into smaller modules, keep it read-only, or replace most operations with focused queues.

### Post-match premium demo v2

Status: open. Should registered-free users see full premium model detail after a verified result? This could demonstrate premium value without giving pre-match edge.

### Next prediction batch cadence

Status: open. Current target should maintain a useful rolling runway, approximately 8-12 active/upcoming fixtures. Decide whether to publish by next 2 days, next 7 days, matchday window, or manual fixture selection.

### Scoreline calibration review

Status: open. Recent examples show direction can be correct while exact scoreline remains conservative or tail outcomes can be larger than likely scorelines. Decide whether to review scoreline tail/extreme-goal calibration.

### Venue/stadium metadata

Status: open. Provider venue fields are not yet trusted/implemented for public display.

### Signal refresh strategy

Status: open. Cadence and boundaries for refreshing model inputs remain undecided.

### Epic G payment/entitlement decisions

Status: partially narrowed. Sandbox Wompi checkout and webhook activation exist for `world-cup-pass`; production remains open. `subscriptions` still does not authorize premium access by itself.
