# 09 — Domain Events & Background Jobs

## 1. Event contract (applies at every stage)

Events are typed classes with a stable envelope:

```ts
export abstract class DomainEvent<TPayload> {
  readonly eventId: string = uuidv7();      // dedup key for listeners
  readonly occurredAt: Date;                 // injected Clock
  abstract readonly name: string;            // 'payment.paid' — dot-namespaced, past tense
  constructor(readonly payload: TPayload) {}
}
export class PaymentPaidEvent extends DomainEvent<{
  paymentId: string; leaseId: string; payerId: string;
  amountMinor: bigint; currency: string; paidAt: Date;
}> { readonly name = 'payment.paid'; }
```

Rules:
1. **Past tense, facts only.** An event states what happened; it never instructs
   (`payment.paid`, never `send.receipt`).
2. **Payloads are self-contained IDs + the fields listeners actually need** — enough that a
   listener usually doesn't have to query back, small enough to survive serialization when the
   outbox arrives. No Prisma entities in payloads.
3. **Published after commit, always** — via `DomainEventPublisher`, the only sanctioned way to
   emit (raw `eventEmitter.emit` is banned by lint):

```ts
// application service usage — the helper collects during tx, flushes on commit
await this.publisher.transactional(async (tx, events) => {
  const payment = await this.markPaid(tx, id);
  events.add(new PaymentPaidEvent({ ...payment }));
});
```

4. **Listeners are idempotent** (they will eventually be called at-least-once): each Ring-0
   listener records processed `eventId`s (`processed_events(consumer, event_id)` unique) or is
   naturally idempotent (upsert-by-key).
5. **Listeners never throw into the publisher.** Failures are logged + metriced + (Stage 2)
   retried by the queue. One listener failing must not affect siblings or the request.
6. **The catalog is code.** `events/catalog.ts` exports every event class; doc 07's per-module
   Emits/Listens lists are the human index. A new event = PR touching both.

## 2. Stage 1 transport: EventEmitter2, wrapped

The prototype's EventEmitter2 stays, but hidden behind `DomainEventPublisher` so no module knows
the transport. Known accepted limitation: in-process delivery means a crash between commit and
emit loses the event. At Stage 1 traffic this is rare and recoverable (all Ring-0 projections —
trust, analytics, notifications — are rebuildable or tolerable); the fix is structural at Stage 2.

## 3. Stage 2 transport: Transactional Outbox

`EVENT_BUS=outbox` switches `DomainEventPublisher.transactional` to **insert events into
`outbox_events` in the same transaction as the domain writes** — atomicity is now guaranteed by
Postgres, not by discipline:

```
outbox_events(id, name, payload jsonb, created_at, published_at NULL, attempts)
```

A relay in the worker polls unpublished rows (`FOR UPDATE SKIP LOCKED`, batch 100, 250ms) and
dispatches to listeners via the queue (BullMQ), marking `published_at`. Ordering is per-poll-batch
by `created_at` (good enough — listeners are idempotent and order-tolerant by rule 4; anything
needing strict ordering keys off DB state, not event arrival). Cleanup job prunes published rows
after 7 days. This is ~200 lines total and removes the last correctness gap — Kafka is *not* the
next step after this; the outbox + queue carries us through Stage 3.

## 4. Scheduled jobs (the worker's day)

All jobs are `JobDefinition`s on the `QueuePort`/scheduler (doc 08) — cron via
`@nestjs/schedule` at Stage 1, BullMQ repeatable jobs at Stage 2. **Every job: advisory lock
(single concurrent run), idempotent body, structured completion log with counts, metric + alert
on failure.**

| Job | Schedule | What it does (idempotency anchor) |
|---|---|---|
| `rent.generate` | daily 00:10 UTC | For ACTIVE leases: create next `rent_period` + PENDING payment when within 10 days of due date (`UNIQUE(lease_id, period_start)`) |
| `rent.charge` | daily, per due date | Off-session charge of due payments with default method (charge sequence, doc 07 §9) |
| `payment.overdue-sweep` | daily | Emit `payment.overdue` for PENDING past due+grace (dedup: `overdue_notified_at` on payment) |
| `payment.reconcile` | nightly | Ledger vs Stripe balance transactions; orphans → page (doc 07 §9) |
| `payment.resolve-stuck` | hourly | PROCESSING > 1h → query gateway by idempotency key → settle |
| `match.expire` | daily | PENDING matches > 14 days → EXPIRED |
| `lease.expire-drafts` | daily | PENDING_SIGNATURE > 30 days → EXPIRED |
| `tokens.prune` | daily | Delete expired/revoked refresh tokens > 60 days old |
| `outbox.relay` / `outbox.prune` | 250ms poll / daily | Stage 2 (§3) |
| `pii.scrub` | on demand (queued by user.deleted) | Erasure flow (doc 05 §4) |
| `waitlist.expire-entries` | daily | Stale invites (>7 d) and entries on archived listings → EXPIRED (doc 17 §6) |
| `roommate.expire-applications` | daily | Review states idle >14 d → EXPIRED, day-7 nudge (doc 18 §6) |
| `maintenance.visit-reminders` | every 15 min | 24 h / 1 h visit reminders (`reminder*SentAt` set in same tx; doc 19 §6) |
| `maintenance.auto-close` | daily | RESOLVED >7 d without tenant action → CLOSED, day-5 warning (doc 19 §6) |
| `maintenance.sla-nudge` | hourly | REPORTED past first-response target → nudge landlord (`sla_nudged_at` dedup; doc 19 §6) |

Jobs are plain classes (`@Injectable() RentGenerateJob { run(ctx) }`) registered with the
scheduler — testable by calling `run()` with a fixed Clock, no cron in tests.
