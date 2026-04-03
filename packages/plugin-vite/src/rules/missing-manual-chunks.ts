import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

/**
 * Detects vite config without manualChunks for vendor splitting.
 */
export const missingManualChunks = createRule({
	meta: {
		id: "vite/missing-manual-chunks",
		category: "bundle",
		severity: "info",
		description: "Consider manualChunks for better vendor code splitting",
		docs: "https://speedlint.dev/rules/vite/missing-manual-chunks",
		fixable: false,
	},
	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		for (const [filePath, file] of context.files) {
			if (!/vite\.config\.(ts|js|mts|mjs)$/.test(filePath)) continue;
			if (!file.content.includes("manualChunks")) {
				diagnostics.push({
					ruleId: "vite/missing-manual-chunks",
					severity: "info",
					message: "Consider adding rollupOptions.output.manualChunks",
					detail: "Split vendor libraries into separate chunks for better long-term caching",
					file: filePath,
					impact: { metric: "bundleSize", estimated: "improves caching", confidence: "medium" },
				});
			}
		}
		return diagnostics;
	},
});
