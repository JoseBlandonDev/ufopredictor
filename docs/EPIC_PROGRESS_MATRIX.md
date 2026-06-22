# Epic Progress Matrix - UFO Predictor

_Last refreshed: 2026-06-22._

## Product/operations epics

| Area | Status | Notes |
|---|---|---|
| Auth foundation | Production operational | Separate stage Auth confirmed. |
| Wompi payment | Production operational | Approved webhook activates entitlements. |
| Entitlements/premium | Production operational | Stage test data still pending. |
| Public predictions/history | Production operational | Stage unavailable until schema/data sync. |
| Review/publication queues | Production operational | V2 immutable publication planner added. |
| Torneo export | Production operational v1 | V2 development export pending Task 3B. |

## Prediction Intelligence v2

| Slice | Status | Evidence |
|---|---|---|
| Task 1 source/data foundation | Complete | `bac8a287` |
| Task 1.1 operational refresh/link correction | Complete | `dad82a50` |
| Task 1.2 Elo timeline/replay coverage | Complete | `ebd7bdfe` |
| Task 2 initial challengers | Complete, not promoted | `7cd2ea25` |
| Task 2.1 neutral/candidate correction | Complete | `f0af755a` |
| Task 2.2 gated candidate | Complete, dev candidate | `cf28875f` |
| Task 2.3 release review/export planning | Complete | `5d4bcade` |
| Task 3A dry-run operational layer | Complete | `6967fd6b` |
| Task 3B stage synchronization | Next | Read-only audit first. |
| V2 premium/public frontend | Planned | After stage data validation. |
| V2 production promotion | Blocked | Requires Task 3B and acceptance. |
| V3 tournament/UFO ranking research | Future | Requires larger sample. |

## Epic G commercial/readiness

| Epic | Status | Current emphasis |
|---|---|---|
| G01 Auth | Done | Stage Auth separated. |
| G02 Config readiness | Done/ongoing | Environment-specific Supabase confirmed. |
| G03 Production smoke | Partial | Must include v2 stage/production promotion later. |
| G04 Pricing/catalog | Operational MVP | Continue truth/coherence checks. |
| G05 Wompi | Done/live | Regression gate for production promotion. |
| G06 Entitlements | Done/live | Stage test entitlements needed. |
| G07 Premium active UX | MVP live | V2 scenario detail pending. |
| G08 Trust/legal copy | Partial | Explain probabilities/scenarios honestly. |
| G09 Frontend commercial readiness | Active backlog | V2 scenario/access/localization work. |
| G10 PWA | Planned | Separate. |
| G11 Offline safety | Deferred | Separate. |
| G12 Accessibility/performance | Planned | After v2 UI. |
| G13 Cross-device smoke | Planned | Required before v2 production. |
| G14 Ownership coordination | Required | Separate data, model, UI, and operations scopes. |
