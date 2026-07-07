# bilo Backend (MVP)

Backend NestJS + PostgreSQL + Prisma para bilo — plataforma de alquiler residencial tipo "Tinder + Airbnb + trust layer" para LATAM.

> **📐 Production backend design:** este repo es el prototipo. El diseño completo del backend
> de producción (arquitectura, decisiones, trade-offs, patrones, módulos, roadmap) vive en
> [`docs/design/`](./docs/design/README.md). Leer eso antes de escribir código nuevo.

## Stack

- Node.js 20 + TypeScript
- NestJS 10
- PostgreSQL 16 + Prisma 5
- JWT + Passport (Google OAuth + mock-login para demo)
- class-validator + Swagger / OpenAPI
- EventEmitter para domain events
- Docker + Docker Compose

## Estructura

```
bilo-backend/
  prisma/
    schema.prisma       # Todos los modelos + enums
    seed.ts             # Datos demo (usuarios, propiedades, lease, pagos, trust)
  src/
    main.ts
    app.module.ts
    config/
    common/             # decorators, guards, filters, types
    prisma/             # PrismaService global
    modules/
      auth/             # Google OAuth + JWT + mock-login
      users/
      preferences/
      properties/       # CRUD landlord + analytics
      recommendations/  # Strategy: PostgresEngine + Neo4j stub
      swipes/           # like/dislike/superlike
      matches/          # accept/reject → crea conversación
      conversations/    # chat REST
      leases/           # crea pagos iniciales
      payments/         # Strategy: StripeMockProvider
      trust/            # Global. Listener de payment.paid/failed
      ratings/
      disputes/
      services/         # property_services + service_requests
      ai/               # Strategy: MockAIProvider con context DB
      notifications/    # Global. Listener de muchos eventos
      audit/            # Global. Audit logs centrales
      health/           # /health + /health/db (Prisma ping)
  docker-compose.yml
  Dockerfile
  .env.example
```

## Cómo correr

### Opción 1 — Docker Compose (recomendada)

```bash
cd bilo-backend
cp .env.example .env       # editar secrets si quieres
docker compose up --build
```

Esto levanta:
- `postgres` en `localhost:5432` (db: `bilo`, user/pass: `bilo`/`bilo`).
- `backend` en `localhost:3000`.

El contenedor backend corre `prisma migrate deploy` antes de arrancar Nest.

Luego, para cargar datos demo:

```bash
docker compose exec backend npx prisma db seed
```

### Opción 2 — Local (sin Docker para el backend)

Requiere Node 20 y Postgres corriendo (puedes usar `docker compose up postgres`).

```bash
cd bilo-backend
cp .env.example .env
# editar DATABASE_URL si tu postgres no es localhost:5432
npm install --legacy-peer-deps
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

## URLs útiles

- API base: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/v1/docs`
- Health: `http://localhost:3000/api/v1/health`
- Health DB: `http://localhost:3000/api/v1/health/db`

## Demo end-to-end (mock-login)

Todas las rutas requieren `Authorization: Bearer <token>` salvo las `@Public()`. Para la demo, usa `POST /api/v1/auth/mock-login` (no requiere Google real).

```bash
# 1. Login mock como tenant
curl -X POST http://localhost:3000/api/v1/auth/mock-login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "ana@bilo.app", "fullName": "Ana", "role": "TENANT" }'

# Guarda accessToken. Repite con landlord:
curl -X POST http://localhost:3000/api/v1/auth/mock-login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "carla@bilo.app", "fullName": "Carla", "role": "LANDLORD" }'

# 2. Crea preferencias (tenant)
curl -X PUT http://localhost:3000/api/v1/preferences/me \
  -H "Authorization: Bearer $TENANT_TOKEN" -H 'Content-Type: application/json' \
  -d '{ "budgetMin": 400, "budgetMax": 900, "acceptsPets": true }'

# 3. Crear propiedad (landlord)
curl -X POST http://localhost:3000/api/v1/properties \
  -H "Authorization: Bearer $LANDLORD_TOKEN" -H 'Content-Type: application/json' \
  -d '{ "title": "Apto Escazú", "description": "Lindo", "city": "San José", "zone": "Escazú", "monthlyPrice": 750, "depositAmount": 750, "bedrooms": 2, "petsAllowed": true, "parking": true, "furnished": true }'

# 4. Feed de recomendaciones (tenant)
curl http://localhost:3000/api/v1/recommendations/feed -H "Authorization: Bearer $TENANT_TOKEN"

# 5. Swipe like
curl -X POST http://localhost:3000/api/v1/swipes \
  -H "Authorization: Bearer $TENANT_TOKEN" -H 'Content-Type: application/json' \
  -d '{ "propertyId": "<PROP_ID>", "action": "LIKE" }'

# 6. Crear match (tenant), aceptar (landlord)
curl -X POST http://localhost:3000/api/v1/matches \
  -H "Authorization: Bearer $TENANT_TOKEN" -H 'Content-Type: application/json' \
  -d '{ "propertyId": "<PROP_ID>" }'

curl -X POST http://localhost:3000/api/v1/matches/<MATCH_ID>/respond \
  -H "Authorization: Bearer $LANDLORD_TOKEN" -H 'Content-Type: application/json' \
  -d '{ "action": "accept" }'

# 7. Mensaje en conversación
curl -X POST http://localhost:3000/api/v1/conversations/<CONV_ID>/messages \
  -H "Authorization: Bearer $TENANT_TOKEN" -H 'Content-Type: application/json' \
  -d '{ "content": "Hola!" }'

# 8. Crear lease (landlord)
curl -X POST http://localhost:3000/api/v1/leases \
  -H "Authorization: Bearer $LANDLORD_TOKEN" -H 'Content-Type: application/json' \
  -d '{ "matchId": "<MATCH_ID>", "monthlyAmount": 750, "depositAmount": 750, "startDate": "2026-06-01T00:00:00Z" }'

# 9. Simular pago exitoso
curl -X POST http://localhost:3000/api/v1/payments/<PAYMENT_ID>/simulate-success \
  -H "Authorization: Bearer $TENANT_TOKEN"

# 10-11. Ver trust events + audit logs
curl http://localhost:3000/api/v1/trust/me -H "Authorization: Bearer $TENANT_TOKEN"
# audit-logs requiere ADMIN

# 12. Crear disputa
curl -X POST http://localhost:3000/api/v1/disputes \
  -H "Authorization: Bearer $TENANT_TOKEN" -H 'Content-Type: application/json' \
  -d '{ "leaseId": "<LEASE_ID>", "againstId": "<LANDLORD_ID>", "type": "MAINTENANCE_ISSUE", "title": "Goteo", "description": "Goteo en baño" }'

# 13. Pregunta a la IA sobre la propiedad
curl -X POST http://localhost:3000/api/v1/ai/property/<PROP_ID>/ask \
  -H "Authorization: Bearer $TENANT_TOKEN" -H 'Content-Type: application/json' \
  -d '{ "question": "Acepta mascotas?" }'
```

## Patrones aplicados

- **Strategy + Factory**: `PaymentProvider` (token `PAYMENT_PROVIDER`), `RecommendationEngine` (token `RECOMMENDATION_ENGINE`), `AIProvider` (token `AI_PROVIDER`).
- **Domain Events** (EventEmitter2): `swipe.created`, `match.accepted`, `payment.paid`, `payment.failed`, `dispute.created`, `lease.created`, `trust.score_updated`, etc.
- **@Global modules**: `Audit`, `Notifications`, `Trust` para no obligar a cada módulo a importarlos.
- **Auth global**: `JwtAuthGuard` registrado como `APP_GUARD`. Endpoints públicos marcados con `@Public()`.
- **Roles**: `@Roles(UserRole.LANDLORD)` + `@UseGuards(RolesGuard)` para autorización fina.
- **Soft delete**: `deletedAt` en `User`, `Property`, `Lease`.
- **Trazabilidad**: `payment_events`, `payment_transactions`, `trust_events`, `trust_score_history`, `audit_logs`.

## Cosas que NO se implementan (a propósito, por scope MVP)

- Pagos reales (solo `StripeMockPaymentProvider`).
- OpenAI real (solo `MockAIProvider` con respuestas por keyword sobre el contexto DB).
- Neo4j real (solo stub `Neo4jRecommendationEngine`).
- WebSockets (chat es REST; el modelo está listo para subirse a websockets después).
- Push notifications reales (sólo persistencia en `notifications`).

## Comandos útiles

```bash
npm run build               # nest build
npm run start:dev           # nodemon
npm run prisma:migrate      # prisma migrate dev
npm run prisma:deploy       # migrate deploy (prod / docker)
npm run prisma:seed         # ts-node prisma/seed.ts
npm run prisma:studio       # Prisma Studio en :5555
npm run seed:sqlite:inside-airbnb   # catalogo SQLite paralelo desde Inside Airbnb
```

## SQLite seed realista

Agregue un flujo paralelo para poblar un `.sqlite` con listings reales o semirrealistas descargados por HTTP desde Inside Airbnb, sin depender de PostgreSQL ni tocar el schema Prisma principal.

- Script: [scripts/inside_airbnb_to_sqlite.py](C:\Users\jfzum\Downloads\BILO\bilo-backend\scripts\inside_airbnb_to_sqlite.py)
- Documentacion: [docs/sqlite-realistic-seeding.md](C:\Users\jfzum\Downloads\BILO\bilo-backend\docs\sqlite-realistic-seeding.md)

```bash
npm run seed:sqlite:inside-airbnb
```
