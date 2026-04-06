import type { ProjectContext, RuleContext } from "@speedlint/core";
import { describe, expect, it } from "vitest";
import { missingBuildTarget } from "./missing-build-target.js";

function makeContext(files: Record<string, string>): RuleContext {
	const fileMap = new Map(Object.entries(files).map(([p, c]) => [p, { content: c, mtime: 0 }]));
	return {
		project: { root: "/test", bundler: "vite", packageJson: {} } as ProjectContext,
		files: fileMap,
		getAST: () => ({}),
		getDependencyGraph: () => ({ nodes: new Map() }),
		getConfig: () => undefined,
		report: () => {},
	};
}

describe("vite/missing-build-target", () => {
	it("should detect missing build target", () => {
		const ctx = makeContext({
			"vite.config.ts": "export default defineConfig({ plugins: [react()] })",
		});
		expect(missingBuildTarget.detect(ctx)).toHaveLength(1);
	});
	it("should not flag if target is set", () => {
		const ctx = makeContext({
			"vite.config.ts": "export default defineConfig({ build: { target: 'es2022' } })",
		});
		expect(missingBuildTarget.detect(ctx)).toHaveLength(0);
	});
	it("should skip non-vite config files", () => {
		const ctx = makeContext({ "src/main.ts": "import './app'" });
		expect(missingBuildTarget.detect(ctx)).toHaveLength(0);
	});
});
