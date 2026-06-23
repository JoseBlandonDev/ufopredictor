# G09 Frontend Commercial Readiness Plan - UFO Predictor

_Created from the production visual audit on 2026-06-19._

## Goal

Make the current production product commercially coherent without altering model, payment, entitlement, or data-operation logic.

## P0 — before paid acquisition

### G09.1 Pricing truth

Observed:

- public/admin UI displayed `20 USDT` with approximately `2.000 COP`;
- the admin COP input also showed `2000`.

Required:

- owner confirms intended commercial price;
- DB COP amount, label, public pricing, admin pricing, and Wompi checkout agree;
- tests cover the exact amount passed to checkout;
- remove stale hardcoded documentation examples.

### G09.2 Home freshness

Observed:

- home highlights Mexico vs South Africa;
- copy still says initial coverage and more fixtures will be enabled later.

Required:

- dynamic or current featured fixture;
- current coverage language;
- avoid hardcoded opening-match copy;
- current CTA to predictions/upcoming.

### G09.3 Truthful transparency copy

Observed:

```text
beta con calibración activa
```

Required:

- model calibration V0.1 is closed;
- product remains in operational beta;
- signals and data can be refreshed through versioned processes;
- do not imply continuous formula tuning.

### G09.4 Pricing/catalog simplification

Observed:

- active World Cup Pass;
- future World Cup Full Pass;
- a second World Cup Pass catalog card;
- active and future states are visually mixed.

Required:

- one clear active product;
- future catalog visibly secondary;
- no duplicate naming;
- exact entitlement and duration explained.

## P1 — commercial clarity

### G09.5 Spanish presentation consistency

Translate display labels while preserving internal English identities:

- team display names;
- provider status;
- alert labels;
- risk labels;
- scoreline/total-goals headings;
- admin empty states;
- export date labels.

### G09.6 Dashboard access-state clarity

Separate:

- system role;
- commercial plan;
- admin bypass;
- active entitlements;
- match unlocks.

Do not imply that an admin role equals premium purchase.

### G09.7 Review Gate UI polish

Required:

- missing markets -> `No disponible`;
- before shadow -> `Sin comparación todavía`;
- translated alerts/status;
- compact filters or collapsible sections;
- clear decided/held/pending state.

No model, schema, or generation changes.

### G09.8 Admin empty states

Result/Evaluation/Publish queues:

- translate;
- compact vertical space;
- preserve clear success/empty status;
- add direct navigation where useful.

## P2 — quality pass

### G09.9 Responsive/mobile

Check:

- navbar;
- pricing grids;
- prediction cards;
- premium detail;
- long admin review page;
- tables;
- horizontal overflow;
- touch targets.

### G09.10 Accessibility/performance handoff

Coordinate with G12:

- focus visibility;
- keyboard navigation;
- contrast;
- heading hierarchy;
- image dimensions;
- LCP/CLS;
- console errors.

## Acceptance

- pricing is commercially true;
- home reflects current coverage;
- transparency does not misstate calibration;
- active product is unambiguous;
- public UI is consistently Spanish;
- admin role/plan/entitlement are distinguishable;
- no payment, model, or data-operation regression.

## Out of scope

- model recalibration;
- AI connection;
- reviewed-xG publication;
- Wompi architecture changes;
- entitlement schema changes;
- Real Fixture Lab refactor;
- venue-data sourcing.
