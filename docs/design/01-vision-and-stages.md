# 01 — Vision & Scale Stages

## 1. What bilo is

bilo is a rental platform: **discovery (swipe/match) + trust layer + the monthly payment rail**.
Tenants find properties the way they find people on dating apps; landlords get vetted,
trust-scored tenants; and — the key part — **rent flows through bilo every month**.

The long-term ambition is to be for renting what Uber is for rides: the default rail. That
ambition is a *direction*, not a Stage-1 requirement. What it concretely means for engineering
is:

- The **payment and lease domain must be correct from day one** (money bugs kill trust businesses).
- The **architecture must scale by configuration and extraction, not by rewrite**.
- The **domain model must not hard-code "housing"** — leases, recurring payments, trust, and
  disputes generalize to any recurring rental (vehicles, equipment, storage). Housing-specific
  fields live in the Property module and in `metadata` JSONB, not in the lease/payment core.

**Launch market: Costa Rica** (established by the frontend prototype — CRC amounts, SINPE Móvil,
San José zones; see doc 14). Default currency is `CRC`; Stripe cards are the first rail, SINPE
Móvil is the first post-Stripe gateway adapter. Multi-country is Stage 3.

## 2. Where the money comes from

Engineering needs to know the revenue model because it dictates what must never break:

| Revenue stream | Mechanism | Engineering implication |
|---|---|---|
| **Take rate on rent** (primary) | % fee added to or deducted from each monthly payment | Payment ledger must support fee splitting from day one (`platform_fee_minor` on every payment) |
| Landlord subscriptions | Premium listing tools, analytics | Plan/entitlement flags on users; no new infra |
| Value-added services | Cleaning, moving, insurance via `services` module | Service marketplace already modeled in prototype |
| Deposit handling / guarantees | Hold and arbitrate deposits | Dispute + evidence flow must be audit-grade |

A platform moving rent for 10,000 active leases at ~$700/month with a 2% take rate is ~$1.7M/year
of revenue. That is the Stage-2 target and it requires **zero** exotic infrastructure — it
requires *correct payments, trustworthy dispute handling, and uptime*. That is why these docs
spend more pages on the payment ledger than on Neo4j.

## 3. Scale stages

Every technical decision in these docs is tagged with a stage. **We build the current stage and
leave named seams for the next one.** Numbers are order-of-magnitude planning figures, not
promises.

### Stage 0 — Prototype (where we are)

- SQLite, mock login, mock payments, in-process everything.
- Purpose: demo flows. Nothing here is load-bearing.

### Stage 1 — Production launch (target of this design)

- **Scale envelope:** up to ~50k registered users, ~5k active leases, ~50 req/s peak.
- **Topology:** 2+ stateless API instances behind a load balancer → one managed PostgreSQL 16
  (primary only) → object storage (S3-compatible) for images.
- **Everything runs in the monolith.** Cache port bound to `NoopCache`. Queue port bound to
  in-process scheduler. Recommendations run as SQL.
- Real Google + Apple OAuth. Real payment gateway (Stripe) behind the payment port.
- Full observability from day one (this is not optional at any stage).

### Stage 2 — Growth

- **Scale envelope:** ~500k users, ~50k active leases, ~500 req/s peak.
- **What turns on (by env var / config, no code redesign):**
  - `CACHE_DRIVER=redis` — feed, property detail, trust score caching.
  - `QUEUE_DRIVER=bullmq` — rent generation, notifications, webhooks move to Redis-backed queue.
  - `EVENT_BUS=outbox` — domain events go through the transactional outbox (see doc 09).
  - Postgres read replica; read-heavy queries routed via the replica client.
- WebSocket gateway for chat (same codebase, dedicated deployment).

### Stage 3 — Scale

- **Scale envelope:** millions of users, hundreds of thousands of leases, multi-country.
- `RECOMMENDATION_ENGINE=neo4j` — graph-based recommendations (collaborative filtering on the
  swipe graph). Postgres remains the system of record; Neo4j is a projection.
- Search extracted to OpenSearch/Meilisearch if Postgres FTS + PostGIS stop being enough.
- Table partitioning for append-heavy tables (`payments`, `audit_logs`, `notifications`).
- Multi-currency and country-specific payment adapters become real (the ports already exist).

### Stage 4 — Extraction

- Individual modules extracted into services **only when a specific module has a specific
  scaling or team-ownership problem**. The module boundaries in doc 02 are the future service
  boundaries. Likely first extractions: `messaging` (connection-heavy), `payments`
  (compliance isolation), `recommendations` (already behind a port).

### What we refuse to do early

- No microservices at Stages 1–3. One deployable, many modules.
- No Kafka/event streaming before the outbox pattern is insufficient (measured, not assumed).
- No Kubernetes requirement at Stage 1 — containers on a managed platform (ECS/Fly/Railway/
  Cloud Run) are enough; the Dockerfile is the contract.
- No GraphQL; REST + OpenAPI until a real client need appears (see doc 03).

## 4. Non-functional requirements by stage

| Requirement | Stage 1 | Stage 2 | Stage 3 |
|---|---|---|---|
| API availability | 99.5% | 99.9% | 99.95% |
| p95 read latency | < 300 ms | < 200 ms | < 150 ms |
| Payment correctness | **Zero tolerance: every money movement idempotent, ledgered, reconcilable** — all stages |
| Recovery point (RPO) | ≤ 15 min (managed PG backups) | ≤ 5 min (WAL archiving) | ≤ 1 min |
| Recovery time (RTO) | ≤ 4 h | ≤ 1 h | ≤ 15 min |
| Auth | OAuth only (Google + Apple), no stored passwords — all stages |
| Data protection | Soft delete + audit log; PII export/delete endpoints (GDPR-shaped) from Stage 1 |

## 5. The one-paragraph summary for new hires

We run a NestJS modular monolith in TypeScript over PostgreSQL. Domain logic is plain classes;
workflows are explicit state machines; money is integer minor units in a ledger; everything that
could vary (cache, queue, payments, AI, recommendations, storage) is a port with adapters chosen
by environment variables, so scaling is mostly flipping config. Modules talk to each other through
domain events and a small number of explicit service interfaces, never through each other's
tables. If you understand doc 02 and doc 04, you can safely change anything.
