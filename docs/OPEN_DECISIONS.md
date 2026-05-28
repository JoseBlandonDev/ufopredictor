# OPEN DECISIONS — UFO Predictor

_Last updated: post PR #26 / C05 Gate 1 Registered Free Value Wall_

## Closed/updated decisions

### D01 — Codex prompt format

Decision: use separate blocks.

- `EJECUCIÓN RECOMENDADA` is for the user.
- `PROMPT LIMPIO PARA CODEX` is the copyable Codex prompt.

Do not put the model/tool recommendation inside the same copyable prompt block.

### D02 — User funnel

Decision:

```text
Anonymous → Registered Free → World Cup premium packages → post-World Cup monthly subscriptions
```

No separate `beta/free expanded` plan exists.

### D03 — Registered Free

Decision: Registered Free is permanent and exists before, during, and after the World Cup. Access previews may vary by product phase.

### D04 — World Cup premium monetization

Decision: World Cup monetization should use packages/passes/unlocks rather than monthly subscriptions as the first premium motion.

Candidate products:

- Full World Cup Pass
- 10 Match Pack
- Single Match Unlock
- Country/Team Pass
- Group Pass
- Stage Pass

### D05 — Post-World Cup subscriptions

Decision: monthly subscriptions are expected after the World Cup for recurring American/European league coverage.

### D06 — Stage access

Decision: stage authorization must use canonical server-derived `stageAccessKey`, for example `competitionId:stage`. Do not authorize by loose stage strings like `semifinal`.

### D07 — Match packs

Decision: `quantity` / `match_pack` does not grant direct content access. Actual access should materialize as explicit `user_match_unlocks` or equivalent server-side grants.

### D08 — Beta grants

Decision: `trustedBetaFreeMatchIds` must be server-side trusted context, never client/query param input.

### D09 — Current public UI language

Decision: current public UI should remain Spanish. Future i18n EN/ES is planned, but not implemented. Internal canonical data/keys should prefer English.

## Still open

### O01 — C05 Gate 2 data boundary

- Does anonymous keep full 1X2?
- What does Registered Free unlock beyond messaging?
- What is reserved for World Cup packages?
- Is SQL/RLS required?

### O02 — C05 Gate 3 capture foundation

- Which data is captured first: favorites, watchlist, preferences, or events?
- Do we implement first-party analytics or keep it minimal?

### O03 — Premium projection pattern

- View vs RPC vs server-only query.
- How to integrate access decision before returning premium payload.

### O04 — Trust Score eligibility

- Which predictions count publicly?
- What model version/date becomes Trust-Eligible?
- How to separate Beta Calibration from production Trust metrics?

### O05 — Sports API provider

Provider/cost/coverage decision is still open.
