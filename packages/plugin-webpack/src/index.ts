import type { SpeedlintPlugin } from "@speedlint/core";
import { missingSplitChunks } from "./rules/missing-splitchunks.js";
import { missingCompression } from "./rules/missing-compression.js";

const pluginWebpack: SpeedlintPlugin = {
	name: "@speedlint/plugin-webpack",
	rules: [missingSplitChunks, missingCompression],
	configs: {
		recommended: [
			{ rule: "webpack/missing-splitchunks", severity: "warning" },
			{ rule: "webpack/missing-compression", severity: "info" },
		],
	},
};

export default pluginWebpack;
export { missingSplitChunks, missingCompression };
