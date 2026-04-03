import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext } from "../../types/index.js";

const ADD_LISTENER_PATTERN = /addEventListener\s*\(\s*['"](\w+)['"]\s*,\s*[^,)]+(?:,\s*(\{[^}]*\}|true|false))?\s*\)/g;
const PASSIVE_EVENTS = new Set(["scroll", "touchstart", "touchmove", "wheel", "mousewheel"]);
const PASSIVE_PATTERN = /passive\s*:\s*true/;

/**
 * Detects addEventListener for scroll/touch events without { passive: true }.
 */
export const passiveEventListeners = createRule({
	meta: {
		id: "general/passive-event-listeners",
		category: "general",
		severity: "warning",
		description: "Scroll and touch event listeners should use { passive: true }",
		docs: "https://speedlint.dev/rules/general/passive-event-listeners",
		fixable: true,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		for (const [filePath, file] of context.files) {
			if (!/\.(ts|tsx|js|jsx|mjs)$/.test(filePath)) continue;

			const regex = new RegExp(ADD_LISTENER_PATTERN.source, ADD_LISTENER_PATTERN.flags);
			const matches = file.content.matchAll(regex);

			for (const match of matches) {
				const eventName = match[1] ?? "";
				if (!PASSIVE_EVENTS.has(eventName)) continue;

				const options = match[2] ?? "";

				// Skip if already passive
				if (PASSIVE_PATTERN.test(options)) continue;

				const lineNumber = file.content.substring(0, match.index).split("\n").length;

				diagnostics.push({
					ruleId: "general/passive-event-listeners",
					severity: "warning",
					message: `'${eventName}' listener missing { passive: true }`,
					detail: "Non-passive scroll/touch listeners block the compositor thread, causing janky scrolling",
					file: filePath,
					line: lineNumber,
					impact: {
						metric: "TBT",
						estimated: "improves scroll responsiveness",
						confidence: "high",
					},
				});
			}
		}

		return diagnostics;
	},
});
