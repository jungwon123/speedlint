import { describe, expect, it } from "vitest";
import { unusedDependency } from "./unused-dependency.js";
import type { ProjectContext, RuleContext } from "../../types/index.js";

function makeContext(
	deps: Record<string, string>,
	files: Record<string, string>,
): RuleContext {
	const fileMap = new Map(
		Object.entries(files).map(([path, content]) => [path, { content, mtime: 0 }]),
	);
	return {
		project: {
			root: "/test",
			packageJson: { dependencies: deps },
		} as ProjectContext,
		files: fileMap,
		getAST: () => ({}),
		getDependencyGraph: () => ({ nodes: new Map() }),
		getConfig: () => undefined,
		report: () => {},
	};
}

describe("bundle/unused-dependency", () => {
	it("should detect unused dependencies", () => {
		const ctx = makeContext(
			{ react: "^19.0.0", "unused-pkg": "^1.0.0" },
			{ "src/app.ts": "import React from 'react'" },
		);
		const diagnostics = unusedDependency.detect(ctx);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.message).toContain("unused-pkg");
	});

	it("should not flag used dependencies", () => {
		const ctx = makeContext(
			{ react: "^19.0.0", axios: "^1.0.0" },
			{
				"src/app.ts": "import React from 'react'",
				"src/api.ts": "import axios from 'axios'",
			},
		);
		const diagnostics = unusedDependency.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should handle scoped packages", () => {
		const ctx = makeContext(
			{ "@tanstack/react-query": "^5.0.0" },
			{ "src/app.ts": "import { useQuery } from '@tanstack/react-query'" },
		);
		const diagnostics = unusedDependency.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should handle require() syntax", () => {
		const ctx = makeContext(
			{ express: "^4.0.0" },
			{ "src/server.js": "const express = require('express')" },
		);
		const diagnostics = unusedDependency.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should skip implicit deps like typescript", () => {
		const ctx = makeContext(
			{ typescript: "^5.7.0" },
			{ "src/app.ts": "const x = 1" },
		);
		const diagnostics = unusedDependency.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});

	it("should handle subpath imports", () => {
		const ctx = makeContext(
			{ lodash: "^4.17.0" },
			{ "src/utils.ts": "import debounce from 'lodash/debounce'" },
		);
		const diagnostics = unusedDependency.detect(ctx);
		expect(diagnostics).toHaveLength(0);
	});
});
