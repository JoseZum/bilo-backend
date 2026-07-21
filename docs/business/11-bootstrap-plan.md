# 11 — Bootstrap Plan: Milestones for Founders With No Money

The operating plan for the phase the other docs skip: **two students, ~₡0 budget, pre-company,
pre-revenue.** It sequences the product so legal/tax triggers fire only when there's money to
handle them, encodes the payment-structure strategy decided in
[`docs/legal/costa-rica/`](../legal/costa-rica/README.md), and defines the first two
milestones. Decisions recorded here on 2026-07-18 (founder call): both app stores via
individual accounts; Milestone 1 ships marketplace core + student badge (no contracts, no
cédula verification, no payments); ads get a feasibility rule, not a commitment.

## 1. Operating constraint and payment structures

> **bilo can always receive its OWN money (fees, subscriptions — invoiced, taxed).**
> **bilo can never hold OTHER PEOPLE'S money (rent, deposits).**
> **A licensed PSP in the middle may hold and split anything — that's what its license is for.**

```
SUPPORTED — A. Direct + verify (Phase A, live first): tenant → landlord via SINPE;
     bilo records/verifies, never touches funds. Zero licensing exposure.
SUPPORTED — B. Two separate charges: rent direct (or PSP→landlord 100%);
     bilo separately charges its fee/subscription. Works with ANY PSP today.
CONDITIONAL — C. Split settlement (the Uber model): tenant → PSP → rent to landlord,
     fee to bilo, in one transaction. Cleanest UX; requires a PSP with
     marketplace/split capability — availability in CR is the open question
     (research in [doc 12](./12-psp-landscape.md); partnership item L7).
EXCLUDED — D. Pass-through: tenant → bilo's account → landlord. This may constitute captación and is outside the approved model.
```

Model **B is the guaranteed fallback**: the business model does not depend on split
settlement existing in Costa Rica. C is a UX upgrade we adopt if/when a PSP confirms it in
writing.

## 2. Milestone 1 — Distribution and initial usage on free-tier infrastructure

**Goal:** bilo live on both app stores, full marketplace working, real users, infra bill ≈ ₡0,
legal exposure ≈ 0. **No revenue is required for M1 — and that is a feature:** no revenue =
no Hacienda trigger, no invoicing, no accountant.

| Decision | Detail |
|---|---|
| **Stores** | Google Play ($25 once) + Apple ($99/yr) via **individual developer accounts** — listing shows a personal name until the S.R.L. exists; both stores support transferring the app to the future org account. Budget: **~$124 first year** — the milestone's only unavoidable cash cost. The PWA-first decision (doc 06) stands for the web channel; the store apps can ship as a wrapped build (TWA/Capacitor) of the same frontend |
| **Feature scope** | ERS marketplace core: AUTH, APP, USER, PREF, PROP (publish + listings + house rules + verified-listing badge), DISC (swipe feed + filters + saved-search alerts + compare), GEO (map, radius, university POIs), MATCH (solicitudes), **VIS (property viewings)**, **SAFE (report & block)**, CHAT, NOTIF (in-app + push), TRUST (display-only basics), RATE (aggregates read path) — **plus the student-email badge (FR-IDV-010)**. **Excluded on purpose:** leases/contracts, all payments, cédula verification, subscriptions (MON — M2), waitlists/roommates/seeker-matching/maintenance (post-M1 wave) |
| **Why this scope is legally near-zero** | No money handled, no fees charged, no sensitive/biometric data (student badge = university email possession, not identity documents), no contracts generated. The duties that remain: basic Ley 8968 hygiene on ordinary personal data (consent at signup, privacy policy, deletion) — already designed |
| **Infra** | Free tiers only (app hosting, Postgres, object storage for images, push). The design's ports make this trivial to swap later. Policy: if a service can't be had free at M1 scale, the feature waits |
| **Success gate** | The doc-03 liquidity metrics on campus #1 (listings live, weekly solicitudes, chat activity) — not revenue |

### The ads question — analysis and decision rule (founder-requested IF)

Numbers first ([LatAm eCPM data](https://www.blog.udonis.co/mobile-marketing/mobile-apps/ecpms),
[country CPM tables](https://www.thesrzone.com/2024/01/admob-ecpm-rates-by-country.html)):
LatAm banner eCPM ≈ **$0.15**, interstitial ≈ $1–3, rewarded ≈ $2–4; Costa Rica is a small,
mid-value market. Modeling a *good* M1 (5,000 MAU, ~10 sessions/user/month, ~3 banner
impressions/session): ~150k impressions/month ≈ **$20–25/month** from banners; adding one
interstitial per session ≈ +$75/month at real UX cost in a product whose entire pitch is
trust and quality. Meanwhile M1 free-tier infra costs ≈ $0–20/month.

**Decision rule (agreed):** ads must *meaningfully exceed* infra costs to justify their UX +
admin cost (any ad income is taxable → forces the Hacienda registration early).
→ **At M1 scale they don't: launch adless.** Revisit when MAU > ~20k or infra bills exceed
~$50/month sustained — and if ads do turn on, they're clearly labeled (Ley 10946 advertising
transparency) and never inside chat or payment-adjacent screens. ERS carries this as
FR-APP-009 (priority C).

## 3. Milestone 2 — "External money arrives → formalize → monetize"

**Trigger:** external cash (founder salary, family, grant, prize — anything not platform
revenue) covers the formalization stack. Sequencing (each step gates the next):

1. **S.R.L. + founder/IP agreement** (~₡400k one-time, [legal 01](../legal/costa-rica/01-entity-and-registrations.md)) — the liability shield and the sellable asset.
2. **Company bank account** → all bilo money lives there from day one (never personal accounts — veil-piercing risk).
3. **Hacienda activity registration + e-invoicing provider + accountant + patente municipal** — the "before the first colón" stack (~₡50–80k/month once active).
4. **Store accounts migrate** to the org (Apple org account + DUNS; Play org) — listing shows "bilo".
5. **Revenue ladder, in order of exposure:**
   - **R-a. Landlord subscriptions / featured listings** (design doc 22) — pure SaaS, no leakage, no money-flow dependency. First revenue on.
   - **R-b. Introduction/booking fee** at match time — bilo's own invoiced receivable (structure B).
   - **R-c. Cobro Automático via PSP** — per [doc 12](./12-psp-landscape.md): starts as payment-links/two-charge (B), upgrades to split (C) only with written PSP confirmation (L7).
   - **R-d. Later:** verified-listing fee, services referrals, deposit/guarantee products via licensed partners.
6. **Counsel spend begins** (L1/L8 lease-regime memo) only when contracts enter the product — which stays out until after M2 monetization is stable.

## 4. Trigger discipline (the compressed map)

| Trigger | Fires when | Never before |
|---|---|---|
| Hacienda + invoicing + accountant | First colón of ANY revenue (fees, subs, ads) | M2 step 3 |
| S.R.L. | Before first revenue and before scale makes personal exposure real | M2 step 1 |
| Ley 8968 sensitive-data duties (consent screens) | Cédula verification ships | post-M2 |
| Lease-regime counsel (L1/L8) | Contract features ship | post-M2 |
| PSP integration (needs cédula jurídica — [doc 12](./12-psp-landscape.md)) | R-c | M2+ |
| ICT / SUGEF / PRODHAB registrations | Policy: never (scope fences, [legal README](../legal/costa-rica/README.md)) | — |

## 5. What this amends elsewhere

- **Roadmap (design 13):** M1 selects a subset of Epics 0–3 + GEO + FR-IDV-010; Epic 4 (the
  rail) and lease tasks move behind M2. Note added there.
- **ERS §5.1** now maps modules to release gates (M1 / M2 / trigger-gated) without changing
  MoSCoW priorities — "Must" still means "must exist for the *full* Stage-1 product."
- **Doc 06 (PWA-first):** amended, not reversed — PWA stays the web channel; wrapped builds
  put the same app in both stores under individual accounts.
- **Doc 08 (finance):** M1 budget is ~$124 + domain; M2 formalization stack ~₡400k one-time
  + ~₡80k/month — the "full salary destined to bilo" figure funds M2 comfortably.
