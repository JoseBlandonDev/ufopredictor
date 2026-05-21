# Permissions Skeleton

TODO: replace mock access checks with backend-enforced entitlement filtering.

Planned scope:

- derive access from `subscriptions`, `user_entitlements`, and `user_match_unlocks`
- filter premium prediction fields on the server
- avoid relying on visual locks as the only paywall
- support match packs, competition passes, stage passes, and team passes

The current `can-access-match.ts` helper is mock-only for the prototype.
