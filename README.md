# Shortlinks

A modern, high-performance URL shortener and click-analytics platform built with **TypeScript**, **React 19**, **Node.js / Express**, and **MongoDB**. Designed following Material 3 guidelines with smooth morphing micro-animations, comprehensive project management, deep click analytics, and flexible data exports.

---

## ✨ Features

- **⚡ Fast URL Shortening:** Generate instant shortlinks or reserve custom, human-readable slugs with live availability verification.
- **📁 Projects & Categorization:** Organize links under projects with aggregated performance metrics and archive support.
- **📊 Real-Time Analytics:** Track click events over time, inspect traffic distribution by country, referrer, device, operating system, and browser with interactive charts powered by Recharts.
- **📋 Click Logs & Advanced Export:** Detailed click audit trails with an interactive multi-step export wizard supporting **Excel (.xlsx)**, **CSV**, **JSON**, and **PDF**.
- **🔐 Secure Authentication:** Stateless JWT architecture with short-lived access tokens, sliding-window refresh tokens stored in HttpOnly cookies, Bcrypt password hashing, and configurable rate limiting.
- **🎨 Material Design 3 (M3) UI:** Atomic design structure, accessible pill-shaped controls, responsive mobile navigation, theme switcher with Dark Mode support, and physics-based SVG morphing icons (**Morphicons**).
- **🌍 IANA Timezone Aware:** All timestamps are strictly stored in UTC in MongoDB and rendered converted to the user's localized IANA timezone.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Monorepo** | [pnpm Workspaces](https://pnpm.io/) |
| **Frontend** | React 19, TypeScript, [Vite](https://vite.dev/), [TanStack Query v5](https://tanstack.com/query), [React Router v7](https://reactrouter.com/), [Recharts](https://recharts.org/), [Morphicons](https://morphicons.com/), [Lucide Icons](https://lucide.dev/) |
| **Backend** | Node.js, Express, TypeScript, MongoDB Native Driver, [Zod](https://zod.dev/), [ExcelJS](https://github.com/exceljs/exceljs), [PDFKit](https://pdfkit.org/), [Helmet](https://helmetjs.github.io/), Bcrypt |
| **Database** | MongoDB (v7.0+ / v8.0+) |

---

## 🚀 Getting Started on Linux & macOS

### 1. Prerequisites

Ensure you have installed:
- **Node.js**: v20+ or v22+ LTS ([NodeSource](https://github.com/nodesource/distributions) or `nvm` / `fnm` / `brew install node`)
- **pnpm**: v9+ (`npm install -g pnpm` or `corepack enable`)
- **MongoDB**: Community Edition v7+ or Docker

---

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/LHesiquio/Shortener.git
cd Shortener

# Install all monorepo dependencies (root, backend, frontend)
pnpm install
```

---

### 3. Configure Environment Variables

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Verify or adjust the default settings inside `backend/.env`:
```env
PORT=5001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
MONGO_URL=mongodb://127.0.0.1:27017
MONGO_DB=shortlinks
JWT_ACCESS_SECRET=change_me_to_a_long_random_string_min_32_chars
JWT_REFRESH_SECRET=change_me_to_another_long_random_string_min_32
EMAIL_VERIFICATION_ENABLED=false
```

---

### 4. Start MongoDB

Choose one of the following options based on your environment:

#### Option A: Using Docker (Recommended for macOS & Linux)
```bash
docker run -d --name shortlinks-mongo -p 27017:27017 mongo:latest
```

#### Option B: macOS (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Option C: Linux (systemd)
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Option D: Manual run with Low-RAM Mode (~256MB cache)
```bash
mkdir -p .mongo-data
mongod --dbpath .mongo-data --port 27017 --bind_ip 127.0.0.1 --wiredTigerCacheSizeGB 0.25
```

---

### 5. Start Development Servers

Open two terminal tabs:

**Tab 1 - Backend API (Port 5001):**
```bash
pnpm dev:backend
```
*Healthcheck available at: `http://localhost:5001/api/health`*

**Tab 2 - Frontend UI (Port 5173):**
```bash
pnpm dev:frontend
```
*Access the web application at: `http://localhost:5173`*

---

## 🪟 Getting Started on Windows

On Windows, convenient launcher batch scripts are provided in the repository root:

- **`start-all.bat`**: Launches MongoDB (in Low-RAM mode), Backend, and Frontend in separate windows with a single double-click.
- **`start-mongo.bat`**: Starts MongoDB restricted to 256MB WiredTiger cache to preserve system memory on 8GB machines.
- **`start-backend.bat`**: Starts the backend on `http://localhost:5001`.
- **`start-frontend.bat`**: Starts the frontend on `http://localhost:5173`.
- **`stop-all.bat`**: Instantly terminates all background Node and MongoDB processes, reclaiming 100% of the RAM.

Or run directly through PowerShell/CMD:
```powershell
pnpm mongo
pnpm dev:backend
pnpm dev:frontend
```

---

## 📁 Repository Structure

```text
├── backend/                  # Express + TypeScript API Server
│   ├── src/
│   │   ├── config/           # Database, environment, and feature flags
│   │   ├── controllers/      # Route controllers (Auth, Projects, Shortlinks, Analytics, Export)
│   │   ├── middlewares/      # JWT auth, rate limiting, error handling
│   │   ├── models/           # Feature data models (Single model per feature rule)
│   │   ├── routes/           # Express router definitions
│   │   ├── services/         # Business logic and database operations
│   │   ├── utils/            # Query parsing, crypto, date/timezone helpers
│   │   └── server.ts         # Application entrypoint
│   └── package.json
│
├── frontend/                 # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/       # Atomic Design architecture
│   │   │   ├── atoms/        # Buttons, Badges, Inputs, MorphIcons, Tooltips
│   │   │   ├── molecules/    # Search bars, Form fields, KPI Cards, Stat pills
│   │   │   └── organisms/    # Drawers, Modals, Tables, Navigation bars, Headers
│   │   ├── context/          # Auth, Theme (Dark/Light), Toast, Network state
│   │   ├── hooks/            # Data queries and mutations (TanStack Query)
│   │   ├── pages/            # Dashboard, Projects, Analytics, Links, Auth pages
│   │   ├── services/         # API client abstractions
│   │   ├── styles/           # Design tokens, color palettes, and global CSS
│   │   └── main.tsx          # React application root
│   └── package.json
│
├── package.json              # Root workspace orchestration
├── pnpm-workspace.yaml       # Workspace packages configuration
└── README.md
```

---

## 📜 Architectural Standards

This project strictly enforces:
- **SOLID Principles & Clean Code**: Single-purpose functions, descriptive naming, minimal side effects.
- **Strict Cyclomatic Complexity (≤ 5)**: Code paths are kept simple and well-decomposed into focused helpers.
- **Atomic Design Separation**: Every component maintains dedicated `.tsx` (markup), `.ts` (hooks/logic), `.types.ts` (interfaces), and `.css` (styles) files.
- **UTC Timestamps**: Database dates are always UTC; user presentation uses IANA timezone translation.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
