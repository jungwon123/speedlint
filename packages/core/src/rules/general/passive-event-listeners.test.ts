import { describe, expect, it } from "vitest";
import { passiveEventListeners } from "./passive-event-listeners.js";
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

describe("general/passive-event-listeners", () => {
	it("should detect scroll listener without passive", () => {
		const ctx = makeContext({
			"src/app.ts": "window.addEventListener('scroll', handler)",
		});
		const diagnostics = passiveEventListeners.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("scroll");
	});

	it("should detect touchstart without passive", () => {
		const ctx = makeContext({
			"src/app.ts": "el.addEventListener('touchstart', handler)",
		});
		const diagnostics = passiveEventListeners.detect(ctx);
		expect(diagnostics).toHaveLength(1);
	});

	it("should not flag scroll with passive: true", () => {
		const ctx = makeContext({
			"src/app.ts": "window.addEventListener('scroll', handler, { passive: true })",
		});
		const diagnostics = passiveEventListeners.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should not flag click events", () => {
		const ctx = makeContext({
			"src/app.ts": "button.addEventListener('click', handler)",
		});
		const diagnostics = passiveEventListeners.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should detect wheel event without passive", () => {
		const ctx = makeContext({
			"src/canvas.ts": "canvas.addEventListener('wheel', onZoom)",
		});
		const diagnostics = passiveEventListeners.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("wheel");
	});
});
