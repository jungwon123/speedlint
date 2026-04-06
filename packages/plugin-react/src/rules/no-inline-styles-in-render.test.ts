import type { ProjectContext, RuleContext } from "@speedlint/core";
import { describe, expect, it } from "vitest";
import { noInlineStylesInRender } from "./no-inline-styles-in-render.js";

function makeContext(files: Record<string, string>): RuleContext {
	const fileMap = new Map(
		Object.entries(files).map(([path, content]) => [path, { content, mtime: 0 }]),
	);
	return {
		project: { root: "/test", framework: "react", packageJson: {} } as ProjectContext,
		files: fileMap,
		getAST: () => ({}),
		getDependencyGraph: () => ({ nodes: new Map() }),
		getConfig: () => undefined,
		report: () => {},
	};
}

describe("react/no-inline-styles-in-render", () => {
	it("should detect inline style objects", () => {
		const ctx = makeContext({
			"src/Card.tsx": '<div style={{ color: "red", padding: 8 }} />',
		});
		const diagnostics = noInlineStylesInRender.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.ruleId).toBe("react/no-inline-styles-in-render");
	});

	it("should not flag non-tsx files", () => {
		const ctx = makeContext({
			"src/utils.ts": 'const style = { color: "red" }',
		});
		const diagnostics = noInlineStylesInRender.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should detect multiple inline styles", () => {
		const ctx = makeContext({
			"src/Page.tsx": ["<div style={{ margin: 0 }} />", "<span style={{ fontSize: 14 }} />"].join(
				"\n",
			),
		});
		const diagnostics = noInlineStylesInRender.detect(ctx);
		expect(diagnostics).toHaveLength(2);
	});
});
