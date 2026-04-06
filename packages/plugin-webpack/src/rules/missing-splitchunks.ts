import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

/**
 * Detects webpack config without splitChunks optimization.
 */
export const missingSplitChunks = createRule({
	meta: {
		id: "webpack/missing-splitchunks",
		category: "bundle",
		severity: "warning",
		description: "Enable splitChunks for better caching and smaller initial bundles",
		docs: "https://speedlint.dev/rules/webpack/missing-splitchunks",
		fixable: false,
	},
	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		for (const [filePath, file] of context.files) {
			if (!/webpack\.config\.(js|ts|mjs)$/.test(filePath)) continue;
			if (!file.content.includes("splitChunks")) {
				diagnostics.push({
					ruleId: "webpack/missing-splitchunks",
					severity: "warning",
					message: "Webpack config missing optimization.splitChunks",
					detail:
						"Add optimization.splitChunks to split vendor code into separate chunks for better caching",
					file: filePath,
					impact: { metric: "bundleSize", estimated: "improves caching", confidence: "high" },
				});
			}
		}
		return diagnostics;
	},
});
