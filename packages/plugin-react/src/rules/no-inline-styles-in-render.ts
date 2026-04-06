import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

const INLINE_STYLE_PATTERN = /style\s*=\s*\{\s*\{[^}]*\}\s*\}/g;

/**
 * Detects inline style objects created during render (causes unnecessary re-renders).
 */
export const noInlineStylesInRender = createRule({
	meta: {
		id: "react/no-inline-styles-in-render",
		category: "general",
		severity: "warning",
		description: "Avoid creating inline style objects in render — extract to constants or useMemo",
		docs: "https://speedlint.dev/rules/react/no-inline-styles-in-render",
		fixable: false,
		frameworks: ["react", "nextjs"],
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!/\.(tsx|jsx)$/.test(filePath)) continue;

			const regex = new RegExp(INLINE_STYLE_PATTERN.source, INLINE_STYLE_PATTERN.flags);
			const matches = file.content.matchAll(regex);

			for (const match of matches) {
				const lineNumber = file.content.substring(0, match.index).split("\n").length;

				diagnostics.push({
					ruleId: "react/no-inline-styles-in-render",
					severity: "warning",
					message: "Inline style object created in render",
					detail:
						"Inline style objects create new references on every render, causing unnecessary re-renders. Extract to a constant or use useMemo",
					file: filePath,
					line: lineNumber,
					impact: {
						metric: "TBT",
						estimated: "reduces re-renders",
						confidence: "medium",
					},
				});
			}
		}

		return diagnostics;
	},
});
