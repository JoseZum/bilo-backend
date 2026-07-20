# 22 — Subscriptions & Entitlements (MON)

The revenue infrastructure for the bootstrap plan's ladder (business 11 §3): **landlords
subscribe, features unlock, invoices issue themselves.** Structure-B money only — bilo
charges its own customers for its own service; the rent flow is never touched (legal 05 §1).
Gated on **Milestone 2** (S.R.L. + Hacienda + e-invoicing) — nothing here ships before that
stack exists.

New **subscriptions module** (Ring 2).

## 1. Plans are a registry, entitlements are the only gate

Same extensibility pattern as unit types (doc 15 §3): plans and their entitlements live in a
code registry; the database stores *which plan a user has*, never *what the plan means*.

```ts
// subscriptions/plan-registry.ts — normative shape
interface PlanSpec {
  plan: Plan;                      // FREE | PRO  (launch set)
  priceMinorMonthly: bigint;       // CRC minor units; FREE = 0
  entitlements: {
    maxActiveListings: number;     // FREE: 1 · PRO: 10 (config)
    featuredSlots: number;         // FREE: 0 · PRO: 1
    waitlistFilters: boolean;      // the doc 17 §4 filter view
    analyticsDashboard: boolean;   // doc 07 §4 analytics
    paymentDashboard: boolean;     // landlord collections board
    prioritySupport: boolean;
    verifiedListingFastTrack: boolean; // doc 21 §8 hook — off at launch
  };
}
```

**Rule: features never check plans — they check entitlements**, through one service:
`entitlements.can(userId, 'waitlistFilters')` / `entitlements.limit(userId,
'maxActiveListings')`. Direct plan comparisons in feature code are lint-banned (the doc 04
boundary mechanism), so adding a plan (STUDENT_LANDLORD? ANNUAL?) or A/B-ing an entitlement
touches the registry only. Entitlement checks are hot-path → cached per user with
invalidation on subscription events (`CachePort`, noop at Stage 1).

## 2. Schema & state machine

```prisma
model Subscription {
  id                String   @id                    // UUIDv7
  userId            String   @unique @map("user_id")
  plan              String                           // registry key
  status            SubscriptionStatus               // ACTIVE → PAST_DUE → CANCELED | EXPIRED
  currentPeriodEnd  DateTime @map("current_period_end")
  cancelAtPeriodEnd Boolean  @default(false) @map("cancel_at_period_end")
  pspRef            String?  @map("psp_ref")         // provider subscription/customer id
  version           Int      @default(0)             // optimistic lock (doc 05 §7)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  @@index([status, currentPeriodEnd])
  @@map("subscriptions")
}
```

`SubscriptionStatus`: `ACTIVE → PAST_DUE` (renewal charge failed) `→ ACTIVE` (recovered) `|
EXPIRED` (dunning exhausted → entitlements revert to FREE) · `ACTIVE → CANCELED` (user
cancels; runs to period end — `cancelAtPeriodEnd`, no proration refunds at launch, stated in
ToS). No `subscriptions` row = FREE. Every transition emits
`subscription.activated | renewed | past_due | recovered | expired | canceled`.

## 3. Billing mechanics (structure B, PaymentGatewayPort adapter B1)

- **Subscribe:** landlord picks PRO → PSP checkout (Tilopay subscriptions / ONVO recurring —
  business 12 §3) tokenizes the card → webhook confirms first charge → subscription ACTIVE.
  bilo's ledger records the charge as bilo's own revenue (`payments` machinery, type
  `SUBSCRIPTION`); **e-invoice with 13% IVA auto-issues per charge** via `InvoicingPort` —
  no invoice, no activation (the tax discipline is code, not memory).
- **Renewal:** PSP-side recurring where supported; `subscriptions.renew-sweep` (daily,
  doc 09 §4) reconciles `currentPeriodEnd` against webhooks and triggers charges where the
  PSP needs a pull. Idempotency anchor: one charge per (subscription, period) unique.
- **Dunning:** failed renewal → retries day 1/3/7 (`subscriptions.dunning` job) with
  notifications → `PAST_DUE` grace (7 days, entitlements intact) → `EXPIRED` → downgrade.
- **Downgrade semantics (the fairness rule):** dropping to FREE **never touches existing
  data or live tenancies** — extra active listings above the FREE limit are *paused, not
  deleted* (landlord picks which one stays up); conversations, matches, and payment history
  remain fully accessible. We gate premium *capabilities*, never ransom someone's ongoing
  rental relationships — that would be both hostile and (for anything lease-adjacent) a
  legal-posture own goal.

## 4. Featured placement ("Destacado")

The PRO entitlement with feed consequences, so it gets rules:
- Featured listings get boosted insertion in the discovery deck — **capped** (max 1 featured
  card per N organic cards, config) so the feed stays honest, and **always visually labeled
  "Destacado"** — paid placement without labeling is exactly the dark-pattern/advertising
  territory Ley 10946 prohibits (legal 02 §2).
- Featured status never overrides hard filters (budget, radius, requiresGuarantor…) — it
  reorders within eligibility, never expands it.

## 5. API & admin

- `GET /subscription` (mine + entitlements) · `POST /subscription/checkout { plan }` ·
  `POST /subscription/cancel` · `POST /subscription/resume`
- Webhooks ride the doc 07 §9 machinery (signature verify, `webhook_events` dedup, fast-ack).
- Admin: subscription list/status, manual comp (free PRO for pilot landlords — flagged
  `compedUntil`, no PSP involvement), dunning overview. All audited.

## 6. Rollout

Pilot: comped PRO for the first cohort of landlords (proves value before price). Then real
billing at a CRC price point sized to the market (reference: PRO at ₡7,500/month ≈ 3% of a
₡250k room — business 11 §3). Grandfathering and price changes are registry versions with
effective dates — never retroactive edits to a live plan.
