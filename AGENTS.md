# Agent Architecture — speedlint

> 에이전트 구조, 출력 스키마, 통신 원칙, 워크플로우 정의.
> 이 문서가 에이전트 아키텍처의 단일 진실(Single Source of Truth).

---

## 1. Core Pipeline

```
Input (project directory)
    |
    v
[ProjectScanner] --> ProjectContext
    |
    v
[RuleResolver] --> Rule[]
    |
    v
[AnalysisEngine] --> Diagnostic[]
    |
    v
[DiagnosticReporter] --> Report (terminal/JSON)
    |
    v (if --fix)
[FixEngine] --> Transform[] --> Applied Changes
```

### Communication Principle

- **단방향 데이터 흐름:** Pipeline stage 간 데이터는 위에서 아래로만 흐른다
- **스키마 우선:** 모든 stage 간 데이터는 아래 정의된 스키마를 준수
- **Stateless Rules:** 규칙은 상태를 갖지 않으며, 다른 규칙의 출력에 의존하지 않는다

---

## 2. Output Schemas

### ProjectContext

```typescript
interface ProjectContext {
  root: string;                          // Project root directory
  framework: Framework | null;           // Detected framework
  bundler: Bundler | null;               // Detected bundler
  language: "typescript" | "javascript";
  moduleSystem: "esm" | "cjs" | "mixed";
  packageJson: PackageJson;
  configFiles: Map<string, string>;      // config name -> file path
}

type Framework = "react" | "nextjs" | "vue" | "nuxt" | "svelte" | "sveltekit" | "angular" | "vanilla";
type Bundler = "webpack" | "vite" | "rollup" | "esbuild" | "turbopack" | "rspack";
```

### Rule

```typescript
interface Rule {
  meta: RuleMeta;
  detect(context: RuleContext): Diagnostic[];
  fix?(diagnostic: Diagnostic, context: FixContext): Transform[];
}

interface RuleMeta {
  id: string;                            // e.g., "bundle/barrel-file-reexport"
  category: RuleCategory;
  severity: Severity;
  description: string;
  docs: string;
  fixable: boolean;
  frameworks?: Framework[];              // empty = all
}

type RuleCategory = "bundle" | "lcp" | "cls" | "fcp" | "tbt" | "general";
type Severity = "error" | "warning" | "info";
```

### RuleContext

```typescript
interface RuleContext {
  project: ProjectContext;
  files: FileMap;
  getAST(filePath: string): AST;
  getDependencyGraph(): DepGraph;
  getConfig(name: string): unknown;
  report(diagnostic: Diagnostic): void;
}

type FileMap = Map<string, { content: string; mtime: number }>;
```

### Diagnostic

```typescript
interface Diagnostic {
  ruleId: string;
  severity: Severity;
  message: string;
  detail: string;
  file?: string;
  line?: number;
  impact: Impact;
  fix?: () => Transform[];
}

interface Impact {
  metric: "LCP" | "CLS" | "FCP" | "TBT" | "INP" | "bundleSize";
  estimated: string;                     // e.g., "-45KB", "-200ms"
  confidence: "high" | "medium" | "low";
}
```

### Transform

```typescript
interface Transform {
  type: "replaceText" | "insertText" | "deleteText" | "renameFile" | "createFile" | "modifyJSON";
  filePath: string;
  range?: { start: Position; end: Position };
  newText?: string;
  jsonPath?: string;
  jsonValue?: unknown;
}

interface Position {
  line: number;
  column: number;
}
```

### Plugin

```typescript
interface SpeedlintPlugin {
  name: string;
  rules: Rule[];
  configs?: Record<string, RuleConfig[]>;
}

interface RuleConfig {
  rule: string;
  severity: Severity;
  options?: Record<string, unknown>;
}
```

---

## 3. Module Responsibilities

| Module | Input | Output | Role |
|--------|-------|--------|------|
| **ProjectScanner** | directory path | `ProjectContext` | 프로젝트 구조 자동 감지 (프레임워크, 번들러, 설정 파일) |
| **RuleResolver** | `ProjectContext` + config | `Rule[]` | 설정에 따라 활성 규칙 목록 결정 |
| **AnalysisEngine** | `ProjectContext` + `Rule[]` | `Diagnostic[]` | 규칙 병렬 실행, 타임아웃 관리 |
| **DiagnosticReporter** | `Diagnostic[]` | formatted output | 터미널/JSON/HTML 리포트 생성 |
| **FixEngine** | `Diagnostic[]` (fixable) | `Transform[]` | diff 생성 → 프리뷰 → 적용 → 백업 |

---

## 4. CLI Commands

```
speedlint analyze [path]     # Analyze project (default command)
speedlint fix [path]         # Auto-fix with preview
speedlint init               # Generate speedlint.config.ts
speedlint doctor             # Check installation & compatibility
speedlint rules              # List all available rules
```

---

## 5. Rule Categories (18 rules total)

### Built-in Rules (@speedlint/core — 12 rules)

**Bundle Optimization (4)**
- `bundle/barrel-file-reexport` — barrel file 감지 + import 직접 경로로 변환 [fixable]
- `bundle/heavy-dependency` — 무거운 패키지 감지 + 경량 대안 제안 [fixable]
- `bundle/unused-dependency` — 미사용 의존성 감지 + 제거 [fixable]
- `bundle/dynamic-import-candidate` — 동적 import 대상 감지 [fixable]

**LCP (3)**
- `lcp/missing-image-priority` — LCP 이미지 fetchpriority 누락 [fixable]
- `lcp/missing-preload` — 크리티컬 리소스 preload 누락 [fixable]
- `lcp/render-blocking-resources` — 렌더 블로킹 스크립트 감지 [fixable]

**CLS (2)**
- `cls/missing-image-dimensions` — 이미지 width/height 누락 [fixable]
- `cls/missing-video-dimensions` — 비디오/iframe 크기 누락 [detection only]

**FCP (1)**
- `fcp/third-party-blocking` — 동기 로딩 서드파티 스크립트 [detection only]

**TBT (1)**
- `tbt/long-task-sync-operations` — 렌더 경로 동기 작업 감지 [detection only]

**General (1)**
- `general/passive-event-listeners` — passive 옵션 누락 [fixable]

### Plugin: @speedlint/plugin-react (3 rules)

- `react/missing-lazy-load` — Route 컴포넌트 React.lazy() 사용 권장
- `react/no-inline-styles-in-render` — 렌더 시 인라인 스타일 객체 생성 금지
- `react/no-anonymous-default-export` — DevTools/Fast Refresh를 위한 named export 권장

### Plugin: @speedlint/plugin-nextjs (3 rules)

- `nextjs/use-next-image` — `<img>` 대신 `next/image` 사용 권장
- `nextjs/no-head-element` — App Router에서 metadata API 사용 권장
- `nextjs/no-sync-dynamic-usage` — 클라이언트 전용 dynamic import에 ssr:false 권장

### Plugin: @speedlint/plugin-vue (2 rules)

- `vue/no-v-html` — XSS 위험 + SSR 최적화 방해
- `vue/async-component-loading` — Route 컴포넌트 동적 import 권장

### Plugin: @speedlint/plugin-webpack (2 rules)

- `webpack/missing-splitchunks` — splitChunks 최적화 누락
- `webpack/missing-compression` — gzip/brotli 압축 플러그인 누락

### Plugin: @speedlint/plugin-vite (2 rules)

- `vite/missing-build-target` — 빌드 타겟 미설정 (불필요한 폴리필)
- `vite/missing-manual-chunks` — 벤더 청크 분리 누락

---

## 6. Technical Stack

| Layer | Tool | Rationale |
|-------|------|-----------|
| JS/TS Parser | SWC (`@swc/core`) | Rust 기반, 10-50x faster than Babel |
| HTML Parser | htmlparser2 | 빠르고 관대한 파싱 |
| CSS Parser | PostCSS | 업계 표준, 변환 API 내장 |
| Build | tsup | esbuild 기반, ESM + CJS 듀얼 출력 |
| Test | Vitest | 빠른 TS 네이티브 테스트 |
| Lint/Format | Biome | ESLint + Prettier 대체, Rust 기반 |
| Monorepo | pnpm + Turborepo | 워크스페이스 프로토콜 + 빌드 캐싱 |
| Versioning | Changesets | 모노레포 독립 버전 관리 + 자동 배포 |
