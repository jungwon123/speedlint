import { cac } from "cac";

const cli = cac("speedlint");

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
	.option("--no-cache", "Disable incremental cache")
	.option("--max-warnings <n>", "Exit with error if warnings exceed threshold")
	.action(async (path: string | undefined, options: Record<string, unknown>) => {
		console.log("speedlint: analyzing...", { path: path ?? ".", options });
		// TODO: implement analyze command
	});

cli
	.command("fix [path]", "Auto-fix performance issues with preview")
	.option("-c, --config <path>", "Path to config file")
	.option("--category <cat>", "Filter by category")
	.action(async (path: string | undefined, options: Record<string, unknown>) => {
		console.log("speedlint fix:", { path: path ?? ".", options });
		// TODO: implement fix command
	});

cli
	.command("init", "Generate speedlint.config.ts")
	.action(async () => {
		console.log("speedlint init: generating config...");
		// TODO: implement init command
	});

cli
	.command("rules", "List all available rules")
	.option("--category <cat>", "Filter by category")
	.action(async (options: Record<string, unknown>) => {
		console.log("speedlint rules:", options);
		// TODO: implement rules command
	});

cli
	.command("doctor", "Check installation and project compatibility")
	.action(async () => {
		console.log("speedlint doctor: checking...");
		// TODO: implement doctor command
	});

cli.help();
cli.version("0.0.0");

cli.parse();
