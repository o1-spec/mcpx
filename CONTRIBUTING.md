# Contributing to MCPx

Thank you for your interest in contributing to MCPx! This document outlines our engineering standards, local development workflow, and pull request process.

---

## 1. Prerequisites

- **Node.js**: v20.x or later (Active LTS)
- **pnpm**: v10.x (`corepack enable` or `npm i -g pnpm`)
- **Docker**: Docker Desktop / Docker daemon for PostgreSQL persistence
- **Google Chrome**: With experimental WebMCP / Model Context flags enabled for live browser testing

---

## 2. Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/mcpx.git
   cd mcpx
   ```

2. **Bootstrap the environment**:
   ```bash
   pnpm run bootstrap
   ```
   *This initializes the `.env` template, starts PostgreSQL on port `5435`, and installs monorepo dependencies.*

3. **Start local development**:
   ```bash
   pnpm dev
   ```
   *Launches `mcpx-web` (port 3000) and all 5 reference & external services.*

---

## 3. Branching & SDLC

We follow a lightweight, standard branch workflow:

- `main`: Always deployable, stable reference line.
- `feature/<name>`: New capabilities or protocol additions.
- `fix/<name>`: Bug fixes and edge-case handling.
- `docs/<name>`: Documentation, architecture specs, guides.

### Commit Guidelines
Use concise, conventional commits:
- `feat: add authoritative WebMCP reconciliation`
- `refactor: extract transaction state presentation`
- `test: cover acknowledgement-loss recovery`
- `docs: document reliability contract`

---

## 4. Code Standards & Architecture Principles

1. **First Principle: Preserve Reliability Semantics**:
   - Never perform uncoordinated blind retries on unknown write timeouts.
   - All mutations must correlate on a deterministic `operationKey`.
   - Inspection must verify actual application state, not cached coordinator memory.
   - Compensation must be safe to retry and run in reverse topological order.

2. **TypeScript Quality**:
   - Write strict, well-typed TypeScript (`noImplicitAny`).
   - Avoid unsafe casting (`as any`) unless mocking runtime browser APIs in unit harnesses.

3. **Tailwind & Design System**:
   - Use canonical Tailwind classes and design tokens (`bg-panel`, `bg-background`, `text-accent-lime`, `border-white/8`, etc.).

---

## 5. Quality Verification Before PR

Before opening a PR, ensure all checks pass:

```bash
# 1. Run full 12-scenario behavioral test suite
pnpm test

# 2. Run typecheck across monorepo
pnpm typecheck

# 3. Run ESLint
pnpm lint

# 4. Build all workspaces
pnpm -r build
```

---

## 6. License

By contributing to MCPx, you agree that your contributions will be licensed under the [Apache-2.0 License](./LICENSE).
