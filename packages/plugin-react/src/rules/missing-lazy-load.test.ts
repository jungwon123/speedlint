import { describe, expect, it } from "vitest";
import { missingLazyLoad } from "./missing-lazy-load.js";
import type { ProjectContext, RuleContext } from "@speedlint/core";

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

describe("react/missing-lazy-load", () => {
	it("should detect static imports used as Route components", () => {
		const ctx = makeContext({
			"src/App.tsx": [
				"import Home from './pages/Home'",
				"import About from './pages/About'",
				"<Route component={Home} />",
				"<Route component={About} />",
			].join("\n"),
		});
		const diagnostics = missingLazyLoad.detect(ctx);
		expect(diagnostics).toHaveLength(2);
		expect(diagnostics[0]?.message).toContain("Home");
	});

	it("should not flag if React.lazy is already used", () => {
		const ctx = makeContext({
			"src/App.tsx": [
				"const Home = React.lazy(() => import('./pages/Home'))",
				"<Route component={Home} />",
			].join("\n"),
		});
		const diagnostics = missingLazyLoad.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should not flag files without routes", () => {
		const ctx = makeContext({
			"src/Card.tsx": "import Button from './Button'\n<Button />",
		});
		const diagnostics = missingLazyLoad.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});
});
