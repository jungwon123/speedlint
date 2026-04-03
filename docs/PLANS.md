# speedlint — Milestones & Execution Plan

---

## Milestone 0: Project Setup ✅

- [x] pnpm workspace + Turborepo
- [x] TypeScript strict, Biome, tsup, vitest
- [x] CI: GitHub Actions (lint, typecheck, test Node 20/22, build)
- [x] Harness: CLAUDE.md, AGENTS.md, PLANS.md, CODING_STANDARDS.md

---

## Milestone 1: Core Engine ✅

- [x] ProjectScanner — 프레임워크/번들러/언어/모듈 시스템 자동 감지
- [x] RuleResolver — 설정/플러그인 기반 규칙 해석, 필터링
- [x] AnalysisEngine — 규칙 실행, 타임아웃, 에러 처리
- [x] DiagnosticReporter — 터미널(컬러) + JSON 출력

---

## Milestone 2: Rules ✅

- [x] 12개 built-in 규칙 (8 fixable, 4 detection only)

---

## Milestone 3: Fix Engine + CLI ✅

- [x] FixEngine — dry-run, backup, diff, text/JSON transforms
- [x] CLI — analyze, fix, init, rules, doctor (5 commands)
- [x] High-level API — `analyze()`, `fix()`

---

## Milestone 4: Plugin System ✅

- [x] @speedlint/plugin-react (3 rules)
- [x] @speedlint/plugin-nextjs (3 rules)
- [x] README, LICENSE, npm metadata (v0.1.0)

---

## Milestone 5: Ecosystem ✅

- [x] @speedlint/plugin-vue (2 rules)
- [x] @speedlint/plugin-webpack (2 rules)
- [x] @speedlint/plugin-vite (2 rules)
- [x] Watch 모드 (`--watch`)
- [ ] VS Code 확장

---

## Current Stats

- **7 packages**: core, cli, plugin-react, plugin-nextjs, plugin-vue, plugin-webpack, plugin-vite
- **24 rules**: 12 built-in + 3 React + 3 Next.js + 2 Vue + 2 Webpack + 2 Vite
- **89 tests**, 20 test files
- **9 PRs** merged

---

## Next: Milestone 6 — Production (v1.0.0)

- [ ] npm 배포
- [ ] 실전 프로젝트 테스트
- [ ] GitHub Action 제공
- [ ] 성능 리그레션 감지
- [ ] 커뮤니티 플러그인 레지스트리
