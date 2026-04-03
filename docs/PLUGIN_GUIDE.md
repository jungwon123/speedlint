# speedlint Plugin Guide

> 커스텀 규칙과 플러그인을 만드는 방법.

## 플러그인 구조

```typescript
import type { SpeedlintPlugin } from "@speedlint/core";
import { createRule } from "@speedlint/core";

// 1. 규칙 정의
const myRule = createRule({
  meta: {
    id: "my-plugin/no-console-log",
    category: "general",
    severity: "warning",
    description: "Remove console.log in production code",
    docs: "https://example.com/rules/no-console-log",
    fixable: true,
  },

  detect(context) {
    const diagnostics = [];

    for (const [filePath, file] of context.files) {
      if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) continue;

      const pattern = /console\.log\s*\(/g;
      for (const match of file.content.matchAll(pattern)) {
        const line = file.content.substring(0, match.index).split("\n").length;

        diagnostics.push({
          ruleId: "my-plugin/no-console-log",
          severity: "warning",
          message: "console.log should not be in production code",
          detail: "Remove or replace with a proper logger",
          file: filePath,
          line,
          impact: {
            metric: "TBT",
            estimated: "minor",
            confidence: "high",
          },
        });
      }
    }

    return diagnostics;
  },
});

// 2. 플러그인으로 내보내기
const myPlugin: SpeedlintPlugin = {
  name: "my-speedlint-plugin",
  rules: [myRule],
  configs: {
    recommended: [
      { rule: "my-plugin/no-console-log", severity: "warning" },
    ],
  },
};

export default myPlugin;
```

## 플러그인 사용

```typescript
// speedlint.config.ts
import { defineConfig } from "@speedlint/core";
import myPlugin from "my-speedlint-plugin";

export default defineConfig({
  plugins: [myPlugin],
});
```

## 규칙 작성 규칙

### meta 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | `plugin-name/rule-name` 형식 |
| `category` | string | `bundle`, `lcp`, `cls`, `fcp`, `tbt`, `general` |
| `severity` | string | `error`, `warning`, `info` |
| `description` | string | 한 줄 설명 |
| `docs` | string | 상세 문서 URL |
| `fixable` | boolean | auto-fix 가능 여부 |
| `frameworks` | string[] | 적용 프레임워크 (빈 배열 = 모든 프레임워크) |

### detect 함수

```typescript
detect(context: RuleContext): Diagnostic[]
```

- `context.project` — 프로젝트 정보 (프레임워크, 번들러 등)
- `context.files` — 소스 파일 맵 (경로 → 내용)
- 반환: `Diagnostic[]` — 발견된 이슈 목록

### fix 함수 (선택)

```typescript
fix?: () => Transform[]
```

Diagnostic 내부에 `fix` 클로저로 포함:

```typescript
diagnostics.push({
  // ... diagnostic fields
  fix: () => [{
    type: "replaceText",
    filePath: "src/app.ts",
    range: {
      start: { line: 10, column: 0 },
      end: { line: 10, column: 20 },
    },
    newText: "// removed console.log",
  }],
});
```

### Transform 타입

| type | 설명 | 필요 필드 |
|------|------|-----------|
| `replaceText` | 텍스트 교체 | `range`, `newText` |
| `insertText` | 텍스트 삽입 | `range.start`, `newText` |
| `deleteText` | 텍스트 삭제 | `range` |
| `modifyJSON` | JSON 파일 수정 | `jsonPath`, `jsonValue` |

## npm 배포

```bash
# 패키지 이름: speedlint-plugin-xxx 또는 @scope/speedlint-plugin-xxx
npm publish --access public
```

## AST 파서 사용 (고급)

regex 대신 SWC AST를 사용하면 더 정확한 분석이 가능합니다:

```typescript
import { parseAST, extractImports, extractJSXElements } from "@speedlint/core";

detect(context) {
  for (const [filePath, file] of context.files) {
    const ast = parseAST(file.content, { filename: filePath });
    const imports = extractImports(ast);
    const jsxElements = extractJSXElements(ast, ["img", "Image"]);
    // ... analyze
  }
}
```

### 사용 가능한 AST 유틸리티

- `parseAST(source, options)` — SWC로 파싱 (캐시됨)
- `extractImports(module)` — 정적/동적 import 추출
- `extractExports(module)` — named/default/barrel export 추출
- `extractJSXElements(module, tagFilter?)` — JSX 요소 + 속성 추출
- `extractEventListeners(module)` — addEventListener 호출 추출
