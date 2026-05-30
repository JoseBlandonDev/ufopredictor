# PROJECT CONTEXT — UFO Predictor

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


## What UFO Predictor Is

UFO Predictor is a football prediction product focused on probabilistic match analysis.

It is not a sportsbook and does not accept bets.

The product should communicate probabilities, uncertainty, and context responsibly.

## Product Principle

```txt
The statistical model calculates.
The AI explains.
```

## Current Product Strategy

The funnel is:

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World-Cup monthly subscriptions
```

Registered Free is permanent.

World Cup premium should be package/pass/unlock based.

Monthly subscriptions are expected after the World Cup for recurring league coverage.

## Current User Experience

### Anonymous

Can see:

- public predictions;
- full 1X2 probabilities;
- match detail;
- confidence/risk teaser;
- CTAs to register.

Cannot:

- receive confidence/risk DTO fields;
- save matches;
- access premium payload.

### Registered Free

Can:

- see full public prediction context;
- receive confidence/risk;
- save/remove public matches;
- view saved matches in dashboard.

Still cannot:

- access premium match payload;
- purchase packages;
- unlock premium markets/narratives/results.

### Premium / World Cup Package User

Not implemented yet.

C06 will prepare package foundations; C07 will handle entitled premium projection.

## Current Technical State

- Public predictions are backed by Supabase views.
- Public match detail is backed by Supabase views.
- Plans/entitlements backend exists.
- Premium access skeleton exists but does not serve premium payload.
- Saved matches table exists with RLS.

## Current Data Safety Rules

- Do not expose premium tables publicly.
- Do not use service role for normal UI.
- Do not treat visual locks as authorization.
- Do not send sensitive payload to unauthorized clients.
- Anonymous vs Registered Free payload differences should happen server-side, not only in CSS or copy.

## Current Operational Rules

- PowerShell/Git for simple commands.
- Codex for implementation/inspection.
- Feature branches may contain multiple commits.
- Merge to main only when a functional block is complete.
- Documentation refresh happens at stage/handoff, not every micro-step.

## Current Next Step

C06 — World Cup Premium Package Foundation.

Goal:

Prepare World Cup commercial packages and their access mapping without serving premium prediction payload yet.
