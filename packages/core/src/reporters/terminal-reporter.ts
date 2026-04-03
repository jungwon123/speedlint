import type { AnalysisReport, Diagnostic, ProjectContext, Severity } from "../types/index.js";
import type { AnalysisResult } from "../engine/analysis-engine.js";

const SEVERITY_LABELS: Record<Severity, string> = {
	error: "ERROR",
	warning: "WARNING",
	info: "INFO",
};

const SEVERITY_COLORS: Record<Severity, (text: string) => string> = {
	error: (t) => `\x1b[31m${t}\x1b[0m`,
	warning: (t) => `\x1b[33m${t}\x1b[0m`,
	info: (t) => `\x1b[36m${t}\x1b[0m`,
};

const bold = (t: string) => `\x1b[1m${t}\x1b[0m`;
const dim = (t: string) => `\x1b[2m${t}\x1b[0m`;

export interface FormatOptions {
	verbose?: boolean;
	quiet?: boolean;
}

/**
 * Formats analysis results for terminal output.
 */
export function formatTerminalReport(
	project: ProjectContext,
	result: AnalysisResult,
	options: FormatOptions = {},
): string {
	const lines: string[] = [];

	// Header
	lines.push("");
	lines.push(`  ${bold("speedlint")} ${dim("v0.1.0")} ${dim("—")} Analyzing ${project.root}`);
	lines.push("");

	// Project info
	const framework = project.framework ?? "vanilla";
	const bundler = project.bundler ?? "none";
	lines.push(`  Detected: ${framework} + ${bundler} + ${project.language}`);
	lines.push("");

	if (result.diagnostics.length === 0 && result.errors.length === 0) {
		lines.push(`  ${bold("\x1b[32m✓ No issues found!\x1b[0m")}`);
		lines.push("");
		return lines.join("\n");
	}

	// Group by severity
	const errors = result.diagnostics.filter((d) => d.severity === "error");
	const warnings = result.diagnostics.filter((d) => d.severity === "warning");
	const infos = result.diagnostics.filter((d) => d.severity === "info");

	// Errors
	if (errors.length > 0) {
		lines.push(`  ${SEVERITY_COLORS.error(bold(`ERRORS (${errors.length})`))}`);
		lines.push("");
		for (const diag of errors) {
			lines.push(...formatDiagnostic(diag, options));
		}
	}

	// Warnings (skip in quiet mode)
	if (warnings.length > 0 && !options.quiet) {
		lines.push(`  ${SEVERITY_COLORS.warning(bold(`WARNINGS (${warnings.length})`))}`);
		lines.push("");
		for (const diag of warnings) {
			lines.push(...formatDiagnostic(diag, options));
		}
	}

	// Info (only in verbose mode)
	if (infos.length > 0 && options.verbose) {
		lines.push(`  ${SEVERITY_COLORS.info(bold(`INFO (${infos.length})`))}`);
		lines.push("");
		for (const diag of infos) {
			lines.push(...formatDiagnostic(diag, options));
		}
	}

	// Rule execution errors
	if (result.errors.length > 0 && options.verbose) {
		lines.push(`  ${dim(`RULE ERRORS (${result.errors.length})`)}`);
		for (const err of result.errors) {
			lines.push(`    ${dim(err.ruleId)}: ${err.error}`);
		}
		lines.push("");
	}

	// Summary
	lines.push(`  ${"─".repeat(40)}`);
	const fixable = result.diagnostics.filter((d) => d.fix).length;
	const parts: string[] = [];
	if (errors.length > 0) parts.push(SEVERITY_COLORS.error(`${errors.length} errors`));
	if (warnings.length > 0) parts.push(SEVERITY_COLORS.warning(`${warnings.length} warnings`));
	if (infos.length > 0) parts.push(SEVERITY_COLORS.info(`${infos.length} info`));
	lines.push(`  ${parts.join(" | ")}${fixable > 0 ? ` | ${bold(`${fixable} fixable`)}` : ""}`);

	// Estimated savings
	const savings = estimateSavings(result.diagnostics);
	if (savings.length > 0) {
		lines.push(`  Estimated savings: ${savings.join(", ")}`);
	}

	if (fixable > 0) {
		lines.push(`  Run ${bold("speedlint fix")} to auto-fix ${fixable} issues`);
	}

	lines.push("");
	return lines.join("\n");
}

/**
 * Formats analysis results as JSON.
 */
export function formatJsonReport(
	project: ProjectContext,
	result: AnalysisResult,
): string {
	const errors = result.diagnostics.filter((d) => d.severity === "error").length;
	const warnings = result.diagnostics.filter((d) => d.severity === "warning").length;
	const infos = result.diagnostics.filter((d) => d.severity === "info").length;
	const fixable = result.diagnostics.filter((d) => d.fix).length;

	const report: AnalysisReport = {
		project: {
			root: project.root,
			framework: project.framework,
			bundler: project.bundler,
		},
		diagnostics: result.diagnostics.map((d) => ({
			ruleId: d.ruleId,
			severity: d.severity,
			message: d.message,
			detail: d.detail,
			file: d.file,
			line: d.line,
			impact: d.impact,
		})),
		summary: {
			errors,
			warnings,
			infos,
			fixable,
			estimatedSavings: {},
		},
		timestamp: new Date().toISOString(),
	};

	return JSON.stringify(report, null, 2);
}

function formatDiagnostic(diag: Diagnostic, options: FormatOptions): string[] {
	const lines: string[] = [];
	const color = SEVERITY_COLORS[diag.severity];
	const label = SEVERITY_LABELS[diag.severity];

	const location = diag.file
		? `${diag.file}${diag.line ? `:${diag.line}` : ""}`
		: "";

	lines.push(`  ${color(label)} ${bold(diag.ruleId)}`);
	if (location) {
		lines.push(`    ${dim(location)}`);
	}
	lines.push(`    ${diag.message}`);

	if (options.verbose && diag.detail) {
		lines.push(`    ${dim(diag.detail)}`);
	}

	if (diag.impact) {
		lines.push(
			`    Impact: ${diag.impact.metric} ${diag.impact.estimated} ${dim(`(${diag.impact.confidence} confidence)`)}`,
		);
	}

	if (diag.fix) {
		lines.push(`    ${dim("Fix available: --fix")}`);
	}

	lines.push("");
	return lines;
}

function estimateSavings(diagnostics: Diagnostic[]): string[] {
	const savings: string[] = [];
	const byMetric = new Map<string, string[]>();

	for (const diag of diagnostics) {
		if (!diag.impact) continue;
		const existing = byMetric.get(diag.impact.metric) ?? [];
		existing.push(diag.impact.estimated);
		byMetric.set(diag.impact.metric, existing);
	}

	for (const [metric, estimates] of byMetric) {
		savings.push(`~${estimates.join(", ")} ${metric}`);
	}

	return savings;
}
