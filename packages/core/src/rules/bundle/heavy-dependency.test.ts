import { describe, expect, it } from "vitest";
import type { ProjectContext, RuleContext } from "../../types/index.js";
import { heavyDependency } from "./heavy-dependency.js";

function makeContext(deps: Record<string, string>): RuleContext {
	return {
		project: {
			root: "/test",
			packageJson: { dependencies: deps },
		} as ProjectContext,
		files: new Map(),
		getAST: () => ({}),
		getDependencyGraph: () => ({ nodes: new Map() }),
		getConfig: () => undefined,
		report: () => {},
	};
}

describe("bundle/heavy-dependency", () => {
	it("should detect moment.js", () => {
		const ctx = makeContext({ moment: "^2.30.0", react: "^19.0.0" });
		const diagnostics = heavyDependency.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("moment");
		expect(diagnostics[0]?.message).toContain("dayjs");
	});

	it("should detect multiple heavy deps", () => {
		const ctx = makeContext({
			moment: "^2.30.0",
			lodash: "^4.17.0",
			jquery: "^3.7.0",
		});
		const diagnostics = heavyDependency.detect(ctx);
		expect(diagnostics).toHaveLength(3);
	});

	it("should not flag non-heavy deps", () => {
		const ctx = makeContext({ react: "^19.0.0", "react-dom": "^19.0.0" });
		const diagnostics = heavyDependency.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should also check devDependencies", () => {
		const ctx: RuleContext = {
			project: {
				root: "/test",
				packageJson: {
					dependencies: {},
					devDependencies: { chalk: "^5.0.0" },
				},
			} as ProjectContext,
			files: new Map(),
			getAST: () => ({}),
			getDependencyGraph: () => ({ nodes: new Map() }),
			getConfig: () => undefined,
			report: () => {},
		};
		const diagnostics = heavyDependency.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("picocolors");
	});
});
