# speedlint — Milestones & Execution Plan

---

## Milestone 0: Project Setup

> 개발 환경 세팅 + 모노레포 구조

- [ ] pnpm workspace + Turborepo 초기화
- [ ] `packages/core` 패키지 스캐폴딩 (tsup, vitest, biome)
- [ ] `packages/cli` 패키지 스캐폴딩
- [ ] TypeScript strict mode + project references
- [ ] Biome 설정 (lint + format)
- [ ] CI: GitHub Actions (lint, typecheck, test, build)
- [ ] `src/types/index.ts` — AGENTS.md 스키마에 대응하는 TS 타입

---

## Milestone 1: Core Engine (v0.1.0-alpha)

> ProjectScanner + AnalysisEngine + DiagnosticReporter 기본 동작

- [ ] **ProjectScanner** — package.json, 설정 파일 기반 프로젝트 감지
  - [ ] 프레임워크 감지 (React, Next.js, Vue, Svelte, vanilla)
  - [ ] 번들러 감지 (Webpack, Vite, Rollup, esbuild)
  - [ ] `ProjectContext` 생성
- [ ] **RuleResolver** — 설정 파일에서 활성 규칙 목록 결정
  - [ ] `defineConfig()` + `speedlint.config.ts` 로딩
  - [ ] 규칙 필터링 (category, severity)
- [ ] **AnalysisEngine** — 규칙 병렬 실행
  - [ ] RuleContext 생성 (파일 맵, AST 캐시)
  - [ ] SWC를 이용한 AST 파싱 (on-demand, 캐시)
  - [ ] 규칙 타임아웃 (기본 10초)
- [ ] **DiagnosticReporter** — 터미널 + JSON 출력
  - [ ] 컬러 터미널 출력 (에러/경고/정보)
  - [ ] JSON 포맷 출력
  - [ ] 요약 (N errors, N warnings, N fixable)

---

## Milestone 2: First Rules (v0.1.0-beta)

> MVP 12개 규칙 구현 + fixture 기반 테스트

### Bundle Rules (4)
- [ ] `bundle/barrel-file-reexport` — barrel file 감지 [fixable]
- [ ] `bundle/heavy-dependency` — 무거운 패키지 감지 [fixable]
- [ ] `bundle/unused-dependency` — 미사용 의존성 감지 [fixable]
- [ ] `bundle/dynamic-import-candidate` — 동적 import 대상 [fixable]

### LCP Rules (3)
- [ ] `lcp/missing-image-priority` — fetchpriority 누락 [fixable]
- [ ] `lcp/missing-preload` — preload 누락 [fixable]
- [ ] `lcp/render-blocking-resources` — 렌더 블로킹 [fixable]

### CLS Rules (2)
- [ ] `cls/missing-image-dimensions` — 이미지 크기 누락 [fixable]
- [ ] `cls/missing-video-dimensions` — 비디오 크기 누락 [detection only]

### FCP / TBT / General (3)
- [ ] `fcp/third-party-blocking` — 서드파티 블로킹 [detection only]
- [ ] `tbt/long-task-sync-operations` — 동기 작업 감지 [detection only]
- [ ] `general/passive-event-listeners` — passive 누락 [fixable]

### Testing
- [ ] 각 규칙별 fixture 기반 snapshot 테스트
- [ ] 패키지 사이즈 데이터베이스 (curated JSON)

---

## Milestone 3: Fix Engine + CLI (v0.1.0)

> 자동 수정 엔진 + CLI 완성 → 첫 npm 배포

- [ ] **FixEngine** 구현
  - [ ] Transform → diff 생성
  - [ ] dry-run 모드 (프리뷰)
  - [ ] 원자적 적용 (파일별 변환 병합, 충돌 리포트)
  - [ ] 백업 (git stash 또는 .speedlint-backup/)
  - [ ] 롤백 지원
- [ ] **CLI Commands**
  - [ ] `speedlint analyze` — 기본 분석
  - [ ] `speedlint fix` — 자동 수정 (프리뷰 → 적용)
  - [ ] `speedlint init` — 설정 파일 생성
  - [ ] `speedlint rules` — 규칙 목록
  - [ ] `speedlint doctor` — 설치/호환성 체크
- [ ] **CLI UX**
  - [ ] 스피너, 컬러, 테이블 출력
  - [ ] `--quiet`, `--verbose`, `--format` 옵션
  - [ ] `--max-warnings` exit code 제어
- [ ] npm 배포 (`@speedlint/core`, `@speedlint/cli`)
- [ ] README.md + 기본 문서

---

## Milestone 4: Plugin System (v0.2.0)

> 프레임워크별 플러그인 + 확장성

- [ ] Plugin 아키텍처 구현 (`SpeedlintPlugin` 인터페이스)
- [ ] `@speedlint/plugin-react` — React 성능 규칙
- [ ] `@speedlint/plugin-nextjs` — Next.js 최적화 규칙
- [ ] HTML 리포트 출력
- [ ] SARIF 출력 (CI/CD 통합용)
- [ ] `bundle/duplicate-dependency` 규칙 (lockfile 파싱)
- [ ] Incremental caching (변경 파일만 재분석)

---

## Milestone 5: Ecosystem (v0.3.0+)

> Vue, Webpack, Vite 플러그인 + DX 개선

- [ ] `@speedlint/plugin-vue`
- [ ] `@speedlint/plugin-webpack`
- [ ] `@speedlint/plugin-vite`
- [ ] `create-speedlint` — 초기화 위자드
- [ ] Watch 모드 (`--watch`)
- [ ] VS Code 확장
- [ ] 성능 버짓 추적

---

## Milestone 6: Production (v1.0.0)

> CI/CD, 리그레션, 대시보드

- [ ] GitHub Action 제공
- [ ] 성능 리그레션 감지 (baseline 비교)
- [ ] 대시보드 / 히스토리 추적
- [ ] 커뮤니티 플러그인 레지스트리
