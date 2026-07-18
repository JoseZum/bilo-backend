# bilo — Delivery Process: From Requirement to Code to Test

This is the operating manual for turning the [ERS](./ers.md)'s 262 numbered requirements into
shipped, tested code without losing track of a single one. It defines the tracker setup, how
requirements become tickets, the naming conventions that give us end-to-end traceability
(FR → ticket → branch → PR → test), the workflow states, and the cadence. It is written so the
process works identically for a solo founder today and a 6-person team later.

## 1. The pipeline at a glance

```
ERS (FR-XXX-NNN)          docs/requirements/ers.md — the single source of scope truth
   │  grouped by module → epic
   ▼
Epic (per module)         tracker epic, linked to its design doc (D15, D07§9, …)
   │  sliced into shippable stories
   ▼
Story (1–3 FRs)           ticket: FR IDs in title/body, AC as Given/When/Then
   │  branch per story
   ▼
Branch + PR               feat/PAY-021-mark-paid-manual → PR body "Implements: FR-PAY-021"
   │  tests named after FRs; CI gate (D11)
   ▼
Tests + review + merge    AC proven at the right test layer; reviewer checks FR coverage
   │
   ▼
Traceability update       FR status flips in the matrix → scope burndown is real, not vibes
```

One rule above all: **nothing gets built that doesn't trace to an FR, and no FR is "done"
until a merged PR and a test claim it.** Untracked work is invisible work; unproven FRs are
rumors.

## 2. Tooling decision (mini-ADR)

**Context.** We need epics, stories, boards, and PR linkage. Candidates: Jira, Linear,
GitHub Projects + Issues.

**Decision.** **GitHub Projects (v2) + GitHub Issues**, in this repo's org.

**Why.** The code, PRs, and CI already live on GitHub; issue↔PR linking (`Closes #123`) is
native and free; labels + custom fields cover module/priority/FR tracking; zero new accounts
or sync problems. The *process* below — epics, stories, states, DoR/DoD — is tool-agnostic by
design: every concept maps 1:1 to Jira (Project → Epic → Story, board columns, labels), so a
future migration is an export, not a re-education.

**Alternatives.** *Jira* — the enterprise default, but heavyweight for a 1–3 person team and
adds a second system to keep honest; adopt when a client/investor process demands it or the
team passes ~6. *Linear* — excellent UX, but another paid tool and weaker native monorepo/PR
integration than staying inside GitHub. **Revisit when** team ≥ 6 or external stakeholders
need Jira-style reporting.

**Setup (one-time):**
- One Project: **"bilo delivery"**, board layout, custom fields: `Module` (ERS module key),
  `Priority` (M/S/C/W), `Epic`, `Size` (S/M/L per D13), `Stage` (1/2/3).
- Labels mirror module keys (`mod:PAY`, `mod:INV`, …) + `type:story|bug|chore|spike`.
- Milestones = roadmap epics (Epic 0 … Epic 7, from D13) + `Launch gate`.

## 3. Structure: how requirements group into work

### Epics = ERS modules (with the roadmap as sequencer)

Each ERS module (§3.1–3.23) becomes one tracker epic, permanently linked to its design doc.
The **roadmap (D13) stays the macro sequencer** — it says *when* an epic's stories get
scheduled; the ERS says *what* the epic must cover; the design doc says *how*. Do not
duplicate design content into tickets — link it.

| Tracker epic | ERS module(s) | Design spec | Roadmap slot |
|---|---|---|---|
| Foundations | PLAT | D02–D05, D08–D12 | Epic 0 |
| Identity & accounts | AUTH, USER, PREF, APP | D06, D07§2–3 | Epic 1 |
| Supply | PROP | D07§4 | Epic 2 |
| Discovery | DISC, MATCH, CHAT, GEO | D07§5–7, D20 | Epic 3 |
| The rail | LEASE, PAY | D07§8–9, D14 | Epic 4 |
| Trust fabric | TRUST, RATE, DISP, NOTIF, ADMIN | D07§10–12,15–16 | Epic 5 |
| Services & hardening | SERV | D07§13 | Epic 6 |
| Inventory & community | INV, IDV, WAIT, ROOM, MAINT | D15–D19 | Epic 7 |
| (parked) | AI | D07§14 | deferred (B02§6) |

### Stories = 1–3 FRs that ship together

A story is the unit of assignment: small enough for one PR-sized change (≈ ≤3 days), big
enough to be demoable. Group FRs that share a surface (e.g., FR-PAY-018 + 019 = "landlord
payment status board"); never group across modules. Every story lists its FR IDs — a story
with no FR ID is either a `chore` (infra, refactor) or a mistake.

**Bugs** reference the FR they violate (`Violates: FR-LEASE-006`) — that's what makes a bug a
bug rather than an opinion. **Spikes** (time-boxed research) are allowed one per unknown, must
end in a written conclusion on the ticket.

## 4. Ticket anatomy

Title: `[PAY] Landlord marks payment received manually (FR-PAY-021)`

Body template (issue template committed at `.github/ISSUE_TEMPLATE/story.md`):

```markdown
## Context
One paragraph: who needs this and why now. Link the design doc §.

## Requirements
- FR-PAY-021 — Landlord marks a payment received manually (audited)

## Acceptance criteria
- [ ] Given a PENDING payment on my property, when I mark it received with evidence,
      then status becomes PAID (method MANUAL), the tenant is notified, and an audit row exists
- [ ] Given a payment on someone else's property, the endpoint returns 403
- [ ] Given the same request replayed, the result is idempotent (no duplicate events)

## Out of scope
Payment links (FR-PAY-022 — separate story).

## Spec
D07§9, D14§4 · Size: M · Priority: M
```

**Definition of Ready** (before a story enters a sprint): FR IDs listed · AC written as
Given/When/Then · design doc § linked · size estimated · no unresolved "TBD" in the AC.

## 5. Traceability: the thread that survives

The FR ID travels through every artifact:

| Artifact | Convention | Example |
|---|---|---|
| Ticket | FR IDs in title + Requirements section | `(FR-PAY-021)` |
| Branch | `feat/<MOD>-<NNN>-slug` (first FR of the story) | `feat/PAY-021-mark-paid-manual` |
| Commit / PR body | `Implements: FR-PAY-021` + `Closes #123` | — |
| Test | FR ID in the describe block | `describe('FR-PAY-021 manual payment', …)` |
| Traceability matrix | one row per FR, updated in the same PR | see below |

**The matrix** lives at `docs/requirements/traceability.md`, one table per epic, **created
when that epic's work starts** (a 262-row placeholder file today would be noise). Row format:

```markdown
| FR | Story | PR | Test(s) | Status |
|---|---|---|---|---|
| FR-PAY-021 | #123 | #131 | payments/manual-payment.spec.ts | Done |
| FR-PAY-022 | #124 | — | — | In progress |
```

Statuses: `Not started · In progress · Done · Parked (C/W)`. The PR that finishes a story
updates its rows — reviewers reject PRs that claim FRs without matrix + test updates. When
this gets tedious (it will, around Epic 4), a small script greps FR IDs from test files and
PR history to regenerate the matrix — automate then, not before.

**The payoff:** `grep -c 'Done'` per module = real burndown against the ERS §5 totals; any
auditor (or future hire) can pick an FR and walk to the exact code and test that implement it.

## 6. Workflow states & Definition of Done

Board columns: `Backlog → Ready → In Progress → In Review → Verify → Done`

- **Backlog** — exists, not refined. **Ready** — passes DoR (§4).
- **In Progress** — branch open. One story per person at a time; blocked > 1 day → flag it on
  the ticket, don't silently start something else.
- **In Review** — PR open, CI green. Review checks: AC covered by tests, FR/matrix updated,
  design-doc conformance (state machines, invariants, events per spec).
- **Verify** — merged to main, exercised end-to-end on the dev/staging deploy (the golden-path
  flow it belongs to, not just its unit tests).
- **Done** — verified + matrix updated.

**Definition of Done (per story):** every AC has a passing automated test at the right layer
(see §7) · CI gate green (D11: tsc, lint boundaries, unit/integration/e2e) · migrations follow
expand→contract (D05§8) · events/logs/metrics per module spec (design principle 5) · docs
updated if behavior diverged from spec (spec PR first — see §8) · traceability rows flipped.

## 7. Tests prove requirements

Each FR's AC lands at the cheapest layer that can actually prove it (D11):

| FR type | Layer | Example |
|---|---|---|
| Pure logic (schedules, calculators, state machines) | Unit | `RentSchedule` proration property tests (FR-LEASE-007) |
| Persistence, constraints, transactions | Integration (testcontainers PG) | duplicate identity → constraint (FR-IDV-003) |
| Endpoint contracts, authz, envelopes | API/e2e | non-owner PATCH → 403 (FR-PROP-009) |
| Cross-module flows | Golden-path e2e | swipe → solicitud → accept → chat (FR-MATCH-003) |
| Jobs | Integration, run-twice | reminder dedup (FR-MAINT-010) |
| Client UX (M-priority screens) | Component/e2e (Playwright) | swipe deck + interest modal (FR-DISC-005) |

The golden-path e2e (one tenant + one landlord through the whole core loop) is the launch
gate's heartbeat; every Epic 0–6 story that touches the loop extends it.

## 8. Change flow: when reality disagrees with the spec

Implementation *will* find spec gaps. The order is fixed: **spec first, then code.**
1. Small clarification → PR editing the design doc (and ERS if scope changed) + the story
   proceeds; both PRs cross-link.
2. Real scope change → new/edited FR in the ERS (counts table updated) → then a story.
3. Never encode an undocumented decision only in code — that's how the ERS rots into fiction.

The ERS §6 change-control rule applies: FR IDs are never renumbered; superseded FRs get struck
through with a pointer.

## 9. Cadence & rituals (deliberately minimal)

- **Kanban while the team is 1–2** — WIP limit 2, ship continuously. Switch to **2-week
  sprints** at 3+ people (sprint goal = a demoable epic slice, e.g., "waitlist join + landlord
  filter view live on staging").
- **Weekly review (30 min, even solo):** walk the board right-to-left, update the matrix,
  re-check the ERS burndown numbers, pick next week's stories from the current epic. Solo
  discipline substitute for standups.
- **Epic close ritual:** matrix rows all Done/Parked → run the epic's AC list end-to-end on
  staging → tag `epic-N-done` → write a 5-line retro note in the epic ticket (what the
  estimate missed — feeds the sizing rule of thumb in ERS §5).
- **Estimation:** stories carry S/M/L (D13 scale: ≤1d / 2–3d / ~1w). No story points theater;
  the L that should be split *gets split*.

## 10. Getting started (the first week's checklist)

1. Create the GitHub Project, fields, labels, milestones (§2) — 1 hour.
2. File the epic tickets (9 of them, §3) linking design docs — 1 hour.
3. Break **Epic 0 (Foundations)** into stories from roadmap tasks 0.1–0.8 + PLAT FRs — they
   are already sized with AC in D13.
4. Commit the issue template (§4) and open `docs/requirements/traceability.md` with the
   Epic 0 table.
5. Start the first story. Everything after that is the loop in §1.
