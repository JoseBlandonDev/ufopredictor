# PROJECT STATUS FOR MEETING — UFO Predictor

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


## One-Line Status

UFO Predictor has completed the public/freemium foundation through C05 and is ready to plan World Cup premium packages in C06.

## What Is Working

- Public predictions from Supabase.
- Public match detail from Supabase.
- Plans and entitlements backend.
- Registered Free value wall.
- Anonymous vs Registered Free payload boundary.
- Saved matches/watchlist for Registered Free.
- Dashboard saved matches list.
- Premium access enforcement skeleton.

## Recent Completed Work

### PR #28

Server-side shaping for Anonymous prediction payload.

Result:

- Anonymous keeps public 1X2.
- Anonymous no longer receives confidence/risk DTO fields.
- Registered Free receives confidence/risk.

### PR #29

Registered Free saved matches foundation.

Result:

- users can save/remove public matches from match detail;
- dashboard shows saved matches;
- `user_saved_matches` table added with RLS;
- Supabase migrated manually through `0014_user_saved_matches.sql`.

## Current Product Value

Anonymous users can discover prediction value.

Registered Free users now get additional value:

- richer confidence/risk context;
- saved matches/watchlist;
- dashboard utility.

Premium payload remains protected and not yet implemented.

## Current Risks / Watch Items

- C06 package design must not accidentally serve premium payload.
- Premium access must continue relying on explicit entitlements/unlocks.
- Payments/checkout should not start until package scope is explicit.
- Trust/transparency remains simulated and should not be overclaimed.

## Next Recommended Work

```txt
C06 — World Cup Premium Package Foundation
```

Focus:

- define World Cup packages/passes/unlocks;
- map packages to entitlements/unlocks;
- decide if SQL/catalog changes are needed;
- avoid premium payload until C07.

## Not Yet Implemented

- checkout/Stripe;
- entitled premium prediction payload;
- prediction markets/narratives/results serving;
- odds provider;
- sports API provider;
- LLM narrative layer;
- real transparency/trust dashboard;
- i18n EN/ES;
- staging/observability finalization.
