import type { SpeedlintPlugin } from "@speedlint/core";
import { missingBuildTarget } from "./rules/missing-build-target.js";
import { missingManualChunks } from "./rules/missing-manual-chunks.js";

const pluginVite: SpeedlintPlugin = {
	name: "@speedlint/plugin-vite",
	rules: [missingBuildTarget, missingManualChunks],
	configs: {
		recommended: [
			{ rule: "vite/missing-build-target", severity: "info" },
			{ rule: "vite/missing-manual-chunks", severity: "info" },
		],
	},
};

export default pluginVite;
export { missingBuildTarget, missingManualChunks };
