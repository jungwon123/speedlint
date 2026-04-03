import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

const STATIC_IMPORT_COMPONENT = /import\s+(\w+)\s+from\s+['"]\.\/(?:views|pages)\/([^'"]+)['"]/g;

/**
 * Detects view/page components imported statically that should use defineAsyncComponent.
 */
export const asyncComponentLoading = createRule({
	meta: {
		id: "vue/async-component-loading",
		category: "bundle",
		severity: "warning",
		description: "Route-level components should use defineAsyncComponent or dynamic import",
		docs: "https://speedlint.dev/rules/vue/async-component-loading",
		fixable: false,
		frameworks: ["vue", "nuxt"],
	},
	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		for (const [filePath, file] of context.files) {
			if (!/\.(ts|js|vue)$/.test(filePath)) continue;
			if (!file.content.includes("createRouter") && !filePath.includes("router")) continue;
			const regex = new RegExp(STATIC_IMPORT_COMPONENT.source, STATIC_IMPORT_COMPONENT.flags);
			for (const match of file.content.matchAll(regex)) {
				const componentName = match[1];
				const line = file.content.substring(0, match.index).split("\n").length;
				diagnostics.push({
					ruleId: "vue/async-component-loading",
					severity: "warning",
					message: `'${componentName}' should use dynamic import for code-splitting`,
					detail: `Replace with: () => import('./views/${match[2]}') in route definition`,
					file: filePath,
					line,
					impact: { metric: "bundleSize", estimated: "reduces initial bundle", confidence: "medium" },
				});
			}
		}
		return diagnostics;
	},
});
