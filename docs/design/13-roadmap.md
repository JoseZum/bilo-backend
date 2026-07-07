# 13 — Implementation Roadmap

The build order for turning the prototype into the Stage-1 production backend, sliced into
epics a junior can execute. Each task lists its **spec source** (the doc §) and **acceptance
criteria (AC)**. Order matters: each epic leaves `main` deployable and demo-able.

Sizing: S = ≤1 day, M = 2–3 days, L = ~1 week (for a junior with these docs; halve for a senior).

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
caching via `getOrSet` (works as noop today) (S; 08 §3).

## Epic 4 — The rail (leases + payments) — the senior-attention epic

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

## Epic 6 — AI + services + launch hardening

6.1 Anthropic adapter + grounding + budgets (M; 07 §14). · 6.2 Services module state machine +
admin onboarding (M; 07 §13). · 6.3 Rate limiting tiers (S; 12 §6). · 6.4 Load test the golden
path (k6) against staging; fix the top 3 findings (M). · 6.5 Runbooks + restore drill + alert
wiring (M; 10 §4–6). · 6.6 Security pass: dependency audit, OWASP top-10 checklist, secret scan
(M).

**Stage-1 launch gate:** all epics done · golden-path e2e green · reconciliation clean over a
week of staging traffic with real Stripe test mode · restore drill executed · alerts fire in a
game-day test.

---

## Stage-2 backlog (pre-designed, do not build early)

Redis on (`CACHE_DRIVER`, throttler store, denylist) · BullMQ on (`QUEUE_DRIVER`) · Outbox on
(`EVENT_BUS`) + relay + prune · read replica + `dbRead` routing · WebSocket chat gateway ·
match/lease expiry jobs already exist — verify under queue driver · PgBouncer.

Each item is a config flip plus a focused PR; the seams were built in Stage 1. That is the whole
point of this design.
