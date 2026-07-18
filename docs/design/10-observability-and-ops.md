# 10 — Observability & Operations

Principle 5 from doc 00: if it isn't observable, it isn't done. This is Stage-1 scope, not a
later luxury — you cannot run other people's rent money on `console.log`.

## 1. Logging

- **pino** (via `nestjs-pino`), JSON to stdout, platform ships logs (no log files).
- Every request gets a `requestId` (accept inbound `x-request-id` else generate) bound into a
  child logger via AsyncLocalStorage; every log line carries
  `{ requestId, userId?, module, event }`.
- Levels: `info` = domain facts (one per state change: "payment paid", with ids and amounts),
  `warn` = degraded (cache down, retry), `error` = failed request/job with stack.
- **Redaction is centralized** in pino config: `email`, `phone`, `authorization`, `*token*`,
  message bodies. PII in logs is a review-blocking bug.
- Domain events are logged automatically by the publisher — free audit breadcrumb trail.

## 2. Metrics

- OpenTelemetry metrics → Prometheus-compatible endpoint (`/metrics`, internal only) or OTLP to
  the vendor (Grafana Cloud / Datadog — pick one, cheap tier, at infra setup time).
- **RED per route** (rate, errors, duration histograms) via auto-instrumentation, plus a short
  hand-picked business list: `payments_charged_total{status}`, `payment_amount_minor_sum`,
  `webhook_lag_seconds`, `outbox_unpublished_rows`, `job_runs_total{job,status}`,
  `feed_latency_seconds`, `oauth_exchanges_total{provider,status}`.
- Dashboards checked into the repo as JSON (`ops/dashboards/`).

## 3. Tracing & errors

- OpenTelemetry auto-instrumentation (HTTP + Prisma + ioredis) with W3C traceparent propagation;
  sampled traces to the same vendor. This is config, not code — enable from day one.
- **Sentry** for exception tracking (release-tagged, requestId-linked). The global exception
  filter reports every 5xx; 4xx are not errors.

## 4. Alerting (start with exactly these, page-worthy only)

1. Readiness failing / instance count 0
2. 5xx rate > 2% over 5 min
3. `payment.reconcile` found orphans, or `rent.charge` job failed
4. `outbox_unpublished_rows` growing for 10 min (Stage 2)
5. Webhook signature failures spike (attack or key rotation gone wrong)
6. DB: connections > 80%, replication lag (Stage 2), disk > 75%

Everything else is a dashboard, not a page. Alert fatigue is how real incidents get missed.

## 5. Deployment & runtime

- **One Docker image** (multi-stage, distroless/alpine runtime, non-root user) for api + worker
  (`ROLE` env picks entrypoint behavior, doc 02 §5).
- Platform at Stage 1: any managed container platform (Cloud Run / Fly.io / ECS Fargate) + managed
  Postgres + S3-compatible bucket. Terraform from day one (`infra/` repo dir) so environments are
  reproducible; staging = production shape at 10% size.
- **Deploy pipeline (CI):** lint + typecheck + tests + `prisma migrate diff` check → build image
  → run migrations (`migrate deploy`) → rolling deploy api → deploy worker. Rollback = redeploy
  previous image (schema stays compatible per doc 05 §8).
- **Graceful shutdown:** SIGTERM → stop accepting (readiness fails) → drain in-flight (15s) →
  close queue consumers mid-job-safe (jobs idempotent) → close DB pool. NestJS
  `enableShutdownHooks` + explicit ordering in `main.ts`.
- Config: 12-factor env vars validated at boot (doc 04 P9). `.env.example` is the documented
  contract and CI fails if it drifts from the config schema.

## 6. Runbooks

`docs/runbooks/` — one markdown per scenario, written *before* the incident: DB restore drill,
Stripe webhook backlog, stuck PROCESSING payments, Redis outage, key rotation (JWT, Stripe,
OAuth), rollback. Rule: every incident postmortem either updates a runbook or creates one.
