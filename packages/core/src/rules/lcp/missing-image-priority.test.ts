import { describe, expect, it } from "vitest";
import { missingImagePriority } from "./missing-image-priority.js";
import type { ProjectContext, RuleContext } from "../../types/index.js";

function makeContext(
	files: Record<string, string>,
	framework: "react" | "nextjs" | null = "react",
): RuleContext {
	const fileMap = new Map(
		Object.entries(files).map(([path, content]) => [path, { content, mtime: 0 }]),
	);
	return {
		project: { root: "/test", framework, packageJson: {} } as ProjectContext,
		files: fileMap,
		getAST: () => ({}),
		getDependencyGraph: () => ({ nodes: new Map() }),
		getConfig: () => undefined,
		report: () => {},
	};
}

describe("lcp/missing-image-priority", () => {
	it("should detect img without fetchpriority in page file", () => {
		const ctx = makeContext({
			"src/pages/index.tsx": '<img src="/hero.jpg" alt="Hero" />',
		});
		const diagnostics = missingImagePriority.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("fetchpriority");
	});

	it("should detect img with loading=lazy", () => {
		const ctx = makeContext({
			"src/app/page.tsx": '<img src="/hero.jpg" loading="lazy" alt="Hero" />',
		});
		const diagnostics = missingImagePriority.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("loading=\"lazy\"");
	});

	it("should not flag img with fetchpriority=high", () => {
		const ctx = makeContext({
			"src/app/page.tsx": '<img src="/hero.jpg" fetchpriority="high" alt="Hero" />',
		});
		const diagnostics = missingImagePriority.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should detect Next.js Image without priority prop", () => {
		const ctx = makeContext({
			"src/app/page.tsx": '<Image src="/hero.jpg" width={1200} height={600} />',
		}, "nextjs");
		const diagnostics = missingImagePriority.detect(ctx);
		expect(diagnostics.some((d) => d.message.includes("priority prop"))).toBe(true);
	});

	it("should not flag non-page files", () => {
		const ctx = makeContext({
			"src/components/Card.tsx": '<img src="/card.jpg" alt="Card" />',
		});
		const diagnostics = missingImagePriority.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});
});
