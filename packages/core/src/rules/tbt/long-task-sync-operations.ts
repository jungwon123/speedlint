import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext } from "../../types/index.js";

interface SyncPattern {
	pattern: RegExp;
	message: string;
	detail: string;
}

const SYNC_PATTERNS: SyncPattern[] = [
	{
		pattern: /JSON\.parse\s*\([^)]{50,}\)/g,
		message: "Large JSON.parse() in render path",
		detail: "Move large JSON parsing to a Web Worker or use streaming JSON parser",
	},
	{
		pattern: /localStorage\.(getItem|setItem)\s*\(/g,
		message: "Synchronous localStorage access",
		detail: "localStorage is synchronous and blocks the main thread. Consider using an async storage wrapper",
	},
	{
		pattern: /document\.querySelectorAll\s*\([^)]+\)[\s\S]{0,20}\.forEach/g,
		message: "DOM traversal with forEach in render path",
		detail: "Large DOM queries can block the main thread. Consider using IntersectionObserver or batching",
	},
	{
		pattern: /new RegExp\s*\([^)]{100,}\)/g,
		message: "Complex RegExp construction in render path",
		detail: "Move complex regex to module scope or pre-compile it to avoid main thread blocking",
	},
];

/**
 * Detects synchronous operations in main render path that cause long tasks (TBT).
 */
export const longTaskSyncOperations = createRule({
	meta: {
		id: "tbt/long-task-sync-operations",
		category: "tbt",
		severity: "warning",
		description: "Detect synchronous operations that may cause long tasks on the main thread",
		docs: "https://speedlint.dev/rules/tbt/long-task-sync-operations",
		fixable: false,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!/\.(ts|tsx|js|jsx|mjs)$/.test(filePath)) continue;

			for (const { pattern, message, detail } of SYNC_PATTERNS) {
				const regex = new RegExp(pattern.source, pattern.flags);
				const matches = file.content.matchAll(regex);

				for (const match of matches) {
					const lineNumber = file.content.substring(0, match.index).split("\n").length;

					diagnostics.push({
						ruleId: "tbt/long-task-sync-operations",
						severity: "warning",
						message,
						detail,
						file: filePath,
						line: lineNumber,
						impact: {
							metric: "TBT",
							estimated: "+50-200ms",
							confidence: "low",
						},
					});
				}
			}
		}

		return diagnostics;
	},
});
