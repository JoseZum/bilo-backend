# bilo — Production Backend Design

This is the complete technical design for the production-grade bilo backend. It is written so
that any developer — including a junior joining the team tomorrow — can pick up a module and
implement it without having to make (or re-litigate) architectural decisions. Every decision in
these docs comes with its context, the alternatives we considered, the trade-offs we accepted,
and the condition under which we would revisit it.

**Business counterpart:** market, monetization, go-to-market, and researched startup lessons
live in [`docs/business/`](../business/README.md); two of its decisions bind this design — AI is
deferred to national scale, and the launch niche is Costa Rican university students.

**The prototype in this repo is the input, not the target.** The current code (NestJS + Prisma on
SQLite, mock providers, mock-login) validated the product flows. These docs describe what we keep,
what we replace, and in what order.

## How to read these docs

Read in order the first time. After that, each doc stands alone.

| # | Doc | What it answers |
|---|-----|-----------------|
| 01 | [Vision & Scale Stages](./01-vision-and-stages.md) | What we're building, the business model, and the 4 scale stages that drive every technical decision |
| 02 | [Architecture](./02-architecture.md) | Modular monolith, layering rules, module boundaries, request lifecycle |
| 03 | [Tech Stack Decisions](./03-tech-stack-decisions.md) | Every stack choice as a decision record: NestJS, Prisma, Postgres, and what we said no to |
| 04 | [Design Patterns](./04-design-patterns.md) | The pattern catalog: which patterns we use, exactly where, and the patterns we explicitly reject |
| 05 | [Database](./05-database.md) | Production Postgres schema, money handling, IDs, indexing, migration discipline, scaling path |
| 06 | [Authentication & Authorization](./06-auth.md) | OAuth-only (Google + Apple), token model, refresh rotation, roles |
| 07 | [Module Specifications](./07-modules.md) | Every domain module: responsibilities, entities, endpoints, events, state machines, classes |
| 08 | [Pluggable Capabilities](./08-pluggable-capabilities.md) | The Ports & Adapters system: Redis on/off, Neo4j on/off, Stripe, AI — all env-var toggles |
| 09 | [Events & Background Jobs](./09-events-and-jobs.md) | Domain events, the outbox upgrade path, rent-generation jobs, queues |
| 10 | [Observability & Operations](./10-observability-and-ops.md) | Logging, metrics, tracing, deployment, health, incident readiness |
| 11 | [Testing Strategy](./11-testing-strategy.md) | What we test, at which layer, and the CI gate |
| 12 | [API Conventions](./12-api-conventions.md) | Versioning, pagination, error envelope, idempotency, rate limiting |
| 13 | [Implementation Roadmap](./13-roadmap.md) | The build order: epics, tasks, and acceptance criteria a junior can execute |
| 14 | [Frontend Alignment](./14-frontend-alignment.md) | What the bilo-frontend prototype pins down: launch market, wire contract, payouts, chat cards, AI lease review |

## Design principles (the short version)

These five principles resolve most day-to-day arguments. When in doubt, come back here.

1. **Boring at the core, pluggable at the edges.** The domain core (users, properties, leases,
   payments) is plain TypeScript classes and Postgres transactions — no magic. Everything that
   will genuinely vary (cache, recommendations, payment gateway, AI, storage, queue) sits behind
   a port interface with adapters selected by environment variable.

2. **A pattern must pay rent.** We use a design pattern only where we can name the concrete
   variation or failure mode it protects us from. Patterns adopted "because it's enterprise"
   are rejected in [doc 04](./04-design-patterns.md) with reasons, so nobody re-introduces them
   by accident.

3. **The database enforces invariants; code enforces workflows.** Uniqueness, referential
   integrity, and money consistency live in Postgres constraints and transactions. State
   transitions live in explicit state-machine classes. Nothing important is enforced only by
   "we always call it this way."

4. **Design for Stage N, build for Stage now.** Every component names the scale stage at which
   it must change and the seam through which it changes (see [doc 01](./01-vision-and-stages.md)).
   We do not build Stage 3 infrastructure at Stage 1 — we build Stage 1 code with Stage 3 seams.

5. **If it isn't observable, it isn't done.** Every module ships with structured logs, metrics,
   and domain events from day one. Debugging production is a design requirement, not an
   afterthought.

## Language & conventions

- Docs and code identifiers are in **English** (the prototype README is Spanish; new docs and code
  standardize on English so the team can grow internationally).
- Decision records use the mini-ADR format: **Context → Decision → Alternatives → Trade-offs →
  Revisit when**.
- Code samples in these docs are normative: naming, file layout, and class shapes shown here are
  the ones to use.
