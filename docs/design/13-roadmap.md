# 13 — Implementation Roadmap

The build order for turning the prototype into the Stage-1 production backend, sliced into
epics a junior can execute. Each task lists its **spec source** (the doc §) and **acceptance
criteria (AC)**. Order matters: each epic leaves `main` deployable and demo-able.

Sizing: S = ≤1 day, M = 2–3 days, L = ~1 week (for a junior with these docs; halve for a senior).

> **Frontend-driven additions:** doc 14 §4 adds tasks to Epics 3 and 4 (favorites, chat
> card types, Stripe Connect payouts + landlord dashboard, manual payments).
> Treat that list as part of this roadmap.
>
> **Business-plan amendments** (see `docs/business/`): **all AI tasks are removed from the
> launch roadmap** — AI builds only at national scale (business doc 02 §6); `AI_PROVIDER=mock`
> everywhere until then. The student-niche beachhead (business doc 01 §5) adds to Epic 1:
> 1.7 university-email student verification (magic code → `STUDENT_VERIFIED` badge, domain
> allowlist in config) (M); to Epic 2: 2.5 `PropertyType.ROOM` + shared-space amenities (S),
> 2.6 semester-term presets + availability filters (S); to Epic 3: 3.9 roommate-matching feed
> filters on the existing `wantsRoommate`/`roommateOk` fields (M). SINPE Móvil gateway adapter
> moves up from Stage-2 backlog to **Epic 4 stretch / immediately post-launch** — it is the
> monetization rail for Costa Rica (business doc 02).

---

## Epic 0 — Foundations (everything else stands on this)

| # | Task | Size | Spec | AC |
|---|---|---|---|---|
| 0.1 | Switch Prisma to PostgreSQL; docker-compose gets PG 16 + PostGIS; delete SQLite from runtime path | S | 05 §1 | `migrate dev` from empty PG works; app boots; seed runs |
| 0.2 | Typed config schema with boot-fail validation; kill scattered `process.env` | S | 04 P9 | Missing `DATABASE_URL` exits non-zero with a clear message; `.env.example` matches schema (CI check) |
| 0.3 | Schema wave 1: enums, JSONB, timestamptz, UUIDv7 client extension, money → BigInt minor units + fee split columns | M | 05 §1–3 | Old string enums gone; CHECK on fee split; all specs green |
| 0.4 | Soft-delete Prisma extension (auto-filter + `withDeleted`) | S | 05 §4 | Integration test: deleted user invisible by default, visible with opt-out |
| 0.5 | Fastify adapter, helmet, CORS allowlist, global ValidationPipe, error envelope filter + error-code catalog, requestId middleware | M | 12 | Golden-path e2e skeleton passes; errors match envelope |
| 0.6 | pino structured logging with redaction + OTel metrics/traces + Sentry wiring | M | 10 §1–3 | `/metrics` up; a thrown error appears in Sentry with requestId |
| 0.7 | CI pipeline: tsc, eslint (boundaries + banned APIs), vitest, testcontainers, migrate-diff check | M | 11 §3 | Red build on: boundary violation, `new Date()` in domain, drift |
| 0.8 | `Clock`, `CachePort`(+Noop), `QueuePort`(+Inline), `StoragePort`(+Local/S3), `DomainEventPublisher` (after-commit emitter) | L | 08, 09 | Contract tests pass for all adapters; publisher flushes only after commit (test: rollback emits nothing) |

## Epic 1 — Identity (auth + users + preferences)

| # | Task | Size | Spec | AC |
|---|---|---|---|---|
| 1.1 | `auth_identities` table + migration off `users.google_id` | S | 06 §2 | Backfill migration tested |
| 1.2 | `POST /auth/oauth/exchange` with Google verifier adapter (JWKS cached) | M | 06 §2 | Bad `aud`/`iss`/expired rejected (tests with crafted JWTs); find-or-create + email-link paths covered |
| 1.3 | Apple verifier adapter (nonce, first-auth name capture, relay emails) | M | 06 §2 | Same suite as 1.2 against Apple-shaped tokens |
| 1.4 | Refresh tokens: hashed storage, rotation, family reuse-detection, logout(-all) | M | 06 §3 | Reuse of rotated token revokes family (test); prune job |
| 1.5 | Gate mock-login behind `AUTH_ALLOW_MOCK`; prod boot rejects it | S | 06 §1 | Boot test |
| 1.6 | Users module hardening: public-profile DTO, `DELETE /users/me` + `pii.scrub` job | M | 07 §2, 05 §4 | Scrub verified in integration test; ledger rows survive anonymized |

## Epic 2 — Supply (properties + storage)

2.1 Property CRUD hardening + status machine + policies (M; 07 §4) — AC: non-owner PATCH → 403,
archived hidden from feed. · 2.2 Presigned image upload flow (M; 03 ADR-11) — AC: e2e against
local driver; size/mime caps. · 2.3 PostGIS column + geo query in `properties.queries.ts` (M;
05 §6) — AC: within-radius integration test with seeded coords. · 2.4 Analytics counters as
idempotent event listeners (S; 07 §4).

## Epic 3 — Discovery (feed + swipes + matches + chat)

3.1 `RecommendationEnginePort` + Postgres engine with scored, explainable SQL (L; 07 §5) — AC:
weights from config; per-response score log; excludes swiped/own/inactive. · 3.2 Swipes with
upsert-grace + events (S). · 3.3 Matches + state machine + same-tx conversation creation (M;
07 §6). · 3.4 Chat endpoints with cursor pagination + read markers (M; 07 §7). · 3.5 Feed
caching via `getOrSet` (works as noop today) (S; 08 §3). · 3.6 Anchor+radius feed params over
PostGIS (`anchorLat/anchorLng/radiusM`, clamps, `distanceM` in results) (M; 20 §1) — AC:
within-radius + distance-order integration test. · 3.7 geo module: POI table + `poi.refresh`
Overpass import + typeahead + admin curation; `UNIVERSITY` seeded and alias-curated (L; 20
§3–5) — AC: import idempotent; "TEC" resolves; curated fields survive refresh. · 3.8 Real map
in filter sheet: MapLibre + OSM tiles + attribution, draggable pin, resizable circle, POI
markers/search, "buscar en esta zona" (L; 20 §2,5).

## Epic 4 — The rail (leases + payments) — the senior-attention epic

> **Amended by business doc 05 (legal):** launch is **Phase A** — direct tenant→landlord SINPE
> with bilo verification; no charging gateway, no pooled funds. Tasks 4.3–4.6 (Stripe adapter,
> charge sequence, webhooks, payment methods) become **Phase B, build-on-trigger**; in their
> place: 4.3a `DirectSinpeVerificationAdapter` + payment verification/confirmation flow (M),
> 4.4a `InvoicingPort` + e-invoice on fee charges (M), and the doc 14 §4 manual-payment task
> absorbs into 4.3a. The ledger, state machine, `RentSchedule`, jobs, and reconciliation tasks
> (4.1, 4.2, 4.7, 4.8) are **unchanged** — they are rail-agnostic by design.
>
> **Note (business doc 02 restructure):** the first *charging* adapter is now expected to be a
> **CR PSP (ONVO/Tilopay-class) SINPE adapter** powering "Cobro Automático" (R2) — likely
> pilot-adjacent, not distant Phase B — plus a small **fee-collection flow** for the booking
> fee (R1): SINPE into bilo's own account, gate lease-contract issuance on confirmed receipt.
> Both fit the existing `PaymentGatewayPort` (webhook-driven, like the Stripe design).
> Task 4.5's webhook infrastructure (signature verify, `webhook_events` dedup, fast-ack)
> builds as designed — the provider is the PSP instead of Stripe.

| # | Task | Size | Spec | AC |
|---|---|---|---|---|
| 4.1 | `LeaseStateMachine` + `RentSchedule` (pure, exhaustively unit-tested: dueDay 28–31, leap, proration) | M | 07 §8 | Transition table 100% covered; proration formula property-tested |
| 4.2 | Lease endpoints + activation transaction (deposit + first rent + rent_period skeleton) | M | 07 §8 | Rollback test: gateway-free activation is atomic |
| 4.3 | `PaymentGatewayPort` + Stripe adapter + mock adapter (scripted outcomes) | L | 08 §2 | Contract tests; off-session charge path |
| 4.4 | Charge sequence (Tx A / gateway / Tx B) + `Idempotency-Key` + optimistic locking | L | 07 §9, 12 §4 | Tests: replay key → stored response; race webhook-vs-response → single PAID; crash between Tx A/B resolved by 4.7 |
| 4.5 | Stripe webhooks: signature verify, `webhook_events` dedup, fast-ack, async processing | M | 07 §9 | Duplicate event id → 200 no-op |
| 4.6 | Payment methods (SetupIntent flow) | M | 07 §9 | e2e with mock gateway |
| 4.7 | Jobs: `rent.generate`, `rent.charge`, `payment.overdue-sweep`, `payment.resolve-stuck`, `payment.reconcile` | L | 09 §4 | Each job run twice = same result (idempotency tests); advisory-lock test |
| 4.8 | Fee splitting (`FeeCalculator`) wired into every charge | S | 07 §9 | CHECK constraint + property test |

## Epic 5 — Trust fabric (trust + ratings + disputes + notifications + audit)

5.1 Trust listeners + versioned calculator + history (M; 07 §10) — AC: replay produces identical
scores. · 5.2 Ratings with anti-retaliation publishing (M; 07 §11). · 5.3 Disputes hardening +
evidence uploads + structured resolutions (M; 07 §12). · 5.4 Notification rules table + in-app
channel + device-token registry; push channel behind `PUSH_ENABLED` (M; 07 §15). · 5.5 Audit via
queued writes + PII-redacted diffs + admin query API (M; 07 §16).

## Epic 6 — Services + launch hardening (AI removed — deferred to national scale)

6.1 ~~Anthropic adapter~~ (deferred; business doc 02 §6). · 6.2 Services module state machine +
admin onboarding (M; 07 §13). · 6.3 Rate limiting tiers (S; 12 §6). · 6.4 Load test the golden
path (k6) against staging; fix the top 3 findings (M). · 6.5 Runbooks + restore drill + alert
wiring (M; 10 §4–6). · 6.6 Security pass: dependency audit, OWASP top-10 checklist, secret scan
(M).

**Stage-1 launch gate:** Epics 0–6 done · golden-path e2e green · reconciliation clean over a
week of staging traffic with real Stripe test mode · restore drill executed · alerts fire in a
game-day test.

## Epic 7 — Inventory, identity & community wave (docs 15–19; launch-adjacent)

The unit hierarchy, verified identities, waiting lists, roommate screening, and maintenance
tickets. **Not part of the Stage-1 launch gate** — product picks which tasks ride the launch
train (7.1 and 7.3 are the strongest launch candidates for the student niche; the rest are
fast-follows). Sequencing: 7.1–7.2 unblock 7.5–7.8; 7.3 is independent and can start during
Epic 5; 7.4 must precede 7.6–7.7. If 7.1 is chosen for launch, land its expand-phase migration
with Epic 2 to avoid touching `properties` twice.

| # | Task | Size | Spec | AC |
|---|---|---|---|---|
| 7.1 | inventory module: `rentable_units` + type registry + CRUD/tree endpoints + `properties.unit_id` expand & backfill | L | 15 | Registry rejects invalid parent/child pairs (test matrix over the §3 catalog); backfill idempotent; tree endpoint depth-capped |
| 7.2 | leases × inventory: `unit_id`, `occupancyMode`, `assertLeasable` (ancestor/descendant + slot invariants, `FOR UPDATE`) | M | 15 §4, 07 §8 | Concurrent activation race → exactly one wins; conflict matrix (exclusive-over-slot, slot-over-exclusive, oversell) covered |
| 7.3 | identity module: `identity_records` + HMAC hashing + manual review queue + badge projection + `user.verified` trust hook | L | 16 | Duplicate document → constraint conflict + appeal path; erasure scrubs PII but keeps hash; document number absent from logs (redaction test) |
| 7.4 | conversations generalization: `(context_type, context_id)` + `conversation_participants` + backfill | M | 18 §5 | Existing match chats migrated; access control by participant row (e2e); `ROOMMATE_REVIEW` freeze-on-resolve |
| 7.5 | waitlists module: join/withdraw, landlord filter view, invite → pre-accepted match, caps, expiry job | M | 17 | `verifiedOnly` filter e2e; invite opens conversation in same tx; 20-entry cap and `requiresVerifiedIdentity` enforced at join |
| 7.6 | roommates module: applications + per-occupant reviews + veto chain + consent-first visibility + expiry job | L | 18 | Unanimous-approval logic property-tested (occupant set changes mid-review); occupant veto final; landlord cannot write visibility |
| 7.7 | maintenance module: tickets + attachments (presign, EXIF strip) + state machine + `MAINTENANCE_TICKET` chat card | L | 19 | Transition table 100% covered; reopen window enforced; card renders from live ticket status |
| 7.8 | maintenance visits: scheduling + confirm/propose + reminder, auto-close, SLA-nudge jobs + en-route push | M | 19 §4–6 | Each job run twice → one notification (dedup anchors); en-route → tenant push e2e; NO_SHOW path recorded |

---

## Stage-2 backlog (pre-designed, do not build early)

Redis on (`CACHE_DRIVER`, throttler store, denylist) · BullMQ on (`QUEUE_DRIVER`) · Outbox on
(`EVENT_BUS`) + relay + prune · read replica + `dbRead` routing · WebSocket chat gateway ·
match/lease expiry jobs already exist — verify under queue driver · PgBouncer.

Each item is a config flip plus a focused PR; the seams were built in Stage 1. That is the whole
point of this design.
