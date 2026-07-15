# AGENTS.md

# AI Development Guidelines

Este documento define las reglas que todo agente de IA debe seguir al contribuir a este proyecto.

Estas reglas tienen prioridad sobre cualquier preferencia implícita del modelo.

---

# Objetivo del proyecto

El objetivo es construir una aplicación escalable, mantenible y fácilmente extensible para la gestión del hogar.

Todas las decisiones técnicas deben priorizar:

- Simplicidad
- Legibilidad
- Bajo acoplamiento
- Alta cohesión
- Escalabilidad
- Facilidad de pruebas

Nunca implementar soluciones rápidas que comprometan la arquitectura.

---

# Principios generales

Siempre seguir:

- Clean Architecture
- Clean Code
- SOLID
- DRY
- KISS
- YAGNI

Cuando exista conflicto entre rapidez y mantenibilidad, elegir mantenibilidad.

---

# Arquitectura

Toda lógica del sistema debe respetar la siguiente separación de responsabilidades.

```
Domain
Application
Infrastructure
Presentation
Shared
```

## Domain

El dominio contiene únicamente reglas de negocio.

No debe depender de:

- React
- Next.js
- Base de datos
- HTTP
- Frameworks
- Librerías externas

Debe ser completamente independiente.

---

## Application

Contiene los casos de uso.

Puede depender del dominio.

Nunca de infraestructura.

Los casos de uso coordinan:

- entidades
- repositorios
- servicios

No contienen consultas SQL.

No contienen JSX.

No contienen llamadas HTTP.

---

## Infrastructure

Implementa detalles técnicos.

Ejemplos:

- PostgreSQL
- Prisma
- API REST
- Local Storage
- Fetch
- Axios

Toda implementación debe depender de interfaces definidas por el dominio o la aplicación.

---

## Presentation

Responsable únicamente de la interfaz.

No contiene reglas de negocio.

Toda lógica compleja debe vivir fuera de React.

Los componentes deben ser lo más simples posible.

---

# SOLID

## Single Responsibility

Cada clase, función o componente debe tener una única responsabilidad.

Si una función necesita explicarse, probablemente hace demasiado.

---

## Open / Closed

Extender mediante composición.

Evitar modificar código existente.

---

## Liskov

Las implementaciones deben respetar completamente sus contratos.

---

## Interface Segregation

Crear interfaces pequeñas.

Evitar interfaces gigantes.

---

## Dependency Inversion

Siempre depender de abstracciones.

Nunca de implementaciones concretas.

---

# Clean Code

## Nombres

Los nombres deben revelar intención.

Evitar:

data

temp

obj

manager

helper

utils

Preferir nombres específicos.

Ejemplo:

InventoryRepository

CalculateConsumptionAverageUseCase

RegisterPurchaseUseCase

---

## Funciones

Las funciones deben:

- hacer una sola cosa
- ser pequeñas
- recibir pocos parámetros
- evitar efectos secundarios

---

## Comentarios

No explicar qué hace el código.

El código debe ser autoexplicativo.

Los comentarios únicamente justifican decisiones de negocio o arquitectura.

---

## Duplicación

Nunca duplicar lógica.

Extraer comportamiento común.

---

## Complejidad

Preferir código explícito.

Evitar anidamientos profundos.

Retornar temprano cuando sea posible.

---

# TypeScript

Siempre utilizar:

strict

readonly cuando aplique

tipos explícitos cuando mejoren la comprensión

Evitar completamente:

any

as any

@ts-ignore

---

# Organización

Cada módulo debe ser autocontenido.

Ejemplo:

```
inventory/

    domain/

    application/

    infrastructure/

    presentation/
```

Evitar módulos gigantes.

---

# Componentes React

Los componentes deben:

- ser pequeños
- reutilizables
- fáciles de leer

La lógica compleja pertenece a:

- hooks
- casos de uso
- servicios

Nunca dentro del JSX.

---

# Estado

Preferir estado local.

No introducir estado global sin una justificación clara.

---

# Base de datos

Diseñar el modelo para facilitar la evolución.

Preferir:

UUID

restricciones

claves foráneas

índices adecuados

Evitar consultas innecesarias.

---

# Errores

Nunca ignorar errores.

Utilizar errores específicos.

Los mensajes deben ayudar al desarrollador.

---

# Testing

Toda lógica de negocio debe poder probarse de forma aislada.

Diseñar pensando en pruebas.

Evitar acoplamiento con infraestructura.

---

# Dependencias

Antes de instalar una nueva librería preguntarse:

¿Puede resolverse con las herramientas existentes?

Agregar dependencias únicamente cuando aporten un beneficio claro.

---

# Antes de escribir código

Siempre verificar:

- ¿Existe ya una implementación?
- ¿Respeta Clean Architecture?
- ¿Respeta SOLID?
- ¿La solución es la más simple posible?
- ¿Se puede extender fácilmente?
- ¿Se puede probar fácilmente?

---

# Qué evitar

Nunca:

- duplicar código
- romper la arquitectura
- mezclar UI con negocio
- crear componentes gigantes
- usar any
- crear archivos innecesarios
- introducir dependencias sin justificación
- optimizar prematuramente

---

# Calidad esperada

Todo código generado debe ser consistente con el resto del proyecto.

La prioridad es producir código que otro desarrollador pueda entender dentro de seis meses sin documentación adicional.