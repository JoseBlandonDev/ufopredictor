# UFO Predictor — Project Status for Meeting

Last refreshed: after PR #40.

## Summary

UFO Predictor has completed the Real Fixture Lab single-fixture foundation and is ready for a pre-World-Cup pilot with 3-5 exact friendly fixtures.

The project is not ready as a full public/paid product yet, but it has the internal pieces needed to test predictions, verify results, and persist evaluations.

## Completed recently

- Real Fixture Lab evaluation persistence.
- Result verification lane.
- Exact friendly post-match result ingest guard.
- Runtime partial trial on Peru vs Spain fixture.

## Current state

D05 is functionally complete.

Epic D remains active with D06 next.

D06 will operate a small friendly pilot to validate:

- ingest;
- prediction save;
- result ingest;
- result verification;
- evaluation persistence;
- model error capture.

## Biggest risks

- Too little time before World Cup.
- Roadmap drift if documentation is not rebaselined.
- Model v0.1 may need fast calibration.
- Payment provider/paywall still undecided.
- Public World Cup launch scope not yet designed.

## Payment note

Stripe is not assumed.

MVP 1 monetization should use PayPal or a selected available gateway and likely start with one-time packages/tournament pass rather than recurring subscriptions.

## Parallel contributor plan

If a second person joins:

- Jonathan continues Epic D / D06 / model / API-Football.
- Second contributor should start Epic G discovery/design: auth, paywall, payment gateway.

Alternative second contributor lane: public UX/trust copy.

## Next actions

1. Finish docs roadmap rebaseline.
2. Start D06 candidate discovery.
3. Select 3-5 friendlies.
4. Run internal pilot.
5. Use pilot evidence to decide MVP 1 launch scope.
