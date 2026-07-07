# 08 — Pluggable Capabilities (Ports & Adapters)

This is the mechanism behind "Redis is an env var", "Neo4j is an env var", and every other
scale-by-configuration promise in doc 01. It is one pattern, applied uniformly, to a **closed
list** of capabilities.

## 1. The canonical shape (copy this exactly)

Every capability has four pieces. Example: cache.

```ts
// infra/cache/cache.port.ts — the port: an interface + a DI token
export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  getOrSet<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T>;
}
export const CACHE_PORT = Symbol('CACHE_PORT');
```

```ts
// infra/cache/noop.cache.ts — the Null Object adapter: "off" costs nothing
@Injectable()
export class NoopCache implements CachePort {
  async get<T>(): Promise<T | null> { return null; }
  async set(): Promise<void> {}
  async del(): Promise<void> {}
  async getOrSet<T>(_k: string, _ttl: number, fn: () => Promise<T>): Promise<T> { return fn(); }
}
```

```ts
// infra/cache/redis.cache.ts — the real adapter (ioredis), JSON serialization,
// and one crucial property: DEGRADE, don't die. A Redis outage logs + metrics
// as an incident but every method falls back to the noop behavior.
```

```ts
// infra/cache/cache.module.ts — the factory: env var picks the adapter at boot
@Global()
@Module({
  providers: [{
    provide: CACHE_PORT,
    inject: [AppConfig],
    useFactory: (cfg: AppConfig): CachePort =>
      cfg.cache.driver === 'redis' ? new RedisCache(cfg.cache) : new NoopCache(),
  }],
  exports: [CACHE_PORT],
})
export class CacheModule {}
```

```ts
// consumer — written once, identical at every stage
constructor(@Inject(CACHE_PORT) private readonly cache: CachePort) {}
const feed = await this.cache.getOrSet(`feed:${userId}`, 300, () => this.buildFeed(userId));
```

Rules that keep this honest:
- **Ports live with their owner**: infra-generic ports in `src/infra/*`; domain-specific ports
  (recommendation engine, payment gateway, AI) in the owning module's `ports/` dir.
- **Adapters never leak**: no consumer imports `RedisCache` or `ioredis`. Only the factory knows
  concrete classes. (`eslint-plugin-boundaries` enforces this.)
- **Every port ships a contract test** (doc 11): one test suite runs against *all* adapters of a
  port, so `NoopCache` and `RedisCache` provably behave alike where it matters.
- **Unknown driver value = boot failure** with a message listing valid values. Silent fallback
  to noop in production is how you run three months without cache and not notice.

## 2. The capability catalog (closed list — extending it requires a PR to this doc)

| Port | Env var | Stage-1 default | Adapters (now → later) | Degradation policy on adapter failure |
|---|---|---|---|---|
| `CachePort` | `CACHE_DRIVER` | `off` | Noop → Redis | Degrade to miss; alert |
| `QueuePort` + `JobSchedulerPort` | `QUEUE_DRIVER` | `inline` | Inline → BullMQ (Redis) | Inline = sync execution; BullMQ failure = enqueue error → retry/500 |
| `DomainEventBus` | `EVENT_BUS` | `emitter` | EventEmitter2 → Transactional Outbox (doc 09) | Emitter: none (in-proc); Outbox: events wait in DB |
| `PaymentGatewayPort` | `PAYMENT_PROVIDER` | `stripe` (`mock` in dev/test) | Mock → Stripe → +PIX/SPEI/SINPE adapters (S3) | **Never degrade silently** — payment ops fail loudly |
| `RecommendationEnginePort` | `RECOMMENDATION_ENGINE` | `postgres` | Postgres → Neo4j (S3) | Neo4j down → factory-level fallback to Postgres engine; alert |
| `AIProvider` | `AI_PROVIDER` | `mock` (AI deferred to national scale — business doc 02 §6) | Mock → Anthropic (late) | Graceful "assistant unavailable" response |
| `StoragePort` | `STORAGE_DRIVER` | `s3` (`local` in dev) | Local → S3-compatible | Fail loudly (uploads are user-visible) |
| `NotificationChannelPort[]` | `PUSH_ENABLED`, `EMAIL_ENABLED` | in-app only | InApp → +FCM/APNs, +Email | Channels independent; in-app must succeed |
| `IdentityProviderPort` (per provider) | — (both always on) | google, apple | — | Provider outage = login for that provider fails; sessions unaffected |
| `Clock` | — | system | System → Fixed (tests) | — |

Notes on specific ports:

- **Neo4j is a projection, never a record** (doc 03 ADR-03). The Neo4j adapter subscribes to
  `swipe.created`/`match.*`/`preferences.updated` to maintain its graph; if the graph is lost it
  is rebuilt from Postgres by a backfill job. That's why the fallback-to-Postgres policy is safe.
- **PaymentGatewayPort interface** is deliberately narrow and gateway-shaped, designed against
  *two* targets (Stripe + a LATAM PSP) even though we build one, so Stripe-isms don't leak:
  `createSetupIntent`, `chargeOffSession(req: ChargeRequest): ChargeResult`,
  `refund`, `verifyAndParseWebhook(raw, sig): GatewayEvent`. Amounts in minor units + currency,
  our `transactionId` as the gateway idempotency key.
- **QueuePort** carries typed job definitions (`JobDefinition<TPayload>` with name, handler,
  retry policy). The inline adapter runs the handler immediately in-process (with try/catch +
  log); the BullMQ adapter gets retries/backoff/DLQ. Handlers must already be idempotent at
  Stage 1 — that's what makes the driver swap a config change.

## 3. Caching policy (so Redis day is boring)

What we will cache when `CACHE_DRIVER=redis` flips on — decided now so code is written against
`getOrSet` from the start:

| Key | TTL | Invalidation |
|---|---|---|
| `feed:{userId}` | 5 min | TTL only (staleness harmless) |
| `property:{id}` (public detail DTO) | 10 min | `del` on property.updated |
| `trust:{userId}` | 1 h | `del` on trust.score_updated |
| `reco:filters:{city}` (aggregates) | 15 min | TTL only |
| rate-limit counters, session denylist | native | — |

Cache keys are built by one `CacheKeys` class (no string literals scattered); values are
DTO-shaped JSON, never Prisma entities. **Never cache:** anything payment/lease/auth-decision
related — correctness data is read from Postgres, always.

## 4. What it looks like on launch day of each stage

- **Stage 1:** `CACHE_DRIVER=off QUEUE_DRIVER=inline EVENT_BUS=emitter RECOMMENDATION_ENGINE=postgres PAYMENT_PROVIDER=stripe AI_PROVIDER=mock STORAGE_DRIVER=s3`
- **Stage 2 flip:** provision Redis; set `CACHE_DRIVER=redis QUEUE_DRIVER=bullmq EVENT_BUS=outbox`; deploy worker as its own service. Zero code changes if the contract tests were honest.
- **Stage 3 flip:** provision Neo4j; run the graph backfill job; set `RECOMMENDATION_ENGINE=neo4j`. Flip back instantly if quality/latency regresses — that rollback path is the whole reason the port exists.
