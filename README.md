# speedlint

> ESLint-like web performance analysis with auto-fix. Detects bundle bloat and Core Web Vitals issues from static code — no browser needed.

[![CI](https://github.com/jungwon123/speedlint/actions/workflows/ci.yml/badge.svg)](https://github.com/jungwon123/speedlint/actions/workflows/ci.yml)

## Features

- **24 rules** across 7 packages — bundle size, LCP, CLS, FCP, TBT
- **Auto-fix** — 6 rules with real code transforms (like ESLint `--fix`)
- **Zero config** — works out of the box, detects your framework and bundler
- **Plugins** — React, Next.js, Vue, Webpack, Vite
- **Fast** — static analysis with SWC AST parser, no browser needed
- **Watch mode** — re-analyze on file changes (`--watch`)
- **GitHub Action** — CI integration out of the box
- **VS Code extension** — inline warnings in your editor
- **Programmatic API** — use as a library or CLI

## Quick Start

```bash
# Analyze your project
npx @speedlint/cli

# Auto-fix issues
npx @speedlint/cli fix

# See all available rules
npx @speedlint/cli rules
```

## Installation

```bash
npm install -D @speedlint/cli
# or
pnpm add -D @speedlint/cli
```

## CLI Commands

```bash
speedlint [path]          # Analyze project (default command)
speedlint fix [path]      # Auto-fix with preview
speedlint init            # Generate speedlint.config.ts
speedlint rules           # List all rules
speedlint doctor          # Check compatibility
```

### Options

```
--fix                     Auto-fix issues
--fix-dry-run             Preview fixes without applying
--category <cat>          Filter: bundle, lcp, cls, fcp, tbt, general
--severity <level>        Minimum: error, warning, info
--format <fmt>            Output: terminal (default), json
--quiet                   Errors only
--verbose                 Detailed output
--max-warnings <n>        Fail if warnings exceed threshold
--watch                   Re-analyze on file changes
```

## Rules

### Bundle Optimization

| Rule | Description | Fixable |
|------|-------------|---------|
| `bundle/barrel-file-reexport` | Detect barrel files that prevent tree-shaking | Yes |
| `bundle/heavy-dependency` | Flag heavy packages with lighter alternatives | Yes |
| `bundle/unused-dependency` | Find unused dependencies in package.json | Yes |
| `bundle/dynamic-import-candidate` | Suggest dynamic imports for large packages | Yes |

### Largest Contentful Paint (LCP)

| Rule | Description | Fixable |
|------|-------------|---------|
| `lcp/missing-image-priority` | Hero images need `fetchpriority="high"` | Yes |
| `lcp/missing-preload` | Critical resources should be preloaded | Yes |
| `lcp/render-blocking-resources` | Scripts in `<head>` should use async/defer | Yes |

### Cumulative Layout Shift (CLS)

| Rule | Description | Fixable |
|------|-------------|---------|
| `cls/missing-image-dimensions` | Images need explicit width and height | Yes |
| `cls/missing-video-dimensions` | Video/iframe need explicit dimensions | No |

### First Contentful Paint (FCP) / Total Blocking Time (TBT)

| Rule | Description | Fixable |
|------|-------------|---------|
| `fcp/third-party-blocking` | Third-party scripts loaded synchronously | No |
| `tbt/long-task-sync-operations` | Sync operations blocking main thread | No |

### General

| Rule | Description | Fixable |
|------|-------------|---------|
| `general/passive-event-listeners` | Scroll/touch listeners need `{ passive: true }` | Yes |

## Plugins

### @speedlint/plugin-react

```bash
npm install -D @speedlint/plugin-react
```

| Rule | Description |
|------|-------------|
| `react/missing-lazy-load` | Route components should use `React.lazy()` |
| `react/no-inline-styles-in-render` | Extract inline style objects to constants |
| `react/no-anonymous-default-export` | Name default exports for DevTools + Fast Refresh |

### @speedlint/plugin-nextjs

```bash
npm install -D @speedlint/plugin-nextjs
```

| Rule | Description |
|------|-------------|
| `nextjs/use-next-image` | Use `next/image` instead of `<img>` |
| `nextjs/no-head-element` | Use metadata API in App Router |
| `nextjs/no-sync-dynamic-usage` | Consider `ssr: false` for client-only dynamic imports |

### @speedlint/plugin-vue

```bash
npm install -D @speedlint/plugin-vue
```

| Rule | Description |
|------|-------------|
| `vue/no-v-html` | Avoid `v-html` — XSS risk and prevents SSR optimization |
| `vue/async-component-loading` | Route components should use dynamic import |

### @speedlint/plugin-webpack

```bash
npm install -D @speedlint/plugin-webpack
```

| Rule | Description |
|------|-------------|
| `webpack/missing-splitchunks` | Enable `splitChunks` for better caching |
| `webpack/missing-compression` | Add compression plugin for gzip/brotli |

### @speedlint/plugin-vite

```bash
npm install -D @speedlint/plugin-vite
```

| Rule | Description |
|------|-------------|
| `vite/missing-build-target` | Set explicit `build.target` to avoid polyfills |
| `vite/missing-manual-chunks` | Add `manualChunks` for vendor splitting |

## Configuration

```bash
speedlint init
```

Creates `speedlint.config.ts`:

```typescript
import { defineConfig } from "@speedlint/core";
import react from "@speedlint/plugin-react";
import nextjs from "@speedlint/plugin-nextjs";

export default defineConfig({
  plugins: [react, nextjs],
  rules: {
    "bundle/barrel-file-reexport": "error",
    "bundle/heavy-dependency": "warning",
    "lcp/missing-image-priority": "error",
    "react/no-inline-styles-in-render": "warning",
    "nextjs/use-next-image": "warning",
    // ...
  },
  ignore: ["node_modules", "dist", "**/*.test.{ts,tsx}"],
});
```

## Programmatic API

```typescript
import { analyze, fix } from "@speedlint/core";

// Analyze
const { project, analysis } = analyze({ root: "./my-app" });
console.log(analysis.diagnostics);

// Auto-fix
const { fixResult } = fix(
  { root: "./my-app" },
  { dryRun: true }
);
console.log(fixResult.applied);
```

## How It Works

speedlint performs **static code analysis** — it reads your source files and detects performance anti-patterns without running a browser or bundler.

```
Source Files → ProjectScanner → RuleResolver → AnalysisEngine → Report
                                                     ↓ (if --fix)
                                                  FixEngine → Applied Changes
```

1. **ProjectScanner** detects your framework, bundler, and config
2. **RuleResolver** selects applicable rules based on your setup
3. **AnalysisEngine** runs each rule against your source files
4. **FixEngine** applies deterministic, reversible transforms

## GitHub Action

```yaml
name: Performance Check
on: [push, pull_request]

jobs:
  speedlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jungwon123/speedlint-action@v1
        with:
          max-warnings: 5
```

See [GitHub Action docs](packages/github-action/README.md) for all options.

## Custom Plugins

Create your own rules and plugins. See the [Plugin Guide](docs/PLUGIN_GUIDE.md).

```typescript
import { createRule } from "@speedlint/core";

const myRule = createRule({
  meta: { id: "my/rule", category: "general", severity: "warning", ... },
  detect(context) { /* analyze files */ },
});
```

## Contributing

```bash
git clone https://github.com/jungwon123/speedlint.git
cd speedlint
pnpm install
pnpm build
pnpm test
```

## License

MIT
