import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext } from "../../types/index.js";

// Patterns for images that are likely LCP candidates (hero images, first large image)
const IMG_TAG_PATTERN = /<img\s[^>]*>/gi;
const IMAGE_COMPONENT_PATTERN = /<Image\s[^>]*>/gi;
const LOADING_LAZY_PATTERN = /loading\s*=\s*["']lazy["']/i;
const FETCHPRIORITY_PATTERN = /fetchpriority\s*=\s*["']high["']/i;
const PRIORITY_PROP_PATTERN = /\bpriority\b/;

/**
 * Detects LCP candidate images missing fetchpriority="high" or with loading="lazy".
 */
export const missingImagePriority = createRule({
	meta: {
		id: "lcp/missing-image-priority",
		category: "lcp",
		severity: "error",
		description: "LCP candidate images should have fetchpriority=\"high\" and not loading=\"lazy\"",
		docs: "https://speedlint.dev/rules/lcp/missing-image-priority",
		fixable: true,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		const isNextjs = context.project.framework === "nextjs";

		for (const [filePath, file] of context.files) {
			if (!isPageOrLayoutFile(filePath)) continue;

			// Check native <img> tags
			const imgMatches = file.content.matchAll(IMG_TAG_PATTERN);
			let imgIndex = 0;
			for (const match of imgMatches) {
				imgIndex++;
				// Only check first 2 images (likely above-fold / LCP candidates)
				if (imgIndex > 2) break;

				const tag = match[0];
				const lineNumber = file.content.substring(0, match.index).split("\n").length;

				if (LOADING_LAZY_PATTERN.test(tag)) {
					diagnostics.push({
						ruleId: "lcp/missing-image-priority",
						severity: "error",
						message: "LCP candidate image has loading=\"lazy\" which delays loading",
						detail: "Remove loading=\"lazy\" and add fetchpriority=\"high\" for above-fold images",
						file: filePath,
						line: lineNumber,
						impact: {
							metric: "LCP",
							estimated: "-200-500ms",
							confidence: "medium",
						},
					});
				} else if (!FETCHPRIORITY_PATTERN.test(tag)) {
					diagnostics.push({
						ruleId: "lcp/missing-image-priority",
						severity: "error",
						message: "LCP candidate image missing fetchpriority=\"high\"",
						detail: "Add fetchpriority=\"high\" to prioritize loading of above-fold images",
						file: filePath,
						line: lineNumber,
						impact: {
							metric: "LCP",
							estimated: "-100-300ms",
							confidence: "medium",
						},
					});
				}
			}

			// Check Next.js <Image> components
			if (isNextjs) {
				const imageMatches = file.content.matchAll(IMAGE_COMPONENT_PATTERN);
				let imageIndex = 0;
				for (const match of imageMatches) {
					imageIndex++;
					if (imageIndex > 2) break;

					const tag = match[0];
					const lineNumber = file.content.substring(0, match.index).split("\n").length;

					if (!PRIORITY_PROP_PATTERN.test(tag)) {
						diagnostics.push({
							ruleId: "lcp/missing-image-priority",
							severity: "error",
							message: "Next.js Image component missing priority prop",
							detail: "Add priority prop to the Image component for above-fold images",
							file: filePath,
							line: lineNumber,
							impact: {
								metric: "LCP",
								estimated: "-200-400ms",
								confidence: "medium",
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
