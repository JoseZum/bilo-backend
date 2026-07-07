# 06 — Product & Pilot MVP

The design docs specify the full Stage-1 backend. This doc decides **what the pilot actually
ships** — the ruthless cut — plus personas, journeys, and the mobile-platform decision. The
rule: the pilot exists to validate doc 01/02 assumptions, and anything not needed for that
validation is dead weight this semester.

## 1. Personas (the four that matter at the beachhead)

| Persona | Reality | What they need from bilo |
|---|---|---|
| **Regular student** (18–24, moving for U, often first time away from family) | Parents co-decide; budget ₡120–300k; finds housing via FB groups and campus walls; fears scams and bad roommates | Verified listings with real photos, clear total cost, roommate signals, parent-shareable listing links |
| **Exchange/foreign student** | Can't visit in person; highest willingness to pay; needs contracts in English; semester terms | Remote trust (verification, video, reviews), bookable without visiting, hospedaje-term contracts |
| **Small landlord / casa de huéspedes owner** (often 45+, 1–5 rooms near campus) | WhatsApp-native, wary of tech, burned by no-shows and unpaid rent; SINPE user already | Verified-student leads, dead-simple listing (we do it for them), rent punctuality, a human phone number to call |
| **Multi-property landlord** (5–20 units, semi-professional) | Spreadsheet bookkeeping; will anchor supply if the dashboard saves them hours | Dashboard, payment tracking, contract templates — the future Pro subscriber |

## 2. The two golden journeys (pilot scope = make these two excellent)

1. **Student finds a verified room:** onboard → student-email verify → set budget/zone →
   swipe feed of campus-zone listings → detail (photos, total monthly cost, landlord trust) →
   like/match → chat → visit scheduled → lease created from template → sign in app.
2. **Landlord fills a room with a verified student:** onboarded in one visit (we photograph +
   list) → receives matches from verified students → accepts → chat → lease from template →
   records/verifies SINPE rent each month → sees punctuality history per tenant.

Everything else — favorites, ratings, services marketplace, notifications beyond the basics —
supports these two or waits.

## 3. Pilot MVP cut (against the design-doc feature set)

**IN (must be excellent):** OAuth (Google+Apple) + student-email verification · properties with
ROOM type + our-photos flow · feed with hard filters + simple ranking (full scored ranking can
wait — one campus's inventory fits on a few screens) · swipes/matches/chat · lease from template
(both legal regimes, doc 05 §2) with in-app signature record · **SINPE direct payment with
verification** (Phase A, doc 05 §1) + payment history + receipts · trust score v1 (payments +
completed leases only) · in-app + push notifications for the core loop · disputes intake
(manual resolution by us) · admin back-office (listing approval, verification review, dispute
handling — internal tooling is pilot-critical, not optional).

**OUT (explicitly deferred, with the trigger that revives them):** ratings UI (needs completed
leases → month 4+) · deposit protection (needs Phase B legal) · card payments (Phase B) ·
recommendations engine beyond SQL filters (needs >1 campus of inventory) · roommate matching
(fast follow after liquidity gate 1) · services marketplace (P3) · landlord Pro (P3) ·
AI everything (national scale — already settled) · WebSocket chat (polling is fine at pilot
volume, design doc 07 §7).

## 4. Mobile platform decision

**Pilot: installable PWA (mobile-first web).** Reasons: the existing frontend prototype is
already web React (reusable as the base); QR-to-app is our #1 physical acquisition channel
(posters, "se alquila" riders — a QR that opens instantly beats a 60MB store download);
app-store review adds weeks to every iteration during the one semester where iteration speed
decides everything; and Apple/Google OAuth + SINPE deep links all work from the mobile web.
**React Native app: gate, not date** — build it when week-4 retention proves students return
enough to justify push-notification depth and home-screen presence (post-liquidity-gate,
pre-P2). The API contract (design docs 12/14) is identical either way, so this is a
frontend-only decision.

## 5. Experience principles (the taste that beats Facebook groups)

1. **Total cost honesty** — every listing shows rent + services + deposit as one number.
   The FB-group market hides costs; we never do.
2. **Photos are ours** — no listing goes live without photos that meet the bar (we take them
   at pilot; later, upload guidelines + review). This is the Airbnb conversion lesson as a
   product rule.
3. **Trust is visible everywhere** — verification badges, payment punctuality, response time
   on every card; the *reason* to leave the FB group.
4. **WhatsApp-grade simplicity for landlords** — if doña María (58, three rooms, no laptop)
   can't do it from her phone in three taps, it ships again.
5. **Spanish first**, English for exchange students; tico copy, not neutral-LATAM corporate.

## 6. Backend roadmap deltas from this cut

- **Admin back-office endpoints move UP into launch scope** (listing approval queue,
  verification review, dispute console — design doc 07's admin endpoints get an Epic 5 task
  bundle; a thin internal web UI is acceptable).
- **`InvoicingPort` + e-invoice generation** added at P1 (doc 05 §3).
- **Ranked recommendation engine** (design doc 07 §5 scoring) demotes to post-pilot; pilot
  ships filters + freshness ordering.
- Ratings module builds in Epic 5 as designed but UI-gates until month 4.
