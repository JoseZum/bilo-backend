# 07 — Module Specifications

One section per module. Format: **Purpose · Owns (tables) · API · Emits/Listens · Domain classes
· Rules & decisions**. Endpoints are under `/api/v1`; auth is implied (global guard) unless
marked `@Public`. Payment and Lease get the deepest treatment — they are the business.

Modules are listed in build order (doc 13 mirrors this).

---

## 1. auth (Ring 1)

Fully specified in doc 06. Owns `auth_identities`, `refresh_tokens`.
API: `POST /auth/oauth/exchange`, `POST /auth/refresh`, `POST /auth/logout`,
`POST /auth/logout-all`, web-only `GET /auth/google` + callback.
Emits: `auth.user_registered`, `auth.token_reuse_detected`.

## 2. users (Ring 1)

**Purpose.** Profile CRUD, role management, account lifecycle (soft delete + PII scrub).
**Owns.** `users`.
**API.** `GET /users/me`, `PATCH /users/me`, `DELETE /users/me` (starts erasure flow),
`GET /users/:id` (public profile projection: name, avatar, trust score, ratings summary — a
dedicated response DTO, never the full row), admin: `GET /users`, `PATCH /users/:id/role`.
**Emits.** `user.updated`, `user.deleted`.
**Rules.** `trustScore` column is **owned by the trust module** (users module never writes it —
single-writer rule per column where modules share a table is allowed only here, and only because
splitting the column out buys nothing).

## 3. preferences (Ring 1)

As prototype: `PUT /preferences/me`, `GET /preferences/me`, owns `user_preferences`.
Emits `preferences.updated` (recommendation engines listen to invalidate/re-project).

## 4. properties (Ring 2)

**Purpose.** Listing lifecycle for landlords; the supply side.
**Owns.** `properties`, `property_images`, `property_analytics`.
**API.** `POST /properties`, `GET /properties/:id`, `PATCH /properties/:id`,
`DELETE /properties/:id` (soft), `GET /properties/mine`, `POST /properties/:id/images/presign`
(returns presigned upload URL; client uploads to storage directly, then
`POST /properties/:id/images` registers `{key, position}`), `PATCH .../images/order`,
`GET /properties/:id/analytics` (owner only).
**Emits.** `property.created|updated|archived`.
**Listens.** `swipe.created`, `match.accepted` → increments `property_analytics` counters
(idempotent by event id).
**Domain classes.** `PropertyStatus` machine (trivial: `DRAFT → ACTIVE ⇄ PAUSED → ARCHIVED`,
plus `RENTED` set/cleared by lease events); `PropertyPolicy` (owner/admin).
**Rules & decisions.**
- Status `RENTED` is driven by lease events (`lease.activated` → RENTED,
  `lease.terminated|completed` → ACTIVE) — properties never asks leases.
- Analytics counters are **denormalized on purpose** (feed cards need them); the swipe table is
  the truth, counters are rebuildable.
- Housing-specific attributes beyond the core columns go in `metadata` JSONB — this is the
  "don't hard-code housing" seam from doc 01.

## 5. recommendations + swipes (Ring 3 — "discovery")

**Purpose.** The feed (ranked properties for a tenant) and the swipe actions on it.
**Owns.** `swipes`.
**API.** `GET /recommendations/feed?cursor=` (tenant), `POST /swipes { propertyId, action }`,
`GET /swipes/mine`.
**Emits.** `swipe.created` (payload includes action; a `SUPERLIKE`/`LIKE` is what makes a match
possible).
**Domain/ports.** `RecommendationEnginePort` (doc 08): Stage 1 `PostgresRecommendationEngine` —
one explainable SQL query: hard filters (city, budget range ±15%, pets/parking/furnished
constraints, status ACTIVE, not already swiped) then score
`w1·budget_fit + w2·distance_decay + w3·freshness + w4·landlord_trust`, weights in config, logged
per feed response for debuggability. Stage 3 `Neo4jRecommendationEngine` consumes swipe events
into a graph projection and does collaborative filtering; same port, same API.
**Rules.** Swipe uniqueness is the DB constraint `UNIQUE(user_id, property_id)`; re-swiping
updates the action (upsert) within a small grace window, else 409. Feed excludes own properties.
Feed responses are cacheable per-user for minutes (`CachePort`, doc 08) — invalidated lazily,
not precisely; staleness of a feed is harmless.
**Amended by doc 20:** the feed accepts optional `anchorLat/anchorLng/radiusM` (POI- or
pin-anchored search); results carry `distanceM` from the anchor.

## 6. matches (Ring 3)

**Purpose.** Mutual intent: tenant liked, landlord accepts → conversation opens.
**Owns.** `matches`.
**API.** `POST /matches { propertyId }` (tenant; requires prior LIKE/SUPERLIKE),
`POST /matches/:id/respond { accept|reject }` (landlord), `GET /matches/mine` (role-aware).
**Emits.** `match.created`, `match.accepted`, `match.rejected`.
**Domain.** `MatchStateMachine`: `PENDING → ACCEPTED | REJECTED | EXPIRED` (expiry job at
Stage 2: pending > 14 days → EXPIRED, keeps landlord inbox honest).
**Rules.** `UNIQUE(tenant_id, property_id)`. Accepting creates the conversation **in the same
transaction** (conversations module exposes `createForMatch(tx, matchId)` — an explicit
cross-module call, not an event, because the product promise is "accept and chat instantly").

## 7. conversations (Ring 3)

**Purpose.** Match-scoped chat.
**Owns.** `conversations`, `messages`.
**API.** `GET /conversations/mine`, `GET /conversations/:id/messages?cursor=` (newest-first,
cursor = created_at+id), `POST /conversations/:id/messages`, `POST /conversations/:id/read`
(marks read up to timestamp).
**Emits.** `message.sent` (notifications listens: push to the other party).
**Rules & decisions.** `message_type` enum: `TEXT | CONTRACT_PROPOSAL | PAYMENT_REQUEST |
SYSTEM` — the non-text types are structured cards whose payload lives in `messages.metadata`
and links the real domain object (draft lease id / payment id); see doc 14 §1. The list DTO
returns `unreadCount`, `lastMessage`, and the other participant per row (lateral join, not N+1).
REST polling at Stage 1 (mobile polls the list screen; acceptable to
~50k users). Stage 2: same module gains a WebSocket gateway (`@nestjs/websockets`, Redis
pub/sub adapter for multi-instance fan-out) — **message persistence path is identical**; the
socket is a delivery optimization, so no API break. Message bodies are PII: scrubbed on account
erasure; length-capped (4k chars); no attachments until storage moderation story exists.
**Amended by doc 18 §5:** conversations generalize from match-scoped to context-scoped
(`(context_type, context_id)` unique + `conversation_participants`; contexts:
`MATCH | ROOMMATE_REVIEW | LEASE | ROOMMATE_SEEKER` — the last from doc 21 §4) so roommate
screening chats, seeker chats, and the lifelong tenant↔landlord lease thread reuse this
module. Doc 19 §5 adds the `MAINTENANCE_TICKET` card and doc 21 §1 the `VISIT_PROPOSAL` card
to the `message_type` set. Blocks (doc 21 §6) freeze conversations read-only. The attachment
ban stands for free-form chat — ticket photos/videos ride on the ticket entity (doc 19 §1),
never on messages.

## 8. leases (Ring 2) — deep spec

**Purpose.** The contract object: converts an accepted match into a recurring payment
obligation. The heart of the "standard for renting" thesis.
**Owns.** `leases`, `rent_periods` (new).
**API.**
- `POST /leases { matchId, monthlyAmountMinor, depositAmountMinor, currency, startDate, endDate?, dueDay }`
  (landlord; match must be ACCEPTED and unleased)
- `POST /leases/:id/send` (→ PENDING_SIGNATURE), `POST /leases/:id/sign` (tenant; → ACTIVE)
- `POST /leases/:id/terminate { reason }` (landlord or tenant per policy), `POST /leases/:id/cancel`
- `GET /leases/mine`, `GET /leases/:id`, `GET /leases/:id/payments`
**Emits.** `lease.created`, `lease.activated`, `lease.terminated`, `lease.completed`.
**Domain classes.**
- `LeaseStateMachine` (doc 04 P2): `DRAFT → PENDING_SIGNATURE → ACTIVE → COMPLETED | TERMINATED`,
  with `CANCELLED` from the first two and `EXPIRED` for unsigned drafts.
- `RentSchedule` — pure class answering: given `(startDate, endDate?, dueDay, monthlyAmount)`,
  what are the periods and their due dates? Handles the month-length edge (dueDay 31 → last day
  of shorter months), proration of the first partial month (documented formula:
  `daily = monthlyAmount / daysInMonth`, rounded half-up to minor unit, remainder on the first
  full month). This class is where "renting anything monthly" lives — it must never know about
  housing.
**Rules & decisions.**
- **Activation is transactional and generates the money skeleton:** on `sign`, in one
  transaction: lease → ACTIVE; create deposit `Payment` (type DEPOSIT, due immediately) and the
  first rent `Payment`; create `rent_periods` row(s). Subsequent months are generated by the
  scheduled job (doc 09 §4) — *not* all upfront, so lease edits/terminations don't orphan rows.
- `rent_periods (lease_id, period_start, period_end, payment_id)` with
  `UNIQUE(lease_id, period_start)` is the idempotency backbone of rent generation: the job can
  run twice, crash mid-run, or run on two instances — the constraint makes duplicates impossible.
- Signature at Stage 1 is an in-app consent record (who, when, IP, lease snapshot hash stored in
  `metadata`) — legally "good enough" varies by country; a real e-sign provider is a Stage 3
  port (`SignaturePort`) if legal requires it.
- Termination policy (notice periods, deposit disposition) is country-dependent → a
  `LeaseTerminationRules` domain class with per-country config, decided *there*, not inline.

## 9. payments (Ring 2) — deep spec

**Purpose.** Move rent, keep the ledger, never lie about money.
**Owns.** `payments`, `payment_methods`, `payment_transactions`, `payment_events`,
`idempotency_keys`, `webhook_events`.
**API.**
- `GET /payments/mine?status=&cursor=`, `GET /payments/:id`
- `POST /payments/:id/pay { paymentMethodId }` + **required `Idempotency-Key` header** (doc 12)
- `POST /payment-methods/setup-intent` → client confirms with Stripe SDK →
  `POST /payment-methods { providerRef }`; `GET/DELETE /payment-methods`
- `POST /webhooks/stripe` — `@Public`, signature-verified (no IP allowlist — Stripe rotates IPs), fast-ack
- Admin: `POST /payments/:id/refund`, `GET /payments/reconciliation?day=`
**Emits.** `payment.paid`, `payment.failed`, `payment.refunded`, `payment.overdue` (job-emitted).
**Domain classes.**
- `PaymentStateMachine`: `PENDING → PROCESSING → PAID | FAILED`, `FAILED → PROCESSING` (retry),
  `PAID → REFUNDED` (admin), `PENDING → CANCELLED` (lease cancelled). `OVERDUE` is **not** a
  state — it's a derived flag (`status=PENDING AND due_date < now`), because a state would need
  a mutation sweep and can contradict the clock; deriving it cannot.
- `FeeCalculator` — pure: `(amountMinor, currency, feePolicy) → { platformFeeMinor, landlordNetMinor }`,
  rounding half-up, remainder to platform, property-tested (sum always equals total).
**The charge sequence (the most important 20 lines in these docs):**
1. Read payment + validate policy + state (`can(PENDING|FAILED, PAY)`), check
   `idempotency_keys(key, user_id)` — hit → return stored response.
2. Tx A: payment → PROCESSING (optimistic-lock `version` guard), insert `payment_transactions`
   row (status INITIATED) with our generated `transactionId`. Commit.
3. **Outside any transaction:** call gateway with `transactionId` as the gateway idempotency
   key. (Crash after 2 and before 4 leaves PROCESSING+INITIATED → the reconciler job (doc 09)
   queries Stripe by idempotency key and resolves.)
4. Tx B: record gateway result on the transaction row, transition payment
   (PAID: set `paidAt`; FAILED: keep row, increment attempt), insert `payment_events` row, store
   idempotency response. Commit. Publish `payment.paid|failed` after commit.
**Webhooks:** verify signature → insert `webhook_events (provider, event_id UNIQUE, payload)` —
duplicate → 200 and stop → ack 200 immediately → process async via queue (job replays the same
Tx B path; state machine + version column make out-of-order webhook vs API-response races safe:
whoever commits first wins, the second becomes a no-op transition).
**Recurring rent (off-session):** the rent job (doc 09) charges the default payment method
off-session via the same sequence; failure → `payment.failed` → notifications dunning sequence
(day 0, 3, 7) → trust module applies late-payment consequences after grace period.
**Reconciliation:** nightly job compares yesterday's Stripe balance transactions against our
ledger by `provider_ref`; any orphan on either side pages a human. This is the "never lie about
money" enforcement.
**Payouts & manual payments:** bilo is a marketplace, not a pass-through — Stripe Connect
destination charges, a `payouts` table we own, landlord KYC before lease activation, the
landlord dashboard aggregate endpoint, and manual-payment recording (`PAID` with
`method_type=MANUAL`) are specified in doc 14 §3.

## 10. trust (Ring 0, global)

**Purpose.** The trust score — bilo's moat. Event-driven, explainable, recomputable.
**Owns.** `trust_events`, `trust_score_history`, (writes `users.trust_score`).
**Listens.** `payment.paid` (+2, on-time bonus rules), `payment.overdue`/`payment.failed` after
grace (−5), `rating.created` (±, weighted by rater trust), `dispute.resolved` (± per outcome),
`user.verified` (+10), `lease.completed` (+5).
**API.** `GET /trust/me`, `GET /trust/me/history`; internal read API for reco/matching.
**Domain.** `TrustScoreCalculator` — pure, versioned (`algorithmVersion` on every event so
recalibration is possible: replay `trust_events` with new weights = new scores; the event log is
the truth, the score is a projection). Clamped 0–100, new users start 50.
**Rules.** Listeners are idempotent by event id. Score changes always write both an event and a
history row in one transaction.

## 11. ratings (Ring 3)

As prototype, hardened: only lease participants, only after lease `COMPLETED|TERMINATED`, one
rating per direction per lease (DB unique), immutable once created, visible to the rated user
only after both sides rate or 14 days pass (anti-retaliation — the Airbnb rule; needs
`publishedAt`). Emits `rating.created`.

## 12. disputes (Ring 3)

As prototype (`disputes`, `dispute_evidence`), hardened with `DisputeStateMachine`
(`OPEN → UNDER_REVIEW → RESOLVED | DISMISSED`, admin-driven), evidence via presigned storage
(images/PDFs, capped), all admin actions audited, resolution writes a structured outcome enum
(not free text only) so trust listener can react deterministically. Emits
`dispute.created|resolved`.

## 13. services (Ring 3)

Marketplace for property services (cleaning, plumbing). Prototype model kept
(`service_providers`, `property_services`, `service_requests` + `ServiceRequestStateMachine`:
`PENDING → ACCEPTED → SCHEDULED → COMPLETED | CANCELLED`). Stage 1: manual provider onboarding
via admin endpoints. Monetization hook: `service_requests` gets `payment_id` (nullable) so a
completed request can be charged through the same payment rail later — do not build until
product asks. Tenancy repair workflows are **not** this module — they live in maintenance
(doc 19, module 23 below), which consumes `service_providers` at assignment time.

## 14. ai (Ring 3) — **DEFERRED: builds only at national scale** (business docs README, 02 §6)

**Purpose.** Property Q&A for tenants; listing copy assist for landlords. Spec kept so the seam
and scope are settled; nothing here is in the launch roadmap, and `AI_PROVIDER=mock` until the
deferral lifts.
**Owns.** `ai_property_context`, `ai_conversations`, `ai_messages`.
**API.** `POST /ai/property/:id/ask`, `PUT /ai/property/:id/context` (landlord),
`POST /ai/listing-draft` (landlord).
**Port.** `AIProvider` (`mock|anthropic`). Adapter calls Claude with a system prompt that
restricts answers to provided context and refuses off-topic/negotiation-binding statements.
**Rules.** Read-only over domain (assembles context via properties/leases facades); every
answer stores prompt-context hash for auditability; per-user daily budget (config) enforced
in the service; **AI output is never a source of truth** — it's UX sugar over structured data.

## 15. notifications (Ring 0, global)

**Purpose.** Single place that turns domain events into user-facing noise.
**Owns.** `notifications`, `device_tokens` (new).
**Listens.** `match.*`, `message.sent`, `payment.*`, `lease.*`, `dispute.*`, `waitlist.*`
(doc 17 §6), `roommate.*` (doc 18 §6), `ticket.*` including visit reminders and en-route
(doc 19 §6), `visit.*`, `alert.hit`, `seeker.matched`, `report.resolved` (doc 21),
`subscription.*` (doc 22) — mapping table in code (`notification-rules.ts`): event →
(audience, template, channels).
**Channels.** `NotificationChannelPort[]`: `InAppChannel` (DB row — Stage 1),
`PushChannel` (FCM/APNs — Stage 1.5, `PUSH_ENABLED`), `EmailChannel` (Resend/SES —
`EMAIL_ENABLED`), `WhatsAppChannel` (Business API — `WHATSAPP_ENABLED`, critical events only:
visit confirmations/reminders, payment dunning, termination notices; per-message cost makes
the mapping table the budget control — doc 21 ripples). Channels fail independently; in-app
write is the one that must not fail.
**API.** `GET /notifications?cursor=`, `POST /notifications/read`, `PUT /devices/token`.

## 16. audit (Ring 0, global)

As prototype (interceptor + listener → `audit_logs`), hardened: writes are **fire-and-forget
via queue** (an audit failure must never fail the user's request — log loudly instead), payload
diffs redact PII keys, admin query API with entity/actor/date filters. Append-only, partitioned
at Stage 3, archived to object storage after 12 months.

## 17. health (Ring 0)

`GET /health` (liveness — process up), `GET /health/ready` (readiness — DB ping + migrations
current + queue driver ping when enabled). Load balancer uses readiness; liveness restarts the
container. Never behind auth.

## 18. inventory (Ring 2)

Fully specified in **doc 15**. Owns `rentable_units` — the physical unit tree
(room ⊂ apartment ⊂ building) with the extensible unit-type registry. `properties` becomes the
listing of exactly one unit. Exposes `assertLeasable(tx, unitId, mode)` to leases — a
sanctioned same-tx call (see closing note). Emits `unit.created|updated|archived`.

## 19. identity (Ring 1)

Fully specified in **doc 16**. Owns `identity_records` — the unique government-ID record behind
the verified badge; one identity per account, one account per government ID, record survives
bans. `IdentityVerificationPort` (`mock|manual|provider`). Writes `users.verification_status`
(single-writer, same exception model as trust). Emits `identity.submitted`, `user.verified`,
`identity.rejected|revoked`.

## 20. waitlists (Ring 3)

Fully specified in **doc 17**. Owns `waiting_lists`, `waiting_list_entries` — per-listing pools
with landlord-side filters (verified-only, trust, budget fit); invite path creates a
pre-accepted match, then the normal pipeline runs. Emits `waitlist.*`; listens `lease.*` for
conversion/expiry.

## 21. roommates (Ring 3)

Fully specified in **doc 18**. Owns `roommate_applications`, `roommate_application_reviews` —
shared units rent per-slot (one lease per occupant); current occupants screen applicants in
dedicated conversations and hold a veto; landlord decides last; occupant profile visibility is
consent-first. Emits `roommate.*`; listens `lease.*`.

## 22. geo (Ring 2)

Fully specified in **doc 20**. Owns `points_of_interest` — the OSM-imported, ops-curated POI
catalog (universities first) behind the anchor-and-radius search: any POI or dropped pin
becomes a search anchor with a resizable circle, feeding the feed's PostGIS filter (doc 05
§6). Read-only reference data for the rest of the domain; refreshed by the `poi.refresh` job.

## 23. maintenance (Ring 3)

Fully specified in **doc 19**. Owns `maintenance_tickets`, `ticket_attachments`,
`maintenance_visits` — in-chat repair tickets (category, urgency SLAs, photos/videos), state
machine `REPORTED → … → CLOSED`, visit scheduling with tenant confirmation, 24 h/1 h reminders,
en-route notification. Supersedes the prototype's `maintenance_requests` table. Emits
`ticket.*`; consumes `service_providers` (module 13) at assignment.

## 24. seeker-tools (Ring 3)

Fully specified in **doc 21** (§1–5). Owns `property_visits`, `saved_searches` (+
`alert_hits`), `roommate_seeker_profiles`, guarantor profiles, and the rental-CV projection —
the journey completions: viewing scheduling with `VISIT_PROPOSAL` chat cards and reminders,
market-watching alerts, compare support, tenant↔tenant seeker matching, consent-first fiador
attachment, and the shareable hoja de vida. Emits `visit.*`, `alert.hit`, `seeker.matched`.

## 25. subscriptions (Ring 2)

Fully specified in **doc 22**. Owns `subscriptions`; plan registry + entitlements service
(the only feature gate — direct plan checks are lint-banned), structure-B recurring billing
through `PaymentGatewayPort` with auto e-invoicing, dunning → downgrade-that-never-ransoms,
"Destacado" placement rules. Emits `subscription.*`. Gated on Milestone 2 (business 11).

## 26. safety (Ring 0, global)

Fully specified in **doc 21 §6**. Owns `reports`, `user_blocks` — the user-facing
notice-and-action machinery (Ley 10946): report user/listing/message with reason, admin
pipeline with reasoned outcomes and reporter notification, blocks enforced across feed, chat,
applications, waitlists, and seeker profiles via `safety.isBlocked`. Emits
`report.resolved`, `safety.threshold_reached`.

---

## Cross-module event flow (the big picture)

```
swipe.created ─→ properties(analytics)  ─→ reco projection (S3)
match.accepted ─→ conversations(create) [same-tx call] ─→ notifications
lease.activated ─→ payments(skeleton) [same-tx] ─→ property(RENTED) ─→ notifications
              └─→ waitlists(convert/expire) ─→ roommates(expire when full)
payment.paid ─→ trust(+) ─→ notifications(receipt)
payment.overdue ─→ notifications(dunning) ─→ trust(−, after grace)
dispute.resolved ─→ trust(±) ─→ notifications
lease.completed ─→ ratings(window opens) ─→ property(ACTIVE) ─→ waitlists(spot_opened)
lease.terminated ─→ roommates(void pending reviews)
rating.created ─→ trust(±)
user.verified ─→ trust(+10) ─→ notifications(badge granted)
waitlist.invited / roommate.accepted ─→ matches(create, pre-accepted) [same-tx call]
ticket.* ─→ notifications (reminders & en-route via jobs, doc 19 §6)
```

If a junior remembers one thing: **solid arrows into Ring 0 are always events; the
"[same-tx call]" edges are the only sanctioned synchronous cross-module writes, and every one
is documented here.** The full sanctioned list: match-accept → conversations.create;
lease-sign → payments skeleton; lease-sign → `inventory.assertLeasable` (lock + invariant
check, doc 15 §4); waitlist-invite and roommate-accept → matches.create (docs 17 §3, 18 §4).
Anything new that looks like another one needs an ADR.
