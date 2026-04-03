// Types
export type {
	AnalysisConfig,
	AnalysisReport,
	Bundler,
	DepGraph,
	DepImport,
	DepNode,
	Diagnostic,
	FileEntry,
	FileMap,
	FixConfig,
	FixContext,
	Framework,
	Impact,
	MetricType,
	PackageJson,
	Position,
	ProjectContext,
	ReportSummary,
	Rule,
	RuleCategory,
	RuleConfig,
	RuleContext,
	RuleMeta,
	Severity,
	SpeedlintConfig,
	SpeedlintPlugin,
	Transform,
	TransformType,
} from "./types/index.js";

// Engine
export { createRule } from "./engine/create-rule.js";
export { resolveRules, filterByCategory, filterBySeverity } from "./engine/rule-resolver.js";
export type { ResolvedRule } from "./engine/rule-resolver.js";
export { runAnalysis } from "./engine/analysis-engine.js";
export type { AnalysisResult, RuleExecutionError } from "./engine/analysis-engine.js";

// Config
export { defineConfig } from "./config/define-config.js";

// Analyzers
export { scanProject, SpeedlintScanError } from "./analyzers/project-scanner.js";

// Reporters
export { formatTerminalReport, formatJsonReport } from "./reporters/terminal-reporter.js";
export type { FormatOptions } from "./reporters/terminal-reporter.js";

// Rules — Bundle
export { barrelFileReexport } from "./rules/bundle/barrel-file-reexport.js";
export { heavyDependency } from "./rules/bundle/heavy-dependency.js";
export { unusedDependency } from "./rules/bundle/unused-dependency.js";
export { dynamicImportCandidate } from "./rules/bundle/dynamic-import-candidate.js";

// Rules — LCP
export { missingImagePriority } from "./rules/lcp/missing-image-priority.js";
export { missingPreload } from "./rules/lcp/missing-preload.js";
export { renderBlockingResources } from "./rules/lcp/render-blocking-resources.js";

// Rules — CLS
export { missingImageDimensions } from "./rules/cls/missing-image-dimensions.js";
export { missingVideoDimensions } from "./rules/cls/missing-video-dimensions.js";

// Rules — FCP
export { thirdPartyBlocking } from "./rules/fcp/third-party-blocking.js";

// Rules — TBT
export { longTaskSyncOperations } from "./rules/tbt/long-task-sync-operations.js";

// Rules — General
export { passiveEventListeners } from "./rules/general/passive-event-listeners.js";
