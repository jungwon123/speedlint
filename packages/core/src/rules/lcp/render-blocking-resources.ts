import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext, Transform } from "../../types/index.js";

const SYNC_SCRIPT_PATTERN = /<script\s[^>]*src\s*=\s*["'][^"']+["'][^>]*>/gi;
const ASYNC_PATTERN = /\basync\b/i;
const DEFER_PATTERN = /\bdefer\b/i;
const TYPE_MODULE_PATTERN = /type\s*=\s*["']module["']/i;

export const renderBlockingResources = createRule({
	meta: {
		id: "lcp/render-blocking-resources",
		category: "lcp",
		severity: "error",
		description: "Scripts in <head> should use async or defer to avoid render blocking",
		docs: "https://speedlint.dev/rules/lcp/render-blocking-resources",
		fixable: true,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!/\.(html|htm)$/.test(filePath)) continue;

			const headMatch = file.content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
			if (!headMatch) continue;

			const headContent = headMatch[1] ?? "";
			const headStart = file.content.indexOf(headContent);

			const scriptMatches = headContent.matchAll(new RegExp(SYNC_SCRIPT_PATTERN.source, SYNC_SCRIPT_PATTERN.flags));
			for (const match of scriptMatches) {
				const tag = match[0];

				if (ASYNC_PATTERN.test(tag) || DEFER_PATTERN.test(tag) || TYPE_MODULE_PATTERN.test(tag)) {
					continue;
				}

				const absIndex = headStart + (match.index ?? 0);
				const lineNumber = file.content.substring(0, absIndex).split("\n").length;

				const fixFilePath = filePath;
				const fixContent = file.content;
				const fixAbsIndex = absIndex;
				const fixTag = tag;

				diagnostics.push({
					ruleId: "lcp/render-blocking-resources",
					severity: "error",
					message: "Render-blocking script in <head>",
					detail: "Add defer or async attribute to prevent this script from blocking page rendering",
					file: filePath,
					line: lineNumber,
					impact: { metric: "LCP", estimated: "-100-500ms", confidence: "high" },
					fix: (): Transform[] => {
						const newTag = fixTag.replace(/<script\s/, "<script defer ");
						const line = fixContent.substring(0, fixAbsIndex).split("\n").length;
						const lineStart = fixContent.lastIndexOf("\n", fixAbsIndex) + 1;
						const col = fixAbsIndex - lineStart;
						return [{
							type: "replaceText",
							filePath: fixFilePath,
							range: {
								start: { line, column: col },
								end: { line, column: col + fixTag.length },
							},
							newText: newTag,
						}];
					},
				});
			}
		}

		return diagnostics;
	},
});
