# 06 — Authentication & Authorization

## 1. Decision: OAuth only — Google + Apple. No passwords, ever.

**Context.** Password databases are the #1 breach liability and the #1 support cost (resets).
Our clients are mobile-first; both app stores push native Google/Apple sign-in, and Apple
*requires* "Sign in with Apple" if any third-party login is offered on iOS.

**Decision.** Exactly two identity providers: **Google** and **Apple**. No email/password, no
magic links, no other providers. The prototype's `mock-login` endpoint survives **only** behind
`AUTH_ALLOW_MOCK=true`, which the config schema **rejects when `NODE_ENV=production`** (boot
failure, not a warning).

**Trade-offs accepted.** Users without Google/Apple accounts can't sign up (acceptable for a
mobile-first product); we depend on provider availability (mitigated: sessions are ours — a
Google outage blocks new logins, not existing sessions).

**Revisit when.** A B2B landlord portal needs enterprise SSO (add OIDC adapter behind the same
port; still no passwords).

## 2. Flow — token verification, not redirect dance

Mobile apps use the **native SDK flow**: the app obtains an ID token from Google/Apple locally,
then exchanges it with us. The backend never handles provider redirects for mobile (the
prototype's web redirect flow for Google stays for the web app).

```
POST /api/v1/auth/oauth/exchange
{ "provider": "google" | "apple", "idToken": "<provider JWT>", "nonce": "<if apple>" }
→ 200 { accessToken, refreshToken, user }   (+ isNewUser flag)
```

Backend steps (the `IdentityProviderPort` — one adapter per provider):

1. **Verify** the ID token: signature against the provider's JWKS (cached, kid-rotated),
   `iss`, `aud` (our client IDs), `exp`, and for Apple the `nonce`.
2. Extract `(providerUserId, email, emailVerified, name?)`.
   Apple quirk handled explicitly: name arrives **only on first authorization** and must be
   persisted then; email may be a private relay address.
3. **Find-or-create** user:
   - Match on `(provider, providerUserId)` in `auth_identities` → login.
   - Else match on verified email → **link** new identity to existing user (one bilo account,
     both providers).
   - Else create user + identity in one transaction.
4. Issue our tokens (§3). Provider tokens are verified and **discarded** — we never store them.

```prisma
model AuthIdentity {           // replaces users.google_id
  id             String  @id
  userId         String
  provider       AuthProvider   // GOOGLE | APPLE
  providerUserId String
  email          String?        // provider-reported at link time
  createdAt      DateTime @default(now())
  @@unique([provider, providerUserId])
  @@index([userId])
}
```

## 3. Session model — short access JWT + rotating refresh tokens

- **Access token:** JWT, **15 minutes**, claims: `sub` (userId), `role`, `sid` (session id),
  `iat/exp`. Signed HS256 with `JWT_SECRET` at Stage 1 (single issuer = single verifier; RS256
  buys nothing yet — revisit at extraction). Stateless verification on every request: no DB hit.
- **Refresh token:** opaque 256-bit random string. Stored **hashed (SHA-256)** in
  `refresh_tokens` with: `sessionId`, `userId`, `familyId`, `expiresAt` (30 days sliding),
  `rotatedAt`, `revokedAt`, `userAgent`, `ip`.
- **Rotation with reuse detection:** every `POST /auth/refresh` issues a new refresh token and
  marks the old one rotated. Presenting an already-rotated token = theft signal → **revoke the
  whole family** (all sessions in that chain) and log a security audit event. This is the
  industry-standard defense and it costs one indexed table.
- Logout: revoke session; logout-all: revoke all user sessions. Access tokens live ≤15 min after
  revocation — acceptable window (they can't be refreshed); a Redis denylist keyed by `sid`
  closes even that at Stage 2 if product demands instant kill.

**Why not server-side sessions only:** every request would hit the session store. Why not
long-lived JWTs: unrevocable. The hybrid is the standard because it's the right trade.

## 4. The prototype deltas

1. Replace `users.googleId` with the `auth_identities` table (migration backfills it).
2. Add Apple adapter (`apple-signin-auth` or hand-rolled JWKS verify — small either way).
3. Implement `refresh_tokens` storage + rotation (prototype signs refresh JWTs but doesn't store
   or rotate — not production-grade).
4. Gate `mock-login` behind `AUTH_ALLOW_MOCK` with production boot rejection.
5. Keep: global `JwtAuthGuard` as `APP_GUARD`, `@Public()`, `@CurrentUser()`, `@Roles()` +
   `RolesGuard` — this part of the prototype is exactly right.

## 5. Authorization

Two layers, deliberately simple:

1. **Role gate (coarse):** `TENANT | LANDLORD | ADMIN` via `@Roles()` on controllers.
   A user's role is on the JWT; role changes (tenant becomes landlord too) re-issue tokens.
   Note: role is not exclusive in the domain — a landlord can rent as a tenant, and the
   frontend toggles between the two views constantly (doc 14 §1). `role` on the user is the
   *primary* role; role-scoped list endpoints accept `?as=tenant|landlord` for the acting
   view, and capability checks below are what actually protect resources.
2. **Ownership/participation policies (fine):** pure policy classes per module, called first
   thing in every application-service method that touches a resource:

```ts
export class LeasePolicy {
  static canView(user: AuthUser, lease: Lease): boolean {
    return user.role === 'ADMIN' || lease.tenantId === user.id || lease.landlordId === user.id;
  }
  static canTerminate(user: AuthUser, lease: Lease): boolean { /* landlord or admin */ }
}
// in LeasesService — the shape every module copies:
const lease = await this.db.lease.findUniqueOrThrow({ where: { id } });
if (!LeasePolicy.canView(user, lease)) throw new ForbiddenException();
```

No RBAC engine, no permission tables, no CASL — until we have configurable per-org permissions
(Stage 3+ B2B), static policy classes are clearer, faster, and greppable.

## 6. Security hardening checklist (Stage 1, non-negotiable)

- `helmet`, strict CORS allowlist (`FRONTEND_URL`+ mobile schemes), HTTPS only behind LB.
- Rate limits: `auth/*` endpoints 10/min/IP; global sane default (doc 12 §6).
- Secrets from the platform's secret manager, never in env files in repos; `JWT_SECRET` rotation
  supported by accepting two active secrets (`current`, `previous`).
- Audit events (doc 07 §Audit) for: login, refresh, reuse-detection trigger, logout-all,
  role change.
- PII in logs is banned — the logger redacts `email`, `phone`, tokens by key (doc 10).
