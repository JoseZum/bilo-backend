<div align="center">

# Estrategia de negocio

**El criterio de mercado que decide qué construir, para quién y en qué orden.**

[`bilo`](../../README.md) · [`Diseño`](../design/README.md) · [`Requisitos`](../requirements/README.md)

</div>

---

Este directorio reúne el criterio de negocio que guía el producto. Es la contraparte de
[`docs/design/`](../design/README.md): el diseño técnico explica **cómo** construir bilo; estos
documentos establecen **para quién**, **por qué puede funcionar** y **en qué orden debe crecer**.

Las afirmaciones se clasifican de forma deliberada: están respaldadas por evidencia, se presentan
como hipótesis pendientes de validar o se registran como decisiones con sus respectivos costos y
condiciones de revisión.

## Mapa de decisiones

| # | Documento | Decisión que permite tomar |
|---:|---|---|
| 01 | [Mercado y segmento inicial](./01-market-and-beachhead.md) | Por qué comenzar con estudiantes universitarios en Costa Rica, cómo está estructurado el mercado y dónde existe una ventaja mediante SINPE. |
| 02 | [Monetización](./02-monetization.md) | Qué fuentes de ingreso son viables, cómo se comporta la economía unitaria por fase y qué debe permanecer gratuito. |
| 03 | [Salida al mercado](./03-go-to-market.md) | Cómo abrir el mercado campus por campus, cuáles canales utilizar y qué métricas habilitan la siguiente expansión. |
| 04 | [Lecciones de productos exitosos y fallidos](./04-lessons-winners-and-dead.md) | Qué enseñan Airbnb, Uber, Uniplaces, RadPad, Homejoy, HubHaus y Campus, y qué decisión concreta toma bilo de cada caso. |
| 05 | [Marco legal y regulatorio de Costa Rica](./05-legal-and-regulatory.md) | Cómo afectan al producto la ausencia de Stripe para entidades costarricenses, la custodia regulada de fondos, la Ley 7527 y la facturación electrónica. |
| 06 | [Producto y MVP piloto](./06-product-and-mvp.md) | Quiénes son los usuarios iniciales, cuáles son los dos recorridos esenciales y qué queda fuera del piloto PWA-first. |
| 07 | [Confianza, seguridad y soporte](./07-trust-safety-and-support.md) | Cómo verificar identidades, prevenir fraude, proteger visitas, resolver disputas y operar soporte inicialmente por WhatsApp. |
| 08 | [Finanzas, runway y equipo](./08-finance-runway-and-team.md) | Cuánto puede consumir cada fase, qué hitos justifican inversión y en qué orden incorporar talento. |
| 09 | [Métricas y analítica](./09-metrics-and-analytics.md) | Qué métrica norte gobierna el producto, cómo se descompone el árbol de KPI y qué eventos deben instrumentarse. |
| 10 | [Registro de riesgos](./10-risk-register.md) | Qué riesgos conocemos, quién responde por ellos y qué señal activa cada mitigación. |
| 11 | [Plan de arranque](./11-bootstrap-plan.md) | Cómo avanzar sin capital: primero marketplace, tiendas, identidad estudiantil e infraestructura gratuita; después entidad legal, Hacienda e ingresos. |
| 12 | [Proveedores de pago en Costa Rica](./12-psp-landscape.md) | Qué sabemos de ONVO, Tilopay, GreenPay y LAFISE, qué falta confirmar sobre liquidación dividida y cuál es el plan alternativo. |

## La tesis en breve

bilo comienza como la plataforma de vivienda para estudiantes universitarios en Costa Rica. Es un
segmento denso, desatendido y condicionado por la confianza, por lo que permite resolver la
liquidez campus por campus antes de expandirse. El objetivo inicial no es cubrir todo el mercado,
sino construir tres activos difíciles de replicar: oferta verificada, un historial de confianza y
una relación persistente alrededor del alquiler.

La monetización llega después de demostrar liquidez. El matching permanece gratuito; los ingresos
se desarrollan alrededor del flujo de pagos —con SINPE como punto de partida de bajo costo— y de
la conversión de reservas. bilo no mantiene inventario propio, no subsidia pagos y debe ofrecer
razones concretas para que la relación entre inquilino y propietario permanezca dentro de la
plataforma. La expansión responde a umbrales medibles: cada campus funciona como una unidad de
mercado y el siguiente se abre únicamente cuando el anterior demuestra suficiente liquidez.

## Una prioridad que condiciona el roadmap

Las funciones de inteligencia artificial se posponen hasta después de alcanzar escala nacional.
El módulo y su interfaz permanecen definidos en el diseño técnico
([documento 07, §14](../design/07-modules.md)), pero `AI_PROVIDER` continúa enlazado a una
implementación simulada y la IA no forma parte de los epics de lanzamiento.

Esta no es una limitación accidental: durante la entrada al mercado, el trabajo de ingeniería se
concentra en liquidez, confianza y pagos, los factores que determinan la viabilidad de una
plataforma de alquiler. El fundamento económico está en
[Monetización, §6](./02-monetization.md) y sus efectos sobre la secuencia de implementación se
registran en el [roadmap técnico](../design/13-roadmap.md).
