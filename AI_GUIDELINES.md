# Instrucciones de Desarrollo y Calidad de Código para IAs (Gemini, Claude, GPT, etc.)

Este documento contiene las directrices obligatorias que cualquier asistente de Inteligencia Artificial debe seguir al generar, modificar o sugerir código para este proyecto.

---

> **Nota de Arquitectura:** Esta aplicación es una **SPA (Single Page Application)** desarrollada con React en el frontend y una API en el backend. Toda la navegación, estados y flujos deben gestionarse sin recargar la página.

> **Idioma de la Aplicación (Estrictamente Inglés / English Only):** Toda la aplicación (interfaz de usuario, etiquetas, mensajes de error, notificaciones Toast, respuestas HTML del servidor y formateo de fechas mediante `en-US`) debe estar **estrictamente en idioma Inglés**. Está totalmente prohibido incluir textos o mensajes en español en el código o en las respuestas de la aplicación.

---

## 1. Reglas Fundamentales de Arquitectura y Limpieza

### Principios SOLID
- **S (Single Responsibility):** Cada clase, función o archivo debe tener una única razón para cambiar.
- **O (Open/Closed):** El código debe estar abierto para su extensión pero cerrado para su modificación.
- **L (Liskov Substitution):** Las subclases o implementaciones deben ser sustituibles por sus tipos base sin romper el programa.
- **I (Interface Segregation):** Diseña interfaces específicas en lugar de interfaces genéricas "gordas".
- **D (Dependency Inversion):** Depende de abstracciones, no de clases concretas (inyección de dependencias).

### Clean Code (Código Limpio)
- Nombres de variables, funciones, clases y mensajes altamente descriptivos y autoexplicativos estrictamente en inglés.
- Funciones pequeñas que hagan una sola cosa bien.
- Evitar comentarios redundantes; el código debe ser auto-documentado.
- Evitar efectos secundarios (side-effects) inesperados en las funciones.

### Uso Obligatorio de TanStack Query (Minimizar useEffect)
- **Cero o Mínimo Uso de `useEffect`:** El uso de `useEffect` para la obtención de datos (fetching), sincronización de estado derivado o mutaciones está estrictamente desaconsejado.
- **Gestión Asíncrona con TanStack Query (`@tanstack/react-query`):** Todo el consumo de APIs, caché, revalidación y mutaciones (crear, actualizar, eliminar) debe gestionarse mediante los hooks de TanStack Query (`useQuery`, `useMutation`, `useQueryClient`).
- Los efectos solo deben reservarse para interacciones directas imperativas con las APIs del navegador (ej. manipular el scroll del `body` o escuchar eventos globales del DOM).

---

## 2. Complejidad Ciclomática Baja (Estricto)

La complejidad ciclomática de cualquier función o componente **no debe superar el valor de 5**. Esto se encuentra configurado y vigilado estrictamente por ESLint en las reglas de calidad del proyecto.

### ¿Cómo mantener la complejidad ciclomática por debajo de 5?
1. **Evita condicionales anidadas:** No uses múltiples `if/else` o estructuras `switch` complejas dentro de la misma función.
2. **Abstrae a subfunciones:** Si tienes más de dos o tres ramas lógicas, extrae cada rama a una función auxiliar o a un subcomponente especializado.
3. **No uses ternarios anidados:** Los ternarios deben ser simples.
4. **Simplifica condiciones booleanas:** Utiliza variables intermedias con nombres descriptivos para evaluar expresiones lógicas largas.

---

## 3. Frontend: Atomic Design y Separación Total de Responsabilidades

Para el desarrollo del Frontend (React + TypeScript), es obligatorio aplicar **Atomic Design** y la **separación total de responsabilidades y tipos de archivo**. Debemos **separar todo** en su archivo correspondiente sin mezclar conceptos en un mismo archivo.

### Separación Estricta de Archivos y Responsabilidades
**NUNCA coloques en un mismo archivo la maquetación, la lógica, las interfaces, los helpers o los estilos.**

- **Maquetación / Estructura (.tsx):** El archivo de React/TSX debe contener únicamente la maquetación y la estructura visual. El componente solo recibe las variables, estados y funciones necesarias y renderiza la vista. No debe incluir lógica compleja, declaraciones de interfaces/tipos, ni funciones helper.
- **Lógica TypeScript (.ts):** Toda la lógica de negocio, hooks personalizados (`useMyFeature.ts`) o servicios debe ir en sus propios archivos `.ts` independientes.
- **Interfaces y Tipos (.types.ts / .interfaces.ts):** Todas las interfaces, tipos y enums deben residir en su propio archivo de interfaces/tipos (por ejemplo, `MyComponent.types.ts` o en archivos de tipos dedicados).
- **Helpers / Utilidades (.utils.ts / .helpers.ts):** Si se requieren funciones auxiliares o helpers (ya sean globales o locales del componente/módulo), estos deben ir estrictamente en sus propios archivos separados (ej. `myHelper.ts` o `utils/`).
- **Estilos (.css / .module.css):** Todo el diseño estético y CSS debe residir en su propio archivo de estilos separado, importado por el componente.

### Atomic Design y Organización de Carpetas
Organiza los componentes del frontend según la jerarquía de diseño atómico dentro de `frontend/src/components/` y las páginas dentro de `frontend/src/pages/`:
1. **Atoms (Átomos):** Bloques de construcción básicos que no se pueden dividir más (ej. un botón, un input, un punto de estado, un icono).
2. **Molecules (Moléculas):** Combinaciones de átomos que forman una unidad funcional (ej. un campo de búsqueda compuesto por un input y un botón, o un badge de estado compuesto por un punto de color y una etiqueta de texto).
3. **Organisms (Organismos):** Componentes más complejos compuestos por moléculas y/o átomos que forman una sección distinta de la interfaz (ej. un header, una tarjeta premium de visualización de datos).
4. **Templates (Plantillas):** Estructuras a nivel de página que organizan los organismos en un diseño general (layout).
5. **Pages (Páginas):** Instancias de plantillas que muestran datos reales y manejan el flujo general de la aplicación.

**Organización Estricta de Carpetas por Componente / Página:**
**NUNCA dejes archivos sueltos directamente dentro de `atoms`, `molecules`, `organisms` o `pages`.** Cada componente o página debe tener su propia carpeta dedicada nombrada exactamente igual que el componente (ej. `src/components/atoms/Button/`, `src/components/organisms/LoginForm/`, `src/pages/LoginPage/`), la cual contendrá todos los archivos pertenecientes a dicho componente (`.tsx`, `.ts`, `.types.ts`, `.css`).

### Estándar Obligatorio de Importaciones (Alias `@/`)
Todas las importaciones en el Frontend deben usar la ruta absoluta configurada con el alias `@/` apuntando a `src/` (por ejemplo: `import { Icon } from '@/components/atoms/Icon/Icon'`, `import { useLogin } from '@/hooks/useLogin'`).
**NUNCA utilices rutas relativas complejas (`../`, `../../`, `../../../`) para importar entre diferentes módulos.**

---

## 4. Estilos y Estética Premium
Cualquier desarrollo visual debe verse premium y moderno de forma nativa:
- Usa gradientes suaves y armónicos.
- Utiliza tipografías elegantes (como Google Fonts *Plus Jakarta Sans* o *Inter*).
- Implementa sombras suaves, desenfoques de fondo (glassmorphic cards) y micro-animaciones dinámicas (hover transitions, keyframe animations de carga).
- Evita colores primarios chillones no curados (como `#ff0000` o `#0000ff`). Opta por paletas HSL adaptadas.

---

## 5. Backend: Un Solo Modelo por Feature

Para el desarrollo del Backend (Node.js + Express + TypeScript), es obligatorio mantener un único archivo de modelo general por feature/módulo:

- **Ubicación Plana en `/models/`:** Cada feature debe tener exactamente un archivo de modelo ubicado directamente dentro de `backend/src/models/[Feature]Model.ts` (por ejemplo: `backend/src/models/ShortlinkModel.ts`, `backend/src/models/ProjectModel.ts`, `backend/src/models/AuthModel.ts`).
- **Sin Subcarpetas en `/models/`:** Queda prohibida la creación de subcarpetas redundantes dentro de `models/` (como `models/shortlinks/`, `models/projects/`, `models/auth/`).
- **Sin Fragmentación por Acción:** Está prohibido dividir un modelo en múltiples archivos por cada acción o caso de uso (ejemplo: NO crear `CreateShortlinkModel.ts`, `UpdateShortlinkModel.ts`, `LoginModel.ts` en archivos separados). Toda la lógica de extracción, validación Zod, construcción y proyección de respuestas para una misma entidad o módulo debe residir en su modelo general correspondiente.

---

## 6. Date/Time and Timezone Standardization (Mandatory)

### Core Contract
- **All dates are stored in UTC** in MongoDB. No local-time timestamps are ever written to the database.
- **All dates rendered in the UI** must be converted to the user's configured IANA timezone (stored in `user.timezone`) before display.

### Backend Rules
1. **`resolveIanaTimezone(tz)`** (`backend/src/utils/timezone.utils.ts`) must be called on every user-supplied timezone string **before** it is persisted or used in Mongo aggregations. This function:
   - Converts the sentinel string `'auto'` to a valid IANA default.
   - Rejects invalid timezone strings, falling back to `'UTC'`.
2. The string `'auto'` must **never** be stored in the `timezone` field of any MongoDB document.
3. Mongo `$dateToString` aggregations must always pass the resolved IANA timezone so date-bucketing matches the user's local calendar day, not UTC day.

### Frontend Rules
1. **`frontend/src/utils/date.utils.ts`** is the single source of truth for all date/time formatting. Use the exported helpers:
   - `formatLocalizedDate(date, tz)` — full date string (e.g. "Jul 29, 2026").
   - `formatLocalizedShortDate(date, tz)` — short label (e.g. "Jul 29").
   - `formatLocalizedHour(date, tz)` — hourly label (e.g. "9 PM").
   - `formatLocalizedTooltip(date, tz)` — full tooltip (e.g. "Jul 29 at 9:27 PM").
2. **Never call** `new Date(...).toLocaleDateString()` or `.toLocaleTimeString()` directly in components. Always use the helpers above with the user's timezone.
3. The "Auto-detect" timezone button in Settings must resolve to the browser's real IANA string (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and **save that IANA string** — never save the literal string `'auto'`.
4. When loading the user profile, if `user.timezone` is empty, `'auto'`, or invalid, default to the browser-detected timezone as the display timezone (client-side only; do not persist without user action).

---

## 7. Módulos, Helpers y Features Generalizados y Agnósticos
- **Análisis Previo:** Antes de crear cualquier nueva función, helper, componente o módulo, analiza detalladamente el código fuente existente para verificar si ya existe una abstracción similar o si se puede extender una solución existente.
- **Diseño Agnóstico y Reutilizable:** Diseña módulos, funciones helper, utilidades y componentes de forma generalizada, desacoplada y agnóstica a vistas específicas. Evita acoplar lógica de negocio o hardcodear comportamientos para un solo caso de uso. Prioriza siempre la reusabilidad en toda la aplicación.

---

## 8. Morphicons como Sistema Primario de Iconos y Animaciones de Transición
- **Uso Obligatorio de Morphicons:** Todos los iconos del frontend deben utilizar el sistema de Morphicons (`morphicons/react` a través del átomo `Icon` o `<MorphIcon />`) basado en nodos SVG vectoriales de trazo (stroke-based icons / Lucide).
- **Animaciones de Transición (Icon Morphing):** Siempre que un icono cambie de estado o represente una interacción dinámica (ej. copiar a portapapeles `copy` ➔ `check`, visibilidad de contraseña `visibility` ➔ `visibility_off`, alternador de tema `light_mode` ➔ `dark_mode`, estado de archivo `folder` ➔ `archive`, expandir/colapsar, confirmación de acciones, carga/sincronización), se debe animar la transición con física de resortes (*spring physics*) mediante `MorphIcon`.


