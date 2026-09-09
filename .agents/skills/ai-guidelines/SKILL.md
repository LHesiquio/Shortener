---
name: ai-guidelines
description: Directivas de calidad, arquitectura SOLID, Atomic Design, complejidad ciclomática, sistema de diseño UI (DESIGN.md), soporte Dark Mode, reglas frontend/backend y manejo de fechas de Shortlinks.
---

# Guidelines & Coding Standards

Al trabajar en este repositorio, se deben cumplir las normas especificadas en [AI_GUIDELINES.md](file:///Users/papabumbu/Documents/Shortlinks/AI_GUIDELINES.md) y el sistema de diseño en [DESIGN.md](file:///Users/papabumbu/Documents/Shortlinks/frontend/DESIGN.md).

- **English Only:** All user interfaces, toasts, error messages, and server responses in English.
- **Max Cyclomatic Complexity:** <= 5 per function/component.
- **Frontend Architecture:** Strict file separation (`.tsx`, `.ts`, `.types.ts`, `.utils.ts`, `.css`), component folders, `@/` import alias.
- **Frontend Design System & Dark Mode:** Follow [DESIGN.md](file:///Users/papabumbu/Documents/Shortlinks/frontend/DESIGN.md) colors (Creamy Yellow, Lime, Sky Blue), typography (*Plus Jakarta Sans*, *Inter*), 24px/32px rounded corners, pill-shaped buttons/inputs, M3 tonal layers, and ALWAYS support Dark Mode via `:root[data-theme='dark']` tokens.
- **Morphicons as Primary Icon System:** Use `MorphIcon` / `Icon` for stroke-based vector icons and spring-animated morphing on state transitions (copy/check, eye/eye-off, sun/moon, folder/archive, toggles).
- **Backend Architecture:** Flat single-model files at `backend/src/models/[Feature]Model.ts`.
- **Date Standardization:** Database stored strictly in UTC, displayed localized via IANA timezones using `date.utils.ts`.

