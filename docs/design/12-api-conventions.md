# 12 — API Conventions

The contract every endpoint follows. Deviations are bugs.

## 1. Shape & versioning

- Base path `/api/v1`. `v2` only for breaking changes, run in parallel during migration —
  additive changes (new optional fields/endpoints) never bump the version.
- Resources are plural nouns; actions that aren't CRUD are explicit sub-resources
  (`POST /leases/:id/sign`, `POST /matches/:id/respond`) — honest RPC beats fake REST.
- JSON in/out, `camelCase` keys. Money as `{ amountMinor: string, currency: "USD" }`
  (string because BigInt; clients format). Timestamps ISO-8601 UTC.
- OpenAPI generated from DTOs is the client contract; CI publishes it per release.

## 2. Responses

```jsonc
// single: the object itself. Lists: cursor envelope —
{ "items": [...], "nextCursor": "opaque-or-null" }
```

- **Cursor pagination everywhere** (opaque base64 of `(sortKey, id)`; default limit 20, max 100).
  Offset pagination is banned — it lies under concurrent writes and dies on deep pages.
- Response DTO classes with explicit `@Expose` fields per audience (e.g. `PropertyPublicDto` vs
  `PropertyOwnerDto`) — serialization allowlists, so adding a DB column never leaks it by default.

## 3. Errors — one envelope

```json
{ "error": { "code": "LEASE_INVALID_TRANSITION", "message": "Cannot sign a CANCELLED lease.",
             "details": [{ "field": "status" }], "requestId": "req_..." } }
```

- `code` is a stable SCREAMING_SNAKE string from a checked-in catalog (`common/error-codes.ts`);
  clients switch on `code`, never on `message`. `requestId` links to logs/traces.
- Mapping: 400 validation (details lists per-field issues) · 401 unauthenticated ·
  403 policy denial · 404 not found *and* not-yours-to-know (existence privacy on ids) ·
  409 state-machine/uniqueness/version conflicts · 422 semantically impossible ·
  429 rate limited (+`Retry-After`) · 500 opaque (`INTERNAL`, no internals leaked).
- Domain exceptions (`InvalidTransitionError`, `PolicyDeniedError`) are thrown by domain/service
  code and translated by the global filter — services never build HTTP responses.

## 4. Idempotency

- All money-mutating client calls (`POST /payments/:id/pay`, future checkout endpoints) require
  an `Idempotency-Key` header (client-generated UUID). Server stores
  `idempotency_keys(key, user_id, request_hash, response, status, expires_at)`:
  same key + same hash → replay stored response; same key + different hash → 422; in-flight →
  409. Keys expire after 24h.
- Non-money `POST`s rely on natural idempotency (unique constraints) — documented per endpoint.

## 5. Consistency conventions

- Filtering: flat query params (`?status=ACTIVE&city=SJO`); ranges as `minPrice/maxPrice`.
- Sorting: `?sort=-createdAt` (allowlisted fields per endpoint).
- Partial updates are `PATCH` with explicit-undefined semantics (absent = unchanged).
- All list endpoints are stable-ordered (sort key + id tiebreak) — required by cursors anyway.

## 6. Rate limiting

`@nestjs/throttler` (memory store Stage 1, Redis store Stage 2 — same annotation):
global 300 req/min/user (or IP when anonymous); `auth/*` 10/min/IP; `ai/*` 20/min/user;
swipes 120/min/user. 429 + `Retry-After` + metric.
