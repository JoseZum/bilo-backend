<div align="center">

# Marco legal de bilo en Costa Rica

**Un mapa de decisiones y riesgos para operar responsablemente en el mercado inicial.**

[`bilo`](../../../README.md) · [`Negocio`](../../business/README.md) · [`Diseño`](../../design/README.md)

</div>

---

Este directorio reúne la investigación jurídica de referencia para operar bilo en Costa Rica: constitución y registro de la sociedad, obligaciones tributarias, límites de responsabilidad de la plataforma, protección de datos, contratos y controles necesarios antes de incorporar usuarios reales o procesar dinero.

> **Advertencia legal.** Este material es una investigación documental elaborada por una persona no abogada, con base en las fuentes públicas enlazadas en cada documento. Sirve como mapa de decisiones y expediente preparatorio para asesoría profesional; no constituye asesoría legal. Cada documento termina con preguntas que deberá resolver un abogado costarricense antes de utilizar sus conclusiones. El resumen ejecutivo se encuentra en [`05 — Aspectos legales y regulatorios`](../../business/05-legal-and-regulatory.md); este directorio desarrolla ese análisis y amplía la agenda para asesoría jurídica a partir del punto L8.

## Documentos

| Documento | Alcance |
|---|---|
| [01 — Constitución y registros](./01-entity-and-registrations.md) | Constitución de una S.R.L., inscripciones obligatorias ante Hacienda, municipalidad, RTBF y CCSS, y estimación de costos iniciales y recurrentes en colones. |
| [02 — Responsabilidad de la plataforma y términos](./02-platform-liability-and-terms.md) | Mecanismos contractuales utilizados por Airbnb y su posible aplicación en Costa Rica; Ley 10946, Ley 7472 y estructura inicial de términos y políticas. |
| [03 — Arrendamiento y hospedaje](./03-tenancy-and-hospedaje.md) | Ley 7527, plazo mínimo de tres años, alternativas de hospedaje, alcance de la Ley 9742 y consecuencias para el módulo de contratos. |
| [04 — Identidad y protección de datos](./04-identity-and-data-protection.md) | Ley 8968, PRODHAB, verificación de cédula y selfie, tratamiento de datos biométricos, consentimiento y retención. |
| [05 — Dinero, impuestos y exposición penal](./05-money-tax-and-criminal-exposure.md) | Captación, IVA, factura electrónica, análisis de SUGEF 15 bis, depósitos y firma digital conforme a la Ley 8454. |

## Mapa de riesgos

La priorización sigue el impacto potencial para un equipo en etapa temprana: exposición penal, sanciones capaces de comprometer la empresa, litigios y brechas de cumplimiento corregibles.

| ID | Riesgo | Impacto | Referencia | Tratamiento propuesto |
|---|---|---|---|---|
| T1 | Custodiar o agrupar alquileres o depósitos sin autorización, con posible calificación como captación. | Crítico: exposición penal | 05 §1 | Evitarlo por diseño: durante la fase A, el dinero no pasa por bilo. |
| T2 | Incumplir obligaciones tributarias: factura electrónica, cobro de IVA sobre comisiones o declaraciones. | Crítico: exposición penal y multas | 05 §2 | Completar los registros antes de recibir el primer ingreso y utilizar InvoicingPort. |
| T3 | Tratar incorrectamente datos de identidad o biométricos bajo la Ley 8968. | Alto: multas y posible cierre de la base de datos | 04 | Minimización por diseño, almacenamiento de hash, retención limitada y consentimiento específico. |
| T4 | Ser considerado parte del arrendamiento y asumir obligaciones sobre plazo, desalojo o habitabilidad. | Alto: litigio | 02 §1, 03 | Mantener en producto y contratos una posición inequívoca de intermediario. |
| T5 | Estructurar alquileres semestrales como hospedaje y quedar sujetos a la Ley 9742 o al ICT. | Alto: registro e impuestos | 03 §3 | Resolver la pregunta L8 con asesoría jurídica; no improvisar esta estructura. |
| T6 | Incumplir la Ley 10946: claridad contractual en español, canal gratuito de reclamos, prohibición de patrones oscuros y mecanismo de notificación y acción. | Medio: brecha corregible | 02 §2 | Incorporar los requisitos en términos y producto antes del lanzamiento. |
| T7 | Omitir reglas de consumo: retracto de ocho días en ventas a distancia, precio total y mecanismo de reclamos. | Medio: brecha corregible | 02 §3 | Definir la política de reembolso de comisiones y los requisitos de interfaz. |
| T8 | Operar sin patente municipal o sin una sociedad debidamente registrada. | Medio: multas o cierre | 01 | Seguir la lista de verificación y reservar el presupuesto correspondiente. |
| T9 | Generar reclamaciones por discriminación o acoso mediante filtros de selección o convivencia. | Medio: impacto civil y reputacional | 02 §4 | Aplicar rechazo neutral según D17/D18 y formalizar la política. |
| T10 | Daños entre usuarios, incluidos fraude, anuncios falsos o visitas inseguras. | Medio: impacto civil y reputacional | 02 §1 | Combinar verificación, cláusulas de exención, moderación y mecanismos de denuncia. |

## Límites del MVP

1. **bilo no custodia alquileres ni depósitos.** No recauda, agrupa ni mantiene fondos en garantía. Sus comisiones se facturan por separado como ingresos propios. (T1)
2. **No se ofrecen estancias turísticas o de corto plazo.** La estancia mínima es de un mes y se presenta como vivienda hasta que asesoría jurídica delimite la aplicación de la Ley 9742. (T5)
3. **bilo no es parte del contrato de arrendamiento.** No firma, garantiza ni avala contratos; las plantillas se proporcionan como formularios y las partes contratan entre sí. (T4)
4. **No se venden ni comparten datos de usuarios.** Esta restricción reduce la exposición regulatoria ante PRODHAB y el riesgo reputacional. (T3)
5. **No se intermedian ventas inmobiliarias.** El alcance se limita al alquiler para evitar incorporar actividades APNFD sujetas al análisis de SUGEF 15 bis. (05 §3)
6. **No se almacenan números de cédula sin procesar ni se desarrolla un comparador biométrico propio.** La primera etapa utiliza hash y revisión manual; una etapa posterior deberá recurrir a un proveedor autorizado. (T3)
7. **No se administran llaves, visitas ni inmuebles.** bilo opera exclusivamente como plataforma de software.

## Requisitos propuestos para la ERS

Después de la revisión jurídica, los siguientes controles deberían convertirse en requisitos funcionales numerados:

- canal gratuito de consultas, quejas y reclamos con tiempos de respuesta trazables, conforme a las leyes 10946 y 7472;
- flujo de retracto de ocho días para las comisiones de bilo;
- resumen previo al pago y desglose del precio total;
- consentimiento versionado y específico para verificación de identidad, separado de la aceptación de términos prevista en FR-AUTH-009;
- proceso de notificación y acción con decisiones motivadas, como extensión de FR-ADMIN-004;
- recordatorios de renovación con tres meses de anticipación conforme a la Ley 7527;
- revisión de patrones oscuros como requisito no funcional y control de diseño.

## Agenda para asesoría jurídica

Estas consultas amplían los puntos L1–L7 definidos en el documento de negocio.

| ID | Consulta o entregable | Decisión bloqueada | Prioridad |
|---|---|---|---|
| L8 | Determinar si las habitaciones para estudiantes por semestre pueden quedar fuera tanto del plazo de tres años de la Ley 7527 como del registro ante el ICT bajo la Ley 9742. | Plantillas de contrato | P0 |
| L9 | Emitir criterio sobre la Ley 8968: tratamiento sensible en el flujo de cédula, selfie, revisión humana y eliminación a 90 días; texto exacto del consentimiento y necesidad de registro ante PRODHAB. | Lanzamiento de identidad | P1 |
| L10 | Revisar las brechas entre los términos, el producto y la Ley 10946 cuando se publiquen sus reglamentos; la investigación actual estima su entrada en vigor alrededor de junio de 2027. | Lanzamiento público | P1 |
| L11 | Determinar si el retracto aplica a la comisión de reserva y cuándo se considera prestado el servicio. | Monetización por comisiones | P1 |
| L12 | Confirmar si la intermediación limitada a alquileres queda fuera del registro APNFD previsto en SUGEF 15 bis. | Ninguna inmediata | P2 |
| L13 | Revisar las cláusulas de limitación de responsabilidad e indemnidad frente al régimen de cláusulas abusivas de la Ley 7472. | Lanzamiento público | P1 |
