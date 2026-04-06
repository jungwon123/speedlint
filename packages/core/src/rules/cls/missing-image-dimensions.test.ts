import { describe, expect, it } from "vitest";
import type { ProjectContext, RuleContext } from "../../types/index.js";
import { missingImageDimensions } from "./missing-image-dimensions.js";

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

describe("cls/missing-image-dimensions", () => {
	it("should detect img without width and height", () => {
		const ctx = makeContext({
			"src/Card.tsx": '<img src="/photo.jpg" alt="Photo" />',
		});
		const diagnostics = missingImageDimensions.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("width and height");
	});

	it("should not flag img with both width and height", () => {
		const ctx = makeContext({
			"src/Card.tsx": '<img src="/photo.jpg" width="400" height="300" alt="Photo" />',
		});
		const diagnostics = missingImageDimensions.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should detect img with only width", () => {
		const ctx = makeContext({
			"src/Card.tsx": '<img src="/photo.jpg" width="400" alt="Photo" />',
		});
		const diagnostics = missingImageDimensions.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("height");
	});

	it("should not flag img with aspect-ratio", () => {
		const ctx = makeContext({
			"src/Card.tsx": '<img src="/photo.jpg" style="aspect-ratio: 16/9" alt="Photo" />',
		});
		const diagnostics = missingImageDimensions.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should skip non-component files", () => {
		const ctx = makeContext({
			"src/utils.ts": "const html = '<img src=\"/photo.jpg\" />'",
		});
		const diagnostics = missingImageDimensions.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});
});
