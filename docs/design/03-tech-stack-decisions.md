# 03 — Tech Stack Decisions

Each decision is a mini-ADR: Context → Decision → Alternatives → Trade-offs → Revisit when.
These are settled. Re-opening one requires a written counter-ADR, not a Slack argument.

---

## ADR-01: Language & runtime — TypeScript on Node.js 22 LTS, strict mode

**Context.** Team skill, ecosystem for the integrations we need (Stripe, OAuth, AWS), and the
requirement that the codebase be class-based and readable by juniors.

**Decision.** TypeScript with `"strict": true`, `"noUncheckedIndexedAccess": true`,
`exactOptionalPropertyTypes: true`. Node 22 LTS. ESLint + Prettier enforced in CI.

**Alternatives.** Go (great runtime economics, weaker ORM/validation ecosystem for this team,
slower product iteration); Kotlin/Spring (heavyweight for team size).

**Trade-offs.** Node's single-threaded CPU profile — fine, this workload is I/O-bound; CPU-heavy
work (image processing) goes to the queue/worker or a managed service.

**Revisit when.** A specific hot path is measurably CPU-bound (then: extract that path, not the
language).

---

## ADR-02: Framework — NestJS 10+

**Context.** We need structure that many developers already know, first-class DI (our whole
pluggable-capability system rides on DI tokens), guards/pipes/interceptors, and OpenAPI generation.
The prototype is already NestJS.

**Decision.** Keep NestJS. Use its DI container as the composition root for all ports (doc 08).
Use Fastify adapter instead of Express (`@nestjs/platform-fastify`) for ~2x throughput on the
same hardware — the migration cost from the prototype's Express is near zero because we never
touch raw `req`/`res` outside two auth callbacks.

**Alternatives.** Express/Fastify bare (no DI, no conventions — every pattern in doc 04 would be
hand-rolled); Hono/tRPC (great for small apps; weaker long-term module discipline for a
17-module domain).

**Trade-offs.** NestJS decorators add a learning curve and some "magic". Mitigation: docs 02/04
define the only sanctioned patterns; anything clever beyond them is rejected in review.

**Revisit when.** Never expected at the framework level; individual modules can be extracted with
their domain classes intact because domain classes don't import NestJS.

---

## ADR-03: Database — PostgreSQL 16 (managed), single system of record

**Context.** Relational domain (users–properties–leases–payments is a textbook relational graph),
strong consistency needs around money, geo queries, JSON flexibility for metadata.

**Decision.** One managed PostgreSQL 16+ instance (RDS/Cloud SQL/Neon) as the **only system of
record**. Extensions: `postgis` (geo search), `pg_trgm` (fuzzy text), `pgcrypto`. Everything else
(Redis, Neo4j, search indexes) is a rebuildable projection, never authoritative.

**Alternatives.** MySQL (fine, weaker geo/JSON); MongoDB (rejected: we would hand-roll joins and
transactions that Postgres gives us free); CockroachDB/Spanner (Stage-4 conversation, not now).

**Trade-offs.** Vertical scaling has a ceiling — addressed stage-wise: read replicas (Stage 2),
partitioning (Stage 3), extraction (Stage 4). See doc 05 §9.

**Revisit when.** Sustained write saturation on a top-tier instance after partitioning (Stage 4).

---

## ADR-04: ORM — Prisma 5+, with eyes open

**Context.** The prototype uses Prisma. Prisma gives us a typed client, a declarative schema, and
a solid migration story — the single most junior-friendly data layer in the ecosystem.

**Decision.** Keep Prisma. Rules that keep it safe at scale:
- **Migrations are Prisma Migrate SQL files, reviewed like code.** Hand-edit generated SQL when
  needed (concurrent index creation, partial indexes); Prisma allows customized migrations.
- **Raw SQL is legitimate** for the ~5% of queries where the query builder fights us (feed
  ranking, geo search, reporting): `prisma.$queryRaw` with typed row mappers, kept in one file
  per module (`<name>.queries.ts`) so they're auditable.
- **Interactive transactions** (`prisma.$transaction(async tx => ...)`) are the only sanctioned
  multi-write mechanism; services receive `tx` as a parameter when composing (see doc 07 §Leases).
- **Read-replica routing** at Stage 2 via Prisma's `@prisma/extension-read-replicas`.

**Alternatives.** Drizzle (closer to SQL, lighter; weaker migration ergonomics for the team
today); TypeORM (rejected: long-standing correctness footguns); Knex/raw (rejected: we'd rebuild
type safety by hand).

**Trade-offs.** Prisma's engine adds a binary dependency and its query shapes need watching
(N+1 via lazy includes doesn't exist — Prisma is explicit — but over-fetching via `include` does;
review rule: selects are explicit on hot paths).

**Revisit when.** A measured hot path where Prisma's generated SQL is the bottleneck and raw SQL
inside Prisma isn't enough (unlikely before Stage 3).

---

## ADR-05: API style — REST + OpenAPI, versioned under /api/v1

**Decision.** REST with `@nestjs/swagger` generating OpenAPI from DTOs; the spec is the mobile
team's contract, published as a CI artifact. Conventions in doc 12.

**Alternatives.** GraphQL (rejected for v1: caching, rate limiting, and authorization become
per-field problems; our clients are 1st-party apps with known screens); tRPC (couples us to TS
clients).

**Revisit when.** Third-party developer API becomes a product goal (then: add a gateway, don't
rewrite v1).

---

## ADR-06: Validation & serialization — class-validator / class-transformer

**Decision.** Keep the prototype's approach: DTO classes with `class-validator` decorators,
global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`, and
response classes with `@Expose`-based serialization so nothing private leaks by accident.

**Alternative.** Zod (excellent; but class DTOs feed `@nestjs/swagger` directly and match the
"classes" requirement for the codebase). Not worth running both systems.

---

## ADR-07: Cache — Redis 7, strictly optional, strictly a cache

**Decision.** Redis behind `CachePort` with `CACHE_DRIVER=off|redis` (doc 08). Redis is never a
system of record: any Redis wipe must be a latency event, not a data-loss event. Redis also backs
the queue (BullMQ) and rate limiting at Stage 2 — three uses, one operational dependency.

---

## ADR-08: Queue & scheduling — BullMQ at Stage 2, inline at Stage 1

**Decision.** `QueuePort` with `QUEUE_DRIVER=inline|bullmq`. Inline driver executes jobs
immediately (Stage 1 traffic) with `@nestjs/schedule` cron for recurring jobs; BullMQ driver adds
Redis-backed persistence, retries with backoff, and a dashboard. Job handlers are identical in
both drivers — that's the point of the port.

**Alternative.** SQS/PubSub (fine, but ties local dev to cloud emulators); pg-boss (honorable
mention — Postgres-backed queue; we keep it as the fallback if we want queues before Redis).

---

## ADR-09: Payments — Stripe first, behind PaymentGatewayPort

**Decision.** Stripe (cards, off-session charges for recurring rent) as the first real adapter of
the prototype's existing `PAYMENT_PROVIDER` port. **bilo's ledger is ours**: Stripe is a money
mover, our `payments/payment_transactions/payment_events` tables are the source of truth for
"who owes what" (doc 07 §Payments). LATAM-specific rails (SINPE, SPEI, PIX) become additional
adapters at Stage 3 — the port's `Charge/Refund/Webhook` shape is designed for that.

---

## ADR-10: AI — Anthropic Claude behind AIProvider port, **deferred to very late stage**

**Decision (amended per business plan).** AI features ship **post-national-scale only**
(business docs README + 02 §6). The `AIProvider` port and module spec stay in the design
(doc 07 §14) so the seam exists, but `AI_PROVIDER=mock` is the default at every launch stage
and **no AI tasks are in the launch roadmap**. When enabled, the adapter is Anthropic Claude
(property Q&A, listing copy, lease clause review), grounded in `AIPropertyContext`, read-only
over domain state.

---

## ADR-11: Object storage — S3-compatible behind StoragePort

**Decision.** Property images and dispute evidence go to S3-compatible storage
(`STORAGE_DRIVER=local|s3`), uploaded via **presigned URLs** (the API never proxies file bytes).
Image resizing is a worker job at Stage 2; client-side resize is acceptable at Stage 1.

---

## ADR-12: Identity — OAuth only (Google + Apple)

Covered fully in doc 06. Named here because it's a stack decision too: **no password storage,
ever** — it removes the single largest breach liability a startup can carry, and both mobile
platforms require/privilege these providers anyway.

---

## Summary table

| Concern | Stage 1 | Toggle | Later stages |
|---|---|---|---|
| Runtime | Node 22 + TS strict | — | same |
| Framework | NestJS + Fastify | — | same |
| DB | Postgres 16 managed | — | +replica (S2), partitions (S3) |
| ORM | Prisma | — | same + read-replica ext |
| Cache | NoopCache | `CACHE_DRIVER` | Redis (S2) |
| Queue | inline + cron | `QUEUE_DRIVER` | BullMQ (S2) |
| Events | EventEmitter2 after-commit | `EVENT_BUS` | Outbox (S2) |
| Payments | Stripe | `PAYMENT_PROVIDER` | +LATAM rails (S3) |
| Recommendations | Postgres SQL | `RECOMMENDATION_ENGINE` | Neo4j (S3) |
| AI | mock (deferred — business doc 02 §6) | `AI_PROVIDER` | Anthropic at national scale |
| Storage | S3 / local | `STORAGE_DRIVER` | same |
| Search | Postgres FTS + PostGIS | — | OpenSearch (S3, if measured) |
