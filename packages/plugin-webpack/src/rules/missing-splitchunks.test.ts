import { describe, expect, it } from "vitest";
import { missingSplitChunks } from "./missing-splitchunks.js";
import type { ProjectContext, RuleContext } from "@speedlint/core";

function makeContext(files: Record<string, string>): RuleContext {
	const fileMap = new Map(Object.entries(files).map(([p, c]) => [p, { content: c, mtime: 0 }]));
	return { project: { root: "/test", bundler: "webpack", packageJson: {} } as ProjectContext, files: fileMap, getAST: () => ({}), getDependencyGraph: () => ({ nodes: new Map() }), getConfig: () => undefined, report: () => {} };
}

describe("webpack/missing-splitchunks", () => {
	it("should detect missing splitChunks", () => {
		const ctx = makeContext({ "webpack.config.js": "module.exports = { entry: './src/index.js' }" });
		expect(missingSplitChunks.detect(ctx)).toHaveLength(1);
	});
	it("should not flag if splitChunks exists", () => {
		const ctx = makeContext({ "webpack.config.js": "module.exports = { optimization: { splitChunks: { chunks: 'all' } } }" });
		expect(missingSplitChunks.detect(ctx)).toHaveLength(0);
	});
	it("should skip non-webpack config files", () => {
		const ctx = makeContext({ "src/app.ts": "const x = 1" });
		expect(missingSplitChunks.detect(ctx)).toHaveLength(0);
	});
});
