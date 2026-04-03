# speedlint — Coding Standards

> TypeScript/Node.js 코딩 규칙. 이 문서를 따라 일관된 코드를 작성한다.

---

## 1. TypeScript

- **Strict mode** 필수 (`strict: true`)
- `any` 사용 금지 — `unknown`을 사용하고 타입 가드로 좁힌다
- 인터페이스 우선 (`interface` > `type` alias), 유니온/인터섹션은 `type` 사용
- 반환 타입 명시 — 공개 API 함수는 반드시 반환 타입을 명시
- `enum` 대신 `const` object + `as const` 사용

```typescript
// Good
const Severity = { Error: "error", Warning: "warning", Info: "info" } as const;
type Severity = (typeof Severity)[keyof typeof Severity];

// Bad
enum Severity { Error = "error", Warning = "warning", Info = "info" }
```

---

## 2. Module System

- **ESM first** — `import/export` 사용, `require` 금지
- 패키지는 ESM + CJS 듀얼 출력 (tsup이 처리)
- barrel file(`index.ts`에서 `export *`) 최소화 — 패키지 공개 API만 barrel 허용
- 상대 경로 import에 확장자 포함하지 않음 (tsup/bundler가 해결)

---

## 3. Naming Conventions

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일 | kebab-case | `project-scanner.ts` |
| 클래스 | PascalCase | `AnalysisEngine` |
| 함수/변수 | camelCase | `getDependencyGraph()` |
| 상수 | UPPER_SNAKE_CASE | `DEFAULT_TIMEOUT_MS` |
| 타입/인터페이스 | PascalCase | `RuleContext`, `Diagnostic` |
| 규칙 ID | `category/kebab-case` | `bundle/barrel-file-reexport` |

---

## 4. Error Handling

- 외부 입력(사용자 설정, 파일 시스템)만 에러 처리
- 내부 코드는 타입으로 안전성 보장 — 불필요한 try/catch 금지
- 커스텀 에러 클래스 사용: `SpeedlintError`, `RuleError`, `ConfigError`
- 에러 메시지에 context 포함 (어떤 파일, 어떤 규칙에서 발생했는지)

```typescript
// Good
throw new RuleError(`Rule "${ruleId}" timed out after ${timeout}ms`, { ruleId, filePath });

// Bad
throw new Error("timeout");
```

---

## 5. Testing

- **모든 규칙에 fixture 기반 테스트** 필수
- 테스트 파일: `*.test.ts` (소스 옆에 위치)
- fixture 구조: `__fixtures__/rule-id/input/` + `__fixtures__/rule-id/expected/`
- 단위 테스트: 개별 함수/모듈
- 통합 테스트: CLI 커맨드 end-to-end

```
src/rules/bundle/
  barrel-file-reexport.ts
  barrel-file-reexport.test.ts
  __fixtures__/
    barrel-file-reexport/
      input/
        components/index.ts
        pages/Home.tsx
      expected/
        pages/Home.tsx
```

---

## 6. Rule Implementation

- 규칙은 `AGENTS.md`의 `Rule` 인터페이스를 구현
- `detect()`는 순수 함수 — 부수효과 없음
- `fix()`는 순수 함수 — `Transform[]` 반환, 직접 파일 수정 금지
- 하나의 규칙 = 하나의 파일

```typescript
import { createRule } from "../engine/create-rule";

export const barrelFileReexport = createRule({
  meta: {
    id: "bundle/barrel-file-reexport",
    category: "bundle",
    severity: "error",
    description: "Detect barrel files that prevent tree-shaking",
    docs: "https://speedlint.dev/rules/bundle/barrel-file-reexport",
    fixable: true,
  },
  detect(context) {
    // detection logic
  },
  fix(diagnostic, context) {
    // return Transform[]
  },
});
```

---

## 7. Dependencies

- 의존성은 최소화 — 새 패키지 추가 전 정당성 검토
- `devDependencies`와 `dependencies` 엄격히 분리
- core 패키지의 런타임 의존성: `@swc/core`, `htmlparser2`, `postcss` + 최소한의 유틸리티
- CLI 패키지 추가: `cac` (CLI 프레임워크), `picocolors` (터미널 색상)

---

## 8. Git

- 커밋 메시지: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)
- 브랜치: `feat/rule-name`, `fix/issue-description`
- PR 단위: 규칙 1개 = PR 1개 (가능한 경우)

---

## 하지 말 것

- `console.log` 디버깅 남기기 금지 — logger 모듈 사용
- 규칙 간 직접 의존 금지 — 규칙은 독립적
- 런타임에 파일 시스템 직접 접근 금지 (규칙 내부) — `RuleContext`를 통해서만
- AST를 직접 파싱하지 말 것 — `context.getAST()` 사용 (캐시 활용)
