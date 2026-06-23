# Open Decisions - UFO Predictor

_Last refreshed: 2026-06-22._

## Decisions already made

- stage and production remain separate Supabase projects;
- stage users/auth are independent;
- no Docker dependency for Task 3B;
- Task 3B begins read-only;
- production writes remain denied;
- v2 probability candidate is conservative and near parity;
- v2 analysis/scenario layer is the main product gain;
- scenario cards are not three outcome-covering guesses;
- canonical identity is locale-neutral;
- Spanish is immediate, English is first-class-ready;
- official venue data replaces `Por definir` when known.

## Task 3B decisions still required

### Migration reconciliation

After the read-only audit:

- apply repository chain as-is;
- repair migration history metadata;
- or reconcile manually created stage objects before applying.

No destructive choice without human review.

### Stage seed scope

Preferred:

- teams/competitions/reference data;
- World Cup schedule/venues;
- FIFA/Elo/history;
- development predictions/signals;
- test profiles/entitlements.

Do not clone:

- production users/sessions;
- Wompi transactions/webhooks;
- production subscriptions/entitlements;
- secrets or personal data.

### Probability release choice

Development candidate:

```text
gated_v2_probability_v2_analysis
```

Before production, choose between:

- v1 probability + v2 analysis;
- gated v2 probability + v2 analysis.

Decision must be based on stage validation and current fixture review, not marketing preference.

## Frontend decisions

### Exact public/free/premium split

Need final product matrix for:

- visible signals;
- scenario detail;
- source depth;
- score distribution;
- post-match evaluation;
- CTA placement.

### Narrative rendering

Choose structured locale templates versus LLM generation. Recommended: deterministic structured base, optional LLM polish with no ability to invent facts.

### Public proprietary boundary

Show evidence and UFO-derived metrics, not weights, gates, source secrets, or admin diagnostics.

## Future research decisions

- v3 minimum sample and acceptance criteria;
- tournament-round weighting schedule;
- UFO strength ranking formula;
- market-odds provider and legal/commercial wording;
- 2024 historical expansion if 2025-26 sample proves insufficient.
