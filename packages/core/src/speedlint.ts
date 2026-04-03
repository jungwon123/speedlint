import { scanProject } from "./analyzers/project-scanner.js";
import { runAnalysis } from "./engine/analysis-engine.js";
import type { AnalysisResult } from "./engine/analysis-engine.js";
import { builtInPlugin } from "./engine/built-in-plugin.js";
import { resolveRules, filterByCategory, filterBySeverity } from "./engine/rule-resolver.js";
import { applyFixes } from "./fixers/fix-engine.js";
import type { FixResult, FixOptions } from "./fixers/fix-engine.js";
import type { ProjectContext, RuleCategory, Severity, SpeedlintConfig } from "./types/index.js";

export interface SpeedlintOptions {
	root?: string;
	config?: SpeedlintConfig;
	category?: RuleCategory;
	severity?: Severity;
}

export interface SpeedlintAnalyzeResult {
	project: ProjectContext;
	analysis: AnalysisResult;
}

/**
 * Main entry point for programmatic usage.
 */
export function analyze(options: SpeedlintOptions = {}): SpeedlintAnalyzeResult {
	const root = options.root ?? process.cwd();
	const config = options.config ?? { plugins: [builtInPlugin] };

	// Ensure built-in plugin is included if no plugins specified
	if (!config.plugins || config.plugins.length === 0) {
		config.plugins = [builtInPlugin];
	}

	const project = scanProject(root);
	let rules = resolveRules({ config, project });

	if (options.category) {
		rules = filterByCategory(rules, options.category);
	}
	if (options.severity) {
		rules = filterBySeverity(rules, options.severity);
	}

	const analysis = runAnalysis(project, rules);

	return { project, analysis };
}

/**
 * Analyze and auto-fix in one call.
 */
export function fix(
	options: SpeedlintOptions = {},
	fixOptions: FixOptions = {},
): { analyzeResult: SpeedlintAnalyzeResult; fixResult: FixResult } {
	const analyzeResult = analyze(options);
	const root = options.root ?? process.cwd();

	const fixResult = applyFixes(root, analyzeResult.analysis.diagnostics, fixOptions);

	return { analyzeResult, fixResult };
}
