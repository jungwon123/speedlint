import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

const ANON_EXPORT_PATTERNS = [
	/export\s+default\s+function\s*\(/g,
	/export\s+default\s+\(\s*\)/g,
	/export\s+default\s+\(\s*\w+\s*\)\s*=>/g,
	/export\s+default\s+\(\s*\{/g,
];

/**
 * Detects anonymous default exports which hurt React DevTools debugging and Fast Refresh.
 */
export const noAnonymousDefaultExport = createRule({
	meta: {
		id: "react/no-anonymous-default-export",
		category: "general",
		severity: "warning",
		description:
			"Components should have named default exports for better debugging and Fast Refresh",
		docs: "https://speedlint.dev/rules/react/no-anonymous-default-export",
		fixable: false,
		frameworks: ["react", "nextjs"],
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!/\.(tsx|jsx)$/.test(filePath)) continue;

			for (const pattern of ANON_EXPORT_PATTERNS) {
				const regex = new RegExp(pattern.source, pattern.flags);
				const matches = file.content.matchAll(regex);

				for (const match of matches) {
					const lineNumber = file.content.substring(0, match.index).split("\n").length;

					diagnostics.push({
						ruleId: "react/no-anonymous-default-export",
						severity: "warning",
						message: "Anonymous default export detected",
						detail:
							"Name your default export for better debugging in React DevTools and reliable Fast Refresh",
						file: filePath,
						line: lineNumber,
						impact: {
							metric: "TBT",
							estimated: "improves DX",
							confidence: "high",
						},
					});
					break; // One per file is enough
				}
			}
		}

		return diagnostics;
	},
});
