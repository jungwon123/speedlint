import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

/**
 * Detects webpack config without compression plugin (gzip/brotli).
 */
export const missingCompression = createRule({
	meta: {
		id: "webpack/missing-compression",
		category: "general",
		severity: "info",
		description: "Consider adding compression plugin for gzip/brotli output",
		docs: "https://speedlint.dev/rules/webpack/missing-compression",
		fixable: false,
	},
	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		for (const [filePath, file] of context.files) {
			if (!/webpack\.config\.(js|ts|mjs)$/.test(filePath)) continue;
			if (
				!file.content.includes("CompressionPlugin") &&
				!file.content.includes("compression-webpack-plugin")
			) {
				diagnostics.push({
					ruleId: "webpack/missing-compression",
					severity: "info",
					message: "No compression plugin detected in webpack config",
					detail:
						"Add compression-webpack-plugin for gzip/brotli pre-compression to reduce transfer size",
					file: filePath,
					impact: { metric: "bundleSize", estimated: "-60-80% transfer size", confidence: "high" },
				});
			}
		}
		return diagnostics;
	},
});
