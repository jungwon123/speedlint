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
