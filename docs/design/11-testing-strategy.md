# 11 — Testing Strategy

Testing effort follows risk, not coverage vanity. Money and workflow code gets the most; CRUD
gets the least. Target shape: many fast unit tests on domain classes, a solid integration band
on services+Postgres, a thin e2e crust on the golden flows.

## 1. Layers

| Layer | Scope | Infra | Speed | What lives here |
|---|---|---|---|---|
| **Unit** | domain classes, pure | none (Fixed Clock, in-memory) | ms | State machines (every cell of the transition table, legal and illegal), `RentSchedule` (proration, dueDay 29–31, leap years), `FeeCalculator` (property-based: split always sums), `TrustScoreCalculator`, policies |
| **Integration** | application service + real Postgres | **Testcontainers** Postgres (real PG 16, migrations applied), mock ports | ~100ms | Transaction boundaries, constraint behavior (duplicate swipe → 409), optimistic-lock retries, the full charge sequence with a scripted mock gateway (success / failure / crash-between-Tx-A-and-B / duplicate webhook) |
| **Contract** | every adapter of every port | adapter-specific (Redis container, Stripe stubs) | varies | One suite per port, run against all adapters (doc 08 §1) — this is what makes env-var swaps trustworthy |
| **E2E** | HTTP → DB, app booted with mock external adapters | Testcontainers | s | The main flow: oauth(mock)→preferences→property→feed→swipe→match→accept→chat→lease→sign→pay→trust changed; plus authz denial cases per module (tenant can't touch another user's lease) |

No mocking Prisma in integration tests — mocked-DB tests pass while constraints fail in
production; Testcontainers makes real-PG tests cheap enough to be the default.

## 2. Conventions

- Vitest (or Jest — pick once at setup, Vitest preferred for speed) + `supertest` for e2e.
- Files co-located: `foo.service.spec.ts` next to `foo.service.ts`; e2e in `test/e2e/`.
- **Builders, not fixtures:** `aUser()`, `anActiveLease({ dueDay: 31 })` test-data builders in
  `test/builders/` — readable tests, no shared mutable fixture swamp.
- Every test DB starts from migrations (never `db push`) — migrations are thereby tested on
  every CI run.
- Time is always the injected `Clock`; `new Date()` in domain/service code is lint-banned.
- Bug fixes ship with the regression test in the same PR, no exceptions.

## 3. CI gate (blocking, in order, target < 10 min)

1. `tsc --noEmit` (strict)  2. ESLint (includes boundary + banned-API rules)
3. Unit + integration + contract  4. E2E main flow  5. `prisma migrate diff` drift check
6. `.env.example` ↔ config-schema sync check

Coverage is *reported* (trend), not *gated* — a gate breeds assertion-free tests. Review owns
"is this tested enough", guided by the risk table above.
