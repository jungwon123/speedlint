import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

const STATIC_IMPORT_PATTERN = /^import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/gm;
const ROUTE_COMPONENT_PATTERN = /<Route[^>]*component\s*=\s*\{(\w+)\}/g;
const LAZY_PATTERN = /React\.lazy|lazy\(/;

/**
 * Detects route-level components imported statically that should use React.lazy().
 */
export const missingLazyLoad = createRule({
	meta: {
		id: "react/missing-lazy-load",
		category: "bundle",
		severity: "warning",
		description: "Route-level components should use React.lazy() for code-splitting",
		docs: "https://speedlint.dev/rules/react/missing-lazy-load",
		fixable: false,
		frameworks: ["react", "nextjs"],
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!/\.(tsx|jsx)$/.test(filePath)) continue;

			// Check if file uses React Router routes
			const hasRoutes =
				file.content.includes("<Route") || file.content.includes("createBrowserRouter");
			if (!hasRoutes) continue;

			// Check if any lazy imports exist
			if (LAZY_PATTERN.test(file.content)) continue;

			// Find static imports that are used as route components
			const importRegex = new RegExp(STATIC_IMPORT_PATTERN.source, STATIC_IMPORT_PATTERN.flags);
			const imports = new Map<string, { source: string; line: number }>();

			for (const match of file.content.matchAll(importRegex)) {
				const name = match[1];
				const source = match[2];
				if (name && source && source.startsWith(".")) {
					const line = file.content.substring(0, match.index).split("\n").length;
					imports.set(name, { source, line });
				}
			}

			// Check Route components
			const routeRegex = new RegExp(ROUTE_COMPONENT_PATTERN.source, ROUTE_COMPONENT_PATTERN.flags);
			for (const match of file.content.matchAll(routeRegex)) {
				const componentName = match[1];
				if (componentName && imports.has(componentName)) {
					const imp = imports.get(componentName);
					diagnostics.push({
						ruleId: "react/missing-lazy-load",
						severity: "warning",
						message: `Route component '${componentName}' should use React.lazy()`,
						detail: `Replace static import with: const ${componentName} = React.lazy(() => import('${imp?.source}'))`,
						file: filePath,
						line: imp?.line,
						impact: {
							metric: "bundleSize",
							estimated: "reduces initial bundle",
							confidence: "medium",
						},
					});
				}
			}
		}

		return diagnostics;
	},
});
