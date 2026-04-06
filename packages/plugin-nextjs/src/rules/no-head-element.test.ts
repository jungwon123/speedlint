import type { ProjectContext, RuleContext } from "@speedlint/core";
import { describe, expect, it } from "vitest";
import { noHeadElement } from "./no-head-element.js";

function makeContext(files: Record<string, string>): RuleContext {
	const fileMap = new Map(
		Object.entries(files).map(([path, content]) => [path, { content, mtime: 0 }]),
	);
	return {
		project: { root: "/test", framework: "nextjs", packageJson: {} } as ProjectContext,
		files: fileMap,
		getAST: () => ({}),
		getDependencyGraph: () => ({ nodes: new Map() }),
		getConfig: () => undefined,
		report: () => {},
	};
}

describe("nextjs/no-head-element", () => {
	it("should detect next/head import in App Router", () => {
		const ctx = makeContext({
			"app/page.tsx": "import Head from 'next/head'\n<Head><title>Hi</title></Head>",
		});
		const diagnostics = noHeadElement.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("next/head");
	});

	it("should detect raw <head> in App Router", () => {
		const ctx = makeContext({
			"app/layout.tsx": "<html><head><title>App</title></head></html>",
		});
		const diagnostics = noHeadElement.detect(ctx);
		expect(diagnostics).toHaveLength(1);
	});

	it("should not flag files outside app/ directory", () => {
		const ctx = makeContext({
			"pages/index.tsx": "import Head from 'next/head'\n<Head />",
		});
		const diagnostics = noHeadElement.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should not flag non-tsx files", () => {
		const ctx = makeContext({
			"app/utils.ts": 'const head = "<head>"',
		});
		const diagnostics = noHeadElement.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});
});
