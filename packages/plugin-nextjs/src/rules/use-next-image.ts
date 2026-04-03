import { createRule } from "@speedlint/core";
import type { Diagnostic, RuleContext } from "@speedlint/core";

const IMG_TAG_PATTERN = /<img\s[^>]*src\s*=\s*["'][^"']+["'][^>]*>/gi;
const NEXT_IMAGE_IMPORT = /from\s+['"]next\/image['"]/;

/**
 * Detects native <img> usage in Next.js projects — should use next/image for automatic optimization.
 */
export const useNextImage = createRule({
	meta: {
		id: "nextjs/use-next-image",
		category: "lcp",
		severity: "warning",
		description: "Use next/image instead of <img> for automatic image optimization",
		docs: "https://speedlint.dev/rules/nextjs/use-next-image",
		fixable: false,
		frameworks: ["nextjs"],
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!/\.(tsx|jsx)$/.test(filePath)) continue;
			// Skip if already using next/image
			if (NEXT_IMAGE_IMPORT.test(file.content)) continue;

			const regex = new RegExp(IMG_TAG_PATTERN.source, IMG_TAG_PATTERN.flags);
			const matches = file.content.matchAll(regex);

			for (const match of matches) {
				const lineNumber = file.content.substring(0, match.index).split("\n").length;

				diagnostics.push({
					ruleId: "nextjs/use-next-image",
					severity: "warning",
					message: "Use next/image instead of <img> for automatic optimization",
					detail: "next/image provides automatic lazy loading, responsive sizes, WebP/AVIF conversion, and blur placeholders",
					file: filePath,
					line: lineNumber,
					impact: {
						metric: "LCP",
						estimated: "-100-300ms",
						confidence: "medium",
					},
				});
				break; // One warning per file
			}
		}

		return diagnostics;
	},
});
