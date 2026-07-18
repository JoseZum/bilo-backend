# bilo — Requirements & Delivery

The scope of the project in numbers, and the process that turns it into code.

| Doc | What it answers |
|---|---|
| [ERS — Software Requirements Specification](./ers.md) | Every functional requirement, numbered (`FR-<MODULE>-<NNN>`), prioritized (MoSCoW), and sourced from the design docs, business docs, and the bilo-frontend prototype. §5 totals the scope: **262 FRs + 15 NFRs** |
| [Delivery process](./sdlc-plan.md) | How an FR becomes a ticket, a branch, a PR, and a test — tracker setup (GitHub Projects, Jira-compatible), epics-by-module, traceability conventions, DoR/DoD, cadence |
| `traceability.md` *(created per epic as work starts)* | FR → story → PR → test status matrix; the real burndown |

**Relationship to the other doc sets:** `docs/design/` says *how* to build each thing (the ERS
cites it as `D07§9`); `docs/business/` says *why and for whom* (`B02`); the roadmap (D13)
sequences the epics. The ERS is the contract between them — if scope changes, it changes here
first (ERS §6).
