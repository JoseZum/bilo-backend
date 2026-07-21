<div align="center">

# Diseño del backend de producción

**Las decisiones técnicas que llevan a bilo del prototipo a una plataforma operable.**

[`bilo`](../../README.md) · [`Negocio`](../business/README.md) · [`Requisitos`](../requirements/README.md)

</div>

---

Este directorio contiene el diseño técnico completo del backend de bilo en su camino hacia
producción. Su propósito es dejar registradas las decisiones que definen el sistema antes de
implementarlas: el contexto de cada decisión, las alternativas evaluadas, los compromisos
aceptados y las condiciones que justificarían revisarla. Con este marco, una persona que se
incorpore al equipo puede asumir un módulo sin tener que reconstruir o volver a discutir sus
fundamentos arquitectónicos.

## Qué existe hoy y qué describen estos documentos

El repositorio contiene actualmente un **prototipo funcional de etapa 0** construido con NestJS,
Prisma y SQLite. Incluye proveedores simulados y un acceso de demostración; su función es validar
los recorridos principales del producto. No representa todavía el backend de producción.

Los documentos de este directorio definen la **arquitectura objetivo**: qué partes del prototipo
se conservan, cuáles deben sustituirse y en qué secuencia debe hacerse la transición. Por tanto,
una capacidad descrita aquí no debe interpretarse automáticamente como una capacidad ya
implementada en el código actual. El estado y el orden de ejecución están detallados en la
[hoja de ruta](./13-roadmap.md).

La documentación se complementa con dos fuentes que también condicionan el diseño:

- **Negocio.** El análisis de mercado, monetización, salida al mercado y aprendizajes de otras
  compañías se encuentra en [`docs/business/`](../business/README.md). Dos decisiones son
  vinculantes para esta arquitectura: la IA se aplaza hasta alcanzar escala nacional y el nicho
  inicial son estudiantes universitarios de Costa Rica.
- **Requisitos.** El inventario numerado de requisitos funcionales (ERS) y el proceso que conecta
  cada requisito con su implementación se encuentran en
  [`docs/requirements/`](../requirements/README.md). La ERS utiliza estos documentos de diseño
  como especificación normativa de cada requisito.

## Recorrido de lectura

Para una primera lectura conviene seguir el orden numérico. Después, cada documento puede
consultarse de manera independiente.

| # | Documento | Pregunta que responde |
|---|-----------|-----------------------|
| 01 | [Visión y etapas de escala](./01-vision-and-stages.md) | Qué estamos construyendo, cuál es el modelo de negocio y qué cuatro etapas de escala orientan las decisiones técnicas |
| 02 | [Arquitectura](./02-architecture.md) | Cómo se estructura el monolito modular, sus capas, límites entre módulos y ciclo de una solicitud |
| 03 | [Decisiones de stack tecnológico](./03-tech-stack-decisions.md) | Por qué se eligieron NestJS, Prisma y PostgreSQL, qué alternativas se descartaron y bajo qué criterios |
| 04 | [Patrones de diseño](./04-design-patterns.md) | Qué patrones se aplican, dónde aportan valor y cuáles se rechazan expresamente |
| 05 | [Base de datos](./05-database.md) | Cómo se diseña el esquema de PostgreSQL para producción: dinero, identificadores, índices, migraciones y crecimiento |
| 06 | [Autenticación y autorización](./06-auth.md) | Cómo funcionarán OAuth con Google y Apple, los tokens, la rotación de refresh tokens y los roles |
| 07 | [Especificación de módulos](./07-modules.md) | Qué responsabilidades, entidades, endpoints, eventos, máquinas de estado y clases pertenecen a cada dominio |
| 08 | [Capacidades intercambiables](./08-pluggable-capabilities.md) | Cómo el modelo de puertos y adaptadores permite activar Redis, Neo4j, Stripe o IA mediante configuración de entorno |
| 09 | [Eventos y tareas en segundo plano](./09-events-and-jobs.md) | Cómo se manejan los eventos de dominio, la evolución hacia outbox, la generación de rentas y las colas |
| 10 | [Observabilidad y operaciones](./10-observability-and-ops.md) | Qué exige el sistema en logs, métricas, trazas, despliegue, salud y respuesta a incidentes |
| 11 | [Estrategia de pruebas](./11-testing-strategy.md) | Qué se prueba en cada capa y qué condiciones debe imponer la integración continua |
| 12 | [Convenciones de API](./12-api-conventions.md) | Cómo se normalizan versionado, paginación, errores, idempotencia y límites de consumo |
| 13 | [Hoja de ruta de implementación](./13-roadmap.md) | En qué orden se construye el sistema, con épicas, tareas y criterios de aceptación ejecutables |
| 14 | [Alineación con frontend](./14-frontend-alignment.md) | Qué decisiones fija el prototipo de frontend sobre mercado inicial, contrato de API, desembolsos, tarjetas de chat y revisión de contratos con IA |
| 15 | [Inventario alquilable](./15-rentable-inventory.md) | Cómo se representan habitaciones, apartamentos y edificios mediante una jerarquía extensible, y cómo se separan unidades de anuncios |
| 16 | [Verificación de identidad](./16-identity-verification.md) | Cómo se modelan el perfil verificado, la unicidad del documento oficial, una persona por cuenta y las restricciones por bloqueo |
| 17 | [Listas de espera](./17-waiting-lists.md) | Cómo funcionan las listas por anuncio, los filtros del propietario y el recorrido de invitación a match |
| 18 | [Unidades compartidas y compañeros de vivienda](./18-roommates.md) | Cómo se manejan contratos por cupo, solicitudes, revisión y veto de ocupantes, y visibilidad basada en consentimiento |
| 19 | [Solicitudes de mantenimiento](./19-maintenance-tickets.md) | Cómo se integran al chat las reparaciones, prioridades y SLA, archivos, visitas, recordatorios y avisos del técnico |
| 20 | [Búsqueda geográfica y puntos de interés](./20-geo-search-and-poi.md) | Cómo se resuelve la búsqueda por punto y radio, el catálogo importado desde OSM y las decisiones de mapas y teselas |
| 21 | [Recorridos complementarios](./21-journey-completions.md) | Cómo se completan visitas, búsquedas guardadas, alertas, comparación, búsqueda de compañeros, hoja de vida de alquiler, fiador, denuncias, bloqueos, reglas de vivienda, anuncios verificados y finalización del contrato |
| 22 | [Suscripciones y permisos](./22-subscriptions-and-entitlements.md) | Cómo el módulo MON administra planes, acceso a capacidades, cobro recurrente con facturación electrónica, recuperación de impagos y anuncios destacados |

## Principios que gobiernan el diseño

Estos cinco criterios sirven para resolver decisiones cotidianas sin añadir complejidad que el
producto todavía no necesita.

1. **Núcleo predecible, bordes intercambiables.** El dominio central —usuarios, propiedades,
   contratos y pagos— se apoya en clases TypeScript directas y transacciones PostgreSQL. Las
   piezas que realmente pueden variar —caché, recomendaciones, pasarela de pago, IA,
   almacenamiento y colas— se exponen mediante puertos con adaptadores seleccionados por
   variables de entorno.

2. **Cada patrón debe justificar su coste.** Un patrón se adopta únicamente cuando protege frente
   a una variación o un modo de fallo concreto. El [documento 04](./04-design-patterns.md)
   registra también los patrones descartados y las razones, para evitar que se incorporen por
   inercia bajo una etiqueta de arquitectura empresarial.

3. **La base de datos protege invariantes; el código gobierna procesos.** PostgreSQL debe asegurar
   unicidad, integridad referencial y consistencia monetaria mediante restricciones y
   transacciones. Las transiciones de negocio corresponden a máquinas de estado explícitas.
   Ninguna regla crítica puede depender únicamente de una convención de uso.

4. **Se diseña para la etapa siguiente y se construye para la actual.** Cada componente indica en
   qué etapa necesita evolucionar y cuál es el punto de extensión previsto; el
   [documento 01](./01-vision-and-stages.md) define esas etapas. La infraestructura de etapa 3 no
   se adelanta a la etapa 1, pero la implementación inicial conserva las uniones necesarias para
   crecer sin rehacer el dominio.

5. **Una capacidad operable debe ser observable.** Cada módulo de producción debe entregar logs
   estructurados, métricas y eventos de dominio. Poder diagnosticar el sistema en producción es
   parte de su definición de terminado.

## Convenciones de trabajo

- La documentación de entrada se presenta en español; los identificadores de código permanecen
  en inglés para conservar las convenciones del ecosistema técnico.
- Los registros de decisión siguen un formato mini-ADR:
  **Context → Decision → Alternatives → Trade-offs → Revisit when**.
- Los ejemplos de código son normativos: los nombres, la distribución de archivos y las formas de
  las clases que muestran son los previstos para la implementación.
