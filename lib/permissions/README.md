# Permissions Foundation

`entitlements.ts` defines pure, deterministic access decisions for future
server-side premium projections. It distinguishes public basic access,
server-controlled beta free access, current entitlement or match unlock
access, and an explicit admin bypass.

Implemented scope:

- check subscription status without treating a subscription alone as access;
- require a current entitlement or current match unlock for protected resource
  access, unless an explicit beta or admin rule applies;
- test the pure decisions independently of Supabase.

Premium prediction query projections are not implemented yet. When added,
they must invoke these rules server-side before returning protected fields;
visual locks are not an authorization boundary. Any future
`betaFreeResourceIds` values must be assembled from trusted server
configuration or grants, never from client input.

The existing `can-access-match.ts` helper remains mock-only for the unconnected
match-detail prototype.
