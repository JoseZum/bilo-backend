# 02 — Architecture

## 1. Decision: Modular monolith

**Context.** One small team, one product, unclear final feature set, ambition to scale to
millions of users. The classic failure modes are (a) a big-ball-of-mud monolith that can never be
split, and (b) premature microservices that multiply operational cost by 10 before product-market
fit.

**Decision.** A single deployable NestJS application composed of strictly-bounded domain modules.
Module boundaries are treated as if they were service boundaries: enforced dependency rules,
communication via events and explicit interfaces, no cross-module table access.

**Alternatives considered.**
- *Microservices from day one* — rejected: multiplies deployment, observability, and data-
  consistency work; we lose transactions across domains exactly where we need them most
  (lease + payment creation).
- *Unstructured monolith ("just src/ and files")* — rejected: cheap now, unpayable later; can
  never be extracted.
- *Serverless functions* — rejected: cold starts on payment webhooks, poor fit for long-lived
  WebSocket chat later, weaker local dev story.

**Trade-offs accepted.** One runtime means one blast radius at Stage 1 (mitigated by health
checks, multiple instances, and fast rollback). Scaling is whole-app until Stage 4 extraction
(acceptable: the app is stateless; Postgres is the real bottleneck and is addressed separately).

**Revisit when.** A single module demonstrably needs independent scaling or a separate team owns
it end-to-end (Stage 4).

## 2. Layering inside a module

Every domain module has the same internal shape. Uniformity is a feature: a junior who has seen
one module has seen all of them.

```
src/modules/<name>/
  <name>.module.ts          # NestJS wiring only. No logic.
  <name>.controller.ts      # HTTP layer: routes, DTO validation, auth decorators. No logic.
  <name>.service.ts         # Application service: use cases, transactions, event emission.
  domain/                   # OPTIONAL but required where real rules exist:
    <name>.state-machine.ts #   state machines (match, lease, payment, dispute)
    <name>.rules.ts         #   pure functions/classes for domain calculations
  dto/                      # class-validator DTOs (request/response shapes)
  events/                   # typed event classes this module emits
  ports/                    # OPTIONAL: interfaces this module owns (see doc 08)
  adapters/                 # OPTIONAL: implementations of those ports
```

### Layer responsibilities and the rules that keep them honest

| Layer | May contain | Must NOT contain |
|---|---|---|
| **Controller** | Route defs, `@Roles`, DTO in/out mapping, HTTP status choice | Business rules, Prisma calls, try/catch for domain errors |
| **Application service** | Use-case orchestration, transaction boundaries (`prisma.$transaction`), authorization *decisions* (ownership checks), event emission | HTTP objects (`Request`/`Response`), other modules' Prisma models |
| **Domain (rules / state machines)** | Pure logic: transition tables, pricing/fee math, trust-score math | I/O of any kind — no Prisma, no HTTP, no clock reads (clock is injected) |
| **Ports/adapters** | Interfaces + infra implementations | Domain decisions (an adapter never decides *whether*, only *how*) |

Two rules that are non-negotiable and enforced in code review + lint:

1. **Controllers are thin.** If a controller method is longer than ~10 lines, logic is leaking.
2. **Domain classes are pure.** They take data in, return decisions out. This is what makes the
   important 20% of the codebase trivially unit-testable.

We deliberately do **not** introduce a separate "repository layer" over Prisma in every module —
see doc 04 §Rejected patterns for why. The application service calls Prisma directly. Where a
genuine second implementation exists (recommendations: SQL vs Neo4j), a port is used.

## 3. Module map and dependency rules

Modules fall into three rings. Dependencies point **inward only** (→ means "may depend on").

```
┌────────────────────────────────────────────────────────────────────┐
│ RING 3 — Product surface                                           │
│  discovery (recommendations, swipes)   matches   conversations     │
│  ratings   disputes   services   ai                                │
├────────────────────────────────────────────────────────────────────┤
│ RING 2 — Core commerce                                             │
│  properties   leases   payments                                    │
├────────────────────────────────────────────────────────────────────┤
│ RING 1 — Identity & platform                                       │
│  auth   users   preferences                                        │
├────────────────────────────────────────────────────────────────────┤
│ RING 0 — Cross-cutting (global modules, subscribe-only)            │
│  trust   notifications   audit   health   config   infra ports     │
└────────────────────────────────────────────────────────────────────┘
```

- Ring 3 → Ring 2 → Ring 1 is allowed. Never upward (properties never imports matches).
- Ring 0 modules are `@Global()` and **listen to events**; other modules never call
  `notificationsService.send(...)` directly — they emit `lease.created` and the notifications
  module decides what to do with it. This is what keeps a 17-module app from becoming a web.
- Sideways calls inside a ring go through the target module's **public service API** (the
  exported service class), never its Prisma models or private classes. Each module exports
  exactly what its `*.module.ts` lists in `exports:` — nothing else is public.
- **Table ownership:** every table has exactly one owning module; only the owner reads/writes it.
  Other modules get data via the owner's service or by listening to events. (Exception: reporting/
  analytics queries, which are read-only and live in a dedicated `analytics` context.)

These rules are enforced with `eslint-plugin-boundaries` (or `dependency-cruiser`) in CI, not by
hoping. The config lives in the repo root; violating an arrow fails the build.

## 4. Request lifecycle (what happens to every HTTP call)

```
HTTP → helmet/cors → rate limiter → RequestContextMiddleware (request-id, logger child)
     → Global JwtAuthGuard (unless @Public)      [doc 06]
     → RolesGuard (when @Roles present)          [doc 06]
     → ValidationPipe (whitelist + transform)    [doc 12]
     → Controller → Application service
         → prisma.$transaction(...) where multiple writes must be atomic
         → domain classes decide, service persists
         → events emitted AFTER the transaction commits (doc 09)
     → ResponseSerializerInterceptor (strips non-exposed fields)
     → Global exception filter → error envelope   [doc 12]
     → AuditContextInterceptor (writes audit entries for mutating verbs)
```

Key invariant: **events are emitted only after commit.** At Stage 1 (in-process EventEmitter2)
this is a coding rule with a helper (`DomainEventPublisher.publishAfterCommit`); at Stage 2 the
outbox pattern makes it structural (doc 09). Emitting inside a transaction that later rolls back
is the classic source of ghost notifications and wrong trust scores.

## 5. Process topology

Stage 1 runs **two logical processes from one codebase** (same image, different entrypoint flag):

- `api` — the HTTP server. Stateless; scale horizontally.
- `worker` — scheduled jobs + queue consumers (rent generation, webhook retries, notification
  fan-out). At Stage 1 with `QUEUE_DRIVER=inline` this can run inside the api process for
  simplicity (single env var `ROLE=api,worker`); the split is a deploy-config change, not a code
  change.

Rule that makes this possible: **no in-memory state that matters.** No in-process caches of
mutable data (the cache port handles that), no local file writes (storage port), no sticky
sessions (JWT is stateless).

## 6. Directory layout (target)

```
src/
  main.ts                    # bootstrap: pipes, filters, swagger, graceful shutdown
  app.module.ts
  config/                    # typed config schema + validation (fails fast on boot)
  infra/                     # Ring 0 technical capabilities (doc 08)
    prisma/                  # PrismaService (+ read-replica client at Stage 2)
    cache/                   # CachePort, NoopCache, RedisCache, factory
    queue/                   # QueuePort, InlineQueue, BullMQQueue, factory
    storage/                 # StoragePort, S3Storage, LocalStorage, factory
    events/                  # DomainEventPublisher (emitter now, outbox later)
    clock/                   # Clock injectable (testability of time-based logic)
  common/                    # decorators, guards, filters, interceptors, pagination utils
  modules/
    auth/ users/ preferences/
    properties/ leases/ payments/
    recommendations/ swipes/ matches/ conversations/
    ratings/ disputes/ services/ ai/
    trust/ notifications/ audit/ health/
```

This is an evolution of the prototype layout (same module names), so the migration is
module-by-module hardening, not a rewrite. Doc 13 gives the order.
