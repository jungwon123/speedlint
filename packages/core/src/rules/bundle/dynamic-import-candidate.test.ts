import { describe, expect, it } from "vitest";
import { dynamicImportCandidate } from "./dynamic-import-candidate.js";
import type { ProjectContext, RuleContext } from "../../types/index.js";

function makeContext(files: Record<string, string>): RuleContext {
	const fileMap = new Map(
		Object.entries(files).map(([path, content]) => [path, { content, mtime: 0 }]),
	);
	return {
		project: { root: "/test", packageJson: {} } as ProjectContext,
		files: fileMap,
		getAST: () => ({}),
		getDependencyGraph: () => ({ nodes: new Map() }),
		getConfig: () => undefined,
		report: () => {},
	};
}

describe("bundle/dynamic-import-candidate", () => {
	it("should detect large packages imported statically", () => {
		const ctx = makeContext({
			"src/editor.ts": "import * as monaco from 'monaco-editor'\nconst editor = monaco.create()",
		});
		const diagnostics = dynamicImportCandidate.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("monaco-editor");
		expect(diagnostics[0]?.file).toBe("src/editor.ts");
	});

	it("should not flag small packages", () => {
		const ctx = makeContext({
			"src/app.ts": "import React from 'react'\nimport clsx from 'clsx'",
		});
		const diagnostics = dynamicImportCandidate.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should not flag if already dynamically imported", () => {
		const ctx = makeContext({
			"src/chart.ts": [
				"// lazy loaded",
				"const Chart = await import('chart.js')",
			].join("\n"),
		});
		const diagnostics = dynamicImportCandidate.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should not flag relative imports", () => {
		const ctx = makeContext({
			"src/app.ts": "import { heavy } from './heavy-module'",
		});
		const diagnostics = dynamicImportCandidate.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should detect chart.js", () => {
		const ctx = makeContext({
			"src/dashboard.tsx": "import { Chart } from 'chart.js'\n<Chart />",
		});
		const diagnostics = dynamicImportCandidate.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.impact.estimated).toContain("200KB");
	});

	it("should report correct line number", () => {
		const ctx = makeContext({
			"src/app.ts": "const x = 1\nconst y = 2\nimport { Chart } from 'chart.js'",
		});
		const diagnostics = dynamicImportCandidate.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.line).toBe(3);
	});
});
