import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext } from "../../types/index.js";

const SCRIPT_SRC_PATTERN = /<script\s[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
const ASYNC_DEFER_PATTERN = /\b(async|defer)\b/i;

const THIRD_PARTY_DOMAINS = [
	"googletagmanager.com",
	"google-analytics.com",
	"googleanalytics.com",
	"facebook.net",
	"connect.facebook.net",
	"platform.twitter.com",
	"analytics.tiktok.com",
	"snap.licdn.com",
	"cdn.segment.com",
	"cdn.amplitude.com",
	"cdn.heapanalytics.com",
	"js.intercomcdn.com",
	"widget.intercom.io",
	"js.driftt.com",
	"cdn.livechatinc.com",
	"static.hotjar.com",
	"cdn.mouseflow.com",
	"cdn.optimizely.com",
	"js.sentry-cdn.com",
	"browser.sentry-cdn.com",
	"cdn.cookielaw.org",
];

/**
 * Detects third-party scripts loaded synchronously that block FCP.
 */
export const thirdPartyBlocking = createRule({
	meta: {
		id: "fcp/third-party-blocking",
		category: "fcp",
		severity: "warning",
		description: "Third-party scripts should not block first contentful paint",
		docs: "https://speedlint.dev/rules/fcp/third-party-blocking",
		fixable: false,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!/\.(html|htm)$/.test(filePath) && !/_document\.(tsx|jsx)$/.test(filePath)) continue;

			const regex = new RegExp(SCRIPT_SRC_PATTERN.source, SCRIPT_SRC_PATTERN.flags);
			const matches = file.content.matchAll(regex);

			for (const match of matches) {
				const fullTag = match[0];
				const src = match[1] ?? "";

				// Skip if already async or defer
				if (ASYNC_DEFER_PATTERN.test(fullTag)) continue;

				// Check if it's a known third-party
				const isThirdParty = THIRD_PARTY_DOMAINS.some((domain) => src.includes(domain));
				if (!isThirdParty) continue;

				const lineNumber = file.content.substring(0, match.index).split("\n").length;
				const domain = THIRD_PARTY_DOMAINS.find((d) => src.includes(d)) ?? "unknown";

				diagnostics.push({
					ruleId: "fcp/third-party-blocking",
					severity: "warning",
					message: `Third-party script (${domain}) loaded synchronously`,
					detail:
						"Add async or defer attribute, or load via requestIdleCallback to avoid blocking FCP",
					file: filePath,
					line: lineNumber,
					impact: {
						metric: "FCP",
						estimated: "-100-500ms",
						confidence: "high",
					},
				});
			}
		}

		return diagnostics;
	},
});
