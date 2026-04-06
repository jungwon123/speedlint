import { describe, expect, it } from "vitest";
import type { ProjectContext, RuleContext } from "../../types/index.js";
import { renderBlockingResources } from "./render-blocking-resources.js";

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

describe("lcp/render-blocking-resources", () => {
	it("should detect sync script in head", () => {
		const ctx = makeContext({
			"index.html": '<html><head><script src="/app.js"></script></head><body></body></html>',
		});
		const diagnostics = renderBlockingResources.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("Render-blocking");
	});

	it("should not flag async scripts", () => {
		const ctx = makeContext({
			"index.html": '<html><head><script async src="/app.js"></script></head><body></body></html>',
		});
		const diagnostics = renderBlockingResources.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should not flag defer scripts", () => {
		const ctx = makeContext({
			"index.html": '<html><head><script defer src="/app.js"></script></head><body></body></html>',
		});
		const diagnostics = renderBlockingResources.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should not flag type=module scripts", () => {
		const ctx = makeContext({
			"index.html":
				'<html><head><script type="module" src="/app.js"></script></head><body></body></html>',
		});
		const diagnostics = renderBlockingResources.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should not flag scripts outside head", () => {
		const ctx = makeContext({
			"index.html": '<html><head></head><body><script src="/app.js"></script></body></html>',
		});
		const diagnostics = renderBlockingResources.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});
});
