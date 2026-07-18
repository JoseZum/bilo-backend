# 16 — Identity Verification & One-Person-One-Account

Verified profiles are a **trust badge, not a gate**: anyone can use bilo unverified, but a
verified profile carries a visible badge, feeds the trust score, and unlocks filters other users
apply (waiting lists, doc 17 §4; roommate screening, doc 18). The hard requirement underneath
the badge: **one government identity links to exactly one account, ever** — so a banned person
cannot return with a fresh email, and one person cannot farm accounts.

New **identity module** (Ring 1, builds alongside doc 07 §2 users). Auth (doc 06) is untouched:
OAuth answers "who logs in"; identity answers "which legal person is this."

## 1. The identity record

**Decision.** A dedicated entity — not columns on `users` — because the record must be able to
**outlive the account** (ban/erasure) and because its uniqueness constraint is the whole point:

```prisma
model IdentityRecord {
  id                 String    @id                       // UUIDv7
  userId             String    @unique @map("user_id")   // one identity per account
  countryCode        String    @db.Char(2)               // ISO 3166-1, 'CR' first
  documentType       IdentityDocumentType                // CEDULA | DIMEX | PASSPORT
  documentNumberHash String    @map("document_number_hash") // HMAC-SHA256, see §2
  documentLast4      String    @map("document_last4")    // support UI only
  fullLegalName      String    @map("full_legal_name")
  dateOfBirth        DateTime  @map("date_of_birth")
  status             IdentityStatus                      // §3 state machine
  providerRef        String?   @map("provider_ref")      // verification provider's case id
  verifiedAt         DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@unique([countryCode, documentType, documentNumberHash]) // ← one ID, one account
  @@index([status])
  @@map("identity_records")
}
```

- `userId UNIQUE` — an account carries at most one identity.
- `(countryCode, documentType, documentNumberHash) UNIQUE` — a government ID is claimed at most
  once, platform-wide. A second account submitting the same document hits the constraint and
  gets a support-appeal path, never a silent duplicate. **This row is never deleted** — on
  account erasure (doc 05 §4) the PII fields (`fullLegalName`, `dateOfBirth`, `documentLast4`)
  are scrubbed but the hash row and user link survive, because the anti-evasion property *is*
  the retained hash.
- Document types launch Costa-Rica-first: `CEDULA` (cédula de identidad, 9 digits), `DIMEX`
  (residents), `PASSPORT` (foreigners). New countries add `(countryCode, documentType)` pairs
  to a per-country registry (format + checksum validation rules in code), same pattern as the
  unit-type registry (doc 15 §3).

**Alternatives.** Columns on `users` (dies with the row — breaks ban semantics); a separate
"persons" aggregate with N accounts per person (explicitly *not* wanted — product rule is one
account per person); storing the raw document number with a unique index (unacceptable PII
exposure). All rejected.

## 2. Never store the number — the hashing decision

**Decision.** `documentNumberHash = HMAC-SHA256(normalize(number), IDENTITY_HASH_KEY)` with the
key in the secret manager, never in the DB. Deterministic hashing (not per-row salts) is
required because the uniqueness constraint needs equality across rows.

**Trade-offs, stated honestly.** A cédula has ~10⁹ possible values, so if *both* the table and
the HMAC key leak, brute-force is trivial — key custody is the control (KMS-class storage,
access-audited, distinct from app secrets). We accept that key rotation requires a re-hash
migration we cannot perform without users re-submitting; therefore the key is treated as
non-rotatable-in-place and guarded accordingly. We do **not** store an encrypted copy of the
raw number at launch — **revisit when** a legal/compliance requirement (court order workflows,
KYC audits) demands recoverable numbers; the answer then is KMS envelope encryption in a
separate, access-audited table, not a change to this one.

Document photos/selfies travel through the private storage bucket (presigned, `StoragePort`,
doc 08), are visible only to the review flow, and are **deleted 90 days after a decision** —
the durable outputs are the hash, the status, and the audit trail. Raw numbers and image URLs
never appear in logs (pino redaction list, doc 10).

## 3. Verification flow

`IdentityStatus` machine: `NONE → SUBMITTED → IN_REVIEW → VERIFIED | REJECTED`, with
`REJECTED → SUBMITTED` (resubmission, capped at 3 attempts/30 days) and admin-only
`VERIFIED → REVOKED` (fraud discovered later; audited, reason enum).

Behind an **`IdentityVerificationPort`** (doc 08 pattern, `IDENTITY_PROVIDER=`):

| Adapter | Stage | What it does |
|---|---|---|
| `mock` | 0 / dev | scripted outcomes for tests/demos |
| `manual` | 1 (launch) | queues submissions for human review in the admin UI; checklist: photo ↔ selfie match, number checksum, TSE registry lookup for cédulas (manual at first) |
| `provider` | 2 | Didit/Truora/ComplyCube-class API; webhook-driven decisions through the same status machine (webhook plumbing per doc 07 §9: signature verify, dedup, fast-ack) |

The port returns facts (`match`, `mismatch`, `unreadable`); the **service** owns the state
machine and the uniqueness claim — claiming the hash happens in the same transaction as the
`VERIFIED` transition, so two racing verifications of the same document cannot both win.

## 4. The badge and its consumers

- `users.verificationStatus` becomes a **projection** of the identity record
  (`UNVERIFIED | PENDING | VERIFIED`), written only by the identity module (single-writer rule,
  doc 07 §2). The public-profile DTO exposes it as the badge; it never exposes anything else
  from the record.
- `user.verified` event feeds trust (+10, already specified in doc 07 §10).
- Waiting-list filters (doc 17 §4) and roommate screening (doc 18 §4) consume the badge via
  the public projection — **no module ever reads `identity_records`** except identity itself
  and the PII-scrub job.
- The student `STUDENT_VERIFIED` badge (roadmap 1.7) is a separate, weaker signal (proves a
  university email, not a legal person); the two coexist and the profile shows both.

## 5. Ban semantics — why this design exists

Ban flow: trust/safety bans the account (status, doc 07 §2) → account is dead, identity row
stays. The banned person creates a new Google account, signs up, submits the same cédula →
`(country, type, hash)` conflict → submission fails closed into a support appeal. Without a
verified identity the new account exists but carries no badge, fails every "verified only"
filter, and starts at trust 50 with no history — the ban has teeth without requiring
verification to be mandatory.

**Revisit when** legitimate relink requests (death of account, lost email) exceed a handful a
month → build a support-driven, audited relink flow (identity row re-points to a new user);
until then it is a manual admin operation with a runbook.

## 6. API

- `POST /identity/verification { countryCode, documentType, documentNumber, photos[] }` —
  submit; number is hashed in-request and discarded
- `GET /identity/me` — status, badge, resubmission allowance (never the hash/number)
- Admin: `GET /identity/review-queue`, `POST /identity/:id/decision { approve|reject, reason }`,
  `POST /identity/:id/revoke { reason }` — all audited (doc 07 §16)

**Emits.** `identity.submitted`, `user.verified`, `identity.rejected`, `identity.revoked`.
**Listens.** `user.deleted` → PII scrub of the record (keeps hash, §1).
