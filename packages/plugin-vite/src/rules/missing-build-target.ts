import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

/**
 * Detects vite config without explicit build.target — defaults may include unnecessary polyfills.
 */
export const missingBuildTarget = createRule({
	meta: {
		id: "vite/missing-build-target",
		category: "bundle",
		severity: "info",
		description: "Set explicit build.target to avoid unnecessary polyfills",
		docs: "https://speedlint.dev/rules/vite/missing-build-target",
		fixable: false,
	},
	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		for (const [filePath, file] of context.files) {
			if (!/vite\.config\.(ts|js|mts|mjs)$/.test(filePath)) continue;
			if (!file.content.includes("target")) {
				diagnostics.push({
					ruleId: "vite/missing-build-target",
					severity: "info",
					message: "Vite config missing build.target",
					detail:
						"Set build.target to your minimum browser support (e.g., 'es2022') to avoid unnecessary polyfills",
					file: filePath,
					impact: { metric: "bundleSize", estimated: "-5-20KB", confidence: "medium" },
				});
			}
		}
		return diagnostics;
	},
});
