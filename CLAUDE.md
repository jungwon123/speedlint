# speedlint

> Web performance optimization library + CLI tool.
> ESLint-like static analysis for bundle size & Core Web Vitals with auto-fix.

## Entry Point

- **Architecture & Agent Schema:** `@AGENTS.md`
- **Milestones & Execution Plan:** `@docs/PLANS.md`
- **Coding Standards:** `@docs/CODING_STANDARDS.md`

## Project Overview

- **Monorepo:** pnpm workspace + Turborepo
- **Language:** TypeScript (strict mode)
- **Packages:**
  - `@speedlint/core` — Rule engine, analyzers, fixers, reporters
  - `@speedlint/cli` — CLI binary (`speedlint`)
- **Build:** tsup (ESM + CJS dual output)
- **Test:** Vitest
- **Lint/Format:** Biome

## Key Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint with Biome
pnpm typecheck        # TypeScript type checking
```

## Rules

1. **AGENTS.md is the single source of truth** for agent schemas and workflows
2. **docs/PLANS.md defines what to build** — check milestone status before starting work
3. **Schema first** — update AGENTS.md types before implementing
4. **Safe fixes only** — auto-fix must be deterministic and reversible
5. **Framework-agnostic core** — framework knowledge lives in plugins, not core
6. **Test every rule** — each rule must have fixture-based snapshot tests
