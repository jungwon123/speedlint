import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

const NEXT_DYNAMIC_PATTERN = /dynamic\s*\(\s*\(\)\s*=>\s*import\s*\(/g;
const SSR_FALSE_PATTERN = /ssr\s*:\s*false/;

/**
 * Detects next/dynamic without ssr: false for client-only components (potential hydration mismatch).
 */
export const noSyncDynamicUsage = createRule({
	meta: {
		id: "nextjs/no-sync-dynamic-usage",
		category: "fcp",
		severity: "info",
		description: "Consider ssr: false for client-only dynamic imports to avoid hydration issues",
		docs: "https://speedlint.dev/rules/nextjs/no-sync-dynamic-usage",
		fixable: false,
		frameworks: ["nextjs"],
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!/\.(tsx|jsx|ts|js)$/.test(filePath)) continue;
			if (!file.content.includes("next/dynamic")) continue;

			const regex = new RegExp(NEXT_DYNAMIC_PATTERN.source, NEXT_DYNAMIC_PATTERN.flags);
			const matches = file.content.matchAll(regex);

			for (const match of matches) {
				// Check if this dynamic call has ssr: false nearby
				const endIndex = Math.min((match.index ?? 0) + 200, file.content.length);
				const surroundingCode = file.content.substring(match.index ?? 0, endIndex);

				if (SSR_FALSE_PATTERN.test(surroundingCode)) continue;

				// Check if the component uses browser APIs (window, document, localStorage)
				const componentImport = surroundingCode.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
				if (!componentImport) continue;

				const lineNumber = file.content.substring(0, match.index).split("\n").length;

				diagnostics.push({
					ruleId: "nextjs/no-sync-dynamic-usage",
					severity: "info",
					message: "Dynamic import without ssr: false",
					detail: "If this component uses browser APIs (window, document), add { ssr: false } to avoid hydration mismatch",
					file: filePath,
					line: lineNumber,
					impact: {
						metric: "FCP",
						estimated: "prevents hydration errors",
						confidence: "low",
					},
				});
			}
		}

		return diagnostics;
	},
});
