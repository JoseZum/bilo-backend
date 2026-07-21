<div align="center">

# Requisitos y entrega

**Una línea trazable desde la decisión de producto hasta la evidencia de implementación.**

[`bilo`](../../README.md) · [`Negocio`](../business/README.md) · [`Diseño`](../design/README.md)

</div>

---

Este directorio conecta la intención del producto con el trabajo verificable de ingeniería. Aquí
se define el alcance, se asigna una identidad estable a cada requisito y se establece cómo seguirlo
desde la especificación hasta su prueba.

## Tres piezas, una cadena de trazabilidad

| Documento | Función dentro del proceso |
|---|---|
| [ERS — Especificación de requisitos de software](./ers.md) | Inventario normativo de **308 requisitos funcionales y 15 no funcionales**. Cada requisito usa un identificador `FR-<MÓDULO>-<NNN>`, prioridad MoSCoW y una referencia a su fuente de diseño, negocio o producto. |
| [Proceso de entrega](./sdlc-plan.md) | Convierte un requisito en trabajo ejecutable: configuración del tracker —GitHub Projects o Jira—, epics por módulo, reglas de trazabilidad, criterios de entrada y salida, ramas, pull requests, pruebas y cadencia del equipo. |
| `traceability.md` *(se crea al iniciar cada epic)* | Matriz operativa que enlaza requisito, historia, pull request, prueba y estado. Es el registro real del avance, no una proyección separada del código. |

## Cómo se relaciona con el resto del repositorio

La documentación se divide por responsabilidad, no por audiencia:

- [`docs/business/`](../business/README.md) define **por qué** construir una capacidad y para
  quién. Sus hipótesis, restricciones y prioridades originan el alcance.
- [`docs/design/`](../design/README.md) define **cómo** debe resolverse. La ERS enlaza secciones
  concretas con referencias como `D07§9`.
- El [roadmap de implementación](../design/13-roadmap.md) determina **cuándo** se aborda cada
  epic y qué dependencias deben existir primero.
- La ERS actúa como contrato entre estas capas: traduce la estrategia y el diseño en resultados
  comprobables. Si cambia el alcance, el cambio comienza en la
  [sección 6 de la ERS](./ers.md), no en una implementación aislada.

## Recorrido recomendado

1. Consulte la ERS para confirmar el comportamiento esperado y su prioridad.
2. Siga la referencia de origen para comprender la decisión de negocio o diseño que lo sostiene.
3. Use el proceso de entrega para descomponer el requisito sin perder su identificador.
4. Registre historia, pull request y prueba en `traceability.md` desde el inicio del epic.

El objetivo no es producir documentación alrededor del desarrollo. Es mantener una línea auditable
entre una necesidad de producto, la decisión técnica que la resuelve y la evidencia de que quedó
implementada correctamente.
