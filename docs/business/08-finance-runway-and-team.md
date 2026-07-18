# 08 — Finance, Runway & Team

Planning-grade numbers (CR cost base, mid-2026 colón≈$1/₡510). Every figure is an input to
replace with actuals; the *structure* is the deliverable. Currency: USD for comparability.

## 1. Cost model by phase (monthly burn)

| Line | Pilot (semester 1) | P1–P2 (CR growth) | Notes |
|---|---|---|---|
| Founders (2–3, below-market + equity) | $3–6k | $8–12k | Founder salaries are runway math, not market rates |
| First hires | — | +$4–7k | #1 ops/community (campus launches), #2 full-stack. Seniors come at seed |
| Ambassadors (3–5 × ~$150) | $0.5–0.8k | $1.5–3k | Per active campus |
| Infra (design docs stack: managed PG + containers + monitoring free tiers) | **$0.2–0.5k** | $0.8–2k | The boring-stack decision pays here; no Redis/Neo4j until needed |
| Tools (WhatsApp Business API, e-invoicing, analytics) | $0.1–0.3k | $0.5–1k | |
| Legal & accounting (doc 05 setup then retainer) | $1.5k setup + $0.4k | $0.8k | L1–L5 counsel items front-loaded |
| Marketing (matrícula blitzes, geofenced social) | $0.5–1k | $2–5k | Concentrated in Feb/Jul windows |
| **Total** | **≈ $7–10k/mo** | **≈ $18–30k/mo** | |

Pilot semester all-in: **≈ $45–65k**. That is the real "cost to know" whether this works.

## 2. Runway scenarios

| Scenario | Capital | Gets us to | Verdict |
|---|---|---|---|
| Bootstrap | founders' $30–50k | Half a pilot — dies mid-semester | Only viable with founders' living costs covered elsewhere |
| **Pre-seed $150–250k** (angels/Caricaco/Carao-class regional funds, or accelerator) | 12–18 months | Pilot + waves 2–3 + P1 revenue switched on | **Target path** — raise on the plan, close before matrícula minus 3 months |
| Pre-seed + seed | +$1–1.5M at P2 metrics | CR national + Phase B payments licensing/partnership + RN app + 8–10 team | Raise on *measured* liquidity gates, not vision |

Fundraising narrative maps 1:1 to the phase gates (doc 02 §4): pre-seed buys the pilot numbers;
seed buys national scale on proven unit economics; Series A buys country #2 with the playbook
as the asset. Milestones already defined = the pitch writes itself from these docs.

## 3. Financial discipline rules (encoded now, while it's easy)

1. Fees revenue is recognized per e-invoice (doc 05 §3); **no fund flows on our P&L in Phase A**
   (we never touch rent — also an accounting simplification).
2. One metric rules spend: **cost per activated lease** (all-in burn ÷ new on-rail leases) —
   reviewed monthly against the ~$91/lease-year revenue (doc 02 §3).
3. No spend category may grow ahead of its gate (marketing before liquidity gate = banned by
   doc 03; hiring before support/ops load demands it = banned here).
4. 3-month expense buffer minimum at all times; breach = immediate scope cut, pre-agreed order:
   paid marketing → tools → ambassador count. Founder pay and legal/accounting are cut last.

## 4. Team plan

- **Now (pilot):** founders do everything client-facing (GTM doc §2 is founder-led by design);
  the docs in this repo are the async "senior architect" so a junior dev can execute the
  backend (that was their explicit purpose).
- **Hire 1 (at P1):** Ops/Community — owns campus playbook execution, support, verification
  queue. This hire is the scaling unit of the whole GTM.
- **Hire 2 (at P1–P2):** Full-stack dev (junior-mid; the design docs + code review carry them).
- **At seed:** senior backend (payments/Phase B), designer, 2nd ops, country lead when
  expansion starts.
- Equity: standard 4y/1y-cliff ESOP ~10% pre-seed; advisors (one CR real-estate/legal, one
  marketplace operator) 0.25–0.5% each.

## 5. Open finance questions (owner: founders, before pre-seed close)

Founder vesting & IP assignment into the S.R.L. (with L3 counsel) · SAFE vs priced round
norms with CR/regional angels · whether an accelerator (YC-style or regional) is worth the
dilution for the payments-licensing doors it opens at Phase B.
