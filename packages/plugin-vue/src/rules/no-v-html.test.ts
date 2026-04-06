import type { ProjectContext, RuleContext } from "@speedlint/core";
import { describe, expect, it } from "vitest";
import { noVHtml } from "./no-v-html.js";

function makeContext(files: Record<string, string>): RuleContext {
	const fileMap = new Map(Object.entries(files).map(([p, c]) => [p, { content: c, mtime: 0 }]));
	return {
		project: { root: "/test", framework: "vue", packageJson: {} } as ProjectContext,
		files: fileMap,
		getAST: () => ({}),
		getDependencyGraph: () => ({ nodes: new Map() }),
		getConfig: () => undefined,
		report: () => {},
	};
}

describe("vue/no-v-html", () => {
	it("should detect v-html", () => {
		const ctx = makeContext({ "src/App.vue": '<div v-html="rawHtml"></div>' });
		expect(noVHtml.detect(ctx)).toHaveLength(1);
	});
	it("should not flag non-vue files", () => {
		const ctx = makeContext({ "src/utils.ts": 'const x = "v-html"' });
		expect(noVHtml.detect(ctx)).toHaveLength(0);
	});
});
