# 03 — Tenancy Law & the Hospedaje Boundary

*Desk research, not legal advice — see the [folder README](./README.md) disclaimer.*

The single most product-shaping law in this folder: **Ley 7527 (Ley General de Arrendamientos
Urbanos y Suburbanos)** governs every housing lease in Costa Rica, and its rules are
tenant-protective in ways that collide with "semester rental" product intuition. The escape
hatch everyone reaches for — call it *hospedaje* instead of *arrendamiento* — walks straight
toward **Ley 9742** (tourism lodging) if done carelessly. This doc maps the terrain.

## 1. Ley 7527 — the rules that bind our lease module

Sources: [law text](https://www.asamblea.go.cr/sd/Documents/BIBLIOTECADIGITAL/DOCUMENTOS/LEYES/LEY%207527-LEY%20GENERAL%20DE%20ARRENDAMIENTOS%20URBANOS%20Y%20SUBURBANOS.pdf),
[practitioner guide](https://www.highlandscr.com/post/ley-de-arrendamientos-costa-rica-guia-propietarios-inquilinos),
[bufete summary](https://bufetedecostarica.com/ley-general-de-arrendamientos-urbanos-y-suburbanos-de-costa-rica/).

| Rule | Detail | Product consequence |
|---|---|---|
| **3-year minimum term (housing)** | Any shorter agreed term is null *against the tenant*; the landlord is bound for 3 years; the tenant may leave any time with **3 months' written notice** | A "6-month lease" is legally a 3-year lease the landlord can't shorten. Lease templates must not promise landlords something the law voids. UI copy must never misstate the term |
| **Automatic renewal** | Renews for another 3 years unless a party gives notice **3 months before expiry** | The lease-expiry job (D09) becomes a legal-deadline reminder feature — genuinely valuable, nearly free to build |
| **Deposit** | Practice: capped around one month for housing; return window ~1 month after handover | Deposit fields validate against cap; a return-SLA timer feeds the disputes module |
| **Rent increases** | Colones contracts: annual increase tied to inflation/CPI rules; **foreign-currency contracts: rent frozen for the whole term** | `RentSchedule` gets per-currency indexation policy; listing flow warns landlords pricing in USD |
| **Form freedom** | Leases can be written, electronic, or even verbal — no notary required | Our digital contract + Ley 8454 signature analysis ([doc 05 §4](./05-money-tax-and-criminal-exposure.md)) is a valid lease vehicle |
| **Habitability & repairs** | Landlord owes the property in a serviceable state; necessary repairs on the landlord | The maintenance module (D19) is aligned with the legal duty split — ticket categories/records double as evidence either party can use |
| **Eviction** | Judicial process; the platform has no role | bilo never promises eviction help — dispute module language stays clear of it |

**Exclusions (art. 7-class):** hotels, pensiones, and *occasional lodging* fall outside
7527 — the root of the structuring question below.

## 2. What this means for bilo's product honestly

- The **room-rental student market runs on informality** (semester "contracts" that are
  legally 3-year leases, or nothing written at all). bilo's templates can't repeat the
  informal fiction; they must be honest about the regime they're in — which is exactly the
  trust moat: *our* paperwork is the correct one.
- The `LeaseTerminationRules`/regime dimension (`VIVIENDA | HOSPEDAJE`) already planned in
  business 05 stands; **which real inventory can legally use the HOSPEDAJE flavor is counsel
  question L1/L8**, not an engineering decision.
- The 3-month-notice reminder, deposit-return timer, and CPI-increase calculator are three
  **cheap features the law hands us** that no informal competitor offers.

## 3. The hospedaje trap — Ley 9742

**Ley 9742** (Ley Marco de Hospedaje No Tradicional, in force June 2020) regulates
*non-traditional lodging*: **tourist-purpose stays in homes/apartments/rooms from 24 hours
up to one year**, and it obligates **both hosts and the intermediating platforms** to
register with the ICT — with tax consequences (13% IVA on lodging)
([ICT registry](https://www.ict.go.cr/es/servicios-institucionales/registro-de-hospedaje-no-tradicional.html),
[law + reglamento](https://www.ict.go.cr/en/documents/legislaci%C3%B3n-de-empresas/leyes-y-reglamentos/2150-ley-marco-para-la-regularizaci%C3%B3n-del-hospedaje-no-tradicional-y-su-intermediaci%C3%B3n-a-trav%C3%A9s-de-plataformas-digitales/file.html),
[Zürcher analysis](https://www.zurcherodioraven.com/es/noticias-y-opinion/13-reglamento-a-la-ley-marco-para-la-regularizacion-del-hospedaje-no-tradicional-y-su-intermediacion-a-traves-de-plataformas-digitales)).

The tension, precisely: a "semester rental" is **< 1 year** — the 9742 duration band — so if
we structure it as "hospedaje" to escape 7527's 3-year rule, the obvious question is whether
we've structured ourselves into **ICT-registered tourist lodging** instead. The apparent
distinguishing element is ***purpose*: 9742 targets "fines turísticos"** (tourism), and
student housing is residence, not tourism — but "apparent" is not a defense strategy.

**Position until counsel says otherwise (threat T5):**
1. bilo lists **housing, minimum stay ≥ 1 month**, marketed as residence (student housing),
   never as vacation/tourist stays — no nightly pricing anywhere in the product.
2. Lease templates default to the honest 7527 regime; a hospedaje-flavored template ships
   **only after L1/L8 defines which inventory qualifies** (e.g., rooms with services in the
   owner's home — the *pensión/casa de huéspedes* tradition) and whether ICT is implicated.
3. If bilo ever adds short stays, that's a deliberate product decision that starts with ICT
   platform registration, not a drift.

## 4. Landlord-side legal surface we should acknowledge

- **Authority to rent:** listings warrant ownership or authorization (sub-letting without
  authority is the classic scam) — the landlord agreement (doc 02 §4) carries the warranty,
  and landlord verification (doc 04 §4) can check title against the public Registro Nacional.
- **Condominium rules:** units inside condominios may have internal rules restricting rentals
  — listing flow should prompt the landlord to confirm authority under their condo regime.
- **Habitability disputes:** our maintenance records cut both ways by design (that is a
  feature: honest evidence).

## Questions for counsel

- **L1/L8 (P0):** the definitive structuring memo: for each inventory type (room in family
  home with services / room in shared student apartment / whole apartment), which regime
  applies (7527 vivienda, hospedaje-Civil-Code, 9742), and what our templates + UI must say.
- Deposit cap and return window: exact current figures and whether they differ by regime.
- Whether bilo's role in generating lease documents from templates creates any co-liability
  on lease performance (pairs with doc 02 counsel questions).
- The CPI-increase mechanism reference (index, cap, timing) to encode in `RentSchedule`.
