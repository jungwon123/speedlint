import type { SpeedlintPlugin } from "@speedlint/core";
import { missingLazyLoad } from "./rules/missing-lazy-load.js";
import { noAnonymousDefaultExport } from "./rules/no-anonymous-default-export.js";
import { noInlineStylesInRender } from "./rules/no-inline-styles-in-render.js";

const pluginReact: SpeedlintPlugin = {
	name: "@speedlint/plugin-react",
	rules: [missingLazyLoad, noInlineStylesInRender, noAnonymousDefaultExport],
	configs: {
		recommended: [
			{ rule: "react/missing-lazy-load", severity: "warning" },
			{ rule: "react/no-inline-styles-in-render", severity: "warning" },
			{ rule: "react/no-anonymous-default-export", severity: "warning" },
		],
	},
};

export default pluginReact;
export { missingLazyLoad, noInlineStylesInRender, noAnonymousDefaultExport };
