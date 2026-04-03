import type { SpeedlintPlugin } from "@speedlint/core";
import { noVHtml } from "./rules/no-v-html.js";
import { asyncComponentLoading } from "./rules/async-component-loading.js";

const pluginVue: SpeedlintPlugin = {
	name: "@speedlint/plugin-vue",
	rules: [noVHtml, asyncComponentLoading],
	configs: {
		recommended: [
			{ rule: "vue/no-v-html", severity: "warning" },
			{ rule: "vue/async-component-loading", severity: "warning" },
		],
	},
};

export default pluginVue;
export { noVHtml, asyncComponentLoading };
