import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

const HEAD_ELEMENT_PATTERN = /<head>/gi;
const NEXT_HEAD_IMPORT = /from\s+['"]next\/head['"]/;

/**
 * Detects native <head> usage in Next.js App Router — should use metadata API or generateMetadata.
 */
export const noHeadElement = createRule({
	meta: {
		id: "nextjs/no-head-element",
		category: "general",
		severity: "error",
		description: "Use Next.js metadata API instead of <head> element in App Router",
		docs: "https://speedlint.dev/rules/nextjs/no-head-element",
		fixable: false,
		frameworks: ["nextjs"],
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			// Only check App Router files (app/ directory)
			if (!filePath.includes("app/")) continue;
			if (!/\.(tsx|jsx)$/.test(filePath)) continue;

			// Check for next/head import (Pages Router pattern used in App Router)
			if (NEXT_HEAD_IMPORT.test(file.content)) {
				const line = file.content.split("\n").findIndex((l) => /from\s+['"]next\/head['"]/.test(l)) + 1;
				diagnostics.push({
					ruleId: "nextjs/no-head-element",
					severity: "error",
					message: "next/head should not be used in App Router",
					detail: "In App Router, use the metadata export or generateMetadata() instead of next/head",
					file: filePath,
					line,
					impact: {
						metric: "FCP",
						estimated: "improves SSR",
						confidence: "high",
					},
				});
				continue;
			}

			// Check for raw <head> element
			const regex = new RegExp(HEAD_ELEMENT_PATTERN.source, HEAD_ELEMENT_PATTERN.flags);
			const matches = file.content.matchAll(regex);

			for (const match of matches) {
				const lineNumber = file.content.substring(0, match.index).split("\n").length;

				diagnostics.push({
					ruleId: "nextjs/no-head-element",
					severity: "error",
					message: "Do not use <head> element in App Router components",
					detail: "Use the metadata export or generateMetadata() function instead",
					file: filePath,
					line: lineNumber,
					impact: {
						metric: "FCP",
						estimated: "improves SSR",
						confidence: "high",
					},
				});
				break;
			}
		}

		return diagnostics;
	},
});
