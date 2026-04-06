import type { SpeedlintPlugin } from "../types/index.js";

// Bundle rules
import { barrelFileReexport } from "../rules/bundle/barrel-file-reexport.js";
import { dynamicImportCandidate } from "../rules/bundle/dynamic-import-candidate.js";
import { heavyDependency } from "../rules/bundle/heavy-dependency.js";
import { unusedDependency } from "../rules/bundle/unused-dependency.js";

// LCP rules
import { missingImagePriority } from "../rules/lcp/missing-image-priority.js";
import { missingPreload } from "../rules/lcp/missing-preload.js";
import { renderBlockingResources } from "../rules/lcp/render-blocking-resources.js";

// CLS rules
import { missingImageDimensions } from "../rules/cls/missing-image-dimensions.js";
import { missingVideoDimensions } from "../rules/cls/missing-video-dimensions.js";

// FCP rules
import { thirdPartyBlocking } from "../rules/fcp/third-party-blocking.js";

// TBT rules
import { longTaskSyncOperations } from "../rules/tbt/long-task-sync-operations.js";

// General rules
import { passiveEventListeners } from "../rules/general/passive-event-listeners.js";

/**
 * Built-in plugin with all MVP rules.
 */
export const builtInPlugin: SpeedlintPlugin = {
	name: "@speedlint/built-in",
	rules: [
		barrelFileReexport,
		heavyDependency,
		unusedDependency,
		dynamicImportCandidate,
		missingImagePriority,
		missingPreload,
		renderBlockingResources,
		missingImageDimensions,
		missingVideoDimensions,
		thirdPartyBlocking,
		longTaskSyncOperations,
		passiveEventListeners,
	],
	configs: {
		recommended: [
			{ rule: "bundle/barrel-file-reexport", severity: "error" },
			{ rule: "bundle/heavy-dependency", severity: "warning" },
			{ rule: "bundle/unused-dependency", severity: "warning" },
			{ rule: "bundle/dynamic-import-candidate", severity: "warning" },
			{ rule: "lcp/missing-image-priority", severity: "error" },
			{ rule: "lcp/missing-preload", severity: "warning" },
			{ rule: "lcp/render-blocking-resources", severity: "error" },
			{ rule: "cls/missing-image-dimensions", severity: "error" },
			{ rule: "cls/missing-video-dimensions", severity: "warning" },
			{ rule: "fcp/third-party-blocking", severity: "warning" },
			{ rule: "tbt/long-task-sync-operations", severity: "warning" },
			{ rule: "general/passive-event-listeners", severity: "warning" },
		],
	},
};
