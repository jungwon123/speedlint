import {
	analyze,
	builtInPlugin,
	fix,
	formatBenchmarkReport,
	formatJsonReport,
	formatTerminalReport,
	runBenchmark,
	watchProject,
} from "@speedlint/core";
import type { RuleCategory, Severity } from "@speedlint/core";
import { cac } from "cac";

const cli = cac("speedlint");

cli
	.command("benchmark <url>", "Measure real performance with Lighthouse")
	.option("--runs <n>", "Number of runs to average", { default: 1 })
	.option("--device <device>", "Device: mobile, desktop", { default: "mobile" })
	.option("--json", "Output as JSON")
	.action(async (url: string, options: Record<string, unknown>) => {
		const runs = Number(options.runs) || 1;
		const device =
			(options.device as string) === "desktop" ? ("desktop" as const) : ("mobile" as const);

		console.log("\n  Launching headless Chrome...");
		console.log(`  Measuring ${url} (${device}, ${runs} run${runs > 1 ? "s" : ""})...\n`);

		try {
			const result = await runBenchmark({ url, runs, device });

			if (options.json) {
				console.log(JSON.stringify(result, null, 2));
			} else {
				console.log(formatBenchmarkReport(result));
			}
		} catch (err) {
			console.error(`  Error: ${err instanceof Error ? err.message : String(err)}`);
			console.error("  Make sure Chrome is installed on this machine.\n");
			process.exit(1);
		}
	});

cli
	.command("[path]", "Analyze project for performance issues")
	.alias("analyze")
	.option("--fix", "Auto-fix performance issues")
	.option("--fix-dry-run", "Show what fixes would be applied")
	.option("-c, --config <path>", "Path to config file")
	.option("--category <cat>", "Filter by category: bundle, lcp, cls, fcp, tbt, general")
	.option("--severity <level>", "Minimum severity: error, warning, info")
	.option("-f, --format <fmt>", "Output format: terminal, json", { default: "terminal" })
	.option("-q, --quiet", "Only show errors")
	.option("-v, --verbose", "Show detailed analysis")
	.option("--max-warnings <n>", "Exit with error if warnings exceed threshold")
	.option("-w, --watch", "Watch mode — re-analyze on file changes")
	.action(async (path: string | undefined, options: Record<string, unknown>) => {
		const root = path ?? process.cwd();
		const category = options.category as RuleCategory | undefined;
		const severity = options.severity as Severity | undefined;

		if (options.fix || options.fixDryRun) {
			const { analyzeResult, fixResult } = fix(
				{ root, category, severity },
				{ dryRun: !!options.fixDryRun },
			);

			// Show analysis report
			const report =
				options.format === "json"
					? formatJsonReport(analyzeResult.project, analyzeResult.analysis)
					: formatTerminalReport(analyzeResult.project, analyzeResult.analysis, {
							verbose: !!options.verbose,
							quiet: !!options.quiet,
						});
			console.log(report);

			// Show fix results
			if (fixResult.applied.length > 0) {
				console.log(options.fixDryRun ? "  Fixes that would be applied:" : "  Applied fixes:");
				for (const f of fixResult.applied) {
					console.log(`    ${f.ruleId} → ${f.filePath}`);
					if (options.verbose) {
						console.log(f.diff);
					}
				}
				console.log(
					`\n  ${fixResult.applied.length} fix(es) ${options.fixDryRun ? "available" : "applied"}.`,
				);
			}

			if (fixResult.skipped.length > 0 && options.verbose) {
				console.log("\n  Skipped fixes:");
				for (const s of fixResult.skipped) {
					console.log(`    ${s.ruleId}: ${s.reason}`);
				}
			}

			exitWithCode(analyzeResult.analysis.diagnostics, options);
		} else {
			const runAnalysis = () => {
				const result = analyze({ root, category, severity });
				const report =
					options.format === "json"
						? formatJsonReport(result.project, result.analysis)
						: formatTerminalReport(result.project, result.analysis, {
								verbose: !!options.verbose,
								quiet: !!options.quiet,
							});
				console.log(report);
				return result;
			};

			const result = runAnalysis();

			if (options.watch) {
				console.log("  \x1b[2mWatching for changes... (Ctrl+C to stop)\x1b[0m\n");
				watchProject({
					root,
					onChange: (filePath) => {
						console.clear();
						console.log(`  \x1b[2mChanged: ${filePath}\x1b[0m\n`);
						runAnalysis();
						console.log("  \x1b[2mWatching for changes... (Ctrl+C to stop)\x1b[0m\n");
					},
				});
			} else {
				exitWithCode(result.analysis.diagnostics, options);
			}
		}
	});

cli
	.command("fix [path]", "Auto-fix performance issues with preview")
	.option("-c, --config <path>", "Path to config file")
	.option("--category <cat>", "Filter by category")
	.option("--dry-run", "Show what fixes would be applied without applying")
	.option("-v, --verbose", "Show detailed diffs")
	.action(async (path: string | undefined, options: Record<string, unknown>) => {
		const root = path ?? process.cwd();
		const category = options.category as RuleCategory | undefined;

		const { analyzeResult, fixResult } = fix({ root, category }, { dryRun: !!options.dryRun });

		const report = formatTerminalReport(analyzeResult.project, analyzeResult.analysis);
		console.log(report);

		if (fixResult.applied.length > 0) {
			console.log(options.dryRun ? "\n  Fix preview:" : "\n  Applied fixes:");
			for (const f of fixResult.applied) {
				console.log(`    ${f.ruleId} → ${f.filePath}`);
				if (options.verbose) {
					console.log(f.diff);
				}
			}
			console.log(
				`\n  ${fixResult.applied.length} fix(es) ${options.dryRun ? "available" : "applied"}.`,
			);
		} else {
			console.log("\n  No fixable issues found.");
		}
	});

cli.command("init", "Generate speedlint.config.ts").action(async () => {
	const configContent = `import { defineConfig } from "@speedlint/core";

export default defineConfig({
  rules: {
    "bundle/barrel-file-reexport": "error",
    "bundle/heavy-dependency": "warning",
    "bundle/unused-dependency": "warning",
    "bundle/dynamic-import-candidate": "warning",
    "lcp/missing-image-priority": "error",
    "lcp/missing-preload": "warning",
    "lcp/render-blocking-resources": "error",
    "cls/missing-image-dimensions": "error",
    "cls/missing-video-dimensions": "warning",
    "fcp/third-party-blocking": "warning",
    "tbt/long-task-sync-operations": "warning",
    "general/passive-event-listeners": "warning",
  },
  ignore: [
    "node_modules",
    "dist",
    "build",
    ".next",
    "**/*.test.{ts,tsx}",
    "**/*.spec.{ts,tsx}",
  ],
});
`;
	const { writeFileSync } = await import("node:fs");
	const { join } = await import("node:path");
	const configPath = join(process.cwd(), "speedlint.config.ts");
	writeFileSync(configPath, configContent, "utf-8");
	console.log(`  Created ${configPath}`);
});

cli
	.command("rules", "List all available rules")
	.option("--category <cat>", "Filter by category")
	.action(async (options: Record<string, unknown>) => {
		const category = options.category as string | undefined;

		console.log("\n  speedlint rules\n");
		for (const rule of builtInPlugin.rules) {
			if (category && rule.meta.category !== category) continue;
			const fixBadge = rule.meta.fixable ? " [fixable]" : "";
			console.log(
				`  ${rule.meta.severity.padEnd(7)} ${rule.meta.id.padEnd(40)} ${rule.meta.description}${fixBadge}`,
			);
		}
		console.log(`\n  ${builtInPlugin.rules.length} rules total\n`);
	});

cli.command("doctor", "Check installation and project compatibility").action(async () => {
	console.log("\n  speedlint doctor\n");
	try {
		const result = analyze({ root: process.cwd() });
		console.log(`  Project: ${result.project.root}`);
		console.log(`  Framework: ${result.project.framework ?? "vanilla"}`);
		console.log(`  Bundler: ${result.project.bundler ?? "none"}`);
		console.log(`  Language: ${result.project.language}`);
		console.log(`  Module: ${result.project.moduleSystem}`);
		console.log(`  Config files: ${result.project.configFiles.size}`);
		console.log("\n  ✓ speedlint is working correctly\n");
	} catch (err) {
		console.error(`  ✗ ${err instanceof Error ? err.message : String(err)}\n`);
		process.exit(1);
	}
});

cli.help();
cli.version("0.1.0");

cli.parse();

function exitWithCode(
	diagnostics: Array<{ severity: string }>,
	options: Record<string, unknown>,
): void {
	const errors = diagnostics.filter((d) => d.severity === "error").length;
	const warnings = diagnostics.filter((d) => d.severity === "warning").length;

	if (errors > 0) {
		process.exit(1);
	}

	const maxWarnings = Number(options.maxWarnings);
	if (!Number.isNaN(maxWarnings) && warnings > maxWarnings) {
		process.exit(1);
	}
}
