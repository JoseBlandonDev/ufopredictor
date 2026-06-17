# Data Dictionary - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Core concepts

### `public_product`

Prediction run scope used for public product surfaces. Public pages and premium projection should use latest public-safe `public_product` rows only.

### `internal_lab`

Internal/admin prediction run scope. Used for admin evidence and evaluation. Must not be used as runtime fallback for public pages.

### `prediction_versions`

Stores prediction output fields such as 1X2 probabilities, expected goals, most likely score, top scorelines JSON, confidence score, and risk level.

### `prediction_markets`

Stores market-style rows such as `btts`, `over_2_5`, `exact_score`, and `match_winner`. RLS/read paths may hide direct counts in some admin summary contexts; premium model detail readiness can still be derived from the protected RPC.

### `model_detail`

Public-safe premium model detail block returned by `get_premium_match_projection`.

Conceptual normalized shape:

```ts
type PremiumModelDetail = {
  expectedGoals: { home: number; away: number } | null
  topScorelines: Array<{ score: string; probability: number }>
  bothTeamsToScore: { yesProbability: number; noProbability: number } | null
  totalGoals25: { overProbability: number; underProbability: number } | null
  confidence: { score: number | null; riskLevel: string | null } | null
}
```

### Probable score

The most likely scoreline. It is premium-sensitive before result verification. Registered-free users only fetch/see it after verified result.

### `subscriptions`

Commercial/status record for a user's relationship to a plan. In G06B it can be created or updated by an admin/manual activation, but it is not an authorization source by itself.

### `user_entitlements`

Effective premium authorization for global or resource-scoped access, such as global premium or a competition/world-cup pass. Premium resolvers should use current, unexpired rows here when deciding whether to reveal protected model detail.

### `user_match_unlocks`

Effective premium authorization for a single match. Premium resolvers should use current, unexpired rows here when deciding whether to reveal protected model detail for that match.

### `entitlement_grants`

Audit and idempotency ledger for entitlement activation. G06B uses it for manual admin grants and revocations; future verified payment events should write through the same binding instead of creating a parallel premium system.

### Verified result

Public-safe final score after admin verification. It can be displayed publicly without exposing internal evaluation details.

### Internal evaluation

Admin-only evaluation of prediction correctness after verified result. It must not be exposed in public product payloads.

### Real fixture publish queue

Admin-only operational queue at `/admin/real-fixture-publish-queue`. It reads minimal fixture/prediction status and reuses existing actions to save internal predictions and publish public products. It is not a public data source and must not render raw payloads.

## Torneo Mundialista export payload - planned

Planned V0 is a JSON package exported by an admin from UFO Predictor.

Conceptual shape:

```ts
type TorneoUfoExport = {
  schemaVersion: "torneo-ufo-export-v1"
  generatedAt: string
  source: "ufo_predictor"
  sourceAppUrl: string
  competition: "world-cup-2026"
  range: { from: string; to: string }
  displayGuidance: {
    defaultTeaser: "show_1x2_probabilities_and_link"
    exactScoreRecommendedReveal: "after_user_pick_or_pick_deadline"
    topScorelinesRecommendedReveal: "after_user_pick_or_pick_deadline"
    postMatchUse: "comparison_and_learning"
  }
  fixtures: Array<{
    externalId: string
    fixtureId: number
    slug: string
    ufoUrl: string
    kickoffAt: string
    homeTeam: string
    awayTeam: string
    prediction: {
      homeWinProbability: number
      drawProbability: number
      awayWinProbability: number
      confidenceScore: number | null
      riskLevel: "low" | "medium" | "high" | null
      mostLikelyScore: string | null
      expectedGoals: { home: number; away: number } | null
      topScorelines: Array<{ score: string; probability: number }>
      bothTeamsToScore: { yesProbability: number; noProbability: number } | null
      totalGoals25: { overProbability: number; underProbability: number } | null
    }
  }>
}
```

This payload must not include `prediction_results`, raw evaluation internals, raw Lab payloads, service-role-only data, odds, provider predictions, payment data, or Torneo human picks as UFO model inputs.
