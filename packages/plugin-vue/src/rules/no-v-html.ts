import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

const V_HTML_PATTERN = /v-html\s*=\s*["'][^"']*["']/g;

/**
 * Detects v-html usage which is a security risk (XSS) and prevents SSR optimization.
 */
export const noVHtml = createRule({
	meta: {
		id: "vue/no-v-html",
		category: "general",
		severity: "warning",
		description: "Avoid v-html — security risk (XSS) and prevents SSR optimization",
		docs: "https://speedlint.dev/rules/vue/no-v-html",
		fixable: false,
		frameworks: ["vue", "nuxt"],
	},
	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		for (const [filePath, file] of context.files) {
			if (!/\.(vue|html)$/.test(filePath)) continue;
			const regex = new RegExp(V_HTML_PATTERN.source, V_HTML_PATTERN.flags);
			for (const match of file.content.matchAll(regex)) {
				const line = file.content.substring(0, match.index).split("\n").length;
				diagnostics.push({
					ruleId: "vue/no-v-html",
					severity: "warning",
					message: "v-html usage detected — XSS risk and prevents SSR optimization",
					detail: "Use text interpolation or a sanitized HTML component instead of v-html",
					file: filePath,
					line,
					impact: { metric: "FCP", estimated: "security + SSR", confidence: "high" },
				});
			}
		}
		return diagnostics;
	},
});
