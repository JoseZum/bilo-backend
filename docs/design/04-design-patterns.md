# 04 — Design Patterns

The rule from doc 00 applies everywhere: **a pattern must pay rent.** For each adopted pattern we
name (a) the concrete problem it solves here, (b) exactly where it is used, and (c) where it is
*banned* so it doesn't metastasize. Then we list the patterns we explicitly reject, because the
patterns you say no to shape a codebase more than the ones you adopt.

---

## Adopted patterns

### P1. Ports & Adapters (a.k.a. Strategy at the infrastructure edge)

- **Problem solved:** "Redis on/off with an env var", "Neo4j later", "Stripe now, PIX later",
  "mock AI in tests" — genuine, already-known variation points.
- **Shape:** an interface (`CachePort`), 2+ adapter classes (`NoopCache`, `RedisCache`), one
  factory provider bound to a DI token, selection by env var. Full catalog and code shape in
  doc 08.
- **Where used (closed list):** cache, queue, event bus, payment gateway, recommendation engine,
  AI provider, storage, notification channels, OAuth identity verification, clock.
- **Where banned:** everywhere else. If there is exactly one real implementation and no test
  need beyond ordinary mocking, do not create a port. Adding a new port requires adding it to
  the table in doc 08 with its variation justification.

### P2. Explicit State Machine (domain workflow as a class)

- **Problem solved:** match/lease/payment/dispute lifecycles are the product. Scattered
  `if (status === ...)` checks across services is how impossible states ship to production.
- **Shape:** one class per lifecycle owning a **transition table**; services ask it, never
  bypass it.

```ts
// domain/lease.state-machine.ts — pure, no I/O, trivially unit-tested
export class LeaseStateMachine {
  private static readonly transitions: Record<LeaseStatus, Partial<Record<LeaseAction, LeaseStatus>>> = {
    DRAFT:      { SEND_FOR_SIGNATURE: 'PENDING_SIGNATURE', CANCEL: 'CANCELLED' },
    PENDING_SIGNATURE: { SIGN: 'ACTIVE', CANCEL: 'CANCELLED', EXPIRE: 'EXPIRED' },
    ACTIVE:     { COMPLETE: 'COMPLETED', TERMINATE: 'TERMINATED' },
    COMPLETED:  {}, TERMINATED: {}, CANCELLED: {}, EXPIRED: {},
  };

  transition(current: LeaseStatus, action: LeaseAction): LeaseStatus {
    const next = LeaseStateMachine.transitions[current]?.[action];
    if (!next) throw new InvalidTransitionError('Lease', current, action);
    return next;
  }
  can(current: LeaseStatus, action: LeaseAction): boolean { /* ... */ }
}
```

- **Where used:** Match, Lease, Payment, Dispute, ServiceRequest.
- **Where banned:** entities with 2 trivial states (e.g. notification read/unread) — a nullable
  `readAt` column is not a state machine.

### P3. Domain Events (Observer) with after-commit publishing

- **Problem solved:** cross-cutting reactions (trust score, notifications, audit, analytics)
  without Ring-3/Ring-0 modules calling each other — the decoupling that keeps 17 modules
  independent and makes Stage-4 extraction possible.
- **Shape:** typed event classes (`PaymentPaidEvent`) published via `DomainEventPublisher`
  **after the DB transaction commits**; listeners are idempotent (doc 09 has the full contract,
  the event catalog, and the outbox upgrade).
- **Where banned:** request/response needs. If module A needs an answer from module B *now*
  (e.g. leases needs the match to validate), that is an explicit service call, not an event.
  Events are for "this happened, whoever cares"; calls are for "I need this to proceed."

### P4. Dependency Injection everywhere, composition root in modules

- **Problem solved:** testability and the entire port system. NestJS DI is the composition root;
  classes declare constructor dependencies against tokens/classes and never `new` up
  infrastructure.
- **Consequence for juniors:** if you write `new SomeService()` or import a concrete adapter
  into a service, the review bounces it.

### P5. Guard / Policy objects for authorization

- **Problem solved:** "who can do this" scattered in services.
- **Shape:** coarse role checks via `@Roles()` + `RolesGuard` (exists in prototype); *ownership*
  checks (tenant of this lease, landlord of this property) via small policy classes
  (`LeasePolicy.canView(user, lease)`) called at the top of application services — pure,
  testable, greppable. Doc 06 §5.

### P6. Null Object (the pattern that makes "off" free)

- **Problem solved:** `CACHE_DRIVER=off` must not litter code with `if (cache)`.
- **Shape:** `NoopCache implements CachePort` returns misses and swallows writes. Callers are
  written once, as if cache always exists. Same trick: `InlineQueue` (executes immediately),
  `NoopNotificationChannel`.

### P7. Facade on module boundaries

- **Problem solved:** modules exposing their guts.
- **Shape:** each module exports exactly one service class (its facade) via `exports:`; whatever
  other classes exist inside are private. Cross-module calls go through the facade. This is
  P4 + doc 02 §3 discipline, not extra code.

### P8. Idempotency Key (correctness pattern, not GoF)

- **Problem solved:** retried webhooks, double-tapped "pay" buttons, at-least-once queues —
  every money path must tolerate replay.
- **Shape:** unique constraints as the mechanism (`payment_transactions.provider_ref` unique,
  `idempotency_keys` table for client-initiated charges, event-id dedup in listeners).
  Details in docs 07 §Payments and 12 §Idempotency.

### P9. Typed Configuration Object (fail-fast boot)

- **Problem solved:** `process.env` reads scattered through the code; app boots with missing
  secrets and dies at first request.
- **Shape:** one Zod-or-class-validator-validated config schema loaded at boot
  (`config/configuration.ts` evolves into `config/schema.ts`); the process **exits** on invalid
  config. Modules inject typed slices (`PaymentsConfig`), never `process.env`.

---

## Rejected patterns (and why — keep this list alive)

### R1. Generic Repository over Prisma

`UserRepository extends BaseRepository<User>` wrapping every Prisma call. **Rejected** because
Prisma *is* the repository: typed, mockable, already an abstraction over SQL. A second layer adds
a file per model, hides query cost, and its "we could swap the ORM" promise is one we'll never
redeem (swapping the ORM rewrites queries no matter what). Where a genuine second data source
exists (recommendations), we use a **port** (P1), which is a different thing: it abstracts a
*capability*, not a table.

### R2. CQRS framework / command-bus (`@nestjs/cqrs`)

Command/Query classes, handlers, buses for every use case. **Rejected**: at our size it triples
the files per feature and turns stack traces into bus dispatch mysteries. We keep the *idea*
worth keeping — reads may bypass domain logic and use raw SQL for hot paths — without the
machinery. Revisit for a specific module if its write model and read model genuinely diverge
(possible for analytics at Stage 3).

### R3. Event Sourcing

**Rejected** as the persistence model: enormous complexity tax (projections, replays, schema
evolution of events). We get the auditability benefits the cheap way: current-state tables +
append-only side tables (`payment_events`, `trust_events`, `audit_logs`) — the prototype already
does this and it's the right call.

### R4. Full DDD tactical toolkit (aggregates, value objects everywhere, domain services vs application services vs...)

**Rejected as a blanket rule.** We keep DDD's *strategic* ideas — bounded modules, ubiquitous
language, events. We use plain classes for domain logic where it's real (P2, P5) and let simple
CRUD be simple CRUD. Wrapping `email: string` in an `Email` value object across 17 modules is
ceremony without rent.

### R5. Microservices / message broker between modules

Covered in docs 02/03. In-process calls and events until extraction is *forced* by measurement.

### R6. Active Record / fat models

Logic on persistence objects. Prisma's design already prevents this; keep it that way — domain
logic lives in `domain/` classes that take plain data.

### R7. Singleton by hand, service locators, static registries

NestJS DI scopes already provide managed singletons. Any `SomeClass.getInstance()` or global
mutable registry is a review-bounce. Static is allowed only for pure constants/pure functions.

### R8. Decorator/annotation-driven business logic

Custom decorators are for cross-cutting *technical* concerns only (auth, validation, audit).
Business rules never hide in decorators — a junior must be able to read a service top-to-bottom
and see every rule that fires.

---

## How to propose a new pattern

Open a PR against this doc: problem, evidence it recurs (≥3 sites), proposed shape, where it's
banned. If it can't fill those four sections, it doesn't get in. This keeps the architecture
owned by the team instead of by whoever read a blog post last.
