# 05 — Database

PostgreSQL 16 is the system of record. This doc defines the production schema rules, the deltas
from the prototype schema, and the scaling path. The prototype's `prisma/schema.prisma` (currently
pointed at SQLite for demos) is the starting shape — its entity model is good; its *types* are not
production-grade because SQLite forced strings for enums/JSON. That gets fixed first.

## 1. Prototype → production schema deltas (do these in the first migration wave)

| # | Delta | Why |
|---|---|---|
| 1 | `datasource provider = "postgresql"`; delete the SQLite pipeline from the runtime path (keep `scripts/inside_airbnb_to_sqlite.py` as a seed-data generator only) | Postgres is the record |
| 2 | Every stringly-typed status/role/type column becomes a **real Prisma `enum`** (they already exist as constants in `common/constants/domain-enums.ts`) | Type safety in DB *and* client; bad data becomes impossible |
| 3 | Every `metadata String?` / `data String?` becomes **`Json?` (JSONB)** | Queryable, indexable (GIN), no more `db-json.ts` shims |
| 4 | All money columns → **`BigInt` minor units** + `currency Char(3)` (see §3) | Correctness |
| 5 | All timestamps are `timestamptz` (Prisma `DateTime` on PG already is — verify with `@db.Timestamptz(6)`) | Multi-country from day one |
| 6 | IDs: **UUIDv7** generated in app code (`id String @id` + `uuidv7()` in a Prisma client extension) | See §2 |
| 7 | `properties.lat/lng` → keep columns, add generated `geography(Point)` column + GiST index via custom migration SQL | Geo search (§6) |
| 8 | Add missing composite indexes listed in §5 | Hot-path queries |
| 9 | Add `version Int @default(0)` to `payments`, `leases`, `disputes` | Optimistic locking (§7) |
| 10 | New tables: `refresh_tokens`, `idempotency_keys`, `outbox_events`, `webhook_events`, `rent_periods` | Docs 06, 09, 07 |

## 2. Identifiers — UUIDv7

**Decision.** Primary keys are UUIDv7 strings generated in the application.

**Why not v4 (prototype):** v4 is random → B-tree inserts scatter across the index → cache-miss
churn on append-heavy tables (payments, messages, audit). v7 is time-ordered → index locality
comparable to bigserial, still globally unique and unguessable enough for URLs.
**Why not bigserial:** leaks volume, complicates future sharding/extraction, and forces the DB
round-trip before the ID exists (app-generated IDs let us create whole object graphs in one
transaction and log the ID before commit).

## 3. Money — the rules

1. **Integer minor units** (`BigInt`): `750000` = ₡750,000 CRC or `75000` = $750.00 USD. Never
   floats, never `Decimal` arithmetic in JS — all math on integers, formatting at the edge.
2. Every money column has a sibling `currency` (ISO 4217). Amounts of different currencies never
   add. A lease fixes its currency at creation.
3. Fee splitting is explicit on every payment row from day one:
   `amount_minor` (total charged), `platform_fee_minor`, `landlord_net_minor`, with a CHECK
   constraint `amount_minor = platform_fee_minor + landlord_net_minor`.
4. Money mutations are **append-only at the ledger level**: `payments` row (intent, current
   status) + `payment_transactions` (each gateway attempt) + `payment_events` (every state
   change). You can reconstruct any balance by replaying; you can reconcile against Stripe by
   `provider_ref`. Nothing money-related is ever hard-deleted or overwritten.

## 4. Soft delete & retention

- Soft delete (`deleted_at`) **only** where restore/audit semantics matter: `users`,
  `properties`, `leases`. Everything else deletes hard (or never deletes: ledger/audit tables).
- Every query on soft-deletable tables goes through a Prisma client **extension** that injects
  `deletedAt: null` automatically (opt-out via explicit `withDeleted()` helper for admin/audit
  paths). This kills the classic "forgot the filter" bug class centrally instead of by vigilance.
- GDPR-shaped erasure: "delete my account" = soft delete + **PII scrubbing job** (name, phone,
  avatar, bio, message bodies overwritten; ledger rows kept with the anonymized user id, as
  financial records legally must be).

## 5. Indexing policy

- Every FK gets an index (prototype already does this — keep it).
- **Composite indexes are designed per hot query, not per column.** Initial set:
  - `properties (status, city, monthly_price)` — feed base filter
  - `properties (landlord_id, status)` — landlord dashboard
  - `payments (lease_id, due_date)` and `payments (status, due_date)` — rent collection sweep
  - `messages (conversation_id, created_at DESC)` — chat pagination
  - `notifications (user_id, read_at, created_at DESC)` — badge + list
  - `swipes (property_id, action, created_at)` — analytics & reco projection
- Partial indexes where the query is always filtered:
  `CREATE INDEX ... ON payments (due_date) WHERE status = 'PENDING'`.
- Index changes on big tables use `CREATE INDEX CONCURRENTLY` in hand-edited migration SQL.
- Quarterly hygiene job: review `pg_stat_user_indexes` for unused indexes; unused = dropped.

## 6. Search & geo (Stage 1, inside Postgres)

- **Geo:** PostGIS `geography(Point,4326)` column on properties, GiST index;
  "within X km ordered by distance" via `ST_DWithin` + `ST_Distance` in
  `properties.queries.ts` raw SQL. This covers discovery until Stage 3.
- **Text:** `pg_trgm` GIN index on `title || ' ' || description` for fuzzy search;
  full `tsvector` FTS only if product asks for real text search.
- The seam for Stage 3 is the recommendation/search **port** — the API contract
  (`SearchProperties(filters, geo, cursor)`) doesn't change when the engine does.

## 7. Concurrency & invariants

- **Invariants live in constraints:** `UNIQUE(swipes.user_id, property_id)`,
  `UNIQUE(matches.tenant_id, property_id)`, `UNIQUE(rent_periods.lease_id, period_start)`
  (prevents double rent generation), CHECK constraints on money splits and score ranges
  (`trust_score BETWEEN 0 AND 100`).
- **Optimistic locking** (`version` column, compare-and-increment in `UPDATE ... WHERE version = $n`)
  on `payments`, `leases`, `disputes` — the rows humans and webhooks race on. On conflict the
  service retries the read-decide-write cycle once, then surfaces `409`.
- **Advisory locks** (`pg_advisory_xact_lock`) for singleton batch jobs (rent generation) so two
  worker instances can't double-run — cheaper and simpler than a distributed lock service.
- Transaction rules: keep transactions short (no network calls inside — gateway calls happen
  *before or after*, never inside, the DB transaction; doc 07 §Payments shows the exact
  sequence); default isolation `READ COMMITTED`; `SERIALIZABLE` only where a proven anomaly
  exists (none known yet).

## 8. Migration discipline

- Prisma Migrate; SQL files reviewed in PR like any code. Hand-edit for `CONCURRENTLY`,
  backfills, and PostGIS bits.
- **Expand → migrate → contract** for anything touching live tables: add nullable column →
  backfill in batches (worker job, not migration) → add constraint → remove old column in a
  *later* release. No migration may lock a hot table for more than seconds.
- Migrations run as a **separate deploy step** (`prisma migrate deploy`) before the new code
  rolls out; code must always be compatible with schema N and N+1 (that's what expand/contract
  buys us).
- Rollback story: contract steps are delayed a full release, so rolling back the app never
  requires rolling back the schema.

## 9. Scaling path (named seams)

| Stage | Move | Seam that makes it cheap |
|---|---|---|
| 2 | Read replica; route feed/search/analytics reads | `PrismaService` already split into `db` (primary) and `dbRead` handles from day one — Stage 1 binds both to the primary |
| 2 | PgBouncer / RDS Proxy for connection pooling | Nothing in code assumes session state; already required by "stateless" rule |
| 3 | Partition `payments`, `audit_logs`, `notifications`, `messages` by month (`created_at` range) | UUIDv7 + created_at indexes already align with time; partition keys planned now, applied later |
| 3 | Archive cold partitions to object storage | Append-only tables make this a detach+dump |
| 4 | Extract module → its tables move with it | Table-ownership rule (doc 02 §3) means no foreign module joins to untangle; cross-module reads already go through service facades |

## 10. Backups & recovery

Managed PG automated backups + PITR (WAL). **Restore is rehearsed quarterly** into a scratch
instance by a runbook in `docs/runbooks/` — an untested backup is a rumor. RPO/RTO targets per
stage are in doc 01 §4.

## 11. Seeding

- `prisma/seed.ts` stays the dev/demo seed (idempotent, upsert-based).
- The Inside-Airbnb SQLite pipeline is repurposed: a script transforms its output into
  **Postgres seed data** for realistic staging environments. It never touches production.
