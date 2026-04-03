import { describe, expect, it } from "vitest";
import { useNextImage } from "./use-next-image.js";
import type { ProjectContext, RuleContext } from "@speedlint/core";

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

describe("nextjs/use-next-image", () => {
	it("should detect native img usage", () => {
		const ctx = makeContext({
			"src/Hero.tsx": '<img src="/hero.jpg" alt="Hero" />',
		});
		const diagnostics = useNextImage.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("next/image");
	});

	it("should not flag if next/image is imported", () => {
		const ctx = makeContext({
			"src/Hero.tsx": "import Image from 'next/image'\n<Image src='/hero.jpg' />",
		});
		const diagnostics = useNextImage.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should skip non-tsx files", () => {
		const ctx = makeContext({
			"src/config.ts": 'const img = "<img src=test />"',
		});
		const diagnostics = useNextImage.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});
});
