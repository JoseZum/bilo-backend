# 14 — Frontend Alignment

Source: the `bilo-frontend` repo (React prototype: onboarding → swipe discovery → property
detail → chat → contracts → payments, plus a landlord mode with dashboard, publish flow,
requests inbox, and an admin-payments screen). Its `data-layer.js` already talks to the
prototype backend and tells us exactly what the client expects. This doc records what the
frontend teaches us, the contract it consumes, and the deltas it forced into docs 01/07.

## 1. What the frontend establishes as product fact

| Frontend evidence | Design consequence |
|---|---|
| All amounts in CRC (`₡450,000`, `window.crc` formatter); San José zones; SINPE Móvil / Transferencia / Tarjeta as payment methods | **Launch market is Costa Rica.** Default currency `CRC` (a zero-decimal-ish currency: minor units = colones, no cents in practice — `FeeCalculator` must handle per-currency exponent). SINPE Móvil moves from "Stage 3 maybe" to the **first post-Stripe adapter** on `PaymentGatewayPort`; "Transferencia" implies manual-payment recording (§4) |
| One user toggles cliente/admin (tenant/landlord) constantly (`onToggleRole` on every main screen) | Dual role is a first-class flow, not an edge case. `users.role` is the primary role, but API responses must work for a user acting in either capacity; role-scoped endpoints (`/matches/mine`, `/leases/mine`) take the acting role from a `?as=tenant|landlord` param defaulting to primary role — cheaper than re-issuing tokens per toggle (amends doc 06 §5 note) |
| Chat renders three message card types: text, **contract proposal** (title, property, months, monthly, deposit), **payment request** (title, amount, due) | `messages.message_type` enum: `TEXT | CONTRACT_PROPOSAL | PAYMENT_REQUEST | SYSTEM`. Structured payloads in `messages.metadata` JSONB with the exact fields above; a CONTRACT_PROPOSAL message links a draft lease id, a PAYMENT_REQUEST links a payment id — chat cards are *views of domain objects*, never a parallel source of truth |
| AI participates in chat (inline insight bubbles: "María tiene 4.9★, responde en ~2h") and as a standalone "BILO Asistente" conversation | AI module (doc 07 §14) gains two surfaces: (a) **assistant conversation** — maps to existing `ai_conversations`; (b) **inline chat insights** — server-generated `SYSTEM` messages, rule-based at Stage 1 (trust/rating/response-time facts from DB, no LLM needed), LLM-phrased later behind the same port |
| Contracts screen shows **clause-analysis flags** (`⚠ Cláusula 14: desalojo en 15 días — inusualmente corta`) | New AI feature: **lease review**. `POST /ai/lease/:id/review` → stores structured flags `{level: WARN|INFO, clauseRef, text}` on the lease (`leases.metadata.flags`). Runs async (queue) when a contract proposal is sent; grounded on the lease text, output schema-validated. Flags are advisory UX — never block signing |
| Landlord **AdminPayments screen**: month received/expected, overdue count+amount, per-property tenant payment status (dueDay, paidOn, monthsOnTime, daysLate), **next payout date + amount**, recent activity feed | Two backend features: (a) `GET /payments/landlord-dashboard` aggregate (one SQL query + cache candidate); (b) **payouts are real scope** — see §3 |
| Saved properties rail (`BILO_SAVED`) | Favorites endpoints join doc 07 §5: `PUT/DELETE /favorites/:propertyId`, `GET /favorites` (table already exists in schema) |
| Property cards show amenities (wifi, water, electricity, security, pool, gym) beyond the core columns | Canonical `amenities` object inside `properties.metadata` JSONB with these keys; validated by DTO so the feed can filter on them (GIN index if it becomes a hot filter) |
| Conversations list needs `unreadCount`, `lastMessage`, other-participant summary per row | The `GET /conversations/mine` response DTO includes these (computed via read markers, doc 07 §7) — cheaper as a lateral-join query than N+1 |

## 2. The wire contract the frontend already consumes

`data-layer.js` calls, in order, on bootstrap:

1. `POST /auth/mock-login` (demo only — production frontend switches to `POST /auth/oauth/exchange`, doc 06)
2. `GET /users/me` (falls back to `/auth/me` — we standardize on `/users/me`; drop `/auth/me`)
3. `GET /recommendations/feed` (falls back to `/properties` — feed is the real endpoint)
4. `GET /conversations` + `GET /conversations/:id/messages`
5. `GET /leases` + `GET /leases/:id/payments`

Contract notes:
- The client tolerates both bare arrays and `{ items, nextCursor }` envelopes
  (`payload?.data?.items || payload?.items || payload`). Production standard stays the doc 12
  envelope; the frontend's tolerance means no migration pain.
- Frontend config points at `/leases`; design says `/leases/mine`. **Resolution: the API keeps
  `/leases/mine`** (explicit ownership semantics); the frontend's `endpoints.contracts` config
  array gets `'/leases/mine'` prepended — it's a one-line config change on their side, designed
  for exactly this.
- The client displays trust scores as ★/5 by dividing our 0–100 by 20. Fine, but the public
  profile DTO will expose both `trustScore` (0–100) and nothing else — display math is the
  client's job.
- 401 handling: client clears token and re-authenticates once. Matches our 15-min access token
  + refresh flow.

## 3. Payouts (the feature the frontend surfaced that the backend design must own)

The admin screen promises "próximo payout: 24 may · ₡2,730,000". That means bilo **receives
tenant money and pays landlords out** — marketplace money flow, not pass-through.

**Decision.** Stripe Connect (Express accounts) at Stage 1 for card rails: charges use
`transfer_data`/destination charges so Stripe holds and routes funds; our `platform_fee_minor`
becomes the application fee. New table `payouts (id, landlord_id, amount_minor, currency,
status, provider_ref, period_start, period_end, created_at)` — a projection of gateway payouts
+ the anchor for the dashboard's "payoutNext/payoutAmount". SINPE settlement (bank-transfer
rails, Stage 2/3) will need bilo-initiated payouts on the same table; that is precisely why
`payouts` is ours and not a Stripe API pass-through.

**Consequences:** landlord onboarding gains a KYC step (`POST /payments/connect/onboard` →
Stripe-hosted flow); a lease cannot activate until its landlord's Connect account can receive
transfers (new guard in the lease activation transaction); reconciliation (doc 07 §9) extends
to payouts.

**Manual payments ("Transferencia"):** landlords already collect some rent off-platform. To
keep the ledger honest (and the trust score fair), landlords can mark a payment
`POST /payments/:id/record-manual { method, reference }` → status `PAID_MANUAL` (a `PAID`
substate with `method_type=MANUAL`); no gateway transaction, still emits `payment.paid`, still
counts for trust. Platform fee handling for manual payments is a **product decision to make
before Epic 4** (invoice the landlord vs. waive; the ledger supports either — flagged, not
assumed).

## 4. Roadmap impact (deltas to doc 13)

- Epic 3 gains: 3.6 favorites endpoints (S) · 3.7 conversation list DTO with unreadCount (S) ·
  3.8 message card types CONTRACT_PROPOSAL / PAYMENT_REQUEST / SYSTEM (M).
- Epic 4 gains: 4.9 Stripe Connect onboarding + payouts table + activation guard (L) ·
  4.10 landlord dashboard aggregate endpoint (M) · 4.11 manual payment recording (S).
- ~~Epic 6 gains: lease clause review + inline chat insights~~ — **superseded**: all AI
  features are deferred to national scale (business doc 02 §6). The rule-based inline chat
  insights (trust/rating facts, no LLM) may ship earlier since they don't touch the AI module —
  product's call, not launch-blocking.
- Stage-2 backlog gains: SINPE Móvil gateway adapter + bilo-initiated payouts.

Everything else the frontend shows (onboarding, publish flow, requests inbox, profile,
detail screens) maps 1:1 onto modules already specified in doc 07 — no further changes.
