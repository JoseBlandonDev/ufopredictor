# IMPLEMENTATION PLAN — UFO Predictor

_Last updated: post PR #26 / C05 Gate 1 Registered Free Value Wall_

## Current implementation baseline

Completed through PR #26.

## Next implementation sequence

### Step 1 — C05 Gate 2 Recognition

No code first. Determine the data boundary between Anonymous and Registered Free.

Deliverable:

- matrix of fields/capabilities by user state;
- SQL/RLS requirements if any;
- risks and recommended first implementation.

### Step 2 — C05 Gate 2 Implementation, if approved

Possible outputs:

- new public anonymous projection;
- registered-free projection;
- query branching by session;
- UI adjustments.

Only after review. SQL/RLS would require higher-intelligence Codex and manual Supabase application.

### Step 3 — C05 Gate 3 Capture Foundation

Add capture mechanisms for free registered interest if approved:

- favorites;
- watchlist;
- preferences;
- events.

### Step 4 — C06 World Cup Premium Package Foundation

Model/package the World Cup monetization layer:

- full pass;
- packs;
- team/country;
- group/stage;
- single match unlocks.

### Step 5 — C07 Entitled Premium Match Projection

Serve premium payload only through authorized server-side boundary.

### Step 6 — Trust, sports data, workers, payments, i18n

Later tracks.

## Important implementation constraints

- Do not combine C05 Gate 2 SQL/RLS with premium payload serving.
- Do not combine docs refresh with functional code unless explicitly scoped.
- Keep UI public Spanish until i18n is deliberately implemented.
- Keep internal canonical data/keys in English where possible.
