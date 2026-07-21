# 09 — Metrics & Analytics

The thresholds in docs 02–03 are useful only if their inputs are measured consistently. This document defines the metric tree,
the event tracking plan (mapping to backend domain events that already exist in the design),
and the weekly operating cadence.

## 1. North-star metric

**Active on-rail leases** (leases in ACTIVE status whose last due rent was paid/verified
through bilo). It compounds supply, demand, matching, trust, and monetization into one honest
number — and it is literally the revenue base (doc 02 R2). Pre-payments (pilot Phase A weeks
1–8), the interim north star is **signed leases created through bilo**.

## 2. The KPI tree (each level explains the one above)

```
Active on-rail leases
├─ SUPPLY: live verified listings (per campus) · new listings/wk · listing→first-match time
│          · % listings with V3 verification · supply churn (delisted without lease)
├─ DEMAND: verified student signups/wk · activation rate (signup→first swipe <24h)
│          · weekly active seekers · week-4 seeker retention
├─ MATCHING: swipes/seeker/wk · like rate · match rate · match→conversation rate
│            · conversation→visit rate · visit→lease rate · match→lease days (target ≤21)
├─ RAIL: % leases on-rail · on-time payment rate · payment verification lag
│        · dunning recovery rate (day-3 / day-7)
├─ TRUST: verification completion funnel (V0→V1→V2) · disputes/100 leases
│         · dispute resolution days · scam reports (absolute — target 0)
└─ BUSINESS: GMV (rent under management) · net revenue · cost per activated lease (doc 08 §3)
             · NPS per side, measured post-lease and post-first-payment
```

Counter-metrics watched alongside (what we must not break while pushing the tree):
support tickets/1000 users, false-positive verification rejections, feed staleness complaints.

## 3. Event tracking plan

Principle: **product analytics ride the same domain events the backend already emits**
(design doc 09 catalog) — one source of truth, no separate "analytics SDK truth".

- Backend: a thin `AnalyticsListener` (Ring 0) forwards the doc 09 event catalog +
  auth/verification funnel events to the analytics store with `userId`, campus, and cohort
  (semester) dimensions.
- Frontend adds only what the backend can't see: screen views, swipe gestures on unswiped
  cards, search filter usage, funnel abandons.
- Stack at pilot: **PostHog** (self-serve funnels/retention, EU cloud, generous free tier) +
  a nightly SQL dashboard straight off Postgres for the KPI tree (the design's read-replica
  seam covers this later). No data warehouse before P2 — Postgres *is* the warehouse at this
  scale (design doc 03 ADR-03 philosophy).
- Identity: analytics keyed by our `userId`; PII never leaves our systems into third-party
  tools beyond what PostHog's DPA covers (doc 05 §4 alignment).

## 4. Cadence & rituals

- **Friday scorecard** (founders, 30 min): the KPI tree one-pager vs. gates (doc 03 §4-5) —
  the pilot's steering wheel. Every number has an owner and a trend arrow.
- **Monthly**: cost per activated lease review (doc 08 §3) + counter-metrics + cohort curves.
- **Per matrícula wave**: full-funnel post-mortem → playbook revision (the Uber lesson:
  process, not project — doc 04).

## 5. Experiment rules (right-sized, not cargo-cult)

At pilot scale there's no statistical power for A/B tests — don't pretend. Decisions come from
funnel cliffs + user conversations (5 student + 3 landlord interviews/week minimum, owner:
founders, notes in repo). Real A/B experiments (feed ranking, pricing) start when weekly
actives support them (~P2); the feature-flag capability rides the existing config system
(design doc 04 P9) — no experimentation platform before then.
