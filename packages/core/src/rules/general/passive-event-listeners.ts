import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext, Transform } from "../../types/index.js";

const ADD_LISTENER_PATTERN =
	/addEventListener\s*\(\s*['"](\w+)['"]\s*,\s*[^,)]+(?:,\s*(\{[^}]*\}|true|false))?\s*\)/g;
const PASSIVE_EVENTS = new Set(["scroll", "touchstart", "touchmove", "wheel", "mousewheel"]);
const PASSIVE_PATTERN = /passive\s*:\s*true/;

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
				if (PASSIVE_PATTERN.test(options)) continue;

				const matchIndex = match.index ?? 0;
				const lineNumber = file.content.substring(0, matchIndex).split("\n").length;

				const fixFilePath = filePath;
				const fixContent = file.content;
				const fixMatchIndex = matchIndex;
				const fixMatchStr = match[0];
				const fixOptions = options;

				diagnostics.push({
					ruleId: "general/passive-event-listeners",
					severity: "warning",
					message: `'${eventName}' listener missing { passive: true }`,
					detail:
						"Non-passive scroll/touch listeners block the compositor thread, causing janky scrolling",
					file: filePath,
					line: lineNumber,
					impact: {
						metric: "TBT",
						estimated: "improves scroll responsiveness",
						confidence: "high",
					},
					fix: (): Transform[] => {
						let newStr: string;
						if (!fixOptions) {
							// No third arg: add { passive: true }
							newStr = fixMatchStr.replace(/\)\s*$/, ", { passive: true })");
						} else if (fixOptions.startsWith("{")) {
							// Has object options: add passive to it
							newStr = fixMatchStr.replace(
								fixOptions,
								fixOptions.replace("{", "{ passive: true, "),
							);
						} else {
							// Has boolean (useCapture): replace with object
							newStr = fixMatchStr.replace(fixOptions, `{ passive: true, capture: ${fixOptions} }`);
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
									end: { line, column: col + fixMatchStr.length },
								},
								newText: newStr,
							},
						];
					},
				});
			}
		}

		return diagnostics;
	},
});
