import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext } from "../../types/index.js";

const PRELOAD_PATTERN = /<link[^>]*rel\s*=\s*["']preload["'][^>]*>/gi;
const FONT_FACE_PATTERN = /@font-face\s*\{[^}]*src:\s*url\(['"]?([^'")]+)['"]?\)/gi;
const PRECONNECT_PATTERN = /<link[^>]*rel\s*=\s*["']preconnect["'][^>]*>/gi;
const GOOGLE_FONTS_PATTERN = /fonts\.googleapis\.com/;

/**
 * Detects critical resources (hero images, web fonts) that lack <link rel="preload">.
 */
export const missingPreload = createRule({
	meta: {
		id: "lcp/missing-preload",
		category: "lcp",
		severity: "warning",
		description: "Critical resources should be preloaded",
		docs: "https://speedlint.dev/rules/lcp/missing-preload",
		fixable: true,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!isHtmlOrHeadFile(filePath)) continue;

			const hasPreloads = PRELOAD_PATTERN.test(file.content);

			// Check for Google Fonts without preconnect
			if (GOOGLE_FONTS_PATTERN.test(file.content)) {
				const hasPreconnect = PRECONNECT_PATTERN.test(file.content);
				if (!hasPreconnect) {
					diagnostics.push({
						ruleId: "lcp/missing-preload",
						severity: "warning",
						message: "Google Fonts loaded without preconnect",
						detail:
							'Add <link rel="preconnect" href="https://fonts.googleapis.com"> before the font stylesheet',
						file: filePath,
						impact: {
							metric: "LCP",
							estimated: "-100-200ms",
							confidence: "high",
						},
					});
				}
			}

			// Check for @font-face with url() but no preload for fonts
			const fontMatches = file.content.matchAll(FONT_FACE_PATTERN);
			for (const match of fontMatches) {
				const fontUrl = match[1];
				if (!fontUrl) continue;

				// Check if this font is preloaded
				if (!hasPreloads || !file.content.includes(fontUrl)) {
					diagnostics.push({
						ruleId: "lcp/missing-preload",
						severity: "warning",
						message: `Web font not preloaded: ${fontUrl}`,
						detail: `Add <link rel="preload" href="${fontUrl}" as="font" type="font/woff2" crossorigin> in <head>`,
						file: filePath,
						impact: {
							metric: "LCP",
							estimated: "-100-300ms",
							confidence: "medium",
						},
					});
				}
			}
		}

		return diagnostics;
	},
});

function isHtmlOrHeadFile(filePath: string): boolean {
	return (
		/\.(html|htm)$/.test(filePath) ||
		/layout\.(tsx|jsx|ts|js)$/.test(filePath) ||
		/document\.(tsx|jsx|ts|js)$/.test(filePath) ||
		/app\.(tsx|jsx|ts|js)$/.test(filePath) ||
		/_app\.(tsx|jsx|ts|js)$/.test(filePath) ||
		/_document\.(tsx|jsx|ts|js)$/.test(filePath)
	);
}
