import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext } from "../../types/index.js";

const VIDEO_PATTERN = /<video\s[^>]*>/gi;
const IFRAME_PATTERN = /<iframe\s[^>]*>/gi;
const WIDTH_PATTERN = /\bwidth\s*=\s*["']?\d+/i;
const HEIGHT_PATTERN = /\bheight\s*=\s*["']?\d+/i;
const STYLE_ASPECT_RATIO = /aspect-ratio/i;

/**
 * Detects <video> and <iframe> elements without explicit dimensions.
 */
export const missingVideoDimensions = createRule({
	meta: {
		id: "cls/missing-video-dimensions",
		category: "cls",
		severity: "warning",
		description: "Video and iframe elements should have explicit dimensions",
		docs: "https://speedlint.dev/rules/cls/missing-video-dimensions",
		fixable: false,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!/\.(tsx|jsx|html|htm|vue|svelte)$/.test(filePath)) continue;

			checkElements(file.content, filePath, VIDEO_PATTERN, "video", diagnostics);
			checkElements(file.content, filePath, IFRAME_PATTERN, "iframe", diagnostics);
		}

		return diagnostics;
	},
});

function checkElements(
	content: string,
	filePath: string,
	pattern: RegExp,
	elementName: string,
	diagnostics: Diagnostic[],
): void {
	const regex = new RegExp(pattern.source, pattern.flags);
	const matches = content.matchAll(regex);

	for (const match of matches) {
		const tag = match[0];
		const hasWidth = WIDTH_PATTERN.test(tag);
		const hasHeight = HEIGHT_PATTERN.test(tag);
		const hasAspectRatio = STYLE_ASPECT_RATIO.test(tag);

		if (hasAspectRatio || (hasWidth && hasHeight)) continue;

		const lineNumber = content.substring(0, match.index).split("\n").length;

		diagnostics.push({
			ruleId: "cls/missing-video-dimensions",
			severity: "warning",
			message: `<${elementName}> missing explicit dimensions`,
			detail: `Add width and height attributes or aspect-ratio CSS to prevent layout shift`,
			file: filePath,
			line: lineNumber,
			impact: {
				metric: "CLS",
				estimated: "-0.1-0.3",
				confidence: "high",
			},
		});
	}
}
