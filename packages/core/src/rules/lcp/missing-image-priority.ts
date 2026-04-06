import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext, Transform } from "../../types/index.js";

const IMG_TAG_PATTERN = /<img\s[^>]*>/gi;
const IMAGE_COMPONENT_PATTERN = /<Image\s[^>]*>/gi;
const LOADING_LAZY_PATTERN = /loading\s*=\s*["']lazy["']\s*/i;
const FETCHPRIORITY_PATTERN = /fetchpriority\s*=\s*["']high["']/i;
const PRIORITY_PROP_PATTERN = /\bpriority\b/;

export const missingImagePriority = createRule({
	meta: {
		id: "lcp/missing-image-priority",
		category: "lcp",
		severity: "error",
		description: 'LCP candidate images should have fetchpriority="high" and not loading="lazy"',
		docs: "https://speedlint.dev/rules/lcp/missing-image-priority",
		fixable: true,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		const isNextjs = context.project.framework === "nextjs";

		for (const [filePath, file] of context.files) {
			if (!isPageOrLayoutFile(filePath)) continue;

			const imgMatches = file.content.matchAll(
				new RegExp(IMG_TAG_PATTERN.source, IMG_TAG_PATTERN.flags),
			);
			let imgIndex = 0;
			for (const match of imgMatches) {
				imgIndex++;
				if (imgIndex > 2) break;

				const tag = match[0];
				const matchIndex = match.index ?? 0;
				const lineNumber = file.content.substring(0, matchIndex).split("\n").length;

				if (LOADING_LAZY_PATTERN.test(tag)) {
					const fixFilePath = filePath;
					const fixContent = file.content;
					const fixMatchIndex = matchIndex;
					const fixTag = tag;

					diagnostics.push({
						ruleId: "lcp/missing-image-priority",
						severity: "error",
						message: 'LCP candidate image has loading="lazy" which delays loading',
						detail: 'Remove loading="lazy" and add fetchpriority="high" for above-fold images',
						file: filePath,
						line: lineNumber,
						impact: { metric: "LCP", estimated: "-200-500ms", confidence: "medium" },
						fix: (): Transform[] => {
							let newTag = fixTag.replace(LOADING_LAZY_PATTERN, "");
							if (!FETCHPRIORITY_PATTERN.test(newTag)) {
								newTag = newTag.replace(/<img\s/, '<img fetchpriority="high" ');
							}
							const line = fixContent.substring(0, fixMatchIndex).split("\n").length;
							const lineStart = fixContent.lastIndexOf("\n", fixMatchIndex) + 1;
							const col = fixMatchIndex - lineStart;
							return [
								{
									type: "replaceText",
									filePath: fixFilePath,
									range: {
										start: { line, column: col },
										end: { line, column: col + fixTag.length },
									},
									newText: newTag,
								},
							];
						},
					});
				} else if (!FETCHPRIORITY_PATTERN.test(tag)) {
					const fixFilePath = filePath;
					const fixContent = file.content;
					const fixMatchIndex = matchIndex;
					const fixTag = tag;

					diagnostics.push({
						ruleId: "lcp/missing-image-priority",
						severity: "error",
						message: 'LCP candidate image missing fetchpriority="high"',
						detail: 'Add fetchpriority="high" to prioritize loading of above-fold images',
						file: filePath,
						line: lineNumber,
						impact: { metric: "LCP", estimated: "-100-300ms", confidence: "medium" },
						fix: (): Transform[] => {
							const newTag = fixTag.replace(/<img\s/, '<img fetchpriority="high" ');
							const line = fixContent.substring(0, fixMatchIndex).split("\n").length;
							const lineStart = fixContent.lastIndexOf("\n", fixMatchIndex) + 1;
							const col = fixMatchIndex - lineStart;
							return [
								{
									type: "replaceText",
									filePath: fixFilePath,
									range: {
										start: { line, column: col },
										end: { line, column: col + fixTag.length },
									},
									newText: newTag,
								},
							];
						},
					});
				}
			}

			if (isNextjs) {
				const imageMatches = file.content.matchAll(
					new RegExp(IMAGE_COMPONENT_PATTERN.source, IMAGE_COMPONENT_PATTERN.flags),
				);
				let imageIndex = 0;
				for (const match of imageMatches) {
					imageIndex++;
					if (imageIndex > 2) break;

					const tag = match[0];
					const matchIndex = match.index ?? 0;
					const lineNumber = file.content.substring(0, matchIndex).split("\n").length;

					if (!PRIORITY_PROP_PATTERN.test(tag)) {
						const fixFilePath = filePath;
						const fixContent = file.content;
						const fixMatchIndex = matchIndex;
						const fixTag = tag;

						diagnostics.push({
							ruleId: "lcp/missing-image-priority",
							severity: "error",
							message: "Next.js Image component missing priority prop",
							detail: "Add priority prop to the Image component for above-fold images",
							file: filePath,
							line: lineNumber,
							impact: { metric: "LCP", estimated: "-200-400ms", confidence: "medium" },
							fix: (): Transform[] => {
								const newTag = fixTag.replace(/<Image\s/, "<Image priority ");
								const line = fixContent.substring(0, fixMatchIndex).split("\n").length;
								const lineStart = fixContent.lastIndexOf("\n", fixMatchIndex) + 1;
								const col = fixMatchIndex - lineStart;
								return [
									{
										type: "replaceText",
										filePath: fixFilePath,
										range: {
											start: { line, column: col },
											end: { line, column: col + fixTag.length },
										},
										newText: newTag,
									},
								];
							},
						});
					}
				}
			}
		}

		return diagnostics;
	},
});

function isPageOrLayoutFile(filePath: string): boolean {
	const pagePatterns = [
		/page\.(tsx|jsx|ts|js)$/,
		/index\.(tsx|jsx|ts|js)$/,
		/layout\.(tsx|jsx|ts|js)$/,
		/app\.(tsx|jsx|ts|js)$/,
		/home\.(tsx|jsx|ts|js)$/,
		/landing\.(tsx|jsx|ts|js)$/,
	];
	const lower = filePath.toLowerCase();
	return pagePatterns.some((p) => p.test(lower));
}
