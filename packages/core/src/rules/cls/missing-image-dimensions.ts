import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext, Transform } from "../../types/index.js";

const IMG_TAG_PATTERN = /<img\s[^>]*>/gi;
const WIDTH_PATTERN = /\bwidth\s*=\s*["']?\d+/i;
const HEIGHT_PATTERN = /\bheight\s*=\s*["']?\d+/i;
const STYLE_ASPECT_RATIO = /aspect-ratio/i;

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

			const matches = file.content.matchAll(new RegExp(IMG_TAG_PATTERN.source, IMG_TAG_PATTERN.flags));
			for (const match of matches) {
				const tag = match[0];
				const hasWidth = WIDTH_PATTERN.test(tag);
				const hasHeight = HEIGHT_PATTERN.test(tag);
				const hasAspectRatio = STYLE_ASPECT_RATIO.test(tag);

				if (hasAspectRatio) continue;
				if (hasWidth && hasHeight) continue;

				const matchIndex = match.index ?? 0;
				const lineNumber = file.content.substring(0, matchIndex).split("\n").length;
				const missing = !hasWidth && !hasHeight
					? "width and height"
					: !hasWidth ? "width" : "height";

				const fixFilePath = filePath;
				const fixContent = file.content;
				const fixMatchIndex = matchIndex;
				const fixTag = tag;

				diagnostics.push({
					ruleId: "cls/missing-image-dimensions",
					severity: "error",
					message: `<img> missing ${missing} attribute`,
					detail: "Add explicit width and height attributes to prevent Cumulative Layout Shift",
					file: filePath,
					line: lineNumber,
					impact: { metric: "CLS", estimated: "-0.1-0.25", confidence: "high" },
					fix: (): Transform[] => {
						let newTag = fixTag;
						if (!WIDTH_PATTERN.test(newTag)) {
							newTag = newTag.replace(/<img\s/, '<img width="300" ');
						}
						if (!HEIGHT_PATTERN.test(newTag)) {
							newTag = newTag.replace(/<img\s/, '<img height="200" ');
						}
						const line = fixContent.substring(0, fixMatchIndex).split("\n").length;
						const lineStart = fixContent.lastIndexOf("\n", fixMatchIndex) + 1;
						const col = fixMatchIndex - lineStart;
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

function isComponentFile(filePath: string): boolean {
	return /\.(tsx|jsx|html|htm|vue|svelte)$/.test(filePath);
}
