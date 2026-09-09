# Shortlinks Project — Memory

## Architecture (Stack)
- **Backend:** Node.js + Express + TypeScript + MongoDB (driver `mongodb` v6.8).
  - Entry: `backend/src/server.ts`. Build: `tsc` → `dist/`. Dev: `ts-node-dev`.
  - Env via `dotenv`. Mongo URL: `MONGO_URL`, port: `PORT`. DB: `helloworld_db` (will rename).
- **Frontend:** React + TypeScript + Vite. Atomic Design under `frontend/src/components/`.
  - Files: `.ts` (logic/hooks) / `.tsx` (layout only) / `.css` (styles). NEVER mix them.

## AI Guidelines (MUST follow — from AI_GUIDELINES.md)
- **SOLID** strictly. Single responsibility, OCP, LSP, ISP, DIP.
- **Clean Code:** descriptive English names, small functions, no redundant comments, no side effects.
- **Cyclomatic complexity ≤ 5** per function (ESLint rule `"complexity": ["error", 5]`).
  - No nested if/else, no nested ternaries. Extract branches to sub-functions.
  - Max 40 lines/function. Max depth 3.
- **Frontend** = Atomic Design (atoms / molecules / organisms / templates / pages).
- **Frontend** = separation of concerns (TSX is layout only, CSS separate, logic in hooks/services).
- **Premium aesthetic:** soft gradients, Plus Jakarta Sans / Inter, soft shadows, glassmorphism, micro-animations. No raw primary colors.

## Auth Plan (in progress)
Building login + register backend with JWT (access + refresh). `GeneralController` pattern:
- CRUD (create/update/show/delete) lives in `GeneralController` as a base class.
- Each entity controller (Login, Register, etc.) extends it and provides a Model instance.
- Each Model exposes `validate(data)`, `build(data)`, `toInsert()`, `extractFromRequest(req)` — single source of truth.
- GeneralController flows: `extract → validate → build → insert/update/find → return`.