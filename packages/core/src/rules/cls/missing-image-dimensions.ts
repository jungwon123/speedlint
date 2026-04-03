import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext } from "../../types/index.js";

const IMG_TAG_PATTERN = /<img\s[^>]*>/gi;
const WIDTH_PATTERN = /\bwidth\s*=\s*["']?\d+/i;
const HEIGHT_PATTERN = /\bheight\s*=\s*["']?\d+/i;
const STYLE_ASPECT_RATIO = /aspect-ratio/i;

/**
 * Detects <img> tags without explicit width and height attributes (causes CLS).
 */
export const missingImageDimensions = createRule({
	meta: {
		id: "cls/missing-image-dimensions",
		category: "cls",
		severity: "error",
		description: "Images must have explicit width and height to prevent layout shift",
		docs: "https://speedlint.dev/rules/cls/missing-image-dimensions",
		fixable: true,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!isComponentFile(filePath)) continue;

			const matches = file.content.matchAll(IMG_TAG_PATTERN);
			for (const match of matches) {
				const tag = match[0];
				const hasWidth = WIDTH_PATTERN.test(tag);
				const hasHeight = HEIGHT_PATTERN.test(tag);
				const hasAspectRatio = STYLE_ASPECT_RATIO.test(tag);

				if (hasAspectRatio) continue;
				if (hasWidth && hasHeight) continue;

				const lineNumber = file.content.substring(0, match.index).split("\n").length;
				const missing = !hasWidth && !hasHeight
					? "width and height"
					: !hasWidth ? "width" : "height";

				diagnostics.push({
					ruleId: "cls/missing-image-dimensions",
					severity: "error",
					message: `<img> missing ${missing} attribute`,
					detail: "Add explicit width and height attributes to prevent Cumulative Layout Shift",
					file: filePath,
					line: lineNumber,
					impact: {
						metric: "CLS",
						estimated: "-0.1-0.25",
						confidence: "high",
					},
				});
			}
		}

		return diagnostics;
	},
});

function isComponentFile(filePath: string): boolean {
	return /\.(tsx|jsx|html|htm|vue|svelte)$/.test(filePath);
}
