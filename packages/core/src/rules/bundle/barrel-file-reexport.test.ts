import { describe, expect, it } from "vitest";
import type { ProjectContext, RuleContext } from "../../types/index.js";
import { barrelFileReexport } from "./barrel-file-reexport.js";

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

describe("bundle/barrel-file-reexport", () => {
	it("should detect barrel files with 3+ re-exports", () => {
		const ctx = makeContext({
			"src/components/index.ts": [
				"export * from './Button'",
				"export * from './Card'",
				"export * from './Modal'",
			].join("\n"),
			"src/pages/Home.tsx": "import { Button } from './components'",
		});

		const diagnostics = barrelFileReexport.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.ruleId).toBe("bundle/barrel-file-reexport");
		expect(diagnostics[0]?.file).toBe("src/components/index.ts");
	});

	it("should not flag barrel files with fewer than 3 re-exports", () => {
		const ctx = makeContext({
			"src/utils/index.ts": ["export * from './math'", "export * from './string'"].join("\n"),
			"src/app.ts": "import { add } from './utils'",
		});

		const diagnostics = barrelFileReexport.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should not flag barrel files with no consumers", () => {
		const ctx = makeContext({
			"src/components/index.ts": [
				"export * from './A'",
				"export * from './B'",
				"export * from './C'",
			].join("\n"),
		});

		const diagnostics = barrelFileReexport.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should count named re-exports too", () => {
		const ctx = makeContext({
			"src/lib/index.ts": [
				"export { foo } from './foo'",
				"export { bar } from './bar'",
				"export * from './baz'",
			].join("\n"),
			"src/main.ts": "import { foo } from './lib'",
		});

		const diagnostics = barrelFileReexport.detect(ctx);
		expect(diagnostics).toHaveLength(1);
	});
});
