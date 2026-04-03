import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import type {
	DepGraph,
	Diagnostic,
	FileMap,
	ProjectContext,
	RuleContext,
} from "../types/index.js";
import type { ResolvedRule } from "./rule-resolver.js";

const DEFAULT_TIMEOUT_MS = 10_000;

const SOURCE_EXTENSIONS = new Set([
	".ts",
	".tsx",
	".js",
	".jsx",
	".mjs",
	".cjs",
	".html",
	".vue",
	".svelte",
	".css",
]);

const IGNORE_DIRS = [
	"node_modules",
	"dist",
	"build",
	".next",
	".nuxt",
	".svelte-kit",
	"coverage",
	".turbo",
];

export interface AnalysisResult {
	diagnostics: Diagnostic[];
	errors: RuleExecutionError[];
}

export interface RuleExecutionError {
	ruleId: string;
	error: string;
}

/**
 * Runs all resolved rules against the project and collects diagnostics.
 */
export function runAnalysis(
	project: ProjectContext,
	rules: ResolvedRule[],
	timeoutMs: number = DEFAULT_TIMEOUT_MS,
): AnalysisResult {
	const files = loadSourceFiles(project.root);
	const diagnostics: Diagnostic[] = [];
	const errors: RuleExecutionError[] = [];

	for (const { rule, severity } of rules) {
		try {
			const context = createRuleContext(project, files);
			const reported: Diagnostic[] = [];

			// Override report to collect diagnostics
			context.report = (diagnostic: Diagnostic) => {
				reported.push({ ...diagnostic, severity });
			};

			const result = withTimeout(() => rule.detect(context), timeoutMs);

			// Collect diagnostics from both return value and report()
			for (const diag of result) {
				diagnostics.push({ ...diag, severity });
			}
			for (const diag of reported) {
				diagnostics.push(diag);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			errors.push({ ruleId: rule.meta.id, error: message });
		}
	}

	// Sort: errors first, then warnings, then info
	const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2 };
	diagnostics.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

	return { diagnostics, errors };
}

function createRuleContext(project: ProjectContext, files: FileMap): RuleContext {
	return {
		project,
		files,
		getAST(_filePath: string): unknown {
			// TODO: implement AST parsing with SWC
			throw new Error("AST parsing not yet implemented");
		},
		getDependencyGraph(): DepGraph {
			// TODO: implement dependency graph construction
			return { nodes: new Map() };
		},
		getConfig(_name: string): unknown {
			// TODO: implement config reading
			return undefined;
		},
		report(_diagnostic: Diagnostic): void {
			// Will be overridden per-rule execution
		},
	};
}

function loadSourceFiles(root: string): FileMap {
	const files: FileMap = new Map();
	walkDir(root, root, files);
	return files;
}

function walkDir(dir: string, root: string, files: FileMap): void {
	let entries: string[];
	try {
		entries = readdirSync(dir);
	} catch {
		return;
	}

	for (const name of entries) {
		if (IGNORE_DIRS.includes(name)) continue;

		const fullPath = join(dir, name);
		try {
			const stat = statSync(fullPath);
			if (stat.isDirectory()) {
				walkDir(fullPath, root, files);
			} else if (SOURCE_EXTENSIONS.has(extname(name))) {
				const relPath = relative(root, fullPath);
				files.set(relPath, {
					content: readFileSync(fullPath, "utf-8"),
					mtime: stat.mtimeMs,
				});
			}
		} catch {
			// Skip unreadable entries
		}
	}
}

function withTimeout<T>(fn: () => T, timeoutMs: number): T {
	// For synchronous rules, we can't truly timeout, but we record the constraint
	// TODO: consider worker_threads for true timeout support
	const start = performance.now();
	const result = fn();
	const elapsed = performance.now() - start;

	if (elapsed > timeoutMs) {
		throw new Error(`Rule execution exceeded timeout of ${timeoutMs}ms (took ${Math.round(elapsed)}ms)`);
	}

	return result;
}
