# speedlint — Milestones & Execution Plan

---

## Milestone 0: Project Setup ✅

- [x] pnpm workspace + Turborepo 초기화
- [x] `packages/core`, `packages/cli` 스캐폴딩
- [x] TypeScript strict mode, Biome, tsup, vitest
- [x] `src/types/index.ts` — AGENTS.md 스키마 타입
- [x] CI: GitHub Actions (lint, typecheck, test, build)

---

## Milestone 1: Core Engine ✅

- [x] ProjectScanner — 프레임워크/번들러/언어/모듈 시스템 자동 감지
- [x] RuleResolver — 설정/플러그인 기반 규칙 해석, 필터링
- [x] AnalysisEngine — 규칙 실행, 타임아웃, 에러 처리
- [x] DiagnosticReporter — 터미널(컬러) + JSON 출력

---

## Milestone 2: Rules ✅

- [x] 12개 built-in 규칙 (8 fixable, 4 detection only)
- [x] Bundle: barrel-file, heavy-dep, unused-dep, dynamic-import
- [x] LCP: image-priority, preload, render-blocking
- [x] CLS: image-dimensions, video-dimensions
- [x] FCP/TBT/General: third-party, long-task, passive-listeners

---

## Milestone 3: Fix Engine + CLI ✅

- [x] FixEngine — dry-run, backup, diff, text/JSON transforms
- [x] CLI — analyze, fix, init, rules, doctor (5 commands)
- [x] High-level API — `analyze()`, `fix()`
- [x] Built-in plugin — 12 rules bundled

---

## Milestone 4: Plugin System ✅

- [x] `@speedlint/plugin-react` (3 rules): missing-lazy-load, no-inline-styles, no-anonymous-export
- [x] `@speedlint/plugin-nextjs` (3 rules): use-next-image, no-head-element, no-sync-dynamic
- [x] Plugin tests
- [x] README, LICENSE, npm metadata (v0.1.0)
- [ ] Incremental caching (변경 파일만 재분석)

---

## Milestone 5: Ecosystem (v0.3.0+)

- [ ] `@speedlint/plugin-vue`
- [ ] `@speedlint/plugin-webpack`
- [ ] `@speedlint/plugin-vite`
- [ ] `create-speedlint` — 초기화 위자드
- [ ] Watch 모드 (`--watch`)
- [ ] VS Code 확장
- [ ] 성능 버짓 추적
- [ ] HTML/SARIF 리포트 출력

---

## Milestone 6: Production (v1.0.0)

- [ ] GitHub Action 제공
- [ ] 성능 리그레션 감지 (baseline 비교)
- [ ] 대시보드 / 히스토리 추적
- [ ] 커뮤니티 플러그인 레지스트리
