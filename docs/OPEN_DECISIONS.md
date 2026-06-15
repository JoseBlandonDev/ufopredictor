# Open Decisions - UFO Predictor

_Last refreshed: post PR #77 Premium Prediction Detail MVP / Real Fixture Lab Ops Summary, after latest World Cup result batch verification._

## Recently closed decisions

### Premium Prediction Detail MVP v1 scope

Decision: closed. Premium v1 is match-detail only and uses a protected public-safe projection. It includes expected goals, top scorelines, BTTS, Over/Under 2.5, confidence/risk. It does not include payments, checkout, full subscription management, factors/narrative v2, or `/predictions` premium expansion.

### Free probable score policy

Decision: closed. Registered-free users do not see or fetch probable score before result verification. After verified result, probable score may be shown as post-match reference. Premium/admin access remains through premium projection.

### Real Fixture Lab as ops dashboard

Decision: closed. Real Fixture Lab is the current operational queue for World Cup fixtures/results, including latest public prediction status, result state, evaluation state, and ops state.

## Open decisions

### TM01 Torneo Mundialista export schema

Status: open. Proposed direction: admin-only JSON export from UFO Predictor / Real Fixture Lab.

Questions: final schema version, export date range controls, whether CSV is also needed, where the export button lives, and how Torneo imports the file.

### Torneo Mundialista reveal policy

Status: open. UFO can export a complete public-safe package; Torneo decides display policy.

Open questions: show only 1X2 before user pick, reveal exact score after user pick, reveal top scorelines after pick deadline, and show post-match comparison between user/group/global/UFO.

Recommended default: do not show exact UFO score before a user submits a pick unless intentionally approved for acquisition/marketing.

### Post-match premium demo v2

Status: open. Should registered-free users see full premium model detail after a verified result? This could demonstrate premium value without giving pre-match edge.

### Next prediction batch cadence

Status: open. Publish by next 2 days, next 7 days, matchday window, or manual fixture selection?

### Scoreline calibration review

Status: open. Recent examples show direction can be correct while exact scoreline remains conservative, e.g. Sweden 5-1 Tunisia. Decide whether to review scoreline tail/extreme-goal calibration.

### Venue/stadium metadata

Status: open. Provider venue fields are not yet trusted/implemented for public display.

### Signal refresh strategy

Status: open. Cadence and boundaries for refreshing model inputs remain undecided.

### Epic G payment/entitlement decisions

Status: open and parallel. Payment provider, entitlement model, plans/pricing, and premium gate shell remain Epic G work.
