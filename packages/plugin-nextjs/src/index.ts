import type { SpeedlintPlugin } from "@speedlint/core";
import { useNextImage } from "./rules/use-next-image.js";
import { noHeadElement } from "./rules/no-head-element.js";
import { noSyncDynamicUsage } from "./rules/no-sync-dynamic-usage.js";

const pluginNextjs: SpeedlintPlugin = {
	name: "@speedlint/plugin-nextjs",
	rules: [useNextImage, noHeadElement, noSyncDynamicUsage],
	configs: {
		recommended: [
			{ rule: "nextjs/use-next-image", severity: "warning" },
			{ rule: "nextjs/no-head-element", severity: "error" },
			{ rule: "nextjs/no-sync-dynamic-usage", severity: "info" },
		],
	},
};

export default pluginNextjs;
export { useNextImage, noHeadElement, noSyncDynamicUsage };
