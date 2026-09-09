# Directivas de Proyecto y Reglas de Desarrollo

En todas las tareas de este proyecto, debes seguir estrictamente las directrices definidas en [AI_GUIDELINES.md](file:///Users/papabumbu/Documents/Shortlinks/AI_GUIDELINES.md) y las especificaciones del sistema de diseño en [DESIGN.md](file:///Users/papabumbu/Documents/Shortlinks/frontend/DESIGN.md).

---

## 1. Reglas Fundamentales de Arquitectura y Limpieza
- **Idioma de la Aplicación (Estrictamente Inglés / English Only):** Toda la interfaz de usuario, respuestas HTML/JSON, mensajes de error, notificaciones Toast y fechas (`en-US`) deben estar en **inglés**.
- **Principios SOLID y Clean Code:** Funciones pequeñas, nombres descriptivos en inglés, cero efectos secundarios inesperados.
- **TanStack Query en Frontend:** Minimizar o evitar `useEffect` para fetching/mutaciones. Usar `@tanstack/react-query` (`useQuery`, `useMutation`).

## 2. Complejidad Ciclomática Estricta (<= 5)
- La complejidad ciclomática de cualquier función o componente **no debe superar 5**.
- Descomponer lógica en subfunciones auxiliares si hay más de 2-3 ramas lógicas. No usar ternarios anidados.

## 3. Frontend: Atomic Design y Separación Total
- **Archivos Separados:** NUNCA mezclar maquetación (`.tsx`), lógica/hooks (`.ts`), tipos (`.types.ts`), utilidades (`.utils.ts`) o estilos (`.css`) en el mismo archivo.
- **Carpetas por Componente:** Cada componente o página debe tener su propia carpeta dedicada en `atoms`, `molecules`, `organisms` o `pages`.
- **Alias `@/` Obligatorio:** Usar rutas absolutas `@/` para todas las importaciones frontend. Nunca usar rutas relativas complejas (`../`, `../../`).

## 4. Backend: Un Solo Modelo por Feature
- **Modelos en `/models/`:** Cada feature tiene exactamente un archivo de modelo en `backend/src/models/[Feature]Model.ts`. Sin subcarpetas en `/models/` y sin fragmentación por acción.

## 5. Fechas y Zonas Horarias (Estándar UTC / IANA)
- Guardar **siempre en UTC** en MongoDB.
- Resolver la zona horaria del usuario con `resolveIanaTimezone()` en backend antes de consultar/guardar.
- Formatear fechas en UI com `frontend/src/utils/date.utils.ts` pasando la zona horaria IANA del usuario. Nunca llamar a `.toLocaleDateString()` directamente.

## 6. Módulos y Helpers Agnósticos
- Diseñar utilidades y componentes de forma desacoplada y reutilizable en toda la aplicación.

## 7. Frontend: Sistema de Diseño Estricto (`DESIGN.md`) y Soporte para Modo Oscuro
- **Diseño & Estética:** Para cualquier componente o vista en el frontend, se deben aplicar las especificaciones de [DESIGN.md](file:///Users/papabumbu/Documents/Shortlinks/frontend/DESIGN.md).
- **Soporte Obligatorio de Modo Oscuro (Dark Mode):** Todo componente y hoja de estilo CSS debe incluir y soportar la variante para el tema oscuro (`:root[data-theme='dark']` / `dark:`) usando las variables de diseño M3 definidas en `frontend/src/styles/design-tokens.css`.
- **Paleta de Colores:** Creamy Yellow (`#FFF9C4`), Lime/Olive (`#DCE775`), Sky Blue (`#B3E5FC`), Surface Warm Neutral (`#FDFCF5`), On-Surface (`#1B1C18`).
- **Tipografía:** *Plus Jakarta Sans* para Display/Headlines/Titles; *Inter* para Body/Labels/Inputs.
- **Bordes & Radios:** Botones/Inputs en forma de píldora (Pill shape), Tarjetas/Contenedores de link con radio de `24px` y padding interno holgado (mín. `24px`), Modales/Drawers con `32px`.
- **Elevación:** Capas tonales de Material 3 con sombras suaves difuminadas, evitando líneas divisorias o bordes duros innecesarios.

## 8. Gestión Estándar de Parámetros de Consulta (Query Parameters)
- **Centralización en `QueryHelper.ts`:** Siempre que se agreguen o modifiquen parámetros de consulta HTTP (query params como `archived`, `search`, `page`, `sort`, `range`), estos se deben procesar obligatoriamente dentro de `backend/src/utils/QueryHelper.ts`.
- **Verificación en `feature_config.json`:** Al agregar nuevos parámetros o capacidades de consulta, se debe revisar y actualizar `backend/src/config/feature_config.json` (y la interfaz de capacidades correspondiente) para activar o desactivar explícitamente dicha funcionalidad según la feature.

## 9. Botones de Solo Icono y Tooltips Obligatorios (Icon-Only Buttons & Tooltips)
- **Uso Obligatorio de Tooltip:** Todo botón o control interactivo que solo contenga un icono (sin etiqueta de texto visible) debe incluir obligatoriamente un **tooltip descriptivo** en inglés utilizando el átomo `IconButton` (prop `title`).
- **Supresión de Tooltip Nativo del Navegador:** Los botones de icono deben suprimir el atributo nativo `title="..."` del elemento HTML `<button>` (utilizando `aria-label` para accesibilidad) para evitar que el tooltip rectangular nativo del navegador colisione con el tooltip estilizado M3.

## 10. Morphicons y Animaciones de Transición Obligatorias (Todo Debe Ser Animado)
- **Transiciones UI y Cambios de Modo Siempre Animados:** Todos los cambios de estado en la interfaz de usuario (ej. cambio entre modo lectura y modo edición, visibilidad de controles, aparición de barras de acción, apertura/cierre de elementos, badges, modales y drawers) deben realizarse obligatoriamente de forma **animada y fluida** mediante CSS transitions (`cubic-bezier(0.16, 1, 0.3, 1)`), animaciones de entrada/salida (`@keyframes`) y transformaciones suaves de opacidad, elevación y escala.
- **Uso Obligatorio de Morphicons:** Todos los iconos de la aplicación deben utilizar el sistema de Morphicons (`morphicons/react` a través del átomo `Icon` o `<MorphIcon />`) basado en nodos SVG vectoriales de trazo (stroke-based icons / Lucide).
- **Animaciones de Transición de Iconos (Icon Morphing):** Siempre que un icono cambie de estado o represente una interacción dinámica (ej. copiar a portapapeles `copy` ➔ `check`, visibilidad de contraseña `visibility` ➔ `visibility_off`, alternador de tema `light_mode` ➔ `dark_mode`, alternador de edición `edit` ➔ `close`, estado de archivo `folder` ➔ `archive`, expandir/colapsar, confirmación de acciones, carga/sincronización), se debe animar la transición con física de resortes (*spring physics*) mediante `MorphIcon`.

